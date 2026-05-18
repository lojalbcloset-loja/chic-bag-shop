import { Link } from "@tanstack/react-router";
import { cartLines, cartSubtotal, useShop } from "@/store/shop";
import { currency } from "@/lib/catalog";

export function CartDrawer() {
  const open = useShop((s) => s.cartOpen);
  const setOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const remove = useShop((s) => s.removeFromCart);
  const updateQty = useShop((s) => s.updateQty);
  const clear = useShop((s) => s.clearCart);
  const lines = cartLines(cart);
  const subtotal = cartSubtotal(cart);

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
          <button type="button">Limpar esgotados</button>
        </div>
        <div className="cart-items">
          {lines.length === 0 && (
            <p style={{ padding: "24px", color: "#999", fontSize: 13 }}>
              Sua sacola está vazia.
            </p>
          )}
          {lines.map((l) => (
            <div
              key={l.productId}
              style={{
                display: "grid",
                gridTemplateColumns: "72px 1fr auto",
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid #eee",
                alignItems: "center",
              }}
            >
              <img
                src={l.product.image}
                alt={l.product.imageAlt}
                style={{ width: 72, height: 72, objectFit: "contain" }}
              />
              <div style={{ display: "grid", gap: 6 }}>
                <strong style={{ fontSize: 12, lineHeight: 1.4 }}>{l.product.name}</strong>
                <span style={{ fontSize: 11, color: "#999" }}>{l.product.sku}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => updateQty(l.productId, l.quantity - 1)}
                    style={{ width: 22, height: 22, border: "1px solid #ddd", background: "#fff" }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: 12, minWidth: 18, textAlign: "center" }}>
                    {l.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(l.productId, l.quantity + 1)}
                    style={{ width: 22, height: 22, border: "1px solid #ddd", background: "#fff" }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={{ textAlign: "right", display: "grid", gap: 4 }}>
                <strong style={{ fontSize: 13 }}>
                  {currency.format(l.product.price * l.quantity)}
                </strong>
                <button
                  type="button"
                  onClick={() => remove(String(l.productId) as unknown as number)}
                  style={{ background: "none", border: 0, color: "#999", fontSize: 11 }}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
        <footer>
          <label htmlFor="coupon">Utilize o cupom:</label>
          <div className="coupon-row">
            <input id="coupon" type="text" placeholder="CUPOM" />
            <button type="button">Ok</button>
          </div>
          <div className="subtotal">
            <span>Total</span>
            <strong>{currency.format(subtotal)}</strong>
          </div>
          <p>Entrega calculada no checkout.</p>
          <button className="checkout-button" type="button" disabled={lines.length === 0}>
            Concluir pedido
          </button>
          <Link className="continue-button" to="/loja" onClick={() => setOpen(false)}>
            Continuar comprando
          </Link>
        </footer>
      </aside>
    </>
  );
}
