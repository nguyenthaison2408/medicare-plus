import { getSupabase, CLOUD_MODE } from './supabaseClient';
import type { DoctorReviewItem } from '../context/AppContext';
interface CloudReview { id: string; doctor_id: string; patient_name: string; rating: number; comment: string; created_at: string }
function toReview(r: CloudReview): DoctorReviewItem {
  const parts = r.patient_name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : r.patient_name.slice(0, 2).toUpperCase();
  return { id: r.id, doctorId: r.doctor_id, initials, authorName: r.patient_name, rating: r.rating, comment: r.comment,
    metaText: `Đã xác thực khám • ${new Date(r.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` };
}
export async function fetchDoctorReviewsCloud(doctorId?: string): Promise<DoctorReviewItem[]> {
  if (!CLOUD_MODE) return [];
  let query = getSupabase().from('clinic_doctor_reviews').select('id,doctor_id,patient_name,rating,comment,created_at').order('created_at', { ascending: false });
  if (doctorId) query = query.eq('doctor_id', doctorId);
  const { data, error } = await query;
  if (error) throw new Error('Chưa tải được đánh giá bác sĩ. Vui lòng thử lại.');
  return (data || []).map(toReview);
}
export async function submitDoctorReviewCloud(params: { doctorId: string; rating: number; comment: string }): Promise<DoctorReviewItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const client = getSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new Error('Vui lòng đăng nhập để gửi đánh giá.');
  const { data: appointment, error: appointmentError } = await client.from('clinic_appointments').select('id')
    .eq('doctor_id', params.doctorId).eq('patient_id', user.id).eq('status', 'COMPLETED')
    .order('starts_at', { ascending: false }).limit(1).maybeSingle();
  if (appointmentError || !appointment) throw new Error('Chỉ có thể đánh giá bác sĩ sau khi hoàn thành khám.');
  const { data, error } = await client.rpc('clinic_submit_doctor_review', {
    p_appointment_id: appointment.id, p_rating: params.rating, p_comment: params.comment.trim(),
  });
  if (error) {
    if (error.code === '23505') throw new Error('Bạn đã gửi đánh giá cho bác sĩ này.');
    throw new Error('Chưa gửi được đánh giá. Vui lòng kiểm tra lịch khám và thử lại.');
  }
  if (!data) throw new Error('Chưa nhận được xác nhận lưu đánh giá.');
  return toReview(data as CloudReview);
}
