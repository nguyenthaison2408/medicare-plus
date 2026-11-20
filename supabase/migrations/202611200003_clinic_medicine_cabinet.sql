begin;

-- Medicine cabinet data is private to the patient who created it.
create table public.clinic_medicine_cabinet (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.clinic_profiles(id) on delete cascade,
  medicine_name text not null check (char_length(trim(medicine_name)) between 2 and 200),
  owner_label text not null check (char_length(trim(owner_label)) between 2 and 160),
  stock_label text not null check (char_length(trim(stock_label)) between 1 and 100),
  expiry_label text not null check (char_length(trim(expiry_label)) between 1 and 100),
  urgent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clinic_medicine_cabinet_owner
  on public.clinic_medicine_cabinet(owner_id, created_at desc);

create function public.clinic_touch_medicine_cabinet_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger clinic_medicine_cabinet_touch_updated_at
before update on public.clinic_medicine_cabinet
for each row execute function public.clinic_touch_medicine_cabinet_updated_at();

alter table public.clinic_medicine_cabinet enable row level security;
create policy clinic_medicine_cabinet_owner_only
  on public.clinic_medicine_cabinet
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.clinic_profiles
      where id = (select auth.uid()) and role = 'patient'
    )
  );

revoke all on public.clinic_medicine_cabinet from anon, authenticated;
grant select, delete on public.clinic_medicine_cabinet to authenticated;
grant insert (owner_id, medicine_name, owner_label, stock_label, expiry_label, urgent)
  on public.clinic_medicine_cabinet to authenticated;
grant update (medicine_name, owner_label, stock_label, expiry_label, urgent)
  on public.clinic_medicine_cabinet to authenticated;

-- One row per patient, calendar day and medication time slot.
create table public.clinic_medication_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.clinic_profiles(id) on delete cascade,
  log_date date not null,
  slot_key text not null check (slot_key in ('morning', 'afternoon', 'evening')),
  taken boolean not null default false,
  taken_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(owner_id, log_date, slot_key),
  check ((taken and taken_at is not null) or (not taken and taken_at is null))
);

create index clinic_medication_logs_owner_date
  on public.clinic_medication_logs(owner_id, log_date desc);

alter table public.clinic_medication_logs enable row level security;
create policy clinic_medication_logs_owner_read
  on public.clinic_medication_logs
  for select to authenticated
  using (owner_id = (select auth.uid()));

-- Logs are written only through the RPC below so identity, date and timestamps
-- cannot be forged by the client.
revoke all on public.clinic_medication_logs from anon, authenticated;

create function public.clinic_get_medication_log()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_log jsonb;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.clinic_profiles where id = v_user and role = 'patient'
  ) then
    raise exception 'PATIENT_REQUIRED' using errcode = '42501';
  end if;

  select coalesce(jsonb_object_agg(slot_key, taken), '{}'::jsonb)
    into v_log
    from public.clinic_medication_logs
    where owner_id = v_user and log_date = v_date;

  return jsonb_build_object(
    'morning', false,
    'afternoon', false,
    'evening', false
  ) || v_log;
end;
$$;

create function public.clinic_set_medication_taken(
  p_slot_key text,
  p_taken boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.clinic_profiles where id = v_user and role = 'patient'
  ) then
    raise exception 'PATIENT_REQUIRED' using errcode = '42501';
  end if;
  if p_slot_key is null
    or p_slot_key not in ('morning', 'afternoon', 'evening')
    or p_taken is null then
    raise exception 'INVALID_MEDICATION_LOG' using errcode = '22023';
  end if;

  insert into public.clinic_medication_logs (
    owner_id, log_date, slot_key, taken, taken_at, updated_at
  ) values (
    v_user, v_date, p_slot_key, p_taken,
    case when p_taken then now() else null end,
    now()
  )
  on conflict (owner_id, log_date, slot_key) do update
    set taken = excluded.taken,
        taken_at = excluded.taken_at,
        updated_at = excluded.updated_at;

  return public.clinic_get_medication_log();
end;
$$;

revoke all on function public.clinic_get_medication_log() from public, anon, authenticated;
revoke all on function public.clinic_set_medication_taken(text, boolean) from public, anon, authenticated;
grant execute on function public.clinic_get_medication_log() to authenticated;
grant execute on function public.clinic_set_medication_taken(text, boolean) to authenticated;

commit;
