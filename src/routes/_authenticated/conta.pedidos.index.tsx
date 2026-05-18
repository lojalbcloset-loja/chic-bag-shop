import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/account.functions";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/conta/pedidos/")({
  head: () => ({ meta: [{ title: "Meus pedidos — Lb Closet" }] }),
  component: OrdersPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  processing: "Em separação",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function OrdersPage() {
  const fn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Meus pedidos</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data?.orders?.length ? (
        <p className="text-sm text-muted-foreground">Você ainda não fez pedidos.</p>
      ) : (
        <div className="grid gap-3">
          {data.orders.map((o: { id: string; order_number: string; status: string; total_cents: number; created_at: string }) => (
            <Link key={o.id} to="/conta/pedidos/$id" params={{ id: o.id }}>
              <Card className="transition-colors hover:bg-accent/30">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <p className="font-semibold">{fmtBRL(o.total_cents)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
