begin;

-- ============================================================================
-- MediCare Plus - Bảng Tin nhắn Tư vấn Trực tuyến Bệnh nhân ↔ Bác sĩ (Realtime Chat)
-- ============================================================================

create table if not exists public.clinic_consult_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinic_profiles(id) on delete cascade,
  doctor_id text not null references public.clinic_doctors(id) on delete cascade,
  appointment_id uuid references public.clinic_appointments(id) on delete set null,
  sender_id uuid not null references public.clinic_profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('patient', 'doctor', 'admin')),
  sender_name text not null check (char_length(trim(sender_name)) between 1 and 160),
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_consult_messages_thread
  on public.clinic_consult_messages(patient_id, doctor_id, created_at asc);

create index if not exists idx_consult_messages_doctor
  on public.clinic_consult_messages(doctor_id, created_at desc);

alter table public.clinic_consult_messages enable row level security;

drop policy if exists "consult_messages_select" on public.clinic_consult_messages;
create policy "consult_messages_select"
  on public.clinic_consult_messages for select
  to authenticated
  using (
    patient_id = (select auth.uid())
    or clinic_private.is_admin()
    or exists (
      select 1 from public.clinic_profiles p
      where p.id = (select auth.uid())
        and p.role = 'doctor'
        and p.doctor_id = clinic_consult_messages.doctor_id
    )
  );

drop policy if exists "consult_messages_insert" on public.clinic_consult_messages;
create policy "consult_messages_insert"
  on public.clinic_consult_messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      (sender_role = 'patient' and patient_id = (select auth.uid()))
      or (
        sender_role = 'doctor'
        and exists (
          select 1 from public.clinic_profiles p
          where p.id = (select auth.uid())
            and p.role = 'doctor'
            and p.doctor_id = clinic_consult_messages.doctor_id
        )
      )
      or (sender_role = 'admin' and clinic_private.is_admin())
    )
  );

revoke all on public.clinic_consult_messages from anon, authenticated;
grant select, insert on public.clinic_consult_messages to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.clinic_consult_messages;
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;

commit;
