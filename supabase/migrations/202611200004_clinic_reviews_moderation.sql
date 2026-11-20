-- Extension: Admin review moderation (hide/unhide/delete bad reviews) while keeping verified clinical integrity

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

-- Preserve strict column privacy (never expose patient_id or appointment_id publicly)
grant select(id, doctor_id, patient_name, rating, comment, created_at, is_hidden, admin_note)
  on public.clinic_doctor_reviews to anon, authenticated;
grant update(is_hidden, admin_note) on public.clinic_doctor_reviews to authenticated;
grant delete on public.clinic_doctor_reviews to authenticated;
