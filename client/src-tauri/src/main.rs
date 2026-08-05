// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;

/// 持有 Agent 子进程句柄，应用退出时自动清理
struct AgentProcess(Mutex<Option<Child>>);

fn main() {
    // TODO: 启动时自动拉起 Python Agent 进程
    //   let agent = Command::new("uvicorn")
    //       .args(["main:app", "--host", "0.0.0.0", "--port", "8000"])
    //       .current_dir("../backend")
    //       .spawn()
    //       .expect("Failed to start agent");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // .manage(AgentProcess(Mutex::new(Some(agent))))
        .setup(|_app| {
            // TODO: 在这里启动 Agent 子进程
            //   - 检测 Python 环境（venv）
            //   - 启动 uvicorn 进程
            //   - 等待 health check 通过后打开主窗口
            println!("LarryAgent client starting...");
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // TODO: 窗口关闭时终止 Agent 子进程
                println!("Window destroyed, cleaning up agent process...");
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running LarryAgent");
}
