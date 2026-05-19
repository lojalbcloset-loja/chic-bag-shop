import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  currency,
  defaultVariant,
  discountPercent,
  imagesFor,
  productBySlugQuery,
  productsQuery,
  productTag,
  type DbProduct,
  type DbVariant,
} from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/store/shop";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData(
      productBySlugQuery(params.slug),
    );
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.product
      ? [
          { title: `${loaderData.product.name} | Lb Closet` },
          { name: "description", content: loaderData.product.description ?? "Produto Lb Closet" },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:image", content: loaderData.product.images?.[0]?.url ?? "" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div style={{ padding: 60, textAlign: "center" }}>
      <h1>Produto não encontrado</h1>
      <Link to="/loja" style={{ textDecoration: "underline" }}>Voltar à loja</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div style={{ padding: 60, textAlign: "center" }}>
      <h1>Erro ao carregar produto</h1>
      <p>{error.message}</p>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productBySlugQuery(slug));
  if (!product) return null;
  return <ProductView product={product} />;
}

function ProductView({ product }: { product: DbProduct }) {
  const addToCart = useShop((s) => s.addToCart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const [variantId, setVariantId] = useState<string>(() => defaultVariant(product)?.id ?? "");
  const [cep, setCep] = useState("");
  const [shippingMsg, setShippingMsg] = useState<string | null>(null);

  useEffect(() => {
    setVariantId(defaultVariant(product)?.id ?? "");
  }, [product]);

  const selected: DbVariant | undefined =
    product.variants.find((v) => v.id === variantId) ?? defaultVariant(product);
  const priceCents = selected?.price_cents ?? 0;
  const compareCents = selected?.compare_at_price_cents ?? null;
  const discount = discountPercent(product);
  const installments = (priceCents / 100 / 10).toFixed(2).replace(".", ",");
  const images = imagesFor(product, variantId);
  const tag = productTag(product);

  const colorOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; hex: string; variantId: string }>();
    for (const v of product.variants) {
      if (v.is_active && v.color && !map.has(v.color.id)) {
        map.set(v.color.id, { ...v.color, variantId: v.id });
      }
    }
    return Array.from(map.values());
  }, [product]);

  const sizeOptions = useMemo(() => {
    const colorId = selected?.color?.id;
    const opts: { id: string; name: string; variantId: string; stock: number }[] = [];
    for (const v of product.variants) {
      if (!v.is_active || !v.size) continue;
      if (colorId && v.color?.id !== colorId) continue;
      opts.push({ ...v.size, variantId: v.id, stock: v.stock });
    }
    return opts;
  }, [product, selected]);

  const { data: all = [] } = useQuery(productsQuery());
  const related = all
    .filter((p) => p.id !== product.id && p.category?.id === product.category?.id)
    .slice(0, 4);

  function handleBuy() {
    if (!selected) return;
    addToCart(selected.id, 1, false);
    setCartOpen(true);
  }

  function calcShipping() {
    if (!/^\d{5}-?\d{3}$/.test(cep)) {
      setShippingMsg("Informe um CEP válido.");
      return;
    }
    setShippingMsg(
      `PAC: ${currency.format(24.9)} • 6 a 9 dias úteis\nSEDEX: ${currency.format(42.5)} • 2 a 4 dias úteis\n(Estimativa demonstrativa — frete real será calculado no checkout)`,
    );
  }

  return (
    <main id="top">
      <nav className="pdp-breadcrumbs" aria-label="Caminho de navegação">
        <Link to="/">INÍCIO</Link> / <Link to="/loja">LOJA</Link>
        {product.category && (
          <>
            {" / "}
            <Link to="/loja" search={{ category: product.category.slug }}>
              {product.category.name.toUpperCase()}
            </Link>
          </>
        )}
      </nav>

      <div className="pdp-container">
        <section className="pdp-gallery" aria-label="Galeria de imagens do produto">
          <div className="pdp-thumb-strip">
            {images.map((im) => (
              <button
                key={im.id}
                type="button"
                style={{ border: "1px solid #66504a", padding: 4, background: "#fff" }}
              >
                <img src={im.url} alt={im.alt ?? product.name} style={{ width: 64, height: 64, objectFit: "contain" }} />
              </button>
            ))}
          </div>
          <div className="pdp-main-image-container">
            {images[0] && (
              <img
                src={images[0].url}
                alt={images[0].alt ?? product.name}
                style={{ width: "100%", maxWidth: 560, objectFit: "contain" }}
              />
            )}
          </div>
        </section>

        <section className="pdp-info-box" aria-label="Detalhes de compra do produto">
          <span className="pdp-badge">{tag}</span>
          <h1 className="pdp-title">{product.name}</h1>
          <span className="pdp-sku">SKU: {selected?.sku ?? product.sku_base ?? ""}</span>

          <div className="pdp-price-box">
            {compareCents && (
              <div className="pdp-old-price-row">
                <span style={{ textDecoration: "line-through", color: "#999" }}>
                  {currency.format(compareCents / 100)}
                </span>{" "}
                {discount > 0 && <strong style={{ color: "#c8102e" }}>{discount}% OFF</strong>}
              </div>
            )}
            <div className="pdp-price">{currency.format(priceCents / 100)}</div>
            <div className="pdp-installments">ou 10x de R$ {installments} sem juros</div>
          </div>

          {colorOptions.length > 0 && (
            <div className="pdp-options-section">
              <span className="pdp-option-label">Cor</span>
              <div className="pdp-colors-row" style={{ display: "flex", gap: 8 }}>
                {colorOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setVariantId(c.variantId)}
                    style={{
                      padding: "6px 14px",
                      border: selected?.color?.id === c.id ? "2px solid #66504a" : "1px solid #ddd",
                      background: "#fff",
                      fontSize: 12,
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div className="pdp-options-section">
              <span className="pdp-option-label">Tamanho</span>
              <div className="pdp-size-row">
                {sizeOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setVariantId(s.variantId)}
                    disabled={s.stock <= 0}
                    className={`pdp-size-chip ${variantId === s.variantId ? "active" : ""}`}
                    style={s.stock <= 0 ? { opacity: 0.4 } : undefined}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pdp-actions-row">
            <button className="pdp-buy-btn" type="button" onClick={handleBuy} disabled={!selected || selected.stock <= 0}>
              {selected && selected.stock > 0 ? "COMPRAR" : "INDISPONÍVEL"}
            </button>
            <button
              className="pdp-bag-btn"
              type="button"
              onClick={() => selected && addToCart(selected.id)}
              disabled={!selected || selected.stock <= 0}
            >
              ADICIONAR NA SACOLA
            </button>
            <a
              className="pdp-whatsapp-btn"
              href={`https://wa.me/5562985388100?text=${encodeURIComponent(
                `Olá! Tenho interesse no produto ${product.name} (SKU ${selected?.sku ?? ""}).`,
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
                {product.material && <li>Material: {product.material.name}</li>}
                {selected?.color && <li>Cor: {selected.color.name}</li>}
                {product.category && <li>Categoria: {product.category.name}</li>}
                {selected && <li>SKU: {selected.sku}</li>}
                {product.brand && <li>Marca: {product.brand}</li>}
              </ul>
            </PdpAccordion>
          </div>
        </section>
      </div>

      {related.length > 0 && (
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
      )}
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
