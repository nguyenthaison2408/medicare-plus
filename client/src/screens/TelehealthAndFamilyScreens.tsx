import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CLOUD_MODE } from '../services/supabaseClient';
import { COLORS, GRADIENTS, LAYOUT, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../theme';
import {
  DOCTORS,
  DoctorItem,
  PATIENT_PROFILE,
  formatRelativeDate,
} from '../data/mockData';
import { useAppContext, FamilyMemberItem } from '../context/AppContext';
import {
  fetchConsultMessagesCloud,
  resolveConsultDoctor,
  sendConsultMessageCloud,
  subscribeConsultMessagesCloud,
  type ConsultMessageItem,
} from '../services/clinicChat';
import { openGoogleMapsDirections } from '../utils/mapNavigation';
import { shareAppointmentTicket } from '../utils/shareUtils';
import {
  isBookingEmailConfigured,
  sendBookingConfirmationEmail,
} from '../services/clinicEmail';
import {
  AppHeader,
  AppButton,
  AppInput,
  Badge,
  SectionHeader,
  SegmentedControl,
  ChatBottomInputBar,
  ActivePrescriptionCard,
  ToastBanner,
  AnimatedEntry,
  AnimatedSuccessBadge,
} from '../components';

// ============================================================================
// SCREEN 11: [1:2703] ĐẶT LỊCH THÀNH CÔNG
// ============================================================================
export const BookingSuccessScreen: React.FC<{
  onViewAppointments?: () => void;
  onGoHome?: () => void;
  onNavigate?: (routeKey: string) => void;
  paymentMethod?: string;
}> = ({ onViewAppointments, onGoHome, onNavigate, paymentMethod }) => {
  const { latestBooking } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [zoomQr, setZoomQr] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [emailFeedback, setEmailFeedback] = useState('');
  const doctor = latestBooking.doctor || DOCTORS[0];
  const activePayment = paymentMethod || latestBooking.paymentMethod || 'at_clinic_bhyt';
  const isBHYT = activePayment === 'at_clinic_bhyt';

  const handleSendBookingEmail = async (isAuto = false) => {
    if (!latestBooking.code || !latestBooking.patientEmail || emailSending) return;
    setEmailSending(true);
    if (!isAuto) setEmailFeedback('');
    try {
      const res = await sendBookingConfirmationEmail(latestBooking, {
        isAutoSend: isAuto,
      });
      setEmailStatus('sent');
      setEmailFeedback(`Đã gửi phiếu hẹn điện tử kèm mã QR tới ${res.toEmail}`);
    } catch (err) {
      setEmailStatus('error');
      setEmailFeedback(
        err instanceof Error ? err.message : 'Không gửi được email xác nhận.'
      );
    } finally {
      setEmailSending(false);
    }
  };

  useEffect(() => {
    if (!latestBooking.code || !latestBooking.patientEmail) return;
    if (!isBookingEmailConfigured()) return;
    let active = true;
    const autoSend = async () => {
      try {
        const res = await sendBookingConfirmationEmail(latestBooking, {
          isAutoSend: true,
        });
        if (!active) return;
        setEmailStatus('sent');
        setEmailFeedback(`Đã tự động gửi phiếu hẹn kèm mã QR tới ${res.toEmail}`);
      } catch (err) {
        if (!active) return;
        setEmailStatus('error');
        setEmailFeedback(
          err instanceof Error ? err.message : 'Chưa gửi được email xác nhận.'
        );
      }
    };
    void autoSend();
    return () => {
      active = false;
    };
  }, [latestBooking]);

  const handleCopyCode = () => {
    if (!latestBooking.code) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(latestBooking.code).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const paymentLabel = CLOUD_MODE ? 'Thanh toán tại cơ sở y tế' :
    activePayment === 'vietqr'
      ? 'Chuyển khoản VietQR 24/7'
      : activePayment === 'vnpay'
      ? 'Cổng VNPAY'
      : activePayment === 'momo'
      ? 'Ví MoMo'
      : 'Thanh toán tại viện với BHYT';

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Đặt Lịch Thành Công"
        onBack={onGoHome}
        rightActions={[
          {
            icon: 'share-social-outline',
            onPress: () => shareAppointmentTicket(latestBooking),
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {/* Section 1: Success Celebration Header */}
        <AnimatedEntry delay={30} direction="up">
          <View style={[styles.cardCenter, SHADOWS.sm]}>
            <AnimatedSuccessBadge size={68}>
              <Ionicons name="checkmark-circle" size={50} color={COLORS.secondary} />
            </AnimatedSuccessBadge>
            <Text style={styles.heroTitle}>Đặt lịch khám thành công!</Text>
            <Text style={styles.heroSub}>
              {CLOUD_MODE ? 'Lịch hẹn đã được lưu. Mang mã QR này đến quầy tiếp đón vào đúng ngày khám.' : <>Phiếu hẹn của bạn đã được xác nhận. Thông tin liên hệ:{' '}
              <Text style={{ fontWeight: '800', color: COLORS.primary }}>
                {latestBooking.patientPhone || 'Chưa cập nhật'}
              </Text>
              .</>}
            </Text>
          </View>
        </AnimatedEntry>

        {/* Section 2: Smart Appointment Ticket Card */}
        <AnimatedEntry delay={100} direction="up">
          <View style={[styles.card, SHADOWS.md]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.capLabel}>MÃ PHIẾU HẸN</Text>
                <Text style={styles.ticketCode}>{latestBooking.code}</Text>
              </View>
              <Badge
                label={CLOUD_MODE ? 'Đã giữ chỗ • Chưa thu tiền' : isBHYT ? 'Giữ chỗ BHYT • Trả sau' : 'Đã thanh toán Online ✓'}
                variant={isBHYT ? 'warning' : 'teal'}
                showDot
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.docRow}>
              <Image source={{ uri: doctor.avatar }} style={styles.avatarMd} />
              <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                <Badge
                  label={
                    latestBooking.consultMode === 'chat'
                      ? 'Tư vấn Trực tuyến'
                      : `Khám ${doctor.specialty}`
                  }
                  variant="blue"
                />
                <Text style={[styles.docName, { marginTop: 4 }]} numberOfLines={1}>
                  {doctor.name}
                </Text>
                <Text style={styles.docSub} numberOfLines={1}>
                  {doctor.degree}
                </Text>
                <Text style={styles.docHospital} numberOfLines={1}>
                  {doctor.hospital}
                </Text>
              </View>
            </View>

            <View style={styles.ticketGrid}>
              <View style={styles.ticketBox}>
                <Text style={styles.capLabel} numberOfLines={1}>
                  THỜI GIAN KHÁM
                </Text>
                <Text style={styles.ticketVal} numberOfLines={1}>
                  {latestBooking.timeRange}
                </Text>
                <Text style={styles.docSub} numberOfLines={1}>
                  {latestBooking.dayLabel}, {latestBooking.fullDate}
                </Text>
              </View>
              <View style={styles.ticketBox}>
                <Text style={styles.capLabel} numberOfLines={1}>
                  PHÒNG KHÁM & STT
                </Text>
                <Text
                  style={[styles.ticketVal, { color: COLORS.secondary }]}
                  numberOfLines={1}
                >
                  {latestBooking.queueNumber}
                </Text>
                <Text style={styles.docSub} numberOfLines={1}>
                  {latestBooking.room}
                </Text>
              </View>
            </View>

            {/* Payment Method Receipt Strip */}
            <View
              style={{
                marginTop: 12,
                padding: 10,
                backgroundColor: COLORS.surfaceContainerLow,
                borderRadius: RADIUS.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons
                  name={isBHYT ? 'business-outline' : 'card-outline'}
                  size={16}
                  color={isBHYT ? COLORS.primary : COLORS.secondary}
                />
                <Text
                  style={{ fontSize: TYPOGRAPHY.caption, color: COLORS.textSecondary, flex: 1 }}
                  numberOfLines={1}
                >
                  Hình thức: <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{paymentLabel}</Text>
                </Text>
              </View>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.caption,
                  fontWeight: '800',
                  color: isBHYT ? COLORS.primary : COLORS.secondary,
                }}
              >
                {CLOUD_MODE ? 'Chưa thu' : isBHYT ? 'Trả tại viện' : doctor.fee}
              </Text>
            </View>
          </View>
        </AnimatedEntry>

        {/* Section 3: Patient details */}
        <AnimatedEntry delay={140} direction="up">
          <View style={[styles.card, SHADOWS.sm]}>
            <SectionHeader
              title="Thông tin bệnh nhân"
              leftIcon="person-outline"
            />
            <View style={styles.patientDetailRow}>
              <Text style={styles.patientDetailLabel}>Họ và tên</Text>
              <Text style={styles.patientDetailValue}>
                {latestBooking.patientName || 'Chưa cập nhật'}
              </Text>
            </View>
            <View style={styles.patientDetailRow}>
              <Text style={styles.patientDetailLabel}>Số điện thoại</Text>
              <Text style={styles.patientDetailValue} selectable>
                {latestBooking.patientPhone || 'Chưa cập nhật'}
              </Text>
            </View>
            <View style={styles.patientDetailRow}>
              <Text style={styles.patientDetailLabel}>Email</Text>
              <Text style={styles.patientDetailValue} selectable>
                {latestBooking.patientEmail || 'Chưa cập nhật'}
              </Text>
            </View>
            <View style={[styles.patientDetailRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.patientDetailLabel}>Triệu chứng</Text>
              <Text style={styles.patientDetailValue}>
                {latestBooking.symptoms || 'Chưa cập nhật'}
              </Text>
            </View>

            {latestBooking.patientEmail ? (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 }}>
                {emailFeedback ? (
                  <Text
                    accessibilityRole="alert"
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: emailStatus === 'sent' ? COLORS.secondary : COLORS.error,
                    }}
                  >
                    {emailStatus === 'sent' ? '✓ ' : '⚠ '}
                    {emailFeedback}
                  </Text>
                ) : null}
                <AppButton
                  title={
                    emailStatus === 'sent'
                      ? 'Gửi lại phiếu hẹn qua Email'
                      : 'Gửi phiếu hẹn kèm QR về Email'
                  }
                  variant={emailStatus === 'sent' ? 'outline' : 'tonal'}
                  size="sm"
                  leftIcon="mail-outline"
                  loading={emailSending}
                  disabled={emailSending}
                  onPress={() => {
                    void handleSendBookingEmail(false);
                  }}
                />
              </View>
            ) : null}
          </View>
        </AnimatedEntry>

        {/* Section 4: High-speed QR Fast Check-in Module */}
        <AnimatedEntry delay={170} direction="up">
          <View style={[styles.cardCenter, SHADOWS.sm]}>
            <Badge
              label="MÃ QR CHECK-IN SIÊU TỐC"
              variant="blue"
              icon="qr-code-outline"
            />
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setZoomQr(true)}
              style={[styles.qrMockBox, { backgroundColor: '#FFFFFF', padding: 12, borderRadius: RADIUS.md, marginVertical: 10 }]}
            >
              {latestBooking.code ? (
                <QRCode
                  value={latestBooking.code}
                  size={168}
                  color={COLORS.textPrimary}
                  backgroundColor="#FFFFFF"
                />
              ) : (
                <Text>Chưa có phiếu hẹn.</Text>
              )}
            </TouchableOpacity>

            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.8, textAlign: 'center' }} selectable>
              {latestBooking.code || 'Chưa có mã phiếu hẹn'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <AppButton
                title={copied ? '✓ Đã chép mã' : 'Sao chép mã'}
                variant={copied ? 'primary' : 'outline'}
                size="sm"
                leftIcon={copied ? 'checkmark-outline' : 'copy-outline'}
                fullWidth={false}
                onPress={handleCopyCode}
              />
              <AppButton
                title="Phóng to QR"
                variant="tonal"
                size="sm"
                leftIcon="expand-outline"
                fullWidth={false}
                onPress={() => setZoomQr(true)}
              />
            </View>

            <Text style={[styles.heroSub, { marginTop: 10 }]}>
              {CLOUD_MODE ? 'Xuất trình mã QR này tại quầy tiếp đón hoặc để bác sĩ quét kiểm tra lịch hẹn.' : 'Quét mã tại Kiosk tự động hoặc Quầy tiếp đón để nhận số vào phòng khám mà không cần xếp hàng.'}
            </Text>
            <Badge
              label={CLOUD_MODE ? 'Tiếp đón vào đúng ngày hẹn' : 'Hợp lệ check-in trước 15 phút (từ 09:15)'}
              variant="teal"
              style={{ marginTop: 8 }}
            />
          </View>
        </AnimatedEntry>

        {/* Section 4: Quick Action Floating Grid */}
        <View style={styles.quickGrid3}>
          {[
            {
              icon: 'calendar-outline',
              label: 'Thêm vào Lịch',
              action: onViewAppointments,
            },
            {
              icon: 'share-social-outline',
              label: 'Chia Sẻ Phiếu',
              action: () => shareAppointmentTicket(latestBooking),
            },
            latestBooking.consultMode === 'chat'
              ? {
                  icon: 'videocam-outline',
                  label: 'Phòng Tư Vấn',
                  action: () => onNavigate?.('teleconsult'),
                }
              : {
                  icon: 'navigate-outline',
                  label: 'Chỉ Đường',
                  action: () =>
                    openGoogleMapsDirections({
                      name: doctor.hospital,
                      address: doctor.address,
                      latitude: doctor.latitude,
                      longitude: doctor.longitude,
                    }),
                },
          ].map((act) => (
            <TouchableOpacity
              key={act.label}
              onPress={act.action}
              style={[styles.quickBtnCard, SHADOWS.sm]}
            >
              <Ionicons name={act.icon as any} size={20} color={COLORS.primary} />
              <Text style={styles.quickBtnLabel}>{act.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 5: Preparation Checklist */}
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Chuẩn bị khi đi khám"
            leftIcon="clipboard-outline"
          />
          {[
            'Mang theo CCCD gắn chip hoặc ứng dụng VssID / thẻ BHYT bản chính để đối chiếu.',
              'Có mặt trước giờ hẹn 15 phút để làm thủ tục tiếp đón.',
            'Mang theo sổ khám bệnh, các kết quả chụp MRI / CT và đơn thuốc cũ trong 3 tháng gần nhất (nếu có).',
          ].map((note, idx) => (
            <View key={idx} style={styles.checkItemRow}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={COLORS.secondary}
                style={{ marginTop: 2 }}
              />
              <Text style={styles.checkItemText}>{note}</Text>
            </View>
          ))}
        </View>

        {/* Section 6: Bottom Navigation Action Stack */}
        {latestBooking.consultMode === 'chat' && (
          <AppButton
            title="Vào phòng tư vấn trực tuyến"
            variant="secondary"
            size="lg"
            leftIcon="videocam-outline"
            onPress={() => onNavigate?.('teleconsult')}
            style={{ marginBottom: 10 }}
          />
        )}
        <AppButton
          title="Xem lịch khám của tôi"
          variant="primary"
          size="lg"
          leftIcon="calendar-outline"
          onPress={onViewAppointments}
          style={{ marginBottom: 10 }}
        />
        <AppButton
          title="Về trang chủ"
          variant="tonal"
          size="lg"
          leftIcon="home-outline"
          onPress={onGoHome}
        />
      </ScrollView>

      {zoomQr && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: 24 }]}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: RADIUS.lg, padding: 24, alignItems: 'center', gap: 12, maxWidth: 340, width: '100%' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.primary, textAlign: 'center' }}>
              MÃ QR CHECK-IN TIẾP ĐÓN
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' }}>
              Hướng màn hình về phía camera máy tính của Bác sĩ hoặc Quầy tiếp đón để quét mã
            </Text>
            <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border }}>
              {latestBooking.code ? (
                <QRCode
                  value={latestBooking.code}
                  size={220}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              ) : null}
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.8 }} selectable>
              {latestBooking.code}
            </Text>
            <AppButton
              title="Đóng phóng to"
              variant="primary"
              onPress={() => setZoomQr(false)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// SCREEN 14: [1:3491] QUẢN LÝ HỒ SƠ NGƯỜI THÂN
// ============================================================================
export const FamilyProfilesScreen: React.FC<{
  onBack?: () => void;
  onSelectChild?: () => void;
  onSelectMember?: (member: FamilyMemberItem) => void;
  onAddMember?: () => void;
  onEditMember?: (member: FamilyMemberItem) => void;
  onNavigate?: (routeKey: string) => void;
  onBookForMember?: (member: FamilyMemberItem) => void;
}> = ({
  onBack,
  onSelectChild,
  onSelectMember,
  onAddMember,
  onEditMember,
  onNavigate,
  onBookForMember,
}) => {
  const { familyMembers, patientProfile, deleteFamilyMember } = useAppContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [familyActionNotice, setFamilyActionNotice] = useState('');
  const bhytMemberCount = familyMembers.filter((m) => Boolean(m.bhyt?.trim())).length;

  const handleDeleteMember = async (member: FamilyMemberItem) => {
    if (deletingId) return;
    setDeletingId(member.id);
    setFamilyActionNotice('');
    try {
      await deleteFamilyMember(member.id);
      setFamilyActionNotice(`Đã xóa hồ sơ của ${member.name}.`);
    } catch (error) {
      setFamilyActionNotice(
        error instanceof Error ? error.message : 'Không thể xóa hồ sơ người thân.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Quản Lý Hồ Sơ Người Thân"
        subtitle="MediCare Plus Family • BHYT & lịch khám tập trung"
        onBack={onBack}
        rightActions={[{ icon: 'person-add-outline', onPress: onAddMember }]}
      />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {/* Primary Account / Chủ hộ Card */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.rowBetween}>
            <Badge label="Chủ hộ • Đang xem" variant="primarySolid" />
            <Badge
              label={patientProfile.bhytCode ? `BHYT: ${patientProfile.bhytCode.split(' ')[0]}` : 'Tài khoản chính'}
              variant="teal"
            />
          </View>
          <View style={[styles.docRow, { marginTop: 10 }]}>
            <Image
              source={{ uri: patientProfile.avatar || PATIENT_PROFILE.avatar }}
              style={styles.avatarMd}
            />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
              <Text style={styles.docName} numberOfLines={1}>
                {patientProfile.name} (Bản thân)
              </Text>
              <Text style={styles.docSub} numberOfLines={1}>
                {[
                  patientProfile.dob ? `Sinh: ${patientProfile.dob}` : null,
                  `Nhóm máu: ${patientProfile.bloodType || 'Chưa cập nhật'}`,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            </View>
          </View>
        </View>

        {/* AI Family Health Overview */}
        <LinearGradient
          colors={GRADIENTS.heroCard}
          style={[styles.heroCard, SHADOWS.md]}
        >
          <View style={styles.rowBetween}>
            <Badge
              label={CLOUD_MODE ? 'Đồng bộ Supabase Cloud' : 'MediCare Plus AI Family Care'}
              variant="glass"
              icon="sparkles"
            />
            <Text style={styles.whiteSub}>{familyMembers.length + 1} thành viên</Text>
          </View>
          {CLOUD_MODE ? (
            <Text style={styles.whiteBody}>
              Đang quản lý <Text style={{ fontWeight: '800' }}>{familyMembers.length} hồ sơ người thân</Text> trên
              đám mây ({bhytMemberCount} hồ sơ đã liên kết mã thẻ BHYT). Bạn có thể chọn bất kỳ thành viên nào
              bên dưới để đặt lịch khám và tự động tính quyền lợi BHYT.
            </Text>
          ) : (
            <Text style={styles.whiteBody}>
              Nhắc nhở y tế: <Text style={{ fontWeight: '800' }}>Bé Bảo Nam</Text>{' '}
              có lịch tiêm nhắc Sởi - Quai bị - Rubella trong 5 ngày tới. Mẹ{' '}
              <Text style={{ fontWeight: '800' }}>Trần Thị Lan</Text> cần đo huyết
              áp định kỳ sáng mai (07:30).
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <AppButton
              title="Thêm người thân"
              variant="white"
              size="sm"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={() => onAddMember?.()}
            />
            {familyMembers[0] ? (
              <AppButton
                title={`Đặt khám: ${familyMembers[0].name}`}
                variant="secondary"
                size="sm"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={() => {
                  if (onBookForMember) {
                    onBookForMember(familyMembers[0]);
                  } else {
                    onNavigate?.('bookingSlot');
                  }
                }}
              />
            ) : null}
          </View>
        </LinearGradient>

        <SectionHeader
          title={`Hồ Sơ Thành Viên (${familyMembers.length} thành viên phụ)`}
          subtitle={CLOUD_MODE ? 'Lưu trữ bảo mật với Supabase RLS' : 'Đồng bộ thời gian thực'}
          actionText="+ Thêm mới"
          onActionPress={onAddMember}
        />

        {familyActionNotice ? (
          <View style={[styles.memberNoteBox, { marginBottom: 12 }]}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.memberNoteText}>{familyActionNotice}</Text>
          </View>
        ) : null}

        {familyMembers.length === 0 ? (
          <View style={[styles.card, SHADOWS.sm, { alignItems: 'center', paddingVertical: 24 }]}>
            <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
            <Text style={[styles.docName, { marginTop: 10, textAlign: 'center' }]}>
              Chưa có hồ sơ người thân nào
            </Text>
            <Text style={[styles.docSub, { textAlign: 'center', marginTop: 4 }]}>
              Thêm hồ sơ con cái, cha mẹ hoặc vợ/chồng để quản lý thẻ BHYT và đặt lịch khám tập trung.
            </Text>
          </View>
        ) : null}

        {familyMembers.map((mem) => (
          <View key={mem.id} style={[styles.card, SHADOWS.sm]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (onSelectMember) {
                  onSelectMember(mem);
                } else {
                  onSelectChild?.();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`Hồ sơ ${mem.name}, ${mem.relation}`}
            >
              <View style={styles.rowBetween}>
                <Text style={[styles.docName, { flex: 1 }]} numberOfLines={1}>
                  {mem.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Badge label={mem.badge} variant="blue" />
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.textMuted}
                    importantForAccessibility="no"
                  />
                </View>
              </View>
              <Text style={styles.docSub}>
                {mem.relation} • {mem.code} • Nhóm máu {mem.blood}
              </Text>
              {mem.bhyt ? (
                <Text style={[styles.docSub, { color: COLORS.primary, fontWeight: '600', marginTop: 2 }]}>
                  Mã BHYT: {mem.bhyt}
                </Text>
              ) : null}
              {mem.allergies ? (
                <Text style={[styles.docSub, { color: COLORS.error, marginTop: 2 }]}>
                  Dị ứng: {mem.allergies}
                </Text>
              ) : null}
              <View style={styles.memberNoteBox}>
                <Ionicons
                  name="medical-outline"
                  size={14}
                  color={COLORS.secondary}
                />
                <Text style={styles.memberNoteText} numberOfLines={2}>
                  {mem.note}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <AppButton
                title="Đặt lịch khám"
                variant="tonal"
                size="sm"
                leftIcon="calendar-outline"
                fullWidth={false}
                style={{ flex: 2 }}
                onPress={() => {
                  if (onBookForMember) {
                    onBookForMember(mem);
                  } else {
                    onNavigate?.('bookingSlot');
                  }
                }}
              />
              {onEditMember ? (
                <AppButton
                  title="Sửa"
                  variant="outline"
                  size="sm"
                  leftIcon="create-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => onEditMember(mem)}
                />
              ) : null}
              <AppButton
                title="Xóa"
                variant="danger"
                size="sm"
                leftIcon="trash-outline"
                fullWidth={false}
                loading={deletingId === mem.id}
                disabled={deletingId !== null}
                style={{ flex: 1 }}
                onPress={() => {
                  void handleDeleteMember(mem);
                }}
              />
            </View>
          </View>
        ))}

        <AppButton
          title="+ Thêm hồ sơ người thân mới"
          variant="primary"
          size="lg"
          leftIcon="person-add-outline"
          onPress={onAddMember}
        />
      </ScrollView>
    </View>
  );
};

// ============================================================================
// SCREEN 15: [1:3822] CHI TIẾT BỆNH ÁN NGƯỜI THÂN
// ============================================================================
export const ChildEHRDetailScreen: React.FC<{
  member?: FamilyMemberItem | null;
  onBack?: () => void;
  onEditMember?: (member: FamilyMemberItem) => void;
  onBookForMember?: (member: FamilyMemberItem) => void;
}> = ({ member, onBack, onEditMember, onBookForMember }) => {
  const { familyMembers, appointments } = useAppContext();
  const [tab, setTab] = useState('exam');
  const activeMember = member || familyMembers[0] || null;
  const memberName = activeMember?.name || 'Nguyễn Bảo Nam';
  const memberRelation = activeMember?.rawRelation || activeMember?.relation || 'Con trai • 4 tuổi';
  const memberCode = activeMember?.code || '#BN-992104';
  const memberBlood = activeMember?.blood || 'O+';
  const memberDob = activeMember?.dob || '18/09/2020';
  const memberGender = activeMember?.gender || 'Chưa cập nhật';
  const memberBhyt = activeMember?.bhyt || 'Chưa cập nhật';
  const memberAllergies = activeMember?.allergies || 'Không ghi nhận dị ứng';
  const memberNote = activeMember?.note || 'Hồ sơ sức khỏe theo dõi định kỳ';

  const memberAppointments = appointments.filter(
    (a) =>
      activeMember &&
      a.patientName &&
      a.patientName.trim().toLowerCase() === activeMember.name.trim().toLowerCase()
  );

  return (
    <View style={styles.screen}>
      <AppHeader
        title={`Hồ Sơ Y Tế - ${memberName}`}
        subtitle={`${memberRelation} • Mã EHR: ${memberCode}`}
        badgeText={activeMember?.badge || 'THÀNH VIÊN'}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {/* Master Profile Card */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <Text style={styles.docName} numberOfLines={1}>
                {memberName}
              </Text>
              <Text style={styles.docSub}>
                {memberGender !== 'Chưa cập nhật' ? `${memberGender} • ` : ''}
                {memberDob ? `Sinh: ${memberDob} • ` : ''}Nhóm máu {memberBlood}
              </Text>
            </View>
            <Badge label={activeMember?.bhyt ? 'Đã có BHYT' : 'Hồ sơ gia đình'} variant="teal" />
          </View>

          <View style={[styles.memberNoteBox, { marginTop: 10 }]}>
            <Ionicons name="card-outline" size={16} color={COLORS.primary} />
            <Text style={styles.memberNoteText}>
              Mã thẻ BHYT: {memberBhyt}
              {activeMember?.phone ? ` • SĐT: ${activeMember.phone}` : ''}
            </Text>
          </View>

          <View style={[styles.memberNoteBox, { marginTop: 8 }]}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
            <Text style={styles.memberNoteText}>
              Tiền sử dị ứng: {memberAllergies}
            </Text>
          </View>

          <View style={[styles.memberNoteBox, { marginTop: 8 }]}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.memberNoteText}>
              Ghi chú sức khỏe: {memberNote}
            </Text>
          </View>

          {activeMember ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {onBookForMember ? (
                <AppButton
                  title="Đặt lịch khám"
                  variant="primary"
                  size="sm"
                  leftIcon="calendar-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => onBookForMember(activeMember)}
                />
              ) : null}
              {onEditMember ? (
                <AppButton
                  title="Chỉnh sửa hồ sơ"
                  variant="outline"
                  size="sm"
                  leftIcon="create-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => onEditMember(activeMember)}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        <SegmentedControl
          variant="chips"
          selectedKey={tab}
          onSelect={setTab}
          options={[
            { key: 'exam', label: `Lịch sử khám (${memberAppointments.length})` },
            { key: 'vaccine', label: 'Theo dõi & Dự phòng' },
            { key: 'growth', label: 'Chỉ số thể trạng' },
          ]}
          style={{ marginBottom: 14 }}
        />

        {tab === 'exam' && (
          <View style={[styles.card, SHADOWS.sm]}>
            <SectionHeader
              title="Lịch hẹn & Lần khám của thành viên"
              subtitle={
                memberAppointments.length > 0
                  ? `Có ${memberAppointments.length} lịch khám gắn với ${memberName}`
                  : 'Đồng bộ từ lịch sử đặt khám của gia đình'
              }
            />
            {memberAppointments.length > 0 ? (
              memberAppointments.map((apt) => (
                <View key={apt.id} style={[styles.memberNoteBox, { marginTop: 8 }]}>
                  <Ionicons name="medkit-outline" size={16} color={COLORS.primary} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.docName}>
                      {apt.doctor.name} • {apt.statusBadge}
                    </Text>
                    <Text style={styles.docSub}>
                      {apt.dateLabel} • Mã phiếu: {apt.code}
                    </Text>
                    {apt.symptoms ? (
                      <Text style={styles.checkItemText}>
                        Triệu chứng / Lý do khám: {apt.symptoms}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            ) : CLOUD_MODE ? (
              <Text style={styles.checkItemText}>
                Chưa có lượt khám nào được đặt cho {memberName}. Nhấn &quot;Đặt lịch khám&quot; ở trên để đặt lịch với bác sĩ chuyên khoa.
              </Text>
            ) : (
              <>
                <Text style={styles.docName}>
                  Khám tổng quát định kỳ & Tư vấn dinh dưỡng
                </Text>
                <Text style={styles.checkItemText}>
                  Tim phổi bình thường, phản xạ vận động tốt. Khuyến nghị duy trì chế độ dinh dưỡng cân bằng và tái khám định kỳ.
                </Text>
              </>
            )}
          </View>
        )}

        {tab === 'vaccine' && (
          <View style={[styles.card, SHADOWS.sm]}>
            <SectionHeader
              title="Theo dõi Tiêm chủng & Chăm sóc dự phòng"
              leftIcon="shield-checkmark-outline"
              badgeText={CLOUD_MODE ? 'Ghi chú gia đình' : 'Sắp tới'}
              badgeVariant={CLOUD_MODE ? 'teal' : 'warning'}
            />
            <Text style={styles.checkItemText}>
              {memberNote}
            </Text>
          </View>
        )}

        {tab === 'growth' && (
          <View style={[styles.card, SHADOWS.sm]}>
            <SectionHeader
              title="Thông tin sinh học & Nhóm máu"
              badgeText={memberBlood}
              badgeVariant="teal"
            />
            <Text style={styles.docName}>
              Nhóm máu: {memberBlood} • Giới tính: {memberGender}
            </Text>
            <Text style={styles.checkItemText}>
              Tiền sử dị ứng: {memberAllergies}. Bạn có thể cập nhật nhóm máu, tiền sử dị ứng và ghi chú sức khỏe bằng nút &quot;Chỉnh sửa hồ sơ&quot;.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ============================================================================
// SCREEN 16: [1:4230] THÊM MỚI / CHỈNH SỬA HỒ SƠ NGƯỜI THÂN
// ============================================================================
export const AddEditFamilyMemberScreen: React.FC<{
  editingMember?: FamilyMemberItem | null;
  onBack?: () => void;
}> = ({ editingMember, onBack }) => {
  const { addFamilyMember, updateFamilyMember, patientProfile } = useAppContext();
  const isEditing = Boolean(editingMember);
  const [name, setName] = useState(
    editingMember?.name ?? (CLOUD_MODE ? '' : 'NGUYỄN BẢO ANH')
  );
  const [dob, setDob] = useState(
    editingMember?.dob ?? (CLOUD_MODE ? '' : '18/06/2019')
  );
  const [relation, setRelation] = useState(
    editingMember?.rawRelation ||
      editingMember?.relation?.split('•')[0]?.trim() ||
      'Con cái'
  );
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [bhyt, setBhyt] = useState(
    editingMember?.bhyt ?? (CLOUD_MODE ? '' : 'TE1 79 234 99102')
  );
  const [gender, setGender] = useState(
    editingMember?.gender && editingMember.gender !== 'Chưa cập nhật'
      ? editingMember.gender
      : 'Nam'
  );
  const [blood, setBlood] = useState(
    editingMember?.blood || 'Chưa xét nghiệm'
  );
  const [phone, setPhone] = useState(editingMember?.phone || '');
  const [allergies, setAllergies] = useState(editingMember?.allergies || '');
  const [note, setNote] = useState(editingMember?.note || '');
  const [nameError, setNameError] = useState('');
  const [dobError, setDobError] = useState('');

  const [savingFamily, setSavingFamily] = useState(false);
  const [familySaveError, setFamilySaveError] = useState('');

  const handleSaveMember = async () => {
    if (savingFamily) return;
    let hasErr = false;
    if (!name.trim() || name.trim().length < 2) {
      setNameError('Vui lòng nhập họ và tên đầy đủ của người thân');
      hasErr = true;
    } else {
      setNameError('');
    }
    if (!dob.trim()) {
      setDobError('Vui lòng nhập ngày tháng năm sinh (DD/MM/YYYY)');
      hasErr = true;
    } else {
      setDobError('');
    }
    if (hasErr) return;
    setSavingFamily(true);
    setFamilySaveError('');
    const payload = {
      name: name.trim(),
      dob: dob.trim(),
      relation,
      bhyt: bhyt.trim(),
      blood,
      gender,
      phone: phone.trim(),
      allergies: allergies.trim(),
      note: note.trim(),
    };
    try {
      if (editingMember) {
        await updateFamilyMember(editingMember.id, payload);
      } else {
        await addFamilyMember(payload);
      }
      onBack?.();
    } catch (error) {
      setFamilySaveError(
        error instanceof Error ? error.message : 'Chưa lưu được hồ sơ.'
      );
    } finally {
      setSavingFamily(false);
    }
  };

  const RELATION_OPTIONS = [
    'Bố ruột',
    'Mẹ ruột',
    'Vợ / Chồng',
    'Con cái',
    'Ông / Bà',
    'Khác',
  ];
  const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];
  const BLOOD_OPTIONS = ['O+', 'A+', 'B+', 'AB+', 'Chưa xét nghiệm'];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title={isEditing ? 'Chỉnh Sửa Hồ Sơ Người Thân' : 'Thêm Hồ Sơ Người Thân'}
        subtitle={`Chủ tài khoản bảo trợ: ${patientProfile.name}`}
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={styles.scrollPad}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Scan Banner — Coming Soon (No fake OCR) */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.rowBetween}>
            <Badge label="Sắp ra mắt" variant="surface" icon="time-outline" />
            <Badge label="Hỗ trợ thẻ BHYT / CCCD" variant="teal" />
          </View>
          <Text style={[styles.docName, { marginTop: 8 }]}>
            Quét mã QR trên CCCD hoặc Thẻ BHYT
          </Text>
          <Text style={styles.docSub}>
            Tính năng quét tự động từ thẻ đang được phát triển. Hiện tại vui
            lòng nhập trực tiếp thông tin người thân bên dưới.
          </Text>
          <AppButton
            title="Tính năng quét thẻ sắp ra mắt"
            variant="tonal"
            size="sm"
            leftIcon="camera-outline"
            disabled
            fullWidth={false}
            style={{ marginTop: 10, alignSelf: 'flex-start' }}
          />
        </View>

        {/* Relationship 1-Row Dropdown Selector */}
        <SectionHeader title="Mối quan hệ với bạn *" />
        <View style={styles.dropdownWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowRelationDropdown((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={`Mối quan hệ với bạn: ${relation}`}
            accessibilityState={{ expanded: showRelationDropdown }}
            style={[
              styles.dropdownTrigger,
              SHADOWS.sm,
              showRelationDropdown && styles.dropdownTriggerActive,
            ]}
          >
            <View style={styles.dropdownTriggerLeft}>
              <Ionicons
                name="people-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.dropdownValueText} numberOfLines={1}>
                {relation}
              </Text>
            </View>
            <Ionicons
              name={showRelationDropdown ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {showRelationDropdown && (
            <View style={[styles.dropdownMenu, SHADOWS.sm]}>
              {RELATION_OPTIONS.map((rel, idx) => {
                const active = relation === rel;
                return (
                  <TouchableOpacity
                    key={rel}
                    activeOpacity={0.8}
                    accessibilityRole="menuitem"
                    accessibilityLabel={rel}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setRelation(rel);
                      setShowRelationDropdown(false);
                    }}
                    style={[
                      styles.dropdownOptionRow,
                      idx === RELATION_OPTIONS.length - 1 && {
                        borderBottomWidth: 0,
                      },
                      active && styles.dropdownOptionRowActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        active && styles.dropdownOptionTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {rel}
                    </Text>
                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader title="Thông tin hành chính & BHYT" />
          <AppInput
            label="Họ và tên đầy đủ (Chữ IN HOA có dấu) *"
            leftIcon="person-outline"
            value={name}
            placeholder="NGUYỄN BẢO ANH"
            onChangeText={(txt) => {
              setName(txt);
              if (nameError) setNameError('');
            }}
            error={nameError}
          />
          <AppInput
            label="Ngày sinh (DD/MM/YYYY) *"
            leftIcon="calendar-outline"
            value={dob}
            placeholder="18/06/2019"
            onChangeText={(txt) => {
              setDob(txt);
              if (dobError) setDobError('');
            }}
            error={dobError}
          />
          <AppInput
            label="Mã số BHYT / Định danh VssID"
            leftIcon="card-outline"
            value={bhyt}
            placeholder="VD: TE1 79 234 99102 hoặc GD4 79..."
            onChangeText={setBhyt}
          />
          <AppInput
            label="Số điện thoại liên hệ (tùy chọn)"
            leftIcon="call-outline"
            value={phone}
            placeholder="0912345678"
            keyboardType="phone-pad"
            onChangeText={setPhone}
          />

          <Text style={[styles.docSub, { marginTop: 8, marginBottom: 6, fontWeight: '600' }]}>
            Giới tính
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {GENDER_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setGender(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: gender === item }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: gender === item ? COLORS.primary : COLORS.border,
                  backgroundColor: gender === item ? COLORS.tintBlue : COLORS.surface,
                }}
              >
                <Text
                  style={{
                    color: gender === item ? COLORS.primary : COLORS.textSecondary,
                    fontWeight: gender === item ? '700' : '500',
                    fontSize: 13,
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.docSub, { marginBottom: 6, fontWeight: '600' }]}>
            Nhóm máu
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {BLOOD_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setBlood(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: blood === item }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: blood === item ? COLORS.secondary : COLORS.border,
                  backgroundColor: blood === item ? '#E6FAF5' : COLORS.surface,
                }}
              >
                <Text
                  style={{
                    color: blood === item ? COLORS.secondary : COLORS.textSecondary,
                    fontWeight: blood === item ? '700' : '500',
                    fontSize: 13,
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <AppInput
            label="Tiền sử dị ứng thuốc / thức ăn (nếu có)"
            leftIcon="alert-circle-outline"
            value={allergies}
            placeholder="VD: Dị ứng kháng sinh Penicillin, hải sản..."
            onChangeText={setAllergies}
          />
          <AppInput
            label="Ghi chú theo dõi sức khỏe"
            leftIcon="medkit-outline"
            value={note}
            placeholder="VD: Theo dõi huyết áp định kỳ / Lịch tiêm chủng..."
            onChangeText={setNote}
          />
        </View>

        {familySaveError ? <Text accessibilityRole="alert" style={{ color: COLORS.error }}>{familySaveError}</Text> : null}
        <AppButton
          title={isEditing ? 'Cập nhật hồ sơ người thân' : 'Lưu hồ sơ người thân'}
          variant="primary"
          size="lg"
          leftIcon="checkmark-circle-outline"
          loading={savingFamily}
          disabled={savingFamily}
          onPress={handleSaveMember}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ============================================================================
// SCREEN 17: CHAT TRỰC TUYẾN VỚI BÁC SĨ (REAL-TIME DOCTOR-PATIENT CHAT)
// ============================================================================
interface DoctorChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  time: string;
  attachmentTitle?: string;
  attachmentSubtitle?: string;
}

const INITIAL_DOCTOR_CHAT: DoctorChatMessage[] = [
  {
    id: 'dc-1',
    sender: 'doctor',
    text: 'Chào anh Vũ, bác sĩ đã xem hồ sơ khám và kết quả chụp MRI sọ não sáng nay của anh. Hiện tại triệu chứng đau nửa đầu của anh thế nào rồi?',
    time: '14:02',
  },
  {
    id: 'dc-2',
    sender: 'patient',
    text: 'Dạ chào bác sĩ Trang, em vẫn còn đau âm ỉ vùng thái dương phải, nhất là khi ngồi máy tính lâu và thiếu ngủ ạ.',
    time: '14:03',
  },
  {
    id: 'dc-3',
    sender: 'doctor',
    text: 'Kết quả MRI 1.5 Tesla cho thấy nhu mô não và hệ mạch máu hoàn toàn bình thường, không có tổn thương thực thể. Tình trạng của anh là Đau nửa đầu Migraine cơ năng (mã ICD-10: G43.0) kèm căng thẳng thần kinh.',
    time: '14:05',
    attachmentTitle: 'Kết quả MRI Sọ Não & Mạch Máu (#CLS-2024-9042)',
    attachmentSubtitle: 'Bình thường • Không dị dạng mạch máu não',
  },
  {
    id: 'dc-4',
    sender: 'doctor',
    text: 'Bác sĩ đã kê đơn thuốc điều trị cắt cơn và dự phòng uống buổi tối trong 14 ngày. Anh xem có thắc mắc gì về liều dùng không nhé?',
    time: '14:06',
  },
];

export const TeleconsultationScreen: React.FC<{
  doctor?: DoctorItem;
  onBack?: () => void;
  onFinishChat?: () => void;
  onOpenLabResults?: () => void;
}> = ({ doctor: propDoctor, onBack, onFinishChat, onOpenLabResults }) => {
  const { latestBooking, patientProfile, cloudProfile, doctors, appointments } = useAppContext();
  const isDoctorPortalUser = CLOUD_MODE && cloudProfile?.role === 'doctor';
  const doctor = resolveConsultDoctor({
    isDoctorPortalUser,
    cloudDoctorId: cloudProfile?.doctor_id,
    doctors,
    selectedDoctor: propDoctor,
    latestBookingDoctor: latestBooking.doctor,
    fallbackDoctor: DOCTORS[0],
  });

  const [messages, setMessages] = useState<DoctorChatMessage[]>(
    CLOUD_MODE ? [] : INITIAL_DOCTOR_CHAT
  );
  const [cloudMessages, setCloudMessages] = useState<ConsultMessageItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (!CLOUD_MODE || !cloudProfile) return;
    let active = true;
    const scope = {
      doctorId: doctor.id,
      ...(isDoctorPortalUser ? {} : { patientId: cloudProfile.id }),
    };
    const refresh = async () => {
      try {
        const rows = await fetchConsultMessagesCloud(scope);
        if (!active) return;
        setCloudMessages(rows);
        if (isDoctorPortalUser && rows.length > 0) {
          setSelectedPatientId((prev) => prev || rows[rows.length - 1].patientId);
        }
        setChatError('');
      } catch (err) {
        if (active) {
          setChatError(err instanceof Error ? err.message : 'Không tải được tin nhắn.');
        }
      }
    };
    void refresh();
    const unsub = subscribeConsultMessagesCloud(() => {
      void refresh();
    }, scope);
    return () => {
      active = false;
      unsub();
    };
  }, [cloudProfile, doctor.id, isDoctorPortalUser]);

  // Build unique patient threads for Doctor Portal view
  const patientThreads = React.useMemo(() => {
    if (!isDoctorPortalUser) return [];
    const map = new Map<string, string>();
    for (const m of cloudMessages) {
      if (m.patientId && m.senderRole === 'patient') {
        map.set(m.patientId, m.senderName);
      } else if (m.patientId && !map.has(m.patientId)) {
        map.set(m.patientId, `Bệnh nhân #${m.patientId.slice(0, 6).toUpperCase()}`);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cloudMessages, isDoctorPortalUser]);

  const activeThreadMessages: DoctorChatMessage[] = React.useMemo(() => {
    if (!CLOUD_MODE) return messages;
    const filtered = isDoctorPortalUser && selectedPatientId
      ? cloudMessages.filter((m) => m.patientId === selectedPatientId)
      : cloudMessages;
    const welcomeMsg: DoctorChatMessage = {
      id: 'welcome-cloud',
      sender: 'doctor',
      text: isDoctorPortalUser
        ? `Phòng tư vấn trực tuyến của ${doctor.name} (${doctor.specialty}). Chọn bệnh nhân bên trên để xem và phản hồi tin nhắn theo thời gian thực.`
        : `Xin chào ${patientProfile.name}, đây là kênh Tư vấn Trực tuyến với ${doctor.name} (${doctor.specialty}). Bạn có thể gửi triệu chứng, câu hỏi về đơn thuốc hoặc lịch khám tại đây.`,
      time: 'Trực tuyến',
    };
    return [
      welcomeMsg,
      ...filtered.map((m) => ({
        id: m.id,
        sender: (m.senderRole === 'patient' ? 'patient' : 'doctor') as 'patient' | 'doctor',
        text: m.text,
        time: m.time,
      })),
    ];
  }, [
    cloudMessages,
    doctor.name,
    doctor.specialty,
    isDoctorPortalUser,
    messages,
    patientProfile.name,
    selectedPatientId,
  ]);

  const handleSendMessage = async (customText?: string) => {
    const content = (customText ?? inputText).trim();
    if (!content || sending) return;

    if (CLOUD_MODE) {
      if (isDoctorPortalUser && !selectedPatientId && patientThreads.length === 0) {
        setChatError('Chưa có bệnh nhân nào gửi tin nhắn trong phòng chat này.');
        return;
      }
      const targetPatientId = isDoctorPortalUser
        ? selectedPatientId || patientThreads[0]?.id
        : cloudProfile?.id;
      setSending(true);
      setChatError('');
      try {
        const saved = await sendConsultMessageCloud({
          doctorId: doctor.id,
          patientId: targetPatientId,
          content,
          senderRole: isDoctorPortalUser ? 'doctor' : 'patient',
          senderName: isDoctorPortalUser ? doctor.name : patientProfile.name,
        });
        setCloudMessages((prev) =>
          prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]
        );
        if (!customText) setInputText('');
        setTimeout(() => {
          chatScrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (err) {
        setChatError(err instanceof Error ? err.message : 'Không thể gửi tin nhắn.');
      } finally {
        setSending(false);
      }
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    let doctorReply =
      'Bác sĩ đã ghi nhận. Anh nhớ uống thuốc đúng cử, hạn chế nhìn màn hình sau 21:00 và tái khám sau 2 tuần nhé!';
    if (content.toLowerCase().includes('buồn ngủ')) {
      doctorReply =
        'Thuốc Flunarizine 5mg có thể gây buồn ngủ nhẹ để hỗ trợ giấc ngủ sâu, vì vậy bác sĩ chỉ định anh uống 1 viên sau ăn tối lúc 21:00 nhé.';
    } else if (content.toLowerCase().includes('tái khám')) {
      doctorReply =
        'Anh uống hết đơn 14 ngày rồi đặt lịch tái khám trên ứng dụng. Nếu cơn đau giảm trên 80% thì chỉ cần duy trì chế độ sinh hoạt điều độ.';
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `pt-${prev.length + 1}`,
        sender: 'patient',
        text: content,
        time: timeStr,
      },
      {
        id: `dr-${prev.length + 2}`,
        sender: 'doctor',
        text: doctorReply,
        time: timeStr,
      },
    ]);
    if (!customText) {
      setInputText('');
    }
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const activePatientLabel = isDoctorPortalUser
    ? patientThreads.find((p) => p.id === selectedPatientId)?.name ||
      appointments[0]?.patientName ||
      'Tất cả bệnh nhân'
    : patientProfile.name;
  const activeBookingCode =
    (latestBooking.doctor?.id === doctor.id ? latestBooking.code : '') ||
    appointments.find((a) => a.doctor.id === doctor.id)?.code ||
    '#TUVAN-TRUCTUYEN';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Chat Trực Tuyến Với Bác Sĩ"
        subtitle={`${doctor.name} • ${doctor.specialty}`}
        onBack={onBack}
      />

      <ScrollView
        ref={chatScrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Compact Session Info & Clinical Quick-Actions Strip */}
        <AnimatedEntry delay={40} direction="up">
          <View style={[styles.card, SHADOWS.sm, { paddingVertical: 10 }]}>
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
              <Text style={[styles.docSub, { flex: 1 }]} numberOfLines={1}>
                Ca tư vấn {activeBookingCode} • BN: {activePatientLabel}
              </Text>
              <Badge label="Realtime • Trực tuyến" variant="teal" showDot />
            </View>

            {isDoctorPortalUser && patientThreads.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 10 }}
              >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {patientThreads.map((pt) => {
                    const active = pt.id === selectedPatientId;
                    return (
                      <TouchableOpacity
                        key={pt.id}
                        onPress={() => setSelectedPatientId(pt.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? COLORS.primary : COLORS.border,
                          backgroundColor: active ? COLORS.tintBlue : COLORS.surface,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: active ? COLORS.primary : COLORS.textSecondary,
                          }}
                        >
                          BN: {pt.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <AppButton
                title="Kết quả CĐHA"
                variant="tonal"
                size="sm"
                leftIcon="document-text-outline"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={onOpenLabResults}
              />
              <AppButton
                title="Đơn thuốc & Kết luận"
                variant="primary"
                size="sm"
                leftIcon="medkit-outline"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={onFinishChat || onBack}
              />
            </View>
          </View>
        </AnimatedEntry>

        {chatError ? (
          <Text accessibilityRole="alert" style={{ color: COLORS.error, marginBottom: 8 }}>
            {chatError}
          </Text>
        ) : null}

        {/* Chat Messages Thread */}
        <View style={{ marginVertical: 4 }}>
          {activeThreadMessages.map((msg, idx) => {
            const isPatient = msg.sender === 'patient';
            return (
              <AnimatedEntry key={msg.id} delay={idx < 4 ? idx * 40 : 0} distance={8} direction="up">
                <View
                  style={[
                    styles.chatRow,
                    isPatient ? styles.chatRowRight : styles.chatRowLeft,
                  ]}
                >
                  {!isPatient && (
                    <Image
                      source={{ uri: doctor.avatar }}
                      style={styles.chatAvatar}
                    />
                  )}
                  <View
                    style={[
                      styles.chatBubble,
                    isPatient
                      ? styles.chatBubblePatient
                      : styles.chatBubbleDoctor,
                  ]}
                >
                  {!isPatient && (
                    <Text style={styles.chatSenderName}>{doctor.name}</Text>
                  )}
                  <Text
                    style={[
                      styles.chatMsgText,
                      isPatient && { color: '#FFFFFF' },
                    ]}
                  >
                    {msg.text}
                  </Text>

                  {msg.attachmentTitle && (
                    <TouchableOpacity
                      style={styles.chatAttachmentCard}
                      onPress={onOpenLabResults}
                    >
                      <Ionicons
                        name="document-attach-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.chatAttachmentTitle} numberOfLines={1}>
                          {msg.attachmentTitle}
                        </Text>
                        <Text style={styles.chatAttachmentSub} numberOfLines={1}>
                          {msg.attachmentSubtitle}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  )}

                  <Text
                    style={[
                      styles.chatTimeText,
                      isPatient && { color: 'rgba(255,255,255,0.8)' },
                    ]}
                  >
                    {msg.time} {isPatient ? '• Đã xem' : ''}
                  </Text>
                </View>
              </View>
            </AnimatedEntry>
          );
        })}
      </View>

        {/* Quick Question Chips */}
        <Text style={[styles.capLabel, { marginBottom: 8, marginTop: 4 }]}>
          CÂU HỎI NHANH CHO BÁC SĨ
        </Text>
        <View style={styles.chipsWrap}>
          {[
            'Thuốc uống có gây buồn ngủ không BS?',
            'Khi nào em cần tái khám?',
            'Em cảm ơn bác sĩ nhiều ạ!',
          ].map((quickText) => (
            <TouchableOpacity
              key={quickText}
              style={styles.quickReplyChip}
              onPress={() => handleSendMessage(quickText)}
            >
              <Text style={styles.quickReplyText}>{quickText}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Real-time Message Input */}
      <ChatBottomInputBar
        value={inputText}
        onChangeText={setInputText}
        onSend={() => handleSendMessage()}
      />
    </KeyboardAvoidingView>
  );
};

// ============================================================================
// SCREEN 17B: TÓM TẮT KẾT QUẢ KHÁM & ĐƠN THUỐC SAU TƯ VẤN
// ============================================================================
export const PostConsultSummaryScreen: React.FC<{
  onBack?: () => void;
  onNavigate?: (routeKey: string) => void;
  onRebookDoctor?: (doctor: DoctorItem) => void;
}> = ({ onBack, onNavigate, onRebookDoctor }) => {
  const { prescriptions, addDoctorReview, appointments } = useAppContext();
  const doctor = appointments.find(a => a.status === 'completed')?.doctor || DOCTORS[0];
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewToast, setReviewToast] = useState(false);

  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const handleSubmitReview = async () => {
    if (savingReview || reviewSubmitted) return;
    const text = reviewComment.trim();
    if (text.length < 2 || text.length > 1000) {
      setReviewError('Vui lòng nhập nhận xét từ 2 đến 1000 ký tự.'); return;
    }
    setSavingReview(true); setReviewError('');
    try {
      await addDoctorReview({ doctorId: doctor.id, rating, comment: text });
      setReviewSubmitted(true); setReviewToast(true);
    } catch (error) { setReviewError(error instanceof Error ? error.message : 'Chưa gửi được đánh giá.'); }
    finally { setSavingReview(false); }
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Kết Quả Khám & Đơn Thuốc"
        subtitle="Hoàn tất tư vấn • Mã hồ sơ #SC-241029-8892"
        badgeText="ĐÃ HOÀN TẤT"
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {/* Clinical Diagnosis Card */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.rowBetween}>
            <Badge label="CHẨN ĐOÁN XÁC ĐỊNH" variant="teal" showDot />
            <Text style={styles.capLabel}>{formatRelativeDate(-2)} • 14:15</Text>
          </View>
          <Text style={[styles.docName, { marginTop: 8, fontSize: 16 }]}>
            G43.0 - Đau nửa đầu Migraine không có tiền triệu / Rối loạn giấc ngủ
          </Text>
          <Text style={[styles.docSub, { marginTop: 4 }]}>
            Bác sĩ điều trị: {doctor.name} ({doctor.specialty})
          </Text>

          <View style={styles.divider} />

          <Text style={styles.capLabel}>LỜI DẶN CỦA BÁC SĨ</Text>
          <Text style={styles.checkItemText}>
            • Uống thuốc đúng giờ theo đơn trong 14 ngày, không tự ý ngưng thuốc
            đột ngột.
          </Text>
          <Text style={styles.checkItemText}>
            • Giảm thời gian sử dụng máy tính/điện thoại sau 21:00, ngủ đủ 7-8
            giờ mỗi đêm.
          </Text>
          <Text style={styles.checkItemText}>
            • Tái khám sau 2 tuần ({formatRelativeDate(12)}) hoặc nhắn tin trực
            tiếp cho bác sĩ nếu cơn đau tăng nặng.
          </Text>

          <AppButton
            title={`Đặt lịch tái khám với ${doctor.name}`}
            variant="tonal"
            size="sm"
            leftIcon="calendar-outline"
            onPress={() => onRebookDoctor?.(doctor)}
            style={{ marginTop: 12 }}
          />
        </View>

        {/* E-Prescription Card */}
        <SectionHeader
          title="Đơn Thuốc Điện Tử Đã Kê"
          badgeText={`${prescriptions.length} thuốc`}
          badgeVariant="blue"
        />
        <ActivePrescriptionCard
          doctor={doctor}
          prescriptionCode="#DT-241029-01"
          date={formatRelativeDate(-2)}
          drugs={prescriptions}
          onViewOriginal={() => onNavigate?.('rxDetail')}
          onBuyMedicine={() => onNavigate?.('medicineCabinet')}
          onReminderPress={() => onNavigate?.('medLog')}
        />

        {/* Doctor Review Card */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.rowBetween}>
            <Text style={styles.docName}>Đánh giá chất lượng khám</Text>
            <Badge
              label={reviewSubmitted ? 'Đã gửi đánh giá ✓' : 'Xác thực ca khám'}
              variant={reviewSubmitted ? 'teal' : 'blue'}
            />
          </View>
          <Text style={[styles.docSub, { marginTop: 4 }]}>
            Nhận xét của bạn sẽ hiển thị trên hồ sơ của {doctor.name}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginVertical: 12,
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => !reviewSubmitted && setRating(star)}
                disabled={reviewSubmitted}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                accessibilityRole="button"
                accessibilityLabel={`Chấm ${star} sao`}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={26}
                  color={COLORS.warning}
                />
              </TouchableOpacity>
            ))}
            <Text style={[styles.docName, { marginLeft: 4 }]}>{rating}.0 / 5</Text>
          </View>

          {!reviewSubmitted ? (
            <>
              <AppInput
                label="NHẬN XÉT CỦA BẠN"
                placeholder="Chia sẻ trải nghiệm khám với bác sĩ..."
                value={reviewComment}
                onChangeText={setReviewComment}
                leftIcon="chatbox-ellipses-outline"
              />
              {reviewError ? <Text accessibilityRole="alert" style={{ color: COLORS.error }}>{reviewError}</Text> : null}
              <AppButton
                title="Gửi đánh giá bác sĩ"
                variant="primary"
                size="sm"
                leftIcon="send-outline"
                loading={savingReview}
                disabled={savingReview}
                onPress={handleSubmitReview}
              />
            </>
          ) : (
            <Text style={styles.checkItemText}>
              Cảm ơn bạn đã gửi đánh giá! Nhận xét đã được cập nhật vào trang thông tin của bác sĩ.
            </Text>
          )}
        </View>

        {/* Next Actions */}
        <AppButton
          title="Quay lại Chat với Bác sĩ"
          variant="outline"
          size="md"
          leftIcon="chatbubbles-outline"
          onPress={() => onNavigate?.('teleconsult')}
        />
      </ScrollView>
      <ToastBanner
        visible={reviewToast}
        title="Đã gửi đánh giá"
        message={`Cảm ơn bạn đã chấm ${rating} sao cho ${doctor.name}`}
        onDismiss={() => setReviewToast(false)}
      />
    </View>
  );
};

// ============================================================================
// SCREEN 18: [1:4768] KẾT QUẢ CẬN LÂM SÀNG & CĐHA
// ============================================================================
export const LabAndImagingResultsScreen: React.FC<{
  onBack?: () => void;
  onDownloadPDF?: () => void;
  onOpenTeleconsult?: () => void;
}> = ({ onBack, onDownloadPDF, onOpenTeleconsult }) => {
  const [tab, setTab] = useState('imaging');
  const [pdfToast, setPdfToast] = useState(false);
  return (
    <View style={styles.screen}>
      <AppHeader
        title="Kết Quả Cận Lâm Sàng & CĐHA"
        subtitle="Mã phiếu: #CLS-2024-9042 • Đã trả kết quả"
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {/* Meta Header Card */}
        <View style={[styles.card, SHADOWS.sm]}>
          <Badge
            label="ĐÃ CÓ KẾT QUẢ CHÍNH THỨC"
            variant="teal"
            showDot
          />
          <Text style={[styles.docName, { marginTop: 8 }]}>
            Nguyễn Văn Vũ (32 tuổi • Nam • #BN-882910)
          </Text>
          <Text style={styles.docSub}>
            Bác sĩ chỉ định: TS. BS. Lê Thu Trang (Nội Thần Kinh)
          </Text>
          <Text style={styles.docSub}>
            Cơ sở thực hiện: BV ĐHYD TP.HCM — Khoa CĐHA & Xét Nghiệm
          </Text>
          <Text style={styles.docSub}>
            Thực hiện: {formatRelativeDate(-1)} 08:45 • Trả kết quả: 10:15
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <AppButton
              title="Lưu Kết Quả PDF"
              variant="primary"
              size="sm"
              leftIcon="download-outline"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={onDownloadPDF || (() => setPdfToast(true))}
            />
            <AppButton
              title="Gửi hỏi Bác sĩ"
              variant="tonal"
              size="sm"
              leftIcon="chatbubbles-outline"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={onOpenTeleconsult}
            />
          </View>
        </View>

        <SegmentedControl
          variant="box"
          selectedKey={tab}
          onSelect={setTab}
          options={[
            { key: 'imaging', label: 'CĐHA (MRI/X-Quang)', count: 2 },
            { key: 'blood', label: 'Xét Nghiệm Máu', count: 14 },
          ]}
          style={{ marginBottom: 14 }}
        />

        {tab === 'imaging' && (
          /* Diagnostic Imaging Results */
          <View style={[styles.card, SHADOWS.sm]}>
            <SectionHeader
              title="Cộng Hưởng Từ Sọ Não (MRI 1.5 Tesla)"
              subtitle="Vùng khảo sát: Sọ não & Mạch máu nội sọ (MRA)"
            />
            <Text style={styles.checkItemText}>
              • Hệ thống não thất bên, não thất III và IV không giãn, cân đối qua
              đường giữa.
            </Text>
            <Text style={styles.checkItemText}>
              • Chuỗi xung MRA TOF 3D: Đa giác Willis và các nhánh động mạch não
              trước, giữa, sau lưu thông tốt, không phình mạch.
            </Text>
          </View>
        )}

        {tab === 'blood' && (
          /* Detailed Lab Test Results */
          <View style={[styles.card, SHADOWS.sm]}>
            <SectionHeader
              title="Bảng 14 Chỉ Số Sinh Hóa & Huyết Học"
              badgeText="14/14 Chuẩn"
              badgeVariant="teal"
            />
            {[
              { name: 'Glucose máu lúc đói', val: '5.2 mmol/L', ref: '3.9 - 6.4' },
              { name: 'HbA1c', val: '5.4 %', ref: '4.0 - 6.0' },
              { name: 'Cholesterol toàn phần', val: '4.8 mmol/L', ref: '< 5.2' },
              { name: 'Men gan AST / ALT', val: '22 / 24 U/L', ref: '< 35' },
              { name: 'Creatinine huyết thanh', val: '78 µmol/L', ref: '62 - 106' },
            ].map((lab) => (
              <View key={lab.name} style={styles.labRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <Text style={styles.docName} numberOfLines={1}>
                    {lab.name}
                  </Text>
                  <Text style={styles.docSub} numberOfLines={1}>
                    Tham chiếu: {lab.ref}
                  </Text>
                </View>
                <Text style={styles.labVal}>{lab.val}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <ToastBanner
        visible={pdfToast}
        title="Lưu PDF Thành Công"
        message="Đã tải phiếu kết quả cận lâm sàng #CLS-2024-9042 về máy."
        onDismiss={() => setPdfToast(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollPad: { padding: SPACING.md, paddingBottom: 32 },
  card: {
    ...LAYOUT.card,
  },
  patientDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  patientDetailLabel: {
    width: 96,
    flexShrink: 0,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  patientDetailValue: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  cardCenter: {
    ...LAYOUT.card,
    padding: 18,
    alignItems: 'center',
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.tintTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  capLabel: {
    fontSize: TYPOGRAPHY.size.xxs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  ticketCode: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceContainer,
  },
  docName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  docSub: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  docHospital: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  ticketGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.sm,
  },
  ticketBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  ticketVal: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 2,
  },
  qrMockBox: {
    padding: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    marginVertical: SPACING.sm,
  },
  quickGrid3: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickBtnCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    gap: 6,
  },
  quickBtnLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  checkItemText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: SPACING.xxs,
  },
  heroCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  whiteTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },
  whiteSub: {
    fontSize: TYPOGRAPHY.size.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  whiteBody: {
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 18,
    color: COLORS.textOnPrimary,
    marginTop: SPACING.xs,
  },
  memberNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 10,
    gap: SPACING.xs,
  },
  memberNoteText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.xs,
    lineHeight: 17,
    color: COLORS.textPrimary,
  },
  vitals3Grid: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: 'center',
  },
  vitalBig: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 2,
  },
  vitalTag: {
    fontSize: TYPOGRAPHY.size.xxs,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: 14,
  },
  dropdownWrap: {
    marginBottom: 14,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownTriggerActive: {
    borderColor: COLORS.primary,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  dropdownValueText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dropdownOptionRowActive: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  dropdownOptionText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dropdownOptionTextActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  chatRowLeft: {
    justifyContent: 'flex-start',
  },
  chatRowRight: {
    justifyContent: 'flex-end',
  },
  chatAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceContainer,
  },
  chatBubble: {
    maxWidth: '82%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.sm,
  },
  chatBubbleDoctor: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatBubblePatient: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  chatSenderName: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xxs,
  },
  chatMsgText: {
    fontSize: TYPOGRAPHY.size.md,
    lineHeight: 19,
    color: COLORS.textPrimary,
  },
  chatAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  chatAttachmentTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    color: COLORS.primary,
  },
  chatAttachmentSub: {
    fontSize: TYPOGRAPHY.size.xxs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chatTimeText: {
    fontSize: TYPOGRAPHY.size.xxs,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  quickReplyChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.switchTrackOff,
  },
  quickReplyText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  labVal: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
