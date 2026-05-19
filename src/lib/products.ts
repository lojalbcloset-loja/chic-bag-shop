import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbVariant {
  id: string;
  sku: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock: number;
  is_active: boolean;
  color: { id: string; name: string; hex: string } | null;
  size: { id: string; name: string } | null;
}

export interface DbImage {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  variant_id: string | null;
}

export interface DbProduct {
  id: string;
  slug: string;
  sku_base: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  is_active: boolean;
  is_featured: boolean;
  category: { id: string; name: string; slug: string } | null;
  material: { id: string; name: string } | null;
  variants: DbVariant[];
  images: DbImage[];
  tags: { tag: string }[];
}

const PRODUCT_SELECT = `
  id, slug, sku_base, name, description, brand, is_active, is_featured,
  category:categories(id, name, slug),
  material:materials(id, name),
  variants:product_variants(id, sku, price_cents, compare_at_price_cents, stock, is_active,
    color:colors(id, name, hex),
    size:sizes(id, name)),
  images:product_images(id, url, alt, sort_order, is_primary, variant_id),
  tags:product_tags(tag)
`;

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function activeVariants(p: DbProduct): DbVariant[] {
  return (p.variants ?? []).filter((v) => v.is_active);
}

export function defaultVariant(p: DbProduct): DbVariant | undefined {
  const a = activeVariants(p);
  return a.find((v) => v.stock > 0) ?? a[0];
}

export function displayPriceCents(p: DbProduct): number {
  const v = defaultVariant(p);
  return v?.price_cents ?? 0;
}

export function displayComparePriceCents(p: DbProduct): number | null {
  const v = defaultVariant(p);
  return v?.compare_at_price_cents ?? null;
}

export function discountPercent(p: DbProduct): number {
  const price = displayPriceCents(p);
  const compare = displayComparePriceCents(p);
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export function primaryImage(p: DbProduct): DbImage | undefined {
  const imgs = [...(p.images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
  return imgs[0];
}

export function imagesFor(p: DbProduct, variantId?: string | null): DbImage[] {
  const all = [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  if (variantId) {
    const vimg = all.filter((i) => i.variant_id === variantId);
    if (vimg.length) return vimg;
  }
  return all;
}

export function productTag(p: DbProduct): string {
  const tags = (p.tags ?? []).map((t) => t.tag);
  if (tags.includes("liquidacao")) return "LIQUIDAÇÃO";
  if (p.is_featured) return "DESTAQUE";
  if (discountPercent(p) > 0) return "PROMOÇÃO";
  return "NOVIDADES";
}

async function loadAllProducts(): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DbProduct[];
}

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products", "active"],
    queryFn: loadAllProducts,
    staleTime: 60_000,
  });

export async function loadProductBySlug(slug: string): Promise<DbProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as DbProduct) ?? null;
}

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => loadProductBySlug(slug),
    staleTime: 60_000,
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
