/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override for Cloudflare DoH; use `{name}` and `{type}` placeholders (e.g. A, NS). */
  readonly VITE_DOH_CLOUDFLARE_URL?: string
  /** Optional override for Google DNS JSON; use `{name}` and `{type}` (numeric RR type). */
  readonly VITE_DOH_GOOGLE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
