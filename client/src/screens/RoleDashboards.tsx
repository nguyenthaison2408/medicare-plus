import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, GRADIENTS, LAYOUT, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../theme';
import {
  DOCTORS,
  PATIENT_PROFILE,
  SPECIALTIES,
  formatRelativeDate,
  getRelativeDayMeta,
  type AppointmentItem,
} from '../data/mockData';
import { useAppContext } from '../context/AppContext';
import {
  getShiftLabel,
  type DoctorShiftType,
  type BhytConfigItem,
} from '../services/clinicAdmin';
import { CLOUD_MODE } from '../services/supabaseClient';
import {
  fetchConsultMessagesCloud,
  sendConsultMessageCloud,
  subscribeConsultMessagesCloud,
  type ConsultMessageItem,
} from '../services/clinicChat';
import { ClinicStaffScreen, extractBookingCode } from './ClinicStaffScreen';
import { DoctorLabUploadModal } from '../components/medical/DoctorLabUploadModal';
import { LabFileViewerModal } from '../components/medical/LabFileViewerModal';
import type { LabResultItem } from '../types/labResults';
import { LAB_CATEGORY_META, formatLabFileSize } from '../utils/labResultValidation';
import { promptImagePicker } from '../services/imagePickerService';
import {
  AppHeader,
  AppButton,
  AppInput,
  Badge,
  SectionHeader,
  SegmentedControl,
  SettingToggleRow,
  ToastBanner,
  AnimatedEntry,
  PulsingDot,
  WeeklyLoadChart,
  SegmentBreakdownBar,
  SpecialtyDistributionChart,
  ChatBottomInputBar,
  getAppointmentDateKey,
  formatVnd,
} from '../components';

// ==========================================
// 1. ADMIN PORTAL (QUẢN TRỊ VIÊN HỆ THỐNG)
// ==========================================
export interface AdminDashboardScreenProps {
  onLogout: () => void;
  onNavigate?: (routeKey: string) => void;
}

type AdminTab = 'overview' | 'doctors' | 'schedules' | 'appointments' | 'settings' | 'reception';

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onLogout,
  onNavigate,
}) => {
  const {
    appointments,
    cancelAppointment,
    doctors,
    addDoctor,
    approveDoctor,
    updateDoctorAvatar,
    hospitals,
    addHospital,
    familyMembers,
    doctorSchedules,
    saveDoctorSchedule,
    deleteDoctorSchedule,
    bhytConfigs,
    saveBhytConfig,
    toggleBhytConfig,
    deleteBhytConfig,
    doctorReviews,
    moderateDoctorReview,
    deleteDoctorReview,
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [docSectionTab, setDocSectionTab] = useState<'list' | 'reviews'>('list');
  const [reviewModFilter, setReviewModFilter] = useState<'all' | 'visible' | 'hidden' | 'low'>('all');
  const [docFilter, setDocFilter] = useState('all');
  const [searchDoc, setSearchDoc] = useState('');
  const [autoSyncVssID, setAutoSyncVssID] = useState(true);
  const [autoGdtTax, setAutoGdtTax] = useState(true);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // State Phân lịch trực Bác sĩ
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { iso, label };
  });
  const [schedDoctorId, setSchedDoctorId] = useState(doctors[0]?.id || 'doc-1');
  const [schedDoctorDropdownOpen, setSchedDoctorDropdownOpen] = useState(false);
  const [schedDate, setSchedDate] = useState(upcomingDates[0].iso);
  const [schedShift, setSchedShift] = useState<DoctorShiftType>('morning');
  const [schedRoom, setSchedRoom] = useState('P.302 • Tầng 3, Tòa nhà A');
  const [schedSaving, setSchedSaving] = useState(false);

  // State Cấu hình chính sách BHYT
  const [bhytEditId, setBhytEditId] = useState<string | null>(null);
  const [bhytPrefix, setBhytPrefix] = useState('');
  const [bhytGroupName, setBhytGroupName] = useState('');
  const [bhytInRate, setBhytInRate] = useState('80');
  const [bhytOutRate, setBhytOutRate] = useState('40');
  const [bhytSaving, setBhytSaving] = useState(false);
  const [bhytError, setBhytError] = useState('');

  // Biểu mẫu thêm bác sĩ
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocDegree, setNewDocDegree] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState(SPECIALTIES[0].name);
  const [newDocHospitalId, setNewDocHospitalId] = useState(
    hospitals[0]?.id || 'hosp-0'
  );
  const [customHospName, setCustomHospName] = useState('');
  const [customHospAddress, setCustomHospAddress] = useState('');
  const [customHospLatitude, setCustomHospLatitude] = useState('');
  const [customHospLongitude, setCustomHospLongitude] = useState('');
  const [newDocFee, setNewDocFee] = useState('300000');
  const [newDocExp, setNewDocExp] = useState('5');
  const [newDocLicense, setNewDocLicense] = useState('');
  const [newDocAvatar, setNewDocAvatar] = useState('');
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);

  // Chỉnh sửa ảnh đại diện cho bác sĩ hiện có
  const [editingAvatarDocId, setEditingAvatarDocId] = useState<string | null>(null);
  const [editingAvatarUrl, setEditingAvatarUrl] = useState('');
  const [editingAvatarSaving, setEditingAvatarSaving] = useState(false);
  const [editingAvatarError, setEditingAvatarError] = useState('');

  const pickDoctorImageFromDevice = (onPicked: (dataUri: string) => void) => {
    promptImagePicker({
      title: 'Ảnh bác sĩ',
      message: 'Bạn muốn chụp ảnh mới hay chọn ảnh có sẵn trong thư viện?',
      aspect: [1, 1],
      quality: 0.6,
      onSuccess: onPicked,
      onError: (msg) => {
        setEditingAvatarError(msg);
        setDocErrors((p) => ({ ...p, avatar: msg }));
      },
    });
  };

  const handleSaveDoctorAvatar = async (docId: string, docName: string) => {
    setEditingAvatarError('');
    setEditingAvatarSaving(true);
    try {
      await updateDoctorAvatar(docId, editingAvatarUrl);
      setEditingAvatarDocId(null);
      setEditingAvatarUrl('');
      setAdminToast(`Đã cập nhật ảnh đại diện mới cho ${docName}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật ảnh bác sĩ.';
      setEditingAvatarError(msg);
      Alert.alert('Lỗi cập nhật ảnh', msg);
    } finally {
      setEditingAvatarSaving(false);
    }
  };

  // Biểu mẫu thêm bệnh viện liên kết độc lập
  const [showAddHosp, setShowAddHosp] = useState(false);
  const [hospName, setHospName] = useState('');
  const [hospAddress, setHospAddress] = useState('');
  const [hospPhone, setHospPhone] = useState('');
  const [hospGate, setHospGate] = useState('');
  const [hospLatitude, setHospLatitude] = useState('');
  const [hospLongitude, setHospLongitude] = useState('');
  const [hospErrors, setHospErrors] = useState<Record<string, string>>({});
  const [isSavingHospital, setIsSavingHospital] = useState(false);

  useEffect(() => {
    if (
      hospitals.length > 0 &&
      newDocHospitalId !== 'custom' &&
      !hospitals.some(hospital => hospital.id === newDocHospitalId)
    ) {
      setNewDocHospitalId(hospitals[0].id);
    }
  }, [hospitals, newDocHospitalId]);

  // Số liệu tính từ dữ liệu thật trong AppContext
  const upcomingCount = appointments.filter((a) => a.status === 'upcoming').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;
  const todayKey = getRelativeDayMeta(0).fullDate;
  const todayCount = appointments.filter(
    (a) => a.status !== 'cancelled' && getAppointmentDateKey(a) === todayKey
  ).length;
  const paidOnline = appointments.filter(
    (a) => a.status !== 'cancelled' && a.statusBadge.includes('Đã thanh toán')
  );
  const bhytHolds = appointments.filter(
    (a) => a.status !== 'cancelled' && a.statusBadge.includes('BHYT')
  );
  const otherPayments =
    appointments.filter((a) => a.status !== 'cancelled').length -
    paidOnline.length -
    bhytHolds.length;
  const onlineRevenue = paidOnline.reduce((s, a) => s + a.doctor.feeNumeric, 0);
  const verifiedDocs = doctors.filter((d) => d.verified).length;
  const pendingDocs = doctors.length - verifiedDocs;
  const activeSpecialties = new Set(
    doctors.filter((d) => d.verified).map((d) => d.specialty)
  ).size;

  const filteredAdminDoctors = doctors.filter((d) => {
    if (docFilter === 'active' && !d.verified) return false;
    if (docFilter === 'pending' && d.verified) return false;
    const q = searchDoc.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.hospital.toLowerCase().includes(q) ||
      d.bio.toLowerCase().includes(q)
    );
  });

  const resetDocForm = () => {
    setNewDocName('');
    setNewDocDegree('');
    setNewDocSpecialty(SPECIALTIES[0].name);
    setNewDocHospitalId(hospitals[0]?.id || 'hosp-0');
    setCustomHospName('');
    setCustomHospAddress('');
    setCustomHospLatitude('');
    setCustomHospLongitude('');
    setNewDocFee('300000');
    setNewDocExp('5');
    setNewDocLicense('');
    setNewDocAvatar('');
    setDocErrors({});
  };

  const handleSubmitDoctor = async () => {
    const errors: Record<string, string> = {};
    const fee = Number(newDocFee.replace(/[^0-9]/g, ''));
    const exp = Number(newDocExp.replace(/[^0-9]/g, ''));
    const customLatitude = Number(customHospLatitude.replace(',', '.'));
    const customLongitude = Number(customHospLongitude.replace(',', '.'));
    if (newDocName.trim().length < 5) {
      errors.name = 'Nhập đầy đủ học hàm và họ tên (VD: BS. Nguyễn Văn A)';
    }
    if (newDocLicense.trim().length < 4) {
      errors.license = 'Nhập mã chứng chỉ hành nghề (CCHN) do Sở Y tế cấp';
    }
    if (newDocHospitalId === 'custom' && customHospName.trim().length < 4) {
      errors.customHosp = 'Nhập tên bệnh viện / cơ sở y tế công tác';
    }
    if (newDocHospitalId === 'custom' && (!customHospLatitude.trim() || !Number.isFinite(customLatitude) || customLatitude < -90 || customLatitude > 90)) {
      errors.customLatitude = 'Vĩ độ phải nằm trong khoảng -90 đến 90';
    }
    if (newDocHospitalId === 'custom' && (!customHospLongitude.trim() || !Number.isFinite(customLongitude) || customLongitude < -180 || customLongitude > 180)) {
      errors.customLongitude = 'Kinh độ phải nằm trong khoảng -180 đến 180';
    }
    if (!newDocFee.trim() || Number.isNaN(fee) || fee < 50000) {
      errors.fee = 'Phí khám tối thiểu 50.000 đ';
    }
    if (!newDocExp.trim() || Number.isNaN(exp) || exp > 60) {
      errors.exp = 'Số năm kinh nghiệm từ 0 đến 60';
    }
    setDocErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingDoctor(true);
    try {
      const hospital =
        newDocHospitalId === 'custom'
          ? await addHospital({
              name: customHospName,
              address: customHospAddress || 'TP. Hồ Chí Minh',
              latitude: customLatitude,
              longitude: customLongitude,
            })
          : hospitals.find((h) => h.id === newDocHospitalId) || hospitals[0];
      if (!hospital) throw new Error('Vui lòng chọn cơ sở y tế công tác.');
      const created = await addDoctor({
        name: newDocName,
        degree: newDocDegree,
        specialty: newDocSpecialty,
        hospital: hospital.name,
        address: hospital.address,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        feeNumeric: fee,
        experienceYears: exp,
        licenseCode: newDocLicense,
        avatar: newDocAvatar.trim() || undefined,
      });
      resetDocForm();
      setShowAddDoc(false);
      setDocFilter('pending');
      setAdminToast(`Đã thêm ${created.name}. Hồ sơ đang chờ duyệt CCHN.`);
    } catch (error) {
      setDocErrors(prev => ({
        ...prev,
        customHosp: error instanceof Error ? error.message : 'Chưa lưu được cơ sở y tế.',
      }));
    } finally {
      setIsSavingDoctor(false);
    }
  };

  const handleSubmitHospital = async () => {
    const errors: Record<string, string> = {};
    const latitude = Number(hospLatitude.replace(',', '.'));
    const longitude = Number(hospLongitude.replace(',', '.'));
    if (hospName.trim().length < 4) {
      errors.name = 'Vui lòng nhập tên bệnh viện hoặc phòng khám';
    }
    if (hospAddress.trim().length < 6) {
      errors.address = 'Vui lòng nhập địa chỉ cơ sở y tế';
    }
    if (!hospLatitude.trim() || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = 'Vĩ độ phải nằm trong khoảng -90 đến 90';
    }
    if (!hospLongitude.trim() || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = 'Kinh độ phải nằm trong khoảng -180 đến 180';
    }
    setHospErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingHospital(true);
    try {
      const created = await addHospital({
        name: hospName,
        address: hospAddress,
        phone: hospPhone,
        gateInfo: hospGate,
        latitude,
        longitude,
      });
      setHospName('');
      setHospAddress('');
      setHospPhone('');
      setHospGate('');
      setHospLatitude('');
      setHospLongitude('');
      setHospErrors({});
      setShowAddHosp(false);
      setAdminToast(
        `Đã thêm cơ sở "${created.name}". Đã đồng bộ ra Trang chủ & Bản đồ!`
      );
    } catch (error) {
      setHospErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Chưa lưu được cơ sở y tế.',
      }));
    } finally {
      setIsSavingHospital(false);
    }
  };

  const renderOverview = () => (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      showsVerticalScrollIndicator={false}
    >
      {/* Admin Identity Hero Banner */}
      <AnimatedEntry delay={40} direction="up">
        <LinearGradient
          colors={['#0F172A', '#004B73', '#006A61']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, SHADOWS.md]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroUserRow}>
              <View style={styles.adminAvatarCircle}>
                <Ionicons name="shield-checkmark" size={24} color="#86F2E4" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.heroName}>Admin Hệ Thống</Text>
                  <Badge label="SUPER ADMIN" variant="teal" />
                </View>
                <Text style={styles.heroEmail}>admin@medicare.vn • Toàn quyền</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroMetricsStrip}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>Hoạt động</Text>
              <Text style={styles.heroMetricLabel}>Trạng thái hệ thống</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>HL7/FHIR</Text>
              <Text style={styles.heroMetricLabel}>Chuẩn dữ liệu</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>Realtime</Text>
              <Text style={styles.heroMetricLabel}>Đồng bộ lịch khám</Text>
            </View>
          </View>
        </LinearGradient>
      </AnimatedEntry>

      {/* 4 KPI Stat Cards (Calculated from real AppContext state) */}
      <AnimatedEntry delay={40} direction="up">
        <SectionHeader
          title="Số liệu vận hành thực tế"
          subtitle={`Cập nhật ngày ${formatRelativeDate(0)}`}
        />
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, SHADOWS.sm]}>
            <View style={styles.kpiTop}>
              <View style={styles.kpiIconBlue}>
                <Ionicons name="calendar" size={18} color={COLORS.primary} />
              </View>
              <Badge label={`Hôm nay: ${todayCount}`} variant="teal" />
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {appointments.length}
            </Text>
            <Text style={styles.kpiTitle} numberOfLines={1}>
              Tổng lịch hẹn hệ thống
            </Text>
            <Text style={styles.kpiSub} numberOfLines={1}>
              {upcomingCount} sắp tới • {completedCount} hoàn tất
            </Text>
          </View>

          <View style={[styles.kpiCard, SHADOWS.sm]}>
            <View style={styles.kpiTop}>
              <View style={styles.kpiIconTeal}>
                <Ionicons name="cash-outline" size={18} color={COLORS.secondary} />
              </View>
              <Badge label={`${paidOnline.length} đơn online`} variant="teal" />
            </View>
            <Text style={[styles.kpiValue, { color: COLORS.secondary }]} numberOfLines={1}>
              {formatVnd(onlineRevenue)}
            </Text>
            <Text style={styles.kpiTitle} numberOfLines={1}>
              Thu viện phí trực tuyến
            </Text>
            <Text style={styles.kpiSub} numberOfLines={1}>
              {bhytHolds.length} phiếu giữ chỗ BHYT
            </Text>
          </View>

          <View style={[styles.kpiCard, SHADOWS.sm]}>
            <View style={styles.kpiTop}>
              <View style={styles.kpiIconBlue}>
                <Ionicons name="medkit-outline" size={18} color={COLORS.primary} />
              </View>
              <Badge
                label={pendingDocs > 0 ? `${pendingDocs} chờ duyệt` : '100% duyệt'}
                variant={pendingDocs > 0 ? 'warning' : 'blue'}
              />
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {verifiedDocs} / {doctors.length}
            </Text>
            <Text style={styles.kpiTitle} numberOfLines={1}>
              Bác sĩ đã xác thực CCHN
            </Text>
            <Text style={styles.kpiSub} numberOfLines={1}>
              {activeSpecialties} chuyên khoa hoạt động
            </Text>
          </View>

          <View style={[styles.kpiCard, SHADOWS.sm]}>
            <View style={styles.kpiTop}>
              <View style={styles.kpiIconTeal}>
                <Ionicons name="people-outline" size={18} color={COLORS.secondary} />
              </View>
              <Badge label="Đồng bộ VssID" variant="teal" />
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {1 + familyMembers.length}
            </Text>
            <Text style={styles.kpiTitle} numberOfLines={1}>
              Hồ sơ bệnh nhân EHR
            </Text>
            <Text style={styles.kpiSub} numberOfLines={1}>
              1 chủ hộ + {familyMembers.length} thành viên
            </Text>
          </View>
        </View>
      </AnimatedEntry>

      {/* Chart 1: Weekly Appointment Load (7 Days) */}
      <AnimatedEntry delay={50} direction="up">
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Biểu đồ lịch khám 7 ngày tới"
            leftIcon="stats-chart-outline"
          />
          <WeeklyLoadChart appointments={appointments} />
        </View>
      </AnimatedEntry>

      {/* Chart 2: Appointment Status & Payment Breakdown */}
      <AnimatedEntry delay={60} direction="up">
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Tỷ lệ trạng thái lịch hẹn"
            leftIcon="pie-chart-outline"
          />
          <SegmentBreakdownBar
            data={[
              {
                key: 'upcoming',
                label: 'Sắp tới (Chờ khám)',
                value: upcomingCount,
                color: COLORS.primary,
              },
              {
                key: 'completed',
                label: 'Đã hoàn tất khám',
                value: completedCount,
                color: COLORS.secondary,
              },
              {
                key: 'cancelled',
                label: 'Đã hủy lịch',
                value: cancelledCount,
                color: COLORS.error,
              },
            ]}
          />

          <View style={{ height: 1, backgroundColor: COLORS.divider, marginVertical: 14 }} />

          <Text style={[styles.docName, { marginBottom: 10 }]}>
            Cơ cấu hình thức thanh toán & BHYT
          </Text>
          <SegmentBreakdownBar
            data={[
              {
                key: 'online',
                label: 'Đã thanh toán Online (VietQR/VNPAY/MoMo)',
                value: paidOnline.length,
                color: COLORS.secondary,
              },
              {
                key: 'bhyt',
                label: 'Giữ chỗ đối chiếu BHYT tại viện',
                value: bhytHolds.length,
                color: COLORS.warning,
              },
              {
                key: 'confirmed',
                label: 'Lịch hẹn tiêu chuẩn đã xác nhận',
                value: Math.max(0, otherPayments),
                color: COLORS.primary,
              },
            ]}
          />
        </View>
      </AnimatedEntry>

      {/* Chart 3: Specialty Load Distribution (Dynamic from appointments) */}
      <AnimatedEntry delay={60} direction="up">
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Phân bổ lịch khám theo chuyên khoa"
            leftIcon="bar-chart-outline"
          />
          <SpecialtyDistributionChart appointments={appointments} />
        </View>
      </AnimatedEntry>
    </ScrollView>
  );

  const renderDoctorsManagement = () => {
    const filteredModReviews = doctorReviews.filter((r) => {
      if (reviewModFilter === 'visible') return !r.isHidden;
      if (reviewModFilter === 'hidden') return Boolean(r.isHidden);
      if (reviewModFilter === 'low') return r.rating <= 3;
      return true;
    });

    return (
      <ScrollView
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SegmentedControl
          variant="box"
          selectedKey={docSectionTab}
          onSelect={(k) => setDocSectionTab(k as 'list' | 'reviews')}
          options={[
            { key: 'list', label: `Danh sách Bác sĩ (${doctors.length})` },
            { key: 'reviews', label: `Đánh giá & Bình luận (${doctorReviews.length})` },
          ]}
          style={{ marginBottom: 14 }}
        />

        {docSectionTab === 'reviews' ? (
          <View>
            <SectionHeader
              title="Bảng đánh giá chất lượng Bác sĩ"
              subtitle="Tính trực tiếp từ bình luận đã xác thực lượt khám"
              leftIcon="star-outline"
            />

            {doctors.map((d) => {
              const allForDoc = doctorReviews.filter((r) => r.doctorId === d.id);
              const visibleForDoc = allForDoc.filter((r) => !r.isHidden);
              const hiddenCount = allForDoc.length - visibleForDoc.length;
              const lowCount = visibleForDoc.filter((r) => r.rating <= 2).length;
              const avgScore =
                visibleForDoc.length > 0
                  ? (visibleForDoc.reduce((s, r) => s + r.rating, 0) / visibleForDoc.length).toFixed(1)
                  : '—';
              return (
                <View key={d.id} style={[styles.card, SHADOWS.sm]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: d.avatar }} style={styles.docAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.docName}>{d.name}</Text>
                      <Text style={styles.docSub}>
                        {d.specialty} • {d.hospital}
                      </Text>
                      <Text style={styles.docMeta}>
                        Điểm TB: ★ {avgScore} • {visibleForDoc.length} hiển thị
                        {hiddenCount > 0 ? ` • ${hiddenCount} đã ẩn` : ''}
                      </Text>
                    </View>
                    <Badge
                      label={
                        lowCount > 0
                          ? `Cảnh báo ${lowCount} đánh giá thấp`
                          : visibleForDoc.length > 0
                          ? `★ ${avgScore}/5`
                          : 'Chưa có'
                      }
                      variant={lowCount > 0 ? 'danger' : visibleForDoc.length > 0 ? 'teal' : 'surface'}
                    />
                  </View>
                </View>
              );
            })}

            <SectionHeader
              title={`Kiểm duyệt bình luận (${filteredModReviews.length})`}
              subtitle="Ẩn hoặc xóa bình luận xấu / spam khỏi giao diện bệnh nhân"
              leftIcon="shield-checkmark-outline"
            />

            <SegmentedControl
              variant="chips"
              selectedKey={reviewModFilter}
              onSelect={(k) => setReviewModFilter(k as 'all' | 'visible' | 'hidden' | 'low')}
              options={[
                { key: 'all', label: `Tất cả (${doctorReviews.length})` },
                { key: 'visible', label: `Đang hiển thị (${doctorReviews.filter((r) => !r.isHidden).length})` },
                { key: 'hidden', label: `Đã ẩn (${doctorReviews.filter((r) => r.isHidden).length})` },
                { key: 'low', label: `≤ 3 sao (${doctorReviews.filter((r) => r.rating <= 3).length})` },
              ]}
              style={{ marginBottom: 12 }}
            />

            {filteredModReviews.length === 0 ? (
              <View style={[styles.card, SHADOWS.sm, { alignItems: 'center', paddingVertical: 24 }]}>
                <Ionicons name="chatbubble-outline" size={32} color={COLORS.textMuted} />
                <Text style={[styles.docSub, { marginTop: 8 }]}>
                  Không có bình luận nào trong mục này.
                </Text>
              </View>
            ) : (
              filteredModReviews.map((rev) => {
                const doc = doctors.find((d) => d.id === rev.doctorId);
                return (
                  <View key={rev.id} style={[styles.card, SHADOWS.sm]}>
                    <View style={styles.aptRowTop}>
                      <Badge
                        label={`${'★'.repeat(rev.rating)} (${rev.rating}/5)`}
                        variant={rev.rating <= 2 ? 'danger' : rev.rating <= 3 ? 'warning' : 'teal'}
                      />
                      <Badge
                        label={rev.isHidden ? 'Đã ẩn khỏi bệnh nhân' : 'Đang hiển thị'}
                        variant={rev.isHidden ? 'warning' : 'blue'}
                        showDot
                      />
                    </View>
                    <Text style={styles.docName}>{rev.authorName}</Text>
                    <Text style={styles.docSub}>
                      Bác sĩ: {doc?.name || rev.doctorId} • {rev.metaText}
                    </Text>
                    <View style={styles.symptomBox}>
                      <Text style={styles.symptomText}>{`"${rev.comment}"`}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <AppButton
                        title={rev.isHidden ? 'Hiện lại bình luận' : 'Ẩn bình luận'}
                        variant={rev.isHidden ? 'tonal' : 'outline'}
                        size="sm"
                        leftIcon={rev.isHidden ? 'eye-outline' : 'eye-off-outline'}
                        fullWidth={false}
                        style={{ flex: 1 }}
                        onPress={async () => {
                          await moderateDoctorReview(
                            rev.id,
                            !rev.isHidden,
                            !rev.isHidden ? 'Ẩn bởi Admin' : ''
                          );
                          setAdminToast(
                            !rev.isHidden
                              ? `Đã ẩn bình luận của ${rev.authorName}.`
                              : `Đã hiển thị lại bình luận của ${rev.authorName}.`
                          );
                        }}
                      />
                      <AppButton
                        title="Xóa"
                        variant="dangerOutline"
                        size="sm"
                        leftIcon="trash-outline"
                        fullWidth={false}
                        onPress={async () => {
                          await deleteDoctorReview(rev.id);
                          setAdminToast(`Đã xóa vĩnh viễn bình luận của ${rev.authorName}.`);
                        }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <View>
      <AppInput
        leftIcon="search-outline"
        placeholder="Tìm bác sĩ theo tên, mã CCHN, chuyên khoa..."
        value={searchDoc}
        onChangeText={setSearchDoc}
      />

      <SegmentedControl
        variant="chips"
        selectedKey={docFilter}
        onSelect={setDocFilter}
        options={[
          { key: 'all', label: `Tất cả (${doctors.length})` },
          { key: 'active', label: `Đang trực (${verifiedDocs})` },
          { key: 'pending', label: `Chờ duyệt CCHN (${pendingDocs})` },
        ]}
        style={{ marginBottom: 14 }}
      />

      <AppButton
        title={
          showAddDoc
            ? 'Đóng biểu mẫu thêm bác sĩ'
            : '+ Thêm bác sĩ mới vào hệ thống'
        }
        variant={showAddDoc ? 'outline' : 'primary'}
        size="md"
        leftIcon={showAddDoc ? 'close-outline' : 'person-add-outline'}
        onPress={() => setShowAddDoc((prev) => !prev)}
        style={{ marginBottom: 14 }}
      />

      {showAddDoc && (
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Cấp hồ sơ Bác sĩ & Chứng chỉ hành nghề"
            leftIcon="medkit-outline"
          />

          {/* Upload ảnh bác sĩ */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: COLORS.surfaceContainerLow,
              borderRadius: RADIUS.md,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: COLORS.outlineVariant,
            }}
          >
            {newDocAvatar.trim() ? (
              <Image
                source={{ uri: newDocAvatar.trim() }}
                style={styles.docAvatar}
              />
            ) : (
              <View
                style={[
                  styles.docAvatar,
                  {
                    backgroundColor: COLORS.primaryContainer,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>Ảnh chân dung Bác sĩ</Text>
              <Text style={styles.docSub}>
                Tải ảnh trực tiếp từ máy hoặc dán đường dẫn URL ảnh
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <AppButton
                  title="Tải ảnh từ máy"
                  variant="tonal"
                  size="sm"
                  leftIcon="cloud-upload-outline"
                  fullWidth={false}
                  onPress={() =>
                    pickDoctorImageFromDevice((dataUri) => {
                      setNewDocAvatar(dataUri);
                      if (docErrors.avatar) setDocErrors((p) => ({ ...p, avatar: '' }));
                    })
                  }
                />
                {newDocAvatar ? (
                  <AppButton
                    title="Xóa ảnh"
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    onPress={() => setNewDocAvatar('')}
                  />
                ) : null}
              </View>
            </View>
          </View>
          <AppInput
            label="HOẶC DÁN LINK ẢNH BÁC SĨ (URL)"
            placeholder="https://..."
            value={newDocAvatar.startsWith('data:image/') ? '' : newDocAvatar}
            onChangeText={(v) => {
              setNewDocAvatar(v);
              if (docErrors.avatar) setDocErrors((p) => ({ ...p, avatar: '' }));
            }}
            error={docErrors.avatar}
            leftIcon="image-outline"
            autoCapitalize="none"
          />

          <AppInput
            label="HỌ TÊN & HỌC HÀM / HỌC VỊ (*)"
            placeholder="VD: ThS. BS. Phạm Quốc Bảo"
            value={newDocName}
            onChangeText={(v) => {
              setNewDocName(v);
              if (docErrors.name) setDocErrors((p) => ({ ...p, name: '' }));
            }}
            error={docErrors.name}
            leftIcon="person-outline"
          />
          <AppInput
            label="CHỨC DANH / CHUYÊN MÔN SÂU"
            placeholder="VD: Chuyên gia Nội Cơ Xương Khớp"
            value={newDocDegree}
            onChangeText={setNewDocDegree}
            leftIcon="ribbon-outline"
          />
          <AppInput
            label="MÃ CHỨNG CHỈ HÀNH NGHỀ (CCHN) (*)"
            placeholder="VD: 048291/HCM-CCHN"
            value={newDocLicense}
            onChangeText={(v) => {
              setNewDocLicense(v);
              if (docErrors.license) setDocErrors((p) => ({ ...p, license: '' }));
            }}
            error={docErrors.license}
            leftIcon="shield-checkmark-outline"
          />

          <Text style={[styles.docSub, { fontWeight: '700', marginBottom: 6 }]}>
            CHỌN CHUYÊN KHOA (*)
          </Text>
          <SegmentedControl
            variant="chips"
            selectedKey={newDocSpecialty}
            onSelect={setNewDocSpecialty}
            options={SPECIALTIES.map((s) => ({ key: s.name, label: s.name }))}
            style={{ marginBottom: 12 }}
          />

          <Text style={[styles.docSub, { fontWeight: '700', marginBottom: 6 }]}>
            BỆNH VIỆN CÔNG TÁC (*)
          </Text>
          <SegmentedControl
            variant="chips"
            selectedKey={newDocHospitalId}
            onSelect={setNewDocHospitalId}
            options={[
              ...hospitals.map((h) => ({ key: h.id, label: h.name })),
              { key: 'custom', label: '+ Nhập bệnh viện mới' },
            ]}
            style={{ marginBottom: 12 }}
          />

          {newDocHospitalId === 'custom' && (
            <>
              <AppInput
                label="TÊN BỆNH VIỆN / CƠ SỞ Y TẾ MỚI (*)"
                placeholder="VD: Bệnh viện Nhân Dân 115"
                value={customHospName}
                onChangeText={(v) => {
                  setCustomHospName(v);
                  if (docErrors.customHosp)
                    setDocErrors((p) => ({ ...p, customHosp: '' }));
                }}
                error={docErrors.customHosp}
                leftIcon="business-outline"
              />
              <AppInput
                label="ĐỊA CHỈ CƠ SỞ Y TẾ"
                placeholder="VD: 527 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM"
                value={customHospAddress}
                onChangeText={setCustomHospAddress}
                leftIcon="location-outline"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AppInput
                  label="VĨ ĐỘ (*)"
                  placeholder="10.755341"
                  keyboardType="decimal-pad"
                  value={customHospLatitude}
                  onChangeText={setCustomHospLatitude}
                  error={docErrors.customLatitude}
                  containerStyle={{ flex: 1 }}
                />
                <AppInput
                  label="KINH ĐỘ (*)"
                  placeholder="106.664971"
                  keyboardType="decimal-pad"
                  value={customHospLongitude}
                  onChangeText={setCustomHospLongitude}
                  error={docErrors.customLongitude}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="PHÍ TƯ VẤN (VNĐ) (*)"
                placeholder="300000"
                keyboardType="numeric"
                value={newDocFee}
                onChangeText={setNewDocFee}
                error={docErrors.fee}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label="SỐ NĂM KINH NGHIỆM (*)"
                placeholder="8"
                keyboardType="numeric"
                value={newDocExp}
                onChangeText={setNewDocExp}
                error={docErrors.exp}
              />
            </View>
          </View>

          <AppButton
            title="Lưu hồ sơ Bác sĩ vào hệ thống"
            variant="primary"
            size="md"
            leftIcon="checkmark-circle-outline"
            onPress={() => void handleSubmitDoctor()}
            loading={isSavingDoctor}
          />
        </View>
      )}

      {filteredAdminDoctors.map((doc) => (
        <View key={doc.id} style={[styles.card, SHADOWS.sm]}>
          <View style={styles.docManageRow}>
            <Image source={{ uri: doc.avatar }} style={styles.docAvatar} />
            <View style={styles.docManageInfoCol}>
              <View style={styles.docNameBadgeRow}>
                <Text
                  style={[styles.docName, { flexShrink: 1 }]}
                  numberOfLines={2}
                >
                  {doc.name}
                </Text>
                <Badge
                  label={doc.verified ? 'Đã xác thực' : 'Chờ duyệt CCHN'}
                  variant={doc.verified ? 'teal' : 'warning'}
                  icon={doc.verified ? 'checkmark-circle' : 'time-outline'}
                />
              </View>
              <Text style={styles.docSub} numberOfLines={1}>
                {doc.degree} • Khoa {doc.specialty}
              </Text>
              <Text style={styles.docHospitalLine} numberOfLines={1}>
                {doc.hospital}
              </Text>
              <Text style={styles.docMeta} numberOfLines={1}>
                Phí khám: {doc.fee} • {doc.experienceYears} năm KN • ★{' '}
                {doc.rating || 'Mới'} ({doc.reviewCount} lượt)
              </Text>
            </View>
          </View>

          <View style={styles.docActionRow}>
            {!doc.verified ? (
              <AppButton
                title="Duyệt CCHN & Mở lịch khám"
                variant="primary"
                size="sm"
                leftIcon="shield-checkmark-outline"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={async () => {
                  try {
                    await approveDoctor(doc.id);
                    setDocFilter('all');
                    setAdminToast(`Đã duyệt CCHN cho ${doc.name}. Bác sĩ đã hiển thị trên Trang chủ Bệnh nhân!`);
                  } catch (error) {
                    setAdminToast(error instanceof Error ? error.message : 'Chưa duyệt được bác sĩ.');
                  }
                }}
              />
            ) : (
              <>
                <AppButton
                  title="Phân lịch trực"
                  variant="tonal"
                  size="sm"
                  leftIcon="calendar-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => {
                    setSchedDoctorId(doc.id);
                    setSchedDoctorDropdownOpen(false);
                    setActiveTab('schedules');
                    setAdminToast(`Đã chọn ${doc.name} để phân ca trực.`);
                  }}
                />
                <AppButton
                  title="Đổi ảnh BS"
                  variant="outline"
                  size="sm"
                  leftIcon="camera-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (editingAvatarDocId === doc.id) {
                      setEditingAvatarDocId(null);
                      setEditingAvatarUrl('');
                      setEditingAvatarError('');
                    } else {
                      setEditingAvatarDocId(doc.id);
                      setEditingAvatarUrl(doc.avatar || '');
                      setEditingAvatarError('');
                    }
                  }}
                />
                <AppButton
                  title="BHYT"
                  variant="outline"
                  size="sm"
                  leftIcon="create-outline"
                  fullWidth={false}
                  style={{ flex: 0.7 }}
                  onPress={() => {
                    setActiveTab('settings');
                    setAdminToast(`Đã mở cấu hình BHYT áp dụng cho ${doc.name}.`);
                  }}
                />
              </>
            )}
          </View>

          {editingAvatarDocId === doc.id && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: COLORS.divider,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image
                  source={{ uri: editingAvatarUrl.trim() || doc.avatar }}
                  style={styles.docAvatar}
                />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.docSub}>
                    Cập nhật ảnh đại diện cho {doc.name}
                  </Text>
                  <AppButton
                    title="Chọn ảnh từ máy"
                    variant="tonal"
                    size="sm"
                    leftIcon="cloud-upload-outline"
                    fullWidth={false}
                    onPress={() =>
                      pickDoctorImageFromDevice((dataUri) => {
                        setEditingAvatarUrl(dataUri);
                        setEditingAvatarError('');
                      })
                    }
                  />
                </View>
              </View>
              <AppInput
                label="Hoặc dán link ảnh (URL https://...)"
                placeholder="https://..."
                value={editingAvatarUrl.startsWith('data:image/') ? '' : editingAvatarUrl}
                onChangeText={(txt) => {
                  setEditingAvatarUrl(txt);
                  if (editingAvatarError) setEditingAvatarError('');
                }}
                error={editingAvatarError}
                leftIcon="image-outline"
                autoCapitalize="none"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AppButton
                  title="Hủy"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  disabled={editingAvatarSaving}
                  onPress={() => {
                    setEditingAvatarDocId(null);
                    setEditingAvatarUrl('');
                    setEditingAvatarError('');
                  }}
                />
                <AppButton
                  title={editingAvatarSaving ? 'Đang lưu...' : 'Lưu ảnh bác sĩ'}
                  variant="primary"
                  size="sm"
                  leftIcon="checkmark-circle-outline"
                  fullWidth={false}
                  style={{ flex: 1.4 }}
                  loading={editingAvatarSaving}
                  disabled={editingAvatarSaving || !editingAvatarUrl.trim()}
                  onPress={() => void handleSaveDoctorAvatar(doc.id, doc.name)}
                />
              </View>
            </View>
          )}
        </View>
      ))}

      {/* Linked Hospitals Management Section */}
      <SectionHeader
        title={`Cơ sở y tế & Bệnh viện liên kết (${hospitals.length})`}
        actionText={showAddHosp ? 'Đóng' : '+ Thêm bệnh viện'}
        onActionPress={() => setShowAddHosp((prev) => !prev)}
      />

      {showAddHosp && (
        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={[styles.docName, { marginBottom: 10 }]}>
            Thêm Bệnh viện / Phòng khám liên kết mới
          </Text>
          <AppInput
            label="TÊN BỆNH VIỆN / PHÒNG KHÁM (*)"
            placeholder="VD: Bệnh viện Đại học Y Dược - Cơ sở 2"
            value={hospName}
            onChangeText={(v) => {
              setHospName(v);
              if (hospErrors.name) setHospErrors((p) => ({ ...p, name: '' }));
            }}
            error={hospErrors.name}
            leftIcon="business-outline"
          />
          <AppInput
            label="ĐỊA CHỈ (*)"
            placeholder="VD: 201 Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM"
            value={hospAddress}
            onChangeText={(v) => {
              setHospAddress(v);
              if (hospErrors.address)
                setHospErrors((p) => ({ ...p, address: '' }));
            }}
            error={hospErrors.address}
            leftIcon="location-outline"
          />
          <AppInput
            label="HOTLINE TỔNG ĐÀI"
            placeholder="VD: 02838555678"
            keyboardType="phone-pad"
            value={hospPhone}
            onChangeText={setHospPhone}
            leftIcon="call-outline"
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AppInput
              label="VĨ ĐỘ (*)"
              placeholder="10.755341"
              keyboardType="decimal-pad"
              value={hospLatitude}
              onChangeText={(value) => {
                setHospLatitude(value);
                if (hospErrors.latitude) setHospErrors(prev => ({ ...prev, latitude: '' }));
              }}
              error={hospErrors.latitude}
              containerStyle={{ flex: 1 }}
            />
            <AppInput
              label="KINH ĐỘ (*)"
              placeholder="106.664971"
              keyboardType="decimal-pad"
              value={hospLongitude}
              onChangeText={(value) => {
                setHospLongitude(value);
                if (hospErrors.longitude) setHospErrors(prev => ({ ...prev, longitude: '' }));
              }}
              error={hospErrors.longitude}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <AppInput
            label="HƯỚNG DẪN CỔNG VÀO & GỬI XE"
            placeholder="VD: Cổng số 1 — Khu tiếp đón Khám BHYT"
            value={hospGate}
            onChangeText={setHospGate}
            leftIcon="navigate-outline"
          />
          {!!hospErrors.submit && (
            <Text style={{ color: COLORS.error, marginBottom: 10 }}>
              {hospErrors.submit}
            </Text>
          )}
          <AppButton
            title="Lưu cơ sở y tế vào hệ thống"
            variant="primary"
            size="md"
            leftIcon="checkmark-circle-outline"
            onPress={() => void handleSubmitHospital()}
            loading={isSavingHospital}
          />
        </View>
      )}

      {hospitals.map((h) => (
        <View key={h.id} style={[styles.card, SHADOWS.sm]}>
          <View style={styles.aptRowTop}>
            <Text style={[styles.docName, { flex: 1 }]} numberOfLines={1}>
              {h.name}
            </Text>
            <Badge label={h.tag} variant="teal" />
          </View>
          <Text style={styles.docSub}>{h.address}</Text>
          <Text style={styles.docMeta}>
            Cổng vào: {h.gateInfo} • Hotline: {h.phone}
          </Text>
        </View>
      ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderAppointmentsManagement = () => (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader
        title={`Điều phối lịch hẹn toàn viện (${appointments.length})`}
        subtitle="Đồng bộ thời gian thực từ ứng dụng Bệnh nhân"
      />
      {appointments.map((apt) => {
        const badgeVariant =
          apt.status === 'cancelled'
            ? ('danger' as const)
            : apt.status === 'completed'
            ? ('teal' as const)
            : ('blue' as const);
        return (
          <View key={apt.id} style={[styles.card, SHADOWS.sm]}>
            <View style={styles.aptRowTop}>
              <Text style={styles.aptCode}>{apt.code}</Text>
              <Badge label={apt.statusBadge} variant={badgeVariant} showDot />
            </View>
            <Text style={styles.aptPatient}>
              Bệnh nhân: {apt.patientName ? `${apt.patientName} (${apt.patientPhone || 'SĐT: Chưa có'})` : 'Bệnh nhân'}
            </Text>
            <Text style={styles.aptDoc}>
              Bác sĩ phụ trách: {apt.doctor.name} ({apt.doctor.hospital})
            </Text>
            <Text style={styles.aptTime}>
              Khung giờ: {apt.timeRange} • {apt.room || 'Tư vấn trực tuyến'}
            </Text>
            {apt.status === 'upcoming' && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <AppButton
                  title="Hủy lịch hẹn"
                  variant="outline"
                  size="sm"
                  leftIcon="close-circle-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => cancelAppointment(apt.id)}
                />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  const handleSaveSchedule = async () => {
    setSchedSaving(true);
    try {
      await saveDoctorSchedule({
        doctorId: schedDoctorId,
        workDate: schedDate,
        shift: schedShift,
        room: schedRoom,
        active: true,
      });
      const docName = doctors.find((d) => d.id === schedDoctorId)?.name || schedDoctorId;
      setAdminToast(`Đã xếp lịch trực cho ${docName} (${schedDate}).`);
    } catch (err) {
      Alert.alert('Lỗi xếp lịch trực', err instanceof Error ? err.message : 'Không thể lưu ca trực.');
    } finally {
      setSchedSaving(false);
    }
  };

  const renderSchedulesManagement = () => (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, SHADOWS.sm]}>
        <SectionHeader
          title="Phân ca trực Bác sĩ"
          subtitle="Chọn bác sĩ, ngày trực, ca làm việc và phòng khám"
          leftIcon="calendar-outline"
        />

        <Text style={styles.formFieldLabel}>Chọn bác sĩ phụ trách</Text>
        {(() => {
          const selectedDoc = doctors.find((d) => d.id === schedDoctorId) || doctors[0];
          return (
            <View style={{ marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSchedDoctorDropdownOpen((prev) => !prev)}
                style={[
                  styles.dropdownTrigger,
                  schedDoctorDropdownOpen && styles.dropdownTriggerOpen,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Chọn bác sĩ phụ trách"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                  {selectedDoc?.avatar ? (
                    <Image source={{ uri: selectedDoc.avatar }} style={styles.dropdownAvatar} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownSelectedTitle} numberOfLines={1}>
                      {selectedDoc?.name || 'Chọn bác sĩ...'}
                    </Text>
                    {selectedDoc && (
                      <Text style={styles.dropdownSelectedSub} numberOfLines={1}>
                        {selectedDoc.specialty} • {selectedDoc.hospital}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons
                  name={schedDoctorDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {schedDoctorDropdownOpen && (
                <View style={[styles.dropdownMenu, SHADOWS.md]}>
                  {doctors.map((d, idx) => {
                    const active = schedDoctorId === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        activeOpacity={0.75}
                        onPress={() => {
                          setSchedDoctorId(d.id);
                          setSchedDoctorDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          active && styles.dropdownItemActive,
                          idx < doctors.length - 1 && styles.dropdownItemBorder,
                        ]}
                      >
                        <Image source={{ uri: d.avatar }} style={styles.dropdownAvatar} />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.dropdownItemTitle,
                              active && { color: COLORS.primary, fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                          >
                            {d.name}
                          </Text>
                          <Text style={styles.dropdownItemSub} numberOfLines={1}>
                            {d.specialty} • {d.hospital}
                          </Text>
                        </View>
                        {active && (
                          <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })()}

        <Text style={styles.formFieldLabel}>Chọn ngày trực (7 ngày tới)</Text>
        <View style={styles.chipWrap}>
          {upcomingDates.map((item) => {
            const active = schedDate === item.iso;
            return (
              <TouchableOpacity
                key={item.iso}
                onPress={() => setSchedDate(item.iso)}
                style={[styles.selectChip, active && styles.selectChipActive]}
              >
                <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.formFieldLabel}>Ca trực</Text>
        <View style={styles.chipWrap}>
          {([
            { id: 'morning', label: 'Ca sáng (08:00-11:30)' },
            { id: 'afternoon', label: 'Ca chiều (13:30-17:00)' },
            { id: 'full_day', label: 'Cả ngày (08:00-17:00)' },
          ] as { id: DoctorShiftType; label: string }[]).map((s) => {
            const active = schedShift === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSchedShift(s.id)}
                style={[styles.selectChip, active && styles.selectChipActive]}
              >
                <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppInput
          label="Phòng khám trực"
          leftIcon="business-outline"
          value={schedRoom}
          onChangeText={setSchedRoom}
          placeholder="P.302 • Tầng 3, Tòa nhà A"
        />

        <AppButton
          title={schedSaving ? 'Đang lưu ca trực...' : 'Lưu phân công lịch trực'}
          variant="primary"
          size="md"
          leftIcon="checkmark-circle-outline"
          loading={schedSaving}
          onPress={handleSaveSchedule}
        />
      </View>

      <SectionHeader
        title={`Danh sách ca trực đã phân (${doctorSchedules.length})`}
        subtitle="Đồng bộ trực tiếp với Cổng Bác sĩ"
      />

      {doctorSchedules.length === 0 ? (
        <View style={[styles.card, SHADOWS.sm, { alignItems: 'center', paddingVertical: 24 }]}>
          <Ionicons name="calendar-outline" size={32} color={COLORS.textMuted} />
          <Text style={[styles.docSub, { marginTop: 8 }]}>
            Chưa có ca trực nào được phân công.
          </Text>
        </View>
      ) : (
        doctorSchedules.map((sch) => {
          const doc = doctors.find((d) => d.id === sch.doctorId);
          return (
            <View key={sch.id} style={[styles.card, SHADOWS.sm]}>
              <View style={styles.aptRowTop}>
                <Badge label={sch.workDate} variant="blue" />
                <Badge
                  label={getShiftLabel(sch.shift)}
                  variant={sch.shift === 'full_day' ? 'teal' : 'surface'}
                  showDot
                />
              </View>
              <Text style={styles.docName}>{doc?.name || sch.doctorId}</Text>
              <Text style={styles.docSub}>
                {doc?.specialty || 'Chuyên khoa'} • {sch.room}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                <AppButton
                  title="Xóa ca trực"
                  variant="outline"
                  size="sm"
                  leftIcon="trash-outline"
                  fullWidth={false}
                  onPress={async () => {
                    await deleteDoctorSchedule(sch.id);
                    setAdminToast('Đã xóa ca trực khỏi danh sách.');
                  }}
                />
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const handleSaveBhytRule = async () => {
    setBhytError('');
    const trimmedPrefix = bhytPrefix.trim().toUpperCase();
    const trimmedGroup = bhytGroupName.trim();
    if (!trimmedPrefix || trimmedPrefix.length < 2) {
      const msg = 'Vui lòng nhập mã đầu thẻ BHYT hợp lệ (tối thiểu 2 ký tự, VD: TE, HT, DN).';
      setBhytError(msg);
      Alert.alert('Thiếu thông tin BHYT', msg);
      return;
    }
    if (!trimmedGroup || trimmedGroup.length < 2) {
      const msg = 'Vui lòng nhập tên nhóm đối tượng hưởng BHYT.';
      setBhytError(msg);
      Alert.alert('Thiếu thông tin BHYT', msg);
      return;
    }
    const inRate = Number(bhytInRate);
    const outRate = Number(bhytOutRate);
    if (Number.isNaN(inRate) || inRate < 0 || inRate > 100 || Number.isNaN(outRate) || outRate < 0 || outRate > 100) {
      const msg = 'Mức hưởng BHYT phải nằm trong khoảng 0 đến 100%.';
      setBhytError(msg);
      Alert.alert('Tỷ lệ không hợp lệ', msg);
      return;
    }
    setBhytSaving(true);
    try {
      await saveBhytConfig({
        id: bhytEditId || `bhyt-${trimmedPrefix.toLowerCase()}-${Date.now()}`,
        prefixCode: trimmedPrefix,
        groupName: trimmedGroup,
        inNetworkRate: inRate,
        outNetworkRate: outRate,
        active: true,
      });
      setBhytEditId(null);
      setBhytPrefix('');
      setBhytGroupName('');
      setBhytInRate('80');
      setBhytOutRate('40');
      setBhytError('');
      setAdminToast('Đã lưu chính sách mức hưởng BHYT.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu cấu hình BHYT.';
      setBhytError(msg);
      Alert.alert('Lỗi cấu hình BHYT', msg);
    } finally {
      setBhytSaving(false);
    }
  };

  const startEditBhytRule = (cfg: BhytConfigItem) => {
    setBhytEditId(cfg.id);
    setBhytPrefix(cfg.prefixCode);
    setBhytGroupName(cfg.groupName);
    setBhytInRate(String(cfg.inNetworkRate));
    setBhytOutRate(String(cfg.outNetworkRate));
  };

  const renderAdminSettings = () => (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, SHADOWS.sm]}>
        <SectionHeader
          title="Cấu hình Chính sách & Mức hưởng BHYT"
          subtitle="Thiết lập % giảm trừ theo đầu mã thẻ BHYT (áp dụng tự động khi bệnh nhân đặt lịch)"
          leftIcon="shield-checkmark-outline"
        />

        {bhytConfigs.map((cfg) => (
          <View
            key={cfg.id}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.divider,
            }}
          >
            <View style={styles.aptRowTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Badge label={`Mã ${cfg.prefixCode}`} variant={cfg.active ? 'teal' : 'surface'} />
                <Text style={styles.docName}>{cfg.groupName}</Text>
              </View>
              <Badge
                label={cfg.active ? 'Đang áp dụng' : 'Tạm tắt'}
                variant={cfg.active ? 'blue' : 'warning'}
              />
            </View>
            <Text style={[styles.docSub, { marginTop: 4 }]}>
              Đúng tuyến: <Text style={{ fontWeight: '800', color: COLORS.secondary }}>{cfg.inNetworkRate}%</Text>
              {'  •  '}
              Trái tuyến: <Text style={{ fontWeight: '800', color: COLORS.primary }}>{cfg.outNetworkRate}%</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <AppButton
                title="Sửa mức %"
                variant="tonal"
                size="sm"
                leftIcon="create-outline"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={() => startEditBhytRule(cfg)}
              />
              <AppButton
                title={cfg.active ? 'Tạm tắt' : 'Kích hoạt'}
                variant="outline"
                size="sm"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={async () => {
                  await toggleBhytConfig(cfg.id);
                  setAdminToast(`Đã ${cfg.active ? 'tắt' : 'bật'} chính sách mã ${cfg.prefixCode}.`);
                }}
              />
              <AppButton
                title="Xóa"
                variant="dangerOutline"
                size="sm"
                fullWidth={false}
                onPress={async () => {
                  await deleteBhytConfig(cfg.id);
                  setAdminToast(`Đã xóa quy tắc BHYT mã ${cfg.prefixCode}.`);
                }}
              />
            </View>
          </View>
        ))}

        <Text style={[styles.formFieldLabel, { marginTop: 14 }]}>
          {bhytEditId ? `Đang sửa quy tắc mã ${bhytPrefix}` : 'Thêm / Cập nhật quy tắc BHYT mới'}
        </Text>
        <AppInput
          label="Mã đầu thẻ BHYT (VD: TE, HT, DN, GD, CN)"
          leftIcon="card-outline"
          value={bhytPrefix}
          onChangeText={setBhytPrefix}
          placeholder="CN"
          autoCapitalize="characters"
        />
        <AppInput
          label="Nhóm đối tượng hưởng BHYT"
          leftIcon="people-outline"
          value={bhytGroupName}
          onChangeText={setBhytGroupName}
          placeholder="Hộ cận nghèo / Ưu đãi xã hội"
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppInput
              label="Đúng tuyến (%)"
              value={bhytInRate}
              onChangeText={setBhytInRate}
              keyboardType="numeric"
              placeholder="80"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label="Trái tuyến (%)"
              value={bhytOutRate}
              onChangeText={setBhytOutRate}
              keyboardType="numeric"
              placeholder="40"
            />
          </View>
        </View>
        {bhytError ? (
          <View
            accessibilityRole="alert"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: COLORS.errorContainer,
              borderRadius: RADIUS.sm,
              padding: 10,
              marginBottom: 10,
            }}
          >
            <Ionicons name="alert-circle" size={16} color={COLORS.error} />
            <Text style={{ flex: 1, fontSize: TYPOGRAPHY.size.xs, color: COLORS.error, fontWeight: '600' }}>
              {bhytError}
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {bhytEditId && (
            <AppButton
              title="Hủy sửa"
              variant="outline"
              size="md"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={() => {
                setBhytEditId(null);
                setBhytPrefix('');
                setBhytGroupName('');
                setBhytInRate('80');
                setBhytOutRate('40');
              }}
            />
          )}
          <AppButton
            title={bhytSaving ? 'Đang lưu...' : bhytEditId ? 'Cập nhật quy tắc' : 'Lưu quy tắc BHYT'}
            variant="secondary"
            size="md"
            leftIcon="checkmark-circle-outline"
            fullWidth={false}
            style={{ flex: 1.5 }}
            loading={bhytSaving}
            onPress={handleSaveBhytRule}
          />
        </View>
      </View>

      <View style={[styles.card, SHADOWS.sm]}>
        <SectionHeader
          title="Cấu hình vận hành hệ thống"
          leftIcon="server-outline"
        />
        <SettingToggleRow
          icon="shield-checkmark-outline"
          title="Đồng bộ BHYT VssID"
          description="Tự động kiểm tra thẻ BHYT và mức hưởng theo cấu hình khi bệnh nhân đặt lịch."
          value={autoSyncVssID}
          onValueChange={setAutoSyncVssID}
        />
        <SettingToggleRow
          icon="notifications-outline"
          iconColor={COLORS.secondary}
          title="Nhắc lịch khám tự động"
          description="Gửi thông báo nhắc nhở trước 24h và 2h cho bệnh nhân và bác sĩ trực."
          value={autoGdtTax}
          onValueChange={setAutoGdtTax}
        />
      </View>

      <AppButton
        title="Đăng xuất Admin"
        variant="danger"
        size="lg"
        leftIcon="log-out-outline"
        onPress={onLogout}
      />
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <AppHeader
        title="MediCare Plus Admin"
        subtitle="admin@medicare.vn"
        badgeText="ADMIN"
        leftIconBox="shield-checkmark-outline"
        rightActions={[
          { icon: 'log-out-outline', label: 'Đăng xuất Admin', onPress: onLogout },
        ]}
      />

      <View style={{ flex: 1 }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'doctors' && renderDoctorsManagement()}
        {activeTab === 'schedules' && renderSchedulesManagement()}
        {activeTab === 'appointments' && renderAppointmentsManagement()}
        {activeTab === 'settings' && renderAdminSettings()}
        {activeTab === 'reception' && <ClinicStaffScreen embedded onLogout={onLogout} />}
      </View>

      {/* Admin Bottom Navigation */}
      <View style={[styles.roleTabBar, SHADOWS.md]}>
        {[
          { key: 'overview', label: 'Tổng quan', icon: 'stats-chart' },
          { key: 'doctors', label: 'QL Bác sĩ', icon: 'medkit' },
          { key: 'schedules', label: 'Lịch trực', icon: 'time' },
          { key: 'appointments', label: 'Điều phối', icon: 'calendar' },
          { key: 'settings', label: 'BHYT', icon: 'shield-checkmark' },
          { key: 'reception', label: 'Tiếp đón', icon: 'qr-code' },
        ].map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.roleTabItem}
              onPress={() => setActiveTab(t.key as AdminTab)}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={t.icon as any}
                size={20}
                color={active ? COLORS.primary : COLORS.textSecondary}
                importantForAccessibility="no"
              />
              <Text
                style={[
                  styles.roleTabLabel,
                  active && styles.roleTabLabelActive,
                ]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ToastBanner
        visible={!!adminToast}
        title="Quản trị hệ thống"
        message={adminToast || ''}
        onDismiss={() => setAdminToast(null)}
      />
    </View>
  );
};

// ==========================================
// 2. DOCTOR PORTAL (GIAO DIỆN BÁC SĨ ĐIỀU TRỊ)
// ==========================================
export interface DoctorDashboardScreenProps {
  onLogout: () => void;
  onNavigate?: (routeKey: string) => void;
}

type DoctorTab = 'schedule' | 'patients' | 'prescribe' | 'chat' | 'profile';

export const DoctorDashboardScreen: React.FC<DoctorDashboardScreenProps> = ({
  onLogout,
  onNavigate,
}) => {
  const {
    appointments,
    completeAppointment,
    checkInAppointment,
    checkInByCode,
    doctors,
    doctorSchedules,
    prescriptions,
    addPrescriptionDrug,
    diagnosisNote,
    setDiagnosisNote,
    cloudProfile,
    labResults,
    uploadLabResult,
    deleteLabResult,
  } = useAppContext();

  const [labUploadVisible, setLabUploadVisible] = useState(false);
  const [viewingLabItem, setViewingLabItem] = useState<LabResultItem | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [doctorCameraVisible, setDoctorCameraVisible] = useState(false);
  const [doctorCameraFacing, setDoctorCameraFacing] = useState<'front' | 'back'>(Platform.OS === 'web' ? 'front' : 'back');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [showManualCodeInput, setShowManualCodeInput] = useState(false);
  const [isCheckingInCode, setIsCheckingInCode] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  const doctorScanHandled = useRef(false);

  const handleDoctorCheckIn = async (code: string) => {
    if (!code) return;
    setIsCheckingInCode(true);
    setCheckInError('');
    try {
      const success = await checkInByCode(code);
      if (success) {
        setDoctorCameraVisible(false);
        setShowManualCodeInput(false);
        setManualCodeInput('');
        setCheckInError('');
        setToastMessage(`Đã tiếp đón bệnh nhân (Mã: ${code}) thành công!`);
        Alert.alert('Tiếp đón thành công', `Bệnh nhân với mã ${code} đã được đánh dấu ĐÃ CÓ MẶT.`);
      } else {
        setCheckInError(
          `Không thể tiếp đón mã "${code}". Vui lòng kiểm tra lại mã phiếu hẹn hoặc ngày khám hôm nay.`
        );
      }
    } finally {
      setIsCheckingInCode(false);
    }
  };

  // Xác định bác sĩ đang làm việc từ Supabase Profile hoặc danh mục
  const doctor = (cloudProfile?.doctor_id && doctors.find((d) => d.id === cloudProfile.doctor_id))
    || (cloudProfile?.full_name && doctors.find((d) => d.name === cloudProfile.full_name))
    || DOCTORS[0];

  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const mySchedules = doctorSchedules.filter((s) => s.doctorId === doctor.id && s.active);
  const todayShift = mySchedules.find((s) => s.workDate === todayIso) || mySchedules[0];
  const shiftBadgeText = todayShift
    ? `${getShiftLabel(todayShift.shift).toUpperCase()} • ${todayShift.room}`
    : 'CHƯA PHÂN CA TRỰC HÔM NAY';

  const [activeTab, setActiveTab] = useState<DoctorTab>('schedule');
  const [selectedPatientApt, setSelectedPatientApt] = useState<AppointmentItem | null>(null);
  const [newDrugName, setNewDrugName] = useState('');
  const [newDrugQty, setNewDrugQty] = useState('14 viên');
  const [newDrugDosage, setNewDrugDosage] = useState('1 viên/lần • Sáng, Tối');
  const [showAddDrugForm, setShowAddDrugForm] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [queueStatuses, setQueueStatuses] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ConsultMessageItem[]>([]);
  const [activeChatPatientId, setActiveChatPatientId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    let active = true;
    const scope = { doctorId: doctor.id };
    const refreshChat = async () => {
      try {
        const rows = await fetchConsultMessagesCloud(scope);
        if (!active) return;
        setChatMessages(rows);
      } catch {
        // ignore background chat poll errors
      }
    };
    void refreshChat();
    const unsub = subscribeConsultMessagesCloud(() => {
      void refreshChat();
    }, scope);
    return () => {
      active = false;
      unsub();
    };
  }, [doctor.id]);

  // Lọc lịch hẹn của chính bác sĩ này từ Supabase database
  const doctorAppointments = appointments.filter(
    (a) => !cloudProfile?.doctor_id || a.doctor.id === cloudProfile.doctor_id
  );
  const upcomingPatientApts = doctorAppointments.filter((a) => a.status === 'upcoming');
  const completedPatientApts = doctorAppointments.filter((a) => a.status === 'completed');

  const todayAppointments = doctorAppointments.filter(a => getAppointmentDateKey(a) === getRelativeDayMeta(0).fullDate && a.status === 'upcoming');

  const activePatient = selectedPatientApt || upcomingPatientApts[0] || doctorAppointments[0] || null;
  const activePatientName = activePatient?.patientName || 'Bệnh nhân';
  const activePatientCode = activePatient?.code || '#BN-001';

  const renderSchedule = () => (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      showsVerticalScrollIndicator={false}
    >
      {/* Doctor Identity Card */}
      <AnimatedEntry delay={40} direction="up">
        <LinearGradient
          colors={GRADIENTS.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, SHADOWS.md]}
        >
          <View style={styles.heroUserRow}>
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: doctor.avatar }} style={styles.docHeroAvatar} />
              <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
                <PulsingDot color="#86F2E4" size={7} />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Badge label={shiftBadgeText} variant="teal" showDot />
              <Text style={[styles.heroName, { marginTop: 4 }]}>{doctor.name}</Text>
              <Text style={styles.heroEmail}>
                {doctor.degree} • {doctor.hospital}
              </Text>
            </View>
          </View>

          <View style={styles.heroMetricsStrip}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>
                {doctorAppointments.filter(a => getAppointmentDateKey(a) === getRelativeDayMeta(0).fullDate).length} ca
              </Text>
              <Text style={styles.heroMetricLabel}>Tổng lịch hôm nay</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>
                {completedPatientApts.filter(a => getAppointmentDateKey(a) === getRelativeDayMeta(0).fullDate).length} ca
              </Text>
              <Text style={styles.heroMetricLabel}>Đã hoàn tất</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>
                {todayAppointments.length} ca
              </Text>
              <Text style={styles.heroMetricLabel}>Đang chờ khám</Text>
            </View>
          </View>
        </LinearGradient>
      </AnimatedEntry>

      <SectionHeader
        title="Hàng đợi bệnh nhân hôm nay"
        subtitle={`Đồng bộ trực tiếp từ cơ sở dữ liệu Supabase • ${doctor.hospital}`}
        actionText="Phòng Chat Tư vấn"
        onActionPress={() => setActiveTab('chat')}
      />

      {/* Doctor Quick QR Scanner & Manual Check-in */}
      <View style={[styles.card, SHADOWS.sm, { marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={styles.docName}>Tiếp đón bệnh nhân vào khám</Text>
            <Text style={styles.docSub}>Quét mã QR từ điện thoại bệnh nhân hoặc nhập mã phiếu hẹn</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <AppButton
              title={doctorCameraVisible ? 'Tắt máy ảnh' : 'Quét QR'}
              variant="primary"
              size="sm"
              leftIcon="qr-code-outline"
              fullWidth={false}
              onPress={async () => {
                if (doctorCameraVisible) {
                  setDoctorCameraVisible(false);
                  return;
                }
                try {
                  const perm = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
                  if (!perm.granted) {
                    Alert.alert('Quyền máy ảnh', 'Vui lòng cấp quyền camera hoặc nhập mã phiếu hẹn trực tiếp.');
                    setShowManualCodeInput(true);
                    return;
                  }
                  doctorScanHandled.current = false;
                  setDoctorCameraVisible(true);
                } catch {
                  Alert.alert('Máy ảnh', 'Không khởi động được camera. Vui lòng nhập mã phiếu hẹn.');
                  setShowManualCodeInput(true);
                }
              }}
            />
            <AppButton
              title="Nhập mã"
              variant="outline"
              size="sm"
              leftIcon="keypad-outline"
              fullWidth={false}
              onPress={() => setShowManualCodeInput(prev => !prev)}
            />
          </View>
        </View>

        {doctorCameraVisible && (
          <View style={{ marginTop: 12, gap: 8 }}>
            <CameraView
              style={{ height: 260, borderRadius: RADIUS.md, overflow: 'hidden' }}
              facing={doctorCameraFacing}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onMountError={() => {
                setDoctorCameraVisible(false);
                Alert.alert('Lỗi camera', 'Không thể mở luồng camera. Bạn có thể nhập mã phiếu hẹn trực tiếp bên dưới.');
                setShowManualCodeInput(true);
              }}
              onBarcodeScanned={({ data }) => {
                if (doctorScanHandled.current) return;
                doctorScanHandled.current = true;
                const parsed = extractBookingCode(data);
                if (!parsed) {
                  Alert.alert('Mã không hợp lệ', `Mã QR không đúng định dạng (${(data || '').slice(0, 24)}...).`);
                  doctorScanHandled.current = false;
                  return;
                }
                void handleDoctorCheckIn(parsed);
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <AppButton
                title={`Đổi camera (${doctorCameraFacing === 'back' ? 'Sau' : 'Trước'})`}
                variant="tonal"
                size="sm"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={() => setDoctorCameraFacing(prev => prev === 'back' ? 'front' : 'back')}
              />
              <AppButton
                title="Đóng camera"
                variant="outline"
                size="sm"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={() => setDoctorCameraVisible(false)}
              />
            </View>
          </View>
        )}

        {showManualCodeInput && (
          <View style={{ marginTop: 12, gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <AppInput
              label="Nhập mã phiếu hẹn bệnh nhân"
              placeholder="MC-..."
              value={manualCodeInput}
              onChangeText={(txt) => {
                setManualCodeInput(txt);
                if (checkInError) setCheckInError('');
              }}
              autoCapitalize="characters"
              error={checkInError}
            />
            <AppButton
              title="Xác nhận tiếp đón"
              variant="primary"
              size="sm"
              loading={isCheckingInCode}
              disabled={!manualCodeInput.trim() || isCheckingInCode}
              onPress={() => {
                const parsed = extractBookingCode(manualCodeInput) || manualCodeInput.trim();
                void handleDoctorCheckIn(parsed);
              }}
            />
          </View>
        )}
      </View>

      {todayAppointments.length === 0 ? (
        <AnimatedEntry delay={100} direction="up">
          <View style={[styles.card, SHADOWS.sm, { alignItems: 'center', paddingVertical: 32 }]}>
            <Ionicons name="people-outline" size={44} color={COLORS.textSecondary} />
            <Text style={[styles.docName, { marginTop: 12, textAlign: 'center' }]}>
              Hàng đợi hôm nay hiện đang trống
            </Text>
            <Text style={[styles.docSub, { textAlign: 'center', marginTop: 4, maxWidth: 320 }]}>
              Chưa có bệnh nhân nào đặt lịch hoặc chờ khám trong ca trực này. Lịch hẹn mới từ ứng dụng sẽ tự động xuất hiện tại đây theo thời gian thực.
            </Text>
          </View>
        </AnimatedEntry>
      ) : (
        todayAppointments.map((pt, idx) => (
          <AnimatedEntry key={pt.id} delay={100 + idx * 70} direction="up">
            <View style={[styles.card, SHADOWS.sm]}>
              <View style={styles.aptRowTop}>
                <Badge label={`${pt.queueNumber || 'Chưa cấp STT'} • ${pt.timeRange || pt.dateLabel}`} variant="blue" />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {pt.status === 'upcoming' && <PulsingDot color={COLORS.secondary} size={6} />}
                  <Badge label={queueStatuses[pt.id] || pt.statusBadge} variant={pt.status === 'completed' ? 'teal' : 'blue'} showDot />
                </View>
              </View>

              <Text style={styles.docName}>{pt.patientName || 'Bệnh nhân'}</Text>
              <Text style={styles.docSub}>
                SĐT: {pt.patientPhone || 'Chưa cập nhật'} • Mã phiếu: {pt.code}
              </Text>

              <View style={styles.symptomBox}>
                <Text style={styles.symptomLabel}>Triệu chứng / Lý do khám (AI Triage):</Text>
                <Text style={styles.symptomText}>{pt.symptoms || 'Khám và tư vấn theo chuyên khoa'}</Text>
              </View>

              <View style={styles.docActionRow}>
                <AppButton
                  title={pt.mode === 'video' ? 'Mở phòng Chat / Video' : 'Gọi vào khám'}
                  variant="primary"
                  size="sm"
                  leftIcon={pt.mode === 'video' ? 'videocam-outline' : 'megaphone-outline'}
                  fullWidth={false}
                  style={{ flex: 1 }}
                  loading={checkingId === pt.id}
                  disabled={checkingId !== null}
                  onPress={async () => {
                    if (checkingId) return;
                    setSelectedPatientApt(pt);
                    if (pt.mode === 'video' && onNavigate) {
                      onNavigate('teleconsult');
                      return;
                    }
                    setCheckingId(pt.id);
                    try {
                      const success = await checkInAppointment(pt.id, pt.code);
                      if (!success) return;
                      setQueueStatuses(prev => ({ ...prev, [pt.id]: 'Đã có mặt' }));
                      setToastMessage(`Đã tiếp đón ${pt.patientName || 'bệnh nhân'}.`);
                    } finally { setCheckingId(null); }
                  }}
                />
                <AppButton
                  title="Kê đơn thuốc"
                  variant="secondary"
                  size="sm"
                  leftIcon="create-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => {
                    setSelectedPatientApt(pt);
                    setActiveTab('prescribe');
                  }}
                />
                <AppButton
                  title="Chat"
                  variant="tonal"
                  size="sm"
                  leftIcon="chatbubbles-outline"
                  fullWidth={false}
                  onPress={() => {
                    setSelectedPatientApt(pt);
                    setActiveChatPatientId(`apt-${pt.id}`);
                    setActiveTab('chat');
                  }}
                />
              </View>
            </View>
          </AnimatedEntry>
        ))
      )}
    </ScrollView>
  );

  const renderPatientsEHR = () => (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader
        title="Hồ sơ bệnh án điện tử (EHR)"
        subtitle={`Bệnh nhân đang khám: ${activePatientName} (${activePatientCode})`}
      />
      <View style={[styles.card, SHADOWS.sm]}>
        <Text style={styles.docName}>
          {activePatientName} {activePatient?.patientPhone ? `• SĐT: ${activePatient.patientPhone}` : ''}
        </Text>
        <Text style={styles.docSub}>
          Mã hẹn: {activePatientCode} • Phòng khám: {doctor.hospital}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {PATIENT_PROFILE.vitals.map((v) => (
            <View key={v.label} style={styles.vitalMiniBox}>
              <Text style={styles.vitalMiniLabel}>{v.label}</Text>
              <Text style={styles.vitalMiniVal}>{v.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, SHADOWS.sm]}>
        <SectionHeader
          title="Kết quả Cận lâm sàng & CĐHA"
          leftIcon="scan-outline"
          actionText="Xem chi tiết"
          onActionPress={() => onNavigate?.('labImagingResults')}
        />
        <Text style={styles.docName}>Chụp MRI Sọ não (Không cản từ)</Text>
        <Text style={[styles.docSub, { marginTop: 4 }]}>
          Nhu mô não không thấy tổn thương khu trú, hệ thống não thất cân đối, không có dấu hiệu nhồi máu não hay xuất huyết.
        </Text>
        <AppButton
          title="Xem kết quả CĐHA & Xét nghiệm"
          variant="tonal"
          size="sm"
          leftIcon="flask-outline"
          onPress={() => onNavigate?.('labImagingResults')}
          style={{ marginTop: 10 }}
        />
      </View>
    </ScrollView>
  );

  const renderPrescribe = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader
          title="Kê đơn thuốc điện tử"
          subtitle={`BN: ${activePatientName} (${activePatientCode})`}
        />

        <View style={[styles.card, SHADOWS.sm]}>
          <AppInput
            label="Chẩn đoán lâm sàng (ICD-10: G44.2)"
            leftIcon="medkit-outline"
            value={diagnosisNote}
            onChangeText={setDiagnosisNote}
          />

          <Text style={styles.rxSectionLabel}>
            Danh mục thuốc chỉ định ({prescriptions.length} loại):
          </Text>
          {prescriptions.map((d) => (
            <View key={d.id} style={styles.rxItemRow}>
              <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <Text style={styles.docName} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text style={styles.docSub} numberOfLines={1}>
                  {d.dosageTag} • {d.instructionTag}
                </Text>
              </View>
              <Badge label={d.quantity} variant="blue" />
            </View>
          ))}

          {/* Interactive Add New Drug to Prescription */}
          {showAddDrugForm ? (
            <View
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: COLORS.surfaceContainerLow,
                borderRadius: RADIUS.md,
              }}
            >
              <Text style={[styles.docName, { marginBottom: 8 }]}>
                + Thêm thuốc mới vào đơn của BN. {activePatientName}
              </Text>
              <AppInput
                label="Tên thuốc & Hàm lượng *"
                placeholder="VD: Magnesium B6 470mg"
                value={newDrugName}
                onChangeText={setNewDrugName}
              />
              <AppInput
                label="Số lượng cấp"
                placeholder="VD: 14 viên"
                value={newDrugQty}
                onChangeText={setNewDrugQty}
              />
              <AppInput
                label="Liều dùng & Hướng dẫn"
                placeholder="VD: 1 viên/lần • Sau ăn sáng, tối"
                value={newDrugDosage}
                onChangeText={setNewDrugDosage}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AppButton
                  title="Hủy"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => setShowAddDrugForm(false)}
                />
                <AppButton
                  title="Thêm vào đơn"
                  variant="primary"
                  size="sm"
                  leftIcon="add-circle-outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (!newDrugName.trim()) return;
                    addPrescriptionDrug({
                      name: newDrugName.trim(),
                      indication: 'Chỉ định bổ sung từ Bác sĩ điều trị',
                      quantity: newDrugQty.trim() || '14 viên',
                      dosageTag: newDrugDosage.trim() || '1 viên/lần',
                      instructionTag: 'Uống sau ăn theo chỉ dẫn BS',
                    });
                    setNewDrugName('');
                    setShowAddDrugForm(false);
                    setToastMessage(
                      `Đã thêm "${newDrugName.trim()}" vào đơn thuốc điện tử của BN. ${activePatientName}.`
                    );
                  }}
                />
              </View>
            </View>
          ) : (
            <AppButton
              title="+ Thêm thuốc vào đơn"
              variant="tonal"
              size="sm"
              leftIcon="add-circle-outline"
              onPress={() => setShowAddDrugForm(true)}
              style={{ marginTop: 10 }}
            />
          )}

          <AppButton
            title="Lưu & Phát hành đơn thuốc"
            variant="gradient"
            size="lg"
            leftIcon="checkmark-circle-outline"
            style={{ marginTop: 14 }}
            onPress={async () => {
              if (!activePatient) return;
              if (activePatient) {
                const meds = prescriptions.map((p) => ({
                  name: p.name,
                  dosage: `${p.quantity} - ${p.dosageTag} (${p.instructionTag})`,
                }));
                const success = await completeAppointment(
                  activePatient.id,
                  diagnosisNote || 'Khám và tư vấn chuyên khoa',
                  meds,
                  ''
                );
                if (!success) return;
              }
              setToastMessage(
                `Đã phát hành đơn thuốc và đồng bộ tức thì sang Hồ sơ Bệnh án của ${activePatientName}!`
              );
              if (onNavigate) {
                setTimeout(() => onNavigate('postConsultSummary'), 600);
              }
            }}
          />
        </View>

        {/* Kết quả Cận lâm sàng (PDF / X-Quang) - Supabase Storage */}
        <View style={[styles.card, SHADOWS.sm]}>
          <SectionHeader
            title="Kết quả Cận lâm sàng (PDF / X-Quang)"
            leftIcon="scan-outline"
            badgeText={`${labResults.filter((r) => !activePatient || r.appointmentId === activePatient.id || r.patientId === cloudProfile?.id).length} tệp`}
            badgeVariant="teal"
          />
          <Text style={[styles.docSub, { marginBottom: 10 }]}>
            Tải lên kết quả xét nghiệm máu (PDF) hoặc hình ảnh X-Quang / MRI để bệnh nhân mở xem ngay trên hồ sơ bệnh án.
          </Text>
          {labResults
            .filter((r) => !activePatient || r.appointmentId === activePatient.id || !CLOUD_MODE)
            .map((item) => {
              const catMeta = LAB_CATEGORY_META[item.category] || LAB_CATEGORY_META.other;
              return (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.borderSubtle,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.docSub} numberOfLines={1}>
                      {catMeta.shortLabel} • {item.fileName} ({formatLabFileSize(item.fileSizeBytes)})
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setViewingLabItem(item)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: RADIUS.sm,
                        backgroundColor: COLORS.primaryContainer,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>
                        Xem
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          await deleteLabResult(item.id);
                          setToastMessage(`Đã xóa kết quả "${item.title}".`);
                        } catch (err) {
                          setToastMessage(
                            err instanceof Error ? err.message : 'Không thể xóa tệp kết quả.'
                          );
                        }
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: RADIUS.sm,
                        backgroundColor: COLORS.errorContainer,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.error }}>
                        Xóa
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          <AppButton
            title="+ Tải lên kết quả PDF / X-Quang"
            variant="tonal"
            size="md"
            leftIcon="cloud-upload-outline"
            style={{ marginTop: 10 }}
            onPress={() => setLabUploadVisible(true)}
            disabled={!activePatient}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  interface MessengerThread {
    patientId: string;
    patientName: string;
    initials: string;
    subtitle: string;
    lastMessageText: string;
    lastMessageTime: string;
    lastSenderRole: 'patient' | 'doctor' | 'admin' | 'system';
    unreadCount: number;
    messages: ConsultMessageItem[];
    appointment?: AppointmentItem;
    sortTimestamp: string;
  }

  const getInitials = (fullName: string) => {
    const parts = (fullName || 'BN').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[parts.length - 2][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
    }
    return (fullName || 'BN').slice(0, 2).toUpperCase();
  };

  const messengerThreads: MessengerThread[] = (() => {
    const map = new Map<string, MessengerThread>();

    // 1. Gom các cuộc hội thoại từ tin nhắn thực tế (clinic_consult_messages)
    for (const msg of chatMessages) {
      const pid = msg.patientId || 'unknown-patient';
      const existing = map.get(pid);
      const inferredName =
        msg.patientName ||
        (msg.senderRole === 'patient' ? msg.senderName : existing?.patientName) ||
        `Bệnh nhân #${pid.slice(0, 6).toUpperCase()}`;
      const nextMessages = existing ? [...existing.messages, msg] : [msg];
      const unreadCount =
        (existing?.unreadCount || 0) + (msg.senderRole === 'patient' ? 1 : 0);
      map.set(pid, {
        patientId: pid,
        patientName: inferredName,
        initials: getInitials(inferredName),
        subtitle: existing?.subtitle || 'Tư vấn trực tuyến qua MediCare Plus',
        lastMessageText: msg.text,
        lastMessageTime: msg.time,
        lastSenderRole: msg.senderRole,
        unreadCount: msg.senderRole === 'doctor' ? 0 : unreadCount,
        messages: nextMessages,
        appointment: existing?.appointment,
        sortTimestamp: msg.createdAt,
      });
    }

    // 2. Ghép thêm các bệnh nhân có lịch khám với bác sĩ này để bác sĩ chủ động nhắn tin
    for (const apt of doctorAppointments) {
      const pName = (apt.patientName || 'Bệnh nhân').trim();
      const realPatientId = apt.patientId?.trim();
      const matchedEntry = Array.from(map.values()).find(
        (t) =>
          (realPatientId && t.patientId === realPatientId) ||
          t.patientName.trim().toLowerCase() === pName.toLowerCase() ||
          t.patientId === `apt-${apt.id}`
      );
      if (matchedEntry) {
        matchedEntry.appointment = matchedEntry.appointment || apt;
        matchedEntry.subtitle = `Mã phiếu: ${apt.code}${apt.patientPhone ? ` • SĐT: ${apt.patientPhone}` : ''}`;
      } else if (realPatientId) {
        map.set(realPatientId, {
          patientId: realPatientId,
          patientName: pName,
          initials: getInitials(pName),
          subtitle: `Mã phiếu: ${apt.code}${apt.patientPhone ? ` • SĐT: ${apt.patientPhone}` : ''}`,
          lastMessageText: apt.symptoms
            ? `Triệu chứng đặt khám: ${apt.symptoms}`
            : 'Đã đặt lịch khám • Nhấn để nhắn tin tư vấn',
          lastMessageTime: apt.timeRange?.split(',')[0] || 'Lịch hẹn',
          lastSenderRole: 'system',
          unreadCount: apt.mode === 'video' ? 1 : 0,
          messages: [],
          appointment: apt,
          sortTimestamp: `0000-${apt.id}`,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      b.sortTimestamp.localeCompare(a.sortTimestamp)
    );
  })();

  const unreadThreadCount = messengerThreads.filter(
    (t) => t.lastSenderRole === 'patient' || t.unreadCount > 0
  ).length;

  const filteredThreads = messengerThreads.filter((t) => {
    const q = chatSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.patientName.toLowerCase().includes(q) ||
      t.lastMessageText.toLowerCase().includes(q) ||
      t.subtitle.toLowerCase().includes(q)
    );
  });

  const activeThread =
    messengerThreads.find((t) => t.patientId === activeChatPatientId) || null;

  const handleDoctorSendChat = async (customText?: string) => {
    const content = (customText ?? chatDraft).trim();
    if (!content || !activeThread || chatSending) return;
    setChatSending(true);
    try {
      const saved = await sendConsultMessageCloud({
        doctorId: doctor.id,
        patientId: activeThread.patientId,
        patientName: activeThread.patientName,
        appointmentId: activeThread.appointment?.id || null,
        content,
        senderRole: 'doctor',
        senderName: doctor.name,
      });
      setChatMessages((prev) =>
        prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]
      );
      if (!customText) setChatDraft('');
    } catch (err) {
      setToastMessage(
        err instanceof Error ? err.message : 'Không thể gửi tin nhắn tư vấn.'
      );
    } finally {
      setChatSending(false);
    }
  };

  const renderDoctorChat = () => {
    // CHI TIẾT CUỘC TRÒ CHUYỆN (MESSENGER CONVERSATION VIEW)
    if (activeThread) {
      return (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Messenger Top Bar */}
          <View
            style={[
              styles.card,
              SHADOWS.sm,
              {
                marginHorizontal: SPACING.md,
                marginTop: SPACING.sm,
                marginBottom: 6,
                paddingVertical: 10,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setActiveChatPatientId(null)}
              accessibilityRole="button"
              accessibilityLabel="Quay lại danh sách hộp thư"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                paddingRight: 8,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            <View style={{ position: 'relative' }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: COLORS.tintBlue,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: '800',
                    fontSize: 15,
                  }}
                >
                  {activeThread.initials}
                </Text>
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#22C55E',
                  borderWidth: 2,
                  borderColor: COLORS.surface,
                }}
              />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.docName} numberOfLines={1}>
                {activeThread.patientName}
              </Text>
              <Text style={styles.docSub} numberOfLines={1}>
                {activeThread.subtitle}
              </Text>
            </View>

            {activeThread.appointment ? (
              <AppButton
                title="Kê đơn"
                variant="tonal"
                size="sm"
                leftIcon="medkit-outline"
                fullWidth={false}
                onPress={() => {
                  setSelectedPatientApt(activeThread.appointment!);
                  setActiveTab('prescribe');
                }}
              />
            ) : null}
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activeThread.appointment?.symptoms ? (
              <View style={[styles.symptomBox, { marginBottom: 14 }]}>
                <Text style={styles.symptomLabel}>
                  Thông tin ca tư vấn • {activeThread.appointment.code}:
                </Text>
                <Text style={styles.symptomText}>
                  {activeThread.appointment.symptoms}
                </Text>
              </View>
            ) : null}

            {activeThread.messages.length === 0 ? (
              <View
                style={[
                  styles.card,
                  SHADOWS.sm,
                  { alignItems: 'center', paddingVertical: 24 },
                ]}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={36}
                  color={COLORS.primary}
                />
                <Text
                  style={[
                    styles.docName,
                    { marginTop: 8, textAlign: 'center' },
                  ]}
                >
                  Bắt đầu tư vấn với {activeThread.patientName}
                </Text>
                <Text
                  style={[
                    styles.docSub,
                    { textAlign: 'center', marginTop: 4 },
                  ]}
                >
                  Chọn một mẫu câu phản hồi nhanh bên dưới hoặc gõ tin nhắn để gửi trực tiếp tới ứng dụng của bệnh nhân.
                </Text>
              </View>
            ) : (
              activeThread.messages.map((msg) => {
                const isDoctorMsg = msg.senderRole === 'doctor';
                return (
                  <View
                    key={msg.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: isDoctorMsg ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    {!isDoctorMsg ? (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: COLORS.tintBlue,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: COLORS.primary,
                            fontWeight: '800',
                            fontSize: 12,
                          }}
                        >
                          {activeThread.initials}
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={{
                        maxWidth: '78%',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 18,
                        borderBottomRightRadius: isDoctorMsg ? 4 : 18,
                        borderBottomLeftRadius: isDoctorMsg ? 18 : 4,
                        backgroundColor: isDoctorMsg
                          ? COLORS.primary
                          : COLORS.surface,
                        borderWidth: isDoctorMsg ? 0 : 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      {!isDoctorMsg ? (
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: COLORS.primary,
                            marginBottom: 2,
                          }}
                        >
                          {activeThread.patientName}
                        </Text>
                      ) : null}
                      <Text
                        style={{
                          fontSize: 14,
                          lineHeight: 20,
                          color: isDoctorMsg ? '#FFFFFF' : COLORS.textPrimary,
                        }}
                      >
                        {msg.text}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          marginTop: 4,
                          alignSelf: 'flex-end',
                          color: isDoctorMsg
                            ? 'rgba(255,255,255,0.82)'
                            : COLORS.textMuted,
                        }}
                      >
                        {msg.time} {isDoctorMsg ? '• Đã gửi' : ''}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}

            {/* Quick Reply Chips for Doctor */}
            <Text
              style={[
                styles.docSub,
                { fontWeight: '700', marginTop: 8, marginBottom: 8 },
              ]}
            >
              PHẢN HỒI NHANH CỦA BÁC SĨ:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                'Chào bạn, bác sĩ đã nhận được thông tin và đang xem hồ sơ của bạn.',
                'Bạn nhớ uống thuốc đúng liều, nghỉ ngơi và theo dõi thêm nhé!',
                'Nếu triệu chứng không giảm, bạn đặt lịch đến viện để bác sĩ khám trực tiếp nhé.',
              ].map((quickReply) => (
                <TouchableOpacity
                  key={quickReply}
                  onPress={() => {
                    void handleDoctorSendChat(quickReply);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor: COLORS.tintBlue,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.primary,
                      fontWeight: '600',
                    }}
                  >
                    {quickReply}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ChatBottomInputBar
            value={chatDraft}
            onChangeText={setChatDraft}
            onSend={() => {
              void handleDoctorSendChat();
            }}
          />
        </KeyboardAvoidingView>
      );
    }

    // DANH SÁCH HỘP THƯ BỆNH NHÂN (MESSENGER INBOX LIST VIEW)
    return (
      <ScrollView
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Messenger Header Banner */}
        <LinearGradient
          colors={GRADIENTS.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, SHADOWS.md]}
        >
          <View style={styles.heroTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: doctor.avatar }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#22C55E',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}
                />
              </View>
              <View>
                <Text style={styles.heroName}>Phòng Chat Tư Vấn</Text>
                <Text style={styles.heroEmail}>
                  {doctor.name} • Đồng bộ Realtime
                </Text>
              </View>
            </View>
            <Badge
              label={
                unreadThreadCount > 0
                  ? `${unreadThreadCount} tin mới`
                  : `${messengerThreads.length} hội thoại`
              }
              variant="teal"
              showDot
            />
          </View>
        </LinearGradient>

        {/* Messenger Search Bar */}
        <AppInput
          label="Tìm kiếm hộp thư bệnh nhân"
          leftIcon="search-outline"
          placeholder="Nhập tên bệnh nhân, mã lịch hẹn hoặc nội dung tin nhắn..."
          value={chatSearchQuery}
          onChangeText={setChatSearchQuery}
        />

        {/* Messenger Active Now Strip (Bệnh nhân đang kết nối) */}
        {messengerThreads.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={[
                styles.docSub,
                { fontWeight: '700', marginBottom: 10 },
              ]}
            >
              ĐANG KẾT NỐI ({messengerThreads.length} BỆNH NHÂN)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {messengerThreads.map((thread) => {
                  const hasUnread = thread.lastSenderRole === 'patient';
                  return (
                    <TouchableOpacity
                      key={`story-${thread.patientId}`}
                      onPress={() => setActiveChatPatientId(thread.patientId)}
                      style={{ alignItems: 'center', width: 68 }}
                    >
                      <View style={{ position: 'relative' }}>
                        <View
                          style={{
                            width: 54,
                            height: 54,
                            borderRadius: 27,
                            backgroundColor: hasUnread
                              ? COLORS.primary
                              : COLORS.tintBlue,
                            borderWidth: hasUnread ? 2.5 : 1.5,
                            borderColor: hasUnread
                              ? '#38BDF8'
                              : COLORS.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              color: hasUnread ? '#FFFFFF' : COLORS.primary,
                              fontWeight: '800',
                              fontSize: 16,
                            }}
                          >
                            {thread.initials}
                          </Text>
                        </View>
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 1,
                            right: 1,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: '#22C55E',
                            borderWidth: 2,
                            borderColor: COLORS.surface,
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: hasUnread ? '800' : '600',
                          color: COLORS.textPrimary,
                          marginTop: 5,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        {thread.patientName.split(' ').slice(-2).join(' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : null}

        <SectionHeader
          title="Tin nhắn gần đây"
          subtitle="Nhấn vào bệnh nhân để mở cửa sổ chat tư vấn 1-1"
        />

        {filteredThreads.length === 0 ? (
          <View
            style={[
              styles.card,
              SHADOWS.sm,
              { alignItems: 'center', paddingVertical: 32 },
            ]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={44}
              color={COLORS.textSecondary}
            />
            <Text
              style={[styles.docName, { marginTop: 12, textAlign: 'center' }]}
            >
              Chưa có cuộc trò chuyện nào
            </Text>
            <Text
              style={[
                styles.docSub,
                { textAlign: 'center', marginTop: 4, maxWidth: 320 },
              ]}
            >
              Khi bệnh nhân gửi tin nhắn tư vấn hoặc đặt lịch khám với bạn, hộp thư của họ sẽ tự động xuất hiện tại đây như Messenger.
            </Text>
          </View>
        ) : (
          filteredThreads.map((thread) => {
            const isWaitingReply = thread.lastSenderRole === 'patient';
            return (
              <TouchableOpacity
                key={thread.patientId}
                activeOpacity={0.85}
                onPress={() => setActiveChatPatientId(thread.patientId)}
                style={[
                  styles.card,
                  SHADOWS.sm,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 14,
                    borderLeftWidth: isWaitingReply ? 4 : 1,
                    borderLeftColor: isWaitingReply
                      ? COLORS.primary
                      : COLORS.border,
                  },
                ]}
              >
                {/* Messenger Avatar */}
                <View style={{ position: 'relative' }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: isWaitingReply
                        ? COLORS.primary
                        : COLORS.tintBlue,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: isWaitingReply ? '#FFFFFF' : COLORS.primary,
                        fontWeight: '800',
                        fontSize: 16,
                      }}
                    >
                      {thread.initials}
                    </Text>
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: '#22C55E',
                      borderWidth: 2,
                      borderColor: COLORS.surface,
                    }}
                  />
                </View>

                {/* Conversation Details */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.heroTop}>
                    <Text
                      style={[
                        styles.docName,
                        {
                          flex: 1,
                          fontWeight: isWaitingReply ? '800' : '700',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {thread.patientName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isWaitingReply ? '700' : '500',
                        color: isWaitingReply
                          ? COLORS.primary
                          : COLORS.textMuted,
                      }}
                    >
                      {thread.lastMessageTime}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.docSub,
                      {
                        marginTop: 2,
                        color: isWaitingReply
                          ? COLORS.textPrimary
                          : COLORS.textSecondary,
                        fontWeight: isWaitingReply ? '700' : '400',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {thread.lastSenderRole === 'doctor'
                      ? `Bạn: ${thread.lastMessageText}`
                      : thread.lastMessageText}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 6,
                    }}
                  >
                    <Text
                      style={{ fontSize: 11, color: COLORS.textMuted }}
                      numberOfLines={1}
                    >
                      {thread.subtitle}
                    </Text>
                    {isWaitingReply ? (
                      <Badge
                        label={`Tin nhắn mới (${thread.unreadCount || 1})`}
                        variant="blue"
                        showDot
                      />
                    ) : thread.lastSenderRole === 'doctor' ? (
                      <Badge label="Đã trả lời" variant="teal" />
                    ) : (
                      <Badge label="Bấm để nhắn tin" variant="surface" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    );
  };

  const renderDoctorProfile = () => (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, SHADOWS.sm]}>
        <Text style={styles.docName}>{doctor.name}</Text>
        <Text style={styles.docSub}>
          Chức vụ: {doctor.degree}
        </Text>
        <Text style={styles.docSub}>Chuyên khoa: {doctor.subSpecialty || doctor.specialty}</Text>
        <Text style={styles.docSub}>Đơn vị: {doctor.hospital}</Text>
      </View>

      <AppButton
        title="Đăng xuất tài khoản"
        variant="danger"
        size="lg"
        leftIcon="log-out-outline"
        onPress={onLogout}
      />
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Cổng Bác Sĩ"
        subtitle={doctor.name}
        badgeText="BÁC SĨ"
        leftIconBox="medkit-outline"
        rightActions={[
          { icon: 'log-out-outline', label: 'Đăng xuất Bác sĩ', onPress: onLogout },
        ]}
      />

      <ToastBanner
        visible={!!toastMessage}
        title="Thông Báo"
        message={toastMessage ?? ''}
        onDismiss={() => setToastMessage(null)}
      />

      <View style={{ flex: 1 }}>
        {activeTab === 'schedule' && renderSchedule()}
        {(activeTab === 'patients' || activeTab === 'prescribe') && (CLOUD_MODE
          ? <ClinicStaffScreen key={selectedPatientApt?.id || 'queue'} embedded onLogout={onLogout} onComplete={completeAppointment} initialAppointmentId={selectedPatientApt?.id} />
          : activeTab === 'patients' ? renderPatientsEHR() : renderPrescribe())}
        {activeTab === 'chat' && renderDoctorChat()}
        {activeTab === 'profile' && renderDoctorProfile()}
      </View>

      <DoctorLabUploadModal
        visible={labUploadVisible}
        appointmentId={activePatient?.id || 'apt-1'}
        patientName={activePatientName}
        onClose={() => setLabUploadVisible(false)}
        onUpload={uploadLabResult}
        onSuccess={(created) =>
          setToastMessage(
            `Đã tải lên "${created.title}" lên Supabase Storage cho BN ${activePatientName}.`
          )
        }
      />
      <LabFileViewerModal
        visible={Boolean(viewingLabItem)}
        item={viewingLabItem}
        onClose={() => setViewingLabItem(null)}
      />

      {/* Doctor Bottom Bar */}
      <View style={[styles.roleTabBar, SHADOWS.md]}>
        {[
          { key: 'schedule', label: 'Ca trực', icon: 'calendar', badge: 0 },
          { key: 'patients', label: 'Bệnh án EHR', icon: 'folder-open', badge: 0 },
          { key: 'prescribe', label: 'Kê đơn thuốc', icon: 'document-text', badge: 0 },
          { key: 'chat', label: 'Phòng Chat', icon: 'chatbubbles', badge: unreadThreadCount },
          { key: 'profile', label: 'Hồ sơ BS', icon: 'person', badge: 0 },
        ].map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.roleTabItem}
              onPress={() => setActiveTab(t.key as DoctorTab)}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: active }}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={t.icon as any}
                  size={20}
                  color={active ? COLORS.primary : COLORS.textSecondary}
                  importantForAccessibility="no"
                />
                {t.badge > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -10,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: COLORS.error,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 9,
                        fontWeight: '800',
                      }}
                    >
                      {t.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.roleTabLabel,
                  active && styles.roleTabLabelActive,
                ]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollPad: {
    padding: SPACING.md,
    paddingBottom: 28,
  },
  heroBanner: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 18,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  adminAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docHeroAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: COLORS.textOnPrimary,
    backgroundColor: COLORS.surfaceContainer,
  },
  heroName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },
  heroEmail: {
    fontSize: TYPOGRAPHY.size.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroMetricsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.xs,
  },
  heroMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroMetricVal: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    color: '#86F2E4',
  },
  heroMetricLabel: {
    fontSize: TYPOGRAPHY.size.xxs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  kpiIconBlue: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconTeal: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.tintTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  kpiTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: TYPOGRAPHY.size.xxs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    ...LAYOUT.card,
  },
  barRow: {
    marginBottom: SPACING.sm,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  barName: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.xs,
  },
  barCount: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  barTrack: {
    height: 7,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  auditTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  auditSub: {
    fontSize: TYPOGRAPHY.size.xxs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  docManageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  docManageInfoCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: SPACING.sm,
  },
  docNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    marginTop: 3,
  },
  docHospitalLine: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
    lineHeight: 17,
  },
  docMeta: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xxs,
  },
  docActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aptRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  aptCode: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    color: COLORS.primary,
  },
  aptPatient: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  aptDoc: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  aptTime: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: SPACING.xxs,
  },
  symptomBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 10,
    marginVertical: 10,
  },
  symptomLabel: {
    fontSize: TYPOGRAPHY.size.xxs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  symptomText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textPrimary,
    marginTop: 2,
    lineHeight: 17,
  },
  vitalMiniBox: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    alignItems: 'center',
  },
  vitalMiniLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  vitalMiniVal: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  rxSectionLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  rxItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: SPACING.xs,
  },
  roleTabBar: {
    height: 62,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  roleTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTabLabel: {
    fontSize: TYPOGRAPHY.size.xxs,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },
  roleTabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  formFieldLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectChipActive: {
    backgroundColor: COLORS.tintBlue,
    borderColor: COLORS.primary,
  },
  selectChipText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownTriggerOpen: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  dropdownAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.tintBlue,
  },
  dropdownSelectedTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dropdownSelectedSub: {
    fontSize: TYPOGRAPHY.size.xxs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.tintBlue,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dropdownItemTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dropdownItemSub: {
    fontSize: TYPOGRAPHY.size.xxs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});

