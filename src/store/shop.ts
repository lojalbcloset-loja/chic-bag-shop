import { create } from "zustand";
import { persist } from "zustand/middleware";
import { allProducts, type Product } from "@/lib/catalog";

export interface CartItem {
  productId: number;
  quantity: number;
}

interface ShopState {
  cart: CartItem[];
  wishlist: number[];
  addToCart: (id: number, open?: boolean) => void;
  removeFromCart: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: number) => void;
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
      addToCart: (id, open = true) =>
        set((s) => {
          const exists = s.cart.find((c) => c.productId === id);
          const cart = exists
            ? s.cart.map((c) =>
                c.productId === id ? { ...c, quantity: c.quantity + 1 } : c,
              )
            : [...s.cart, { productId: id, quantity: 1 }];
          return { cart, cartOpen: open ? true : s.cartOpen };
        }),
      removeFromCart: (id) =>
        set((s) => ({ cart: s.cart.filter((c) => c.productId !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          cart: qty <= 0
            ? s.cart.filter((c) => c.productId !== id)
            : s.cart.map((c) => (c.productId === id ? { ...c, quantity: qty } : c)),
        })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((x) => x !== id)
            : [...s.wishlist, id],
        })),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setLoginOpen: (loginOpen) => set({ loginOpen }),
      setMenuOpen: (menuOpen) => set({ menuOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
    }),
    { name: "lb-closet-shop", partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist }) },
  ),
);

export function cartLines(cart: CartItem[]): Array<CartItem & { product: Product }> {
  return cart
    .map((c) => {
      const product = allProducts.find((p) => p.id === c.productId);
      return product ? { ...c, product } : null;
    })
    .filter(Boolean) as Array<CartItem & { product: Product }>;
}

export function cartSubtotal(cart: CartItem[]): number {
  return cartLines(cart).reduce((sum, l) => sum + l.product.price * l.quantity, 0);
}
