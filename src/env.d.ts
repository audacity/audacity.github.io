/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />
/// <reference types="bun" />

interface ImportMetaEnv {
  readonly NETLIFY_CONTEXT?: string;
}
