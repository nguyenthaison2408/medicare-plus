import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import type { LabResultItem } from '../../types/labResults';
import { resolveLabFileUrl } from '../../services/clinicLabResults';
import {
  LAB_CATEGORY_META,
  formatLabFileSize,
  isLabImageMime,
} from '../../utils/labResultValidation';
import { Badge } from '../common/Badge';
import { AppButton } from '../common/AppButton';

export interface LabFileViewerModalProps {
  visible: boolean;
  item: LabResultItem | null;
  onClose: () => void;
}

export const LabFileViewerModal: React.FC<LabFileViewerModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(undefined);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!visible || !item) {
      return;
    }
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) {
          setResolvedUrl(undefined);
          setLoadingUrl(true);
          setZoomed(false);
        }
        return resolveLabFileUrl(item.filePath, item.previewUrl);
      })
      .then((url) => {
        if (active) setResolvedUrl(url);
      })
      .catch(() => { if (active) setResolvedUrl(undefined); })
      .finally(() => {
        if (active) setLoadingUrl(false);
      });
    return () => {
      active = false;
    };
  }, [visible, item]);

  if (!item) return null;

  const meta = LAB_CATEGORY_META[item.category] || LAB_CATEGORY_META.other;
  const isImage = isLabImageMime(item.mimeType);
  const formattedDate = new Date(item.createdAt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleOpenExternal = async () => {
    const targetUrl = resolvedUrl || item.previewUrl;
    if (!targetUrl) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(targetUrl);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, SHADOWS.lg]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Badge label={meta.shortLabel} variant="blue" />
                <Badge
                  label={isImage ? 'Hình ảnh CĐHA' : 'Tài liệu PDF'}
                  variant="teal"
                />
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.fileName} • {formatLabFileSize(item.fileSizeBytes)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Đóng cửa sổ xem kết quả"
            >
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* File Preview Area */}
            {loadingUrl ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>
                  Đang tải tệp từ Supabase Storage...
                </Text>
              </View>
            ) : isImage && resolvedUrl ? (
              <View style={styles.pacsBox}>
                <Image
                  source={{ uri: resolvedUrl }}
                  style={[styles.pacsImage, zoomed && styles.pacsImageZoomed]}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoomed((z) => !z)}
                  accessibilityRole="button"
                  accessibilityLabel={zoomed ? 'Thu nhỏ ảnh' : 'Phóng to ảnh'}
                >
                  <Ionicons
                    name={zoomed ? 'contract-outline' : 'expand-outline'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.zoomText}>
                    {zoomed ? 'Thu gọn' : 'Phóng to'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pdfBox}>
                <View style={styles.pdfIconCircle}>
                  <Ionicons name="document-text" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.pdfTitle}>{item.fileName}</Text>
                <Text style={styles.pdfSub}>
                  Định dạng: {item.mimeType} • Dung lượng: {formatLabFileSize(item.fileSizeBytes)}
                </Text>
                {!resolvedUrl && (
                  <Text style={styles.noUrlNotice}>
                    Tệp đang ở chế độ xem trước cục bộ (chưa có URL công khai).
                  </Text>
                )}
              </View>
            )}

            {/* Clinical Metadata */}
            <View style={styles.metaCard}>
              <Text style={styles.metaHeading}>KẾT LUẬN CHUYÊN KHOA</Text>
              <Text style={styles.conclusionText}>
                {item.conclusion?.trim()
                  ? item.conclusion
                  : 'Chưa có ghi chú kết luận bổ sung từ bác sĩ.'}
              </Text>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.metaInfo}>
                  Bác sĩ tải lên: {item.doctorName || 'Bác sĩ điều trị'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaInfo}>Thời gian trả kết quả: {formattedDate}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {resolvedUrl ? (
              <AppButton
                title={isImage ? 'Mở ảnh gốc / Tải về' : 'Mở xem file PDF'}
                variant="primary"
                size="md"
                leftIcon="open-outline"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={handleOpenExternal}
              />
            ) : null}
            <AppButton
              title="Đóng"
              variant="outline"
              size="md"
              fullWidth={!resolvedUrl}
              style={resolvedUrl ? { minWidth: 100 } : undefined}
              onPress={onClose}
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
    maxWidth: 560,
    maxHeight: '90%',
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
    gap: 12,
  },
  loadingBox: {
    height: 200,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  pacsBox: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  pacsImage: {
    width: '100%',
    height: 260,
  },
  pacsImageZoomed: {
    height: 400,
  },
  zoomBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  zoomText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
  },
  pdfBox: {
    padding: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
  },
  pdfIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pdfTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  pdfSub: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  noUrlNotice: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.warning,
    marginTop: 8,
    textAlign: 'center',
  },
  metaCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  metaHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  conclusionText: {
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  metaDivider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaInfo: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
});
