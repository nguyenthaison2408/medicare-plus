import type { LabAllowedMimeType, LabResultCategory } from '../types/labResults';

export const MAX_LAB_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_LAB_MIME_TYPES: readonly LabAllowedMimeType[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const LAB_CATEGORY_META: Record<
  LabResultCategory,
  { label: string; shortLabel: string; icon: string }
> = {
  imaging: {
    label: 'Chẩn đoán hình ảnh (X-Quang / MRI / CT)',
    shortLabel: 'CĐHA',
    icon: 'scan-outline',
  },
  blood: {
    label: 'Xét nghiệm máu & Sinh hóa',
    shortLabel: 'Xét nghiệm',
    icon: 'flask-outline',
  },
  pathology: {
    label: 'Giải phẫu bệnh & Tế bào học',
    shortLabel: 'Giải phẫu bệnh',
    icon: 'analytics-outline',
  },
  other: {
    label: 'Tài liệu cận lâm sàng khác',
    shortLabel: 'Khác',
    icon: 'document-attach-outline',
  },
};

export function inferLabMimeType(
  fileName: string,
  rawMimeType?: string
): LabAllowedMimeType | null {
  const normalizedMime = (rawMimeType || '').trim().toLowerCase();
  if (normalizedMime === 'image/jpg') return 'image/jpeg';
  if ((ALLOWED_LAB_MIME_TYPES as readonly string[]).includes(normalizedMime)) {
    return normalizedMime as LabAllowedMimeType;
  }

  if (normalizedMime && normalizedMime !== 'application/octet-stream') return null;
  const lowerName = (fileName || '').trim().toLowerCase();
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  return null;
}

export function validateLabFileMeta(
  fileName: string,
  rawMimeType: string,
  fileSizeBytes: number
): { ok: true; mimeType: LabAllowedMimeType } | { ok: false; error: string } {
  const cleanName = (fileName || '').trim();
  if (!cleanName) {
    return { ok: false, error: 'Tên tệp không hợp lệ.' };
  }

  const mimeType = inferLabMimeType(cleanName, rawMimeType);
  if (!mimeType) {
    return {
      ok: false,
      error: 'Chỉ hỗ trợ tải lên tệp PDF hoặc ảnh (JPG, PNG, WEBP).',
    };
  }

  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    return { ok: false, error: 'Tệp rỗng hoặc không đọc được dung lượng.' };
  }

  if (fileSizeBytes > MAX_LAB_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: 'Dung lượng tệp vượt quá giới hạn tối đa 10 MB.',
    };
  }

  return { ok: true, mimeType };
}

export function validateLabResultForm(
  title: string,
  conclusion: string,
  hasFile: boolean
): { ok: true } | { ok: false; error: string } {
  const cleanTitle = (title || '').trim();
  if (cleanTitle.length < 2 || cleanTitle.length > 200) {
    return {
      ok: false,
      error: 'Vui lòng nhập tên kết quả cận lâm sàng (từ 2 đến 200 ký tự).',
    };
  }

  if ((conclusion || '').length > 2000) {
    return {
      ok: false,
      error: 'Kết luận chuyên khoa không được vượt quá 2000 ký tự.',
    };
  }

  if (!hasFile) {
    return {
      ok: false,
      error: 'Vui lòng chọn tệp PDF hoặc hình ảnh X-Quang/MRI trước khi tải lên.',
    };
  }

  return { ok: true };
}

export function formatLabFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function sanitizeStorageFileName(fileName: string): string {
  const trimmed = (fileName || 'lab-result').trim();
  const normalized = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (normalized || 'lab-result').slice(0, 120);
}

export function buildLabStoragePath(appointmentId: string, fileName: string): string {
  const safeApt = (appointmentId || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFile = sanitizeStorageFileName(fileName);
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `appointments/${safeApt}/${stamp}-${rand}-${safeFile}`;
}

export function isLabImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
