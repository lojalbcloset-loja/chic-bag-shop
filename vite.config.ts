// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Expõe os secrets LB_SUPABASE_* como VITE_* para o bundle do navegador.
// (URL e publishable key são públicos por design.)
const SUPA_URL =
  process.env.LB_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  "";
const SUPA_KEY =
  process.env.LB_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_LB_SUPABASE_URL": JSON.stringify(SUPA_URL),
      "import.meta.env.VITE_LB_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPA_KEY),
    },
  },
});
