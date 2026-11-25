import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import type {
  LabResultCategory,
  LabResultItem,
  PickedLabFile,
  UploadLabResultInput,
} from '../../types/labResults';
import { pickLabFileFromDevice } from '../../utils/labFilePicker';
import {
  LAB_CATEGORY_META,
  formatLabFileSize,
  isLabImageMime,
  validateLabResultForm,
} from '../../utils/labResultValidation';
import { AppButton } from '../common/AppButton';
import { AppInput } from '../common/AppInput';
import { Badge } from '../common/Badge';

export interface DoctorLabUploadModalProps {
  visible: boolean;
  appointmentId: string;
  patientName: string;
  onClose: () => void;
  onUpload: (input: UploadLabResultInput) => Promise<LabResultItem>;
  onSuccess?: (created: LabResultItem) => void;
}

const CATEGORIES: LabResultCategory[] = ['imaging', 'blood', 'pathology', 'other'];

export const DoctorLabUploadModal: React.FC<DoctorLabUploadModalProps> = ({
  visible,
  appointmentId,
  patientName,
  onClose,
  onUpload,
  onSuccess,
}) => {
  const [category, setCategory] = useState<LabResultCategory>('imaging');
  const [title, setTitle] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [pickedFile, setPickedFile] = useState<PickedLabFile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setCategory('imaging');
    setTitle('');
    setConclusion('');
    setPickedFile(null);
    setErrorMsg('');
  };

  const handleClose = () => {
    if (uploading) return;
    resetForm();
    onClose();
  };

  const handlePickFile = async () => {
    setErrorMsg('');
    const result = await pickLabFileFromDevice();
    if (result.cancelled) return;
    if (result.error) {
      setErrorMsg(result.error);
      return;
    }
    if (result.file) {
      setPickedFile(result.file);
      if (!title.trim()) {
        const nameWithoutExt = result.file.fileName.replace(/\.[^.]+$/, '');
        setTitle(nameWithoutExt.slice(0, 120));
      }
    }
  };

  const handleSubmit = async () => {
    if (uploading) return;
    const check = validateLabResultForm(title, conclusion, Boolean(pickedFile));
    if (!check.ok) {
      setErrorMsg(check.error);
      return;
    }
    if (!pickedFile) return;

    setUploading(true);
    setErrorMsg('');
    try {
      const created = await onUpload({
        appointmentId,
        category,
        title: title.trim(),
        conclusion: conclusion.trim(),
        file: pickedFile,
      });
      resetForm();
      onSuccess?.(created);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Tải lên kết quả cận lâm sàng thất bại. Vui lòng thử lại.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, SHADOWS.lg]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Badge label="SUPABASE STORAGE • CẬN LÂM SÀNG" variant="teal" />
              <Text style={styles.title}>Tải lên Kết quả Xét nghiệm / CĐHA</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                Bệnh nhân: {patientName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Đóng biểu mẫu tải kết quả"
            >
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category chips */}
            <Text style={styles.fieldLabel}>LOẠI CẬN LÂM SÀNG (*)</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                const meta = LAB_CATEGORY_META[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.catChip, active && styles.catChipActive]}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={meta.icon as any}
                      size={14}
                      color={active ? '#FFFFFF' : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        active && styles.catChipTextActive,
                      ]}
                    >
                      {meta.shortLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppInput
              label="TÊN PHIẾU KẾT QUẢ / CHỈ ĐỊNH (*)"
              placeholder="VD: Chụp X-Quang Phổi thẳng / MRI Sọ não"
              value={title}
              onChangeText={(txt) => {
                setTitle(txt);
                if (errorMsg) setErrorMsg('');
              }}
              leftIcon="document-text-outline"
            />

            <AppInput
              label="KẾT LUẬN CHUYÊN KHOA CỦA BÁC SĨ"
              placeholder="VD: Nhu mô phổi sáng đều, không thấy tổn thương khu trú..."
              value={conclusion}
              onChangeText={setConclusion}
              multiline
              numberOfLines={3}
              leftIcon="medkit-outline"
            />

            {/* File Picker Card */}
            <Text style={styles.fieldLabel}>
              TỆP KẾT QUẢ (PDF, JPG, PNG, WEBP • TỐI ĐA 10MB) (*)
            </Text>
            {pickedFile ? (
              <View style={styles.fileCard}>
                {isLabImageMime(pickedFile.mimeType) && pickedFile.localPreviewUrl ? (
                  <Image
                    source={{ uri: pickedFile.localPreviewUrl }}
                    style={styles.previewThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.pdfThumb}>
                    <Ionicons
                      name="document-text"
                      size={26}
                      color={COLORS.primary}
                    />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {pickedFile.fileName}
                  </Text>
                  <Text style={styles.fileMeta}>
                    {pickedFile.mimeType} • {formatLabFileSize(pickedFile.fileSizeBytes)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handlePickFile}
                  style={styles.changeBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.changeBtnText}>Đổi tệp</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickFile}
                style={styles.dropZone}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Chọn file PDF hoặc ảnh từ máy"
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={28}
                  color={COLORS.primary}
                />
                <Text style={styles.dropTitle}>
                  Chạm để chọn file PDF hoặc ảnh X-Quang/MRI
                </Text>
                <Text style={styles.dropSub}>
                  Hỗ trợ: .pdf, .jpg, .png, .webp (tối đa 10 MB)
                </Text>
              </TouchableOpacity>
            )}

            {errorMsg ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {errorMsg}
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              title="Hủy"
              variant="outline"
              size="md"
              fullWidth={false}
              style={{ minWidth: 90 }}
              onPress={handleClose}
              disabled={uploading}
            />
            <AppButton
              title={uploading ? 'Đang tải lên Storage...' : 'Tải lên & Trả kết quả'}
              variant="primary"
              size="md"
              leftIcon="cloud-upload-outline"
              fullWidth={false}
              style={{ flex: 1 }}
              loading={uploading}
              disabled={uploading}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: SPACING.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryContainer,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dropTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  dropSub: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: '#0F172A',
  },
  pdfThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  fileMeta: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryContainer,
  },
  changeBtnText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
});
