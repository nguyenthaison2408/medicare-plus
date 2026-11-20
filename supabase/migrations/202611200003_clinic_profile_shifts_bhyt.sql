-- Extension: Profile editing fields, Doctor Shift Schedules, and BHYT Policy Configuration

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
  using (exists (
    select 1 from public.clinic_profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.clinic_profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

revoke all on public.clinic_doctor_schedules from anon, authenticated;
grant select on public.clinic_doctor_schedules to anon, authenticated;
grant insert, update, delete on public.clinic_doctor_schedules to authenticated;

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
  using (exists (
    select 1 from public.clinic_profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.clinic_profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

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
