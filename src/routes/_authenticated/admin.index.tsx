import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, Users, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

async function loadStats() {
  const [products, orders, pendingOrders, orderCustomers, lowStock] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("user_id"),
    supabase.from("product_variants").select("id,stock,low_stock_threshold").lte("stock", 3).limit(50),
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
  };
}

function AdminHome() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: loadStats });

  const cards = [
    { label: "Produtos", value: data?.products ?? 0, icon: Package, to: "/admin/produtos", color: "text-[#3F2424]" },
    { label: "Pedidos", value: data?.orders ?? 0, icon: ShoppingBag, to: "/admin/pedidos", color: "text-[#3F2424]" },
    { label: "Pendentes", value: data?.pendingOrders ?? 0, icon: ShoppingBag, to: "/admin/pedidos", color: "text-amber-600" },
    { label: "Clientes", value: data?.customers ?? 0, icon: Users, to: "/admin/clientes", color: "text-[#3F2424]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">Resumo da operação da loja</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.to as never}
              className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <div className="mt-3 text-3xl font-semibold">
                {isLoading ? "…" : c.value}
              </div>
            </Link>
          );
        })}
      </div>

      {!!data?.lowStock && data.lowStock > 0 && (
        <Link
          to="/admin/produtos"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="h-5 w-5 text-amber-700" />
          <div className="text-sm">
            <strong>{data.lowStock}</strong> variante(s) com estoque baixo — verifique os produtos.
          </div>
        </Link>
      )}
    </div>
  );
}
