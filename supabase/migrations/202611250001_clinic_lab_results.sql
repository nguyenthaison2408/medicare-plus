-- Migration 1: Create clinic_lab_results table for clinical lab & imaging attachments
create table if not exists public.clinic_lab_results (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.clinic_appointments(id) on delete cascade,
  patient_id uuid not null references public.clinic_profiles(id) on delete cascade,
  doctor_id text not null references public.clinic_doctors(id),
  author_id uuid not null references public.clinic_profiles(id),
  category text not null check (category in ('imaging', 'blood', 'pathology', 'other')),
  title text not null check (char_length(trim(title)) between 2 and 200),
  conclusion text not null default '' check (char_length(conclusion) <= 2000),
  file_path text not null check (char_length(trim(file_path)) between 3 and 500),
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create index if not exists clinic_lab_results_patient_idx
  on public.clinic_lab_results(patient_id, created_at desc);

create index if not exists clinic_lab_results_appointment_idx
  on public.clinic_lab_results(appointment_id, created_at desc);

create index if not exists clinic_lab_results_doctor_idx
  on public.clinic_lab_results(doctor_id, created_at desc);
