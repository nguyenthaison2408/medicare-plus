-- Extension: Admin review moderation (hide/unhide/delete bad reviews) while keeping admin_note private to admins

alter table public.clinic_doctor_reviews
  add column if not exists is_hidden boolean not null default false,
  add column if not exists admin_note text not null default '';

create or replace function clinic_private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.clinic_profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

grant usage on schema clinic_private to anon, authenticated;
revoke all on function clinic_private.is_admin() from public, anon, authenticated;
grant execute on function clinic_private.is_admin() to anon, authenticated;

drop policy if exists clinic_public_reviews on public.clinic_doctor_reviews;

create policy clinic_public_reviews on public.clinic_doctor_reviews
  for select to anon, authenticated
  using (is_hidden = false or clinic_private.is_admin());

create policy clinic_admin_moderate_reviews on public.clinic_doctor_reviews
  for update to authenticated
  using (clinic_private.is_admin())
  with check (clinic_private.is_admin());

create policy clinic_admin_delete_reviews on public.clinic_doctor_reviews
  for delete to authenticated
  using (clinic_private.is_admin());

-- Preserve strict column privacy: never expose patient_id, appointment_id, or admin_note to anon/patients
revoke select on public.clinic_doctor_reviews from anon, authenticated;
grant select(id, doctor_id, patient_name, rating, comment, created_at, is_hidden)
  on public.clinic_doctor_reviews to anon, authenticated;
grant update(is_hidden, admin_note) on public.clinic_doctor_reviews to authenticated;
grant delete on public.clinic_doctor_reviews to authenticated;

-- Admin-only RPC to read reviews including private admin_note
create or replace function public.clinic_admin_list_reviews()
returns table(
  id uuid,
  doctor_id text,
  patient_name text,
  rating int,
  comment text,
  created_at timestamptz,
  is_hidden boolean,
  admin_note text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not clinic_private.is_admin() then
    raise exception 'ACCESS_DENIED' using errcode = '42501';
  end if;
  return query
    select r.id, r.doctor_id, r.patient_name, r.rating, r.comment, r.created_at, r.is_hidden, r.admin_note
    from public.clinic_doctor_reviews r
    order by r.created_at desc;
end;
$$;

revoke all on function public.clinic_admin_list_reviews() from public, anon, authenticated;
grant execute on function public.clinic_admin_list_reviews() to authenticated;
