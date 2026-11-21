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

type ChatListener = (msg?: ConsultMessageItem) => void;
const localListeners = new Set<ChatListener>();

let sharedRealtimeChannel: ReturnType<ReturnType<typeof getSupabase>['channel']> | null = null;
let sharedChannelSubscribed = false;
let sharedSubscriberCount = 0;

function notifyLocalListeners(msg?: ConsultMessageItem) {
  localListeners.forEach((fn) => {
    try {
      fn(msg);
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

function mergeMessages(
  dbRows: ConsultMessageItem[],
  cachedRows: ConsultMessageItem[],
  params: { doctorId?: string; patientId?: string }
): ConsultMessageItem[] {
  const byId = new Map<string, ConsultMessageItem>();
  for (const item of [...cachedRows, ...dbRows]) {
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
  const cached = await readCachedMessages();
  if (!CLOUD_MODE) {
    return mergeMessages([], cached, params);
  }
  let query = getSupabase()
    .from('clinic_consult_messages')
    .select('*')
    .order('created_at', { ascending: true });
  if (params.doctorId) {
    query = query.eq('doctor_id', params.doctorId);
  }
  if (params.patientId) {
    query = query.eq('patient_id', params.patientId);
  }
  const { data, error } = await query;
  if (error) {
    return mergeMessages([], cached, params);
  }
  const dbRows = ((data || []) as CloudConsultMessageRow[]).map(toConsultMessage);
  return mergeMessages(dbRows, cached, params);
}

async function broadcastConsultMessage(savedItem: ConsultMessageItem): Promise<void> {
  if (!CLOUD_MODE) return;
  try {
    if (sharedRealtimeChannel && sharedChannelSubscribed) {
      await sharedRealtimeChannel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: savedItem,
      });
      return;
    }
    const supabase = getSupabase();
    const tempName = `clinic-consult-send-${Date.now()}`;
    const tempChannel = supabase.channel('clinic-consult-messages-live', {
      config: { broadcast: { self: false } },
    });
    void tempName;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 1500);
      tempChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          void tempChannel
            .send({
              type: 'broadcast',
              event: 'new_message',
              payload: savedItem,
            })
            .finally(() => resolve());
        }
      });
    });
  } catch {
    // ignore broadcast error
  }
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
  if (!cleanText) {
    throw new Error('Vui lòng nhập nội dung tin nhắn.');
  }
  if (cleanText.length > 2000) {
    throw new Error('Tin nhắn tư vấn không vượt quá 2000 ký tự.');
  }
  const nowIso = new Date().toISOString();
  if (!CLOUD_MODE) {
    const localMsg: ConsultMessageItem = {
      id: `local-${Date.now()}`,
      patientId: params.patientId || 'demo-patient',
      doctorId: params.doctorId,
      appointmentId: params.appointmentId || null,
      senderId: params.senderRole === 'patient' ? 'demo-patient' : params.doctorId,
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
    notifyLocalListeners(localMsg);
    return localMsg;
  }

  const {
    data: { user },
    error: authError,
  } = await getSupabase().auth.getUser();
  if (authError || !user) {
    throw new Error('Vui lòng đăng nhập lại trước khi gửi tin nhắn.');
  }
  const resolvedPatientId =
    params.senderRole === 'patient' ? user.id : params.patientId || user.id;
  const payload = {
    patient_id: resolvedPatientId,
    doctor_id: params.doctorId,
    appointment_id: params.appointmentId || null,
    sender_id: user.id,
    sender_role: params.senderRole,
    sender_name: (params.senderName || 'Người dùng').trim(),
    content: cleanText,
  };

  let savedItem: ConsultMessageItem;
  const { data, error } = await getSupabase()
    .from('clinic_consult_messages')
    .insert(payload)
    .select('*')
    .single();

  if (!error && data) {
    savedItem = {
      ...toConsultMessage(data as CloudConsultMessageRow),
      patientName:
        params.patientName ||
        (params.senderRole === 'patient' ? payload.sender_name : undefined),
    };
  } else {
    savedItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      patientId: resolvedPatientId,
      doctorId: params.doctorId,
      appointmentId: params.appointmentId || null,
      senderId: user.id,
      senderRole: params.senderRole,
      senderName: payload.sender_name,
      patientName:
        params.patientName ||
        (params.senderRole === 'patient' ? payload.sender_name : undefined),
      text: cleanText,
      time: formatChatTime(nowIso),
      createdAt: nowIso,
    };
  }

  await appendCachedMessage(savedItem);
  notifyLocalListeners(savedItem);
  void broadcastConsultMessage(savedItem);

  return savedItem;
}

export function subscribeConsultMessagesCloud(onUpdate: () => void): () => void {
  const localHandler: ChatListener = () => onUpdate();
  localListeners.add(localHandler);

  if (!CLOUD_MODE) {
    return () => {
      localListeners.delete(localHandler);
    };
  }

  sharedSubscriberCount += 1;
  const supabase = getSupabase();

  if (!sharedRealtimeChannel) {
    sharedChannelSubscribed = false;
    sharedRealtimeChannel = supabase
      .channel('clinic-consult-messages-live', {
        config: { broadcast: { self: false } },
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinic_consult_messages' },
        () => {
          notifyLocalListeners();
        }
      )
      .on('broadcast', { event: 'new_message' }, (event) => {
        const incoming = event?.payload as ConsultMessageItem | undefined;
        if (incoming && incoming.id) {
          void appendCachedMessage(incoming).then(() => {
            notifyLocalListeners(incoming);
          });
        } else {
          notifyLocalListeners();
        }
      })
      .subscribe((status) => {
        sharedChannelSubscribed = status === 'SUBSCRIBED';
      });
  }

  // Fallback polling mỗi 3 giây phòng trường hợp WebSocket trên 4G/5G bị ngủ đông
  const pollTimer = setInterval(() => {
    onUpdate();
  }, 3000);

  return () => {
    clearInterval(pollTimer);
    localListeners.delete(localHandler);
    sharedSubscriberCount = Math.max(0, sharedSubscriberCount - 1);
    if (sharedSubscriberCount === 0 && sharedRealtimeChannel) {
      const ch = sharedRealtimeChannel;
      sharedRealtimeChannel = null;
      sharedChannelSubscribed = false;
      void supabase.removeChannel(ch);
    }
  };
}
