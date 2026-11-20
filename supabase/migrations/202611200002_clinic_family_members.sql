begin;

-- ============================================================================
-- MediCare Plus - Bổ sung bảng Quản lý Hồ sơ Gia đình (Family Profiles)
-- ============================================================================

create table if not exists public.clinic_family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.clinic_profiles(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  relationship text not null check (char_length(trim(relationship)) between 2 and 60),
  dob text not null default '',
  bhyt_code text not null default '',
  blood_group text not null default 'Chưa xét nghiệm',
  note text not null default 'Hồ sơ sức khỏe theo dõi định kỳ',
  created_at timestamptz not null default now()
);

create index if not exists idx_family_members_owner on public.clinic_family_members(owner_id, created_at desc);

-- Row Level Security (RLS)
alter table public.clinic_family_members enable row level security;

-- Chủ hồ sơ (bệnh nhân) chỉ được xem và quản lý thành viên gia đình của chính mình
drop policy if exists "Users can manage own family members" on public.clinic_family_members;
create policy "Users can manage own family members"
  on public.clinic_family_members for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Family data remains private to its owner; a staff role grants no blanket access.
drop policy if exists "Staff can view patient family members" on public.clinic_family_members;
revoke all on public.clinic_family_members from anon, authenticated;
grant select, insert, update, delete on public.clinic_family_members to authenticated;

commit;
