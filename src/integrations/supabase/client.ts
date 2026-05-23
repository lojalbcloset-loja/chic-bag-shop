import { createClient } from "@supabase/supabase-js";

// Em alguns ambientes (ex.: build do worker do preview Lovable) os secrets
// LB_SUPABASE_* não chegam como `process.env` em build-time, então o
// `import.meta.env.VITE_LB_SUPABASE_*` é substituído por string vazia.
// `createClient("")` lança "supabaseUrl is required." e derruba todo o SSR.
// Para evitar isso, usamos uma URL placeholder válida quando vazia — as
// chamadas reais irão falhar de forma controlada (catch nas queries) em vez
// de quebrar o bundle inteiro.
const url =
  (import.meta.env.VITE_LB_SUPABASE_URL as string | undefined) ||
  "https://placeholder.supabase.co";
const anonKey =
  (import.meta.env.VITE_LB_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  "placeholder-anon-key";

if (
  !import.meta.env.VITE_LB_SUPABASE_URL ||
  !import.meta.env.VITE_LB_SUPABASE_PUBLISHABLE_KEY
) {
  console.warn(
    "[supabase] VITE_LB_SUPABASE_URL ou VITE_LB_SUPABASE_PUBLISHABLE_KEY ausentes em build-time — usando placeholder.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "lb-closet-auth",
  },
});
