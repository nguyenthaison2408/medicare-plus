begin;

-- ============================================================================
-- MediCare Plus - Bổ sung bảng Đánh giá & Nhận xét Bác sĩ (Doctor Reviews)
-- ============================================================================

create table if not exists public.clinic_doctor_reviews (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null references public.clinic_doctors(id) on delete cascade,
  patient_id uuid references public.clinic_profiles(id) on delete set null,
  patient_name text not null check (char_length(trim(patient_name)) between 2 and 160),
  rating int not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 2 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_doctor_reviews_doc on public.clinic_doctor_reviews(doctor_id, created_at desc);

-- Row Level Security (RLS)
alter table public.clinic_doctor_reviews enable row level security;

-- Mọi người (cả khách ẩn danh lẫn đăng nhập) đều có thể xem đánh giá
drop policy if exists "Anyone can read doctor reviews" on public.clinic_doctor_reviews;
create policy "Anyone can read doctor reviews"
  on public.clinic_doctor_reviews for select
  using (true);

-- Bệnh nhân đã xác thực được gửi đánh giá
drop policy if exists "Authenticated users can submit doctor reviews" on public.clinic_doctor_reviews;
create policy "Authenticated users can submit doctor reviews"
  on public.clinic_doctor_reviews for insert
  to authenticated
  with check (auth.uid() = patient_id or patient_id is null);

-- Bệnh nhân có thể sửa/xóa đánh giá của chính mình
drop policy if exists "Patients can delete own review" on public.clinic_doctor_reviews;
create policy "Patients can delete own review"
  on public.clinic_doctor_reviews for delete
  to authenticated
  using (auth.uid() = patient_id);

-- Dữ liệu hạt giống (Seed Reviews) cho các bác sĩ mẫu
insert into public.clinic_doctor_reviews (doctor_id, patient_name, rating, comment, created_at)
values
  ('doc-1', 'Nguyễn Hoàng Nam', 5, 'Bác sĩ thăm khám rất kỹ lưỡng, giải thích đơn thuốc rõ ràng dễ hiểu.', now() - interval '2 days'),
  ('doc-1', 'Trần Thu Trang', 5, 'Phòng khám sạch sẽ, bác sĩ tư vấn tận tình chu đáo.', now() - interval '5 days'),
  ('doc-2', 'Lê Văn Hùng', 4, 'Bác sĩ chuyên môn cao, hẹn giờ khám chuẩn xác không phải chờ lâu.', now() - interval '3 days'),
  ('doc-3', 'Phạm Minh Đức', 5, 'Khám tim mạch rất tận tâm, tư vấn chế độ ăn uống rất kỹ.', now() - interval '4 days')
on conflict do nothing;

commit;
