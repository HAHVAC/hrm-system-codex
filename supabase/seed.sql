-- Demo seed for local testing after schema.sql
-- Before running:
-- 1. Create email/password users in Supabase Auth
-- 2. Make sure their emails exist in public.profiles via the auth trigger

insert into public.worksites (name, address, latitude, longitude, allowed_radius_meters)
values
  (
    'Cong truong Thu Duc',
    'Vo Nguyen Giap, Thu Duc, TP HCM',
    10.850658,
    106.771686,
    150
  ),
  (
    'Cong truong Di An',
    'DT743, Di An, Binh Duong',
    10.901452,
    106.769596,
    180
  )
on conflict do nothing;

-- Update emails below to match users you created in Supabase Auth.
with employee_profile as (
  select id from public.profiles where email = 'worker@fieldops.vn'
),
manager_profile as (
  select id from public.profiles where email = 'manager@fieldops.vn'
),
thu_duc_site as (
  select id from public.worksites where name = 'Cong truong Thu Duc'
),
di_an_site as (
  select id from public.worksites where name = 'Cong truong Di An'
)
insert into public.employee_worksites (employee_id, worksite_id, is_primary)
select employee_profile.id, thu_duc_site.id, true
from employee_profile, thu_duc_site
where not exists (
  select 1
  from public.employee_worksites ew
  where ew.employee_id = employee_profile.id
    and ew.worksite_id = thu_duc_site.id
)
union all
select manager_profile.id, di_an_site.id, true
from manager_profile, di_an_site
where not exists (
  select 1
  from public.employee_worksites ew
  where ew.employee_id = manager_profile.id
    and ew.worksite_id = di_an_site.id
);

-- Optional: promote demo users to convenient roles.
update public.profiles
set role = 'employee'
where email = 'worker@fieldops.vn';

update public.profiles
set role = 'manager'
where email = 'manager@fieldops.vn';

-- Sample history rows so the history page has something to show.
with employee_profile as (
  select id from public.profiles where email = 'worker@fieldops.vn'
),
thu_duc_site as (
  select id from public.worksites where name = 'Cong truong Thu Duc'
)
insert into public.attendance_records (
  employee_id,
  worksite_id,
  attendance_date,
  check_in_at,
  check_out_at,
  check_in_latitude,
  check_in_longitude,
  check_out_latitude,
  check_out_longitude,
  check_in_distance_meters,
  check_out_distance_meters,
  check_in_selfie_url,
  check_out_selfie_url,
  status
)
select
  employee_profile.id,
  thu_duc_site.id,
  current_date - 1,
  (current_date - 1)::timestamptz + interval '7 hours 5 minutes',
  (current_date - 1)::timestamptz + interval '17 hours 12 minutes',
  10.850700,
  106.771700,
  10.850710,
  106.771710,
  24,
  31,
  'https://placehold.co/640x640?text=check-in',
  'https://placehold.co/640x640?text=check-out',
  'present'
from employee_profile, thu_duc_site
where not exists (
  select 1
  from public.attendance_records ar
  where ar.employee_id = employee_profile.id
    and ar.attendance_date = current_date - 1
);

with employee_profile as (
  select id from public.profiles where email = 'worker@fieldops.vn'
)
insert into public.leave_requests (
  employee_id,
  leave_type,
  start_date,
  end_date,
  reason,
  status
)
select
  employee_profile.id,
  'annual',
  current_date + 1,
  current_date + 1,
  'Nghi mot ngay de giai quyet viec gia dinh.',
  'pending'
from employee_profile
where not exists (
  select 1
  from public.leave_requests lr
  where lr.employee_id = employee_profile.id
    and lr.start_date = current_date + 1
);

with employee_profile as (
  select id from public.profiles where email = 'worker@fieldops.vn'
),
thu_duc_site as (
  select id from public.worksites where name = 'Cong truong Thu Duc'
)
insert into public.overtime_requests (
  employee_id,
  worksite_id,
  request_date,
  start_time,
  end_time,
  total_hours,
  reason,
  status
)
select
  employee_profile.id,
  thu_duc_site.id,
  current_date,
  current_date::timestamptz + interval '18 hours',
  current_date::timestamptz + interval '21 hours',
  3.0,
  'Tang ca de hoan tat cong viec dang do trong ngay.',
  'pending'
from employee_profile, thu_duc_site
where not exists (
  select 1
  from public.overtime_requests orq
  where orq.employee_id = employee_profile.id
    and orq.request_date = current_date
    and orq.start_time = current_date::timestamptz + interval '18 hours'
);

with employee_profile as (
  select id from public.profiles where email = 'worker@fieldops.vn'
),
attendance_row as (
  select id
  from public.attendance_records
  where employee_id = (select id from employee_profile)
  order by attendance_date desc
  limit 1
)
insert into public.correction_requests (
  employee_id,
  attendance_record_id,
  request_type,
  requested_value,
  reason,
  status
)
select
  employee_profile.id,
  attendance_row.id,
  'missed_check_out',
  '{"requested_value":"Checkout luc 18:15 do ban giao may moc muon."}'::jsonb,
  'Toi quen thao tac checkout tren dien thoai sau khi ban giao cong viec.',
  'pending'
from employee_profile, attendance_row
where not exists (
  select 1
  from public.correction_requests cr
  where cr.employee_id = employee_profile.id
    and cr.attendance_record_id = attendance_row.id
    and cr.request_type = 'missed_check_out'
);
