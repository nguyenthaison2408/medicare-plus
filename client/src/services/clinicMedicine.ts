import type { MedicineCabinetItem } from '../context/AppContext';
import { CLOUD_MODE, getSupabase } from './supabaseClient';

interface CloudMedicineCabinetRow {
  id: string;
  medicine_name: string;
  owner_label: string;
  stock_label: string;
  expiry_label: string;
  urgent: boolean;
}

const EMPTY_TAKEN_MAP: Record<string, boolean> = {
  morning: false,
  afternoon: false,
  evening: false,
};

function toMedicine(row: CloudMedicineCabinetRow): MedicineCabinetItem {
  return {
    id: row.id,
    name: row.medicine_name,
    owner: row.owner_label,
    stock: row.stock_label,
    exp: row.expiry_label,
    urgent: row.urgent,
  };
}

function normalizeTakenMap(value: unknown): Record<string, boolean> {
  const row = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
  return {
    morning: row.morning === true,
    afternoon: row.afternoon === true,
    evening: row.evening === true,
  };
}

export async function fetchMedicineCabinetCloud(): Promise<MedicineCabinetItem[]> {
  if (!CLOUD_MODE) return [];
  const { data, error } = await getSupabase()
    .from('clinic_medicine_cabinet')
    .select('id,medicine_name,owner_label,stock_label,expiry_label,urgent')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Không tải được Tủ thuốc. Vui lòng thử lại.');
  return (data || []).map(row => toMedicine(row as CloudMedicineCabinetRow));
}

export async function addMedicineCabinetCloud(
  medicine: Omit<MedicineCabinetItem, 'id'>
): Promise<MedicineCabinetItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Vui lòng đăng nhập lại trước khi thêm thuốc.');

  const { data, error } = await supabase
    .from('clinic_medicine_cabinet')
    .insert({
      owner_id: user.id,
      medicine_name: medicine.name.trim(),
      owner_label: medicine.owner.trim(),
      stock_label: medicine.stock.trim(),
      expiry_label: medicine.exp.trim(),
      urgent: medicine.urgent,
    })
    .select('id,medicine_name,owner_label,stock_label,expiry_label,urgent')
    .single();
  if (error || !data) throw new Error('Chưa lưu được thuốc. Vui lòng kiểm tra thông tin và thử lại.');
  return toMedicine(data as CloudMedicineCabinetRow);
}

export async function fetchMedicationLogCloud(): Promise<Record<string, boolean>> {
  if (!CLOUD_MODE) return { ...EMPTY_TAKEN_MAP };
  const { data, error } = await getSupabase().rpc('clinic_get_medication_log');
  if (error) throw new Error('Không tải được nhật ký uống thuốc. Vui lòng thử lại.');
  return normalizeTakenMap(data);
}

export async function setMedicationTakenCloud(
  slotKey: string,
  taken: boolean
): Promise<Record<string, boolean>> {
  if (!CLOUD_MODE) return { ...EMPTY_TAKEN_MAP, [slotKey]: taken };
  const { data, error } = await getSupabase().rpc('clinic_set_medication_taken', {
    p_slot_key: slotKey,
    p_taken: taken,
  });
  if (error) throw new Error('Chưa cập nhật được cữ thuốc. Vui lòng thử lại.');
  return normalizeTakenMap(data);
}
