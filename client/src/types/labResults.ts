export type LabResultCategory = 'imaging' | 'blood' | 'pathology' | 'other';

export type LabAllowedMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp';

export interface LabResultItem {
  id: string;
  appointmentId: string;
  patientId?: string;
  doctorId: string;
  doctorName?: string;
  category: LabResultCategory;
  title: string;
  conclusion: string;
  filePath: string;
  fileName: string;
  mimeType: LabAllowedMimeType;
  fileSizeBytes: number;
  createdAt: string;
  /** Resolved local URI, data URL, or signed cloud URL for rendering/opening. */
  previewUrl?: string;
}

export interface PickedLabFile {
  fileName: string;
  mimeType: LabAllowedMimeType;
  fileSizeBytes: number;
  /** Binary payload for Supabase Storage upload (Web File/Blob/ArrayBuffer). */
  uploadBody: Blob | ArrayBuffer | Uint8Array;
  /** Local preview URL (data URI or object URL) for immediate UI preview. */
  localPreviewUrl?: string;
}

export interface UploadLabResultInput {
  appointmentId: string;
  category: LabResultCategory;
  title: string;
  conclusion: string;
  file: PickedLabFile;
}
