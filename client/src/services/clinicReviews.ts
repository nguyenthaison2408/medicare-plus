import { getSupabase, CLOUD_MODE } from './supabaseClient';
import type { DoctorReviewItem } from '../context/AppContext';

interface CloudReview {
  id: string;
  doctor_id: string;
  patient_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_hidden?: boolean;
  admin_note?: string;
}

function toReview(r: CloudReview): DoctorReviewItem {
  const parts = r.patient_name.trim().split(/\s+/);
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : r.patient_name.slice(0, 2).toUpperCase();
  return {
    id: r.id,
    doctorId: r.doctor_id,
    initials,
    authorName: r.patient_name,
    rating: r.rating,
    comment: r.comment,
    metaText: `Đã xác thực khám • ${new Date(r.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
    isHidden: Boolean(r.is_hidden),
    adminNote: r.admin_note || '',
  };
}

export async function fetchDoctorReviewsCloud(doctorId?: string): Promise<DoctorReviewItem[]> {
  if (!CLOUD_MODE) return [];
  let query = getSupabase()
    .from('clinic_doctor_reviews')
    .select('id,doctor_id,patient_name,rating,comment,created_at,is_hidden')
    .order('created_at', { ascending: false });
  if (doctorId) query = query.eq('doctor_id', doctorId);
  const { data, error } = await query;
  if (error) throw new Error('Chưa tải được đánh giá bác sĩ. Vui lòng thử lại.');
  return (data || []).map(toReview);
}

export async function fetchAdminDoctorReviewsCloud(): Promise<DoctorReviewItem[]> {
  if (!CLOUD_MODE) return [];
  const { data, error } = await getSupabase().rpc('clinic_admin_list_reviews');
  if (error) throw new Error('Chưa tải được danh sách kiểm duyệt đánh giá.');
  return ((data || []) as CloudReview[]).map(toReview);
}

export async function submitDoctorReviewCloud(params: {
  doctorId: string;
  rating: number;
  comment: string;
}): Promise<DoctorReviewItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const client = getSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw new Error('Vui lòng đăng nhập để gửi đánh giá.');
  const { data: appointment, error: appointmentError } = await client
    .from('clinic_appointments')
    .select('id')
    .eq('doctor_id', params.doctorId)
    .eq('patient_id', user.id)
    .eq('status', 'COMPLETED')
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (appointmentError || !appointment) {
    throw new Error('Chỉ bệnh nhân đã đặt lịch và hoàn tất lượt khám mới có thể gửi đánh giá.');
  }
  const { data, error } = await client.rpc('clinic_submit_doctor_review', {
    p_appointment_id: appointment.id,
    p_rating: params.rating,
    p_comment: params.comment.trim(),
  });
  if (error) {
    if (error.code === '23505') throw new Error('Bạn đã gửi đánh giá cho bác sĩ này.');
    throw new Error('Chưa gửi được đánh giá. Vui lòng kiểm tra lịch khám và thử lại.');
  }
  if (!data) throw new Error('Chưa nhận được xác nhận lưu đánh giá.');
  return toReview(data as CloudReview);
}

export async function moderateDoctorReviewCloud(
  reviewId: string,
  isHidden: boolean,
  adminNote = ''
): Promise<DoctorReviewItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const { data, error } = await getSupabase()
    .from('clinic_doctor_reviews')
    .update({ is_hidden: isHidden, admin_note: adminNote.trim() })
    .eq('id', reviewId)
    .select('id,doctor_id,patient_name,rating,comment,created_at,is_hidden')
    .single();
  if (error || !data) {
    throw new Error('Không thể cập nhật trạng thái kiểm duyệt bình luận.');
  }
  return toReview({ ...(data as CloudReview), admin_note: adminNote.trim() });
}

export async function deleteDoctorReviewCloud(reviewId: string): Promise<void> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const { error } = await getSupabase()
    .from('clinic_doctor_reviews')
    .delete()
    .eq('id', reviewId);
  if (error) throw new Error('Không thể xóa bình luận trên hệ thống.');
}
