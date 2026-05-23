import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

async function loadStats() {
  const [products, orders, pendingOrders, orderCustomers, lowStock, recent] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("user_id"),
    supabase.from("product_variants").select("id,stock,low_stock_threshold").lte("stock", 3).limit(50),
    supabase
      .from("orders")
      .select("id,total,status,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const uniqueCustomers = new Set(
    (orderCustomers.data ?? []).map((o) => o.user_id).filter(Boolean),
  ).size;
  return {
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    customers: uniqueCustomers,
    lowStock: (lowStock.data ?? []).filter((v) => v.stock <= v.low_stock_threshold).length,
    recent: recent.data ?? [],
  };
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Pendente",  cls: "ads-badge--warn" },
  paid:       { label: "Pago",      cls: "" },
  shipped:    { label: "Enviado",   cls: "ads-badge--info" },
  delivered:  { label: "Entregue",  cls: "" },
  cancelled:  { label: "Cancelado", cls: "ads-badge--danger" },
};

function formatBRL(cents: number | null | undefined) {
  const v = Number(cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AdminHome() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: loadStats });

  const stats = [
    { label: "Produtos",  value: data?.products ?? 0,       icon: Package,     variant: "ads-stat--1", to: "/admin/produtos" },
    { label: "Pedidos",   value: data?.orders ?? 0,         icon: ShoppingBag, variant: "ads-stat--3", to: "/admin/pedidos"  },
    { label: "Pendentes", value: data?.pendingOrders ?? 0,  icon: TrendingUp,  variant: "ads-stat--4", to: "/admin/pedidos"  },
    { label: "Clientes",  value: data?.customers ?? 0,      icon: Users,       variant: "ads-stat--2", to: "/admin/clientes" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="ads-eyebrow">Painel</div>
          <h1 className="ads-h1 mt-1">Visão geral</h1>
          <p className="ads-muted text-sm mt-1">
            {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link to="/admin/produtos" className="ads-btn ads-btn--primary">
          <Sparkles className="h-4 w-4" /> Novo produto
        </Link>
      </div>

      {/* Stat cards pastel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} to={c.to as never} className={`ads-stat ${c.variant} block transition-transform hover:-translate-y-0.5`}>
              <div className="flex items-center gap-2 ads-stat__label">
                <Icon className="h-3.5 w-3.5" /> {c.label}
              </div>
              <div className="ads-stat__value">{isLoading ? "…" : c.value}</div>
            </Link>
          );
        })}
      </div>

      {/* Main grid: tabela + spotlight */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Pedidos recentes */}
        <div className="ads-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="ads-eyebrow">Atividade</div>
              <h2 className="ads-h2 mt-1">Pedidos recentes</h2>
            </div>
            <Link to="/admin/pedidos" className="ads-btn ads-btn--ghost">
              Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center ads-muted text-sm">Carregando…</div>
          ) : (data?.recent ?? []).length === 0 ? (
            <div className="py-12 text-center ads-muted text-sm">
              Nenhum pedido por aqui ainda.
            </div>
          ) : (
            <table className="ads-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data!.recent.map((o: any) => {
                  const st = statusMap[o.status] ?? { label: o.status, cls: "" };
                  return (
                    <tr key={o.id}>
                      <td className="font-medium">#{String(o.id).slice(0, 8)}</td>
                      <td className="ads-muted">
                        {new Date(o.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td>
                        <span className={`ads-badge ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="text-right font-semibold">{formatBRL(o.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Spotlight escuro */}
        <div className="space-y-4">
          <div className="ads-spotlight">
            <div className="ads-eyebrow" style={{ color: "rgba(245,241,236,0.65)" }}>
              Dica
            </div>
            <h3 className="mt-1">Aumente suas vendas</h3>
            <p>
              Configure banners promocionais na home para destacar coleções e ofertas da semana.
            </p>
            <Link to="/admin/conteudo" className="ads-btn ads-btn--accent">
              Gerenciar banners
            </Link>
          </div>

          <div className="ads-card ads-card--muted">
            <div className="ads-eyebrow mb-2">Catálogo</div>
            <h3 className="ads-h2">Categorias ativas</h3>
            <p className="ads-muted text-sm mt-1">
              Bolsas, Carteiras, Cintos e Bonés.
            </p>
            <Link to="/admin/categorias" className="ads-btn ads-btn--ghost mt-3">
              Editar categorias <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Alerta estoque */}
      {!!data?.lowStock && data.lowStock > 0 && (
        <Link
          to="/admin/produtos"
          className="ads-card flex items-center gap-3 hover:shadow-md transition-shadow"
          style={{ background: "var(--ads-stat-4-bg)", borderColor: "transparent" }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: "var(--ads-stat-4-fg)" }} />
          <div className="text-sm" style={{ color: "var(--ads-stat-4-fg)" }}>
            <strong>{data.lowStock}</strong> variante(s) com estoque baixo — verifique os produtos.
          </div>
        </Link>
      )}
    </div>
  );
}
