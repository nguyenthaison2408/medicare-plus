import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
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
  email?: string;
  full_name: string;
  phone: string;
  role: ClinicRole;
  doctor_id: string | null;
  gender?: string;
  dob?: string;
  blood_type?: string;
  emergency_contact?: string;
  bhyt_code?: string;
  bhyt_hospital?: string;
  bhyt_expiry?: string;
  avatar_url?: string;
}

export interface UpdateClinicProfileInput {
  full_name: string;
  phone?: string;
  gender?: string;
  dob?: string;
  blood_type?: string;
  emergency_contact?: string;
  bhyt_code?: string;
  bhyt_hospital?: string;
  bhyt_expiry?: string;
  avatar_url?: string;
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
  OUTSIDE_DOCTOR_SHIFT: 'Bác sĩ không có ca trực trong khung giờ này. Vui lòng chọn khung giờ thuộc ca trực.',
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
  const profile = data as ClinicProfile;
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const oauthName = typeof meta.full_name === 'string' && meta.full_name.trim()
    ? meta.full_name.trim()
    : typeof meta.name === 'string' && meta.name.trim()
      ? meta.name.trim()
      : '';
  const oauthAvatar = typeof meta.avatar_url === 'string' && meta.avatar_url.trim()
    ? meta.avatar_url.trim()
    : typeof meta.picture === 'string' && meta.picture.trim()
      ? meta.picture.trim()
      : '';
  const needsNameSync = Boolean(oauthName && (!profile.full_name || profile.full_name === 'Bệnh nhân'));
  const needsAvatarSync = Boolean(oauthAvatar && !profile.avatar_url);
  if (needsNameSync || needsAvatarSync) {
    try {
      const syncPayload: Record<string, string> = {};
      if (needsNameSync) syncPayload.full_name = oauthName;
      if (needsAvatarSync) syncPayload.avatar_url = oauthAvatar;
      const { data: updated, error: updateErr } = await getSupabase()
        .from('clinic_profiles')
        .update(syncPayload)
        .eq('id', user.id)
        .select('*')
        .single();
      if (!updateErr && updated) return { ...(updated as ClinicProfile), email: user.email || undefined };
      if (updateErr && needsNameSync) {
        const { data: fallbackUpdated } = await getSupabase()
          .from('clinic_profiles')
          .update({ full_name: oauthName })
          .eq('id', user.id)
          .select('*')
          .single();
        if (fallbackUpdated) return { ...(fallbackUpdated as ClinicProfile), email: user.email || undefined };
      }
    } catch {
      // Ignore optional metadata sync error so login never fails
    }
  }
  return { ...profile, email: user.email || undefined };
}

export async function updateClinicProfile(updates: UpdateClinicProfileInput, expectedUserId?: string): Promise<ClinicProfile> {
  const { data: { user }, error: authError } = await getSupabase().auth.getUser();
  checkError(authError);
  if (!user) throw new Error(errorMessages.AUTH_REQUIRED);
  if (expectedUserId && user.id !== expectedUserId) throw new Error('Phiên đăng nhập đã thay đổi.');
  const payload: Record<string, string> = {
    full_name: updates.full_name.trim(),
  };
  if (updates.phone !== undefined) payload.phone = updates.phone.replace(/\s+/g, '');
  if (updates.gender !== undefined) payload.gender = updates.gender.trim();
  if (updates.dob !== undefined) payload.dob = updates.dob.trim();
  if (updates.blood_type !== undefined) payload.blood_type = updates.blood_type.trim();
  if (updates.emergency_contact !== undefined) payload.emergency_contact = updates.emergency_contact.trim();
  if (updates.bhyt_code !== undefined) payload.bhyt_code = updates.bhyt_code.trim().toUpperCase();
  if (updates.bhyt_hospital !== undefined) payload.bhyt_hospital = updates.bhyt_hospital.trim();
  if (updates.bhyt_expiry !== undefined) payload.bhyt_expiry = updates.bhyt_expiry.trim();
  if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url.trim();

  const { data, error } = await getSupabase()
    .from('clinic_profiles')
    .update(payload)
    .eq('id', user.id)
    .select('*')
    .single();
  checkError(error);
  return data as ClinicProfile;
}

export async function signInClinic(email: string, password: string): Promise<ClinicProfile> {
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  checkError(error);
  try { return await loadClinicProfile(); }
  catch (error) { await getSupabase().auth.signOut(); throw error; }
}

export async function signInWithGoogleClinic(): Promise<void> {
  const isWeb = Platform.OS === 'web';
  let redirectTo: string | undefined = 'medicareplus://auth-callback';
  if (isWeb) {
    redirectTo =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : undefined;
  } else {
    try {
      const hostUri = Constants.expoConfig?.hostUri;
      const isExpoGo =
        Constants.executionEnvironment === 'storeClient' ||
        (Constants as unknown as { appOwnership?: string }).appOwnership === 'expo';
      if (isExpoGo && hostUri) {
        redirectTo = `exp://${hostUri.replace(/\/+$/, '')}/--/auth-callback`;
      } else {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.startsWith('exp://')) {
          const base = initialUrl.replace(/\/+$/, '').split('/--/')[0];
          redirectTo = `${base}/--/auth-callback`;
        }
      }
    } catch {
      redirectTo = 'medicareplus://auth-callback';
    }
  }

  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      ...(redirectTo ? { redirectTo } : {}),
      ...(!isWeb ? { skipBrowserRedirect: true } : {}),
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes('provider is not enabled')) {
      throw new Error('Nhà cung cấp Google OAuth chưa được bật trong Supabase Authentication.');
    }
    checkError(error);
  }
  if (!isWeb && data?.url) {
    await Linking.openURL(data.url);
  }
}

export async function signUpClinic(params: { email: string; password: string; fullName: string; phone: string }): Promise<boolean> {
  const { data, error } = await getSupabase().auth.signUp({
    email: params.email.trim(), password: params.password,
    options: { data: { full_name: params.fullName.trim(), phone: params.phone.replace(/\s+/g, '') } },
  });
  checkError(error);
  return Boolean(data.session);
}

export async function resendClinicRegistrationEmail(email: string): Promise<void> {
  const { error } = await getSupabase().auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
  checkError(error);
}

export async function verifyClinicRegistrationOtp(email: string, token: string): Promise<void> {
  const cleanToken = token.trim();
  if (!/^\d{6,10}$/.test(cleanToken)) throw new Error('Vui lòng nhập mã xác nhận trong email.');
  const { data, error } = await getSupabase().auth.verifyOtp({
    email: email.trim().toLowerCase(), token: cleanToken, type: 'signup',
  });
  checkError(error);
  if (!data.session || !data.user) throw new Error('Email chưa được xác nhận. Vui lòng thử lại.');
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
