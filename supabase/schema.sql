-- Run this in the Supabase SQL editor after creating your project.

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pickups table
create table if not exists public.pickups (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,        -- whose pickup this is (Josh / Igor / Dave)
  casino text not null,
  amount numeric(10,2) not null,
  date_start date not null,
  date_end date not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  picked_up_at timestamptz,          -- set when someone marks it picked up
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint date_range_valid check (date_end >= date_start)
);

create index if not exists pickups_assigned_to_idx on public.pickups(assigned_to);
create index if not exists pickups_date_range_idx on public.pickups(date_start, date_end);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pickups_set_updated_at on public.pickups;
create trigger pickups_set_updated_at
  before update on public.pickups
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, must_change_password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, true)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.pickups enable row level security;

-- Any logged-in user (all 4 of you) can see every profile and pickup —
-- this is a small shared coordination tool, not a multi-tenant app.
create policy "profiles readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "pickups readable by authenticated users"
  on public.pickups for select
  to authenticated
  using (true);

create policy "pickups insertable by authenticated users"
  on public.pickups for insert
  to authenticated
  with check (true);

create policy "pickups updatable by authenticated users"
  on public.pickups for update
  to authenticated
  using (true);

create policy "pickups deletable by authenticated users"
  on public.pickups for delete
  to authenticated
  using (true);
