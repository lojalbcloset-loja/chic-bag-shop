import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ PROFILE ============
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, userEmail } = context;
    const { data, error } = await supabase
      .from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data, email: userEmail };
  });

const profileSchema = z.object({
  full_name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().nullable(),
  cpf: z.string().max(20).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  accepts_marketing: z.boolean().optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ADDRESSES ============
export const listMyAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("customer_addresses").select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { addresses: data ?? [] };
  });

const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().max(40).optional().nullable(),
  recipient: z.string().min(2).max(120),
  cep: z.string().min(8).max(10),
  street: z.string().min(2).max(180),
  number: z.string().min(1).max(20),
  complement: z.string().max(120).optional().nullable(),
  neighborhood: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  state: z.string().min(2).max(2),
  is_default: z.boolean().optional(),
});

export const saveMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addressSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = { ...data, user_id: userId };
    if (data.is_default) {
      // limpa default antigos
      await supabase.from("customer_addresses")
        .update({ is_default: false }).eq("user_id", userId);
    }
    const { error } = data.id
      ? await supabase.from("customer_addresses").update(payload).eq("id", data.id)
      : await supabase.from("customer_addresses").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("customer_addresses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ORDERS ============
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, total_cents, created_at, tracking_code")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders").select("*").eq("id", data.id).eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Pedido não encontrado");
    const { data: items } = await supabase
      .from("order_items").select("*").eq("order_id", data.id);
    const { data: events } = await supabase
      .from("order_events").select("*").eq("order_id", data.id)
      .order("created_at", { ascending: true });
    return { order, items: items ?? [], events: events ?? [] };
  });
