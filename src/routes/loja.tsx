import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { allProducts, filterProducts, type FilterState } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

type LojaSearch = {
  category?: string;
  color?: string;
  size?: string;
  material?: string;
  search?: string;
};

export const Route = createFileRoute("/loja")({
  validateSearch: (s: Record<string, unknown>): LojaSearch => ({
    category: typeof s.category === "string" ? s.category : undefined,
    color: typeof s.color === "string" ? s.color : undefined,
    size: typeof s.size === "string" ? s.size : undefined,
    material: typeof s.material === "string" ? s.material : undefined,
    search: typeof s.search === "string" ? s.search : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Loja | Lb Closet" },
      {
        name: "description",
        content:
          "Explore a coleção completa da Lb Closet. Filtre por categorias, cores, tamanhos e preços em uma experiência de compra premium.",
      },
    ],
  }),
  component: LojaPage,
});

const PER_PAGE = 8;

function LojaPage() {
  const search = Route.useSearch();
  const [filters, setFilters] = useState<FilterState>({
    category: search.category ?? "",
    color: search.color ?? "",
    size: search.size ?? "",
    materials: search.material ? [search.material] : [],
    min: "",
    max: "",
    sort: "featured",
    search: search.search ?? "",
  });
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => filterProducts(allProducts, filters), [filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function toggleCategory(c: string) {
    setFilters((f) => ({ ...f, category: f.category === c ? "" : c }));
    setPage(1);
  }
  function toggleColor(c: string) {
    setFilters((f) => ({ ...f, color: f.color === c ? "" : c }));
    setPage(1);
  }
  function toggleSize(s: string) {
    setFilters((f) => ({ ...f, size: f.size === s ? "" : s }));
    setPage(1);
  }
  function toggleMaterial(m: string) {
    setFilters((f) => ({
      ...f,
      materials: f.materials.includes(m)
        ? f.materials.filter((x) => x !== m)
        : [...f.materials, m],
    }));
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

          <FilterAccordion label="CATEGORIAS">
            <div className="filter-tags-grid">
              {["Bolsas", "Carteiras", "Cintos", "Bonés"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`filter-tag ${filters.category === c ? "active" : ""}`}
                  onClick={() => toggleCategory(c)}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </FilterAccordion>

          <FilterAccordion label="COR">
            <div className="filter-tags-grid">
              {["Preto", "Caramelo", "Marrom", "Off White"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`filter-tag ${filters.color === c ? "active" : ""}`}
                  onClick={() => toggleColor(c)}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </FilterAccordion>

          <FilterAccordion label="TAMANHO">
            <div className="filter-tags-grid size-grid">
              <button
                type="button"
                className={`filter-tag size-pill ${filters.size === "UN" ? "active" : ""}`}
                onClick={() => toggleSize("UN")}
              >
                UN
              </button>
            </div>
          </FilterAccordion>

          <FilterAccordion label="GRUPO">
            <div className="filter-tags-grid">
              {[
                { mat: "Couro", label: "Bolsas Couro" },
                { mat: "Camurça", label: "Bolsas Camurça" },
                { mat: "Algodão", label: "Bolsas Algodão" },
              ].map((g) => (
                <button
                  key={g.mat}
                  type="button"
                  className={`filter-tag ${filters.materials.includes(g.mat) ? "active" : ""}`}
                  onClick={() => toggleMaterial(g.mat)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </FilterAccordion>

          <FilterAccordion label="PREÇO">
            <div className="filter-price-range">
              <div className="price-inputs-row">
                <input
                  type="number"
                  placeholder="Min"
                  className="price-input"
                  value={filters.min}
                  onChange={(e) => setFilters((f) => ({ ...f, min: e.target.value }))}
                  aria-label="Preço mínimo"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="price-input"
                  value={filters.max}
                  onChange={(e) => setFilters((f) => ({ ...f, max: e.target.value }))}
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
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              >
                <option value="featured">MAIOR RELEVÂNCIA</option>
                <option value="priceAsc">MENOR PREÇO</option>
                <option value="priceDesc">MAIOR PREÇO</option>
                <option value="discount">MAIOR DESCONTO</option>
                <option value="new">NOVIDADES</option>
              </select>
            </div>
          </div>

          <div className="product-grid" data-product-grid>
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} variant="grid" />
            ))}
            {visible.length === 0 && (
              <p style={{ padding: "40px 0", color: "#999" }}>Nenhum produto encontrado.</p>
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
