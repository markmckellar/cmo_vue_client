/// <reference types="vite/client" />

// this build's version, e.g. "cmo_vue_client:1.3.0" (vite.config.ts)
declare const __CMO_CODE__: string;

interface ImportMetaEnv {
  readonly VITE_CMO_SERVER?: string;
  readonly VITE_CAMERA_TIME_ZONE?: string;
}
