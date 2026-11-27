begin;

alter table public.clinic_doctors
  add column profile_details jsonb not null default '{}'::jsonb
  check (jsonb_typeof(profile_details) = 'object');

create policy clinic_admin_read_pending_doctors on public.clinic_doctors
  for select to authenticated using (clinic_private.is_admin());

create function public.clinic_admin_create_doctor(p_details jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_doctor public.clinic_doctors;
  v_fee numeric;
  v_exp numeric;
begin
  if not clinic_private.is_admin() then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;
  if p_details is null or jsonb_typeof(p_details) <> 'object'
    or coalesce(char_length(trim(p_details->>'name')),0) not between 5 and 160
    or coalesce(char_length(trim(p_details->>'licenseCode')),0) not between 4 and 120
    or coalesce(char_length(trim(p_details->>'specialty')),0) not between 2 and 160
    or coalesce(char_length(trim(p_details->>'hospital')),0) not between 2 and 240
    or coalesce(char_length(p_details->>'degree'),0) > 160
    or coalesce(char_length(p_details->>'address'),0) > 500
    or jsonb_typeof(p_details->'feeNumeric') is distinct from 'number'
    or jsonb_typeof(p_details->'experienceYears') is distinct from 'number'
  then raise exception 'INVALID_DOCTOR_PROFILE' using errcode = '22023'; end if;
  v_fee := (p_details->>'feeNumeric')::numeric;
  v_exp := (p_details->>'experienceYears')::numeric;
  if v_fee < 50000 or v_fee > 100000000 or v_fee <> trunc(v_fee)
    or v_exp < 0 or v_exp > 60 or v_exp <> trunc(v_exp)
  then raise exception 'INVALID_DOCTOR_PROFILE' using errcode = '22023'; end if;
  if (p_details ? 'latitude' and (jsonb_typeof(p_details->'latitude') <> 'number'
        or (p_details->>'latitude')::numeric not between -90 and 90))
    or (p_details ? 'longitude' and (jsonb_typeof(p_details->'longitude') <> 'number'
        or (p_details->>'longitude')::numeric not between -180 and 180))
    or (coalesce(p_details->>'avatar','') <> ''
        and (char_length(p_details->>'avatar') > 2000000
          or p_details->>'avatar' !~ '^(https?://|data:image/)'))
  then raise exception 'INVALID_DOCTOR_PROFILE' using errcode = '22023'; end if;

  insert into public.clinic_doctors(id,name,specialty,hospital,active,fee_vnd,avatar_url,profile_details)
  values ('doc-' || gen_random_uuid()::text, trim(p_details->>'name'),
    trim(p_details->>'specialty'), trim(p_details->>'hospital'), false, v_fee::integer,
    coalesce(trim(p_details->>'avatar'),''),
    jsonb_strip_nulls(jsonb_build_object('degree',trim(p_details->>'degree'),
      'address',trim(p_details->>'address'), 'latitude',p_details->'latitude',
      'longitude',p_details->'longitude','experienceYears',v_exp,
      'licenseCode',trim(p_details->>'licenseCode'))))
  returning * into v_doctor;
  return to_jsonb(v_doctor);
end;
$$;

create function public.clinic_admin_approve_doctor(p_doctor_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_doctor public.clinic_doctors;
begin
  if not clinic_private.is_admin() then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;
  update public.clinic_doctors set active=true where id=p_doctor_id returning * into v_doctor;
  if not found then raise exception 'DOCTOR_NOT_FOUND' using errcode='22023'; end if;
  return to_jsonb(v_doctor);
end;
$$;

revoke all on function public.clinic_admin_create_doctor(jsonb), public.clinic_admin_approve_doctor(text) from public, anon, authenticated;
grant execute on function public.clinic_admin_create_doctor(jsonb), public.clinic_admin_approve_doctor(text) to authenticated;

notify pgrst, 'reload schema';
commit;
