import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Linking,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LAYOUT, RADIUS, SHADOWS, SPACING, TOUCH, TYPOGRAPHY } from '../theme';
import {
  DoctorItem,
  BOOKING_DAYS,
  TIME_SLOTS,
  TimeSlotItem,
} from '../data/mockData';
import {
  AppHeader,
  AppButton,
  AppInput,
  DoctorProfileHeaderCard,
  SectionHeader,
  Badge,
  SegmentedControl,
  PatientReviewCard,
  StickyBottomBar,
  StepIndicator,
  BookingDoctorSummaryCard,
  HorizontalDateSelector,
  TimeSlotGrid,
  HospitalMapModal,
  AnimatedEntry,
  PressableScale,
} from '../components';
import { findHospitalForDoctor } from '../utils/mapNavigation';
import { shareDoctorProfile } from '../utils/shareUtils';
import { useAppContext } from '../context/AppContext';
import { calculateBhytBenefit } from '../services/clinicAdmin';
import { CLOUD_MODE } from '../services/supabaseClient';
import { listClinicSlots, toClinicStart } from '../services/clinicCloud';
import { filterFutureBookingSlots, isFutureBookingSlot } from '../utils/bookingSlots';
import {
  hasPatientBookingErrors,
  normalizePatientBookingInfo,
  validatePatientBookingInfo,
  type PatientBookingErrors,
  type PatientBookingField,
  type PatientBookingInfo,
} from '../utils/bookingValidation';

export interface DoctorDetailScreenProps {
  doctor: DoctorItem;
  onBack: () => void;
  onBookSlot: (doctor: DoctorItem) => void;
  onOpenChat?: (doctor: DoctorItem) => void;
}

export const DoctorDetailScreen: React.FC<DoctorDetailScreenProps> = ({
  doctor,
  onBack,
  onBookSlot,
  onOpenChat,
}) => {
  const { doctorReviews, hospitals, appointments, addDoctorReview } = useAppContext();
  const [selectedDay, setSelectedDay] = useState('d2');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const doctorHospital = findHospitalForDoctor(doctor, hospitals);
  const allDocReviews = doctorReviews.filter(
    (r) => r.doctorId === doctor.id && !r.isHidden
  );
  const hasCompletedVisit = appointments.some(
    (a) => a.doctor.id === doctor.id && a.status === 'completed'
  );
  const avgRatingText =
    allDocReviews.length > 0
      ? `${(allDocReviews.reduce((sum, r) => sum + r.rating, 0) / allDocReviews.length).toFixed(1)} / 5 (${allDocReviews.length} lượt đã xác thực)`
      : 'Chưa có đánh giá';

  const filteredDocReviews = allDocReviews.filter((r) => {
    if (reviewFilter === '5star') return r.rating === 5;
    if (reviewFilter === 'recent')
      return r.metaText.includes('Vừa xong') || r.metaText.includes('Đã xác thực') || r.metaText.includes('3 ngày');
    return true;
  });

  const handleSubmitReview = async () => {
    setReviewError('');
    setReviewSuccess('');
    setReviewSaving(true);
    try {
      await addDoctorReview({
        doctorId: doctor.id,
        rating: myRating,
        comment: myComment,
      });
      setMyComment('');
      setReviewSuccess('Cảm ơn bạn! Đánh giá đã được xác thực lượt khám và đăng công khai.');
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Không thể gửi đánh giá.');
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Chi Tiết Bác Sĩ"
        onBack={onBack}
        rightActions={[
          {
            icon: 'share-social-outline',
            onPress: () => shareDoctorProfile(doctor),
          },
          {
            icon: bookmarked ? 'bookmark' : 'bookmark-outline',
            onPress: () => setBookmarked((prev) => !prev),
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        <DoctorProfileHeaderCard
          doctor={doctor}
          style={{ marginBottom: 14 }}
        />

        {/* Work Location Card */}
        <PressableScale
          activeScale={0.98}
          onPress={() => setMapModalVisible(true)}
          style={[styles.card, SHADOWS.sm]}
        >
          <View style={styles.locationRow}>
            <View style={styles.locationIconBox}>
              <Ionicons
                name="business-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={styles.locationTitle}>{doctor.hospital}</Text>
              <Text style={styles.locationSub} numberOfLines={1}>
                {doctor.address}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: COLORS.primary,
                  marginTop: 3,
                }}
              >
                Chạm để xem cổng vào, bãi xe & mở chỉ đường Google Maps ➔
              </Text>
            </View>
            <TouchableOpacity
              style={styles.mapCircleBtn}
              onPress={() => setMapModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Xem bản đồ ${doctor.hospital}`}
              hitSlop={TOUCH.hitSlopSm}
            >
              <Ionicons
                name="navigate"
                size={16}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </PressableScale>

        {/* About & Training Section */}
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Giới thiệu & Đào tạo"
            leftIcon="person-circle-outline"
          />
          <Text style={styles.bioText}>{doctor.bio}</Text>

          <Text style={styles.strengthHeader}>
            Chuyên môn điều trị thế mạnh
          </Text>
          <View style={styles.strengthList}>
            {doctor.strengths.map((st) => (
              <Badge
                key={st}
                label={st}
                variant="surface"
                showDot
                style={{ marginBottom: 6 }}
              />
            ))}
          </View>
        </View>

        {/* Weekly Schedule Section */}
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Lịch khám trong tuần"
            leftIcon="calendar-outline"
          />
          <HorizontalDateSelector
            days={BOOKING_DAYS}
            selectedDayId={selectedDay}
            onSelectDay={setSelectedDay}
            style={{ marginBottom: 12 }}
          />

          <View style={styles.shiftBox}>
            <View style={styles.shiftHeader}>
              <View style={styles.shiftHeaderLeft}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={COLORS.primary}
                />
                <Text style={styles.shiftHeaderTitle}>
                  Khung giờ {BOOKING_DAYS[1].dayLabel} ({BOOKING_DAYS[1].fullDate})
                </Text>
              </View>
              <Text style={styles.shiftHeaderRight}>Ca sáng & Chiều</Text>
            </View>

            <View style={styles.shiftsGrid}>
              <View style={styles.shiftCardItem}>
                <View>
                  <Text style={styles.shiftPeriod}>Buổi sáng</Text>
                  <Text style={styles.shiftHours}>08:00 - 11:30</Text>
                </View>
                <View style={styles.greenDot} />
              </View>
              <View style={styles.shiftCardItem}>
                <View>
                  <Text style={styles.shiftPeriod}>Buổi chiều</Text>
                  <Text style={styles.shiftHours}>13:30 - 17:00</Text>
                </View>
                <View style={styles.greenDot} />
              </View>
            </View>
          </View>
        </View>

        {/* Patient Reviews Section */}
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Đánh giá của bệnh nhân"
            leftIcon="star"
            actionText={avgRatingText}
          />

          <SegmentedControl
            variant="chips"
            selectedKey={reviewFilter}
            onSelect={setReviewFilter}
            options={[
              { key: 'all', label: `Tất cả (${allDocReviews.length})` },
              {
                key: '5star',
                label: `5 sao (${allDocReviews.filter((r) => r.rating === 5).length})`,
              },
              { key: 'recent', label: 'Gần đây' },
            ]}
            style={{ marginBottom: 12 }}
          />

          {filteredDocReviews.length === 0 ? (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color={COLORS.textMuted} />
              <Text style={{ fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' }}>
                Chưa có nhận xét nào đã xác thực cho bác sĩ này.
              </Text>
            </View>
          ) : (
            filteredDocReviews.map((rev, idx) => (
              <PatientReviewCard
                key={rev.id}
                initials={rev.initials}
                initialsBg={
                  idx % 2 === 0
                    ? COLORS.primaryContainer
                    : COLORS.secondaryContainer
                }
                authorName={rev.authorName}
                metaText={`${rev.metaText} • ${rev.rating}★`}
                comment={rev.comment}
              />
            ))
          )}

          {/* Verified Review Submission Gate */}
          <View
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: COLORS.divider,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} />
              <Text style={{ fontSize: TYPOGRAPHY.size.sm, fontWeight: '700', color: COLORS.textPrimary }}>
                Gửi nhận xét về bác sĩ
              </Text>
            </View>

            {!hasCompletedVisit ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: COLORS.surfaceContainerLow,
                  borderRadius: RADIUS.md,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <Text style={{ flex: 1, fontSize: TYPOGRAPHY.size.xs, color: COLORS.textSecondary, lineHeight: 18 }}>
                  Chỉ bệnh nhân đã đặt lịch và hoàn tất lượt khám với {doctor.name} mới có thể gửi bình luận (nhằm tránh bình luận ảo/xấu).
                </Text>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: TYPOGRAPHY.size.xs, color: COLORS.secondary, fontWeight: '600', marginBottom: 8 }}>
                  ✓ Tài khoản của bạn đã hoàn tất khám với bác sĩ này và đủ điều kiện đánh giá.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setMyRating(star)}
                      accessibilityRole="button"
                      accessibilityLabel={`Đánh giá ${star} sao`}
                    >
                      <Ionicons
                        name={star <= myRating ? 'star' : 'star-outline'}
                        size={26}
                        color={star <= myRating ? '#F59E0B' : COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                  <Text style={{ fontSize: TYPOGRAPHY.size.xs, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 4 }}>
                    {myRating}/5 sao
                  </Text>
                </View>

                <AppInput
                  label="Nội dung nhận xét thực tế *"
                  leftIcon="chatbox-ellipses-outline"
                  value={myComment}
                  onChangeText={setMyComment}
                  placeholder="Chia sẻ trải nghiệm khám bệnh, thái độ và chuyên môn của bác sĩ..."
                  multiline
                  error={reviewError || undefined}
                />

                {!!reviewSuccess && (
                  <Text style={{ fontSize: TYPOGRAPHY.size.xs, color: COLORS.secondary, fontWeight: '700', marginBottom: 8 }}>
                    {reviewSuccess}
                  </Text>
                )}

                <AppButton
                  title={reviewSaving ? 'Đang gửi đánh giá...' : 'Gửi đánh giá đã xác thực'}
                  variant="secondary"
                  size="sm"
                  leftIcon="send-outline"
                  loading={reviewSaving}
                  onPress={handleSubmitReview}
                />
              </View>
            )}
          </View>
        </View>

        {/* Clinic Guarantee Badge */}
        <View style={styles.guaranteeRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={COLORS.secondary}
          />
          <Text style={styles.guaranteeText}>
            MediCare Plus bảo lãnh chất lượng chuyên môn & bảo mật bệnh án
          </Text>
        </View>

        {onOpenChat ? (
          <View style={{ marginTop: 12 }}>
            <AppButton
              title={`Chat tư vấn trực tuyến với ${doctor.name}`}
              variant="tonal"
              size="md"
              leftIcon="chatbubbles-outline"
              onPress={() => onOpenChat(doctor)}
            />
          </View>
        ) : null}
      </ScrollView>

      <StickyBottomBar
        topLabel="Phí tư vấn khám"
        priceValue={doctor.fee}
        buttonTitle="Đặt lịch khám"
        onButtonPress={() => onBookSlot(doctor)}
      />

      <HospitalMapModal
        visible={mapModalVisible}
        initialHospital={doctorHospital}
        onClose={() => setMapModalVisible(false)}
        onBookAtHospital={() => onBookSlot(doctor)}
      />
    </View>
  );
};

export interface BookingSlotScreenProps {
  doctor: DoctorItem;
  onBack: () => void;
  onConfirmBooking: (details?: {
    doctor: DoctorItem;
    day: any;
    slot: TimeSlotItem;
    consultMode: string;
  }) => void;
}

export const BookingSlotScreen: React.FC<BookingSlotScreenProps> = ({
  doctor,
  onBack,
  onConfirmBooking,
}) => {
  const { doctorSchedules, appointments, cloudProfile } = useAppContext();
  const [consultMode, setConsultMode] = useState('clinic');
  const [selectedDayId, setSelectedDayId] = useState('d2');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotItem>(TIME_SLOTS[3]);
  const [nowMs, setNowMs] = useState(Date.now);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const updateClock = () => {
      const now = Date.now();
      setNowMs(now);
      timer = setTimeout(updateClock, 60_000 - (now % 60_000));
    };
    updateClock();
    return () => clearTimeout(timer);
  }, []);

  const currentDay =
    BOOKING_DAYS.find((d) => d.id === selectedDayId) || BOOKING_DAYS[1];

  const [remoteSlots, setRemoteSlots] = useState<TimeSlotItem[]>([]);
  const [loadedSlotKey, setLoadedSlotKey] = useState('');
  const [slotError, setSlotError] = useState('');
  const slotKey = `${doctor.id}:${currentDay.fullDate}`;
  const slotsReady = !CLOUD_MODE || loadedSlotKey === slotKey;

  const isSlotTakenByMyAppointment = (slot: TimeSlotItem): boolean => {
    const slotMs = new Date(toClinicStart(currentDay, slot)).getTime();
    return appointments.some((apt) => {
      if (apt.status !== 'upcoming') return false;
      if (CLOUD_MODE && cloudProfile?.id && apt.patientId && apt.patientId !== cloudProfile.id) {
        return false;
      }
      if (apt.startsAt) {
        return new Date(apt.startsAt).getTime() === slotMs;
      }
      return apt.dateLabel.includes(currentDay.fullDate) && apt.dateLabel.includes(slot.time);
    });
  };

  const isSlotTakenByDoctorLocally = (slot: TimeSlotItem): boolean => {
    const slotMs = new Date(toClinicStart(currentDay, slot)).getTime();
    return appointments.some((apt) => {
      if (apt.status !== 'upcoming' || apt.doctor.id !== doctor.id) return false;
      if (apt.startsAt) {
        return new Date(apt.startsAt).getTime() === slotMs;
      }
      return apt.dateLabel.includes(currentDay.fullDate) && apt.dateLabel.includes(slot.time);
    });
  };

  const [dPart, mPart, yPart] = currentDay.fullDate.split('/');
  const isoDay = dPart && mPart && yPart ? `${yPart}-${mPart.padStart(2, '0')}-${dPart.padStart(2, '0')}` : '';
  const dayShifts = doctorSchedules.filter(
    (s) => s.doctorId === doctor.id && s.workDate === isoDay
  );
  const demoShiftAwareSlots: TimeSlotItem[] = (
    dayShifts.length === 0
      ? TIME_SLOTS
      : TIME_SLOTS.map((slot) => {
          const allowed = dayShifts.some(
            (s) =>
              s.active &&
              (s.shift === 'full_day' ||
                (s.shift === 'morning' && slot.period === 'morning') ||
                (s.shift === 'afternoon' && slot.period === 'afternoon'))
          );
          return allowed ? slot : { ...slot, status: 'booked' as const };
        })
  ).map((slot) =>
    slot.status === 'booked' || isSlotTakenByDoctorLocally(slot) || isSlotTakenByMyAppointment(slot)
      ? { ...slot, status: 'booked' as const }
      : slot
  );

  const daySlots: TimeSlotItem[] = CLOUD_MODE
    ? slotsReady
      ? remoteSlots.map((slot) =>
          slot.status === 'booked' || isSlotTakenByMyAppointment(slot)
            ? { ...slot, status: 'booked' as const }
            : slot
        )
      : TIME_SLOTS.map((slot) => ({ ...slot, status: 'booked' as const }))
    : demoShiftAwareSlots;

  const visibleSlots = filterFutureBookingSlots(currentDay, daySlots, nowMs);
  const hasPersonalConflictToday = visibleSlots.some(isSlotTakenByMyAppointment);
  const firstOpenSlot = visibleSlots.find((slot) => slot.status !== 'booked') || null;
  const effectiveSlot: TimeSlotItem | null = visibleSlots.some(
    (slot) => slot.id === selectedSlot.id && slot.status !== 'booked'
  )
    ? selectedSlot
    : firstOpenSlot;
  const selectedSlotAvailable = Boolean(effectiveSlot);

  useEffect(() => {
    if (!CLOUD_MODE) return;
    let mounted = true;
    void listClinicSlots(doctor.id, currentDay).then(rows => {
      if (!mounted) return;
      setRemoteSlots(TIME_SLOTS.map(slot => ({
        ...slot, status: rows.some(row => new Date(row.starts_at).getTime() === new Date(toClinicStart(currentDay, slot)).getTime() && !row.is_booked) ? 'available' : 'booked',
      })));
      setLoadedSlotKey(`${doctor.id}:${currentDay.fullDate}`);
      setSlotError('');
    }).catch(error => { if (mounted) setSlotError(error instanceof Error ? error.message : 'Không tải được lịch trống.'); });
    return () => { mounted = false; };
  }, [doctor.id, currentDay]);

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Chọn Thời Gian Khám"
        onBack={onBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        <StepIndicator
          steps={['Chọn bác sĩ', 'Chọn lịch', 'Thanh toán']}
          currentStep={1}
        />

        <BookingDoctorSummaryCard
          doctor={doctor}
          style={{ marginVertical: 14 }}
        />

        <SegmentedControl
          variant="box"
          selectedKey={consultMode}
          onSelect={setConsultMode}
          options={[
            {
              key: 'clinic',
              label: 'Khám tại bệnh viện',
              icon: 'add-circle-outline',
            },
            {
              key: 'chat',
              label: 'Tư vấn Chat trực tuyến',
              icon: 'chatbubbles-outline',
            },
          ]}
          style={{ marginBottom: 18 }}
        />

        <SectionHeader
          title="Chọn ngày khám"
          badgeText={`Tháng ${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`}
          badgeVariant="blue"
          badgeIcon="calendar-outline"
        />
        <HorizontalDateSelector
          days={CLOUD_MODE ? BOOKING_DAYS.filter(day => day.id !== 'd1').map(day => ({ ...day, isFull: false })) : BOOKING_DAYS}
          selectedDayId={selectedDayId}
          onSelectDay={(dayId) => { setSelectedDayId(dayId); setSlotError(''); }}
          showAvailabilityCounts={!CLOUD_MODE}
          style={{ marginBottom: 16 }}
        />

        {visibleSlots.length > 0 ? (
          <TimeSlotGrid
            slots={visibleSlots}
            selectedSlotId={effectiveSlot?.id || ''}
            onSelectSlot={setSelectedSlot}
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>
            Ngày này không còn khung giờ khám sắp tới. Vui lòng chọn ngày khác.
          </Text>
        )}
        {hasPersonalConflictToday ? (
          <Text style={{ fontSize: 12, color: COLORS.warning, marginBottom: 12, fontWeight: '600' }}>
            • Các khung giờ bạn đã có lịch hẹn (kể cả với bác sĩ khác) được tự động khóa để tránh đặt trùng giờ.
          </Text>
        ) : null}
        {slotError ? <Text accessibilityRole="alert" style={{ color: COLORS.error }}>{slotError}</Text> : null}

        {/* Insurance & Essential Note Box */}
        <View style={styles.insuranceNoteBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={COLORS.primary}
            style={{ marginTop: 2 }}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.insuranceNoteTitle}>
              Bảo hiểm Y tế & Thủ tục
            </Text>
            <Text style={styles.insuranceNoteDesc}>
              Áp dụng BHYT đúng tuyến hoặc thông tuyến theo quy định. Vui lòng
              mang theo <Text style={{ fontWeight: '700' }}>CCCD gắn chip</Text>{' '}
              hoặc ứng dụng <Text style={{ fontWeight: '700' }}>VssID</Text> khi
              đến khám.
            </Text>
          </View>
        </View>
      </ScrollView>

      <StickyBottomBar
        topLabel={
          effectiveSlot
            ? `${effectiveSlot.time}, ${currentDay.dayLabel} (${currentDay.fullDate})`
            : `Chưa có khung giờ trống (${currentDay.fullDate})`
        }
        topLabelIcon="time-outline"
        priceLabel="Tạm tính:"
        priceValue={doctor.fee}
        buttonTitle={selectedSlotAvailable ? 'Tiếp tục' : 'Hết khung giờ trống'}
        disabled={!slotsReady || !selectedSlotAvailable}
        loading={CLOUD_MODE && !slotsReady && !slotError}
        onButtonPress={() => {
          if (!effectiveSlot) return;
          const now = Date.now();
          if (!isFutureBookingSlot(currentDay, effectiveSlot, now)) {
            setNowMs(now);
            return;
          }
          onConfirmBooking({
            doctor,
            day: currentDay,
            slot: effectiveSlot,
            consultMode,
          });
        }}
      />
    </View>
  );
};

// ============================================================================
// SCREEN: XÁC NHẬN & THANH TOÁN ĐA PHƯƠNG THỨC (PAYMENT STEP)
// ============================================================================
export type PaymentMethodType = 'at_clinic' | 'at_clinic_bhyt' | 'vietqr' | 'vnpay' | 'momo';

export interface BookingPaymentScreenProps {
  doctor: DoctorItem;
  day?: any;
  slot?: TimeSlotItem;
  consultMode?: string;
  patient?: {
    name: string;
    meta: string;
    bhytCode?: string;
    phone?: string;
  };
  onBack: () => void;
  onPaymentSuccess: (
    method: PaymentMethodType,
    patientInfo: PatientBookingInfo
  ) => void | Promise<void>;
}

export const BookingPaymentScreen: React.FC<BookingPaymentScreenProps> = ({
  doctor,
  day,
  slot,
  consultMode = 'clinic',
  patient,
  onBack,
  onPaymentSuccess,
}) => {
  const { patientProfile, cloudProfile, bhytConfigs, familyMembers } = useAppContext();
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodType>('at_clinic_bhyt');
  const [submitting, setSubmitting] = useState(false);
  const [payOsModalVisible, setPayOsModalVisible] = useState(false);
  const [payOsLoading, setPayOsLoading] = useState(false);
  const [payOsData, setPayOsData] = useState<any>(null);
  const [payOsPaid, setPayOsPaid] = useState(false);
  const pollTimerRef = useRef<any>(null);
  const [activeBhytCode, setActiveBhytCode] = useState<string>(
    patient?.bhytCode ?? patientProfile.bhytCode ?? ''
  );
  const [patientInfo, setPatientInfo] = useState<PatientBookingInfo>({
    fullName: patient?.name || patientProfile.name || '',
    phone: patient?.phone || patientProfile.phone || '',
    email: cloudProfile?.email || 'patient@example.com',
    symptoms: 'Khám sức khỏe theo chuyên khoa',
  });
  const [patientErrors, setPatientErrors] = useState<PatientBookingErrors>({});

  const currentDay = day || BOOKING_DAYS[1];
  const currentSlot = slot || TIME_SLOTS[3];
  const isAtClinic = selectedMethod === 'at_clinic_bhyt';
  const bhytBenefit = calculateBhytBenefit(
    doctor.feeNumeric,
    activeBhytCode,
    bhytConfigs,
    true
  );
  const formatCurrency = (val: number) =>
    `${val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;

  const updatePatientField = (field: PatientBookingField, value: string) => {
    setPatientInfo((current) => ({ ...current, [field]: value }));
    if (patientErrors[field]) {
      setPatientErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const paymentOptions = [
    {
      id: 'at_clinic_bhyt' as PaymentMethodType,
      title: 'Thanh toán tại viện bằng BHYT',
      sub: 'Xuất trình hồ sơ tại quầy để xác minh quyền lợi và chi phí thực tế',
      badge: 'Khuyên dùng có BHYT',
      badgeVariant: 'teal' as const,
      icon: 'business-outline' as const,
    },
    {
      id: 'vietqr' as PaymentMethodType,
      title: 'Chuyển khoản VietQR 24/7 (PayOS)',
      sub: 'Quét mã VietQR bằng mọi app ngân hàng (Tự động xác nhận 2s)',
      badge: 'Tự động 24/7',
      badgeVariant: 'blue' as const,
      icon: 'qr-code-outline' as const,
    },
    {
      id: 'vnpay' as PaymentMethodType,
      title: 'Cổng thanh toán VNPAY',
      sub: 'Thẻ ATM nội địa, Internet Banking, Visa / Mastercard',
      badge: 'Bảo mật PCI-DSS',
      badgeVariant: 'surface' as const,
      icon: 'card-outline' as const,
    },
    {
      id: 'momo' as PaymentMethodType,
      title: 'Ví điện tử MoMo',
      sub: 'Thanh toán một chạm qua ví điện tử MoMo tiện lợi',
      badge: 'Tích điểm Smart',
      badgeVariant: 'warning' as const,
      icon: 'wallet-outline' as const,
    },
  ].filter(option => !CLOUD_MODE || option.id === 'at_clinic_bhyt' || option.id === 'vietqr');

  const submitBooking = async (method: PaymentMethodType) => {
    if (submitting || payOsLoading || (CLOUD_MODE && (!day || !slot))) return;
    if (!isFutureBookingSlot(currentDay, currentSlot, Date.now())) {
      const message = 'Giờ khám đã qua. Vui lòng quay lại và chọn giờ khác.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(message);
      else Alert.alert('Giờ khám không còn khả dụng', message);
      return;
    }
    const errors = validatePatientBookingInfo(patientInfo);
    setPatientErrors(errors);
    if (hasPatientBookingErrors(errors)) {
      const firstErr = Object.values(errors).find(Boolean);
      const msg = `Vui lòng hoàn tất thông tin: ${firstErr}`;
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert('Chưa đủ thông tin', msg);
      }
      return;
    }
    const normalized = normalizePatientBookingInfo(patientInfo);
    setPatientInfo(normalized);

    if (method === 'vietqr') {
      setPayOsLoading(true);
      setPayOsPaid(false);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const serverUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${serverUrl}/payments/create-payment-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            amount: 2000,
            description: `MEDICARE ${doctor.name.slice(0, 10)}`,
            patientName: normalized.fullName,
            patientPhone: normalized.phone,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setPayOsData(json.data);
          setPayOsModalVisible(true);
          return;
        }
      } catch {
        // Fallback sang VietQR ngân hàng trực tiếp khi dùng APK không nối localhost:5000
      } finally {
        clearTimeout(timeout);
        setPayOsLoading(false);
      }

      const message = 'Chưa kết nối được dịch vụ thanh toán. Vui lòng thử lại hoặc chọn thanh toán tại viện.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(message);
      else Alert.alert('Chưa thể thanh toán', message);
      return;
    }

    setSubmitting(true);
    try { await onPaymentSuccess(method, normalized); }
    finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (!payOsModalVisible || !payOsData?.orderCode || payOsPaid) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const serverUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${serverUrl}/payments/status/${payOsData.orderCode}`);
        const json = await res.json();
        if (json.success && json.data?.status === 'PAID') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setPayOsPaid(true);
          setTimeout(async () => {
            setPayOsModalVisible(false);
            const normalized = normalizePatientBookingInfo(patientInfo);
            await onPaymentSuccess('vietqr', normalized);
          }, 1500);
        }
      } catch {
        // Polling retry
      }
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [payOsModalVisible, payOsData, payOsPaid, patientInfo, onPaymentSuccess]);

  const patientForm = (<AnimatedEntry delay={70} direction="up">
          <View style={[styles.card, SHADOWS.sm, { marginBottom: 16 }]}>
            <SectionHeader
              title="Thông tin bệnh nhân"
              leftIcon="person-outline"
            />
            <Text style={styles.patientFormHint}>
              Các trường có dấu * là bắt buộc. Thông tin này được dùng để liên hệ và hỗ trợ bác sĩ chuẩn bị cho buổi khám.
            </Text>
            {familyMembers.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={[styles.patientFormHint, { fontWeight: '700', marginBottom: 6 }]}>
                  Chọn hồ sơ người khám (Tự động điền & tính BHYT):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setPatientInfo((curr) => ({
                          ...curr,
                          fullName: patientProfile.name,
                          phone: patientProfile.phone || curr.phone,
                        }));
                        setActiveBhytCode(patientProfile.bhytCode || '');
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor:
                          patientInfo.fullName === patientProfile.name
                            ? COLORS.primary
                            : COLORS.border,
                        backgroundColor:
                          patientInfo.fullName === patientProfile.name
                            ? COLORS.tintBlue
                            : COLORS.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color:
                            patientInfo.fullName === patientProfile.name
                              ? COLORS.primary
                              : COLORS.textSecondary,
                        }}
                      >
                        {patientProfile.name} (Bản thân)
                      </Text>
                    </TouchableOpacity>
                    {familyMembers.map((mem) => {
                      const selected = patientInfo.fullName === mem.name;
                      return (
                        <TouchableOpacity
                          key={mem.id}
                          onPress={() => {
                            setPatientInfo((curr) => ({
                              ...curr,
                              fullName: mem.name,
                              phone: mem.phone || patientProfile.phone || curr.phone,
                            }));
                            setActiveBhytCode(mem.bhyt || '');
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: selected ? COLORS.primary : COLORS.border,
                            backgroundColor: selected ? COLORS.tintBlue : COLORS.surface,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: selected ? COLORS.primary : COLORS.textSecondary,
                            }}
                          >
                            {mem.name} ({mem.rawRelation || mem.relation.split('•')[0].trim()})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : null}
            <AppInput
              label="Họ và tên *"
              leftIcon="person-outline"
              value={patientInfo.fullName}
              onChangeText={(value) => updatePatientField('fullName', value)}
              placeholder="Nguyễn Văn An"
              autoCapitalize="words"
              autoComplete="name"
              maxLength={160}
              error={patientErrors.fullName}
            />
            <AppInput
              label="Số điện thoại *"
              leftIcon="call-outline"
              value={patientInfo.phone}
              onChangeText={(value) => updatePatientField('phone', value)}
              placeholder="0912345678"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={14}
              error={patientErrors.phone}
            />
            <AppInput
              label="Email *"
              leftIcon="mail-outline"
              value={patientInfo.email}
              onChangeText={(value) => updatePatientField('email', value)}
              placeholder="benhnhan@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              maxLength={254}
              error={patientErrors.email}
            />
            <AppInput
              label="Triệu chứng hoặc lý do khám *"
              leftIcon="document-text-outline"
              value={patientInfo.symptoms}
              onChangeText={(value) => updatePatientField('symptoms', value)}
              placeholder="Mô tả triệu chứng, thời gian xuất hiện và mức độ hiện tại..."
              multiline
              numberOfLines={4}
              maxLength={1000}
              error={patientErrors.symptoms}
            />
            <Text style={styles.characterCount}>
              {patientInfo.symptoms.length}/1000 ký tự
            </Text>
          </View>
        </AnimatedEntry>);

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Xác Nhận & Thanh Toán"
        subtitle="Bước cuối: Hoàn tất đặt lịch khám"
        onBack={onBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        <StepIndicator
          steps={['Chọn bác sĩ', 'Chọn lịch', 'Thanh toán']}
          currentStep={2}
        />

        {/* 1. Appointment Summary Overview Card */}
        <AnimatedEntry delay={40} direction="up">
          <View style={[styles.card, SHADOWS.sm, { marginVertical: 14 }]}>
            <View style={styles.paymentHeaderRow}>
              <View style={styles.paymentDocIconBox}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.paymentDocName} numberOfLines={1}>
                  {doctor.name}
                </Text>
                <Text style={styles.paymentDocSub} numberOfLines={1}>
                  {doctor.degree} • {doctor.hospital}
                </Text>
              </View>
              <Badge
                label={consultMode === 'chat' ? 'Tư vấn Chat' : 'Khám tại viện'}
                variant={consultMode === 'chat' ? 'blue' : 'teal'}
              />
            </View>

            <View style={styles.paymentDivider} />

            <View style={styles.paymentInfoGrid}>
              <View style={styles.paymentInfoCol}>
                <Text style={styles.paymentInfoCap}>THỜI GIAN KHÁM</Text>
                <Text style={styles.paymentInfoVal}>{currentSlot.time}</Text>
                <Text style={styles.paymentInfoSub}>
                  {currentDay.dayLabel}, {currentDay.fullDate}
                </Text>
              </View>
              <View style={styles.paymentInfoCol}>
                <Text style={styles.paymentInfoCap}>BỆNH NHÂN</Text>
                <Text style={styles.paymentInfoVal} numberOfLines={1}>
                  {patientInfo.fullName || 'Chưa nhập thông tin'}
                </Text>
                <Text style={styles.paymentInfoSub} numberOfLines={1}>
                  {patient?.meta ||
                    `BHYT: ${(patientProfile.bhytCode || 'Chưa cập nhật').split(' ')[0]} • ${patientProfile.gender}`}
                </Text>
              </View>
            </View>
          </View>
        </AnimatedEntry>

        {patientForm}

        {/* 3. Fee Calculation Breakdown */}
        <AnimatedEntry delay={90} direction="up">
          <View style={[styles.card, SHADOWS.sm, { marginBottom: 16 }]}>
            <SectionHeader
              title="Chi phí tham khảo"
              leftIcon="receipt-outline"
            />

            <View style={styles.feeLineRow}>
              <Text style={styles.feeLineLabel}>Phí khám chuyên khoa:</Text>
              <Text style={styles.feeLineVal}>{doctor.fee}</Text>
            </View>

            <View style={styles.feeLineRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.feeLineLabel}>Ước tính BHYT:</Text>
                <Badge
                  label={
                    bhytBenefit.matchedRule
                      ? `Cấu hình ${bhytBenefit.matchedRule.prefixCode} (${bhytBenefit.rate}%)`
                      : 'Đối soát tại quầy'
                  }
                  variant="teal"
                />
              </View>
              <Text style={[styles.feeLineVal, { color: COLORS.secondary }]}>
                {isAtClinic
                  ? bhytBenefit.matchedRule
                    ? `-${formatCurrency(bhytBenefit.discountAmount)}`
                    : 'Chưa xác định'
                  : 'Chờ hoàn tiền'}
              </Text>
            </View>

            <View style={styles.feeLineRow}>
              <Text style={styles.feeLineLabel}>Tiện ích đặt lịch số & AI Triage:</Text>
              <Text style={[styles.feeLineVal, { color: COLORS.secondary }]}>
                Miễn phí (0 đ)
              </Text>
            </View>

            <View style={styles.paymentDivider} />

            <View style={[styles.feeTotalRow, { flexWrap: 'wrap', gap: 4 }]}>
              <Text style={styles.feeTotalLabel}>Phí khám niêm yết:</Text>
              <Text style={[styles.feeTotalVal, { flexShrink: 1, textAlign: 'right' }]}>
                {doctor.fee}
              </Text>
            </View>
            <Text style={styles.paymentInfoSub}>Chưa đối soát BHYT. Ước tính theo cấu hình đúng tuyến; cơ sở y tế đối soát chi phí tại quầy.</Text>
          </View>
        </AnimatedEntry>

        {/* 4. Multi-Option Payment Selector */}
        <AnimatedEntry delay={140} direction="up">
          <SectionHeader title="Chọn phương thức thanh toán" />

          <View style={{ gap: 10, marginBottom: 16 }} accessibilityRole="radiogroup">
            {paymentOptions.map((opt) => {
              const isSelected = selectedMethod === opt.id;
              return (
                <PressableScale
                  key={opt.id}
                  activeScale={0.97}
                  onPress={() => setSelectedMethod(opt.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${opt.title}. ${opt.sub}`}
                  accessibilityState={{ selected: isSelected, checked: isSelected }}
                >
                  <View
                    style={[
                      styles.paymentMethodCard,
                      isSelected && styles.paymentMethodCardActive,
                      SHADOWS.sm,
                    ]}
                  >
                    <View style={styles.paymentMethodLeft}>
                      <View
                        style={[
                          styles.methodRadioCircle,
                          isSelected && styles.methodRadioCircleActive,
                        ]}
                      >
                        {isSelected && <View style={styles.methodRadioDot} />}
                      </View>
                      <View
                        style={[
                          styles.methodIconBox,
                          isSelected && styles.methodIconBoxActive,
                        ]}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={20}
                          color={isSelected ? COLORS.primary : COLORS.textSecondary}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[
                              styles.methodTitle,
                              isSelected && styles.methodTitleActive,
                            ]}
                            numberOfLines={1}
                          >
                            {opt.title}
                          </Text>
                        </View>
                        <Text style={styles.methodSub} numberOfLines={2}>
                          {opt.sub}
                        </Text>
                      </View>
                    </View>
                    <Badge label={opt.badge} variant={opt.badgeVariant} />
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </AnimatedEntry>

        {/* 5. Dynamic Interactive Instructions Box */}
        <AnimatedEntry delay={190} direction="up">
          {isAtClinic ? (
            <View style={[styles.clinicInstructionBox, SHADOWS.sm]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.secondary} />
                <Text style={styles.clinicInstructionTitle}>
                  Chính sách BHYT & Hướng dẫn tại viện
                </Text>
              </View>
              <Text style={styles.clinicInstructionText}>
                • Bạn <Text style={{ fontWeight: '700' }}>không cần thanh toán trước</Text> qua ứng dụng.{'\n'}
                • Giữ chỗ và nhận số thứ tự (STT) miễn phí ngay sau bước này.{'\n'}
                • Khi đến bệnh viện, chỉ cần quét mã QR tại Kiosk tiếp đón và xuất trình <Text style={{ fontWeight: '700' }}>CCCD gắn chip</Text> hoặc ứng dụng <Text style={{ fontWeight: '700' }}>VssID</Text> để trừ tiền trực tiếp.
              </Text>
            </View>
          ) : selectedMethod === 'vietqr' ? (
            <View style={[styles.onlineTransferBox, SHADOWS.sm]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
                <Text style={styles.clinicInstructionTitle}>
                  Thông tin chuyển khoản VietQR 24/7
                </Text>
              </View>
              <Text style={styles.clinicInstructionText}>
                Nhấn “Quét mã VietQR (PayOS)” để nhận mã QR, tài khoản thụ hưởng và nội dung chuyển khoản của giao dịch. Lịch chỉ được xác nhận sau khi dịch vụ thanh toán báo thành công.
              </Text>
            </View>
          ) : (
            <View style={[styles.onlineTransferBox, SHADOWS.sm]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
                <Text style={styles.clinicInstructionTitle}>
                  Bảo mật giao dịch y tế chuẩn PCI-DSS
                </Text>
              </View>
              <Text style={[styles.clinicInstructionText, { marginTop: 6 }]}>
                Hệ thống kết nối trực tiếp với cổng thanh toán bảo mật. Hóa đơn điện tử VAT chuẩn Bộ Tài chính sẽ được gửi ngay vào hồ sơ sau khi hoàn tất.
              </Text>
            </View>
          )}
        </AnimatedEntry>
      </ScrollView>

      {/* 6. Sticky Bottom Action Bar */}
      <StickyBottomBar
        topLabel={isAtClinic ? 'Thanh toán tại viện với BHYT' : selectedMethod === 'vietqr' ? 'Cổng thanh toán: VIETQR (PAYOS)' : `Cổng thanh toán: ${selectedMethod.toUpperCase()}`}
        topLabelIcon={isAtClinic ? 'business-outline' : 'qr-code-outline'}
        priceLabel="Cần thanh toán:"
        priceValue={isAtClinic ? '0 đ' : selectedMethod === 'vietqr' ? '2.000 đ' : doctor.fee}
        buttonTitle={isAtClinic ? 'Xác nhận đặt lịch' : selectedMethod === 'vietqr' ? 'Quét mã VietQR (PayOS)' : 'Thanh toán ngay'}
        disabled={submitting || payOsLoading}
        loading={submitting || payOsLoading}
        onButtonPress={() => submitBooking(selectedMethod)}
      />

      {/* PayOS VietQR Modal */}
      <Modal
        visible={payOsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!payOsPaid) {
            setPayOsModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.payOsModalContainer}>
            {/* Header */}
            <View style={styles.payOsModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="qr-code-outline" size={24} color={COLORS.primary} />
                <Text style={styles.payOsModalTitle}>Thanh toán VietQR 24/7 (PayOS)</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPayOsModalVisible(false)}
                disabled={payOsPaid}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {payOsPaid ? (
              <View style={styles.payOsSuccessBox}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                <Text style={styles.payOsSuccessTitle}>Thanh toán thành công!</Text>
                <Text style={styles.payOsSuccessSub}>
                  Hệ thống PayOS đã xác nhận chuyển khoản {Number(payOsData?.amount || 2000).toLocaleString('vi-VN')} đ. Đang chuyển đến phiếu hẹn điện tử...
                </Text>
                <ActivityIndicator size="small" color={COLORS.success} style={{ marginTop: 12 }} />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                <Text style={styles.payOsInstruction}>
                  Mở app ngân hàng bất kỳ (MB, Vietcombank, Techcombank, MoMo...) và quét mã bên dưới để thanh toán tự động:
                </Text>

                {/* QR Code */}
                {payOsData?.qrCode ? (
                  <View style={styles.payOsQrWrapper}>
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
                          payOsData.qrCode
                        )}`,
                      }}
                      style={{ width: 210, height: 210, borderRadius: 10 }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
                )}

                {/* Bank details card */}
                <View style={styles.payOsBankCard}>
                  <View style={styles.payOsInfoRow}>
                    <Text style={styles.payOsLabel}>Ngân hàng thụ hưởng:</Text>
                    <Text style={styles.payOsValue}>
                      {payOsData?.bankName || (payOsData?.bin === '970422' ? 'MB Bank (Quân Đội)' : 'MB Bank')}
                    </Text>
                  </View>
                  <View style={styles.payOsInfoRow}>
                    <Text style={styles.payOsLabel}>Chủ tài khoản:</Text>
                    <Text style={[styles.payOsValue, { fontWeight: '700' }]}>
                      {payOsData?.accountName || 'MEDICARE PLUS'}
                    </Text>
                  </View>
                  <View style={styles.payOsInfoRow}>
                    <Text style={styles.payOsLabel}>Số tài khoản:</Text>
                    <Text style={[styles.payOsValue, { color: COLORS.primary, fontWeight: '700' }]}>
                      {payOsData?.accountNumber || 'VQRQANUZS2008'}
                    </Text>
                  </View>
                  <View style={styles.payOsInfoRow}>
                    <Text style={styles.payOsLabel}>Số tiền chuyển:</Text>
                    <Text style={[styles.payOsValue, { color: '#E11D48', fontWeight: '800', fontSize: 16 }]}>
                      {Number(payOsData?.amount || 2000).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                  <View style={styles.payOsInfoRow}>
                    <Text style={styles.payOsLabel}>Nội dung chuyển khoản:</Text>
                    <Text style={[styles.payOsValue, { fontWeight: '700' }]}>
                      {payOsData?.description || 'KHAM MEDICARE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.payOsWaitingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.payOsWaitingText}>
                    Đang chờ hệ thống ngân hàng xác nhận chuyển khoản...
                  </Text>
                </View>

                {/* Open PayOS Web checkout button */}
                {payOsData?.checkoutUrl ? (
                  <TouchableOpacity
                    style={styles.payOsWebBtn}
                    onPress={() => {
                      if (payOsData.checkoutUrl) {
                        void Linking.openURL(payOsData.checkoutUrl);
                      }
                    }}
                  >
                    <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.payOsWebBtnText}>Mở Cổng thanh toán PayOS (Trình duyệt)</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={{ marginTop: 12, padding: 8 }}
                  onPress={() => setPayOsModalVisible(false)}
                >
                  <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Đóng / Chọn phương thức khác</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollPad: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    ...LAYOUT.card,
  },
  patientFormHint: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    marginBottom: SPACING.md,
  },
  characterCount: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.caption,
    textAlign: 'right',
    marginTop: -SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  locationSub: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mapCircleBtn: {
    width: TOUCH.min,
    height: TOUCH.min,
    borderRadius: TOUCH.min / 2,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioText: {
    fontSize: TYPOGRAPHY.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  strengthHeader: {
    fontSize: TYPOGRAPHY.bodySm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  strengthList: {
    flexDirection: 'column',
  },
  shiftBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  shiftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  shiftHeaderTitle: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  shiftHeaderRight: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  shiftsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  shiftCardItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  shiftPeriod: {
    fontSize: TYPOGRAPHY.micro,
    color: COLORS.textSecondary,
  },
  shiftHours: {
    fontSize: TYPOGRAPHY.bodySm,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  guaranteeText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  insuranceNoteBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  insuranceNoteTitle: {
    fontSize: TYPOGRAPHY.bodySm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  insuranceNoteDesc: {
    fontSize: TYPOGRAPHY.caption,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLORS.textSecondary,
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDocIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDocName: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  paymentDocSub: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: SPACING.md,
  },
  paymentInfoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  paymentInfoCol: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  paymentInfoCap: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  paymentInfoVal: {
    fontSize: TYPOGRAPHY.bodySm,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentInfoSub: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  feeLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  feeLineLabel: {
    fontSize: TYPOGRAPHY.bodySm,
    color: COLORS.textSecondary,
  },
  feeLineVal: {
    fontSize: TYPOGRAPHY.bodySm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  feeTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  feeTotalLabel: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  feeTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
  },
  paymentMethodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodRadioCircleActive: {
    borderColor: COLORS.primary,
  },
  methodRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  methodIconBoxActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  methodTitle: {
    fontSize: TYPOGRAPHY.bodySm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  methodTitleActive: {
    color: COLORS.primary,
  },
  methodSub: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clinicInstructionBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: SPACING.lg,
  },
  clinicInstructionTitle: {
    fontSize: TYPOGRAPHY.bodySm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clinicInstructionText: {
    fontSize: TYPOGRAPHY.caption,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  onlineTransferBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: SPACING.lg,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  qrMockThumbnail: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBankName: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  qrAccountNum: {
    fontSize: TYPOGRAPHY.bodySm,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  qrOwnerName: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  qrMemo: {
    fontSize: TYPOGRAPHY.micro,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  payOsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  payOsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: 12,
    marginBottom: 12,
    width: '100%',
  },
  payOsModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  payOsInstruction: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 18,
  },
  payOsQrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  payOsBankCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  payOsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payOsLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  payOsValue: {
    fontSize: 13,
    color: '#0F172A',
  },
  payOsWaitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  payOsWaitingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  payOsWebBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  payOsWebBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  payOsSuccessBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  payOsSuccessTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.success,
    marginTop: 14,
    marginBottom: 6,
  },
  payOsSuccessSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

