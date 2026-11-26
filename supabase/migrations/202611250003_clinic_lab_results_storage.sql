-- Storage permissions follow the appointment's assigned doctor, never all doctors.
create or replace function clinic_private.can_manage_lab_path(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.clinic_appointments a
 where split_part(p_path,'/',1)='appointments'
 and split_part(p_path,'/',2)=a.id::text
 and p_path !~ '(^|/)\.\.(/|$)'
 and clinic_private.can_write_record(a.doctor_id));
$$;
revoke all on function clinic_private.can_manage_lab_path(text) from public, anon;
grant execute on function clinic_private.can_manage_lab_path(text) to authenticated;

-- Migration 3: Configure Supabase Storage bucket and policies for clinic-lab-results
-- Wrapped in schema check so local PGlite verification without storage schema succeeds cleanly.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'clinic-lab-results',
      'clinic-lab-results',
      false,
      10485760,
      array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    )
    on conflict (id) do update
    set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

    execute 'drop policy if exists clinic_lab_storage_doctor_insert on storage.objects';
    execute $pol$
      create policy clinic_lab_storage_doctor_insert
        on storage.objects
        for insert
        to authenticated
        with check (
          bucket_id = 'clinic-lab-results'
          and clinic_private.can_manage_lab_path(name)
        )
    $pol$;

    execute 'drop policy if exists clinic_lab_storage_doctor_delete on storage.objects';
    execute $pol$
      create policy clinic_lab_storage_doctor_delete
        on storage.objects
        for delete
        to authenticated
        using (
          bucket_id = 'clinic-lab-results'
          and clinic_private.can_manage_lab_path(name)
        )
    $pol$;

    execute 'drop policy if exists clinic_lab_storage_authorized_select on storage.objects';
    execute $pol$
      create policy clinic_lab_storage_authorized_select
        on storage.objects
        for select
        to authenticated
        using (
          bucket_id = 'clinic-lab-results'
          and (
            clinic_private.can_manage_lab_path(name)
            or exists (
              select 1 from public.clinic_lab_results r
              where r.file_path = name
                and r.patient_id = (select auth.uid())
            )
          )
        )
    $pol$;
  end if;
end
$$;
