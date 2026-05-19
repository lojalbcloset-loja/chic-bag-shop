import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  categoriesQuery,
  displayPriceCents,
  productsQuery,
  type DbProduct,
} from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

type LojaSearch = {
  category?: string;
  color?: string;
  material?: string;
  search?: string;
};

export const Route = createFileRoute("/loja")({
  validateSearch: (s: Record<string, unknown>): LojaSearch => ({
    category: typeof s.category === "string" ? s.category : undefined,
    color: typeof s.color === "string" ? s.color : undefined,
    material: typeof s.material === "string" ? s.material : undefined,
    search: typeof s.search === "string" ? s.search : undefined,
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
  },
  head: () => ({
    meta: [
      { title: "Loja | Lb Closet" },
      {
        name: "description",
        content:
          "Explore a coleção completa da Lb Closet. Filtre por categorias, cores e preços em uma experiência de compra premium.",
      },
    ],
  }),
  component: LojaPage,
});

const PER_PAGE = 12;

function LojaPage() {
  const search = Route.useSearch();
  const { data: products = [] } = useQuery(productsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());

  const [category, setCategory] = useState(search.category ?? "");
  const [color, setColor] = useState(search.color ?? "");
  const [materials, setMaterials] = useState<string[]>(search.material ? [search.material] : []);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("featured");
  const [text, setText] = useState(search.search ?? "");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const colorOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of products)
      for (const v of p.variants ?? [])
        if (v.color) set.set(v.color.name, v.color.name);
    return Array.from(set.values());
  }, [products]);

  const materialOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.material) set.add(p.material.name);
    return Array.from(set.values());
  }, [products]);

  const filtered = useMemo(() => {
    const lower = text.toLowerCase();
    const minN = min ? Number(min) : undefined;
    const maxN = max ? Number(max) : undefined;
    const list = products.filter((p) => {
      if (category && p.category?.slug !== category) return false;
      if (color && !p.variants.some((v) => v.color?.name === color)) return false;
      if (materials.length && !materials.includes(p.material?.name ?? "")) return false;
      const price = displayPriceCents(p) / 100;
      if (minN !== undefined && price < minN) return false;
      if (maxN !== undefined && price > maxN) return false;
      if (lower) {
        const hay = `${p.name} ${p.sku_base ?? ""} ${p.category?.name ?? ""}`.toLowerCase();
        if (!hay.includes(lower)) return false;
      }
      return true;
    });
    return [...list].sort((a: DbProduct, b: DbProduct) => {
      if (sort === "priceAsc") return displayPriceCents(a) - displayPriceCents(b);
      if (sort === "priceDesc") return displayPriceCents(b) - displayPriceCents(a);
      if (sort === "featured") return Number(b.is_featured) - Number(a.is_featured);
      return 0;
    });
  }, [products, category, color, materials, min, max, sort, text]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function toggleMaterial(m: string) {
    setMaterials((mm) => (mm.includes(m) ? mm.filter((x) => x !== m) : [...mm, m]));
    setPage(1);
  }

  return (
    <main id="top" className="store-main-container">
      <h1 className="store-page-title">LOJA</h1>
      <div className="store-breadcrumbs">
        <Link to="/">INÍCIO</Link> / <span>LOJA</span>
      </div>

      <div className="store-layout-grid">
        <aside className={`store-sidebar ${filtersOpen ? "open" : ""}`}>
          <div className="sidebar-header mobile-only">
            <strong>FILTRO</strong>
            <button type="button" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)}>
              ×
            </button>
          </div>
          <h2 className="sidebar-title">FILTRO</h2>

          {categories.length > 0 && (
            <FilterAccordion label="CATEGORIAS">
              <div className="filter-tags-grid">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`filter-tag ${category === c.slug ? "active" : ""}`}
                    onClick={() => {
                      setCategory(category === c.slug ? "" : c.slug);
                      setPage(1);
                    }}
                  >
                    {c.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </FilterAccordion>
          )}

          {colorOptions.length > 0 && (
            <FilterAccordion label="COR">
              <div className="filter-tags-grid">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`filter-tag ${color === c ? "active" : ""}`}
                    onClick={() => {
                      setColor(color === c ? "" : c);
                      setPage(1);
                    }}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </FilterAccordion>
          )}

          {materialOptions.length > 0 && (
            <FilterAccordion label="MATERIAL">
              <div className="filter-tags-grid">
                {materialOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`filter-tag ${materials.includes(m) ? "active" : ""}`}
                    onClick={() => toggleMaterial(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </FilterAccordion>
          )}

          <FilterAccordion label="PREÇO">
            <div className="filter-price-range">
              <div className="price-inputs-row">
                <input
                  type="number"
                  placeholder="Min"
                  className="price-input"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  aria-label="Preço mínimo"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="price-input"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  aria-label="Preço máximo"
                />
              </div>
              <button type="button" className="price-apply-btn" onClick={() => setPage(1)}>
                FILTRAR
              </button>
            </div>
          </FilterAccordion>
        </aside>

        <div className="store-content-area">
          <div className="store-toolbar">
            <div className="store-item-count">{filtered.length} ITENS</div>
            <button
              className="mobile-only filter-toggle-btn"
              type="button"
              onClick={() => setFiltersOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h12M4 18h8" />
              </svg>
              FILTRAR
            </button>
            <div className="store-sorting">
              <label htmlFor="sort-select">CLASSIFICAR POR:</label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">MAIOR RELEVÂNCIA</option>
                <option value="priceAsc">MENOR PREÇO</option>
                <option value="priceDesc">MAIOR PREÇO</option>
              </select>
            </div>
          </div>

          <div className="product-grid" data-product-grid>
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} variant="grid" />
            ))}
            {visible.length === 0 && (
              <p style={{ padding: "40px 0", color: "#999" }}>
                {text || category || color || materials.length
                  ? "Nenhum produto encontrado com esses filtros."
                  : "Catálogo vazio. Cadastre produtos no painel administrativo."}
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ display: "flex", justifyContent: "center", gap: 8, padding: "40px 0" }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i + 1)}
                  style={{
                    width: 36,
                    height: 36,
                    border: "1px solid #ddd",
                    background: currentPage === i + 1 ? "#66504a" : "#fff",
                    color: currentPage === i + 1 ? "#fff" : "#66504a",
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* hidden controlled search */}
      <input type="hidden" value={text} onChange={(e) => setText(e.target.value)} />
    </main>
  );
}

function FilterAccordion({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`filter-accordion ${open ? "active" : ""}`}>
      <button
        className="filter-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <svg className="chevron" viewBox="0 0 24 24" width="16" height="16">
          <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
        </svg>
      </button>
      <div className="filter-content">{children}</div>
    </div>
  );
}
