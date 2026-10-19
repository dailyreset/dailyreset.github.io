-- Daily Reset: private per-user cloud backup
-- Run this in Supabase Dashboard > SQL Editor.
create table if not exists public.daily_reset_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.daily_reset_data enable row level security;

revoke all on table public.daily_reset_data from anon;
grant select, insert, update, delete on table public.daily_reset_data to authenticated;

drop policy if exists "Users can read their own Daily Reset data" on public.daily_reset_data;
create policy "Users can read their own Daily Reset data"
  on public.daily_reset_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own Daily Reset data" on public.daily_reset_data;
create policy "Users can insert their own Daily Reset data"
  on public.daily_reset_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Daily Reset data" on public.daily_reset_data;
create policy "Users can update their own Daily Reset data"
  on public.daily_reset_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Daily Reset data" on public.daily_reset_data;
create policy "Users can delete their own Daily Reset data"
  on public.daily_reset_data for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Enable INSERT/UPDATE events for live sync between logged-in devices.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'daily_reset_data'
  ) then
    alter publication supabase_realtime add table public.daily_reset_data;
  end if;
end $$;
