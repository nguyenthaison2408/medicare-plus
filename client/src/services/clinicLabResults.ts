import type {
  LabAllowedMimeType,
  LabResultCategory,
  LabResultItem,
  UploadLabResultInput,
} from '../types/labResults';
import { CLOUD_MODE, getSupabase } from './supabaseClient';
import {
  buildLabStoragePath,
  validateLabFileMeta,
  validateLabResultForm,
} from '../utils/labResultValidation';

export const LAB_STORAGE_BUCKET = 'clinic-lab-results';

interface CloudLabResultRow {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  category: string;
  title: string;
  conclusion: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
}

function toLabResult(row: CloudLabResultRow, previewUrl?: string): LabResultItem {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    category: (row.category as LabResultCategory) || 'other',
    title: row.title,
    conclusion: row.conclusion || '',
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: (row.mime_type as LabAllowedMimeType) || 'application/pdf',
    fileSizeBytes: Number(row.file_size_bytes) || 0,
    createdAt: row.created_at,
    previewUrl,
  };
}

export async function resolveLabFileUrl(
  filePath: string,
  fallbackUrl?: string
): Promise<string | undefined> {
  if (!CLOUD_MODE || !filePath || filePath.startsWith('demo/')) {
    return fallbackUrl;
  }
  const { data, error } = await getSupabase()
    .storage.from(LAB_STORAGE_BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error || !data?.signedUrl) {
    return fallbackUrl;
  }
  return data.signedUrl;
}

export async function fetchLabResultsCloud(role: string): Promise<LabResultItem[]> {
  if (!CLOUD_MODE) return [];
  if (role !== 'patient' && role !== 'doctor' && role !== 'admin') {
    return [];
  }

  const { data, error } = await getSupabase()
    .from('clinic_lab_results')
    .select(
      'id,appointment_id,patient_id,doctor_id,category,title,conclusion,file_path,file_name,mime_type,file_size_bytes,created_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Không tải được danh sách kết quả cận lâm sàng.');
  }

  const rows = (data || []) as CloudLabResultRow[];
  const items = await Promise.all(
    rows.map(async (row) => {
      const signedUrl = await resolveLabFileUrl(row.file_path);
      return toLabResult(row, signedUrl);
    })
  );
  return items;
}

export async function uploadLabResultCloud(
  input: UploadLabResultInput
): Promise<LabResultItem> {
  const formCheck = validateLabResultForm(
    input.title,
    input.conclusion,
    Boolean(input.file)
  );
  if (!formCheck.ok) {
    throw new Error(formCheck.error);
  }

  const fileCheck = validateLabFileMeta(
    input.file.fileName,
    input.file.mimeType,
    input.file.fileSizeBytes
  );
  if (!fileCheck.ok) {
    throw new Error(fileCheck.error);
  }

  if (!CLOUD_MODE) {
    const demoPath = buildLabStoragePath(input.appointmentId, input.file.fileName);
    return {
      id: `lab-${Date.now()}`,
      appointmentId: input.appointmentId,
      doctorId: 'doc-1',
      category: input.category,
      title: input.title.trim(),
      conclusion: input.conclusion.trim(),
      filePath: `demo/${demoPath}`,
      fileName: input.file.fileName,
      mimeType: fileCheck.mimeType,
      fileSizeBytes: input.file.fileSizeBytes,
      createdAt: new Date().toISOString(),
      previewUrl: input.file.localPreviewUrl,
    };
  }

  const storagePath = buildLabStoragePath(input.appointmentId, input.file.fileName);
  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from(LAB_STORAGE_BUCKET)
    .upload(storagePath, input.file.uploadBody, {
      contentType: fileCheck.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Tải tệp lên Supabase Storage thất bại: ${uploadError.message}`
    );
  }

  const { data, error: rpcError } = await supabase.rpc('clinic_add_lab_result', {
    p_appointment_id: input.appointmentId,
    p_category: input.category,
    p_title: input.title.trim(),
    p_conclusion: input.conclusion.trim(),
    p_file_path: storagePath,
    p_file_name: input.file.fileName,
    p_mime_type: fileCheck.mimeType,
    p_file_size_bytes: input.file.fileSizeBytes,
  });

  if (rpcError || !data) {
    // Rollback orphaned storage object if metadata insert fails
    await supabase.storage.from(LAB_STORAGE_BUCKET).remove([storagePath]);
    throw new Error(
      rpcError?.message || 'Không thể lưu thông tin kết quả cận lâm sàng.'
    );
  }

  const row = data as CloudLabResultRow;
  const signedUrl = await resolveLabFileUrl(row.file_path, input.file.localPreviewUrl);
  return toLabResult(row, signedUrl);
}

export async function deleteLabResultCloud(resultId: string): Promise<void> {
  if (!CLOUD_MODE) return;
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('clinic_delete_lab_result', {
    p_result_id: resultId,
  });
  if (error || !data) {
    throw new Error(error?.message || 'Không thể xóa kết quả cận lâm sàng.');
  }
  const row = data as CloudLabResultRow;
  if (row.file_path) {
    await supabase.storage.from(LAB_STORAGE_BUCKET).remove([row.file_path]);
  }
}
