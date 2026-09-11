# Other 交流区（编外 AI）

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
> 本文件供未纳入项目固定分工的编外 AI 使用，由老大按需点将介入，或老大亲自执行。各条目标注 AI 名称与日期，供 WB 整理采纳。
> 编外 AI 不受 `.claude/` / `.trae/` / WORKBUDDY 等角色约束文件管辖，规矩以老大当场指令为准。

---

## 【排查 · 2026-09-11 · Qoder】本机开发与测试调试环境冲突摘要

仅排查、总结、报告，未修改任何配置、安装或环境变量。范围只覆盖 LarryAgent 本机开发/测试/调试可能会涉及的 Python、Node.js、pnpm/npm、Git、Tauri/Rust/Cargo、DSH、uvicorn/pytest/vite、PowerShell 编码、代理与 TLS 等。

### 高优先级

- Python 多版本并存且默认入口不一致：`python` 指向 `Python 3.11.9`，`python3` 和 `py -3` 指向 `Python 3.14.3`；同一脚本用不同命令启动会进入不同解释器，容易出现依赖、类型或行为差异。
- Python 控制台/PowerShell 默认编码为 `GBK/CP936`，且未设置 `PYTHONUTF8=1`、`PYTHONIOENCODING`；项目侧 `uvicorn`、`pytest`、`chcp` 等输出链路存在 UTF-8 与 GBK 混用风险。
- `NODE_TLS_REJECT_UNAUTHORIZED=0` 已生效，会关闭 Node 的证书校验，可能污染 DSH、npm、pnpm、Tauri build 等网络链路，导致“环境不同则结果不同”的偶发失败。
- Git 全局已硬编码 `http.proxy`/`https.proxy`，且项目内没有覆盖配置；一旦代理不可用，`git fetch/pull/push` 和依赖 git 的插件安装都会一起失败。

### 中优先级

- `tauri` CLI 和 `vite` 当前在 PATH 中不可解析，说明前端/Tauri 工具链还没有安装到全局或当前工程目录，相关命令会直接失败。
- `pnpm` 提示其全局 bin 目录 `C:\Users\SuLarry\AppData\Local\pnpm\bin` 不在 PATH，全局安装的可执行工具链不一定能稳定调用。
- `dsh` 只解析到 `npm` 全局目录 `C:\Users\SuLarry\AppData\Roaming\npm\dsh.CMD`，没有看到项目级隔离安装；后续如果不同子项目需要不同 DSH 版本，会互相干扰。
- PATH 存在重复条目，`C:\Users\SuLarry\.qoderwork\bin`、`...git\usr\bin`、`...git\mingw64\bin` 多次出现，工具解析顺序不够干净。

### 项目侧观察

- 项目根目录当前只检测到 `.gitignore` 和 `backend/`，没有同时看到 `package.json`、`pnpm-lock.yaml`、`Cargo.toml`、`tauri.conf.json` 等入口文件；这说明 LarryAgent 的工程结构目前更像“仓库内子目录开发”，而不是根目录即可直接跑全套工具链。
- 项目内 `core.autocrlf=true`，全局未显式设置；如果后续有人用不同行尾习惯协作，可能在脚本、配置文件和日志比对上继续产生噪音。

### 结论

当前最可能制造“环境不稳定”的是三类：Python 多版本入口混用、控制台/进程编码不一致、Node/TLS/代理等网络环境被全局开关污染。这三类应优先固定，其次是补齐 Tauri/Vite 工具链和统一 pnpm 全局执行路径。
