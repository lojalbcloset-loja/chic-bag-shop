import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_LB_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_LB_SUPABASE_PUBLISHABLE_KEY as string;

if (!url || !anonKey) {
  // Aviso útil durante o desenvolvimento — não vaza valor algum
  console.warn(
    "[supabase] VITE_LB_SUPABASE_URL ou VITE_LB_SUPABASE_PUBLISHABLE_KEY ausentes em build-time.",
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
