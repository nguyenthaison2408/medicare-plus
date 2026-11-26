import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { CLOUD_MODE, getSupabase } from '../services/supabaseClient';
import {
  bookClinicAppointment, cancelClinicAppointment, checkInClinic, completeClinicAppointment, listClinicAppointments, listClinicDoctors,
  loadClinicProfile, subscribeClinicAppointments, toClinicStart, updateClinicProfile, type ClinicProfile, type ClinicAppointment, type ClinicMedication,
} from '../services/clinicCloud';
import { clinicAppointmentToItem, clinicPrescriptions, clinicRecord } from '../services/clinicAdapters';
import {
  fetchDoctorReviewsCloud,
  fetchAdminDoctorReviewsCloud,
  submitDoctorReviewCloud,
  moderateDoctorReviewCloud,
  deleteDoctorReviewCloud,
} from '../services/clinicReviews';
import {
  fetchFamilyMembersCloud,
  addFamilyMemberCloud,
  updateFamilyMemberCloud,
  deleteFamilyMemberCloud,
  type FamilyMemberInput,
} from '../services/clinicFamily';
import {
  fetchDoctorSchedulesCloud,
  upsertDoctorScheduleCloud,
  deleteDoctorScheduleCloud,
  fetchBhytConfigsCloud,
  upsertBhytConfigCloud,
  deleteBhytConfigCloud,
  updateDoctorAvatarCloud,
  type DoctorScheduleItem,
  type DoctorShiftType,
  type BhytConfigItem,
} from '../services/clinicAdmin';
import {
  addMedicineCabinetCloud,
  fetchMedicationDataForRole,
  setMedicationTakenCloud,
} from '../services/clinicMedicine';
import {
  deleteLabResultCloud,
  fetchLabResultsCloud,
  uploadLabResultCloud,
} from '../services/clinicLabResults';
import type { LabResultItem, UploadLabResultInput } from '../types/labResults';
import { addHospitalCloud, fetchHospitalsCloud } from '../services/clinicHospitals';
import type { PatientBookingInfo } from '../utils/bookingValidation';
import {
  APPOINTMENTS,
  AppointmentItem,
  BOOKING_DAYS,
  DaySlotItem,
  DOCTORS,
  DoctorItem,
  formatRelativeDate,
  HOSPITALS,
  HospitalItem,
  INITIAL_LAB_RESULTS,
  PATIENT_PROFILE,
  PRESCRIPTION_DRUGS,
  PrescriptionDrug,
  TIME_SLOTS,
  TimeSlotItem,
} from '../data/mockData';
import {
  storageService,
  bookingService,
  ehrService,
} from '../services/apiClient';

export interface FamilyMemberItem {
  id: string;
  name: string;
  relation: string;
  rawRelation?: string;
  code: string;
  blood: string;
  note: string;
  badge: string;
  dob?: string;
  bhyt?: string;
  gender?: string;
  phone?: string;
  allergies?: string;
}

export interface LatestBookingTicket {
  code: string;
  doctor: DoctorItem;
  dayLabel: string;
  fullDate: string;
  timeRange: string;
  room: string;
  queueNumber: string;
  consultMode: string;
  paymentMethod: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  symptoms?: string;
}

export interface NewDoctorInput {
  name: string;
  degree: string;
  specialty: string;
  hospital: string;
  address: string;
  latitude?: number;
  longitude?: number;
  feeNumeric: number;
  experienceYears: number;
  licenseCode: string;
  avatar?: string;
}

export interface NewHospitalInput {
  name: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  gateInfo?: string;
  parkingInfo?: string;
  workingHours?: string;
  tag?: string;
}

export interface MedicineCabinetItem {
  id: string;
  name: string;
  owner: string;
  stock: string;
  exp: string;
  urgent: boolean;
}

export interface MedicationDoseLogRef {
  logKey: string;
  appointmentId?: string;
  medicationIndex?: number;
  doseKey: string;
}

export interface DoctorReviewItem {
  id: string;
  doctorId: string;
  initials: string;
  authorName: string;
  metaText: string;
  comment: string;
  rating: number;
  isHidden?: boolean;
  adminNote?: string;
}

export type PatientProfileState = typeof PATIENT_PROFILE & {
  phone?: string;
  dob?: string;
};

export interface UpdatePatientProfileInput {
  name: string;
  phone?: string;
  dob?: string;
  age?: number;
  gender?: string;
  bloodType?: string;
  emergencyContact?: string;
  bhytCode?: string;
  bhytHospital?: string;
  bhytExpiry?: string;
  avatar?: string;
}

interface AppContextValue {
  // 1. Appointments & Booking
  appointments: AppointmentItem[];
  latestBooking: LatestBookingTicket;
  selectBookingTicket: (appointment: ClinicAppointment) => void;
  selectAppointmentTicket: (appointment: AppointmentItem) => void;
  createBooking: (params: {
    doctor: DoctorItem;
    day?: DaySlotItem;
    slot?: TimeSlotItem;
    consultMode?: string;
    paymentMethod: string;
    payOsOrderCode?: number;
    patientInfo: PatientBookingInfo;
  }) => Promise<LatestBookingTicket>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  completeAppointment: (
    appointmentId: string,
    diagnosis?: string,
    medications?: ClinicMedication[],
    notes?: string
  ) => Promise<boolean>;

  checkInAppointment: (appointmentId: string, bookingCode?: string) => Promise<boolean>;
  checkInByCode: (bookingCode: string) => Promise<boolean>;

  // 2. Medication Adherence Log
  takenMap: Record<string, boolean>;
  toggleMedicationTaken: (dose: MedicationDoseLogRef) => Promise<void>;

  // 3. Family Profiles
  familyMembers: FamilyMemberItem[];
  addFamilyMember: (member: FamilyMemberInput) => Promise<void>;
  updateFamilyMember: (id: string, member: FamilyMemberInput) => Promise<FamilyMemberItem>;
  deleteFamilyMember: (id: string) => Promise<void>;

  // 4. Prescriptions & Doctors (Shared with Doctor/Admin Portals)
  prescriptions: PrescriptionDrug[];
  addPrescriptionDrug: (drug: Omit<PrescriptionDrug, 'id'>) => void;
  diagnosisNote: string;
  setDiagnosisNote: (note: string) => void;
  doctors: DoctorItem[];
  addDoctor: (input: NewDoctorInput) => DoctorItem;
  approveDoctor: (doctorId: string) => void;
  updateDoctorAvatar: (doctorId: string, avatarUrl: string) => Promise<void>;
  hospitals: HospitalItem[];
  addHospital: (input: NewHospitalInput) => Promise<HospitalItem>;
  refreshHospitalCatalog: () => Promise<void>;

  // 5. Medicine Cabinet & Doctor Reviews
  cabinetMeds: MedicineCabinetItem[];
  addCabinetMedicine: (
    med: Omit<MedicineCabinetItem, 'id' | 'owner'>
  ) => Promise<void>;
  doctorReviews: DoctorReviewItem[];
  addDoctorReview: (review: {
    doctorId: string;
    rating: number;
    comment: string;
  }) => Promise<void>;
  moderateDoctorReview: (reviewId: string, isHidden: boolean, adminNote?: string) => Promise<void>;
  deleteDoctorReview: (reviewId: string) => Promise<void>;

  // 6. Security & Privacy (PII Masking state) + Storage Persistence
  isPiiMasked: boolean;
  togglePiiMask: () => void;
  patientProfile: PatientProfileState;
  updatePatientProfile: (updates: UpdatePatientProfileInput) => Promise<void>;
  doctorSchedules: DoctorScheduleItem[];
  saveDoctorSchedule: (input: {
    id?: string;
    doctorId: string;
    workDate: string;
    shift: DoctorShiftType;
    room: string;
    active?: boolean;
  }) => Promise<DoctorScheduleItem>;
  deleteDoctorSchedule: (id: string) => Promise<void>;
  bhytConfigs: BhytConfigItem[];
  saveBhytConfig: (config: BhytConfigItem) => Promise<BhytConfigItem>;
  toggleBhytConfig: (id: string) => Promise<void>;
  deleteBhytConfig: (id: string) => Promise<void>;
  labResults: LabResultItem[];
  uploadLabResult: (input: UploadLabResultInput) => Promise<LabResultItem>;
  deleteLabResult: (resultId: string) => Promise<void>;
  cloudProfile: ClinicProfile | null;
  isHydrated: boolean;
  cloudSyncError: string;
  resetAppData: () => Promise<void>;
}

const INITIAL_CABINET_MEDS: MedicineCabinetItem[] = [
  {
    id: 'cab-1',
    name: 'Sibelium 5mg (Flunarizine)',
    owner: 'Nguyễn Văn Vũ (Bản thân)',
    stock: 'Còn 4 / 30 viên',
    exp: 'HSD: 12/2026',
    urgent: true,
  },
  {
    id: 'cab-2',
    name: 'Ginkgo Biloba 80mg',
    owner: 'Nguyễn Văn Vũ (Bản thân)',
    stock: 'Còn 18 / 30 viên',
    exp: 'HSD: 08/2026',
    urgent: false,
  },
  {
    id: 'cab-3',
    name: 'Amlodipine 5mg (Thuốc Huyết áp)',
    owner: 'Bà Trần Thị Lan (Mẹ • 62T)',
    stock: 'Còn 22 / 30 viên',
    exp: 'HSD: 05/2027',
    urgent: false,
  },
];

const INITIAL_DOCTOR_REVIEWS: DoctorReviewItem[] = [
  {
    id: 'rev-1',
    doctorId: 'doc-1',
    initials: 'HN',
    authorName: 'Nguyễn Hoàng Nam',
    metaText: '3 ngày trước • Khám Đau đầu thái dương',
    comment:
      'Bác sĩ Trang tư vấn rất kỹ lưỡng và ân cần, giải thích rõ nguyên nhân tôi bị đau đầu thái dương do stress công việc. Uống thuốc theo toa 2 ngày đã đỡ hẳn.',
    rating: 5,
  },
  {
    id: 'rev-2',
    doctorId: 'doc-1',
    initials: 'MT',
    authorName: 'Trần Minh Tâm',
    metaText: '1 tuần trước • Khám Tiền đình & MRI',
    comment:
      'Bác sĩ giải thích cặn kẽ kết quả chụp MRI và hướng dẫn tập luyện giảm áp lực mắt, thái độ nhẹ nhàng chu đáo.',
    rating: 5,
  },
];

const INITIAL_FAMILY_MEMBERS: FamilyMemberItem[] = [
  {
    id: 'fam-1',
    name: 'Bé Nguyễn Bảo Nam',
    relation: 'Con trai • 4 tuổi',
    code: '#BN-992104',
    blood: 'O+',
    note: 'Sắp tiêm nhắc MMR • Tăng trưởng chuẩn WHO',
    badge: 'Nhi đồng',
    dob: '18/09/2020',
    bhyt: 'TE1 79 234 88190',
  },
  {
    id: 'fam-2',
    name: 'Bà Trần Thị Lan',
    relation: 'Mẹ ruột • 62 tuổi',
    code: '#BN-441029',
    blood: 'A+',
    note: 'Đang theo dõi Huyết áp & Tim mạch tại BV ĐHYD',
    badge: 'Cao tuổi',
    dob: '12/04/1962',
    bhyt: 'HT2 79 234 11029',
  },
  {
    id: 'fam-3',
    name: 'Nguyễn Thị Mai',
    relation: 'Vợ • 30 tuổi',
    code: '#BN-882915',
    blood: 'B+',
    note: 'Khám sức khỏe định kỳ loại I (Tốt)',
    badge: 'BHYT 80%',
    dob: '05/11/1994',
    bhyt: 'DN4 79 234 82399',
  },
];

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  ...APPOINTMENTS,
  {
    id: 'apt-completed-1',
    code: '#KB-241028-9982',
    doctor: DOCTORS[0],
    dateLabel: 'Đã khám • 28/10/2024',
    timeRange: '09:00 - 09:30, 28/10/2024',
    queueNumber: 'STT #08',
    room: 'Phòng 302, Tầng 3, Tòa nhà A',
    status: 'completed',
    mode: 'clinic',
    statusBadge: 'Đã có kết quả',
  },
  {
    id: 'apt-cancelled-1',
    code: '#SC-241010-3310',
    doctor: DOCTORS[1],
    dateLabel: 'Đã hủy • 10/10/2024',
    timeRange: '15:00 - 15:30, 10/10/2024',
    queueNumber: 'STT #21',
    room: 'Phòng 205, Khoa Tim mạch',
    status: 'cancelled',
    mode: 'clinic',
    statusBadge: 'Đã hủy lịch',
  },
];

const toIsoDateOffset = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const INITIAL_DOCTOR_SCHEDULES: DoctorScheduleItem[] = [
  { id: 'sch-1', doctorId: 'doc-1', workDate: toIsoDateOffset(0), shift: 'morning', room: 'P.302 • Tầng 3, Tòa nhà A', active: true },
  { id: 'sch-2', doctorId: 'doc-1', workDate: toIsoDateOffset(1), shift: 'full_day', room: 'P.302 • Tầng 3, Tòa nhà A', active: true },
  { id: 'sch-3', doctorId: 'doc-2', workDate: toIsoDateOffset(0), shift: 'afternoon', room: 'P.205 • Khoa Tim mạch', active: true },
  { id: 'sch-4', doctorId: 'doc-3', workDate: toIsoDateOffset(0), shift: 'full_day', room: 'P.108 • Khoa Nhi', active: true },
  { id: 'sch-5', doctorId: 'doc-4', workDate: toIsoDateOffset(1), shift: 'morning', room: 'P.401 • Khoa Da liễu', active: true },
];

const INITIAL_BHYT_CONFIGS: BhytConfigItem[] = [
  { id: 'bhyt-te', prefixCode: 'TE', groupName: 'Trẻ em dưới 6 tuổi', inNetworkRate: 100, outNetworkRate: 80, active: true },
  { id: 'bhyt-ht', prefixCode: 'HT', groupName: 'Người hưởng lương hưu / Cao tuổi', inNetworkRate: 95, outNetworkRate: 60, active: true },
  { id: 'bhyt-dn', prefixCode: 'DN', groupName: 'Người lao động doanh nghiệp', inNetworkRate: 80, outNetworkRate: 40, active: true },
  { id: 'bhyt-gd', prefixCode: 'GD', groupName: 'Tham gia theo Hộ gia đình', inNetworkRate: 80, outNetworkRate: 40, active: true },
];

const INITIAL_PATIENT_PROFILE: PatientProfileState = {
  ...PATIENT_PROFILE,
  phone: '0912345678',
  dob: '15/06/1994',
};

const DEFAULT_TICKET: LatestBookingTicket = {
  code: '#SC-241029-8892',
  doctor: DOCTORS[0],
  dayLabel: 'Thứ 3',
  fullDate: '29/10/2024',
  timeRange: '09:30 - 10:00',
  room: 'P.302 • Tầng 3, Tòa nhà A',
  queueNumber: 'STT #14',
  consultMode: 'clinic',
  paymentMethod: 'at_clinic_bhyt',
  patientName: PATIENT_PROFILE.name,
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appointments, setAppointments] =
    useState<AppointmentItem[]>(CLOUD_MODE ? [] : INITIAL_APPOINTMENTS);
  const [latestBooking, setLatestBooking] =
    useState<LatestBookingTicket>(CLOUD_MODE ? { ...DEFAULT_TICKET, code: '' } : DEFAULT_TICKET);
  const selectedTicketCode = useRef<string | null>(null);
  const [takenMap, setTakenMap] = useState<Record<string, boolean>>(
    {}
  );
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>(
    CLOUD_MODE ? [] : INITIAL_FAMILY_MEMBERS
  );
  const [prescriptions, setPrescriptions] =
    useState<PrescriptionDrug[]>(CLOUD_MODE ? [] : PRESCRIPTION_DRUGS);
  const [diagnosisNote, setDiagnosisNote] = useState<string>(
    CLOUD_MODE ? '' : 'Đau đầu căng thẳng (Tension headache) / Rối loạn vận mạch não nhẹ'
  );
  const [doctors, setDoctors] = useState<DoctorItem[]>(CLOUD_MODE ? [] : DOCTORS);
  const [hospitals, setHospitals] = useState<HospitalItem[]>(
    CLOUD_MODE ? [] : HOSPITALS
  );
  const [cabinetMeds, setCabinetMeds] =
    useState<MedicineCabinetItem[]>(CLOUD_MODE ? [] : INITIAL_CABINET_MEDS);
  const [doctorReviews, setDoctorReviews] = useState<DoctorReviewItem[]>(
    CLOUD_MODE ? [] : INITIAL_DOCTOR_REVIEWS
  );
  const [localPatientProfile, setLocalPatientProfile] = useState<PatientProfileState>(INITIAL_PATIENT_PROFILE);
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorScheduleItem[]>(
    CLOUD_MODE ? [] : INITIAL_DOCTOR_SCHEDULES
  );
  const [bhytConfigs, setBhytConfigs] = useState<BhytConfigItem[]>(CLOUD_MODE ? [] : INITIAL_BHYT_CONFIGS);
  const [labResults, setLabResults] = useState<LabResultItem[]>(
    CLOUD_MODE ? [] : INITIAL_LAB_RESULTS
  );
  const [isPiiMasked, setIsPiiMasked] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(CLOUD_MODE);
  const hydratedRef = useRef<boolean>(CLOUD_MODE);
  const cloudUserIdRef = useRef<string | null>(null);
  const [cloudProfile, setCloudProfile] = useState<ClinicProfile | null>(null);
  const [cloudSyncError, setCloudSyncError] = useState('');

  const refreshHospitalCatalog = async (): Promise<void> => {
    if (!CLOUD_MODE) return;

    try {
      const cloudHospitals = await fetchHospitalsCloud();
      setHospitals(cloudHospitals);
      setCloudSyncError('');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không tải được danh mục cơ sở y tế.';
      setCloudSyncError(message);
      throw error;
    }
  };

  useEffect(() => {
    if (!CLOUD_MODE) return;
    let mounted = true;
    let generation = 0;
    let userId: string | undefined;
    const refresh = async () => {
      const request = ++generation;
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || request !== generation) return;
        if (cloudUserIdRef.current !== (session?.user.id ?? null)) setLabResults([]);
        cloudUserIdRef.current = session?.user.id ?? null;
        if (!session) {
          setAppointments([]);
          setPrescriptions([]);
          setFamilyMembers([]);
          setDoctorReviews([]);
          setCabinetMeds([]);
          setTakenMap({});
          setDoctorSchedules([]);
          setBhytConfigs([]);
          setLabResults([]);
          setCloudProfile(null);
          setDoctors([]);
          setDiagnosisNote('');
          setCloudSyncError('');
          setLatestBooking({ ...DEFAULT_TICKET, code: '' });
          listClinicDoctors().then(cloudDoctors => {
            if (mounted && cloudDoctors && cloudDoctors.length > 0) {
              setDoctors(prev =>
                cloudDoctors.map(cd => {
                  const existing = prev.find(p => p.id === cd.id) || DOCTORS.find(d => d.id === cd.id);
                  if (existing) {
                    return {
                      ...existing,
                      name: cd.name || existing.name,
                      specialty: cd.specialty || existing.specialty,
                      hospital: cd.hospital || existing.hospital,
                      avatar: cd.avatar_url?.trim() || existing.avatar,
                      fee: cd.fee_vnd ? `${cd.fee_vnd.toLocaleString('vi-VN')} đ` : existing.fee,
                      feeNumeric: cd.fee_vnd ?? existing.feeNumeric,
                    };
                  }
                  return {
                    id: cd.id,
                    name: cd.name,
                    degree: 'Bác sĩ chuyên khoa',
                    specialty: cd.specialty,
                    subSpecialty: cd.specialty,
                    hospital: cd.hospital,
                    address: cd.hospital,
                    experienceYears: 10,
                    rating: 4.9,
                    reviewCount: 50,
                    patientCount: '1k+',
                    responseTime: '< 15p',
                    fee: `${(cd.fee_vnd ?? 300000).toLocaleString('vi-VN')} đ`,
                    feeNumeric: cd.fee_vnd ?? 300000,
                    bhytSupport: 'Hỗ trợ BHYT',
                    availableText: 'Trống hôm nay',
                    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
                    verified: true,
                    bio: `Bác sĩ ${cd.name} chuyên khoa ${cd.specialty} tại ${cd.hospital}.`,
                    strengths: [cd.specialty],
                  };
                })
              );
            }
          }).catch(() => {});
          fetchHospitalsCloud()
            .then(cloudHospitals => {
              if (mounted && request === generation) setHospitals(cloudHospitals);
            })
            .catch(error => {
              if (mounted && request === generation) {
                setCloudSyncError(error instanceof Error ? error.message : 'Không tải được cơ sở y tế.');
              }
            });
          return;
        }
        const profile = await loadClinicProfile();
        if (!mounted || request !== generation) return;
        setCloudProfile(profile);
        const [cloudAppointments, cloudDoctors, families, reviews, schedules, configs, hospitalCatalog] = await Promise.all([
          listClinicAppointments(profile.role === 'patient' ? profile.id : undefined).catch(() => []),
          listClinicDoctors().catch(() => []),
          fetchFamilyMembersCloud().catch(() => []),
          (profile.role === 'admin'
            ? fetchAdminDoctorReviewsCloud()
            : fetchDoctorReviewsCloud()
          ).catch(() => []),
          fetchDoctorSchedulesCloud().catch(() => []),
          fetchBhytConfigsCloud().catch(() => []),
          fetchHospitalsCloud()
            .then(hospitals => ({ hospitals, error: null as unknown }))
            .catch(error => ({ hospitals: null, error })),
        ]);
        if (!mounted || request !== generation) return;
        if (cloudDoctors && cloudDoctors.length > 0) {
          setDoctors(prev =>
            cloudDoctors.map(cd => {
              const existing = prev.find(p => p.id === cd.id) || DOCTORS.find(d => d.id === cd.id);
              if (existing) {
                return {
                  ...existing,
                  name: cd.name || existing.name,
                  specialty: cd.specialty || existing.specialty,
                  hospital: cd.hospital || existing.hospital,
                  avatar: cd.avatar_url?.trim() || existing.avatar,
                  fee: cd.fee_vnd ? `${cd.fee_vnd.toLocaleString('vi-VN')} đ` : existing.fee,
                  feeNumeric: cd.fee_vnd ?? existing.feeNumeric,
                };
              }
              return {
                id: cd.id,
                name: cd.name,
                degree: 'Bác sĩ chuyên khoa',
                specialty: cd.specialty,
                subSpecialty: cd.specialty,
                hospital: cd.hospital,
                address: cd.hospital,
                experienceYears: 10,
                rating: 4.9,
                reviewCount: 50,
                patientCount: '1k+',
                responseTime: '< 15p',
                fee: `${(cd.fee_vnd ?? 300000).toLocaleString('vi-VN')} đ`,
                feeNumeric: cd.fee_vnd ?? 300000,
                bhytSupport: 'Hỗ trợ BHYT',
                availableText: 'Trống hôm nay',
                avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
                verified: true,
                bio: `Bác sĩ ${cd.name} chuyên khoa ${cd.specialty} tại ${cd.hospital}.`,
                strengths: [cd.specialty],
              };
            })
          );
        }
        setCloudProfile(profile);
        if (hospitalCatalog.hospitals) {
          setHospitals(hospitalCatalog.hospitals);
        }
        setAppointments(cloudAppointments.map(clinicAppointmentToItem));
        const activeAppointments = cloudAppointments.filter(appointment => appointment.status === 'CONFIRMED' || appointment.status === 'CHECKED_IN');
        const activeAppointment = activeAppointments.find(appointment => appointment.booking_code === selectedTicketCode.current) || activeAppointments[0];
        if (activeAppointment) {
          const item = clinicAppointmentToItem(activeAppointment);
          const date = new Date(activeAppointment.starts_at);
          const isActiveChat = Boolean(
            activeAppointment.symptoms && activeAppointment.symptoms.startsWith('[Tư vấn Chat]')
          );
          setLatestBooking({
            code: item.code, doctor: item.doctor,
            dayLabel: date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long' }),
            fullDate: date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
            timeRange: date.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }), room: item.room || item.doctor.hospital,
            queueNumber: item.queueNumber || 'Đã xác nhận', consultMode: isActiveChat ? 'chat' : 'clinic', paymentMethod: activeAppointment.payment_method,
            patientName: activeAppointment.patient_name,
            patientPhone: activeAppointment.patient_phone,
            patientEmail: activeAppointment.patient_email,
            symptoms: activeAppointment.symptoms,
          });
        } else { setLatestBooking({ ...DEFAULT_TICKET, code: '' }); }
        setPrescriptions(clinicPrescriptions(cloudAppointments));
        setDiagnosisNote(cloudAppointments.map(clinicRecord).find(Boolean)?.diagnosis || 'Chưa có chẩn đoán được bác sĩ lưu.');
        setFamilyMembers(families);
        setDoctorReviews(reviews);
        setDoctorSchedules(schedules);
        setBhytConfigs(configs);
        setCabinetMeds([]);
        setTakenMap({});
        if (hospitalCatalog.error) {
          setCloudSyncError(
            hospitalCatalog.error instanceof Error
              ? hospitalCatalog.error.message
              : 'Không tải được danh mục cơ sở y tế.'
          );
        } else {
          setCloudSyncError('');
        }

        // Medicine data is patient-only. It must never block staff profiles,
        // appointments or the rest of the portal from loading.
        try {
          const medicationData = await fetchMedicationDataForRole(profile.role);
          if (!mounted || request !== generation) return;
          setCabinetMeds(medicationData.medicines);
          setTakenMap(medicationData.takenMap);
        } catch (error) {
          if (mounted && request === generation) {
            setCloudSyncError(
              error instanceof Error
                ? error.message
                : 'Không tải được dữ liệu thuốc trực tuyến.'
            );
          }
        }

        try {
          const cloudLabResults = await fetchLabResultsCloud(profile.role);
          if (!mounted || request !== generation) return;
          setLabResults(
            cloudLabResults.map((item) => {
              const matchedDoc = (cloudDoctors || []).find((d) => d.id === item.doctorId)
                || DOCTORS.find((d) => d.id === item.doctorId);
              return matchedDoc ? { ...item, doctorName: matchedDoc.name } : item;
            })
          );
        } catch {
          if (mounted && request === generation) setLabResults([]);
        }
      } catch (error) {
        if (mounted && request === generation) setCloudSyncError(error instanceof Error ? error.message : 'Không tải được dữ liệu trực tuyến.');
      }
    };
    let unsubscribeChanges = () => {};
    let unsubscribeAuth = () => {};
    try {
      const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
        generation++;
        cloudUserIdRef.current = session?.user.id ?? null;
        if (userId !== session?.user.id) {
          userId = session?.user.id;
          selectedTicketCode.current = null;
          setFamilyMembers([]);
          setDoctorReviews([]);
          setCabinetMeds([]);
          setTakenMap({});
          setDoctorSchedules([]);
          setBhytConfigs([]);
          setLabResults([]);
          setAppointments([]); setPrescriptions([]); setCloudProfile(null); setDiagnosisNote('');
          setLatestBooking({ ...DEFAULT_TICKET, code: '' });
        }
        // Avoid Supabase calls inside its auth event callback.
        setTimeout(() => { if (mounted) void refresh(); }, 0);
      });
      unsubscribeAuth = () => subscription.unsubscribe();
      unsubscribeChanges = subscribeClinicAppointments(() => { void refresh(); });
    } catch (error) {
      setTimeout(() => { if (mounted) setCloudSyncError(error instanceof Error ? error.message : 'Chưa kết nối dữ liệu.'); }, 0);
    }
    void refresh();
    void fetchDoctorReviewsCloud().then(reviews => { if (mounted) setDoctorReviews(reviews); }).catch(error => {
      if (mounted) setCloudSyncError(error instanceof Error ? error.message : 'Chưa tải được đánh giá.');
    });
    return () => { mounted = false; generation++; unsubscribeAuth(); unsubscribeChanges(); };
  }, []);

  // 1. Khôi phục dữ liệu đã lưu trong AsyncStorage khi mở ứng dụng
  useEffect(() => {
    if (CLOUD_MODE) return;
    let mounted = true;
    storageService.loadPersistedState().then((saved) => {
      if (!mounted) return;
      if (saved) {
        if (Array.isArray(saved.appointments) && saved.appointments.length > 0) {
          setAppointments(saved.appointments);
        }
        if (saved.latestBooking) {
          setLatestBooking(saved.latestBooking);
        }
        if (saved.takenMap) {
          setTakenMap(saved.takenMap);
        }
        if (Array.isArray(saved.familyMembers) && saved.familyMembers.length > 0) {
          setFamilyMembers(saved.familyMembers);
        }
        if (Array.isArray(saved.prescriptions) && saved.prescriptions.length > 0) {
          setPrescriptions(saved.prescriptions);
        }
        if (saved.diagnosisNote) {
          setDiagnosisNote(saved.diagnosisNote);
        }
        if (typeof saved.isPiiMasked === 'boolean') {
          setIsPiiMasked(saved.isPiiMasked);
        }
        if (Array.isArray(saved.cabinetMeds) && saved.cabinetMeds.length > 0) {
          setCabinetMeds(saved.cabinetMeds);
        }
        if (Array.isArray(saved.doctorReviews) && saved.doctorReviews.length > 0) {
          setDoctorReviews(saved.doctorReviews);
        }
        if (Array.isArray(saved.doctors) && saved.doctors.length > 0) {
          setDoctors(saved.doctors);
        }
        if (Array.isArray(saved.hospitals) && saved.hospitals.length > 0) {
          setHospitals(saved.hospitals);
        }
        if (saved.patientProfile) {
          setLocalPatientProfile({ ...INITIAL_PATIENT_PROFILE, ...saved.patientProfile });
        }
        if (Array.isArray(saved.doctorSchedules) && saved.doctorSchedules.length > 0) {
          setDoctorSchedules(saved.doctorSchedules);
        }
        if (Array.isArray(saved.bhytConfigs) && saved.bhytConfigs.length > 0) {
          setBhytConfigs(saved.bhytConfigs);
        }
      }
      hydratedRef.current = true;
      setIsHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Tự động lưu mọi thay đổi xuống AsyncStorage
  useEffect(() => {
    if (CLOUD_MODE) return;
    if (!hydratedRef.current) return;
    storageService.savePersistedState({
      appointments,
      latestBooking,
      takenMap,
      familyMembers,
      prescriptions,
      diagnosisNote,
      isPiiMasked,
      cabinetMeds,
      doctorReviews,
      doctors,
      hospitals,
      patientProfile: localPatientProfile,
      doctorSchedules,
      bhytConfigs,
      updatedAt: new Date().toISOString(),
    });
  }, [
    appointments,
    latestBooking,
    takenMap,
    familyMembers,
    prescriptions,
    diagnosisNote,
    isPiiMasked,
    cabinetMeds,
    doctorReviews,
    doctors,
    hospitals,
    localPatientProfile,
    doctorSchedules,
    bhytConfigs,
  ]);

  const createBooking = async ({
    doctor,
    day,
    slot,
    consultMode = 'clinic',
    paymentMethod,
    payOsOrderCode,
    patientInfo,
  }: {
    doctor: DoctorItem;
    day?: DaySlotItem;
    slot?: TimeSlotItem;
    consultMode?: string;
    paymentMethod: string;
    payOsOrderCode?: number;
    patientInfo: PatientBookingInfo;
  }): Promise<LatestBookingTicket> => {
    const chosenDay = day || BOOKING_DAYS[1];
    const chosenSlot = slot || TIME_SLOTS[3];
    const targetStartIso = toClinicStart(chosenDay, chosenSlot);
    const targetStartMs = new Date(targetStartIso).getTime();

    const isSameAppointmentSlot = (apt: AppointmentItem): boolean => {
      if (apt.status !== 'upcoming') return false;
      if (apt.startsAt) {
        return new Date(apt.startsAt).getTime() === targetStartMs;
      }
      return (
        apt.dateLabel.includes(chosenDay.fullDate) &&
        apt.dateLabel.includes(chosenSlot.time)
      );
    };

    const existingConflict = appointments.find((apt) => {
      if (!isSameAppointmentSlot(apt)) return false;
      if (CLOUD_MODE && cloudUserIdRef.current && apt.patientId) {
        return apt.patientId === cloudUserIdRef.current;
      }
      return true;
    });

    if (existingConflict) {
      if (existingConflict.doctor.id === doctor.id) {
        throw new Error(
          `Bạn đã đặt lịch với ${doctor.name} vào khung giờ ${chosenSlot.time} ngày ${chosenDay.fullDate}. Lịch đã đặt không thể đặt trùng hoặc thay đổi.`
        );
      }
      throw new Error(
        `Bạn đã có lịch hẹn với ${existingConflict.doctor.name} vào khung giờ ${chosenSlot.time} ngày ${chosenDay.fullDate}. Không thể đặt 2 bác sĩ cùng một khung giờ.`
      );
    }

    if (!CLOUD_MODE) {
      const doctorSlotTaken = appointments.some(
        (apt) => apt.doctor.id === doctor.id && isSameAppointmentSlot(apt)
      );
      if (doctorSlotTaken) {
        throw new Error(
          `Khung giờ ${chosenSlot.time} ngày ${chosenDay.fullDate} của ${doctor.name} đã có người đặt. Vui lòng chọn khung giờ khác.`
        );
      }
    }

    if (CLOUD_MODE) {
      if (consultMode !== 'clinic' && consultMode !== 'chat' && consultMode !== 'video') {
        throw new Error('Hình thức khám không hợp lệ.');
      }
      if (paymentMethod !== 'at_clinic' && paymentMethod !== 'at_clinic_bhyt' && paymentMethod !== 'vietqr') {
        throw new Error('Vui lòng chọn thanh toán tại cơ sở y tế.');
      }
      const isChatMode = consultMode === 'chat' || consultMode === 'video';
      const normalizedPatientInfo: PatientBookingInfo =
        isChatMode && !patientInfo.symptoms.trim().startsWith('[Tư vấn Chat]')
          ? {
              ...patientInfo,
              symptoms: `[Tư vấn Chat] ${patientInfo.symptoms.trim()}`,
            }
          : patientInfo;
      const appointment = await bookClinicAppointment(
        doctor,
        chosenDay,
        chosenSlot,
        normalizedPatientInfo,
        paymentMethod,
        payOsOrderCode
      );
      const ticket: LatestBookingTicket = {
        code: appointment.booking_code, doctor, dayLabel: chosenDay.dayLabel, fullDate: chosenDay.fullDate,
        timeRange: chosenSlot.time,
        room: isChatMode ? 'Phòng Tư vấn Chat Trực tuyến' : doctor.hospital,
        queueNumber: 'Đã xác nhận',
        consultMode: isChatMode ? 'chat' : 'clinic',
        paymentMethod: appointment.payment_method,
        patientName: appointment.patient_name,
        patientPhone: appointment.patient_phone,
        patientEmail: appointment.patient_email,
        symptoms: appointment.symptoms,
      };
      selectedTicketCode.current = ticket.code;
      setLatestBooking(ticket);
      const appItem = clinicAppointmentToItem(appointment);
      setAppointments(prev => [appItem, ...prev.filter(item => item.id !== appointment.id)]);
      return ticket;
    }
    const randNum = Math.floor(1000 + Math.random() * 8999);
    const sttNum = Math.floor(15 + Math.random() * 20);
    const code = `#SC-2411-${randNum}`;
    const isVideo = consultMode === 'chat' || consultMode === 'video';

    const newTicket: LatestBookingTicket = {
      code,
      doctor,
      dayLabel: chosenDay.dayLabel,
      fullDate: chosenDay.fullDate,
      timeRange: `${chosenSlot.time} (${chosenDay.dayLabel})`,
      room: isVideo ? 'Phòng tư vấn Trực tuyến' : 'P.302 • Tầng 3, Tòa nhà A',
      queueNumber: isVideo ? `ONLINE #${sttNum}` : `STT #${sttNum}`,
      consultMode,
      paymentMethod,
      patientName: patientInfo.fullName,
      patientPhone: patientInfo.phone,
      patientEmail: patientInfo.email,
      symptoms: patientInfo.symptoms,
    };

    const newApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      code,
      doctor,
      dateLabel: `${chosenDay.dayLabel} (${chosenDay.fullDate}) • ${chosenSlot.time}`,
      timeRange: `${chosenSlot.time}, ${chosenDay.dayLabel} ${chosenDay.fullDate}`,
      startsAt: targetStartIso,
      queueNumber: newTicket.queueNumber,
      room: isVideo
        ? 'Tư vấn trực tuyến qua ứng dụng'
        : `Phòng 302, ${doctor.hospital}`,
      status: 'upcoming',
      mode: isVideo ? 'video' : 'clinic',
      patientName: patientInfo.fullName,
      patientPhone: patientInfo.phone,
      patientEmail: patientInfo.email,
      symptoms: patientInfo.symptoms,
      statusBadge:
        paymentMethod === 'at_clinic_bhyt'
          ? 'Giữ chỗ BHYT'
          : 'Đã thanh toán ✓',
    };

    setLatestBooking(newTicket);
    setAppointments((prev) => [newApt, ...prev]);
    bookingService.syncNewAppointment(newApt);
    return newTicket;
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (CLOUD_MODE) {
      try { await cancelClinicAppointment(appointmentId); }
      catch (error) { Alert.alert('Chưa hủy được lịch', error instanceof Error ? error.message : 'Vui lòng thử lại.'); return; }
    }
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? {
              ...apt,
              status: 'cancelled',
              statusBadge: 'Đã hủy theo yêu cầu',
              dateLabel: `Đã hủy • ${apt.dateLabel}`,
            }
          : apt
      )
    );
    if (!CLOUD_MODE) bookingService.syncCancelAppointment(appointmentId);
  };

  const completeAppointment = async (
    appointmentId: string, diagnosis?: string, medications?: ClinicMedication[], notes?: string
  ): Promise<boolean> => {
    try {
      if (CLOUD_MODE) {
        if (!diagnosis?.trim() || diagnosis.trim().length < 2) throw new Error('Vui lòng nhập chẩn đoán sau khi khám.');
        await completeClinicAppointment(appointmentId, diagnosis, medications || [], notes || '');
        const rows = await listClinicAppointments();
        setAppointments(rows.map(clinicAppointmentToItem));
        setPrescriptions(clinicPrescriptions(rows));
      } else {
        setAppointments(prev => prev.map(a => a.id === appointmentId
          ? { ...a, status: 'completed', statusBadge: 'Đã hoàn tất khám', diagnosis: diagnosis?.trim() || a.diagnosis } : a));
      }
      return true;
    } catch (error) {
      Alert.alert('Bệnh án điện tử', error instanceof Error ? error.message : 'Không thể lưu bệnh án. Vui lòng tải lại lịch khám.');
      return false;
    }
  };

  const checkInAppointment = async (appointmentId: string, bookingCode?: string): Promise<boolean> => {
    try {
      const target = appointments.find(a => a.id === appointmentId);
      if (!target || (bookingCode && bookingCode !== target.code) || target.status !== 'upcoming') {
        throw new Error('Phiếu hẹn không hợp lệ hoặc không còn chờ khám.');
      }
      if (CLOUD_MODE) {
        if (!target.code) throw new Error('Phiếu hẹn chưa có mã tiếp đón.');
        await checkInClinic(target.code);
        const rows = await listClinicAppointments();
        setAppointments(rows.map(clinicAppointmentToItem));
      } else {
        setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, statusBadge: 'Đã có mặt' } : a));
      }
      return true;
    } catch (error) {
      Alert.alert('Tiếp đón bệnh nhân', error instanceof Error ? error.message : 'Không thể tiếp đón. Vui lòng tải lại lịch khám.');
      return false;
    }
  };

  const checkInByCode = async (bookingCode: string): Promise<boolean> => {
    try {
      const trimmed = bookingCode.trim().toUpperCase();
      if (CLOUD_MODE) {
        await checkInClinic(trimmed);
        const rows = await listClinicAppointments();
        setAppointments(rows.map(clinicAppointmentToItem));
        return true;
      }
      const target = appointments.find(a => a.code?.toUpperCase() === trimmed);
      if (!target || target.status !== 'upcoming') throw new Error('Phiếu hẹn đã hủy, đã hoàn thành hoặc không tồn tại.');
      setAppointments(prev => {
        const current=prev.find(a=>a.id===target.id);
        if (!current || current.status !== 'upcoming') return prev;
        const day=current.startsAt?.slice(0,10) || current.dateLabel;
        const max=prev.filter(a=>a.doctor.id===current.doctor.id && (a.startsAt?.slice(0,10)||a.dateLabel)===day).reduce((n,a)=>Math.max(n,Number(a.queueNumber?.match(/\d+/)?.[0])||0),0);
        const queueNumber=current.queueNumber?.match(/\d+/) ? current.queueNumber : 'STT '+String(max+1).padStart(2,'0');
        return prev.map(a=>a.id===current.id?{...a,queueNumber,statusBadge:'Đã có mặt'}:a);
      });
      return true;
    } catch (error) {
      Alert.alert('Tiếp đón bệnh nhân', error instanceof Error ? error.message : 'Không thể tiếp đón. Vui lòng tải lại lịch khám.');
      return false;
    }
  };

  const toggleMedicationTaken = async (dose: MedicationDoseLogRef): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) {
        Alert.alert('Nhật ký uống thuốc', 'Vui lòng đăng nhập lại.');
        return;
      }
      const nextTaken = !takenMap[dose.logKey];
      try {
        const saved = await setMedicationTakenCloud(dose, nextTaken);
        if (cloudUserIdRef.current !== expectedUser) return;
        setTakenMap(saved);
      } catch (error) {
        Alert.alert(
          'Nhật ký uống thuốc',
          error instanceof Error ? error.message : 'Không thể cập nhật cữ thuốc.'
        );
      }
      return;
    }
    setTakenMap(prev => ({ ...prev, [dose.logKey]: !prev[dose.logKey] }));
  };

  const addFamilyMember = async (member: FamilyMemberInput): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      const saved = await addFamilyMemberCloud(member);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng tải lại hồ sơ.');
      setFamilyMembers(prev => [saved, ...prev]);
      return;
    }
    const randCode = Math.floor(100000 + Math.random() * 899999);
    const cleanNote =
      member.note?.trim() ||
      (member.bhyt
        ? `Đã liên kết BHYT (${member.bhyt})`
        : 'Hồ sơ người thân vừa tạo mới');
    const newMember: FamilyMemberItem = {
      id: `fam-${Date.now()}`,
      name: member.name.trim() || 'Thành viên mới',
      relation: `${member.relation} • Sinh: ${member.dob || '1995'}`,
      rawRelation: member.relation,
      code: `#BN-${randCode}`,
      blood: member.blood?.trim() || 'O+',
      note: cleanNote,
      badge: member.bhyt ? 'BHYT 80%' : 'Thành viên',
      dob: member.dob,
      bhyt: member.bhyt,
      gender: member.gender?.trim() || 'Chưa cập nhật',
      phone: member.phone?.trim() || '',
      allergies: member.allergies?.trim() || '',
    };
    setFamilyMembers((prev) => [newMember, ...prev]);

  };

  const addPrescriptionDrug = (drug: Omit<PrescriptionDrug, 'id'>) => {
    const newDrug: PrescriptionDrug = {
      ...drug,
      id: `rx-${Date.now()}`,
    };
    setPrescriptions((prev) => [newDrug, ...prev]);
    ehrService.syncPrescriptionDrug(newDrug, diagnosisNote);
  };

  const addCabinetMedicine = async (
    med: Omit<MedicineCabinetItem, 'id' | 'owner'>
  ): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại trước khi thêm thuốc.');
      const saved = await addMedicineCabinetCloud(med);
      if (cloudUserIdRef.current !== expectedUser) {
        throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng tải lại Tủ thuốc.');
      }
      setCabinetMeds(prev => [saved, ...prev]);
      return;
    }
    setCabinetMeds((prev) => [
      {
        ...med,
        owner: `${PATIENT_PROFILE.name} (Bản thân)`,
        id: `cab-${prev.length + 1}`,
      },
      ...prev,
    ]);
  };

  const addDoctorReview = async (review: {
    doctorId: string;
    rating: number;
    comment: string;
  }): Promise<void> => {
    const cleanComment = review.comment.trim();
    if (cleanComment.length < 2 || cleanComment.length > 1000) {
      throw new Error('Nội dung nhận xét phải từ 2 đến 1000 ký tự.');
    }
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập để đánh giá.');
      const saved = await submitDoctorReviewCloud({ ...review, comment: cleanComment });
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
      setDoctorReviews(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
      return;
    }
    const hasCompleted = appointments.some(
      (a) => a.doctor.id === review.doctorId && a.status === 'completed'
    );
    if (!hasCompleted) {
      throw new Error(
        'Chỉ bệnh nhân đã đặt lịch và hoàn tất lượt khám với bác sĩ này mới có thể gửi đánh giá.'
      );
    }
    const authorName = localPatientProfile.name.trim() || PATIENT_PROFILE.name;
    const alreadyReviewed = doctorReviews.some(
      (r) => r.doctorId === review.doctorId && r.authorName === authorName
    );
    if (alreadyReviewed) {
      throw new Error('Bạn đã gửi đánh giá cho bác sĩ này.');
    }
    const words = authorName.split(/\s+/);
    const initials =
      words.length >= 2
        ? `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase()
        : authorName.slice(0, 2).toUpperCase();
    setDoctorReviews((prev) => [
      {
        id: `rev-${Date.now()}`,
        doctorId: review.doctorId,
        initials,
        authorName,
        metaText: `Đã xác thực khám • ${formatRelativeDate(0)}`,
        comment: cleanComment,
        rating: review.rating,
        isHidden: false,
        adminNote: '',
      },
      ...prev,
    ]);
  };

  const moderateDoctorReview = async (
    reviewId: string,
    isHidden: boolean,
    adminNote = ''
  ): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      const updated = await moderateDoctorReviewCloud(reviewId, isHidden, adminNote);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
      setDoctorReviews((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      return;
    }
    setDoctorReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, isHidden, adminNote: adminNote.trim() } : r
      )
    );
  };

  const deleteDoctorReview = async (reviewId: string): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      await deleteDoctorReviewCloud(reviewId);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
    }
    setDoctorReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  const addDoctor = (input: NewDoctorInput): DoctorItem => {
    const name = input.name.trim();
    const newDoctor: DoctorItem = {
      id: `doc-new-${doctors.length + 1}`,
      name,
      degree: input.degree.trim() || `Bác sĩ chuyên khoa ${input.specialty}`,
      specialty: input.specialty,
      subSpecialty: `${input.specialty} • ${input.experienceYears} năm KN`,
      hospital: input.hospital,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      experienceYears: input.experienceYears,
      rating: 0,
      reviewCount: 0,
      patientCount: '0',
      responseTime: '—',
      fee: `${input.feeNumeric.toLocaleString('vi-VN')} đ`,
      feeNumeric: input.feeNumeric,
      bhytSupport: 'Hỗ trợ BHYT theo quy định',
      availableText: 'Chờ duyệt CCHN',
      avatar:
        input.avatar?.trim() ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name
        )}&background=E0EAFF&color=006194&size=200`,
      verified: false,
      bio: `Mã chứng chỉ hành nghề: ${input.licenseCode.trim()}. Hồ sơ đang chờ quản trị viên xác thực.`,
      strengths: [input.specialty],
    };
    setDoctors((prev) => [newDoctor, ...prev]);
    return newDoctor;
  };

  const approveDoctor = (doctorId: string) => {
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === doctorId
          ? { ...d, verified: true, availableText: 'Lịch trống: Ngày mai' }
          : d
      )
    );
  };

  const updateDoctorAvatar = async (doctorId: string, avatarUrl: string): Promise<void> => {
    const cleanUrl = avatarUrl.trim();
    if (!cleanUrl) {
      throw new Error('Vui lòng chọn ảnh hoặc nhập đường dẫn ảnh bác sĩ.');
    }
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      const savedUrl = await updateDoctorAvatarCloud(doctorId, cleanUrl);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctorId ? { ...d, avatar: savedUrl } : d))
      );
      return;
    }
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, avatar: cleanUrl } : d))
    );
  };

  const addHospital = async (input: NewHospitalInput): Promise<HospitalItem> => {
    const trimmedName = input.name.trim();
    const existing = hospitals.find(
      (h) => h.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) return existing;

    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại trước khi thêm cơ sở y tế.');
      if (input.latitude === undefined || input.longitude === undefined) {
        throw new Error('Vui lòng nhập tọa độ của cơ sở y tế.');
      }
      const saved = await addHospitalCloud({
        ...input,
        latitude: input.latitude,
        longitude: input.longitude,
      });
      if (cloudUserIdRef.current !== expectedUser) {
        throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng tải lại danh sách cơ sở y tế.');
      }
      setHospitals(prev => [saved, ...prev.filter(hospital => hospital.id !== saved.id)]);
      return saved;
    }

    const newHosp: HospitalItem = {
      id: `hosp-${hospitals.length}`,
      name: trimmedName,
      rating: 4.8,
      distance: '2.4 km',
      travelTime: '10 phút',
      tag: input.tag?.trim() || 'Bệnh viện liên kết • BHYT',
      image:
        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&auto=format&fit=crop&q=80',
      address: input.address.trim() || 'TP. Hồ Chí Minh',
      latitude: input.latitude ?? 10.768 + (hospitals.length % 4) * 0.006,
      longitude: input.longitude ?? 106.666 + (hospitals.length % 4) * 0.008,
      phone: input.phone?.trim() || '19001234',
      gateInfo:
        input.gateInfo?.trim() ||
        'Cổng chính — Khu tiếp đón Khám bệnh & BHYT',
      parkingInfo:
        input.parkingInfo?.trim() ||
        'Bãi gửi xe máy & ô tô nội viện có hướng dẫn viên',
      workingHours:
        input.workingHours?.trim() || '07:00 - 17:00 (T2 - T7) • Cấp cứu 24/7',
    };
    setHospitals((prev) => [newHosp, ...prev]);
    return newHosp;
  };

  const togglePiiMask = () => {
    setIsPiiMasked((prev) => !prev);
  };

  const selectBookingTicket = (appointment: ClinicAppointment) => {
    const item = clinicAppointmentToItem(appointment);
    selectedTicketCode.current = item.code;
    setLatestBooking({
      code: item.code, doctor: item.doctor, dayLabel: 'Ngày khám',
      fullDate: new Date(appointment.starts_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      timeRange: new Date(appointment.starts_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }),
      room: item.room || item.doctor.hospital, queueNumber: item.queueNumber || 'Đã xác nhận',
      consultMode: 'clinic', paymentMethod: appointment.payment_method,
      patientName: appointment.patient_name,
      patientPhone: appointment.patient_phone,
      patientEmail: appointment.patient_email,
      symptoms: appointment.symptoms,
    });
  };

  const selectAppointmentTicket = (appointment: AppointmentItem) => {
    setLatestBooking({
      code: appointment.code,
      doctor: appointment.doctor,
      dayLabel: 'Ngày khám',
      fullDate: appointment.dateLabel,
      timeRange: appointment.timeRange,
      room: appointment.room || appointment.doctor.hospital,
      queueNumber: appointment.queueNumber || 'Đã xác nhận',
      consultMode: appointment.mode === 'video' ? 'video' : 'clinic',
      paymentMethod:
        latestBooking.code === appointment.code
          ? latestBooking.paymentMethod
          : 'at_clinic_bhyt',
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientEmail: appointment.patientEmail,
      symptoms: appointment.symptoms,
    });
  };

  const updatePatientProfile = async (updates: UpdatePatientProfileInput) => {
    const cleanName = updates.name.trim();
    if (cleanName.length < 2) {
      throw new Error('Họ và tên cần tối thiểu 2 ký tự.');
    }
    const cleanPhone = updates.phone === undefined ? undefined : updates.phone.replace(/\s+/g, '');
    if (cleanPhone && !/^0[35789][0-9]{8}$/.test(cleanPhone)) {
      throw new Error('Số điện thoại Việt Nam phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09.');
    }

    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      const updated = await updateClinicProfile({
        full_name: cleanName,
        phone: cleanPhone,
        gender: updates.gender,
        dob: updates.dob,
        blood_type: updates.bloodType,
        emergency_contact: updates.emergencyContact,
        bhyt_code: updates.bhytCode,
        bhyt_hospital: updates.bhytHospital,
        bhyt_expiry: updates.bhytExpiry,
        avatar_url: updates.avatar,
      }, expectedUser);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
      setCloudProfile(updated);
      return;
    }

    setLocalPatientProfile((prev) => ({
      ...prev,
      name: cleanName,
      phone: cleanPhone ?? prev.phone,
      dob: updates.dob !== undefined ? updates.dob.trim() : prev.dob,
      age: updates.age !== undefined ? updates.age : prev.age,
      gender: updates.gender !== undefined ? updates.gender.trim() : prev.gender,
      bloodType: updates.bloodType !== undefined ? updates.bloodType.trim() : prev.bloodType,
      emergencyContact:
        updates.emergencyContact !== undefined
          ? updates.emergencyContact.trim()
          : prev.emergencyContact,
      bhytCode:
        updates.bhytCode !== undefined
          ? updates.bhytCode.trim().toUpperCase()
          : prev.bhytCode,
      bhytHospital:
        updates.bhytHospital !== undefined
          ? updates.bhytHospital.trim()
          : prev.bhytHospital,
      bhytExpiry:
        updates.bhytExpiry !== undefined
          ? updates.bhytExpiry.trim()
          : prev.bhytExpiry,
      avatar: updates.avatar !== undefined && updates.avatar.trim() ? updates.avatar.trim() : prev.avatar,
    }));
  };

  const saveDoctorSchedule = async (input: {
    id?: string;
    doctorId: string;
    workDate: string;
    shift: DoctorShiftType;
    room: string;
    active?: boolean;
  }): Promise<DoctorScheduleItem> => {
    if (!input.room.trim()) {
      throw new Error('Vui lòng nhập phòng khám trực.');
    }
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      const saved = await upsertDoctorScheduleCloud(input);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
      setDoctorSchedules((prev) => {
        const idx = prev.findIndex(
          (item) =>
            item.id === saved.id ||
            (item.doctorId === saved.doctorId &&
              item.workDate === saved.workDate &&
              item.shift === saved.shift)
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      return saved;
    }

    const item: DoctorScheduleItem = {
      id: input.id || `sch-${Date.now()}`,
      doctorId: input.doctorId,
      workDate: input.workDate,
      shift: input.shift,
      room: input.room.trim(),
      active: input.active ?? true,
    };
    setDoctorSchedules((prev) => {
      const idx = prev.findIndex(
        (s) =>
          s.id === item.id ||
          (s.doctorId === item.doctorId &&
            s.workDate === item.workDate &&
            s.shift === item.shift)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...item, id: prev[idx].id };
        return next;
      }
      return [item, ...prev];
    });
    return item;
  };

  const deleteDoctorSchedule = async (id: string) => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      await deleteDoctorScheduleCloud(id);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
    }
    setDoctorSchedules((prev) => prev.filter((item) => item.id !== id));
  };

  const saveBhytConfig = async (config: BhytConfigItem): Promise<BhytConfigItem> => {
    const cleanPrefix = config.prefixCode.trim().toUpperCase();
    const cleanGroup = config.groupName.trim();
    if (cleanPrefix.length < 2) {
      throw new Error('Mã đầu thẻ BHYT cần ít nhất 2 ký tự (VD: TE, HT, DN, GD).');
    }
    if (cleanGroup.length < 2) {
      throw new Error('Vui lòng nhập tên nhóm đối tượng BHYT.');
    }
    if (![config.inNetworkRate, config.outNetworkRate].every(value => Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= 100)) {
      throw new Error('Tỷ lệ BHYT cần là số nguyên từ 0 đến 100.');
    }
    const normalized: BhytConfigItem = {
      ...config,
      id: config.id || `bhyt-${cleanPrefix.toLowerCase()}-${Date.now()}`,
      prefixCode: cleanPrefix,
      groupName: cleanGroup,
      inNetworkRate: config.inNetworkRate,
      outNetworkRate: config.outNetworkRate,
    };
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      const saved = await upsertBhytConfigCloud(normalized);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
      setBhytConfigs((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id || c.prefixCode === saved.prefixCode);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      return saved;
    }
    setBhytConfigs((prev) => {
      const idx = prev.findIndex(
        (c) => c.id === normalized.id || c.prefixCode === normalized.prefixCode
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      return [...prev, normalized];
    });
    return normalized;
  };

  const toggleBhytConfig = async (id: string) => {
    const target = bhytConfigs.find((c) => c.id === id);
    if (!target) return;
    await saveBhytConfig({ ...target, active: !target.active });
  };

  const deleteBhytConfig = async (id: string) => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      await deleteBhytConfigCloud(id);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
    }
    setBhytConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  const uploadLabResult = async (input: UploadLabResultInput): Promise<LabResultItem> => {
    const expectedUser = CLOUD_MODE ? cloudUserIdRef.current : null;
    if (CLOUD_MODE && !expectedUser) {
      throw new Error('Vui lòng đăng nhập lại trước khi tải lên kết quả cận lâm sàng.');
    }
    const created = await uploadLabResultCloud(input);
    if (CLOUD_MODE && cloudUserIdRef.current !== expectedUser) {
      throw new Error('Phiên đăng nhập đã thay đổi.');
    }
    const matchedDoc = doctors.find((d) => d.id === created.doctorId);
    const enriched: LabResultItem = {
      ...created,
      doctorName: created.doctorName || matchedDoc?.name || cloudProfile?.full_name || 'Bác sĩ điều trị',
    };
    setLabResults((prev) => [enriched, ...prev]);
    return enriched;
  };

  const deleteLabResult = async (resultId: string): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      await deleteLabResultCloud(resultId);
      if (cloudUserIdRef.current !== expectedUser) {
        throw new Error('Phiên đăng nhập đã thay đổi.');
      }
    }
    setLabResults((prev) => prev.filter((item) => item.id !== resultId));
  };

  const resetAppData = async () => {
    if (CLOUD_MODE) { Alert.alert('Dữ liệu trực tuyến', 'Chức năng khôi phục dữ liệu mẫu chỉ áp dụng trong chế độ minh họa.'); return; }
    await storageService.resetAllData();
    setAppointments(INITIAL_APPOINTMENTS);
    setLatestBooking(DEFAULT_TICKET);
    setTakenMap({});
    setFamilyMembers(INITIAL_FAMILY_MEMBERS);
    setPrescriptions(PRESCRIPTION_DRUGS);
    setDiagnosisNote(
      CLOUD_MODE ? '' : 'Đau đầu căng thẳng (Tension headache) / Rối loạn vận mạch não nhẹ'
    );
    setCabinetMeds(INITIAL_CABINET_MEDS);
    setDoctorReviews(INITIAL_DOCTOR_REVIEWS);
    setDoctors(DOCTORS);
    setHospitals(HOSPITALS);
    setLabResults(INITIAL_LAB_RESULTS);
    setLocalPatientProfile(INITIAL_PATIENT_PROFILE);
    setDoctorSchedules(INITIAL_DOCTOR_SCHEDULES);
    setBhytConfigs(INITIAL_BHYT_CONFIGS);
    setIsPiiMasked(true);
  };

  const updateFamilyMember = async (
    id: string,
    member: FamilyMemberInput
  ): Promise<FamilyMemberItem> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      const updated = await updateFamilyMemberCloud(id, member);
      if (cloudUserIdRef.current !== expectedUser) {
        throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng tải lại hồ sơ.');
      }
      setFamilyMembers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      return updated;
    }
    const cleanNote =
      member.note?.trim() ||
      (member.bhyt
        ? `Đã liên kết BHYT (${member.bhyt})`
        : 'Hồ sơ sức khỏe gia đình');
    const updatedItem: FamilyMemberItem = {
      id,
      name: member.name.trim() || 'Thành viên',
      relation: member.dob
        ? `${member.relation} • Sinh: ${member.dob}`
        : member.relation,
      rawRelation: member.relation,
      code: `#BN-${id.slice(0, 6).toUpperCase()}`,
      blood: member.blood?.trim() || 'O+',
      note: cleanNote,
      badge: member.bhyt ? 'Có BHYT' : 'Thành viên',
      dob: member.dob,
      bhyt: member.bhyt,
      gender: member.gender?.trim() || 'Chưa cập nhật',
      phone: member.phone?.trim() || '',
      allergies: member.allergies?.trim() || '',
    };
    setFamilyMembers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedItem, code: item.code } : item))
    );
    return updatedItem;
  };

  const deleteFamilyMember = async (id: string): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      await deleteFamilyMemberCloud(id);
      if (cloudUserIdRef.current !== expectedUser) {
        throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng tải lại hồ sơ.');
      }
    }
    setFamilyMembers((prev) => prev.filter((item) => item.id !== id));
  };

  const resolvedPatientProfile: PatientProfileState = CLOUD_MODE
    ? {
        ...PATIENT_PROFILE,
        name: cloudProfile?.full_name || 'Bệnh nhân',
        phone: cloudProfile?.phone || '',
        dob: cloudProfile?.dob || '',
        patientCode: cloudProfile?.id || '',
        age: 0,
        gender: cloudProfile?.gender || 'Chưa cập nhật',
        bloodType: cloudProfile?.blood_type || 'Chưa cập nhật',
        tier: 'Hồ sơ trực tuyến',
        emergencyContact: cloudProfile?.emergency_contact || '',
        bhytCode: cloudProfile?.bhyt_code || '',
        bhytHospital: cloudProfile?.bhyt_hospital || '',
        bhytExpiry: cloudProfile?.bhyt_expiry || '',
        avatar: cloudProfile?.avatar_url || PATIENT_PROFILE.avatar,
        vitals: [],
        allergies: [],
      }
    : localPatientProfile;

  return (
    <AppContext.Provider
      value={{
        appointments,
        latestBooking,
        selectBookingTicket,
        selectAppointmentTicket,
        createBooking,
        cancelAppointment,
        completeAppointment,
        checkInAppointment,
        checkInByCode,
        takenMap,
        toggleMedicationTaken,
        familyMembers,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        prescriptions,
        addPrescriptionDrug,
        diagnosisNote,
        setDiagnosisNote,
        doctors,
        addDoctor,
        approveDoctor,
        updateDoctorAvatar,
        hospitals,
        addHospital,
        refreshHospitalCatalog,
        cabinetMeds,
        addCabinetMedicine,
        doctorReviews,
        addDoctorReview,
        moderateDoctorReview,
        deleteDoctorReview,
        isPiiMasked,
        togglePiiMask,
        cloudProfile,
        patientProfile: resolvedPatientProfile,
        updatePatientProfile,
        doctorSchedules,
        saveDoctorSchedule,
        deleteDoctorSchedule,
        bhytConfigs,
        saveBhytConfig,
        toggleBhytConfig,
        deleteBhytConfig,
        labResults,
        uploadLabResult,
        deleteLabResult,
        isHydrated,
        cloudSyncError,
        resetAppData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
};

