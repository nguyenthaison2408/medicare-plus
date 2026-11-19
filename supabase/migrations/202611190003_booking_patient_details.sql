begin;

alter table public.clinic_appointments
  add column patient_email text not null default '',
  add column symptoms text not null default 'Không cung cấp';

alter table public.clinic_appointments
  add constraint clinic_appointment_email_format
    check (patient_email = '' or patient_email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  add constraint clinic_appointment_symptoms_length
    check (char_length(trim(symptoms)) between 5 and 1000);

drop function public.clinic_book_appointment(text,timestamptz,text);

create function public.clinic_book_appointment(
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
  v_local_time time := (p_starts_at at time zone 'Asia/Ho_Chi_Minh')::time;
  v_patient_name text;
  v_patient_phone text;
  v_patient_email text;
  v_symptoms text;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into v_patient from public.clinic_profiles where id = (select auth.uid());
  if not found or v_patient.role <> 'patient' then raise exception 'PATIENT_REQUIRED' using errcode = '42501'; end if;

  v_patient_name := coalesce(nullif(trim(p_patient_name), ''), v_patient.full_name);
  v_patient_phone := regexp_replace(coalesce(nullif(trim(p_patient_phone), ''), v_patient.phone), '[[:space:].-]', '', 'g');
  v_patient_email := lower(coalesce(nullif(trim(p_patient_email), ''), v_patient.id::text || '@patient.local'));
  v_symptoms := coalesce(nullif(trim(p_symptoms), ''), 'Khám tổng quát');

  if char_length(v_patient_name) not between 2 and 160 then
    raise exception 'INVALID_PATIENT_NAME' using errcode = '22023';
  end if;
  if v_patient_phone !~ '^0[35789][0-9]{8}$' then
    raise exception 'INVALID_PATIENT_PHONE' using errcode = '22023';
  end if;
  if char_length(v_patient_email) > 254
     or v_patient_email !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'INVALID_PATIENT_EMAIL' using errcode = '22023';
  end if;
  if char_length(v_symptoms) not between 5 and 1000 then
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

revoke all on function public.clinic_book_appointment(text,timestamptz,text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.clinic_book_appointment(text,timestamptz,text,text,text,text,text)
  to authenticated;

commit;
