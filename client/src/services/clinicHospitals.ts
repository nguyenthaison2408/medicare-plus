import type { HospitalItem } from '../data/mockData';
import { CLOUD_MODE, getSupabase } from './supabaseClient';

interface CloudHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: number | string;
  distance_km: number | string | null;
  travel_minutes: number | null;
  tag: string;
  image_url: string;
  gate_info: string;
  parking_info: string;
  working_hours: string;
}

export interface NewCloudHospitalInput {
  name: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  gateInfo?: string;
  parkingInfo?: string;
  workingHours?: string;
  tag?: string;
}

function toHospital(row: CloudHospital): HospitalItem {
  const distance = row.distance_km === null ? null : Number(row.distance_km);
  return {
    id: row.id,
    name: row.name,
    rating: Number(row.rating),
    distance: distance === null ? 'Chưa xác định' : `${distance.toLocaleString('vi-VN')} km`,
    travelTime: row.travel_minutes ? `${row.travel_minutes} phút` : undefined,
    tag: row.tag,
    image: row.image_url,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    gateInfo: row.gate_info,
    parkingInfo: row.parking_info,
    workingHours: row.working_hours,
  };
}

export async function fetchHospitalsCloud(): Promise<HospitalItem[]> {
  if (!CLOUD_MODE) return [];
  const { data, error } = await getSupabase()
    .from('clinic_hospitals')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw new Error('Không tải được danh sách cơ sở y tế. Vui lòng thử lại.');
  return (data || []).map(row => toHospital(row as CloudHospital));
}

export async function addHospitalCloud(input: NewCloudHospitalInput): Promise<HospitalItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const { data, error } = await getSupabase().rpc('clinic_admin_add_hospital', {
    p_name: input.name.trim(),
    p_address: input.address.trim(),
    p_phone: input.phone?.trim() || '',
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_gate_info: input.gateInfo?.trim() || '',
    p_parking_info: input.parkingInfo?.trim() || '',
    p_working_hours: input.workingHours?.trim() || '',
    p_tag: input.tag?.trim() || 'Cơ sở y tế liên kết',
  });
  if (error || !data) {
    const message = error?.message || '';
    if (message.includes('ADMIN_REQUIRED')) throw new Error('Chỉ quản trị viên mới có thể thêm cơ sở y tế.');
    if (message.includes('INVALID_HOSPITAL')) throw new Error('Thông tin cơ sở y tế chưa hợp lệ.');
    throw new Error('Chưa lưu được cơ sở y tế. Vui lòng thử lại.');
  }
  return toHospital(data as CloudHospital);
}
