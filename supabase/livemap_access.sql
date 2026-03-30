create extension if not exists pgcrypto;

create or replace function public.is_livemap_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = 'admin'
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  discord_user_id text,
  discord_username text,
  avatar_url text,
  role text not null default 'public' check (role in ('public', 'prem', 'guild', 'beta', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_profiles_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own_public" on public.profiles;
create policy "profiles_insert_own_public"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'public'
);

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all"
on public.profiles
for select
to authenticated
using (
  public.is_livemap_admin(auth.uid())
);

drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_admin_update_all"
on public.profiles
for update
to authenticated
using (
  public.is_livemap_admin(auth.uid())
)
with check (
  role in ('public', 'prem', 'guild', 'beta', 'admin')
);

comment on table public.profiles is 'Discord/Supabase access control for the Livemap desktop client.';
