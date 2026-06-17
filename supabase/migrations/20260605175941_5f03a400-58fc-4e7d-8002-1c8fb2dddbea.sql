create table if not exists public.email_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'manifesto',
  created_at timestamptz not null default now()
);
grant insert on public.email_leads to anon;
grant insert on public.email_leads to authenticated;
grant all on public.email_leads to service_role;
alter table public.email_leads enable row level security;
create policy "anyone can subscribe" on public.email_leads for insert to anon, authenticated with check (true);