import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: PedidosPage,
});

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "canceled", "refunded"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", paid: "Pago", processing: "Em separação",
  shipped: "Enviado", delivered: "Entregue", canceled: "Cancelado", refunded: "Reembolsado",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-gray-200 text-gray-700",
  refunded: "bg-rose-100 text-rose-800",
};

type Order = {
  id: string;
  order_number: string | null;
  status: string;
  total_cents: number;
  created_at: string;
  user_id: string | null;
  shipping_address: { recipient?: string } | null;
};

async function fetchOrders(filter: string) {
  let q = supabase
    .from("orders")
    .select("id,order_number,status,total_cents,created_at,user_id,shipping_address")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter !== "all") q = q.eq("status", filter as never);
  const { data, error } = await q;
  if (error) throw error;
  return data as Order[];
}

function PedidosPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders", filter], queryFn: () => fetchOrders(filter) });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as never }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe e gerencie pedidos da loja</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === s ? "bg-[#3F2424] text-white border-[#3F2424]" : "bg-card hover:bg-accent"
            }`}
          >
            {s === "all" ? "Todos" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Pedido</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Cliente</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Data</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Carregando…</td></tr>}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado.</td></tr>
            )}
            {(data ?? []).map((o) => (
              <tr key={o.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{o.order_number ?? o.id.slice(0, 8)}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {o.shipping_address?.recipient ?? "—"}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">R$ {(o.total_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLOR[o.status] ?? ""}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
