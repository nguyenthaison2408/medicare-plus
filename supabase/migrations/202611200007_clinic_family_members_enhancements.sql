begin;

-- ============================================================================
-- MediCare Plus - Mở rộng Hồ sơ Gia đình (Family Profiles Cloud Enhancements)
-- Bổ sung giới tính, số điện thoại liên hệ, tiền sử dị ứng và thời gian cập nhật
-- ============================================================================

alter table public.clinic_family_members
  add column if not exists gender text not null default 'Chưa cập nhật',
  add column if not exists phone text not null default '',
  add column if not exists allergies text not null default '',
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.clinic_family_members_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'CANNOT_TRANSFER_FAMILY_MEMBER_OWNER' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_clinic_family_members_before_update on public.clinic_family_members;
create trigger trg_clinic_family_members_before_update
  before update on public.clinic_family_members
  for each row
  execute function public.clinic_family_members_before_update();

commit;
