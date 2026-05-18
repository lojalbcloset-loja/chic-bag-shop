import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyOrder } from "@/lib/account.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/conta/pedidos/$id")({
  head: () => ({ meta: [{ title: "Pedido — Lb Closet" }] }),
  component: OrderDetailPage,
});

function fmtBRL(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function OrderDetailPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getMyOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["my-order", id],
    queryFn: () => fn({ data: { id } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>;

  const { order, items, events } = data;
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/conta/pedidos"><ChevronLeft className="size-4" /> Voltar</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">{order.order_number}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleString("pt-BR")} • Status: {order.status}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Itens</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((it: { id: string; quantity: number; line_total_cents: number; product_snapshot: unknown }) => {
            const snap = (it.product_snapshot ?? {}) as { name?: string; sku?: string };
            return (
              <div key={it.id} className="flex justify-between text-sm">
                <span>{snap.name ?? "Item"} × {it.quantity}</span>
                <span>{fmtBRL(it.line_total_cents)}</span>
              </div>
            );
          })}
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmtBRL(order.subtotal_cents)}</span></div>
            <div className="flex justify-between"><span>Frete</span><span>{fmtBRL(order.shipping_cents)}</span></div>
            {order.discount_cents > 0 && (
              <div className="flex justify-between text-primary"><span>Desconto</span><span>-{fmtBRL(order.discount_cents)}</span></div>
            )}
            <div className="flex justify-between font-semibold text-base pt-2">
              <span>Total</span><span>{fmtBRL(order.total_cents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.tracking_code && (
        <Card>
          <CardHeader><CardTitle className="text-base">Rastreio</CardTitle></CardHeader>
          <CardContent className="text-sm">{order.tracking_code}</CardContent>
        </Card>
      )}

      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {events.map((ev: { id: string; type: string; created_at: string }) => (
              <div key={ev.id} className="flex gap-3">
                <span className="text-muted-foreground">
                  {new Date(ev.created_at).toLocaleString("pt-BR")}
                </span>
                <span>{ev.type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
