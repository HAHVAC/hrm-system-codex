create extension if not exists "pgcrypto";

create type public.app_role as enum ('employee', 'manager', 'admin');
create type public.attendance_status as enum ('present', 'late', 'incomplete', 'exception');
create type public.request_status as enum ('pending', 'approved', 'rejected');
create type public.correction_type as enum ('missed_check_in', 'missed_check_out', 'gps_issue', 'other');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role public.app_role not null default 'employee',
  employee_code text unique,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'New user'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.worksites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  allowed_radius_meters integer not null default 150,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_worksites (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  worksite_id uuid not null references public.worksites(id) on delete cascade,
  start_date date not null default current_date,
  end_date date,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists employee_worksites_primary_idx
  on public.employee_worksites (employee_id, is_primary)
  where is_primary = true;

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  worksite_id uuid not null references public.worksites(id),
  attendance_date date not null default current_date,
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_latitude double precision,
  check_in_longitude double precision,
  check_out_latitude double precision,
  check_out_longitude double precision,
  check_in_distance_meters integer,
  check_out_distance_meters integer,
  check_in_selfie_url text,
  check_out_selfie_url text,
  status public.attendance_status not null default 'incomplete',
  exception_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists attendance_one_per_day_idx
  on public.attendance_records (employee_id, attendance_date);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.overtime_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  worksite_id uuid references public.worksites(id),
  request_date date not null default current_date,
  start_time timestamptz not null,
  end_time timestamptz not null,
  total_hours numeric(5,2) not null,
  reason text,
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  request_type public.correction_type not null,
  requested_value jsonb,
  reason text,
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.approval_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'manager', false)
$$;

alter table public.profiles enable row level security;
alter table public.worksites enable row level security;
alter table public.employee_worksites enable row level security;
alter table public.attendance_records enable row level security;
alter table public.leave_requests enable row level security;
alter table public.overtime_requests enable row level security;
alter table public.correction_requests enable row level security;
alter table public.approval_logs enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "worksites_read_for_authenticated_users" on public.worksites;
create policy "worksites_read_for_authenticated_users"
on public.worksites
for select
using (auth.role() = 'authenticated');

drop policy if exists "worksites_manage_admin_only" on public.worksites;
create policy "worksites_manage_admin_only"
on public.worksites
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "employee_worksites_read_own_manager_admin" on public.employee_worksites;
create policy "employee_worksites_read_own_manager_admin"
on public.employee_worksites
for select
using (
  employee_id = auth.uid()
  or public.is_admin()
  or public.is_manager()
);

drop policy if exists "employee_worksites_manage_admin_only" on public.employee_worksites;
create policy "employee_worksites_manage_admin_only"
on public.employee_worksites
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "attendance_select_own_manager_admin" on public.attendance_records;
create policy "attendance_select_own_manager_admin"
on public.attendance_records
for select
using (
  employee_id = auth.uid()
  or public.is_admin()
  or public.is_manager()
);

drop policy if exists "attendance_insert_own_or_admin" on public.attendance_records;
create policy "attendance_insert_own_or_admin"
on public.attendance_records
for insert
with check (employee_id = auth.uid() or public.is_admin());

drop policy if exists "attendance_update_own_or_admin" on public.attendance_records;
create policy "attendance_update_own_or_admin"
on public.attendance_records
for update
using (employee_id = auth.uid() or public.is_admin())
with check (employee_id = auth.uid() or public.is_admin());

drop policy if exists "leave_select_own_manager_admin" on public.leave_requests;
create policy "leave_select_own_manager_admin"
on public.leave_requests
for select
using (
  employee_id = auth.uid()
  or public.is_admin()
  or public.is_manager()
);

drop policy if exists "leave_insert_own" on public.leave_requests;
create policy "leave_insert_own"
on public.leave_requests
for insert
with check (employee_id = auth.uid());

drop policy if exists "leave_update_manager_admin" on public.leave_requests;
create policy "leave_update_manager_admin"
on public.leave_requests
for update
using (public.is_admin() or public.is_manager())
with check (public.is_admin() or public.is_manager());

drop policy if exists "overtime_select_own_manager_admin" on public.overtime_requests;
create policy "overtime_select_own_manager_admin"
on public.overtime_requests
for select
using (
  employee_id = auth.uid()
  or public.is_admin()
  or public.is_manager()
);

drop policy if exists "overtime_insert_own" on public.overtime_requests;
create policy "overtime_insert_own"
on public.overtime_requests
for insert
with check (employee_id = auth.uid());

drop policy if exists "overtime_update_manager_admin" on public.overtime_requests;
create policy "overtime_update_manager_admin"
on public.overtime_requests
for update
using (public.is_admin() or public.is_manager())
with check (public.is_admin() or public.is_manager());

drop policy if exists "correction_select_own_manager_admin" on public.correction_requests;
create policy "correction_select_own_manager_admin"
on public.correction_requests
for select
using (
  employee_id = auth.uid()
  or public.is_admin()
  or public.is_manager()
);

drop policy if exists "correction_insert_own" on public.correction_requests;
create policy "correction_insert_own"
on public.correction_requests
for insert
with check (employee_id = auth.uid());

drop policy if exists "correction_update_manager_admin" on public.correction_requests;
create policy "correction_update_manager_admin"
on public.correction_requests
for update
using (public.is_admin() or public.is_manager())
with check (public.is_admin() or public.is_manager());

drop policy if exists "approval_logs_select_manager_admin" on public.approval_logs;
create policy "approval_logs_select_manager_admin"
on public.approval_logs
for select
using (public.is_admin() or public.is_manager());

drop policy if exists "approval_logs_insert_manager_admin" on public.approval_logs;
create policy "approval_logs_insert_manager_admin"
on public.approval_logs
for insert
with check (public.is_admin() or public.is_manager());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists attendance_records_set_updated_at on public.attendance_records;
create trigger attendance_records_set_updated_at
before update on public.attendance_records
for each row execute procedure public.set_updated_at();
