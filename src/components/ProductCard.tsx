import { Link } from "@tanstack/react-router";
import { currency, type Product } from "@/lib/catalog";
import { useShop } from "@/store/shop";

interface Props {
  product: Product;
  variant?: "featured" | "grid";
}

export function ProductCard({ product, variant = "featured" }: Props) {
  const addToCart = useShop((s) => s.addToCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const inWishlist = useShop((s) => s.wishlist.includes(product.id));
  const saving = product.oldPrice ? product.oldPrice - product.price : 0;

  if (variant === "featured") {
    return (
      <article className="featured-product-card">
        <Link
          className="featured-product-media"
          to="/produto/$id"
          params={{ id: String(product.id) }}
          aria-label={`Ver ${product.name}`}
        >
          <span className="featured-product-badge">{product.tag}</span>
          <button
            className={`featured-product-heart ${inWishlist ? "active" : ""}`}
            type="button"
            aria-label={`Favoritar ${product.name}`}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
          >
            {inWishlist ? "♥" : "♡"}
          </button>
          <img src={product.image} alt={product.imageAlt} loading="lazy" decoding="async" />
        </Link>
        <div className="featured-product-info">
          <span>{product.sku}</span>
          <h3>
            <Link to="/produto/$id" params={{ id: String(product.id) }}>
              {product.name}
            </Link>
          </h3>
          {product.oldPrice && (
            <p className="featured-product-old-price">
              {currency.format(product.oldPrice)}{" "}
              {product.discount ? <b>{product.discount}%</b> : null}
            </p>
          )}
          <strong className="featured-product-price">{currency.format(product.price)}</strong>
          <small>
            {saving > 0 ? `${currency.format(saving)} de economia` : "Novidade selecionada"}
          </small>
          <button
            className="featured-product-buy"
            type="button"
            onClick={() => addToCart(product.id)}
          >
            Comprar
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="product-card">
      <div className="product-media">
        <span className={`tag${product.discount ? " sale" : ""}`}>{product.tag}</span>
        <button
          className={`wishlist ${inWishlist ? "active" : ""}`}
          type="button"
          aria-label={`Favoritar ${product.name}`}
          onClick={() => toggleWishlist(product.id)}
        >
          {inWishlist ? "♥" : "♡"}
        </button>
        <Link to="/produto/$id" params={{ id: String(product.id) }}>
          <img src={product.image} alt={product.imageAlt} loading="lazy" decoding="async" />
        </Link>
      </div>
      <div className="product-info">
        <span className="product-sku">{product.sku}</span>
        <h3 className="product-name">
          <Link to="/produto/$id" params={{ id: String(product.id) }}>
            {product.name}
          </Link>
        </h3>
        <div className="price-row">
          {product.oldPrice && (
            <span className="old-price">{currency.format(product.oldPrice)}</span>
          )}
          {product.discount && <span className="discount">{product.discount}%</span>}
        </div>
        <strong className="price">{currency.format(product.price)}</strong>
        <p className="saving">
          {saving > 0 ? `${currency.format(saving)} de economia` : "Novidade selecionada"}
        </p>
        <button
          className="add-cart"
          type="button"
          onClick={() => addToCart(product.id)}
        >
          Comprar
        </button>
      </div>
    </article>
  );
}
