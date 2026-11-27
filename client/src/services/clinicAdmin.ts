import { getSupabase } from './supabaseClient';

export type DoctorShiftType = 'morning' | 'afternoon' | 'full_day';

export interface DoctorScheduleItem {
  id: string;
  doctorId: string;
  workDate: string; // YYYY-MM-DD
  shift: DoctorShiftType;
  room: string;
  active: boolean;
}

export interface BhytConfigItem {
  id: string;
  prefixCode: string;
  groupName: string;
  inNetworkRate: number;
  outNetworkRate: number;
  active: boolean;
}

export interface BhytBenefitCalculation {
  matchedRule: BhytConfigItem | null;
  rate: number;
  discountAmount: number;
  finalFee: number;
}

export function getShiftLabel(shift: DoctorShiftType): string {
  if (shift === 'morning') return 'Ca sáng (08:00 - 11:30)';
  if (shift === 'afternoon') return 'Ca chiều (13:30 - 17:00)';
  return 'Cả ngày (08:00 - 17:00)';
}

export function calculateBhytBenefit(
  feeNumeric: number,
  bhytCode: string | undefined,
  configs: BhytConfigItem[],
  isInNetwork = true
): BhytBenefitCalculation {
  const normalized = (bhytCode || '').trim().toUpperCase();
  const activeConfigs = configs.filter((c) => c.active);
  const matchedRule =
    activeConfigs.find((c) => normalized.startsWith(c.prefixCode.toUpperCase())) ||
    null;

  if (!matchedRule) {
    return {
      matchedRule: null,
      rate: 0,
      discountAmount: 0,
      finalFee: feeNumeric,
    };
  }

  const rate = isInNetwork
    ? matchedRule.inNetworkRate
    : matchedRule.outNetworkRate;
  const discountAmount = Math.round((feeNumeric * rate) / 100);
  const finalFee = Math.max(0, feeNumeric - discountAmount);

  return {
    matchedRule,
    rate,
    discountAmount,
    finalFee,
  };
}

export async function fetchDoctorSchedulesCloud(): Promise<DoctorScheduleItem[]> {
  const { data, error } = await getSupabase()
    .from('clinic_doctor_schedules')
    .select('id, doctor_id, work_date, shift, room, active')
    .order('work_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    id: row.id,
    doctorId: row.doctor_id,
    workDate: row.work_date,
    shift: row.shift as DoctorShiftType,
    room: row.room,
    active: Boolean(row.active),
  }));
}

export async function upsertDoctorScheduleCloud(input: {
  id?: string;
  doctorId: string;
  workDate: string;
  shift: DoctorShiftType;
  room: string;
  active?: boolean;
}): Promise<DoctorScheduleItem> {
  const payload: Record<string, any> = {
    doctor_id: input.doctorId,
    work_date: input.workDate,
    shift: input.shift,
    room: input.room.trim(),
    active: input.active ?? true,
  };
  const table = getSupabase().from('clinic_doctor_schedules');
  const operation = input.id
    ? table.update(payload).eq('id', input.id)
    : table.upsert(payload, { onConflict: 'doctor_id,work_date,shift' });
  const { data, error } = await operation
    .select('id, doctor_id, work_date, shift, room, active')
    .single();
  if (error || !data) {
    throw new Error(error?.message || 'Không thể lưu lịch trực lên hệ thống.');
  }
  return {
    id: data.id,
    doctorId: data.doctor_id,
    workDate: data.work_date,
    shift: data.shift as DoctorShiftType,
    room: data.room,
    active: Boolean(data.active),
  };
}

export async function deleteDoctorScheduleCloud(id: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from('clinic_doctor_schedules')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('Không tìm thấy lịch trực hoặc bạn không có quyền xóa.');
}

export async function fetchBhytConfigsCloud(): Promise<BhytConfigItem[]> {
  const { data, error } = await getSupabase()
    .from('clinic_bhyt_configs')
    .select('id, prefix_code, group_name, in_network_rate, out_network_rate, active')
    .order('prefix_code', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    id: row.id,
    prefixCode: row.prefix_code,
    groupName: row.group_name,
    inNetworkRate: Number(row.in_network_rate),
    outNetworkRate: Number(row.out_network_rate),
    active: Boolean(row.active),
  }));
}

export async function upsertBhytConfigCloud(input: BhytConfigItem): Promise<BhytConfigItem> {
  const { data, error } = await getSupabase()
    .from('clinic_bhyt_configs')
    .upsert({
      id: input.id,
      prefix_code: input.prefixCode.trim().toUpperCase(),
      group_name: input.groupName.trim(),
      in_network_rate: input.inNetworkRate,
      out_network_rate: input.outNetworkRate,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .select('id, prefix_code, group_name, in_network_rate, out_network_rate, active')
    .single();
  if (error || !data) {
    throw new Error(error?.message || 'Không thể lưu cấu hình BHYT.');
  }
  return {
    id: data.id,
    prefixCode: data.prefix_code,
    groupName: data.group_name,
    inNetworkRate: Number(data.in_network_rate),
    outNetworkRate: Number(data.out_network_rate),
    active: Boolean(data.active),
  };
}

export async function deleteBhytConfigCloud(id: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from('clinic_bhyt_configs')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('Không tìm thấy cấu hình BHYT hoặc bạn không có quyền xóa.');
}

export async function updateDoctorAvatarCloud(
  doctorId: string,
  avatarUrl: string
): Promise<string> {
  const cleanUrl = avatarUrl.trim();
  if (!cleanUrl) {
    throw new Error('Vui lòng chọn ảnh hoặc nhập đường dẫn ảnh bác sĩ hợp lệ.');
  }
  if (!/^(https?:\/\/|data:image\/)/i.test(cleanUrl)) {
    throw new Error('Định dạng ảnh không hợp lệ (chỉ hỗ trợ ảnh tải lên hoặc URL http/https).');
  }
  const { data, error } = await getSupabase()
    .from('clinic_doctors')
    .update({ avatar_url: cleanUrl })
    .eq('id', doctorId)
    .select('id, avatar_url')
    .single();
  if (error) {
    if (error.message.toLowerCase().includes('avatar_url')) {
      throw new Error(
        'CSDL chưa có cột avatar_url cho bác sĩ. Vui lòng chạy migration 202611220009_clinic_doctors_avatar.sql trên Supabase.'
      );
    }
    throw new Error(error.message || 'Không thể cập nhật ảnh bác sĩ trên hệ thống.');
  }
  if (!data) {
    throw new Error('Không tìm thấy bác sĩ hoặc tài khoản không có quyền cập nhật ảnh.');
  }
  return (data.avatar_url as string) || cleanUrl;
}


export async function createDoctorCloud(input: import('../context/AppContext').NewDoctorInput): Promise<import('./clinicCloud').ClinicDoctor> {
  const { data, error } = await getSupabase().rpc('clinic_admin_create_doctor', { p_details: input });
  if (error) throw new Error(error.message);
  return data;
}

export async function approveDoctorCloud(doctorId: string): Promise<import('./clinicCloud').ClinicDoctor> {
  const { data, error } = await getSupabase().rpc('clinic_admin_approve_doctor', { p_doctor_id: doctorId });
  if (error) throw new Error(error.message);
  return data;
}
