import { getSupabase, CLOUD_MODE } from './supabaseClient';
import type { FamilyMemberItem } from '../context/AppContext';
interface CloudFamilyMember { id: string; full_name: string; relationship: string; dob: string; bhyt_code: string; blood_group: string; note: string }
function toMember(m: CloudFamilyMember): FamilyMemberItem {
  return { id: m.id, name: m.full_name, relation: m.dob ? `${m.relationship} • Sinh: ${m.dob}` : m.relationship,
    code: `#BN-${m.id.slice(0, 4).toUpperCase()}`, blood: m.blood_group || 'Chưa xét nghiệm',
    note: m.note, badge: 'Thành viên', dob: m.dob, bhyt: m.bhyt_code };
}
export async function fetchFamilyMembersCloud(): Promise<FamilyMemberItem[]> {
  if (!CLOUD_MODE) return [];
  const { data, error } = await getSupabase().from('clinic_family_members').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Không tải được hồ sơ gia đình. Vui lòng thử lại.');
  return (data || []).map(toMember);
}
export async function addFamilyMemberCloud(member: { name: string; dob: string; relation: string; bhyt: string }): Promise<FamilyMemberItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  if (authError || !user) throw new Error('Vui lòng đăng nhập lại trước khi thêm người thân.');
  const { data, error } = await getSupabase().from('clinic_family_members').insert({
    owner_id: user.id, full_name: member.name.trim(), relationship: member.relation.trim(), dob: member.dob.trim(),
    bhyt_code: member.bhyt.trim(), blood_group: 'Chưa xét nghiệm', note: 'Hồ sơ sức khỏe gia đình',
  }).select().single();
  if (error || !data) throw new Error('Chưa lưu được hồ sơ người thân. Vui lòng thử lại.');
  return toMember(data);
}
