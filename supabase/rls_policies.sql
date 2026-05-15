-- Material Manager — Row Level Security policies
-- Run this AFTER schema.sql

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.transactions enable row level security;

-- ============================================================
-- profiles
-- ============================================================
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Only admins can update profiles (used for role changes in admin panel).
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ============================================================
-- materials
-- ============================================================
drop policy if exists "materials_select_authenticated" on public.materials;
create policy "materials_select_authenticated"
  on public.materials for select
  to authenticated
  using (true);

drop policy if exists "materials_insert_admin" on public.materials;
create policy "materials_insert_admin"
  on public.materials for insert
  to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Updates allowed for admins (edit form) AND via the update_stock RPC which
-- runs as security definer (it bypasses RLS), so staff can still adjust stock.
drop policy if exists "materials_update_admin" on public.materials;
create policy "materials_update_admin"
  on public.materials for update
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

drop policy if exists "materials_delete_admin" on public.materials;
create policy "materials_delete_admin"
  on public.materials for delete
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ============================================================
-- transactions
-- ============================================================
drop policy if exists "transactions_select_authenticated" on public.transactions;
create policy "transactions_select_authenticated"
  on public.transactions for select
  to authenticated
  using (true);

drop policy if exists "transactions_insert_authenticated" on public.transactions;
create policy "transactions_insert_authenticated"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No update / no delete policies = nobody can update or delete (immutable log).
