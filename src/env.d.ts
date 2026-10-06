/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly APIAMIS_BASE_URL?: string;
  readonly PORTAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type CloudflareEnv = {
  APIAMIS_BASE_URL?: string;
  PORTAL_URL?: string;
};

declare namespace App {
  interface Locals {
    user?: import('./lib/survey').PortalUser | null;
    token?: string | null;
    runtime?: {
      env?: CloudflareEnv & Record<string, unknown>;
    };
  }
}
