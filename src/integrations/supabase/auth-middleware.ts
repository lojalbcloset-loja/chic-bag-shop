import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Lê o Bearer token do request, valida com a service role e
 * devolve um supabase client autenticado como o user (RLS aplica).
 */
export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const req = getRequest();
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Response("Unauthorized: No authorization header provided", { status: 401 });
    }
    const token = authHeader.slice(7);

    const url = process.env.LB_SUPABASE_URL!;
    const publishable = process.env.LB_SUPABASE_PUBLISHABLE_KEY!;
    const service = process.env.LB_SUPABASE_SERVICE_ROLE_KEY!;

    // valida o token
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: userData, error } = await admin.auth.getUser(token);
    if (error || !userData.user) {
      throw new Response("Unauthorized: Invalid token", { status: 401 });
    }

    // client que age como o usuário (RLS respeita)
    const supabase = createClient(url, publishable, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    return next({
      context: {
        supabase,
        userId: userData.user.id,
        userEmail: userData.user.email ?? null,
      },
    });
  },
);

/**
 * Exige role admin OU manager.
 */
export const requireStaff = createMiddleware({ type: "function" })
  .server(async ({ next }) => {
    const req = getRequest();
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const token = authHeader.slice(7);
    const admin = createClient(
      process.env.LB_SUPABASE_URL!,
      process.env.LB_SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: userData, error } = await admin.auth.getUser(token);
    if (error || !userData.user) throw new Response("Unauthorized", { status: 401 });

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const hasStaff = (roles ?? []).some((r) => r.role === "admin" || r.role === "manager");
    if (!hasStaff) throw new Response("Forbidden", { status: 403 });

    const supabase = createClient(
      process.env.LB_SUPABASE_URL!,
      process.env.LB_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );

    return next({
      context: {
        supabase,
        supabaseAdmin: admin,
        userId: userData.user.id,
        roles: (roles ?? []).map((r) => r.role as string),
      },
    });
  });
