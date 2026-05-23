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
  DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

async function loadStats() {
  const since = new Date();
  since.setDate(since.getDate() - 29);

  const [products, orders, pendingOrders, orderCustomers, lowStock, recent, allOrders] = await Promise.all([
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
    supabase
      .from("orders")
      .select("total,status,created_at")
      .gte("created_at", since.toISOString()),
  ]);

  const uniqueCustomers = new Set(
    (orderCustomers.data ?? []).map((o) => o.user_id).filter(Boolean),
  ).size;

  // Série dos últimos 7 dias (vendas em R$)
  const days: { day: string; total: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      total: 0,
      count: 0,
    });
    (allOrders.data ?? []).forEach((o) => {
      if (o.created_at?.slice(0, 10) === key && o.status !== "cancelled") {
        days[days.length - 1].total += Number(o.total ?? 0) / 100;
        days[days.length - 1].count += 1;
      }
    });
  }

  // Receita total / ticket médio nos últimos 30 dias
  const validOrders = (allOrders.data ?? []).filter((o) => o.status !== "cancelled");
  const revenue30 = validOrders.reduce((s, o) => s + Number(o.total ?? 0) / 100, 0);
  const avgTicket = validOrders.length ? revenue30 / validOrders.length : 0;

  // Distribuição por status
  const statusDist: Record<string, number> = {};
  (allOrders.data ?? []).forEach((o) => {
    statusDist[o.status] = (statusDist[o.status] ?? 0) + 1;
  });

  return {
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    customers: uniqueCustomers,
    lowStock: (lowStock.data ?? []).filter((v) => v.stock <= v.low_stock_threshold).length,
    recent: recent.data ?? [],
    series: days,
    revenue30,
    avgTicket,
    statusDist,
  };
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pendente",  cls: "ads-badge--warn" },
  paid:      { label: "Pago",      cls: "" },
  shipped:   { label: "Enviado",   cls: "ads-badge--info" },
  delivered: { label: "Entregue",  cls: "" },
  cancelled: { label: "Cancelado", cls: "ads-badge--danger" },
};

const PIE_COLORS = ["#3F2424", "#c8a87a", "#87a878", "#e85d3a", "#8a7a75"];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatBRLcents(cents: number | null | undefined) {
  return formatBRL(Number(cents ?? 0) / 100);
}

function AdminHome() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: loadStats });

  const stats = [
    { label: "Produtos",  value: String(data?.products ?? 0),                                 icon: Package,     variant: "ads-stat--1", to: "/admin/produtos" },
    { label: "Pedidos",   value: String(data?.orders ?? 0),                                   icon: ShoppingBag, variant: "ads-stat--3", to: "/admin/pedidos"  },
    { label: "Receita 30d", value: data ? formatBRL(data.revenue30) : "R$ 0,00",              icon: DollarSign,  variant: "ads-stat--4", to: "/admin/pedidos"  },
    { label: "Ticket médio", value: data ? formatBRL(data.avgTicket) : "R$ 0,00",             icon: TrendingUp,  variant: "ads-stat--2", to: "/admin/pedidos"  },
  ];

  const pieData = Object.entries(data?.statusDist ?? {}).map(([k, v]) => ({
    name: statusMap[k]?.label ?? k,
    value: v,
  }));

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

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} to={c.to as never} className={`ads-stat ${c.variant} block transition-transform hover:-translate-y-0.5`}>
              <div className="flex items-center gap-2 ads-stat__label">
                <Icon className="h-3.5 w-3.5" /> {c.label}
              </div>
              <div className="ads-stat__value" style={{ fontSize: 22 }}>
                {isLoading ? "…" : c.value}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Vendas últimos 7 dias */}
        <div className="ads-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="ads-eyebrow">Financeiro</div>
              <h2 className="ads-h2 mt-1">Vendas — últimos 7 dias</h2>
            </div>
            <span className="ads-badge">{data?.series.reduce((s, d) => s + d.count, 0) ?? 0} pedidos</span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data?.series ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ddd2" vertical={false} />
                <XAxis dataKey="day" stroke="#8a7a75" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a7a75" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  cursor={{ fill: "rgba(63,36,36,0.06)" }}
                  contentStyle={{ background: "#fff", border: "1px solid #e7ddd2", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Bar dataKey="total" fill="#3F2424" radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por status */}
        <div className="ads-card">
          <div className="ads-eyebrow">Distribuição</div>
          <h2 className="ads-h2 mt-1 mb-3">Pedidos por status</h2>
          {pieData.length === 0 ? (
            <div className="py-12 text-center ads-muted text-sm">Sem dados ainda.</div>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e7ddd2", borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="mt-3 space-y-1.5">
            {pieData.map((p, i) => (
              <li key={p.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="flex-1">{p.name}</span>
                <span className="font-semibold">{p.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tabela pedidos + Spotlight */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ads-card lg:col-span-2">
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
            <div className="py-12 text-center ads-muted text-sm">Nenhum pedido por aqui ainda.</div>
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
                      <td className="ads-muted">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                      <td><span className={`ads-badge ${st.cls}`}>{st.label}</span></td>
                      <td className="text-right font-semibold">{formatBRLcents(o.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-4">
          <div className="ads-spotlight">
            <div className="ads-eyebrow" style={{ color: "rgba(245,241,236,0.65)" }}>Dica</div>
            <h3 className="mt-1">Aumente suas vendas</h3>
            <p>Configure banners promocionais na home para destacar coleções e ofertas da semana.</p>
            <Link to="/admin/conteudo" className="ads-btn ads-btn--accent">Gerenciar banners</Link>
          </div>

          <div className="ads-card ads-card--muted">
            <div className="ads-eyebrow mb-2">Clientes únicos</div>
            <div className="flex items-center gap-3">
              <div className="ads-avatar" style={{ width: 44, height: 44 }}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data?.customers ?? 0}</div>
                <div className="ads-muted text-xs">compradores ativos</div>
              </div>
            </div>
            <Link to="/admin/clientes" className="ads-btn ads-btn--ghost mt-3">
              Ver clientes <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

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
