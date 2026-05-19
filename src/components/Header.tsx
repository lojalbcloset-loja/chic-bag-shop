import { Link } from "@tanstack/react-router";
import { useShop } from "@/store/shop";
import logoUrl from "@/assets/images/logo/logo-lbcloset-oficial.png";

export function Header() {
  const cart = useShop((s) => s.cart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setLoginOpen = useShop((s) => s.setLoginOpen);
  const setMenuOpen = useShop((s) => s.setMenuOpen);
  const setSearchOpen = useShop((s) => s.setSearchOpen);
  const searchOpen = useShop((s) => s.searchOpen);
  const count = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Navegação principal">
        <button
          className="nav-icon mobile-only"
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen(true)}
        >
          <span></span><span></span><span></span>
        </button>
        <Link to="/" className="brand" aria-label="Lb Closet início">
          <img src={logoUrl} alt="Lb Closet Logo" className="header-logo-img" />
        </Link>
        <div className="nav-links">
          <Link to="/loja">Loja</Link>
          <Link to="/loja" search={{ category: "Bolsas" }}>Bolsa</Link>
          <Link to="/loja" search={{ category: "Carteiras" }}>Carteiras</Link>
          <Link to="/loja" search={{ category: "Cintos" }}>Cintos</Link>
          <Link to="/loja" search={{ category: "Bonés" }}>Bonés</Link>
          <Link to="/loja" search={{ category: "Liqui" }} className="promo-nav">
            Promoções
          </Link>
        </div>
        <div className="nav-actions">
          <button
            className="search-word"
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            O que você procura?
          </button>
          <button
            className="icon-button search-toggle"
            type="button"
            aria-label="Abrir busca"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5"></circle>
              <path d="m15.5 15.5 5 5"></path>
            </svg>
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Entrar na conta"
            onClick={() => setLoginOpen(true)}
          >
            <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="7.5" r="4"></circle>
              <path d="M4.5 21c1.2-4.4 4-6.6 7.5-6.6s6.3 2.2 7.5 6.6"></path>
            </svg>
          </button>
          <button
            className="cart-button"
            type="button"
            aria-label="Abrir sacola"
            onClick={() => setCartOpen(true)}
          >
            <svg className="nav-svg nav-bag" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.5 8.5h11l1.2 12h-13.4l1.2-12Z"></path>
              <path d="M9 8.5V6a3 3 0 0 1 6 0v2.5"></path>
            </svg>
            <span className="cart-count">{count}</span>
          </button>
        </div>
      </nav>
      <SearchPanel />
      <MobileMenu />
    </header>
  );
}

function SearchPanel() {
  const open = useShop((s) => s.searchOpen);
  const setOpen = useShop((s) => s.setSearchOpen);
  return (
    <form
      className={`search-panel ${open ? "open" : ""}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const value = (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value;
        window.location.href = `/loja?search=${encodeURIComponent(value)}`;
        setOpen(false);
      }}
    >
      <label htmlFor="search">Buscar produto</label>
      <input id="search" name="search" type="search" placeholder="BOLSA TRANSVERSAL PRETA" />
    </form>
  );
}

function MobileMenu() {
  const open = useShop((s) => s.menuOpen);
  const close = () => useShop.getState().setMenuOpen(false);
  return (
    <aside className={`mobile-menu ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="mobile-menu-header">
        <strong>Menu</strong>
        <button type="button" aria-label="Fechar menu" onClick={close}>×</button>
      </div>
      <Link to="/loja" search={{ category: "Liqui" }} onClick={close}>Sale</Link>
      <Link to="/loja" onClick={close}>Loja</Link>
      <Link to="/loja" search={{ category: "Bolsas" }} onClick={close}>Bolsas</Link>
      <Link to="/loja" search={{ category: "Carteiras" }} onClick={close}>Carteiras</Link>
      <Link to="/loja" search={{ category: "Cintos" }} onClick={close}>Cintos</Link>
      <Link to="/loja" search={{ category: "Bonés" }} onClick={close}>Bonés</Link>
    </aside>
  );
}
