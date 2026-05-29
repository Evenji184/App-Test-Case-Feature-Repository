/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_SCHEME: string;
  readonly VITE_API_HOST: string;
  readonly VITE_API_PORT: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_CODEGPT_TEMPLATE_ID: string;
  readonly VITE_CODEGPT_PLUGIN_ID: string;
  readonly VITE_CODEGPT_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
