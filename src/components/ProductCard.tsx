import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  currency,
  defaultVariant,
  discountPercent,
  displayComparePriceCents,
  displayPriceCents,
  primaryImage,
  productTag,
  type DbProduct,
} from "@/lib/products";
import { useShop } from "@/store/shop";

interface Props {
  product: DbProduct;
  variant?: "featured" | "grid";
}

export function ProductCard({ product, variant = "featured" }: Props) {
  const addToCart = useShop((s) => s.addToCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const inWishlist = useShop((s) => s.wishlist.includes(product.id));
  const priceCents = displayPriceCents(product);
  const compareCents = displayComparePriceCents(product);
  const discount = discountPercent(product);
  const saving = compareCents ? (compareCents - priceCents) / 100 : 0;
  const img = primaryImage(product);
  const tag = productTag(product);
  const def = defaultVariant(product);

  function handleAdd() {
    if (!def) {
      toast.error("Produto sem variante disponível");
      return;
    }
    addToCart(def.id);
  }

  const linkProps = {
    to: "/produto/$slug" as const,
    params: { slug: product.slug },
  };

  if (variant === "featured") {
    return (
      <article className="featured-product-card">
        <Link
          className="featured-product-media"
          {...linkProps}
          aria-label={`Ver ${product.name}`}
        >
          <span className="featured-product-badge">{tag}</span>
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
          {img && <img src={img.url} alt={img.alt ?? product.name} loading="lazy" decoding="async" />}
        </Link>
        <div className="featured-product-info">
          <span>{product.sku_base ?? def?.sku ?? ""}</span>
          <h3>
            <Link {...linkProps}>{product.name}</Link>
          </h3>
          {compareCents && (
            <p className="featured-product-old-price">
              {currency.format(compareCents / 100)}{" "}
              {discount > 0 ? <b>{discount}%</b> : null}
            </p>
          )}
          <strong className="featured-product-price">{currency.format(priceCents / 100)}</strong>
          <small>
            {saving > 0 ? `${currency.format(saving)} de economia` : "Novidade selecionada"}
          </small>
          <button className="featured-product-buy" type="button" onClick={handleAdd}>
            Comprar
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="product-card">
      <div className="product-media">
        <span className={`tag${discount > 0 ? " sale" : ""}`}>{tag}</span>
        <button
          className={`wishlist ${inWishlist ? "active" : ""}`}
          type="button"
          aria-label={`Favoritar ${product.name}`}
          onClick={() => toggleWishlist(product.id)}
        >
          {inWishlist ? "♥" : "♡"}
        </button>
        <Link {...linkProps}>
          {img && <img src={img.url} alt={img.alt ?? product.name} loading="lazy" decoding="async" />}
        </Link>
      </div>
      <div className="product-info">
        <span className="product-sku">{product.sku_base ?? def?.sku ?? ""}</span>
        <h3 className="product-name">
          <Link {...linkProps}>{product.name}</Link>
        </h3>
        <div className="price-row">
          {compareCents && (
            <span className="old-price">{currency.format(compareCents / 100)}</span>
          )}
          {discount > 0 && <span className="discount">{discount}%</span>}
        </div>
        <strong className="price">{currency.format(priceCents / 100)}</strong>
        <p className="saving">
          {saving > 0 ? `${currency.format(saving)} de economia` : "Novidade selecionada"}
        </p>
        <button className="add-cart" type="button" onClick={handleAdd}>
          Comprar
        </button>
      </div>
    </article>
  );
}
