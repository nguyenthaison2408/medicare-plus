import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  BackHandler,
  useWindowDimensions,
  Text,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, LAYOUT } from './src/theme';
import { DOCTORS, DoctorItem } from './src/data/mockData';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { CLOUD_MODE } from './src/services/supabaseClient';
import { signOutClinic } from './src/services/clinicCloud';
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
  const { createBooking, cloudProfile, cloudSyncError } = useAppContext();
  const bookingInFlight = useRef(false);
  const [route, setRoute] = useState<string>('login');
  const [routeHistory, setRouteHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<MainTabKey>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem>(DOCTORS[0]);
  const [bookingInfo, setBookingInfo] = useState<{
    doctor?: DoctorItem;
    day?: any;
    slot?: any;
    consultMode?: string;
    paymentMethod?: PaymentMethodType;
    patient?: {
      name: string;
      meta: string;
    };
  }>({});
  const [actionMessage, setActionMessage] = useState('');
  const { width } = useWindowDimensions();
  const isTablet = width > 700;

  const navigateTo = (nextRoute: string) => {
    setActionMessage('');
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
    setBookingInfo((prev) => ({ ...prev, patient: undefined }));
    navigateTo('doctorDetail');
  };

  const handleOpenBooking = (doc: DoctorItem) => {
    setSelectedDoctor(doc);
    setBookingInfo((prev) => ({ ...prev, patient: undefined }));
    navigateTo('bookingSlot');
  };

  const handleRoleLoginSuccess = (role: UserRole) => {
    setRouteHistory([]);
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
      if (CLOUD_MODE) await signOutClinic();
      setRouteHistory([]);
      setRoute('login');
    } catch (error) { setActionMessage(error instanceof Error ? error.message : 'Chưa đăng xuất được. Vui lòng thử lại.'); }
  };

  const renderCurrentScreen = () => {
    switch (route) {
      case 'splash':
        return <SplashScreen onContinue={() => navigateTo('login')} />;
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={(role) => handleRoleLoginSuccess(role)}
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
        if (CLOUD_MODE && cloudProfile?.role === 'reception') return <ClinicStaffScreen onLogout={() => { void handleLogout(); }} />;
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
          />
        );
      case 'bookingSlot':
        return (
          <BookingSlotScreen
            doctor={selectedDoctor}
            onBack={() => goBack('doctorDetail')}
            onConfirmBooking={(details) => {
              if (details) {
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
        return (
          <BookingPaymentScreen
            doctor={bookingInfo.doctor || selectedDoctor}
            day={bookingInfo.day}
            slot={bookingInfo.slot}
            consultMode={bookingInfo.consultMode}
            patient={bookingInfo.patient}
            onBack={() => goBack('bookingSlot')}
            onPaymentSuccess={async (method, patientInfo: PatientBookingInfo) => {
              if (bookingInFlight.current) return;
              bookingInFlight.current = true;
              try {
                await createBooking({
                  doctor: bookingInfo.doctor || selectedDoctor,
                  day: bookingInfo.day, slot: bookingInfo.slot,
                  consultMode: bookingInfo.consultMode, paymentMethod: method,
                  patientInfo,
                });
                setBookingInfo((prev) => ({ ...prev, paymentMethod: method }));
                navigateTo('bookingSuccess');
              } catch (error) { setActionMessage(error instanceof Error ? error.message : 'Chưa đặt được lịch. Vui lòng thử lại.'); }
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
            onNavigate={navigateTo}
          />
        );
      case 'familyProfiles':
        return (
          <FamilyProfilesScreen
            onBack={() => goBack('main')}
            onSelectChild={() => navigateTo('childEHR')}
            onAddMember={() => navigateTo('addFamilyMember')}
            onNavigate={navigateTo}
            onBookForMember={(member) => {
              setBookingInfo((prev) => ({
                ...prev,
                patient: {
                  name: member.name,
                  meta: `${member.bhyt ? `BHYT: ${member.bhyt.split(' ')[0]} • ` : ''}${member.relation}`,
                },
              }));
              navigateTo('bookingSlot');
            }}
          />
        );
      case 'childEHR':
        return (
          <ChildEHRDetailScreen onBack={() => goBack('familyProfiles')} />
        );
      case 'addFamilyMember':
        return (
          <AddEditFamilyMemberScreen
            onBack={() => goBack('familyProfiles')}
          />
        );
      case 'teleconsult':
        return (
          <TeleconsultationScreen
            onBack={() => goBack('main')}
            onFinishChat={() => navigateTo('postConsultSummary')}
            onOpenLabResults={() => navigateTo('labImagingResults')}
          />
        );
      case 'postConsultSummary':
        return (
          <PostConsultSummaryScreen
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
                <AIAssistantScreen onBookDoctor={handleOpenBooking} />
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
