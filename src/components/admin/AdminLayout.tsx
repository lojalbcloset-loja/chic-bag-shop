import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/images/logo/logo-lbcloset-oficial.png";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tags,
  Image as ImageIcon,
  Settings,
  LogOut,
} from "lucide-react";

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/conteudo", label: "Slider-Banners", icon: ImageIcon },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];


export function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, isStaff, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }
  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta não tem permissão de staff para acessar o painel.
          </p>
          <Link to="/" className="inline-block text-sm underline">Voltar para a loja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ads-shell min-h-screen grid md:grid-cols-[240px_1fr]">
      <aside className="ads-sidebar hidden md:flex flex-col">
        <div className="px-2 py-3 mb-3 flex items-center gap-3">
          <img src={logoUrl} alt="LB Closet" className="h-10 w-auto object-contain" />
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] ads-muted">LB Closet</div>
            <div className="text-sm font-semibold">Painel</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((it) => {
            const active = it.exact ? path === it.to : path === it.to || path.startsWith(it.to + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn("ads-nav-item", active && "is-active")}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--ads-border)" }}>
          <div className="px-3 text-xs ads-muted truncate" title={user?.email ?? ""}>
            {user?.email}
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/painel" });
            }}
            className="ads-nav-item w-full mt-2"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>


      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="LB Closet" className="h-8 w-auto" />
          <span className="text-sm font-semibold">Painel</span>
        </div>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/painel" }); }}
          className="text-xs text-muted-foreground inline-flex items-center gap-1"
        >
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </div>

      <main className="min-w-0">
        <div className="md:hidden border-b bg-card overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {nav.map((it) => {
              const active = it.exact ? path === it.to : path === it.to || path.startsWith(it.to + "/");
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs whitespace-nowrap",
                    active ? "bg-[#3F2424] !text-white font-medium" : "text-foreground hover:bg-accent",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
