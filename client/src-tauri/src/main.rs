// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// LarryAgent 客户端 — Tauri 壳
//
// 职责：
// - 启动时拉起 Python 后端（uvicorn main:app，监听 127.0.0.1:8000）
// - 健康检查（带签名校验，防端口被其他服务假阳性占用）
// - dev mode：后端已在跑则复用，不重复 spawn（方便开发时单独跑 uvicorn + npm run dev）
// - 窗口关闭时 kill 自己 spawn 的子进程（不误杀用户手动起的后端）
// - 暴露 restart_agent IPC 命令（P4.5 改 config 后重启后端用）
// - 崩溃感知：周期性 health check，状态变化时 emit "backend-status" 事件给前端

use std::io::{Read, Write};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{Emitter, Manager, WindowEvent};

// 后端连接参数（与 backend/main.py 的 uvicorn 启动参数一致）
const BACKEND_HOST: &str = "127.0.0.1";
const BACKEND_PORT: u16 = 8000;
const HEALTH_PATH: &str = "/health";

// 健康检查参数
const HEALTH_TIMEOUT_MS: u64 = 30_000;
const POLL_INTERVAL_MS: u64 = 500;
const CRASH_WATCHER_INTERVAL_SEC: u64 = 5;

// ====================================================================
// AgentProcess state
// ====================================================================

/// 持有 Agent 子进程句柄。
///
/// `Option<Child>` = None 表示后端是 dev mode 复用的（非我们 spawn 的，不 kill）；
/// Some(child) 表示是我们 spawn 的，关闭时需要 kill。
struct AgentProcess(Mutex<Option<Child>>);

impl AgentProcess {
    /// 存入新 child（会先 kill 旧的）
    fn set(&self, child: Child) {
        let mut guard = self.0.lock().unwrap();
        if let Some(ref mut old) = *guard {
            let _ = old.kill();
            let _ = old.wait();
        }
        *guard = Some(child);
    }

    /// kill 并清空（仅在 child 是我们 spawn 的情况下）
    fn kill_if_owned(&self) {
        let mut guard = self.0.lock().unwrap();
        if let Some(ref mut child) = *guard {
            let _ = child.kill();
            let _ = child.wait();
        }
        *guard = None;
    }
}

// ====================================================================
// Python 探测 + uvicorn 启动
// ====================================================================

/// backend 目录绝对路径（编译期从 CARGO_MANIFEST_DIR 推导，不依赖 working directory）
///
/// CARGO_MANIFEST_DIR = client/src-tauri
/// backend 在 <项目根>/backend = manifest/../../backend
fn backend_dir() -> PathBuf {
    let manifest = env!("CARGO_MANIFEST_DIR");
    Path::new(manifest)
        .parent() // client/
        .expect("invalid manifest dir")
        .parent() // 项目根
        .expect("invalid manifest dir")
        .join("backend")
}

/// 探测 Python 3。
///
/// 先试 `python`（通用），失败再试 `py -3`（Windows 官方 launcher）。
/// Windows Store stub 的 `python --version` 会返回非零退出码或无输出，会被过滤掉。
///
/// 返回可用的 python 命令名（"python" 或 "py"），供 spawn 时使用。
fn check_python() -> Result<String, String> {
    // 先试 python
    if let Ok(out) = Command::new("python").arg("--version").output() {
        if out.status.success() {
            let ver = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if ver.starts_with("Python 3.") {
                return Ok("python".to_string());
            }
        }
    }
    // 再试 py -3（Windows 官方 launcher）
    if let Ok(out) = Command::new("py").args(["-3", "--version"]).output() {
        if out.status.success() {
            let ver = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if ver.starts_with("Python 3.") {
                return Ok("py".to_string());
            }
        }
    }
    Err("未找到可用的 Python 3，请安装 Python 3.11+ 并加入 PATH".into())
}

/// spawn uvicorn 进程，返回 child 句柄
fn spawn_agent() -> Result<Child, String> {
    let python = check_python()?;
    let backend = backend_dir();
    let child = Command::new(&python)
        .args([
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
        ])
        .current_dir(&backend)
        // 不继承 stdio（避免子进程输出干扰 Tauri 控制台）
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("启动 uvicorn 失败: {e}"))?;
    Ok(child)
}

// ====================================================================
// 健康检查（手动 HTTP，零依赖）
// ====================================================================

/// 同步 HTTP GET /health，返回解析后的 JSON。
///
/// 用 std::net::TcpStream 手动发 HTTP 请求，避免引入 reqwest 依赖（编译更快）。
/// /health 响应体很短（< 100 字节），无 chunked encoding，手动解析足够。
fn health_get() -> Result<serde_json::Value, String> {
    let mut stream = TcpStream::connect((BACKEND_HOST, BACKEND_PORT))
        .map_err(|e| format!("connect: {e}"))?;
    stream
        .set_read_timeout(Some(Duration::from_millis(2000)))
        .ok();
    let req = format!(
        "GET {} HTTP/1.1\r\nHost: {}\r\nConnection: close\r\n\r\n",
        HEALTH_PATH, BACKEND_HOST
    );
    stream
        .write_all(req.as_bytes())
        .map_err(|e| format!("write: {e}"))?;
    let mut buf = Vec::new();
    stream
        .read_to_end(&mut buf)
        .map_err(|e| format!("read: {e}"))?;
    let resp = String::from_utf8_lossy(&buf);

    // 检查 HTTP 状态行（如 "HTTP/1.1 200 OK"）
    let first_line = resp.lines().next().unwrap_or("");
    if !first_line.contains(" 200 ") {
        return Err(format!("HTTP 非 200: {first_line}"));
    }

    // 取 body（\r\n\r\n 之后）
    let body = resp.split("\r\n\r\n").nth(1).unwrap_or("").trim();
    let v: serde_json::Value =
        serde_json::from_str(body).map_err(|e| format!("JSON 解析失败: {e}"))?;
    Ok(v)
}

/// 签名校验：响应含 version 字段（防 8000 被其他服务占用导致假阳性）
fn health_signature_ok(v: &serde_json::Value) -> bool {
    v.get("version").is_some()
}

/// 轮询健康检查，带签名校验。超时返回错误。
fn wait_for_health() -> Result<(), String> {
    let start = Instant::now();
    loop {
        if start.elapsed().as_millis() as u64 > HEALTH_TIMEOUT_MS {
            return Err(format!("后端启动超时（{HEALTH_TIMEOUT_MS}ms）"));
        }
        match health_get() {
            Ok(v) if health_signature_ok(&v) => return Ok(()),
            _ => std::thread::sleep(Duration::from_millis(POLL_INTERVAL_MS)),
        }
    }
}

// ====================================================================
// dev mode：后端已在跑则复用
// ====================================================================

/// 确保后端在跑。
///
/// 返回 `Some(child)` 表示我们 spawn 了新进程；
/// 返回 `None` 表示后端已在跑（dev mode 复用，不 kill）。
fn ensure_backend() -> Result<Option<Child>, String> {
    // 先 health check，已跑且签名校验通过 → 复用
    if let Ok(v) = health_get() {
        if health_signature_ok(&v) {
            return Ok(None);
        }
    }
    // 未跑或签名不匹配 → spawn
    let child = spawn_agent()?;
    wait_for_health()?;
    Ok(Some(child))
}

// ====================================================================
// 崩溃感知 watcher
// ====================================================================

/// 后台线程：周期性 health check，状态变化时 emit "backend-status" 事件给前端。
///
/// 状态：{"status": "ok" | "down" | "restarting" | "failed", "error": "..."}
/// 只在状态变化时 emit（避免每 5s 刷一次前端）。
fn start_crash_watcher(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut last_status = "ok".to_string(); // 初始假设 ok（setup 成功才会启动 watcher）
        loop {
            std::thread::sleep(Duration::from_secs(CRASH_WATCHER_INTERVAL_SEC));
            let current = match health_get() {
                Ok(v) if health_signature_ok(&v) => "ok".to_string(),
                _ => "down".to_string(),
            };
            if current != last_status {
                let payload = serde_json::json!({ "status": current });
                let _ = app.emit("backend-status", payload);
                last_status = current;
            }
        }
    });
}

// ====================================================================
// IPC 命令
// ====================================================================

/// 重启后端（P4.5 改 config 后调用）
#[tauri::command]
async fn restart_agent(
    state: tauri::State<'_, AgentProcess>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let _ = app.emit("backend-status", serde_json::json!({ "status": "restarting" }));
    // spawn 新进程（AgentProcess::set 会先 kill 旧的）
    let child = spawn_agent()?;
    state.set(child);
    wait_for_health()?;
    let _ = app.emit("backend-status", serde_json::json!({ "status": "ok" }));
    Ok(())
}

// ====================================================================
// main
// ====================================================================

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AgentProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![restart_agent])
        .setup(|app| {
            println!("LarryAgent client starting...");
            match ensure_backend() {
                Ok(Some(child)) => {
                    // 我们 spawn 的，存入 state 供关闭时 kill
                    app.state::<AgentProcess>().set(child);
                    println!("Agent backend spawned and healthy");
                }
                Ok(None) => {
                    println!("Agent backend already running (dev mode reuse)");
                }
                Err(e) => {
                    eprintln!("Backend startup failed: {e}");
                    let _ = app.handle().emit(
                        "backend-status",
                        serde_json::json!({ "status": "failed", "error": e }),
                    );
                }
            }
            // 启动崩溃感知 watcher（独立线程，状态变化时 emit 事件）
            start_crash_watcher(app.handle().clone());
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Destroyed = event {
                println!("Window destroyed, cleaning up agent process...");
                // 只 kill 我们自己 spawn 的 child（dev mode 复用的不 kill）
                let state = window.app_handle().state::<AgentProcess>();
                state.kill_if_owned();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running LarryAgent");
}
