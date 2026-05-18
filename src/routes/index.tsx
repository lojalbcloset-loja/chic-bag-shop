import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { homeProducts, allProducts, type Category } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import slider1 from "@/assets/images/Slider-1.jpg";
import slider2 from "@/assets/images/Slider-2.jpg";
import slider3 from "@/assets/images/Slider-3.jpg";
import tileBolsas from "@/assets/images/01 - bolsas.jpg";
import tileCarteiras from "@/assets/images/02 - carteiras.jpg";
import tileBones from "@/assets/images/03 - bones.jpg";
import tileCintos from "@/assets/images/04 - cintos.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const heroSlides = [
  { src: slider1, alt: "Banner principal Lb Closet", to: "/loja", search: { category: "Liqui" } },
  { src: slider2, alt: "Banner secundário Lb Closet", to: "/loja", search: {} },
  { src: slider3, alt: "Banner categoria Lb Closet", to: "/loja", search: { category: "Bolsas" } },
];

const categoryTiles: Array<{ label: string; img: string; cat: Category; dark?: boolean }> = [
  { label: "Bolsas", img: tileBolsas, cat: "Bolsas" },
  { label: "Carteiras", img: tileCarteiras, cat: "Carteiras" },
  { label: "Bonés", img: tileBones, cat: "Bonés", dark: true },
  { label: "Cintos", img: tileCintos, cat: "Cintos" },
];

function HomePage() {
  const [hero, setHero] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHero((i) => (i + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, []);

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
            search={{ category: t.cat }}
          >
            <span>{t.label}</span>
            <img src={t.img} alt={`Destaque de ${t.label.toLowerCase()}`} loading="lazy" decoding="async" />
          </Link>
        ))}
      </section>

      {(["Bolsas", "Carteiras", "Cintos", "Bonés"] as Category[]).map((cat) => (
        <CategorySection key={cat} category={cat} />
      ))}
    </main>
  );
}

function CategorySection({ category }: { category: Category }) {
  const products = allProducts.filter((p) => p.category === category).slice(0, 8);
  const idMap: Record<Category, string> = {
    Bolsas: "secao-bolsas",
    Carteiras: "secao-carteiras",
    Cintos: "secao-cintos",
    Bonés: "secao-bones",
  };
  return (
    <section
      id={idMap[category]}
      className="featured-products"
      aria-labelledby={`featured-${category}`}
    >
      <div className="featured-products-inner">
        <div className="featured-products-heading">
          <p>Seleção especial</p>
          <h2 id={`featured-${category}`}>{category}</h2>
        </div>
        <div className="featured-products-grid">
          {products.length > 0
            ? products.map((p) => <ProductCard key={p.id} product={p} />)
            : homeProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
