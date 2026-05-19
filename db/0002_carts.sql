-- =============================================================
-- Lb Closet — Carrinho persistente por usuário
-- INSTRUÇÕES: cole no SQL Editor do Supabase e RUN. Idempotente.
-- =============================================================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.carts enable row level security;
drop trigger if exists trg_carts_updated on public.carts;
create trigger trg_carts_updated before update on public.carts
  for each row execute function public.set_updated_at();

drop policy if exists "carts self all" on public.carts;
create policy "carts self all" on public.carts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);
alter table public.cart_items enable row level security;
create index if not exists idx_cart_items_cart on public.cart_items(cart_id);

drop policy if exists "cart_items self all" on public.cart_items;
create policy "cart_items self all" on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
