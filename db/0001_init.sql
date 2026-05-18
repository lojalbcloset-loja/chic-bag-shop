-- =============================================================
-- Lb Closet — Schema inicial (BYOK Supabase)
-- INSTRUÇÕES:
-- 1) Abra o Supabase Dashboard -> SQL Editor
-- 2) Cole TODO este arquivo e clique em RUN
-- 3) Rode UMA vez. Reexecuções são seguras (idempotente).
-- =============================================================

create extension if not exists "pgcrypto";

-- ENUMS
do $$ begin create type public.app_role as enum ('admin','manager','customer');
exception when duplicate_object then null; end $$;
do $$ begin create type public.order_status as enum
  ('pending','paid','processing','shipped','delivered','canceled','refunded');
exception when duplicate_object then null; end $$;
do $$ begin create type public.promotion_type as enum ('percent','fixed','free_shipping');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ROLES
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
    where user_id=_user_id and role in ('admin','manager'))
$$;

drop policy if exists "users read own roles" on public.user_roles;
create policy "users read own roles" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "admin manage roles" on public.user_roles;
create policy "admin manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, cpf text, birth_date date,
  accepts_marketing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop policy if exists "self read profile" on public.profiles;
create policy "self read profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists "self update profile" on public.profiles;
create policy "self update profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "self insert profile" on public.profiles;
create policy "self insert profile" on public.profiles for insert to authenticated
  with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare is_first boolean;
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;

  select count(*) = 0 into is_first from public.user_roles where role='admin';
  insert into public.user_roles (user_id, role) values (new.id,'customer') on conflict do nothing;
  if is_first then
    insert into public.user_roles (user_id, role) values (new.id,'admin') on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ENDEREÇOS
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text, recipient text not null, cep text not null,
  street text not null, number text not null, complement text,
  neighborhood text not null, city text not null, state text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customer_addresses enable row level security;
drop trigger if exists trg_addr_updated on public.customer_addresses;
create trigger trg_addr_updated before update on public.customer_addresses
  for each row execute function public.set_updated_at();

drop policy if exists "addr self all" on public.customer_addresses;
create policy "addr self all" on public.customer_addresses for all to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()))
  with check (user_id = auth.uid() or public.is_staff(auth.uid()));

-- CATÁLOGO: categories, colors, sizes, materials
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text, sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.categories enable row level security;
drop trigger if exists trg_cat_updated on public.categories;
create trigger trg_cat_updated before update on public.categories
  for each row execute function public.set_updated_at();

create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, hex text not null,
  sort_order int not null default 0
);
alter table public.colors enable row level security;

create table if not exists public.sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, sort_order int not null default 0
);
alter table public.sizes enable row level security;

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);
alter table public.materials enable row level security;

do $$ declare t text; begin
  foreach t in array array['categories','colors','sizes','materials'] loop
    execute format('drop policy if exists "pub read %1$s" on public.%1$s', t);
    execute format($p$create policy "pub read %1$s" on public.%1$s for select using (true)$p$, t);
    execute format('drop policy if exists "staff write %1$s" on public.%1$s', t);
    execute format($p$create policy "staff write %1$s" on public.%1$s for all to authenticated
      using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))$p$, t);
  end loop;
end $$;

-- PRODUTOS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, sku_base text unique,
  name text not null, description text,
  category_id uuid references public.categories(id) on delete set null,
  material_id uuid references public.materials(id) on delete set null,
  brand text, gender text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  weight_grams int, width_cm numeric(6,2), height_cm numeric(6,2), depth_cm numeric(6,2),
  meta_title text, meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
drop trigger if exists trg_prod_updated on public.products;
create trigger trg_prod_updated before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  color_id uuid references public.colors(id) on delete set null,
  size_id uuid references public.sizes(id) on delete set null,
  price_cents int not null check (price_cents >= 0),
  compare_at_price_cents int check (compare_at_price_cents >= 0),
  cost_cents int check (cost_cents >= 0),
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 3,
  barcode text, is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.product_variants enable row level security;
drop trigger if exists trg_var_updated on public.product_variants;
create trigger trg_var_updated before update on public.product_variants
  for each row execute function public.set_updated_at();
create index if not exists idx_variants_product on public.product_variants(product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  url text not null, alt text, sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.product_images enable row level security;
create index if not exists idx_images_product on public.product_images(product_id);

create table if not exists public.product_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tag text not null,
  unique (product_id, tag)
);
alter table public.product_tags enable row level security;

do $$ declare t text; begin
  foreach t in array array['products','product_variants','product_images','product_tags'] loop
    execute format('drop policy if exists "pub read %1$s" on public.%1$s', t);
    execute format($p$create policy "pub read %1$s" on public.%1$s for select using (true)$p$, t);
    execute format('drop policy if exists "staff write %1$s" on public.%1$s', t);
    execute format($p$create policy "staff write %1$s" on public.%1$s for all to authenticated
      using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))$p$, t);
  end loop;
end $$;

-- PROMOÇÕES
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null, code text unique,
  type public.promotion_type not null,
  value int not null default 0,
  min_subtotal_cents int not null default 0,
  max_uses int, used_count int not null default 0,
  starts_at timestamptz, ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.promotions enable row level security;
drop trigger if exists trg_promo_updated on public.promotions;
create trigger trg_promo_updated before update on public.promotions
  for each row execute function public.set_updated_at();

create table if not exists public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);
alter table public.promotion_products enable row level security;

drop policy if exists "pub read promotions" on public.promotions;
create policy "pub read promotions" on public.promotions for select using (is_active = true);
drop policy if exists "staff write promotions" on public.promotions;
create policy "staff write promotions" on public.promotions for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
drop policy if exists "staff promotion_products" on public.promotion_products;
create policy "staff promotion_products" on public.promotion_products for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- PEDIDOS
create sequence if not exists public.order_number_seq start 1000;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  user_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'pending',
  subtotal_cents int not null default 0,
  shipping_cents int not null default 0,
  discount_cents int not null default 0,
  total_cents int not null default 0,
  shipping_method text, tracking_code text,
  shipping_address jsonb,
  promotion_id uuid references public.promotions(id),
  payment_provider text, payment_id text, notes text,
  paid_at timestamptz, shipped_at timestamptz, delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

create or replace function public.generate_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null then
    new.order_number := '#LB' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  end if;
  return new;
end $$;
drop trigger if exists trg_order_number on public.orders;
create trigger trg_order_number before insert on public.orders
  for each row execute function public.generate_order_number();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_snapshot jsonb not null,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0),
  line_total_cents int not null
);
alter table public.order_items enable row level security;
create index if not exists idx_order_items_order on public.order_items(order_id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  type text not null, payload jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.order_events enable row level security;

drop policy if exists "orders self read" on public.orders;
create policy "orders self read" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists "orders staff write" on public.orders;
create policy "orders staff write" on public.orders for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "items self read" on public.order_items;
create policy "items self read" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));
drop policy if exists "items staff write" on public.order_items;
create policy "items staff write" on public.order_items for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "events self read" on public.order_events;
create policy "events self read" on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));
drop policy if exists "events staff write" on public.order_events;
create policy "events staff write" on public.order_events for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create or replace function public.decrement_stock_on_paid()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and (old.status is distinct from 'paid') then
    update public.product_variants v
       set stock = greatest(0, stock - oi.quantity)
      from public.order_items oi
     where oi.order_id = new.id and oi.variant_id = v.id;
  end if;
  return new;
end $$;
drop trigger if exists trg_stock_paid on public.orders;
create trigger trg_stock_paid after update on public.orders
  for each row execute function public.decrement_stock_on_paid();

-- CMS leve
create table if not exists public.site_content (
  key text primary key, value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
drop trigger if exists trg_site_content_updated on public.site_content;
create trigger trg_site_content_updated before update on public.site_content
  for each row execute function public.set_updated_at();
drop policy if exists "pub read site_content" on public.site_content;
create policy "pub read site_content" on public.site_content for select using (true);
drop policy if exists "staff write site_content" on public.site_content;
create policy "staff write site_content" on public.site_content for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null, mobile_image_url text,
  title text, subtitle text, cta_label text, cta_href text,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hero_slides enable row level security;
drop trigger if exists trg_hero_updated on public.hero_slides;
create trigger trg_hero_updated before update on public.hero_slides
  for each row execute function public.set_updated_at();
drop policy if exists "pub read hero" on public.hero_slides;
create policy "pub read hero" on public.hero_slides for select using (is_active = true);
drop policy if exists "staff write hero" on public.hero_slides;
create policy "staff write hero" on public.hero_slides for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- STORAGE
insert into storage.buckets (id,name,public) values
  ('product-images','product-images',true) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values
  ('site-assets','site-assets',true) on conflict (id) do nothing;

drop policy if exists "pub read product-images" on storage.objects;
create policy "pub read product-images" on storage.objects for select
  using (bucket_id='product-images');
drop policy if exists "staff write product-images" on storage.objects;
create policy "staff write product-images" on storage.objects for all to authenticated
  using (bucket_id='product-images' and public.is_staff(auth.uid()))
  with check (bucket_id='product-images' and public.is_staff(auth.uid()));

drop policy if exists "pub read site-assets" on storage.objects;
create policy "pub read site-assets" on storage.objects for select
  using (bucket_id='site-assets');
drop policy if exists "staff write site-assets" on storage.objects;
create policy "staff write site-assets" on storage.objects for all to authenticated
  using (bucket_id='site-assets' and public.is_staff(auth.uid()))
  with check (bucket_id='site-assets' and public.is_staff(auth.uid()));
