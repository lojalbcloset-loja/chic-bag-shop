import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useShop } from "@/store/shop";
import { fetchRemoteCart, mergeCarts, pushCart } from "@/lib/carts";

/**
 * Sincroniza o carrinho local com o Supabase quando o usuário está logado.
 * - No login: faz merge do carrinho local + remoto e empurra o resultado.
 * - Em mudanças subsequentes: faz push debounced.
 */
export function useCartSync() {
  const { user, isAuthenticated } = useAuth();
  const cart = useShop((s) => s.cart);
  const replaceCart = useShop((s) => s.replaceCart);
  const mergedFor = useRef<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextPush = useRef(false);

  // Merge on login
  useEffect(() => {
    if (!isAuthenticated || !user) {
      mergedFor.current = null;
      return;
    }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    (async () => {
      try {
        const remote = await fetchRemoteCart(user.id);
        const merged = mergeCarts(useShop.getState().cart, remote);
        skipNextPush.current = true;
        replaceCart(merged);
        await pushCart(user.id, merged);
      } catch (err) {
        console.error("[cart-sync] merge falhou", err);
      }
    })();
  }, [isAuthenticated, user, replaceCart]);

  // Debounced push on every cart change
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (mergedFor.current !== user.id) return; // ainda não fez merge
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      pushCart(user.id, cart).catch((err) =>
        console.error("[cart-sync] push falhou", err),
      );
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [cart, isAuthenticated, user]);
}
