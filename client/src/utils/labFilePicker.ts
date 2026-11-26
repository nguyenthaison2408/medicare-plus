import { Platform } from 'react-native';
import type { PickedLabFile } from '../types/labResults';
import { validateLabFileMeta } from './labResultValidation';

export interface PickLabFileResult {
  cancelled?: boolean;
  file?: PickedLabFile;
  error?: string;
}

function readFileAsDataUrl(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : undefined);
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

/**
 * Prompts the doctor to select a PDF or imaging file (JPG, PNG, WEBP)
 * from their device. Validates file type and 10MB size limit before returning.
 */
export async function pickLabFileFromDevice(): Promise<PickLabFileResult> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return {
      error:
        'Vui lòng sử dụng phiên bản Web để chọn tệp PDF / ảnh X-Quang trực tiếp từ máy tính.',
    };
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf,image/jpeg,image/png,image/webp';

    let settled = false;
    const finish = (res: PickLabFileResult) => {
      if (settled) return;
      settled = true;
      resolve(res);
    };

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        finish({ cancelled: true });
        return;
      }

      const check = validateLabFileMeta(file.name, file.type, file.size);
      if (!check.ok) {
        finish({ error: check.error });
        return;
      }

      const localPreviewUrl =
        check.mimeType === 'application/pdf'
          ? typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
            ? URL.createObjectURL(file)
            : await readFileAsDataUrl(file)
          : await readFileAsDataUrl(file);

      finish({
        file: {
          fileName: file.name,
          mimeType: check.mimeType,
          fileSizeBytes: file.size,
          uploadBody: file,
          localPreviewUrl,
        },
      });
    };

    input.oncancel = () => finish({ cancelled: true });
    input.click();
  });
}
