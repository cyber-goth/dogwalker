-- One row = the walker came that day. UNIQUE makes check-in idempotent.
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  visit_date date unique not null,
  created_by uuid references auth.users,
  created_at timestamptz default now()
);
alter table public.visits enable row level security;

-- IMPORTANT: replace 'owner@example.com' with the real OWNER_EMAIL before running.
create or replace function public.is_owner() returns boolean
language sql stable as $$ select auth.jwt() ->> 'email' = 'owner@example.com' $$;

drop policy if exists "read for authenticated" on public.visits;
create policy "read for authenticated" on public.visits
  for select to authenticated using (true);

drop policy if exists "insert today for authenticated" on public.visits;
create policy "insert today for authenticated" on public.visits
  for insert to authenticated
  with check (visit_date = (now() at time zone 'Asia/Jerusalem')::date);

drop policy if exists "delete owner only" on public.visits;
create policy "delete owner only" on public.visits
  for delete to authenticated using (public.is_owner());
