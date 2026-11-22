import { getSupabase, CLOUD_MODE } from './supabaseClient';
import type { FamilyMemberItem } from '../context/AppContext';

export interface FamilyMemberInput {
  name: string;
  dob: string;
  relation: string;
  bhyt: string;
  blood?: string;
  note?: string;
  gender?: string;
  phone?: string;
  allergies?: string;
}

interface CloudFamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  dob: string;
  bhyt_code: string;
  blood_group: string;
  note: string;
  gender?: string;
  phone?: string;
  allergies?: string;
}

function computeFamilyBadge(m: CloudFamilyMember): string {
  const code = (m.bhyt_code || '').trim().toUpperCase();
  if (code.startsWith('TE')) return 'Nhi đồng • BHYT';
  if (code.startsWith('HT')) return 'Cao tuổi • BHYT';
  if (code) return 'Có BHYT';
  return 'Thành viên';
}

function toMember(m: CloudFamilyMember): FamilyMemberItem {
  return {
    id: m.id,
    name: m.full_name,
    relation: m.dob ? `${m.relationship} • Sinh: ${m.dob}` : m.relationship,
    rawRelation: m.relationship,
    code: `#BN-${m.id.slice(0, 4).toUpperCase()}`,
    blood: m.blood_group || 'Chưa xét nghiệm',
    note: m.note || 'Hồ sơ sức khỏe gia đình',
    badge: computeFamilyBadge(m),
    dob: m.dob,
    bhyt: m.bhyt_code,
    gender: m.gender || 'Chưa cập nhật',
    phone: m.phone || '',
    allergies: m.allergies || '',
  };
}

export async function fetchFamilyMembersCloud(): Promise<FamilyMemberItem[]> {
  if (!CLOUD_MODE) return [];
  const { data, error } = await getSupabase()
    .from('clinic_family_members')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Không tải được hồ sơ gia đình. Vui lòng thử lại.');
  return (data || []).map(toMember);
}

export async function addFamilyMemberCloud(member: FamilyMemberInput): Promise<FamilyMemberItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const cleanName = (member.name || '').trim();
  const cleanRelation = (member.relation || '').trim();
  if (cleanName.length < 2) throw new Error('Họ và tên người thân cần ít nhất 2 ký tự.');
  if (cleanRelation.length < 2) throw new Error('Vui lòng chọn mối quan hệ.');
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  if (authError || !user) throw new Error('Vui lòng đăng nhập lại trước khi thêm người thân.');
  const cleanBhyt = (member.bhyt || '').trim();
  const cleanNote =
    (member.note || '').trim() ||
    (cleanBhyt ? `Đã liên kết BHYT (${cleanBhyt})` : 'Hồ sơ sức khỏe gia đình');
  const baseRow = {
    owner_id: user.id,
    full_name: cleanName,
    relationship: cleanRelation,
    dob: (member.dob || '').trim(),
    bhyt_code: cleanBhyt,
    blood_group: (member.blood || '').trim() || 'Chưa xét nghiệm',
    note: cleanNote,
  };
  const extendedRow = {
    ...baseRow,
    gender: (member.gender || '').trim() || 'Chưa cập nhật',
    phone: (member.phone || '').trim(),
    allergies: (member.allergies || '').trim(),
  };
  const { data, error } = await getSupabase()
    .from('clinic_family_members')
    .insert(extendedRow)
    .select()
    .single();
  if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('schema cache'))) {
    throw new Error('Cơ sở dữ liệu chưa cập nhật đầy đủ trường thông tin người thân (giới tính, SĐT, dị ứng). Vui lòng chạy migration mới nhất.');
  }
  if (error || !data) throw new Error('Chưa lưu được hồ sơ người thân. Vui lòng thử lại.');
  return toMember(data);
}

export async function updateFamilyMemberCloud(
  id: string,
  member: FamilyMemberInput
): Promise<FamilyMemberItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const cleanId = (id || '').trim();
  const cleanName = (member.name || '').trim();
  const cleanRelation = (member.relation || '').trim();
  if (!cleanId) throw new Error('Mã hồ sơ người thân không hợp lệ.');
  if (cleanName.length < 2) throw new Error('Họ và tên người thân cần ít nhất 2 ký tự.');
  if (cleanRelation.length < 2) throw new Error('Vui lòng chọn mối quan hệ.');
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  if (authError || !user) throw new Error('Vui lòng đăng nhập lại trước khi cập nhật người thân.');
  const cleanBhyt = (member.bhyt || '').trim();
  const cleanNote =
    (member.note || '').trim() ||
    (cleanBhyt ? `Đã liên kết BHYT (${cleanBhyt})` : 'Hồ sơ sức khỏe gia đình');
  const basePatch = {
    full_name: cleanName,
    relationship: cleanRelation,
    dob: (member.dob || '').trim(),
    bhyt_code: cleanBhyt,
    blood_group: (member.blood || '').trim() || 'Chưa xét nghiệm',
    note: cleanNote,
  };
  const extendedPatch = {
    ...basePatch,
    gender: (member.gender || '').trim() || 'Chưa cập nhật',
    phone: (member.phone || '').trim(),
    allergies: (member.allergies || '').trim(),
  };
  const { data, error } = await getSupabase()
    .from('clinic_family_members')
    .update(extendedPatch)
    .eq('id', cleanId)
    .select()
    .single();
  if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('schema cache'))) {
    throw new Error('Cơ sở dữ liệu chưa cập nhật đầy đủ trường thông tin người thân (giới tính, SĐT, dị ứng). Vui lòng chạy migration mới nhất.');
  }
  if (error || !data) throw new Error('Không tìm thấy hoặc không thể cập nhật hồ sơ người thân.');
  return toMember(data);
}

export async function deleteFamilyMemberCloud(id: string): Promise<void> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const cleanId = (id || '').trim();
  if (!cleanId) throw new Error('Mã hồ sơ người thân không hợp lệ.');
  const { data, error } = await getSupabase()
    .from('clinic_family_members')
    .delete()
    .eq('id', cleanId)
    .select();
  if (error || !Array.isArray(data) || data.length === 0) {
    throw new Error('Không tìm thấy hoặc không thể xóa hồ sơ người thân.');
  }
}
