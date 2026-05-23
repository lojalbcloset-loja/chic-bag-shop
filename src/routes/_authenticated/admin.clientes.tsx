import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: ClientesPage,
});

type CustomerRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  products: string[];
  status: string | null;
};

type OrderRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  created_at: string;
  shipping_address: { city?: string; state?: string } | null;
  order_items: { product_snapshot: { name?: string } | null }[] | null;
};

async function fetchCustomers(): Promise<CustomerRow[]> {
  const { data: staff } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "manager"]);
  const staffIds = new Set((staff ?? []).map((r) => r.user_id as string));

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,user_id,status,created_at,shipping_address,order_items(product_snapshot)")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const byUser = new Map<string, OrderRow[]>();
  for (const o of (orders ?? []) as OrderRow[]) {
    if (!o.user_id || staffIds.has(o.user_id)) continue;
    const arr = byUser.get(o.user_id) ?? [];
    arr.push(o);
    byUser.set(o.user_id, arr);
  }
  const userIds = Array.from(byUser.keys());
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,full_name,phone")
    .in("id", userIds);
  const profMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  return userIds.map((uid) => {
    const list = byUser.get(uid)!;
    const latest = list[0];
    const products = Array.from(
      new Set(
        list.flatMap(
          (o) => (o.order_items ?? []).map((i) => i.product_snapshot?.name).filter(Boolean) as string[],
        ),
      ),
    );
    const prof = profMap.get(uid);
    return {
      id: uid,
      full_name: prof?.full_name ?? null,
      phone: prof?.phone ?? null,
      city: latest.shipping_address?.city ?? null,
      state: latest.shipping_address?.state ?? null,
      products,
      status: latest.status ?? null,
    };
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-rose-100 text-rose-800",
  refunded: "bg-zinc-200 text-zinc-800",
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASS[status] ?? "bg-muted text-foreground",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function ClientesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-customers"], queryFn: fetchCustomers });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((c) => (c.full_name ?? "").toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Compradores da loja</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome…"
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Telefone</th>
                <th className="text-left px-4 py-3">Cidade - UF</th>
                <th className="text-left px-4 py-3">Produto comprado</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground">Carregando…</td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const cityUf =
                  c.city && c.state ? `${c.city} - ${c.state}` : c.city ?? c.state ?? "—";
                const first = c.products[0];
                const extra = c.products.length - 1;
                return (
                  <tr key={c.id} className="border-t hover:bg-muted/30 align-middle">
                    <td className="px-4 py-3 font-medium">{c.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {c.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{cityUf}</td>
                    <td className="px-4 py-3">
                      {first ? (
                        <div className="flex items-center gap-2">
                          <span className="line-clamp-1 max-w-[260px]">{first}</span>
                          {extra > 0 && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              +{extra}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
