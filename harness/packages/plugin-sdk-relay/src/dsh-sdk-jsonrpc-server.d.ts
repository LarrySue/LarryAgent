/**
 * `@deepseek-ai/dsh-sdk-jsonrpc-server` 的**局部类型投影**（编译期用）。
 *
 * 为什么需要它：本包在**运行时**从 profile 的 `node_modules` 解析这个包（它是 dsh profile
 * 的树外依赖，见 `cordis.patch.yml`），但编译发生在 harness 工作区，那里**没有**这个包
 * ⇒ 不加投影就是 TS2307，加投影又不想把 harness 的依赖树改动（3.7.x 教训：改依赖树必须实跑）。
 *
 * 因此这里只声明本包**真正用到**的三件事：构造、`handleRequest`、`shutdown`。
 * ⚠️ 若日后 harness 装上该包，本投影会与真实类型并存 —— 到时删掉本文件即可。
 */
declare module '@deepseek-ai/dsh-sdk-jsonrpc-server' {
  export class HarnessSdkJsonRpcServer {
    constructor(ctx: unknown, transport: unknown, options?: { maxTokensAsSuccess?: boolean })
    handleRequest(method: string, params: Record<string, unknown>): Promise<unknown>
    shutdown(): Promise<void>
  }
}
