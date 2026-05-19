import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/store/shop";

async function ensureCart(userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchRemoteCart(userId: string): Promise<CartItem[]> {
  const cartId = await ensureCart(userId);
  const { data, error } = await supabase
    .from("cart_items")
    .select("variant_id, quantity")
    .eq("cart_id", cartId);
  if (error) throw error;
  return (data ?? []).map((r) => ({ variantId: r.variant_id, quantity: r.quantity }));
}

export async function pushCart(userId: string, items: CartItem[]): Promise<void> {
  const cartId = await ensureCart(userId);
  // Full replace strategy
  await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (items.length === 0) return;
  const rows = items.map((c) => ({
    cart_id: cartId,
    variant_id: c.variantId,
    quantity: c.quantity,
  }));
  const { error } = await supabase.from("cart_items").insert(rows);
  if (error) throw error;
}

export function mergeCarts(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, number>();
  for (const r of remote) map.set(r.variantId, r.quantity);
  for (const l of local) {
    map.set(l.variantId, Math.max(map.get(l.variantId) ?? 0, l.quantity));
  }
  return Array.from(map.entries()).map(([variantId, quantity]) => ({ variantId, quantity }));
}
