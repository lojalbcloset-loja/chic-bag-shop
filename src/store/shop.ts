import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DbProduct, DbVariant } from "@/lib/products";

export interface CartItem {
  variantId: string;
  quantity: number;
}

export interface CartLine extends CartItem {
  product: DbProduct;
  variant: DbVariant;
}

interface ShopState {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (variantId: string, qty?: number, open?: boolean) => void;
  removeFromCart: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  replaceCart: (items: CartItem[]) => void;
  toggleWishlist: (productId: string) => void;
  cartOpen: boolean;
  loginOpen: boolean;
  menuOpen: boolean;
  searchOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setLoginOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      cartOpen: false,
      loginOpen: false,
      menuOpen: false,
      searchOpen: false,
      addToCart: (variantId, qty = 1, open = true) =>
        set((s) => {
          const exists = s.cart.find((c) => c.variantId === variantId);
          const cart = exists
            ? s.cart.map((c) =>
                c.variantId === variantId ? { ...c, quantity: c.quantity + qty } : c,
              )
            : [...s.cart, { variantId, quantity: qty }];
          return { cart, cartOpen: open ? true : s.cartOpen };
        }),
      removeFromCart: (variantId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.variantId !== variantId) })),
      updateQty: (variantId, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((c) => c.variantId !== variantId)
              : s.cart.map((c) =>
                  c.variantId === variantId ? { ...c, quantity: qty } : c,
                ),
        })),
      clearCart: () => set({ cart: [] }),
      replaceCart: (items) => set({ cart: items }),
      toggleWishlist: (productId) =>
        set((s) => ({
          wishlist: s.wishlist.includes(productId)
            ? s.wishlist.filter((x) => x !== productId)
            : [...s.wishlist, productId],
        })),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setLoginOpen: (loginOpen) => set({ loginOpen }),
      setMenuOpen: (menuOpen) => set({ menuOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
    }),
    {
      name: "lb-closet-shop",
      version: 2,
      partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist }),
    },
  ),
);

export function cartLines(cart: CartItem[], products: DbProduct[]): CartLine[] {
  const out: CartLine[] = [];
  for (const ci of cart) {
    for (const p of products) {
      const v = p.variants?.find((x) => x.id === ci.variantId);
      if (v) {
        out.push({ ...ci, product: p, variant: v });
        break;
      }
    }
  }
  return out;
}

export function cartSubtotalCents(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.variant.price_cents * l.quantity, 0);
}
