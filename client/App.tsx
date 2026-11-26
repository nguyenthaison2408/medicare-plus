import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  BackHandler,
  Linking,
  Platform,
  useWindowDimensions,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, LAYOUT } from './src/theme';
import { DOCTORS, DoctorItem } from './src/data/mockData';
import { AppProvider, useAppContext, type FamilyMemberItem } from './src/context/AppContext';
import { CLOUD_MODE, SUPABASE_CONFIGURED, getSupabase } from './src/services/supabaseClient';
import { parseClinicAuthCallback, routeForClinicRole } from './src/utils/clinicAuthRouting';
import { loadClinicProfile, signOutClinic } from './src/services/clinicCloud';
import { ClinicStaffScreen } from './src/screens/ClinicStaffScreen';
import type { PatientBookingInfo } from './src/utils/bookingValidation';
import { BottomTabBar, MainTabKey } from './src/components';
import {
  SplashScreen,
  LoginScreen,
  RegisterScreen,
  UserRole,
} from './src/screens/AuthScreens';
import {
  HomeScreen,
  EHRScreen,
  AppointmentsScreen,
  AIAssistantScreen,
  ProfileSettingsScreen,
} from './src/screens/MainTabScreens';
import {
  DoctorDetailScreen,
  BookingSlotScreen,
  BookingPaymentScreen,
  PaymentMethodType,
} from './src/screens/BookingFlowScreens';
import {
  AdminDashboardScreen,
  DoctorDashboardScreen,
} from './src/screens/RoleDashboards';
import {
  BookingSuccessScreen,
  FamilyProfilesScreen,
  ChildEHRDetailScreen,
  AddEditFamilyMemberScreen,
  TeleconsultationScreen,
  PostConsultSummaryScreen,
  LabAndImagingResultsScreen,
} from './src/screens/TelehealthAndFamilyScreens';
import {
  MedicationLogScreen,
  PrescriptionDetailScreen,
  FamilyMedicineCabinetScreen,
} from './src/screens/PharmacyAndMedicationScreens';

function AppContent() {
  const { createBooking, cloudProfile, cloudSyncError, latestBooking } = useAppContext();
  const bookingInFlight = useRef(false);
  const [route, setRoute] = useState<string>('login');
  const [actionMessage, setActionMessage] = useState('');
  const [summaryAppointmentId, setSummaryAppointmentId] = useState<string>();

  const [routeHistory, setRouteHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<MainTabKey>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem>(DOCTORS[0]);
  const [selectedFamilyMember, setSelectedFamilyMember] =
    useState<FamilyMemberItem | null>(null);
  const [editingFamilyMember, setEditingFamilyMember] =
    useState<FamilyMemberItem | null>(null);
  const [bookingInfo, setBookingInfo] = useState<{
    doctor?: DoctorItem;
    day?: any;
    slot?: any;
    consultMode?: string;
    paymentMethod?: PaymentMethodType;
    patient?: {
      name: string;
      meta: string;
      bhytCode?: string;
      phone?: string;
    };
  }>({});
  const [mockReceptionMode, setMockReceptionMode] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width > 700;

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    let active = true;
    let generation = 0;
    let routedUser: string | null = null;
    const supabase = getSupabase();
    const clearWebHash = () => {
      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        window.location?.hash &&
        (window.location.hash.includes('access_token=') ||
          window.location.hash.includes('error='))
      ) {
        window.history?.replaceState?.(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }
    };
    const applySession = async (userId: string | null) => {
      const request = ++generation;
      if (!userId) {
        if (active && CLOUD_MODE && routedUser !== null) {
          routedUser = null;
          setRoute('login');
          setRouteHistory([]);
          setActiveTab('home');
          setBookingInfo({});
        }
        return;
      }
      clearWebHash();
      if (!CLOUD_MODE) {
        if (active) {
          routedUser = userId;
          setRoute(previous => ['login', 'splash', 'register'].includes(previous) ? 'main' : previous);
        }
        return;
      }
      try {
        const profile = await loadClinicProfile();
        const current = await supabase.auth.getSession();
        if (!active || request !== generation || current.data.session?.user.id !== userId || profile.id !== userId) return;
        const destination = routeForClinicRole(profile.role);
        const changed = routedUser !== userId;
        routedUser = userId;
        if (changed) { setRouteHistory([]); setActiveTab('home'); setBookingInfo({}); }
        setRoute(previous => changed || ['login','splash','register'].includes(previous) ? destination : previous);
      } catch {
        if (active && request === generation) {
          setRoute(previous => ['login', 'splash', 'register'].includes(previous) ? 'login' : previous);
        }
      }
    };
    const handleDeepLinkUrl = async (incoming: string | null | undefined) => {
      if (!incoming) return;
      try {
        const callback = parseClinicAuthCallback(incoming);
        if (!callback) return;
        const response = callback.code
          ? await supabase.auth.exchangeCodeForSession(callback.code)
          : await supabase.auth.setSession({access_token: callback.accessToken!, refresh_token: callback.refreshToken!});
        if (response.error) throw response.error;
      } catch {
        if (active) setActionMessage('Đăng nhập Google chưa hoàn tất. Vui lòng thử lại.');
      }
    };
    let linkingSub: {remove: () => void} | undefined;
    if (Platform.OS !== 'web') {
      void Linking.getInitialURL().then(handleDeepLinkUrl).catch(() => {});
      linkingSub = Linking.addEventListener('url', ({url}) => { void handleDeepLinkUrl(url); });
    }
    void supabase.auth.getSession().then(({data}) => applySession(data.session?.user.id || null)).catch(() => {});
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      // Leave the auth callback before calling SDK methods that acquire its lock.
      generation += 1;
      setTimeout(() => { if (active) void applySession(session?.user.id || null); }, 0);
    });
    return () => { active = false; generation += 1; subscription.unsubscribe(); linkingSub?.remove(); };
  }, []);

  const navigateTo = (nextRoute: string, appointmentId?: string) => {
    setActionMessage('');
    if (nextRoute === 'postConsultSummary') setSummaryAppointmentId(appointmentId);
    if (['home', 'records', 'appointments', 'ai', 'profile'].includes(nextRoute)) {
      setRoute('main');
      setActiveTab(nextRoute as MainTabKey);
      return;
    }
    if (nextRoute === route) return;
    setRouteHistory((prev) => [...prev, route]);
    setRoute(nextRoute);
  };

  const goBack = (fallback = 'main') => {
    setRouteHistory((prev) => {
      if (prev.length === 0) {
        setRoute(fallback);
        return prev;
      }
      const next = [...prev];
      const last = next.pop()!;
      setRoute(last);
      return next;
    });
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routeHistory.length > 0) {
        goBack();
        return true;
      }
      if (route === 'main' && activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [route, routeHistory.length, activeTab]);

  const handleOpenDoctor = (doc: DoctorItem) => {
    setSelectedDoctor(doc);
    setBookingInfo((prev) => ({ ...prev, doctor: doc, patient: undefined }));
    navigateTo('doctorDetail');
  };

  const handleOpenBooking = (doc: DoctorItem) => {
    setSelectedDoctor(doc);
    setBookingInfo((prev) => ({ ...prev, doctor: doc, patient: undefined }));
    navigateTo('bookingSlot');
  };

  const handleRoleLoginSuccess = (role: UserRole, email?: string) => {
    setRouteHistory([]);
    const lower = (email || '').trim().toLowerCase();
    const isMockReception = !CLOUD_MODE && (lower.includes('reception') || lower.includes('tiepdon'));
    setMockReceptionMode(isMockReception);
    if (role === 'admin') {
      setRoute('adminPortal');
    } else if (role === 'doctor') {
      setRoute('doctorPortal');
    } else {
      setRoute('main');
      setActiveTab('home');
    }
  };

  const handleLogout = async () => {
    try {
      if (SUPABASE_CONFIGURED) await signOutClinic();
      setMockReceptionMode(false);
      setRouteHistory([]);
      setRoute('login');
    } catch (error) { setActionMessage(error instanceof Error ? error.message : 'Chưa đăng xuất được. Vui lòng thử lại.'); }
  };

  const renderCurrentScreen = () => {
    if (CLOUD_MODE && !cloudProfile && !['login', 'register', 'splash'].includes(route)) {
      return <Text>Đang tải tài khoản...</Text>;
    }
    switch (route) {
      case 'splash':
        return <SplashScreen onContinue={() => navigateTo('login')} />;
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={(role, email) => handleRoleLoginSuccess(role, email)}
            onGoRegister={() => navigateTo('register')}
            onBack={() => navigateTo('splash')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onRegisterSuccess={() => {
              setRouteHistory([]);
              setRoute('main');
              setActiveTab('home');
            }}
            onGoLogin={() => navigateTo('login')}
          />
        );
      case 'adminPortal':
        if (CLOUD_MODE && !cloudProfile) return <Text>Đang tải tài khoản...</Text>;
        if ((CLOUD_MODE && cloudProfile?.role === 'reception') || (!CLOUD_MODE && mockReceptionMode)) {
          return <ClinicStaffScreen onLogout={() => { void handleLogout(); }} />;
        }
        return (
          <AdminDashboardScreen
            onLogout={() => { void handleLogout(); }}
            onNavigate={navigateTo}
          />
        );
      case 'doctorPortal':
        return (
          <DoctorDashboardScreen
            onLogout={() => { void handleLogout(); }}
            onNavigate={navigateTo}
          />
        );
      case 'doctorDetail':
        return (
          <DoctorDetailScreen
            doctor={selectedDoctor}
            onBack={() => goBack('main')}
            onBookSlot={handleOpenBooking}
            onOpenChat={(doc) => {
              setSelectedDoctor(doc);
              setBookingInfo((prev) => ({ ...prev, doctor: doc }));
              navigateTo('teleconsult');
            }}
          />
        );
      case 'bookingSlot':
        return (
          <BookingSlotScreen
            doctor={selectedDoctor}
            onBack={() => goBack('doctorDetail')}
            onConfirmBooking={(details) => {
              if (details) {
                setSelectedDoctor(details.doctor);
                setBookingInfo((prev) => ({
                  ...prev,
                  doctor: details.doctor,
                  day: details.day,
                  slot: details.slot,
                  consultMode: details.consultMode,
                }));
              }
              navigateTo('bookingPayment');
            }}
          />
        );
      case 'bookingPayment':
        if (!bookingInfo.day || !bookingInfo.slot) {
          return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>
                Lịch hẹn đã được xác nhận
              </Text>
              <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center', marginBottom: 16 }}>
                Phiếu khám đã hoàn tất không thể thanh toán lại hoặc thay đổi khung giờ.
              </Text>
              <Text
                onPress={() => {
                  setRouteHistory([]);
                  setRoute('main');
                  setActiveTab('appointments');
                }}
                style={{ color: '#0284C7', fontWeight: '700', fontSize: 14, padding: 10 }}
              >
                Xem lịch hẹn của tôi →
              </Text>
            </View>
          );
        }
        return (
          <BookingPaymentScreen
            doctor={selectedDoctor || bookingInfo.doctor}
            day={bookingInfo.day}
            slot={bookingInfo.slot}
            consultMode={bookingInfo.consultMode}
            patient={bookingInfo.patient}
            onBack={() => goBack('bookingSlot')}
            onPaymentSuccess={async (method, patientInfo: PatientBookingInfo, payOsOrderCode) => {
              if (bookingInFlight.current) return false;
              bookingInFlight.current = true;
              try {
                const targetDoctor = selectedDoctor || bookingInfo.doctor;
                await createBooking({
                  doctor: targetDoctor,
                  day: bookingInfo.day, slot: bookingInfo.slot,
                  consultMode: bookingInfo.consultMode, paymentMethod: method,
                  patientInfo,
                  payOsOrderCode,
                });
                setSelectedDoctor(targetDoctor);
                setRouteHistory([]);
                setBookingInfo({ doctor: targetDoctor, paymentMethod: method });
                setRoute('bookingSuccess');
                return true;
              } catch (error) {
                const msg = error instanceof Error ? error.message : 'Chưa đặt được lịch. Vui lòng thử lại.';
                setActionMessage(msg);
                Alert.alert('Không thể đặt lịch', msg);
                return false;
              }
              finally { bookingInFlight.current = false; }
            }}
          />
        );

      // Booking Success, Real-time Chat, Clinical Results & Family Profiles
      case 'bookingSuccess':
        return (
          <BookingSuccessScreen
            paymentMethod={bookingInfo.paymentMethod || 'at_clinic_bhyt'}
            onViewAppointments={() => {
              setRouteHistory([]);
              setRoute('main');
              setActiveTab('appointments');
            }}
            onGoHome={() => {
              setRouteHistory([]);
              setRoute('main');
              setActiveTab('home');
            }}
            onNavigate={(targetRoute) => {
              if (targetRoute === 'teleconsult' && latestBooking.doctor) {
                setSelectedDoctor(latestBooking.doctor);
                setBookingInfo((prev) => ({ ...prev, doctor: latestBooking.doctor }));
              }
              navigateTo(targetRoute);
            }}
          />
        );
      case 'familyProfiles':
        return (
          <FamilyProfilesScreen
            onBack={() => goBack('main')}
            onSelectChild={() => navigateTo('childEHR')}
            onSelectMember={(member) => {
              setSelectedFamilyMember(member);
              navigateTo('childEHR');
            }}
            onAddMember={() => {
              setEditingFamilyMember(null);
              navigateTo('addFamilyMember');
            }}
            onEditMember={(member) => {
              setEditingFamilyMember(member);
              navigateTo('addFamilyMember');
            }}
            onNavigate={navigateTo}
            onBookForMember={(member) => {
              setBookingInfo((prev) => ({
                ...prev,
                patient: {
                  name: member.name,
                  meta: `${member.bhyt ? `BHYT: ${member.bhyt.split(' ')[0]} • ` : ''}${member.relation}`,
                  bhytCode: member.bhyt,
                  phone: member.phone,
                },
              }));
              navigateTo('bookingSlot');
            }}
          />
        );
      case 'childEHR':
        return (
          <ChildEHRDetailScreen
            member={selectedFamilyMember}
            onBack={() => goBack('familyProfiles')}
            onEditMember={(member) => {
              setEditingFamilyMember(member);
              navigateTo('addFamilyMember');
            }}
            onBookForMember={(member) => {
              setBookingInfo((prev) => ({
                ...prev,
                patient: {
                  name: member.name,
                  meta: `${member.bhyt ? `BHYT: ${member.bhyt.split(' ')[0]} • ` : ''}${member.relation}`,
                  bhytCode: member.bhyt,
                  phone: member.phone,
                },
              }));
              navigateTo('bookingSlot');
            }}
          />
        );
      case 'addFamilyMember':
        return (
          <AddEditFamilyMemberScreen
            editingMember={editingFamilyMember}
            onBack={() => goBack('familyProfiles')}
          />
        );
      case 'teleconsult':
        return (
          <TeleconsultationScreen
            doctor={selectedDoctor || bookingInfo.doctor}
            onBack={() => goBack('main')}
            onFinishChat={() => navigateTo('postConsultSummary')}
            onOpenLabResults={() => navigateTo('labImagingResults')}
          />
        );
      case 'postConsultSummary':
        return (
          <PostConsultSummaryScreen
            appointmentId={summaryAppointmentId}
            onBack={() => goBack('main')}
            onNavigate={navigateTo}
            onRebookDoctor={handleOpenBooking}
          />
        );
      case 'labImagingResults':
        return (
          <LabAndImagingResultsScreen
            onBack={() => goBack('main')}
            onOpenTeleconsult={() => navigateTo('teleconsult')}
          />
        );

      // Medication & Adherence
      case 'medLog':
        return (
          <MedicationLogScreen
            onBack={() => goBack('main')}
            onOpenPrescription={() => navigateTo('rxDetail')}
            onOpenCabinet={() => navigateTo('medicineCabinet')}
          />
        );
      case 'rxDetail':
        return (
          <PrescriptionDetailScreen
            onBack={() => goBack('medLog')}
            onOpenMedLog={() => navigateTo('medLog')}
          />
        );
      case 'medicineCabinet':
        return (
          <FamilyMedicineCabinetScreen
            onBack={() => goBack('main')}
            onRefillNow={() => navigateTo('teleconsult')}
          />
        );

      // Main 5-tab Patient Portal
      case 'main':
      default:
        return (
          <View style={styles.mainWrapper}>
            <View style={{ flex: 1 }}>
              <View
                style={[
                  styles.tabPane,
                  activeTab !== 'home' && styles.tabPaneHidden,
                ]}
              >
                <HomeScreen
                  onSelectDoctor={handleOpenDoctor}
                  onBookDoctor={handleOpenBooking}
                  onAskAI={() => navigateTo('ai')}
                  onOpenProfile={() => setActiveTab('profile')}
                  onNavigate={navigateTo}
                />
              </View>
              <View
                style={[
                  styles.tabPane,
                  activeTab !== 'records' && styles.tabPaneHidden,
                ]}
              >
                <EHRScreen
                  onAskAI={() => navigateTo('ai')}
                  onNavigate={navigateTo}
                />
              </View>
              <View
                style={[
                  styles.tabPane,
                  activeTab !== 'appointments' && styles.tabPaneHidden,
                ]}
              >
                <AppointmentsScreen
                  onSelectDoctor={handleOpenDoctor}
                  onFocusDoctor={(doc) => {
                    setSelectedDoctor(doc);
                    setBookingInfo((prev) => ({ ...prev, doctor: doc }));
                  }}
                  onBookNew={() => handleOpenBooking(DOCTORS[0])}
                  onNavigate={navigateTo}
                />
              </View>
              <View
                style={[
                  styles.tabPane,
                  activeTab !== 'ai' && styles.tabPaneHidden,
                ]}
              >
                <AIAssistantScreen key={cloudProfile?.id || 'guest'} onBookDoctor={handleOpenBooking} />
              </View>
              <View
                style={[
                  styles.tabPane,
                  activeTab !== 'profile' && styles.tabPaneHidden,
                ]}
              >
                <ProfileSettingsScreen
                  onLogout={() => { void handleLogout(); }}
                  onNavigate={navigateTo}
                  onSwitchTab={(tab) => navigateTo(tab)}
                />
              </View>
            </View>
            <BottomTabBar
              activeTab={activeTab}
              onSelectTab={(tab) => navigateTo(tab)}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeRoot}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.appViewport, isTablet && styles.tabletViewport]}>
        {actionMessage ? <View style={{ padding: 12 }}><Text accessibilityRole="alert" style={{ color: COLORS.error }}>{actionMessage}</Text><Text accessibilityRole="button" onPress={() => setActionMessage('')} style={{ color: COLORS.primary, paddingTop: 8 }}>Đóng thông báo</Text></View> : null}
        {CLOUD_MODE && cloudSyncError ? <Text accessibilityRole="alert" style={{ padding: 12, color: COLORS.error }}>{cloudSyncError}</Text> : null}
        {renderCurrentScreen()}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appViewport: {
    flex: 1,
    width: '100%',
  },
  tabletViewport: {
    maxWidth: LAYOUT.maxWidth,
    alignSelf: 'center',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabPane: {
    flex: 1,
  },
  tabPaneHidden: {
    display: 'none',
  },
});
