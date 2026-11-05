import { getSupabase, CLOUD_MODE } from './supabaseClient';
import type { FamilyMemberItem } from '../context/AppContext';

export interface CloudFamilyMember {
  id: string;
  owner_id: string;
  full_name: string;
  relationship: string;
  dob: string;
  bhyt_code: string;
  blood_group: string;
  note: string;
  created_at: string;
}

export async function fetchFamilyMembersCloud(): Promise<FamilyMemberItem[]> {
  if (!CLOUD_MODE) return [];
  try {
    const { data, error } = await getSupabase()
      .from('clinic_family_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((m: CloudFamilyMember) => ({
      id: m.id,
      name: m.full_name,
      relation: m.dob ? `${m.relationship} • Sinh: ${m.dob}` : m.relationship,
      code: `#BN-${m.id.slice(0, 4).toUpperCase()}`,
      blood: m.blood_group || 'Chưa xét nghiệm',
      note: m.note || 'Theo dõi định kỳ',
      badge: 'Thành viên',
      dob: m.dob,
      bhyt: m.bhyt_code,
    }));
  } catch (err) {
    console.warn('Lỗi khi tải hồ sơ gia đình từ Supabase:', err);
    return [];
  }
}

export async function addFamilyMemberCloud(member: {
  name: string;
  dob: string;
  relation: string;
  bhyt: string;
}): Promise<FamilyMemberItem | null> {
  if (!CLOUD_MODE) return null;
  try {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) return null;

    const { data, error } = await getSupabase()
      .from('clinic_family_members')
      .insert({
        owner_id: user.id,
        full_name: member.name.trim(),
        relationship: member.relation.trim(),
        dob: member.dob.trim(),
        bhyt_code: member.bhyt.trim(),
        blood_group: 'Chưa xét nghiệm',
        note: 'Theo dõi sức khỏe gia đình',
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('Lỗi thêm thành viên gia đình:', error?.message);
      return null;
    }

    return {
      id: data.id,
      name: data.full_name,
      relation: data.dob ? `${data.relationship} • Sinh: ${data.dob}` : data.relationship,
      code: `#BN-${data.id.slice(0, 4).toUpperCase()}`,
      blood: data.blood_group,
      note: data.note,
      badge: 'Thành viên',
      dob: data.dob,
      bhyt: data.bhyt_code,
    };
  } catch (err) {
    console.warn('Lỗi kết nối khi thêm hồ sơ gia đình:', err);
    return null;
  }
}
