import type { DaySlotItem, DoctorItem, TimeSlotItem } from '../data/mockData';
import type { PatientBookingInfo } from '../utils/bookingValidation';
import { getSupabase } from './supabaseClient';

export type ClinicRole = 'patient' | 'doctor' | 'reception' | 'admin';
export interface ClinicDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  active: boolean;
  created_at?: string;
}
export interface ClinicProfile {
  id: string;
  full_name: string;
  phone: string;
  role: ClinicRole;
  doctor_id: string | null;
}
export interface ClinicMedication { name: string; dosage: string }
export interface ClinicMedicalRecord {
  diagnosis: string;
  medications: ClinicMedication[];
  notes: string;
}
export interface ClinicAppointment {
  id: string;
  booking_code: string;
  doctor_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  symptoms: string;
  starts_at: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  payment_method: string;
  payment_status: 'UNPAID' | 'PAID';
  clinic_medical_records?: ClinicMedicalRecord | ClinicMedicalRecord[] | null;
}

const errorMessages: Record<string, string> = {
  SLOT_ALREADY_BOOKED: 'Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.',
  INVALID_BOOKING_TIME: 'Giờ khám đã qua hoặc không nằm trong lịch làm việc.',
  INVALID_BOOKING_DATE: 'Ngày khám không hợp lệ. Vui lòng chọn lại.',
  DOCTOR_NOT_FOUND: 'Bác sĩ chưa có lịch trên hệ thống trực tuyến.',
  PATIENT_PHONE_REQUIRED: 'Vui lòng cập nhật số điện thoại trước khi đặt khám.',
  AUTH_REQUIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  PATIENT_REQUIRED: 'Vui lòng dùng tài khoản bệnh nhân để đặt khám.',
  ACCESS_DENIED: 'Tài khoản không có quyền thực hiện thao tác này.',
  PATIENT_NOT_CHECKED_IN: 'Cần tiếp đón bệnh nhân trước khi hoàn thành khám.',
  CHECK_IN_DATE_MISMATCH: 'Chỉ có thể tiếp đón vào đúng ngày hẹn.',
  INVALID_APPOINTMENT_STATE: 'Lịch hẹn đã hủy hoặc đã hoàn thành.',
  APPOINTMENT_NOT_FOUND: 'Không tìm thấy lịch hẹn.',
  APPOINTMENT_ALREADY_COMPLETED: 'Lịch hẹn đã hoàn thành, không thể hủy.',
  ONLINE_PAYMENT_NOT_CONFIGURED: 'Vui lòng chọn thanh toán tại cơ sở y tế.',
  INVALID_MEDICAL_RECORD: 'Vui lòng nhập chẩn đoán hợp lệ.',
  INVALID_MEDICATION: 'Mỗi thuốc cần có tên và hướng dẫn liều dùng.',
  INVALID_PATIENT_NAME: 'Họ và tên bệnh nhân không hợp lệ.',
  INVALID_PATIENT_PHONE: 'Số điện thoại bệnh nhân không đúng định dạng.',
  INVALID_PATIENT_EMAIL: 'Email bệnh nhân không đúng định dạng.',
  INVALID_SYMPTOMS: 'Vui lòng mô tả triệu chứng từ 5 đến 1000 ký tự.',
};

function checkError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  const matched = Object.entries(errorMessages).find(([code]) => error.message.includes(code));
  if (matched) throw new Error(matched[1]);
  if (error.message.includes('Invalid login credentials')) throw new Error('Email hoặc mật khẩu không đúng.');
  if (error.message.includes('Email not confirmed')) throw new Error('Vui lòng xác nhận email trước khi đăng nhập.');
  if (error.code === '23505') throw new Error(errorMessages.SLOT_ALREADY_BOOKED);
  throw new Error('Không thể hoàn tất thao tác với hệ thống trực tuyến. Vui lòng thử lại.');
}

export async function loadClinicProfile(): Promise<ClinicProfile> {
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  checkError(authError);
  if (!user) throw new Error(errorMessages.AUTH_REQUIRED);
  const { data, error } = await getSupabase().from('clinic_profiles').select('*').eq('id', user.id).single();
  checkError(error);
  return data as ClinicProfile;
}

export async function signInClinic(email: string, password: string): Promise<ClinicProfile> {
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  checkError(error);
  try { return await loadClinicProfile(); }
  catch (error) { await getSupabase().auth.signOut(); throw error; }
}

export async function signUpClinic(params: { email: string; password: string; fullName: string; phone: string }): Promise<boolean> {
  const { data, error } = await getSupabase().auth.signUp({
    email: params.email.trim(), password: params.password,
    options: { data: { full_name: params.fullName.trim(), phone: params.phone.replace(/\s+/g, '') } },
  });
  checkError(error);
  return Boolean(data.session);
}

export async function signOutClinic(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  checkError(error);
}

export async function listClinicAppointments(): Promise<ClinicAppointment[]> {
  const { data, error } = await getSupabase().from('clinic_appointments')
    .select('*, clinic_medical_records(diagnosis, medications, notes)').order('starts_at', { ascending: false });
  checkError(error);
  return (data || []) as ClinicAppointment[];
}

export async function listClinicDoctors(): Promise<ClinicDoctor[]> {
  const { data, error } = await getSupabase().from('clinic_doctors')
    .select('*').eq('active', true);
  checkError(error);
  return (data || []) as ClinicDoctor[];
}

export function toClinicStart(day: DaySlotItem, slot: TimeSlotItem): string {
  const [date, month, year] = day.fullDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}T${slot.time}:00+07:00`;
}

export async function listClinicSlots(doctorId: string, day: DaySlotItem): Promise<{ starts_at: string; is_booked: boolean }[]> {
  const [date, month, year] = day.fullDate.split('/');
  const { data, error } = await getSupabase().rpc('clinic_slot_availability', {
    p_doctor_id: doctorId, p_date: `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`,
  });
  checkError(error);
  return data || [];
}

export async function bookClinicAppointment(
  doctor: DoctorItem,
  day: DaySlotItem,
  slot: TimeSlotItem,
  patientInfo: PatientBookingInfo
): Promise<ClinicAppointment> {
  const { data, error } = await getSupabase().rpc('clinic_book_appointment', {
    p_doctor_id: doctor.id,
    p_starts_at: toClinicStart(day, slot),
    p_payment_method: 'at_clinic',
    p_patient_name: patientInfo.fullName,
    p_patient_phone: patientInfo.phone,
    p_patient_email: patientInfo.email,
    p_symptoms: patientInfo.symptoms,
  });
  checkError(error);
  return data as ClinicAppointment;
}

export async function cancelClinicAppointment(id: string): Promise<void> {
  const { error } = await getSupabase().rpc('clinic_cancel_appointment', { p_appointment_id: id });
  checkError(error);
}

export async function checkInClinic(bookingCode: string): Promise<void> {
  const { error } = await getSupabase().rpc('clinic_check_in', { p_booking_code: bookingCode.trim() });
  checkError(error);
}

export async function completeClinicAppointment(id: string, diagnosis: string, medications: ClinicMedication[], notes: string): Promise<void> {
  const { error } = await getSupabase().rpc('clinic_complete_appointment', {
    p_appointment_id: id, p_diagnosis: diagnosis.trim(), p_medications: medications, p_notes: notes.trim(),
  });
  checkError(error);
}

let clinicSubscriptionCounter = 0;
export function subscribeClinicAppointments(onChange: () => void): () => void {
  const supabase = getSupabase();
  const subscriptionId = ++clinicSubscriptionCounter;
  let stopped = false;
  let generation = 0;
  let currentUser: string | null = null;
  let channel: ReturnType<typeof supabase.channel> | undefined;
  const connect = async (session: { access_token: string; user: { id: string } } | null) => {
    const run = ++generation;
    if (stopped) return;
    if (currentUser !== (session?.user.id ?? null) && channel) {
      const previousChannel = channel;
      channel = undefined;
      await supabase.removeChannel(previousChannel);
      if (stopped || run !== generation) return;
    }
    currentUser = session?.user.id ?? null;
    if (!session || stopped || run !== generation) return;
    await supabase.realtime.setAuth(session.access_token);
    if (stopped || run !== generation || channel) return;
    channel = supabase.channel(`clinic-appointments-${session.user.id}-${subscriptionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_appointments' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_medical_records' }, onChange)
      .subscribe();
  };
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    // Defer SDK work until the Auth callback has released its lock.
    setTimeout(() => { if (!stopped) void connect(session).catch(() => onChange()); }, 0);
  });
  void supabase.auth.getSession().then(({ data }) => connect(data.session)).catch(() => onChange());
  return () => {
    stopped = true;
    generation += 1;
    subscription.unsubscribe();
    if (channel) void supabase.removeChannel(channel);
  };
}
