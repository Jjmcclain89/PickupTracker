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
  picked_up_by uuid references public.profiles(id) on delete set null, -- who actually picked it up
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint date_range_valid check (date_end >= date_start)
);

-- For existing databases created before picked_up_by was added.
alter table public.pickups add column if not exists picked_up_by uuid references public.profiles(id) on delete set null;

create index if not exists pickups_assigned_to_idx on public.pickups(assigned_to);
create index if not exists pickups_date_range_idx on public.pickups(date_start, date_end);

-- Explicit visibility grants beyond the owner (created_by) and the assignee.
-- The owner manages this list; being assigned a pickup grants a row here too
-- (see sync_pickup_assignee_share below), so access sticks even if reassigned later.
create table if not exists public.pickup_shares (
  pickup_id uuid not null references public.pickups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pickup_id, user_id)
);

create index if not exists pickup_shares_user_id_idx on public.pickup_shares(user_id);

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

-- Whoever a pickup is assigned to automatically gets a share row (access sticks
-- even if they're later reassigned away — the owner has to explicitly remove them).
create or replace function public.sync_pickup_assignee_share()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_to is not null then
    insert into public.pickup_shares (pickup_id, user_id)
    values (new.id, new.assigned_to)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_pickup_assignee_share on public.pickups;
create trigger sync_pickup_assignee_share
  after insert or update of assigned_to on public.pickups
  for each row execute function public.sync_pickup_assignee_share();

-- Owner, assignee, and shared users may all reassign a pickup (only delete is
-- owner-only). Past deployments had a trigger restricting reassignment to the
-- owner — drop it so re-running this script removes it from an existing DB.
drop trigger if exists enforce_assignee_change_owner_only on public.pickups;
drop function if exists public.enforce_assignee_change_owner_only();

-- Cross-table existence checks used by the RLS policies below. Pickups policies
-- need to check pickup_shares, and pickup_shares policies need to check pickups
-- back — done as raw EXISTS subqueries, Postgres detects that mutual reference
-- and raises "infinite recursion detected in policy". Wrapping each check in a
-- security definer function makes the nested query run as the function owner,
-- bypassing RLS on the table it looks at, which breaks the cycle.
create or replace function public.is_pickup_owner(target_pickup_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.pickups p
    where p.id = target_pickup_id and p.created_by = auth.uid()
  );
$$;

create or replace function public.has_pickup_share(target_pickup_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.pickup_shares s
    where s.pickup_id = target_pickup_id and s.user_id = auth.uid()
  );
$$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.pickups enable row level security;
alter table public.pickup_shares enable row level security;

-- Any logged-in user (all 4 of you) can see every profile —
-- this is a small shared coordination tool, not a multi-tenant app.
drop policy if exists "profiles readable by authenticated users" on public.profiles;
create policy "profiles readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Pickups are private by default: visible only to the owner (created_by),
-- the current assignee, or anyone explicitly granted a pickup_shares row.
drop policy if exists "pickups readable by authenticated users" on public.pickups;
drop policy if exists "pickups readable by owner, assignee, or shared" on public.pickups;
create policy "pickups readable by owner, assignee, or shared"
  on public.pickups for select
  to authenticated
  using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or public.has_pickup_share(id)
  );

drop policy if exists "pickups insertable by authenticated users" on public.pickups;
drop policy if exists "pickups insertable as self" on public.pickups;
create policy "pickups insertable as self"
  on public.pickups for insert
  to authenticated
  with check (created_by = auth.uid());

-- Owner, assignee, and shared users can all edit pickup fields, including
-- who it's assigned to (full edit access; only delete is owner-only below).
drop policy if exists "pickups updatable by authenticated users" on public.pickups;
drop policy if exists "pickups updatable by owner, assignee, or shared" on public.pickups;
create policy "pickups updatable by owner, assignee, or shared"
  on public.pickups for update
  to authenticated
  using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or public.has_pickup_share(id)
  );

-- Deleting a pickup is open to the same people who can already see/edit it:
-- owner, assignee, or shared user.
drop policy if exists "pickups deletable by authenticated users" on public.pickups;
drop policy if exists "pickups deletable by owner" on public.pickups;
drop policy if exists "pickups deletable by owner, assignee, or shared" on public.pickups;
create policy "pickups deletable by owner, assignee, or shared"
  on public.pickups for delete
  to authenticated
  using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or public.has_pickup_share(id)
  );

-- A user can see their own share rows (to know what's shared with them); the
-- owner can see and manage the full share list for their own pickups. Nobody
-- else may add or remove people.
drop policy if exists "pickup_shares readable by member or owner" on public.pickup_shares;
create policy "pickup_shares readable by member or owner"
  on public.pickup_shares for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_pickup_owner(pickup_id)
  );

drop policy if exists "pickup_shares insertable by owner" on public.pickup_shares;
create policy "pickup_shares insertable by owner"
  on public.pickup_shares for insert
  to authenticated
  with check (public.is_pickup_owner(pickup_id));

drop policy if exists "pickup_shares deletable by owner" on public.pickup_shares;
create policy "pickup_shares deletable by owner"
  on public.pickup_shares for delete
  to authenticated
  using (public.is_pickup_owner(pickup_id));
