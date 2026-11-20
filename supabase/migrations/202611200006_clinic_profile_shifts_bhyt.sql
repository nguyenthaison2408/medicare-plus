-- Extension: Profile editing fields, Doctor Shift Schedules (enforced in slot availability & booking), and BHYT Policy Configuration

alter table public.clinic_profiles
  add column if not exists gender text not null default '',
  add column if not exists dob text not null default '',
  add column if not exists blood_type text not null default '',
  add column if not exists emergency_contact text not null default '',
  add column if not exists bhyt_code text not null default '',
  add column if not exists bhyt_hospital text not null default '',
  add column if not exists bhyt_expiry text not null default '';

grant update(full_name, phone, gender, dob, blood_type, emergency_contact, bhyt_code, bhyt_hospital, bhyt_expiry)
  on public.clinic_profiles to authenticated;

-- 1. Doctor Shift Schedules (Phân lịch trực Bác sĩ)
create table if not exists public.clinic_doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null references public.clinic_doctors(id) on delete cascade,
  work_date date not null,
  shift text not null check (shift in ('morning', 'afternoon', 'full_day')),
  room text not null default 'P.302' check (char_length(trim(room)) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (doctor_id, work_date, shift)
);

alter table public.clinic_doctor_schedules enable row level security;

create policy clinic_schedules_public_read on public.clinic_doctor_schedules
  for select to anon, authenticated
  using (true);

create policy clinic_schedules_admin_write on public.clinic_doctor_schedules
  for all to authenticated
  using (clinic_private.is_admin())
  with check (clinic_private.is_admin());

revoke all on public.clinic_doctor_schedules from anon, authenticated;
grant select on public.clinic_doctor_schedules to anon, authenticated;
grant insert, update, delete on public.clinic_doctor_schedules to authenticated;

-- Helper: enforce assigned shifts when schedules exist for a doctor on a given date.
-- When no schedule row exists for (doctor_id, work_date), default clinic hours apply.
create or replace function clinic_private.is_within_doctor_shift(
  p_doctor_id text,
  p_date date,
  p_local_time time
)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.clinic_doctor_schedules s
    where s.doctor_id = p_doctor_id and s.work_date = p_date
  ) then
    return true;
  end if;

  return exists (
    select 1 from public.clinic_doctor_schedules s
    where s.doctor_id = p_doctor_id
      and s.work_date = p_date
      and s.active = true
      and (
        s.shift = 'full_day'
        or (s.shift = 'morning' and p_local_time < '12:00'::time)
        or (s.shift = 'afternoon' and p_local_time >= '13:00'::time)
      )
  );
end;
$$;

revoke all on function clinic_private.is_within_doctor_shift(text, date, time) from public, anon, authenticated;
grant execute on function clinic_private.is_within_doctor_shift(text, date, time) to anon, authenticated;

-- Wire shift schedule enforcement into clinic_slot_availability
create or replace function public.clinic_slot_availability(p_doctor_id text, p_date date)
returns table(starts_at timestamptz, is_booked boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date
     or p_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date + 90 then
    raise exception 'INVALID_BOOKING_DATE' using errcode = '22023';
  end if;
  if not exists(select 1 from public.clinic_doctors where id = p_doctor_id and active) then
    raise exception 'DOCTOR_NOT_FOUND' using errcode = '22023';
  end if;
  return query
    select x.slot_time,
      (x.slot_time <= now()
       or not clinic_private.is_within_doctor_shift(p_doctor_id, p_date, x.local_time)
       or exists (
         select 1 from public.clinic_appointments a
         where a.doctor_id = p_doctor_id and a.starts_at = x.slot_time and a.status <> 'CANCELLED'
       ))
    from (
      select (p_date + t.local_time) at time zone 'Asia/Ho_Chi_Minh' as slot_time, t.local_time
      from (values ('08:00'::time),('08:30'),('09:00'),('09:30'),('10:00'),('10:30'),('11:00'),
                   ('13:30'),('14:00'),('14:30'),('15:00'),('15:30'),('16:00'),('16:30')) as t(local_time)
    ) x order by x.slot_time;
end;
$$;

-- Wire shift schedule enforcement into clinic_book_appointment
create or replace function public.clinic_book_appointment(
  p_doctor_id text,
  p_starts_at timestamptz,
  p_payment_method text default 'at_clinic_bhyt',
  p_patient_name text default null,
  p_patient_phone text default null,
  p_patient_email text default null,
  p_symptoms text default 'Khám tổng quát'
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_patient public.clinic_profiles;
  v_appointment public.clinic_appointments;
  v_local_date date := (p_starts_at at time zone 'Asia/Ho_Chi_Minh')::date;
  v_local_time time := (p_starts_at at time zone 'Asia/Ho_Chi_Minh')::time;
  v_patient_name text;
  v_patient_phone text;
  v_patient_email text;
  v_symptoms text;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into v_patient from public.clinic_profiles where id = (select auth.uid());
  if not found or v_patient.role <> 'patient' then raise exception 'PATIENT_REQUIRED' using errcode = '42501'; end if;

  v_patient_name := trim(coalesce(p_patient_name, v_patient.full_name));
  v_patient_phone := regexp_replace(trim(coalesce(p_patient_phone, v_patient.phone)), '[[:space:].-]', '', 'g');
  v_patient_email := lower(trim(coalesce(p_patient_email, '')));
  v_symptoms := trim(p_symptoms);

  if char_length(v_patient_name) not between 2 and 160
     or v_patient_name !~ '^[[:alpha:][:space:].''-]+$' then
    raise exception 'INVALID_PATIENT_NAME' using errcode = '22023';
  end if;
  if v_patient_phone !~ '^0[35789][0-9]{8}$' then
    raise exception 'INVALID_PATIENT_PHONE' using errcode = '22023';
  end if;
  if p_patient_email is not null and (char_length(v_patient_email) > 254
     or v_patient_email !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then
    raise exception 'INVALID_PATIENT_EMAIL' using errcode = '22023';
  end if;
  if v_symptoms is null or char_length(v_symptoms) not between 5 and 1000 then
    raise exception 'INVALID_SYMPTOMS' using errcode = '22023';
  end if;

  if p_starts_at is null or p_starts_at <= now() or p_starts_at > now() + interval '90 days'
     or v_local_time not in ('08:00'::time,'08:30','09:00','09:30','10:00','10:30','11:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30') then
    raise exception 'INVALID_BOOKING_TIME' using errcode = '22023';
  end if;
  if p_payment_method not in ('at_clinic_bhyt','at_clinic') then
    raise exception 'ONLINE_PAYMENT_NOT_CONFIGURED' using errcode = '22023';
  end if;

  perform 1 from public.clinic_doctors where id = p_doctor_id and active for update;
  if not found then raise exception 'DOCTOR_NOT_FOUND' using errcode = '22023'; end if;

  if not clinic_private.is_within_doctor_shift(p_doctor_id, v_local_date, v_local_time) then
    raise exception 'OUTSIDE_DOCTOR_SHIFT' using errcode = '22023';
  end if;

  if exists(
    select 1 from public.clinic_appointments
    where doctor_id = p_doctor_id and starts_at = p_starts_at and status <> 'CANCELLED'
  ) then
    raise exception 'SLOT_ALREADY_BOOKED' using errcode = '23505';
  end if;

  insert into public.clinic_appointments(
    patient_id, doctor_id, patient_name, patient_phone, patient_email,
    symptoms, starts_at, payment_method
  ) values (
    v_patient.id, p_doctor_id, v_patient_name, v_patient_phone,
    v_patient_email, v_symptoms, p_starts_at, p_payment_method
  ) returning * into v_appointment;

  return to_jsonb(v_appointment);
end;
$$;

-- 2. BHYT Policy Configuration (Cấu hình chính sách BHYT)
create table if not exists public.clinic_bhyt_configs (
  id text primary key,
  prefix_code text not null unique check (char_length(trim(prefix_code)) between 2 and 10),
  group_name text not null check (char_length(trim(group_name)) between 2 and 160),
  in_network_rate integer not null check (in_network_rate between 0 and 100),
  out_network_rate integer not null check (out_network_rate between 0 and 100),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.clinic_bhyt_configs enable row level security;

create policy clinic_bhyt_public_read on public.clinic_bhyt_configs
  for select to anon, authenticated
  using (true);

create policy clinic_bhyt_admin_write on public.clinic_bhyt_configs
  for all to authenticated
  using (clinic_private.is_admin())
  with check (clinic_private.is_admin());

revoke all on public.clinic_bhyt_configs from anon, authenticated;
grant select on public.clinic_bhyt_configs to anon, authenticated;
grant insert, update, delete on public.clinic_bhyt_configs to authenticated;

insert into public.clinic_bhyt_configs (id, prefix_code, group_name, in_network_rate, out_network_rate, active)
values
  ('bhyt-te', 'TE', 'Trẻ em dưới 6 tuổi', 100, 80, true),
  ('bhyt-ht', 'HT', 'Người hưởng lương hưu / Cao tuổi', 95, 60, true),
  ('bhyt-dn', 'DN', 'Người lao động doanh nghiệp', 80, 40, true),
  ('bhyt-gd', 'GD', 'Tham gia theo Hộ gia đình', 80, 40, true)
on conflict (id) do nothing;
