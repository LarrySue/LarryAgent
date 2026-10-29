/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端鉴权凭据，对应 backend/config.yaml 的 server.api_key；为空则请求不带 Authorization */
  readonly VITE_API_KEY?: string;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
