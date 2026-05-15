-- Material Manager — database schema
-- Run this in the Supabase SQL editor BEFORE rls_policies.sql

-- ============================================================
-- profiles: extends auth.users
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  role        text not null check (role in ('admin', 'staff')) default 'staff',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- materials
-- ============================================================
create table if not exists public.materials (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  quantity        numeric not null default 0,
  unit            text not null,
  supplier        text,
  minimum_stock   numeric not null default 0,
  notes           text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists materials_name_idx on public.materials (lower(name));

-- ============================================================
-- transactions: immutable IN/OUT log
-- ============================================================
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  material_id     uuid references public.materials(id) on delete cascade,
  material_name   text not null,
  type            text not null check (type in ('IN', 'OUT')),
  quantity        numeric not null check (quantity > 0),
  note            text,
  user_id         uuid references public.profiles(id),
  user_name       text not null,
  created_at      timestamptz not null default now()
);

create index if not exists transactions_created_at_idx on public.transactions (created_at desc);
create index if not exists transactions_material_id_idx on public.transactions (material_id);

-- ============================================================
-- Trigger: auto-create profile row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Trigger: keep materials.updated_at fresh
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists materials_set_updated_at on public.materials;
create trigger materials_set_updated_at
  before update on public.materials
  for each row execute function public.touch_updated_at();

-- ============================================================
-- RPC: atomic stock update. delta is positive for IN, negative for OUT.
-- Rejects when OUT would result in negative quantity.
-- ============================================================
create or replace function public.update_stock(p_material_id uuid, p_delta numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  new_qty numeric;
begin
  update public.materials
     set quantity = quantity + p_delta
   where id = p_material_id
   returning quantity into new_qty;

  if new_qty is null then
    raise exception 'Material not found';
  end if;

  if new_qty < 0 then
    raise exception 'Insufficient stock';
  end if;

  return new_qty;
end;
$$;

grant execute on function public.update_stock(uuid, numeric) to authenticated;
