import { createFileRoute, Outlet, Link, redirect, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  // gate só roda no cliente porque session é client-side
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/", search: { login: 1 } as never });
    }
  },
  component: AuthenticatedLayout,
});

const navItems = [
  { to: "/conta", label: "Meus dados" },
  { to: "/conta/enderecos", label: "Endereços" },
  { to: "/conta/pedidos", label: "Meus pedidos" },
];

function AuthenticatedLayout() {
  const { isAuthenticated, isStaff, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Carregando…</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Minha conta
          </h2>
          {navItems.map((it) => {
            const active = path === it.to || path.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50",
                )}
              >
                {it.label}
              </Link>
            );
          })}
          {isStaff && (
            <Link
              to="/admin"
              className="block rounded-md px-3 py-2 text-sm text-primary hover:bg-accent/50 mt-4 border-t pt-4"
            >
              Painel administrativo →
            </Link>
          )}
        </aside>
        <section><Outlet /></section>
      </div>
    </div>
  );
}
