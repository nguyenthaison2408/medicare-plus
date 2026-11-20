import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, LAYOUT, RADIUS, SHADOWS, SPACING, TOUCH, TYPOGRAPHY } from '../theme';
import { useAppContext } from '../context/AppContext';
import { sharePrescription } from '../utils/shareUtils';
import { buildMedicationSchedule } from '../utils/medicationSchedule';
import {
  AppHeader,
  AppButton,
  AppInput,
  Badge,
  SectionHeader,
  SegmentedControl,
  EmptyState,
  ToastBanner,
  AnimatedEntry,
  PressableScale,
  PulsingDot,
} from '../components';

// ============================================================================
// SCREEN 8: NHẬT KÝ & NHẮC UỐNG THUỐC
// ============================================================================
export const MedicationLogScreen: React.FC<{
  onBack?: () => void;
  onOpenPrescription?: () => void;
  onOpenCabinet?: () => void;
}> = ({ onBack, onOpenPrescription, onOpenCabinet }) => {
  const {
    takenMap,
    toggleMedicationTaken,
    patientProfile,
    prescriptions,
    diagnosisNote,
  } = useAppContext();
  const [toastVisible, setToastVisible] = useState(false);
  const [updatingSlot, setUpdatingSlot] = useState<string | null>(null);
  const medicationSchedule = buildMedicationSchedule(prescriptions);
  const totalDoses = medicationSchedule.length;
  const takenCount = medicationSchedule.filter(slot => takenMap[slot.logKey]).length;
  const adherencePct = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      day: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index],
      number: String(date.getDate()).padStart(2, '0'),
      active: date.toDateString() === today.toDateString(),
    };
  });

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Nhật Ký & Nhắc Uống Thuốc"
        subtitle={`${patientProfile.name}${patientProfile.patientCode ? ` (${patientProfile.patientCode})` : ''} • ${diagnosisNote || 'Chưa có phác đồ điều trị'}`}
        badgeText={totalDoses > 0 ? `${adherencePct}% hôm nay` : 'Chưa có cữ thuốc'}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {/* Weekly Adherence Strip (Habit Tracker) */}
        <AnimatedEntry delay={40} direction="up">
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
                Tuần hiện tại • {today.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
              </Text>
              <Badge label={totalDoses > 0 ? `${takenCount}/${totalDoses} cữ hôm nay` : 'Chưa có toa thuốc'} variant="teal" />
            </View>
            <View style={styles.weekRow}>
              {weekDays.map((day) => (
                <View
                  key={day.key}
                  style={[
                    styles.dayPill,
                    day.active && styles.dayPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      day.active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {day.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayPillNum,
                      day.active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {day.number}
                  </Text>
                  <Ionicons
                    name={day.active && totalDoses > 0 && takenCount === totalDoses ? 'checkmark-circle' : 'ellipse'}
                    size={12}
                    color={
                      day.active
                        ? '#86F2E4'
                        : '#CBD5E1'
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        </AnimatedEntry>

        {/* AI Medication Adherence Insight Card */}
        <AnimatedEntry delay={100} direction="up">
          <LinearGradient
            colors={GRADIENTS.primaryTeal}
            style={[styles.heroCard, SHADOWS.sm]}
          >
            <View style={styles.rowBetween}>
              <Badge label="Trợ lý AI MediCare Plus" variant="glass" icon="sparkles" />
              <Text style={styles.whiteSub} numberOfLines={1}>
                {totalDoses > 0 ? `${totalDoses} thuốc từ toa điện tử` : 'Chưa có toa thuốc'}
              </Text>
            </View>
            <Text style={styles.whiteBody}>
              {totalDoses > 0
                ? `Hôm nay bạn đã xác nhận ${takenCount}/${totalDoses} cữ. Hãy dùng thuốc đúng theo liều và hướng dẫn trong toa điện tử.`
                : 'Chưa có thuốc được bác sĩ kê trong hồ sơ trực tuyến. Nhật ký sẽ hiển thị sau khi toa thuốc được phát hành.'}
            </Text>
          </LinearGradient>
        </AnimatedEntry>

        {/* Today's Pill Schedule */}
        <SectionHeader
          title="Lịch uống thuốc hôm nay"
          actionText="Xem chi tiết toa"
          onActionPress={onOpenPrescription}
        />
        {medicationSchedule.length > 0 ? medicationSchedule.map((slot, idx) => {
          const isTaken = takenMap[slot.logKey];
          return (
            <AnimatedEntry key={slot.logKey} delay={160 + idx * 70} direction="up">
              <View style={[styles.card, SHADOWS.sm]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.slotTime, { flex: 1 }]} numberOfLines={1}>
                    {slot.time}
                  </Text>
                  <Badge
                    label={isTaken ? 'Đã uống ✓' : 'Chưa xác nhận'}
                    variant={isTaken ? 'teal' : 'warning'}
                  />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {slot.drug}
                </Text>
                <Text style={styles.subText} numberOfLines={1}>
                  {slot.desc}
                </Text>
                <PressableScale
                  activeScale={0.96}
                  onPress={() => {
                    if (updatingSlot) return;
                    setUpdatingSlot(slot.logKey);
                    void toggleMedicationTaken({
                      logKey: slot.logKey,
                      appointmentId: slot.appointmentId,
                      medicationIndex: slot.medicationIndex,
                      doseKey: slot.doseKey,
                    }).finally(() => setUpdatingSlot(null));
                  }}
                  accessibilityState={{ busy: updatingSlot === slot.logKey }}
                  style={{ marginTop: 10 }}
                >
                  <View
                    style={[
                      styles.confirmBtnWrap,
                      isTaken ? styles.confirmBtnTaken : styles.confirmBtnPending,
                    ]}
                  >
                    <Ionicons
                      name={isTaken ? 'checkmark-done' : 'checkmark-circle-outline'}
                      size={16}
                      color={isTaken ? COLORS.primary : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.confirmBtnText,
                        isTaken ? { color: COLORS.primary } : { color: '#FFFFFF' },
                      ]}
                    >
                      {isTaken ? 'Đã ghi nhận uống thuốc' : 'Xác nhận đã uống cữ này'}
                    </Text>
                  </View>
                </PressableScale>
              </View>
            </AnimatedEntry>
          );
        }) : (
          <EmptyState
            icon="medical-outline"
            title="Chưa có lịch uống thuốc"
            description="Thuốc do bác sĩ kê sẽ xuất hiện tại đây sau khi toa điện tử được phát hành."
          />
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <AppButton
            title="Tủ thuốc"
            variant="tonal"
            size="md"
            leftIcon="medkit-outline"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={onOpenCabinet}
          />
          <AppButton
            title="Cài chuông nhắc"
            variant="outline"
            size="md"
            leftIcon="notifications-outline"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() => setToastVisible(true)}
          />
        </View>
      </ScrollView>
      <ToastBanner
        visible={toastVisible}
        title="Đã bật thông báo nhắc thuốc"
        message="Ứng dụng sẽ sử dụng các cữ thuốc trong toa điện tử của bạn."
        onDismiss={() => setToastVisible(false)}
      />
    </View>
  );
};

// ============================================================================
// SCREEN 13: CHI TIẾT TOA THUỐC ĐIỆN TỬ
// ============================================================================
export const PrescriptionDetailScreen: React.FC<{
  onBack?: () => void;
  onOpenMedLog?: () => void;
}> = ({ onBack, onOpenMedLog }) => {
  const { prescriptions, diagnosisNote, patientProfile } = useAppContext();

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Chi Tiết Toa Thuốc Điện Tử"
        subtitle={`${patientProfile.name}${patientProfile.patientCode ? ` • ${patientProfile.patientCode}` : ''}`}
        badgeText={prescriptions.length > 0 ? 'Đã đồng bộ' : 'Chưa có toa'}
        onBack={onBack}
        rightActions={[
          {
            icon: 'share-social-outline',
            onPress: () => sharePrescription(prescriptions, diagnosisNote),
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {/* Header Summary */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.rowBetween}>
            <Badge
              label={prescriptions.length > 0 ? 'Toa thuốc trong hồ sơ' : 'Chưa phát hành toa'}
              variant="teal"
              showDot={prescriptions.length > 0}
            />
            <Text style={styles.slotTime}>{prescriptions.length} thuốc</Text>
          </View>
          <Text style={[styles.cardTitle, { marginTop: 8 }]}>
            {patientProfile.name}
          </Text>
          <Text style={styles.subText}>
            Thông tin được đồng bộ từ bệnh án điện tử đã hoàn thành
          </Text>
          <Text style={styles.subText}>
            CĐ: {diagnosisNote || 'Chưa có chẩn đoán được lưu'}
          </Text>
        </View>

        {/* AI Safety Audit & Dietary Advice */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Lưu ý an toàn thuốc</Text>
            <Badge label="Theo chỉ định" variant="teal" icon="shield-checkmark" />
          </View>
          <Text style={styles.subText}>
            Hệ thống đang hiển thị {prescriptions.length} thuốc từ hồ sơ bệnh án và không tự động
            kết luận về tương tác thuốc hoặc tiền sử dị ứng.
          </Text>
          <View style={styles.noteCallout}>
            <Ionicons name="nutrition-outline" size={16} color={COLORS.primary} />
            <Text style={styles.noteCalloutText}>
              Dùng thuốc đúng liều ghi trong toa. Liên hệ bác sĩ hoặc dược sĩ nếu có dấu hiệu bất thường.
            </Text>
          </View>
        </View>

        <SectionHeader
          title="Danh Mục Thuốc Kê Đơn"
          subtitle={`${prescriptions.length} loại thuốc trong phác đồ điều trị`}
        />
        {prescriptions.length > 0 ? prescriptions.map((d) => (
          <View key={d.id} style={[styles.card, SHADOWS.sm]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
                {d.name}
              </Text>
              <Badge label={d.quantity} variant="blue" />
            </View>
            <Text style={styles.subText} numberOfLines={1}>
              {d.indication}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <Badge label={d.dosageTag} variant={d.isWarning ? 'danger' : 'teal'} />
              <Badge label={d.instructionTag} variant="surface" />
            </View>
          </View>
        )) : (
          <EmptyState
            icon="document-text-outline"
            title="Chưa có toa thuốc điện tử"
            description="Toa thuốc sẽ xuất hiện sau khi bác sĩ hoàn thành bệnh án và kê đơn."
          />
        )}

        <AppButton
          title="Chia sẻ / Xuất đơn thuốc"
          variant="outline"
          size="lg"
          leftIcon="share-social-outline"
          onPress={() => sharePrescription(prescriptions, diagnosisNote)}
          style={{ marginBottom: 10 }}
        />

        <AppButton
          title="Mở lịch nhắc uống thuốc"
          variant="primary"
          size="lg"
          leftIcon="alarm-outline"
          onPress={onOpenMedLog || onBack}
        />
      </ScrollView>
    </View>
  );
};

// ============================================================================
// SCREEN 27: TỦ THUỐC GIA ĐÌNH & THEO DÕI SỐ LƯỢNG THUỐC
// ============================================================================
export const FamilyMedicineCabinetScreen: React.FC<{
  onBack?: () => void;
  onRefillNow?: () => void;
}> = ({ onBack, onRefillNow }) => {
  const { cabinetMeds, addCabinetMedicine, patientProfile } = useAppContext();
  const [filterKey, setFilterKey] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [medName, setMedName] = useState('');
  const [medStock, setMedStock] = useState('');
  const [medExp, setMedExp] = useState('');
  const [medUrgent, setMedUrgent] = useState(false);
  const [nameError, setNameError] = useState('');
  const [stockError, setStockError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const filteredMeds = cabinetMeds.filter((m) => {
    if (filterKey === 'urgent') return m.urgent;
    if (filterKey === 'normal') return !m.urgent;
    return true;
  });
  const urgentMedicine = cabinetMeds.find(medicine => medicine.urgent);

  const handleSaveMedicine = async () => {
    if (!medName.trim()) {
      setNameError('Vui lòng nhập tên thuốc và hàm lượng');
      return;
    }
    if (!medStock.trim()) {
      setStockError('Vui lòng nhập số lượng thuốc hiện có');
      return;
    }
    if (!medExp.trim()) {
      setExpiryError('Vui lòng nhập hạn sử dụng');
      return;
    }
    setNameError('');
    setStockError('');
    setExpiryError('');
    setSaveError('');
    setIsSaving(true);
    try {
      await addCabinetMedicine({
        name: medName.trim(),
        stock: medStock.trim(),
        exp: medExp.trim(),
        urgent: medUrgent,
      });
      setAddedToast(`Đã thêm "${medName.trim()}" vào Tủ thuốc gia đình`);
      setMedName('');
      setMedStock('');
      setMedExp('');
      setShowAddForm(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Chưa lưu được thuốc. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Tủ Thuốc Gia Đình"
        subtitle={`${patientProfile.name} • Quản lý thuốc tại nhà và cảnh báo sắp hết`}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {/* Refill Alert Banner */}
        {!!urgentMedicine && (
          <AnimatedEntry delay={40} direction="up">
            <View style={[styles.alertCard, SHADOWS.sm]}>
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <PulsingDot color={COLORS.error} size={7} />
                  <Badge
                    label="CẢNH BÁO SẮP HẾT THUỐC"
                    variant="danger"
                    icon="alert-circle"
                  />
                </View>
                <Text style={[styles.slotTime, { color: COLORS.error }]}>
                  {urgentMedicine.stock}
                </Text>
              </View>
              <Text style={[styles.cardTitle, { marginTop: 8 }]}>
                {urgentMedicine.name}
              </Text>
              <Text style={styles.subText}>
                Bạn nên đặt lịch tái khám hoặc hỏi ý kiến bác sĩ trước khi mua thêm.
              </Text>
              <AppButton
                title="Nhắn tin hỏi Bác sĩ"
                variant="primary"
                size="md"
                leftIcon="chatbubbles-outline"
                onPress={onRefillNow}
                style={{ marginTop: 10 }}
              />
            </View>
          </AnimatedEntry>
        )}

        <SectionHeader
          title="Thuốc đang lưu trữ trong gia đình"
          actionText={showAddForm ? 'Đóng biểu mẫu' : '+ Thêm thuốc'}
          onActionPress={() => setShowAddForm((prev) => !prev)}
        />

        {showAddForm && (
          <View style={[styles.card, SHADOWS.sm]}>
            <Text style={[styles.cardTitle, { marginBottom: 10 }]}>
              Thêm thuốc mới vào tủ thuốc nhà
            </Text>
            <AppInput
              label="TÊN THUỐC & HÀM LƯỢNG (*)"
              placeholder="VD: Paracetamol 500mg"
              value={medName}
              onChangeText={(val) => {
                setMedName(val);
                if (nameError) setNameError('');
              }}
              error={nameError}
              leftIcon="medkit-outline"
            />
            <Text style={[styles.subText, { marginBottom: 12 }]}>
              Người sử dụng: {patientProfile.name} (Bản thân)
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="SỐ LƯỢNG HIỆN CÓ"
                  placeholder="Còn 20 / 30 viên"
                  value={medStock}
                  onChangeText={(value) => {
                    setMedStock(value);
                    if (stockError) setStockError('');
                  }}
                  error={stockError}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="HẠN SỬ DỤNG"
                  placeholder="HSD: 12/2027"
                  value={medExp}
                  onChangeText={(value) => {
                    setMedExp(value);
                    if (expiryError) setExpiryError('');
                  }}
                  error={expiryError}
                />
              </View>
            </View>
            <SegmentedControl
              variant="chips"
              selectedKey={medUrgent ? 'urgent' : 'normal'}
              onSelect={(k) => setMedUrgent(k === 'urgent')}
              options={[
                { key: 'normal', label: 'Đủ dùng' },
                { key: 'urgent', label: 'Sắp hết (Cần mua thêm)' },
              ]}
              style={{ marginBottom: 12 }}
            />
            {!!saveError && (
              <Text style={{ color: COLORS.error, marginBottom: 10 }}>
                {saveError}
              </Text>
            )}
            <AppButton
              title="Lưu vào Tủ thuốc gia đình"
              variant="primary"
              size="md"
              leftIcon="checkmark-circle-outline"
              onPress={() => void handleSaveMedicine()}
              loading={isSaving}
            />
          </View>
        )}

        <SegmentedControl
          variant="chips"
          selectedKey={filterKey}
          onSelect={setFilterKey}
          options={[
            { key: 'all', label: `Tất cả (${cabinetMeds.length})` },
            {
              key: 'urgent',
              label: `Sắp hết (${cabinetMeds.filter((m) => m.urgent).length})`,
            },
            {
              key: 'normal',
              label: `Đủ dùng (${cabinetMeds.filter((m) => !m.urgent).length})`,
            },
          ]}
          style={{ marginBottom: 12 }}
        />

        {filteredMeds.length > 0 ? (
          filteredMeds.map((med, idx) => (
            <AnimatedEntry key={med.id} delay={40 + idx * 30} direction="up">
              <View style={[styles.card, SHADOWS.sm]}>
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    {med.urgent && <PulsingDot color={COLORS.error} size={6} />}
                    <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
                      {med.name}
                    </Text>
                  </View>
                  <Badge
                    label={med.stock}
                    variant={med.urgent ? 'danger' : 'teal'}
                  />
                </View>
                <Text style={styles.subText} numberOfLines={1}>
                  Người dùng: {med.owner} • {med.exp}
                </Text>
              </View>
            </AnimatedEntry>
          ))
        ) : (
          <EmptyState
            icon="medkit-outline"
            title="Không có thuốc trong danh mục này"
            description="Hiện không có thuốc nào thuộc bộ lọc đã chọn."
          />
        )}
      </ScrollView>
      <ToastBanner
        visible={!!addedToast}
        title="Cập nhật tủ thuốc"
        message={addedToast || ''}
        onDismiss={() => setAddedToast(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollPad: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: {
    ...LAYOUT.card,
  },
  alertCard: {
    backgroundColor: COLORS.errorSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.errorContainer,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: TYPOGRAPHY.caption,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  slotTime: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  dayPill: {
    flex: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    gap: 3,
  },
  dayPillActive: {
    backgroundColor: COLORS.primary,
  },
  dayPillText: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dayPillNum: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  heroCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  whiteSub: {
    fontSize: TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  whiteBody: {
    fontSize: TYPOGRAPHY.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLORS.textOnPrimary,
    marginTop: SPACING.sm,
  },
  noteCallout: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  noteCalloutText: {
    flex: 1,
    fontSize: TYPOGRAPHY.caption,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLORS.textPrimary,
  },
  confirmBtnWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH.min,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  confirmBtnPending: {
    backgroundColor: COLORS.primary,
  },
  confirmBtnTaken: {
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
  },
  confirmBtnText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '700',
  },
});
