// Resolve Supabase env vars at runtime, supporting both the project-specific
// LB_* names (sandbox dev) and the standard Lovable Cloud names (published worker).
export function getSupabaseUrl(): string {
  return (
    process.env.LB_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    ""
  );
}
export function getSupabasePublishableKey(): string {
  return (
    process.env.LB_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    ""
  );
}
export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.LB_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    ""
  );
}
