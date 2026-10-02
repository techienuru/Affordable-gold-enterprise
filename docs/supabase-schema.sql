-- =============================================================
--  Affordable Gold Enterprise - Supabase database setup
--
--  HOW TO USE
--    1. Open your Supabase project
--    2. Left menu -> SQL Editor -> New query
--    3. Paste this WHOLE file
--    4. Press Run
--
--  You can run it again safely. It will not duplicate anything.
-- =============================================================


-- -------------------------------------------------------------
--  1. PROFILES - one row per person who signs in
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

-- The first time somebody signs in with Google, create their profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Helper: is the person making this request an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Stop a customer from promoting themselves to admin.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only an admin can change a role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();


-- -------------------------------------------------------------
--  2. PRODUCTS - what you sell
-- -------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique,
  category     text,
  description  text,
  price        numeric(12, 2) not null check (price >= 0),
  unit         text,
  image_url    text,
  stock        integer not null default 0 check (stock >= 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);


-- -------------------------------------------------------------
--  3. DELIVERY ZONES - you edit these from the admin page
--     needs_quote = true means we call the customer to agree a fee
-- -------------------------------------------------------------
create table if not exists public.delivery_zones (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  fee          numeric(12, 2) not null default 0 check (fee >= 0),
  details      text,
  needs_quote  boolean not null default false,
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);


-- -------------------------------------------------------------
--  4. ORDERS
-- -------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,
  user_id            uuid references public.profiles (id) on delete set null,
  customer_name      text not null,
  customer_email     text not null,
  customer_phone     text not null,

  fulfilment         text not null default 'delivery'
                       check (fulfilment in ('delivery', 'pickup')),
  delivery_zone_id   uuid references public.delivery_zones (id) on delete set null,
  delivery_zone_name text,
  delivery_address   text,
  delivery_note      text,
  delivery_fee       numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  fee_confirmed      boolean not null default true,

  subtotal           numeric(12, 2) not null default 0,
  total              numeric(12, 2) not null default 0,

  payment_method     text not null default 'card'
                       check (payment_method in ('card', 'transfer', 'pay_on_delivery')),
  payment_status     text not null default 'pending'
                       check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  paystack_reference text,

  status             text not null default 'pending'
                       check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  admin_note         text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);


-- -------------------------------------------------------------
--  5. ORDER ITEMS - what was inside each order
--     The name and price are copied here so old orders never
--     change when you edit a product later.
-- -------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  unit         text,
  unit_price   numeric(12, 2) not null check (unit_price >= 0),
  quantity     integer not null check (quantity > 0),
  line_total   numeric(12, 2) not null check (line_total >= 0),
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);


-- -------------------------------------------------------------
--  6. SAVE AN ORDER SAFELY
--     Called only by the server. Prices and delivery fees are
--     read from the database and the whole order saves together.
-- -------------------------------------------------------------
create or replace function public.create_order_for_user(
  p_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_fulfilment text,
  p_delivery_zone_id uuid,
  p_delivery_address text,
  p_delivery_note text,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text := 'AGE-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_subtotal numeric(12, 2) := 0;
  v_delivery_fee numeric(12, 2) := 0;
  v_fee_confirmed boolean := true;
  v_zone_name text;
  v_item record;
  v_product record;
begin
  if p_user_id is null or not exists (
    select 1 from public.profiles where id = p_user_id
  ) then
    raise exception 'A valid customer account is required';
  end if;

  if nullif(trim(p_customer_name), '') is null
     or nullif(trim(p_customer_email), '') is null
     or nullif(trim(p_customer_phone), '') is null then
    raise exception 'Customer name, email and phone are required';
  end if;

  if p_fulfilment not in ('delivery', 'pickup') then
    raise exception 'Invalid fulfilment option';
  end if;

  if p_payment_method not in ('card', 'transfer', 'pay_on_delivery') then
    raise exception 'Invalid payment method';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 100 then
    raise exception 'An order must contain between 1 and 100 items';
  end if;

  if p_fulfilment = 'delivery' then
    if p_delivery_zone_id is null then
      raise exception 'A delivery area is required';
    end if;

    select dz.name, dz.fee, not dz.needs_quote
    into v_zone_name, v_delivery_fee, v_fee_confirmed
    from public.delivery_zones dz
    where dz.id = p_delivery_zone_id and dz.is_active = true;

    if not found then
      raise exception 'The selected delivery area is not available';
    end if;

    if nullif(trim(p_delivery_address), '') is null then
      raise exception 'A delivery address is required';
    end if;

    if not v_fee_confirmed then
      v_delivery_fee := 0;
    end if;
  else
    p_delivery_zone_id := null;
    p_delivery_address := null;
    v_zone_name := null;
  end if;

  insert into public.orders (
    id,
    order_number,
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    fulfilment,
    delivery_zone_id,
    delivery_zone_name,
    delivery_address,
    delivery_note,
    delivery_fee,
    fee_confirmed,
    subtotal,
    total,
    payment_method,
    payment_status,
    status
  ) values (
    v_order_id,
    v_order_number,
    p_user_id,
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    trim(p_customer_phone),
    p_fulfilment,
    p_delivery_zone_id,
    v_zone_name,
    nullif(trim(p_delivery_address), ''),
    nullif(trim(p_delivery_note), ''),
    v_delivery_fee,
    v_fee_confirmed,
    0,
    v_delivery_fee,
    p_payment_method,
    'pending',
    'pending'
  );

  for v_item in
    select
      (entry ->> 'product_id')::uuid as product_id,
      sum((entry ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as entry
    group by (entry ->> 'product_id')::uuid
  loop
    if v_item.quantity < 1 then
      raise exception 'Every quantity must be at least one';
    end if;

    select p.id, p.name, p.unit, p.price, p.stock
    into v_product
    from public.products p
    where p.id = v_item.product_id and p.is_active = true;

    if not found then
      raise exception 'A product is no longer available';
    end if;

    if v_item.quantity > v_product.stock then
      raise exception 'The requested quantity is no longer available';
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit,
      unit_price,
      quantity,
      line_total
    ) values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.unit,
      v_product.price,
      v_item.quantity,
      v_product.price * v_item.quantity
    );

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  end loop;

  update public.orders o
  set subtotal = v_subtotal,
      total = v_subtotal + v_delivery_fee
  where o.id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total', v_subtotal + v_delivery_fee,
    'fee_confirmed', v_fee_confirmed,
    'payment_method', p_payment_method,
    'payment_status', 'pending',
    'status', 'pending'
  );
end;
$$;

revoke all on function public.create_order_for_user(
  uuid, text, text, text, text, uuid, text, text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.create_order_for_user(
  uuid, text, text, text, text, uuid, text, text, text, jsonb
) to service_role;


-- -------------------------------------------------------------
--  7. Keep updated_at honest
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_products on public.products;
create trigger touch_products before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_delivery_zones on public.delivery_zones;
create trigger touch_delivery_zones before update on public.delivery_zones
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_orders on public.orders;
create trigger touch_orders before update on public.orders
  for each row execute function public.touch_updated_at();


-- -------------------------------------------------------------
--  8. WHO IS ALLOWED TO DO WHAT
--     Rules: visitors read products and delivery zones.
--            Customers read only their own orders.
--            Only the admin can change anything.
--            Orders are written by our server, never by the browser,
--            so nobody can edit prices before paying.
-- -------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (is_active or public.is_admin());

drop policy if exists products_write on public.products;
create policy products_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists delivery_zones_read on public.delivery_zones;
create policy delivery_zones_read on public.delivery_zones
  for select using (is_active or public.is_admin());

drop policy if exists delivery_zones_write on public.delivery_zones;
create policy delivery_zones_write on public.delivery_zones
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );


-- -------------------------------------------------------------
--  9. PRODUCT PHOTO STORAGE
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists product_images_read on storage.objects;
create policy product_images_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists product_images_write on storage.objects;
create policy product_images_write on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- -------------------------------------------------------------
-- 10. DELIVERY ZONES - starting values, edit them later in admin
-- -------------------------------------------------------------
insert into public.delivery_zones (name, fee, details, needs_quote, sort_order) values
  ('Keffi',        0,    'Free delivery inside Keffi.',                          false, 1),
  ('Abuja',        1000, 'Delivery within Abuja (FCT).',                          false, 2),
  ('Lafia',        2000, 'Delivery within Lafia town.',                           false, 3),
  ('Other states', 0,    'We will call you to confirm the delivery fee.',         true,  99)
on conflict (name) do nothing;


-- -------------------------------------------------------------
-- 11. PLACEHOLDER PRODUCTS - delete these once you add your own
-- -------------------------------------------------------------
insert into public.products (name, slug, category, description, price, unit, stock) values
  ('Pure Natural Honey',    'pure-natural-honey-1l',  'Honey',      'Raw, unprocessed honey straight from the farm.',      8000, '1 litre', 50),
  ('Pure Natural Honey',    'pure-natural-honey-500', 'Honey',      'Same honey in a smaller jar.',                        4500, '500ml',   50),
  ('Groundnut Oil',         'groundnut-oil-1l',       'Oils',       'Freshly pressed groundnut oil.',                      5500, '1 litre', 40),
  ('Palm Oil',              'palm-oil-1l',            'Oils',       'Thick, natural red palm oil.',                        4000, '1 litre', 40),
  ('Dates',                 'dates-1kg',              'Dry fruits', 'Soft, sweet dates.',                                  6500, '1kg',     30),
  ('Dry Pepper (ground)',   'dry-pepper-500g',        'Spices',     'Ground dried pepper, ready for the pot.',             2500, '500g',    60),
  ('Dry Ginger (ground)',   'dry-ginger-500g',        'Spices',     'Ground dried ginger.',                                3000, '500g',    60)
on conflict (slug) do nothing;


-- -------------------------------------------------------------
-- 12. MAKE YOURSELF ADMIN  (do this LAST)
--
--     First sign in to the shop once with Google, so your row exists.
--     Then replace the email below with your own and run just this bit.
-- -------------------------------------------------------------
-- update public.profiles set role = 'admin' where email = 'ibrahimnurudeenshehu1447@gmail.com';
-- select id, email, full_name, role from public.profiles;
