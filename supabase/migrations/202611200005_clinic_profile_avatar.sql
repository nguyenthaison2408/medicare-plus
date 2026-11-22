-- Extension: Patient avatar_url column on clinic_profiles

alter table public.clinic_profiles
  add column if not exists avatar_url text not null default '';

grant update(avatar_url) on public.clinic_profiles to authenticated;
