import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import slider1 from "@/assets/images/Slider-1.jpg";
import slider2 from "@/assets/images/Slider-2.jpg";
import slider3 from "@/assets/images/Slider-3.jpg";
import tileBolsas from "@/assets/images/01 - bolsas.jpg";
import tileCarteiras from "@/assets/images/02 - carteiras.jpg";
import tileBones from "@/assets/images/03 - bones.jpg";
import tileCintos from "@/assets/images/04 - cintos.jpg";
import { ProductCard } from "@/components/ProductCard";
import { productsQuery } from "@/lib/products";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQuery());
  },
  component: HomePage,
});

const heroSlides = [
  { src: slider1, alt: "Banner principal Lb Closet", to: "/loja" as const, search: {} },
  { src: slider2, alt: "Banner secundário Lb Closet", to: "/loja" as const, search: {} },
  { src: slider3, alt: "Banner categoria Lb Closet", to: "/loja" as const, search: { category: "bolsas" } },
];

const categoryTiles = [
  { label: "Bolsas", img: tileBolsas, slug: "bolsas" },
  { label: "Carteiras", img: tileCarteiras, slug: "carteiras" },
  { label: "Bonés", img: tileBones, slug: "bones", dark: true },
  { label: "Cintos", img: tileCintos, slug: "cintos" },
];

function HomePage() {
  const [hero, setHero] = useState(0);
  const { data: products = [] } = useQuery(productsQuery());
  useEffect(() => {
    const t = setInterval(() => setHero((i) => (i + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, []);

  const featured = products.filter((p) => p.is_featured).slice(0, 8);

  return (
    <main id="top">
      <section className="wj-hero" aria-label="Destaques Lb Closet">
        <div className="hero-slider">
          {heroSlides.map((s, i) => (
            <article key={i} className={`hero-slide ${i === hero ? "active" : ""}`}>
              <Link to={s.to} search={s.search} aria-label={s.alt}>
                <img
                  src={s.src}
                  alt={s.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding={i === 0 ? "sync" : "async"}
                  fetchPriority={i === 0 ? "high" : "low"}
                />
              </Link>
            </article>
          ))}
        </div>
        <button
          className="hero-arrow hero-prev"
          type="button"
          aria-label="Banner anterior"
          onClick={() => setHero((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
        >
          ‹
        </button>
        <button
          className="hero-arrow hero-next"
          type="button"
          aria-label="Próximo banner"
          onClick={() => setHero((i) => (i + 1) % heroSlides.length)}
        >
          ›
        </button>
        <div className="hero-dots">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === hero ? "active" : ""}
              aria-label={`Ir para slide ${i + 1}`}
              onClick={() => setHero(i)}
            />
          ))}
        </div>
      </section>

      <section className="collection-feature" aria-label="Conheça nossa coleção">
        <div className="collection-video">
          <video
            src="https://s.wjstore.com.br/images/site-inverno-26.mp4"
            autoPlay
            muted
            playsInline
            loop
            preload="metadata"
          />
        </div>
        <Link className="collection-callout" to="/loja">
          <span></span>
          <strong>
            CONHEÇA NOSSA
            <br />
            <b>COLEÇÃO</b>
          </strong>
          <span></span>
        </Link>
      </section>

      <section className="category-showcase" aria-label="Destaques por categoria">
        {categoryTiles.map((t) => (
          <Link
            key={t.label}
            className={`category-tile ${t.dark ? "category-tile-dark" : ""}`}
            to="/loja"
            search={{ category: t.slug }}
          >
            <span>{t.label}</span>
            <img src={t.img} alt={`Destaque de ${t.label.toLowerCase()}`} loading="lazy" decoding="async" />
          </Link>
        ))}
      </section>

      {featured.length > 0 && (
        <section className="featured-products" aria-labelledby="featured-destaques">
          <div className="featured-products-inner">
            <div className="featured-products-heading">
              <p>Seleção especial</p>
              <h2 id="featured-destaques">DESTAQUES</h2>
            </div>
            <div className="featured-products-grid">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {products.length === 0 && (
        <section style={{ padding: "80px 20px", textAlign: "center" }}>
          <h2>Nenhum produto cadastrado ainda</h2>
          <p style={{ color: "#999", marginTop: 12 }}>
            Acesse o <Link to="/admin" style={{ textDecoration: "underline" }}>painel</Link> para adicionar seus primeiros produtos.
          </p>
        </section>
      )}
    </main>
  );
}
