begin;
create table public.clinic_doctor_reviews (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null references public.clinic_doctors(id),
  patient_id uuid not null references public.clinic_profiles(id) on delete cascade,
  appointment_id uuid not null references public.clinic_appointments(id) on delete cascade,
  patient_name text not null check (char_length(trim(patient_name)) between 2 and 160),
  rating int not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 2 and 1000),
  created_at timestamptz not null default now(),
  unique(patient_id, doctor_id)
);
create index clinic_doctor_reviews_catalog on public.clinic_doctor_reviews(doctor_id, created_at desc);
alter table public.clinic_doctor_reviews enable row level security;
create policy clinic_public_reviews on public.clinic_doctor_reviews for select using (true);
-- Public reviews never expose Auth IDs or appointment IDs. Writes use the validated RPC only.
revoke all on public.clinic_doctor_reviews from anon, authenticated;
grant select(id,doctor_id,patient_name,rating,comment,created_at) on public.clinic_doctor_reviews to anon, authenticated;
create function public.clinic_submit_doctor_review(p_appointment_id uuid, p_rating integer, p_comment text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_name text;
  v_appointment public.clinic_appointments;
  v_review public.clinic_doctor_reviews;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select full_name into v_name from public.clinic_profiles where id=v_user and role='patient';
  if not found then raise exception 'PATIENT_REQUIRED' using errcode='42501'; end if;
  select * into v_appointment from public.clinic_appointments
    where id=p_appointment_id and patient_id=v_user and status='COMPLETED' for share;
  if not found then raise exception 'COMPLETED_APPOINTMENT_REQUIRED' using errcode='42501'; end if;
  if p_rating is null or p_rating not between 1 and 5 or p_comment is null
    or char_length(trim(p_comment)) not between 2 and 1000 then
    raise exception 'INVALID_REVIEW' using errcode='22023';
  end if;
  insert into public.clinic_doctor_reviews(doctor_id,patient_id,appointment_id,patient_name,rating,comment)
    values(v_appointment.doctor_id,v_user,v_appointment.id,v_name,p_rating,trim(p_comment)) returning * into v_review;
  return to_jsonb(v_review);
exception when unique_violation then
  raise exception 'REVIEW_ALREADY_EXISTS' using errcode='23505';
end;
$$;
revoke all on function public.clinic_submit_doctor_review(uuid,integer,text) from public, anon, authenticated;
grant execute on function public.clinic_submit_doctor_review(uuid,integer,text) to authenticated;
-- No fabricated seed reviews are labelled as verified clinical visits.
commit;
