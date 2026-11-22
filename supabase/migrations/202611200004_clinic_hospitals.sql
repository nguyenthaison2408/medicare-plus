begin;

create table public.clinic_hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 4 and 180),
  address text not null check (char_length(trim(address)) between 6 and 300),
  phone text not null default '' check (phone = '' or phone ~ '^[0-9]{8,15}$'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  distance_km numeric(6,1),
  travel_minutes integer check (travel_minutes is null or travel_minutes between 1 and 1440),
  tag text not null default 'Cơ sở y tế liên kết' check (char_length(trim(tag)) between 2 and 100),
  image_url text not null default '',
  gate_info text not null default '',
  parking_info text not null default '',
  working_hours text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index clinic_hospitals_name_unique
  on public.clinic_hospitals(lower(name));
create index clinic_hospitals_active_name
  on public.clinic_hospitals(active, name);

alter table public.clinic_hospitals enable row level security;
create policy clinic_public_active_hospitals
  on public.clinic_hospitals for select to anon, authenticated
  using (active);

-- The catalog is public, but all writes go through validated administration RPCs.
revoke all on public.clinic_hospitals from anon, authenticated;
grant select on public.clinic_hospitals to anon, authenticated;

create function public.clinic_admin_add_hospital(
  p_name text,
  p_address text,
  p_phone text,
  p_latitude double precision,
  p_longitude double precision,
  p_gate_info text default '',
  p_parking_info text default '',
  p_working_hours text default '',
  p_tag text default 'Cơ sở y tế liên kết'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hospital public.clinic_hospitals;
  v_name text := trim(coalesce(p_name, ''));
  v_address text := trim(coalesce(p_address, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if (select auth.uid()) is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.clinic_profiles
    where id = (select auth.uid()) and role = 'admin'
  ) then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if char_length(v_name) not between 4 and 180
    or char_length(v_address) not between 6 and 300
    or (v_phone <> '' and v_phone !~ '^[0-9]{8,15}$')
    or p_latitude is null or p_latitude not between -90 and 90
    or p_longitude is null or p_longitude not between -180 and 180
    or char_length(trim(coalesce(p_tag, ''))) not between 2 and 100 then
    raise exception 'INVALID_HOSPITAL' using errcode = '22023';
  end if;

  select * into v_hospital
    from public.clinic_hospitals
    where lower(name) = lower(v_name) and active;
  if found then
    return to_jsonb(v_hospital);
  end if;

  insert into public.clinic_hospitals (
    name, address, phone, latitude, longitude, tag,
    image_url, gate_info, parking_info, working_hours
  ) values (
    v_name, v_address, v_phone, p_latitude, p_longitude,
    trim(p_tag),
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&auto=format&fit=crop&q=80',
    trim(coalesce(p_gate_info, '')),
    trim(coalesce(p_parking_info, '')),
    trim(coalesce(p_working_hours, ''))
  ) returning * into v_hospital;

  return to_jsonb(v_hospital);
end;
$$;

revoke all on function public.clinic_admin_add_hospital(
  text, text, text, double precision, double precision, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.clinic_admin_add_hospital(
  text, text, text, double precision, double precision, text, text, text, text
) to authenticated;

insert into public.clinic_hospitals (
  id, name, address, phone, latitude, longitude, rating, distance_km,
  travel_minutes, tag, image_url, gate_info, parking_info, working_hours
) values
  (
    '00000000-0000-4000-8000-000000000001',
    'BV. Đại học Y Dược TP.HCM',
    '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
    '02838554269', 10.755341, 106.664971, 4.9, 1.2, 6,
    'Tuyến Trung ương • BHYT',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&auto=format&fit=crop&q=80',
    'Cổng số 1 (Hồng Bàng) — Khu A Khám BHYT & Chuyên gia',
    'Hầm B1 & B2 (Ô tô, Xe máy) vào từ cổng Tản Đà',
    '05:00 - 16:30 (T2 - T7) • Cấp cứu 24/7'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'BV. Đa khoa Quốc tế Vinmec',
    '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
    '02836221166', 10.796608, 106.721912, 4.9, 1.8, 8,
    'Cấp cứu 24/7',
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=300&auto=format&fit=crop&q=80',
    'Sảnh chính Lobby A — Quầy Fast Check-in MediCare Plus',
    'Hầm B1 rộng rãi dành cho cả Ô tô & Xe máy',
    '07:30 - 17:00 (T2 - T7) • Cấp cứu 24/7'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Bệnh viện Chợ Rẫy',
    '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM',
    '02838554137', 10.757865, 106.659638, 4.7, 3.2, 12,
    'Đa khoa Trung ương',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&auto=format&fit=crop&q=80',
    'Cổng số 1 (Nguyễn Chí Thanh) — Khu Khám bệnh nhà A',
    'Bãi xe cổng số 2 đường Thuận Kiều & Nguyễn Chí Thanh',
    '06:00 - 16:00 (T2 - T7) • Cấp cứu 24/7'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'BV. Mắt TP.HCM',
    '280 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    '02839325364', 10.779784, 106.683823, 4.8, 2.5, 10,
    'Chuyên khoa Đầu ngành',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80',
    'Cổng chính 280 Điện Biên Phủ — Khu Khám Khúc xạ & Đáy mắt',
    'Bãi xe nội viện cổng Bà Huyện Thanh Quan',
    '06:00 - 16:30 (T2 - CN)'
  );

commit;
