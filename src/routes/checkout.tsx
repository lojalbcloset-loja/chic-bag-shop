import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cartLines, cartSubtotalCents, useShop } from "@/store/shop";
import { currency, productsQuery } from "@/lib/products";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout | Lb Closet" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useShop((s) => s.cart);
  const { data: products = [] } = useQuery(productsQuery());
  const lines = cartLines(cart, products);
  const subtotal = cartSubtotalCents(lines) / 100;

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Checkout</h1>
      {lines.length === 0 ? (
        <p>
          Sua sacola está vazia. <Link to="/loja" style={{ textDecoration: "underline" }}>Ir para a loja</Link>.
        </p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
            {lines.map((l) => (
              <li key={l.variantId} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <span>{l.product.name} × {l.quantity}</span>
                <strong>{currency.format((l.variant.price_cents * l.quantity) / 100)}</strong>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, marginBottom: 24 }}>
            <span>Total</span>
            <strong>{currency.format(subtotal)}</strong>
          </div>
          <p style={{ color: "#999", fontSize: 13 }}>
            Finalização de pedido em desenvolvimento. Em breve você poderá concluir aqui.
          </p>
        </>
      )}
    </main>
  );
}
