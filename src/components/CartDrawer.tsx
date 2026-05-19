import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cartLines, cartSubtotalCents, useShop } from "@/store/shop";
import { currency, primaryImage, productsQuery } from "@/lib/products";

export function CartDrawer() {
  const open = useShop((s) => s.cartOpen);
  const setOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const remove = useShop((s) => s.removeFromCart);
  const updateQty = useShop((s) => s.updateQty);
  const clear = useShop((s) => s.clearCart);

  const { data: products = [] } = useQuery(productsQuery());
  const lines = cartLines(cart, products);
  const subtotal = cartSubtotalCents(lines) / 100;

  return (
    <>
      <div
        className={`cart-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`cart-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <header>
          <strong>Minha sacola</strong>
          <button type="button" aria-label="Fechar sacola" onClick={() => setOpen(false)}>
            ×
          </button>
        </header>
        <div className="cart-tools">
          <button type="button" onClick={clear}>Limpar sacola</button>
        </div>
        <div className="cart-items">
          {lines.length === 0 && (
            <p style={{ padding: "24px", color: "#999", fontSize: 13 }}>
              Sua sacola está vazia.
            </p>
          )}
          {lines.map((l) => {
            const img = primaryImage(l.product);
            return (
              <div
                key={l.variantId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr auto",
                  gap: 12,
                  padding: "14px 18px",
                  borderBottom: "1px solid #eee",
                  alignItems: "center",
                }}
              >
                {img && (
                  <img
                    src={img.url}
                    alt={img.alt ?? l.product.name}
                    style={{ width: 72, height: 72, objectFit: "contain" }}
                  />
                )}
                <div style={{ display: "grid", gap: 6 }}>
                  <strong style={{ fontSize: 12, lineHeight: 1.4 }}>{l.product.name}</strong>
                  <span style={{ fontSize: 11, color: "#999" }}>{l.variant.sku}</span>
                  {(l.variant.color || l.variant.size) && (
                    <span style={{ fontSize: 11, color: "#666" }}>
                      {[l.variant.color?.name, l.variant.size?.name].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => updateQty(l.variantId, l.quantity - 1)}
                      style={{ width: 22, height: 22, border: "1px solid #ddd", background: "#fff" }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 12, minWidth: 18, textAlign: "center" }}>
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(l.variantId, l.quantity + 1)}
                      style={{ width: 22, height: 22, border: "1px solid #ddd", background: "#fff" }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "grid", gap: 4 }}>
                  <strong style={{ fontSize: 13 }}>
                    {currency.format((l.variant.price_cents * l.quantity) / 100)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => remove(l.variantId)}
                    style={{ background: "none", border: 0, color: "#999", fontSize: 11 }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <footer>
          <div className="subtotal">
            <span>Total</span>
            <strong>{currency.format(subtotal)}</strong>
          </div>
          <p>Entrega calculada no checkout.</p>
          <Link
            to="/checkout"
            className="checkout-button"
            onClick={() => setOpen(false)}
            style={lines.length === 0 ? { pointerEvents: "none", opacity: 0.4 } : undefined}
          >
            Concluir pedido
          </Link>
          <Link className="continue-button" to="/loja" onClick={() => setOpen(false)}>
            Continuar comprando
          </Link>
        </footer>
      </aside>
    </>
  );
}
