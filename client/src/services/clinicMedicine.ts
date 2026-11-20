import type { MedicationDoseLogRef, MedicineCabinetItem } from '../context/AppContext';
import { CLOUD_MODE, getSupabase } from './supabaseClient';

interface CloudMedicineCabinetRow {
  id: string;
  medicine_name: string;
  owner_label: string;
  stock_label: string;
  expiry_label: string;
  urgent: boolean;
}

const EMPTY_TAKEN_MAP: Record<string, boolean> = {};

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
  return Object.fromEntries(
    Object.entries(row).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
  );
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
  medicine: Omit<MedicineCabinetItem, 'id' | 'owner'>
): Promise<MedicineCabinetItem> {
  if (!CLOUD_MODE) throw new Error('Chưa bật dữ liệu trực tuyến.');
  const { data, error } = await getSupabase().rpc('clinic_add_cabinet_medicine', {
    p_medicine_name: medicine.name.trim(),
    p_stock_label: medicine.stock.trim(),
    p_expiry_label: medicine.exp.trim(),
    p_urgent: medicine.urgent,
  });
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
  dose: MedicationDoseLogRef,
  taken: boolean
): Promise<Record<string, boolean>> {
  if (!CLOUD_MODE) return { ...EMPTY_TAKEN_MAP, [dose.logKey]: taken };
  if (!dose.appointmentId || dose.medicationIndex === undefined) {
    throw new Error('Cữ thuốc chưa được liên kết với toa điện tử.');
  }
  const { data, error } = await getSupabase().rpc('clinic_set_medication_taken', {
    p_appointment_id: dose.appointmentId,
    p_medication_index: dose.medicationIndex,
    p_dose_key: dose.doseKey,
    p_taken: taken,
  });
  if (error) throw new Error('Chưa cập nhật được cữ thuốc. Vui lòng thử lại.');
  return normalizeTakenMap(data);
}

export async function fetchMedicationDataForRole(role: string): Promise<{
  medicines: MedicineCabinetItem[];
  takenMap: Record<string, boolean>;
}> {
  if (role !== 'patient') {
    return { medicines: [], takenMap: { ...EMPTY_TAKEN_MAP } };
  }
  const [medicines, takenMap] = await Promise.all([
    fetchMedicineCabinetCloud(),
    fetchMedicationLogCloud(),
  ]);
  return { medicines, takenMap };
}
