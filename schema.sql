-- Run once in the Supabase SQL editor.
-- Also enable Authentication -> Sign In / Providers -> "Allow anonymous sign-ins".
create table if not exists public.saved_items (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  paper_id   text not null,
  paper      jsonb not null,
  note       text,
  coll       text,
  created_at timestamptz not null default now(),
  primary key (user_id, paper_id)
);

alter table public.saved_items enable row level security;

create policy "own rows only" on public.saved_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
