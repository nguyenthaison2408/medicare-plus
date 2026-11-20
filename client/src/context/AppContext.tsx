import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { CLOUD_MODE, getSupabase } from '../services/supabaseClient';
import {
  bookClinicAppointment, cancelClinicAppointment, checkInClinic, completeClinicAppointment, listClinicAppointments, listClinicDoctors,
  loadClinicProfile, subscribeClinicAppointments, type ClinicProfile, type ClinicAppointment, type ClinicMedication,
} from '../services/clinicCloud';
import { clinicAppointmentToItem, clinicPrescriptions, clinicRecord } from '../services/clinicAdapters';
import { fetchDoctorReviewsCloud, submitDoctorReviewCloud } from '../services/clinicReviews';
import { fetchFamilyMembersCloud, addFamilyMemberCloud } from '../services/clinicFamily';
import {
  addMedicineCabinetCloud,
  fetchMedicationLogCloud,
  fetchMedicineCabinetCloud,
  setMedicationTakenCloud,
} from '../services/clinicMedicine';
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
  code: string;
  blood: string;
  note: string;
  badge: string;
  dob?: string;
  bhyt?: string;
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
}

export interface NewHospitalInput {
  name: string;
  address: string;
  phone?: string;
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

export interface DoctorReviewItem {
  id: string;
  doctorId: string;
  initials: string;
  authorName: string;
  metaText: string;
  comment: string;
  rating: number;
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

  // 2. Medication Adherence Log
  takenMap: Record<string, boolean>;
  toggleMedicationTaken: (slotKey: string) => Promise<void>;

  // 3. Family Profiles
  familyMembers: FamilyMemberItem[];
  addFamilyMember: (member: {
    name: string;
    dob: string;
    relation: string;
    bhyt: string;
  }) => Promise<void>;

  // 4. Prescriptions & Doctors (Shared with Doctor/Admin Portals)
  prescriptions: PrescriptionDrug[];
  addPrescriptionDrug: (drug: Omit<PrescriptionDrug, 'id'>) => void;
  diagnosisNote: string;
  setDiagnosisNote: (note: string) => void;
  doctors: DoctorItem[];
  addDoctor: (input: NewDoctorInput) => DoctorItem;
  approveDoctor: (doctorId: string) => void;
  hospitals: HospitalItem[];
  addHospital: (input: NewHospitalInput) => HospitalItem;

  // 5. Medicine Cabinet & Doctor Reviews
  cabinetMeds: MedicineCabinetItem[];
  addCabinetMedicine: (med: Omit<MedicineCabinetItem, 'id'>) => Promise<void>;
  doctorReviews: DoctorReviewItem[];
  addDoctorReview: (review: {
    doctorId: string;
    rating: number;
    comment: string;
  }) => Promise<void>;

  // 6. Security & Privacy (PII Masking state) + Storage Persistence
  isPiiMasked: boolean;
  togglePiiMask: () => void;
  patientProfile: typeof PATIENT_PROFILE;
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
    CLOUD_MODE
      ? { morning: false, afternoon: false, evening: false }
      : { morning: true, afternoon: true, evening: false }
  );
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>(
    CLOUD_MODE ? [] : INITIAL_FAMILY_MEMBERS
  );
  const [prescriptions, setPrescriptions] =
    useState<PrescriptionDrug[]>(CLOUD_MODE ? [] : PRESCRIPTION_DRUGS);
  const [diagnosisNote, setDiagnosisNote] = useState<string>(
    CLOUD_MODE ? '' : 'Đau đầu căng thẳng (Tension headache) / Rối loạn vận mạch não nhẹ'
  );
  const [doctors, setDoctors] = useState<DoctorItem[]>(DOCTORS);
  const [hospitals, setHospitals] = useState<HospitalItem[]>(HOSPITALS);
  const [cabinetMeds, setCabinetMeds] =
    useState<MedicineCabinetItem[]>(CLOUD_MODE ? [] : INITIAL_CABINET_MEDS);
  const [doctorReviews, setDoctorReviews] = useState<DoctorReviewItem[]>(
    CLOUD_MODE ? [] : INITIAL_DOCTOR_REVIEWS
  );
  const [isPiiMasked, setIsPiiMasked] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(CLOUD_MODE);
  const hydratedRef = useRef<boolean>(CLOUD_MODE);
  const cloudUserIdRef = useRef<string | null>(null);
  const [cloudProfile, setCloudProfile] = useState<ClinicProfile | null>(null);
  const [cloudSyncError, setCloudSyncError] = useState('');

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
        cloudUserIdRef.current = session?.user.id ?? null;
        if (!session) {
          setAppointments([]);
          setPrescriptions([]);
          setFamilyMembers([]);
          setDoctorReviews([]);
          setCabinetMeds([]);
          setTakenMap({ morning: false, afternoon: false, evening: false });
          setCloudProfile(null);
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
                    fee: '300.000 đ',
                    feeNumeric: 300000,
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
          return;
        }
        const [
          profile,
          cloudAppointments,
          cloudDoctors,
          families,
          reviews,
          medicines,
          medicationLog,
        ] = await Promise.all([
          loadClinicProfile(),
          listClinicAppointments(),
          listClinicDoctors().catch(() => []),
          fetchFamilyMembersCloud(),
          fetchDoctorReviewsCloud(),
          fetchMedicineCabinetCloud(),
          fetchMedicationLogCloud(),
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
                fee: '300.000 đ',
                feeNumeric: 300000,
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
        setAppointments(cloudAppointments.map(clinicAppointmentToItem));
        const activeAppointments = cloudAppointments.filter(appointment => appointment.status === 'CONFIRMED' || appointment.status === 'CHECKED_IN');
        const activeAppointment = activeAppointments.find(appointment => appointment.booking_code === selectedTicketCode.current) || activeAppointments[0];
        if (activeAppointment) {
          const item = clinicAppointmentToItem(activeAppointment);
          const date = new Date(activeAppointment.starts_at);
          setLatestBooking({
            code: item.code, doctor: item.doctor,
            dayLabel: date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long' }),
            fullDate: date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
            timeRange: date.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }), room: item.room || item.doctor.hospital,
            queueNumber: item.queueNumber || 'Đã xác nhận', consultMode: 'clinic', paymentMethod: activeAppointment.payment_method,
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
        setCabinetMeds(medicines);
        setTakenMap(medicationLog);
        setCloudSyncError('');
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
          setTakenMap({ morning: false, afternoon: false, evening: false });
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
  ]);

  const createBooking = async ({
    doctor,
    day,
    slot,
    consultMode = 'clinic',
    paymentMethod,
    patientInfo,
  }: {
    doctor: DoctorItem;
    day?: DaySlotItem;
    slot?: TimeSlotItem;
    consultMode?: string;
    paymentMethod: string;
    patientInfo: PatientBookingInfo;
  }): Promise<LatestBookingTicket> => {
    const chosenDay = day || BOOKING_DAYS[1];
    const chosenSlot = slot || TIME_SLOTS[3];
    if (CLOUD_MODE) {
      if (consultMode !== 'clinic') throw new Error('Tư vấn từ xa chưa được hỗ trợ trong phiên bản trực tuyến.');
      if (paymentMethod !== 'at_clinic' && paymentMethod !== 'at_clinic_bhyt') throw new Error('Vui lòng chọn thanh toán tại cơ sở y tế.');
      const appointment = await bookClinicAppointment(
        doctor,
        chosenDay,
        chosenSlot,
        patientInfo
      );
      const ticket: LatestBookingTicket = {
        code: appointment.booking_code, doctor, dayLabel: chosenDay.dayLabel, fullDate: chosenDay.fullDate,
        timeRange: chosenSlot.time, room: doctor.hospital,
        queueNumber: 'Đã xác nhận', consultMode: 'clinic', paymentMethod: appointment.payment_method,
        patientName: appointment.patient_name,
        patientPhone: appointment.patient_phone,
        patientEmail: appointment.patient_email,
        symptoms: appointment.symptoms,
      };
      selectedTicketCode.current = ticket.code;
      setLatestBooking(ticket);
      setAppointments(prev => [clinicAppointmentToItem(appointment), ...prev.filter(item => item.id !== appointment.id)]);
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
          ? { ...a, status: 'completed', statusBadge: 'Đã hoàn tất khám' } : a));
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

  const toggleMedicationTaken = async (slotKey: string): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) {
        Alert.alert('Nhật ký uống thuốc', 'Vui lòng đăng nhập lại.');
        return;
      }
      const nextTaken = !takenMap[slotKey];
      try {
        const saved = await setMedicationTakenCloud(slotKey, nextTaken);
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
    setTakenMap(prev => ({ ...prev, [slotKey]: !prev[slotKey] }));
  };

  const addFamilyMember = async (member: {
    name: string;
    dob: string;
    relation: string;
    bhyt: string;
  }): Promise<void> => {
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập lại.');
      const saved = await addFamilyMemberCloud(member);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng tải lại hồ sơ.');
      setFamilyMembers(prev => [saved, ...prev]);
      return;
    }
    const randCode = Math.floor(100000 + Math.random() * 899999);
    const newMember: FamilyMemberItem = {
      id: `fam-${Date.now()}`,
      name: member.name.trim() || 'Thành viên mới',
      relation: `${member.relation} • Sinh: ${member.dob || '1995'}`,
      code: `#BN-${randCode}`,
      blood: 'O+',
      note: member.bhyt
        ? `Đã liên kết BHYT (${member.bhyt})`
        : 'Hồ sơ người thân vừa tạo mới',
      badge: 'BHYT 80%',
      dob: member.dob,
      bhyt: member.bhyt,
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
    med: Omit<MedicineCabinetItem, 'id'>
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
    if (CLOUD_MODE) {
      const expectedUser = cloudUserIdRef.current;
      if (!expectedUser) throw new Error('Vui lòng đăng nhập để đánh giá.');
      const saved = await submitDoctorReviewCloud(review);
      if (cloudUserIdRef.current !== expectedUser) throw new Error('Phiên đăng nhập đã thay đổi.');
      setDoctorReviews(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
      return;
    }
    const words = PATIENT_PROFILE.name.trim().split(' ');
    const initials =
      words.length >= 2
        ? `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase()
        : 'NV';
    setDoctorReviews((prev) => [
      {
        id: `rev-${prev.length + 1}`,
        doctorId: review.doctorId,
        initials,
        authorName: PATIENT_PROFILE.name,
        metaText: `Vừa xong (${formatRelativeDate(0)}) • Đã xác thực khám`,
        comment: review.comment.trim(),
        rating: review.rating,
      },
      ...prev,
    ]);
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
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
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

  const addHospital = (input: NewHospitalInput): HospitalItem => {
    const trimmedName = input.name.trim();
    const existing = hospitals.find(
      (h) => h.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) return existing;

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
      latitude: 10.768 + (hospitals.length % 4) * 0.006,
      longitude: 106.666 + (hospitals.length % 4) * 0.008,
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

  const resetAppData = async () => {
    if (CLOUD_MODE) { Alert.alert('Dữ liệu trực tuyến', 'Chức năng khôi phục dữ liệu mẫu chỉ áp dụng trong chế độ minh họa.'); return; }
    await storageService.resetAllData();
    setAppointments(INITIAL_APPOINTMENTS);
    setLatestBooking(DEFAULT_TICKET);
    setTakenMap({ morning: true, afternoon: true, evening: false });
    setFamilyMembers(INITIAL_FAMILY_MEMBERS);
    setPrescriptions(PRESCRIPTION_DRUGS);
    setDiagnosisNote(
      CLOUD_MODE ? '' : 'Đau đầu căng thẳng (Tension headache) / Rối loạn vận mạch não nhẹ'
    );
    setCabinetMeds(INITIAL_CABINET_MEDS);
    setDoctorReviews(INITIAL_DOCTOR_REVIEWS);
    setDoctors(DOCTORS);
    setHospitals(HOSPITALS);
    setIsPiiMasked(true);
  };

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
        takenMap,
        toggleMedicationTaken,
        familyMembers,
        addFamilyMember,
        prescriptions,
        addPrescriptionDrug,
        diagnosisNote,
        setDiagnosisNote,
        doctors,
        addDoctor,
        approveDoctor,
        hospitals,
        addHospital,
        cabinetMeds,
        addCabinetMedicine,
        doctorReviews,
        addDoctorReview,
        isPiiMasked,
        togglePiiMask,
        cloudProfile,
        patientProfile: CLOUD_MODE ? {
          ...PATIENT_PROFILE, name: cloudProfile?.full_name || 'Bệnh nhân',
          patientCode: cloudProfile?.id || '', age: 0, gender: 'Chưa cập nhật', bloodType: 'Chưa cập nhật',
          tier: 'Hồ sơ trực tuyến', emergencyContact: '', bhytCode: '', bhytHospital: '', bhytExpiry: '', vitals: [],
        } : PATIENT_PROFILE,
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

