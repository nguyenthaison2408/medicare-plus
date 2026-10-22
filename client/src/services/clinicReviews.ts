import { getSupabase, CLOUD_MODE } from './supabaseClient';
import type { DoctorReviewItem } from '../context/AppContext';

export interface CloudReview {
  id: string;
  doctor_id: string;
  patient_id?: string;
  patient_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export async function fetchDoctorReviewsCloud(doctorId?: string): Promise<DoctorReviewItem[]> {
  if (!CLOUD_MODE) return [];
  try {
    let query = getSupabase()
      .from('clinic_doctor_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((r: CloudReview) => {
      const parts = r.patient_name.trim().split(' ');
      const initials = parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : r.patient_name.slice(0, 2).toUpperCase();

      const dateStr = new Date(r.created_at).toLocaleDateString('vi-VN');

      return {
        id: r.id,
        doctorId: r.doctor_id,
        initials,
        authorName: r.patient_name,
        metaText: `Đã khám • ${dateStr}`,
        rating: r.rating,
        comment: r.comment,
      };
    });
  } catch (err) {
    console.warn('Lỗi khi tải đánh giá bác sĩ từ Supabase:', err);
    return [];
  }
}

export async function submitDoctorReviewCloud(params: {
  doctorId: string;
  patientId?: string;
  patientName: string;
  rating: number;
  comment: string;
}): Promise<boolean> {
  if (!CLOUD_MODE) return false;
  try {
    const { error } = await getSupabase().from('clinic_doctor_reviews').insert({
      doctor_id: params.doctorId,
      patient_id: params.patientId || null,
      patient_name: params.patientName,
      rating: params.rating,
      comment: params.comment.trim(),
    });

    if (error) {
      console.warn('Lỗi lưu đánh giá bác sĩ:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Lỗi kết nối khi gửi đánh giá:', err);
    return false;
  }
}
