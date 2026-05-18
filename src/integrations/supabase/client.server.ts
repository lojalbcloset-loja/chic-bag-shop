import { createClient } from "@supabase/supabase-js";

/**
 * Admin/server-only client — usa a service role key.
 * Nunca importar em código que vá pro bundle do navegador.
 */
export const supabaseAdmin = createClient(
  process.env.LB_SUPABASE_URL!,
  process.env.LB_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
