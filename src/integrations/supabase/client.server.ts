import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "./env.server";

/**
 * Admin/server-only client — usa a service role key.
 * Nunca importar em código que vá pro bundle do navegador.
 */
export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  getSupabaseServiceRoleKey(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
