import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

/**
 * Anexa o Bearer token do usuário em toda chamada de serverFn.
 * Registrar em src/start.ts -> functionMiddleware: [attachSupabaseAuth].
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token
      ? next({ headers: { Authorization: `Bearer ${token}` } })
      : next();
  },
);
