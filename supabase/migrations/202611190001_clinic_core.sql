begin;

create schema if not exists clinic_private;
revoke all on schema clinic_private from public;

create table public.clinic_doctors (
  id text primary key,
  name text not null,
  specialty text not null,
  hospital text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clinic_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  phone text not null default '' check (phone = '' or phone ~ '^0[35789][0-9]{8}$'),
  role text not null default 'patient' check (role in ('patient','doctor','reception','admin')),
  doctor_id text references public.clinic_doctors(id),
  created_at timestamptz not null default now(),
  check (role <> 'doctor' or doctor_id is not null)
);

create table public.clinic_appointments (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique default ('MC-' || upper(replace(gen_random_uuid()::text,'-',''))),
  patient_id uuid not null references public.clinic_profiles(id),
  doctor_id text not null references public.clinic_doctors(id),
  patient_name text not null,
  patient_phone text not null,
  starts_at timestamptz not null,
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED')),
  payment_method text not null default 'at_clinic_bhyt',
  payment_status text not null default 'UNPAID' check (payment_status in ('UNPAID','PAID')),
  checked_in_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index clinic_one_active_booking_per_slot
  on public.clinic_appointments(doctor_id, starts_at) where status <> 'CANCELLED';
create index clinic_patient_appointments on public.clinic_appointments(patient_id, starts_at desc);
create index clinic_doctor_appointments on public.clinic_appointments(doctor_id, starts_at);

create table public.clinic_medical_records (
  appointment_id uuid primary key references public.clinic_appointments(id),
  diagnosis text not null check (char_length(trim(diagnosis)) between 2 and 4000),
  medications jsonb not null default '[]'::jsonb check (jsonb_typeof(medications) = 'array'),
  notes text not null default '',
  author_id uuid not null references public.clinic_profiles(id),
  updated_at timestamptz not null default now()
);

create function clinic_private.on_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.clinic_profiles(id, full_name, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Bệnh nhân'),
    coalesce(new.raw_user_meta_data->>'phone','')
  );
  -- Role and doctor_id deliberately never come from user-editable metadata.
  return new;
end;
$$;
create trigger clinic_auth_user_created after insert on auth.users
  for each row execute function clinic_private.on_auth_user_created();

create function clinic_private.can_manage_appointment(p_doctor_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.clinic_profiles p where p.id = (select auth.uid())
      and (p.role in ('admin','reception') or (p.role = 'doctor' and p.doctor_id = p_doctor_id))
  );
$$;

create function clinic_private.can_write_record(p_doctor_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.clinic_profiles p where p.id = (select auth.uid())
      and (p.role = 'admin' or (p.role = 'doctor' and p.doctor_id = p_doctor_id))
  );
$$;

alter table public.clinic_profiles enable row level security;
alter table public.clinic_doctors enable row level security;
alter table public.clinic_appointments enable row level security;
alter table public.clinic_medical_records enable row level security;

create policy clinic_own_profile on public.clinic_profiles for select to authenticated
  using (id = (select auth.uid()));
create policy clinic_edit_own_profile on public.clinic_profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy clinic_public_doctors on public.clinic_doctors for select to anon, authenticated
  using (active);
create policy clinic_read_appointments on public.clinic_appointments for select to authenticated
  using (patient_id = (select auth.uid()) or clinic_private.can_manage_appointment(doctor_id));
create policy clinic_read_records on public.clinic_medical_records for select to authenticated
  using (exists (
    select 1 from public.clinic_appointments a where a.id = appointment_id
      and (a.patient_id = (select auth.uid()) or clinic_private.can_write_record(a.doctor_id))
  ));

-- Authenticated users may edit their contact details, never their role or doctor assignment.
revoke all on public.clinic_profiles, public.clinic_doctors, public.clinic_appointments, public.clinic_medical_records from anon, authenticated;
grant select on public.clinic_doctors to anon, authenticated;
grant select on public.clinic_profiles, public.clinic_appointments, public.clinic_medical_records to authenticated;
grant update(full_name,phone) on public.clinic_profiles to authenticated;
grant usage on schema clinic_private to authenticated;
revoke all on all functions in schema clinic_private from public, anon, authenticated;
grant execute on function clinic_private.can_manage_appointment(text), clinic_private.can_write_record(text) to authenticated;

create function public.clinic_slot_availability(p_doctor_id text, p_date date)
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
      (x.slot_time <= now() or exists (
        select 1 from public.clinic_appointments a
        where a.doctor_id = p_doctor_id and a.starts_at = x.slot_time and a.status <> 'CANCELLED'
      ))
    from (
      select (p_date + t.local_time) at time zone 'Asia/Ho_Chi_Minh' as slot_time
      from (values ('08:00'::time),('08:30'),('09:00'),('09:30'),('10:00'),('10:30'),('11:00'),
                   ('13:30'),('14:00'),('14:30'),('15:00'),('15:30'),('16:00'),('16:30')) as t(local_time)
    ) x order by x.slot_time;
end;
$$;

create function public.clinic_book_appointment(p_doctor_id text, p_starts_at timestamptz, p_payment_method text default 'at_clinic_bhyt')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_patient public.clinic_profiles;
  v_appointment public.clinic_appointments;
  v_local_time time := (p_starts_at at time zone 'Asia/Ho_Chi_Minh')::time;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into v_patient from public.clinic_profiles where id = (select auth.uid());
  if not found or v_patient.role <> 'patient' then raise exception 'PATIENT_REQUIRED' using errcode = '42501'; end if;
  if v_patient.phone = '' then raise exception 'PATIENT_PHONE_REQUIRED' using errcode = '22023'; end if;
  if p_starts_at is null or p_starts_at <= now() or p_starts_at > now() + interval '90 days'
     or v_local_time not in ('08:00'::time,'08:30','09:00','09:30','10:00','10:30','11:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30') then
    raise exception 'INVALID_BOOKING_TIME' using errcode = '22023';
  end if;
  if p_payment_method not in ('at_clinic_bhyt','at_clinic') then
    raise exception 'ONLINE_PAYMENT_NOT_CONFIGURED' using errcode = '22023';
  end if;
  -- A real PostgreSQL row lock serializes competing bookings for this doctor.
  perform 1 from public.clinic_doctors where id = p_doctor_id and active for update;
  if not found then raise exception 'DOCTOR_NOT_FOUND' using errcode = '22023'; end if;
  if exists(select 1 from public.clinic_appointments where doctor_id = p_doctor_id and starts_at = p_starts_at and status <> 'CANCELLED') then
    raise exception 'SLOT_ALREADY_BOOKED' using errcode = '23505';
  end if;
  insert into public.clinic_appointments(patient_id,doctor_id,patient_name,patient_phone,starts_at,payment_method)
    values(v_patient.id,p_doctor_id,v_patient.full_name,v_patient.phone,p_starts_at,p_payment_method)
    returning * into v_appointment;
  return to_jsonb(v_appointment);
end;
$$;

create function public.clinic_cancel_appointment(p_appointment_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_appointment public.clinic_appointments;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into v_appointment from public.clinic_appointments where id = p_appointment_id for update;
  if not found then raise exception 'APPOINTMENT_NOT_FOUND' using errcode = '22023'; end if;
  if v_appointment.patient_id <> (select auth.uid()) and not clinic_private.can_manage_appointment(v_appointment.doctor_id) then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;
  if v_appointment.status = 'COMPLETED' then raise exception 'APPOINTMENT_ALREADY_COMPLETED' using errcode = '22023'; end if;
  update public.clinic_appointments set status = 'CANCELLED' where id = v_appointment.id returning * into v_appointment;
  return to_jsonb(v_appointment);
end;
$$;

create function public.clinic_check_in(p_booking_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_appointment public.clinic_appointments;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into v_appointment from public.clinic_appointments where booking_code = trim(p_booking_code) for update;
  if not found then raise exception 'APPOINTMENT_NOT_FOUND' using errcode = '22023'; end if;
  if not clinic_private.can_manage_appointment(v_appointment.doctor_id) then raise exception 'ACCESS_DENIED' using errcode = '42501'; end if;
  if v_appointment.status not in ('CONFIRMED','CHECKED_IN') then raise exception 'INVALID_APPOINTMENT_STATE' using errcode = '22023'; end if;
  if (v_appointment.starts_at at time zone 'Asia/Ho_Chi_Minh')::date <> (now() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'CHECK_IN_DATE_MISMATCH' using errcode = '22023';
  end if;
  update public.clinic_appointments set status = 'CHECKED_IN', checked_in_at = coalesce(checked_in_at, now())
    where id = v_appointment.id returning * into v_appointment;
  return to_jsonb(v_appointment);
end;
$$;

create function public.clinic_complete_appointment(p_appointment_id uuid, p_diagnosis text, p_medications jsonb default '[]'::jsonb, p_notes text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_appointment public.clinic_appointments;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into v_appointment from public.clinic_appointments where id = p_appointment_id for update;
  if not found then raise exception 'APPOINTMENT_NOT_FOUND' using errcode = '22023'; end if;
  if not clinic_private.can_write_record(v_appointment.doctor_id) then raise exception 'ACCESS_DENIED' using errcode = '42501'; end if;
  if v_appointment.status <> 'CHECKED_IN' then raise exception 'PATIENT_NOT_CHECKED_IN' using errcode = '22023'; end if;
  if p_diagnosis is null or char_length(trim(p_diagnosis)) not between 2 and 4000
     or p_medications is null or jsonb_typeof(p_medications) <> 'array' or jsonb_array_length(p_medications) > 50 then
    raise exception 'INVALID_MEDICAL_RECORD' using errcode = '22023';
  end if;
  if exists(select 1 from jsonb_array_elements(p_medications) m where jsonb_typeof(m) <> 'object' or coalesce(trim(m->>'name'),'') = '' or coalesce(trim(m->>'dosage'),'') = '') then
    raise exception 'INVALID_MEDICATION' using errcode = '22023';
  end if;
  insert into public.clinic_medical_records(appointment_id,diagnosis,medications,notes,author_id)
    values(v_appointment.id,trim(p_diagnosis),p_medications,coalesce(p_notes,''),(select auth.uid()));
  update public.clinic_appointments set status = 'COMPLETED', completed_at = now()
    where id = v_appointment.id returning * into v_appointment;
  return to_jsonb(v_appointment);
end;
$$;

revoke all on function public.clinic_slot_availability(text,date), public.clinic_book_appointment(text,timestamptz,text),
  public.clinic_cancel_appointment(uuid), public.clinic_check_in(text), public.clinic_complete_appointment(uuid,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.clinic_slot_availability(text,date) to anon, authenticated;
grant execute on function public.clinic_book_appointment(text,timestamptz,text), public.clinic_cancel_appointment(uuid),
  public.clinic_check_in(text), public.clinic_complete_appointment(uuid,text,jsonb,text) to authenticated;

insert into public.clinic_doctors(id,name,specialty,hospital) values
  ('doc-1','TS. BS. Lê Thu Trang','Thần kinh','BV. Đại học Y Dược TP.HCM'),
  ('doc-2','BS. CKII. Trần Văn Minh','Tim mạch','BV. Chợ Rẫy'),
  ('doc-3','ThS. BS. Nguyễn Hoàng Đức','Nội khoa','BV. Đa khoa Quốc tế Vinmec'),
  ('doc-4','BS. CKI. Phạm Ngọc Anh','Mắt','BV. Mắt TP.HCM');

do $$
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.clinic_appointments;
    alter publication supabase_realtime add table public.clinic_medical_records;
  end if;
end;
$$;

commit;
