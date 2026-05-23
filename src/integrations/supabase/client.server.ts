import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "./env.server";

/**
 * Admin/server-only client — usa a service role key.
 * Nunca importar em código que vá pro bundle do navegador.
 *
 * Usa placeholders quando os env vars não estão disponíveis para evitar
 * crashar o módulo na importação; chamadas reais falham na rede.
 */
const url = getSupabaseUrl() || "https://placeholder.supabase.co";
const serviceKey = getSupabaseServiceRoleKey() || "placeholder-service-key";

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
