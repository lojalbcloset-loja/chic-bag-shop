import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { currency, getProductById, getRelatedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/store/shop";

export const Route = createFileRoute("/produto/$id")({
  loader: ({ params }) => {
    const product = getProductById(Number(params.id));
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} | Lb Closet` },
          {
            name: "description",
            content: loaderData.product.description ?? "Produto Lb Closet",
          },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div style={{ padding: 60, textAlign: "center" }}>
      <h1>Produto não encontrado</h1>
      <Link to="/loja" style={{ textDecoration: "underline" }}>Voltar à loja</Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const addToCart = useShop((s) => s.addToCart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const [cep, setCep] = useState("");
  const [shippingMsg, setShippingMsg] = useState<string | null>(null);
  const related = getRelatedProducts(product, 4);
  const installments = (product.price / 10).toFixed(2).replace(".", ",");

  function calcShipping() {
    if (!/^\d{5}-?\d{3}$/.test(cep)) {
      setShippingMsg("Informe um CEP válido.");
      return;
    }
    setShippingMsg(
      `PAC: ${currency.format(24.9)} • 6 a 9 dias úteis\nSEDEX: ${currency.format(42.5)} • 2 a 4 dias úteis\n(Estimativa demonstrativa — frete real será calculado no checkout)`,
    );
  }

  function handleBuy() {
    addToCart(product.id, false);
    // redirect ao checkout (placeholder)
    setCartOpen(true);
  }

  return (
    <main id="top">
      <nav className="pdp-breadcrumbs" aria-label="Caminho de navegação">
        <Link to="/">INÍCIO</Link> / <Link to="/loja">LOJA</Link> /{" "}
        <Link to="/loja" search={{ category: product.category }}>{product.category.toUpperCase()}</Link>
      </nav>

      <div className="pdp-container">
        <section className="pdp-gallery" aria-label="Galeria de imagens do produto">
          <div className="pdp-thumb-strip">
            <button
              type="button"
              style={{ border: "1px solid #66504a", padding: 4, background: "#fff" }}
            >
              <img src={product.image} alt={product.imageAlt} style={{ width: 64, height: 64, objectFit: "contain" }} />
            </button>
          </div>
          <div className="pdp-main-image-container">
            <img
              src={product.image}
              alt={product.imageAlt}
              style={{ width: "100%", maxWidth: 560, objectFit: "contain" }}
            />
          </div>
        </section>

        <section className="pdp-info-box" aria-label="Detalhes de compra do produto">
          <span className="pdp-badge">{product.tag}</span>
          <h1 className="pdp-title">{product.name}</h1>
          <span className="pdp-sku">SKU: {product.sku}</span>

          <div className="pdp-price-box">
            {product.oldPrice && (
              <div className="pdp-old-price-row">
                <span style={{ textDecoration: "line-through", color: "#999" }}>
                  {currency.format(product.oldPrice)}
                </span>{" "}
                {product.discount && <strong style={{ color: "#c8102e" }}>{product.discount}% OFF</strong>}
              </div>
            )}
            <div className="pdp-price">{currency.format(product.price)}</div>
            <div className="pdp-installments">
              ou 10x de R$ {installments} sem juros
            </div>
          </div>

          <div className="pdp-options-section">
            <span className="pdp-option-label">Cor</span>
            <div className="pdp-colors-row">
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  border: "1px solid #66504a",
                  fontSize: 12,
                }}
              >
                {product.color}
              </span>
            </div>
          </div>

          <div className="pdp-options-section">
            <span className="pdp-option-label">Tamanho</span>
            <div className="pdp-size-row">
              <button className="pdp-size-chip active" type="button">UN</button>
            </div>
          </div>

          <div className="pdp-actions-row">
            <button className="pdp-buy-btn" type="button" onClick={handleBuy}>
              COMPRAR
            </button>
            <button
              className="pdp-bag-btn"
              type="button"
              onClick={() => addToCart(product.id)}
            >
              ADICIONAR NA SACOLA
            </button>
            <a
              className="pdp-whatsapp-btn"
              href={`https://wa.me/5562985388100?text=${encodeURIComponent(
                `Olá! Tenho interesse no produto ${product.name} (SKU ${product.sku}).`,
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.115.548 4.184 1.585 6.002L.092 23.473l5.58-1.464a12.035 12.035 0 006.359 1.802h.004c6.645 0 12.032-5.385 12.032-12.031S18.677 0 12.031 0z" />
              </svg>
              COMPRAR PELO WHATSAPP
            </a>
          </div>

          <div className="pdp-shipping-box">
            <span className="pdp-option-label">Calcular Frete e Prazo</span>
            <div className="pdp-shipping-input-group">
              <input
                type="text"
                placeholder="Digite seu CEP (Ex: 74000-000)"
                maxLength={9}
                value={cep}
                onChange={(e) => setCep(e.target.value)}
              />
              <button type="button" onClick={calcShipping}>Calcular</button>
            </div>
            {shippingMsg && (
              <div className="pdp-shipping-output" style={{ whiteSpace: "pre-line", marginTop: 10, fontSize: 12 }}>
                {shippingMsg}
              </div>
            )}
          </div>

          <div className="pdp-accordions-container">
            <PdpAccordion label="Descrição" defaultOpen>
              <p>{product.description}</p>
            </PdpAccordion>
            <PdpAccordion label="Ficha Técnica">
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                <li>Material: {product.material}</li>
                <li>Cor: {product.color}</li>
                <li>Categoria: {product.category}</li>
                <li>SKU: {product.sku}</li>
              </ul>
            </PdpAccordion>
            <PdpAccordion label="Dúvidas sobre o produto">
              <p>
                <strong>1. O produto é em couro legítimo?</strong>
                <br />Sim, todas as nossas bolsas, cintos e carteiras indicadas como couro são confeccionadas em couro de altíssima qualidade.
                <br /><br />
                <strong>2. Qual o prazo de envio?</strong>
                <br />Seu pedido será postado em até 24 horas úteis após a confirmação do pagamento.
                <br /><br />
                <strong>3. Posso trocar se não gostar?</strong>
                <br />Sim, oferecemos 7 dias para trocas ou devoluções grátis.
              </p>
            </PdpAccordion>
          </div>
        </section>
      </div>

      <section className="pdp-combina-section">
        <div className="pdp-combina-inner">
          <div className="pdp-combina-heading">
            <p>Aproveite e complete seu look</p>
            <h2>COMBINA COM VOCÊ</h2>
          </div>
          <div className="featured-products-grid pdp-combina-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function PdpAccordion({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`pdp-accordion ${open ? "active" : ""}`}>
      <button
        className="pdp-accordion-trigger"
        type="button"
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      {open && <div className="pdp-accordion-content">{children}</div>}
    </div>
  );
}
