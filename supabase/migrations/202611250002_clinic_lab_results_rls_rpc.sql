-- Migration 2: RLS policies and validated RPCs for clinic_lab_results
alter table public.clinic_lab_results enable row level security;

revoke all on public.clinic_lab_results from anon;
grant select on public.clinic_lab_results to authenticated;

drop policy if exists clinic_lab_results_select_own on public.clinic_lab_results;
create policy clinic_lab_results_select_own
  on public.clinic_lab_results
  for select
  to authenticated
  using (
    patient_id = (select auth.uid())
    or clinic_private.can_write_record(doctor_id)
  );

create or replace function public.clinic_add_lab_result(
  p_appointment_id uuid,
  p_category text,
  p_title text,
  p_conclusion text,
  p_file_path text,
  p_file_name text,
  p_mime_type text,
  p_file_size_bytes integer
)
returns public.clinic_lab_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_apt public.clinic_appointments%rowtype;
  v_row public.clinic_lab_results%rowtype;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập hệ thống.' using errcode = '42501';
  end if;

  select * into v_apt
  from public.clinic_appointments
  where id = p_appointment_id;

  if not found then
    raise exception 'Không tìm thấy lịch hẹn khám.' using errcode = 'P0002';
  end if;

  if not clinic_private.can_write_record(v_apt.doctor_id) then
    raise exception 'Chỉ bác sĩ phụ trách hoặc quản trị viên mới được tải lên kết quả cận lâm sàng.' using errcode = '42501';
  end if;

  if p_category not in ('imaging', 'blood', 'pathology', 'other') then
    raise exception 'Loại cận lâm sàng không hợp lệ.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_title, ''))) < 2 or char_length(trim(p_title)) > 200 then
    raise exception 'Tiêu đề kết quả phải từ 2 đến 200 ký tự.' using errcode = '22023';
  end if;

  if p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp') then
    raise exception 'Chỉ hỗ trợ tệp PDF hoặc hình ảnh (JPG, PNG, WEBP).' using errcode = '22023';
  end if;

  if p_file_size_bytes is null or p_file_size_bytes <= 0 or p_file_size_bytes > 10485760 then
    raise exception 'Dung lượng tệp phải từ 1 byte đến tối đa 10MB.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_file_path, ''))) < 3 then
    raise exception 'Đường dẫn lưu trữ tệp không hợp lệ.' using errcode = '22023';
  end if;

  if p_file_path not like 'appointments/' || v_apt.id::text || '/%'
     or p_file_path ~ '(^|/)\.\.(/|$)' then
    raise exception 'INVALID_LAB_APPOINTMENT_PATH' using errcode = '22023';
  end if;
  if exists (select 1 from public.clinic_lab_results where file_path = trim(p_file_path)) then
    raise exception 'LAB_FILE_ALREADY_LINKED' using errcode = '22023';
  end if;
  if to_regclass('storage.objects') is not null then
    if not exists (select 1 from storage.objects where bucket_id = 'clinic-lab-results' and name = p_file_path) then
      raise exception 'LAB_FILE_NOT_UPLOADED' using errcode = '22023';
    end if;
  end if;

  insert into public.clinic_lab_results (
    appointment_id,
    patient_id,
    doctor_id,
    author_id,
    category,
    title,
    conclusion,
    file_path,
    file_name,
    mime_type,
    file_size_bytes
  ) values (
    v_apt.id,
    v_apt.patient_id,
    v_apt.doctor_id,
    v_uid,
    p_category,
    trim(p_title),
    coalesce(trim(p_conclusion), ''),
    trim(p_file_path),
    coalesce(nullif(trim(p_file_name), ''), 'ket-qua-cls'),
    p_mime_type,
    p_file_size_bytes
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.clinic_delete_lab_result(p_result_id uuid)
returns public.clinic_lab_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.clinic_lab_results%rowtype;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập hệ thống.' using errcode = '42501';
  end if;

  select * into v_row
  from public.clinic_lab_results
  where id = p_result_id;

  if not found then
    raise exception 'Không tìm thấy kết quả cận lâm sàng.' using errcode = 'P0002';
  end if;

  if not clinic_private.can_write_record(v_row.doctor_id) then
    raise exception 'Bạn không có quyền xóa kết quả cận lâm sàng này.' using errcode = '42501';
  end if;

  delete from public.clinic_lab_results where id = p_result_id;
  return v_row;
end;
$$;

revoke all on function public.clinic_add_lab_result(uuid, text, text, text, text, text, text, integer) from public;
grant execute on function public.clinic_add_lab_result(uuid, text, text, text, text, text, text, integer) to authenticated;

revoke all on function public.clinic_delete_lab_result(uuid) from public;
grant execute on function public.clinic_delete_lab_result(uuid) to authenticated;
