import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLOUD_MODE, getSupabase } from './supabaseClient';

const LOCAL_CHAT_STORAGE_KEY = '@medicare_consult_messages_v1';

export interface ConsultMessageItem {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  senderId: string;
  senderRole: 'patient' | 'doctor' | 'admin';
  senderName: string;
  patientName?: string;
  text: string;
  time: string;
  createdAt: string;
}

export interface ConsultSubscriptionScope {
  doctorId?: string;
  patientId?: string;
}

interface CloudConsultMessageRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string | null;
  sender_id: string;
  sender_role: 'patient' | 'doctor' | 'admin';
  sender_name: string;
  content: string;
  created_at: string;
}

interface ScopedListenerEntry {
  callback: () => void;
  scope?: ConsultSubscriptionScope;
}

const localListeners = new Set<ScopedListenerEntry>();
let channelCounter = 0;

export function resolveConsultDoctor<T extends { id: string }>(options: {
  isDoctorPortalUser?: boolean;
  cloudDoctorId?: string | null;
  doctors?: T[];
  selectedDoctor?: T | null;
  latestBookingDoctor?: T | null;
  fallbackDoctor: T;
}): T {
  const {
    isDoctorPortalUser,
    cloudDoctorId,
    doctors = [],
    selectedDoctor,
    latestBookingDoctor,
    fallbackDoctor,
  } = options;
  if (isDoctorPortalUser) {
    const assigned = cloudDoctorId
      ? doctors.find((d) => d.id === cloudDoctorId)
      : undefined;
    return assigned || selectedDoctor || latestBookingDoctor || fallbackDoctor;
  }
  return selectedDoctor || latestBookingDoctor || fallbackDoctor;
}

function matchesScope(
  scope: ConsultSubscriptionScope | undefined,
  target?: { doctorId?: string; patientId?: string }
): boolean {
  if (!scope || !target) return true;
  if (scope.doctorId && target.doctorId && scope.doctorId !== target.doctorId) {
    return false;
  }
  if (scope.patientId && target.patientId && scope.patientId !== target.patientId) {
    return false;
  }
  return true;
}

function notifyLocalListeners(target?: { doctorId?: string; patientId?: string }) {
  localListeners.forEach((entry) => {
    if (!matchesScope(entry.scope, target)) return;
    try {
      entry.callback();
    } catch {
      // ignore listener error
    }
  });
}

function formatChatTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return 'Vừa xong';
  return d.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toConsultMessage(row: CloudConsultMessageRow): ConsultMessageItem {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    appointmentId: row.appointment_id ?? null,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    patientName: row.sender_role === 'patient' ? row.sender_name : undefined,
    text: row.content,
    time: formatChatTime(row.created_at),
    createdAt: row.created_at,
  };
}

async function readCachedMessages(): Promise<ConsultMessageItem[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConsultMessageItem[]) : [];
  } catch {
    return [];
  }
}

async function appendCachedMessage(msg: ConsultMessageItem): Promise<void> {
  try {
    const existing = await readCachedMessages();
    if (existing.some((m) => m.id === msg.id)) return;
    const next = [...existing, msg];
    await AsyncStorage.setItem(LOCAL_CHAT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage write error
  }
}

function filterMessages(
  rows: ConsultMessageItem[],
  params: { doctorId?: string; patientId?: string }
): ConsultMessageItem[] {
  const byId = new Map<string, ConsultMessageItem>();
  for (const item of rows) {
    if (params.doctorId && item.doctorId !== params.doctorId) continue;
    if (params.patientId && item.patientId !== params.patientId) continue;
    byId.set(item.id, item);
  }
  return Array.from(byId.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}

export async function fetchConsultMessagesCloud(params: {
  doctorId?: string;
  patientId?: string;
}): Promise<ConsultMessageItem[]> {
  const cleanDoctorId = (params.doctorId || '').trim();
  const cleanPatientId = (params.patientId || '').trim();
  if (!CLOUD_MODE) {
    const cached = await readCachedMessages();
    return filterMessages(cached, {
      doctorId: cleanDoctorId || undefined,
      patientId: cleanPatientId || undefined,
    });
  }
  if (!cleanDoctorId && !cleanPatientId) {
    throw new Error('Thiếu thông tin cuộc trò chuyện tư vấn.');
  }
  let query = getSupabase()
    .from('clinic_consult_messages')
    .select('*')
    .order('created_at', { ascending: true });
  if (cleanDoctorId) {
    query = query.eq('doctor_id', cleanDoctorId);
  }
  if (cleanPatientId) {
    query = query.eq('patient_id', cleanPatientId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error('Không tải được tin nhắn tư vấn. Vui lòng thử lại.');
  }
  const dbRows = ((data || []) as CloudConsultMessageRow[]).map(toConsultMessage);
  return filterMessages(dbRows, {
    doctorId: cleanDoctorId || undefined,
    patientId: cleanPatientId || undefined,
  });
}

export async function sendConsultMessageCloud(params: {
  doctorId: string;
  patientId?: string;
  patientName?: string;
  appointmentId?: string | null;
  content: string;
  senderRole: 'patient' | 'doctor' | 'admin';
  senderName: string;
}): Promise<ConsultMessageItem> {
  const cleanText = (params.content || '').trim();
  const cleanDoctorId = (params.doctorId || '').trim();
  if (!cleanText) {
    throw new Error('Vui lòng nhập nội dung tin nhắn.');
  }
  if (cleanText.length > 2000) {
    throw new Error('Tin nhắn tư vấn không vượt quá 2000 ký tự.');
  }
  if (!cleanDoctorId) {
    throw new Error('Vui lòng chọn bác sĩ tư vấn.');
  }
  const nowIso = new Date().toISOString();
  if (!CLOUD_MODE) {
    const localMsg: ConsultMessageItem = {
      id: `local-${Date.now()}`,
      patientId: params.patientId || 'demo-patient',
      doctorId: cleanDoctorId,
      appointmentId: params.appointmentId || null,
      senderId: params.senderRole === 'patient' ? 'demo-patient' : cleanDoctorId,
      senderRole: params.senderRole,
      senderName: (params.senderName || 'Người dùng').trim(),
      patientName:
        params.patientName ||
        (params.senderRole === 'patient' ? params.senderName : undefined),
      text: cleanText,
      time: formatChatTime(nowIso),
      createdAt: nowIso,
    };
    await appendCachedMessage(localMsg);
    notifyLocalListeners({ doctorId: cleanDoctorId, patientId: localMsg.patientId });
    return localMsg;
  }

  const {
    data: { user },
    error: authError,
  } = await getSupabase().auth.getUser();
  if (authError || !user) {
    throw new Error('Vui lòng đăng nhập lại trước khi gửi tin nhắn.');
  }
  const rawPatientId = (params.patientId || '').trim();
  if (params.senderRole !== 'patient' && (!rawPatientId || rawPatientId.startsWith('apt-'))) {
    throw new Error('Không xác định được hồ sơ bệnh nhân nhận tin nhắn.');
  }
  const resolvedPatientId =
    params.senderRole === 'patient' ? user.id : rawPatientId;

  const payload = {
    patient_id: resolvedPatientId,
    doctor_id: cleanDoctorId,
    appointment_id: params.appointmentId || null,
    sender_id: user.id,
    sender_role: params.senderRole,
    sender_name: (params.senderName || 'Người dùng').trim(),
    content: cleanText,
  };

  const { data, error } = await getSupabase()
    .from('clinic_consult_messages')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('Không gửi được tin nhắn tư vấn. Vui lòng thử lại.');
  }

  const savedItem: ConsultMessageItem = {
    ...toConsultMessage(data as CloudConsultMessageRow),
    patientName:
      params.patientName ||
      (params.senderRole === 'patient' ? payload.sender_name : undefined),
  };

  notifyLocalListeners({ doctorId: savedItem.doctorId, patientId: savedItem.patientId });
  return savedItem;
}

export function subscribeConsultMessagesCloud(
  onUpdate: () => void,
  scope?: ConsultSubscriptionScope
): () => void {
  const cleanScope: ConsultSubscriptionScope | undefined = scope
    ? {
        doctorId: scope.doctorId?.trim() || undefined,
        patientId: scope.patientId?.trim() || undefined,
      }
    : undefined;
  const localEntry: ScopedListenerEntry = {
    callback: () => onUpdate(),
    scope: cleanScope,
  };
  localListeners.add(localEntry);

  if (!CLOUD_MODE) {
    return () => {
      localListeners.delete(localEntry);
    };
  }

  const supabase = getSupabase();
  const subId = ++channelCounter;
  const scopeTag = [
    cleanScope?.doctorId ? `doc-${cleanScope.doctorId}` : null,
    cleanScope?.patientId ? `pat-${cleanScope.patientId}` : null,
  ]
    .filter(Boolean)
    .join(':') || 'all';
  const filter = cleanScope?.patientId
    ? `patient_id=eq.${cleanScope.patientId}`
    : cleanScope?.doctorId
    ? `doctor_id=eq.${cleanScope.doctorId}`
    : undefined;

  const channel = supabase
    .channel(`clinic-consult-messages:${scopeTag}:${subId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'clinic_consult_messages',
        ...(filter ? { filter } : {}),
      },
      (payload: { new?: Partial<CloudConsultMessageRow>; old?: Partial<CloudConsultMessageRow> }) => {
        const row = payload?.new || payload?.old;
        if (
          cleanScope?.doctorId &&
          row?.doctor_id &&
          row.doctor_id !== cleanScope.doctorId
        ) {
          return;
        }
        if (
          cleanScope?.patientId &&
          row?.patient_id &&
          row.patient_id !== cleanScope.patientId
        ) {
          return;
        }
        // Chỉ thông báo để tải lại dữ liệu đã được xác thực qua RLS từ database, tuyệt đối không render trực tiếp payload từ sự kiện
        onUpdate();
      }
    )
    .subscribe();

  const pollTimer = setInterval(() => {
    onUpdate();
  }, 15000);

  return () => {
    clearInterval(pollTimer);
    localListeners.delete(localEntry);
    void supabase.removeChannel(channel);
  };
}
