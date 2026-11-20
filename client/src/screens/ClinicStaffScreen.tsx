import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppHeader, AppInput, Badge } from '../components';
import { COLORS, RADIUS, SPACING } from '../theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  checkInClinic, completeClinicAppointment, listClinicAppointments,
  loadClinicProfile, subscribeClinicAppointments,
  type ClinicAppointment, type ClinicProfile,
} from '../services/clinicCloud';

export function ClinicStaffScreen({ onLogout, embedded = false, initialAppointmentId }: { onLogout: () => void; embedded?: boolean; initialAppointmentId?: string }) {
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [bookingCode, setBookingCode] = useState('');
  const [selected, setSelected] = useState<ClinicAppointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanHandled = useRef(false);

  const refresh = useCallback(async () => {
    try { setAppointments(await listClinicAppointments()); setError(''); }
    catch (error) { setError(error instanceof Error ? error.message : 'Không tải được lịch khám.'); }
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadClinicProfile().then(data => { if (mounted) setProfile(data); }).catch(error => {
      if (mounted) setError(error instanceof Error ? error.message : 'Không tải được tài khoản.');
    });
    void listClinicAppointments().then(data => { if (mounted) {
        setAppointments(data);
        const initial = data.find(a => a.id === initialAppointmentId && a.status === 'CHECKED_IN');
        if (initial) setSelected(initial);
      } }).catch(error => {
      if (mounted) setError(error instanceof Error ? error.message : 'Không tải được lịch khám.');
    });
    const unsubscribe = subscribeClinicAppointments(() => { void refresh(); });
    return () => { mounted = false; unsubscribe(); };
  }, [refresh, initialAppointmentId]);

  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); await refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Không hoàn tất được thao tác.'); }
    finally { setBusy(false); }
  };
  const canPrescribe = profile?.role === 'doctor' || profile?.role === 'admin';
  const pending = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'CHECKED_IN');
  const completed = appointments.filter(a => a.status === 'COMPLETED');

  return <View style={styles.screen}>
    {!embedded && <AppHeader title={profile?.role === 'doctor' ? 'Bàn khám bác sĩ' : 'Tiếp đón và quản lý lịch khám'} />}
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{profile?.full_name || 'Đang tải tài khoản...'}</Text>
      <Text style={styles.body}>Chờ khám: {pending.length} · Hoàn thành: {completed.length}</Text>
      <AppButton title="Làm mới lịch khám" variant="outline" onPress={() => { void refresh(); }} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.title}>Tiếp đón bệnh nhân</Text>
        <AppInput label="Mã phiếu hẹn" value={bookingCode} onChangeText={setBookingCode} placeholder="MC-..." autoCapitalize="characters" />
        <AppButton title={cameraVisible ? 'Đóng camera' : 'Quét mã QR phiếu hẹn'} variant="outline" onPress={async () => {
          if (cameraVisible) { setCameraVisible(false); return; }
          try {
            const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
            if (!permission.granted) { setError('Chưa được cấp quyền camera. Bạn có thể nhập hoặc dán mã phiếu hẹn.'); return; }
            scanHandled.current = false;
            setCameraVisible(true);
          } catch { setError('Không mở được camera. Bạn có thể nhập hoặc dán mã phiếu hẹn.'); }
        }} />
        {cameraVisible ? <CameraView style={{ height: 240, borderRadius: RADIUS.md }} facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onMountError={() => { setCameraVisible(false); setError('Không mở được camera. Vui lòng nhập mã phiếu hẹn.'); }}
          onBarcodeScanned={({ data }) => {
            if (scanHandled.current) return;
            scanHandled.current = true;
            setCameraVisible(false);
            if (!/^MC-[A-F0-9]{32}$/.test(data.trim())) { setError('Mã QR không phải phiếu hẹn của hệ thống.'); return; }
            setBookingCode(data.trim()); setError('');
          }} /> : null}
        <AppButton title="Xác nhận đã có mặt" loading={busy} disabled={!bookingCode.trim() || busy}
          onPress={() => { void perform(async () => { await checkInClinic(bookingCode); setBookingCode(''); }); }} />
      </View>
      {pending.map(appointment => <View key={appointment.id} style={styles.card}>
        <Badge label={appointment.status === 'CHECKED_IN' ? 'Đã có mặt' : 'Chờ tiếp đón'} variant="teal" />
        <Text style={styles.title}>{appointment.patient_name}</Text>
        <Text selectable style={styles.body}>{appointment.booking_code}</Text>
        <Text style={styles.body}>{new Date(appointment.starts_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</Text>
        <Text style={styles.body}>{appointment.patient_phone}</Text>
        <Text style={styles.body}>{appointment.patient_email}</Text>
        <Text style={styles.body}>Triệu chứng: {appointment.symptoms}</Text>
        {canPrescribe && appointment.status === 'CHECKED_IN' ? <AppButton title="Khám và kê đơn" variant="outline"
          onPress={() => { setSelected(appointment); setDiagnosis(''); setMedicineName(''); setDosage(''); setNotes(''); }} /> : null}
      </View>)}
      {selected && canPrescribe ? <View style={styles.card}>
        <Text style={styles.title}>Bệnh án: {selected.patient_name}</Text>
        <AppInput label="Chẩn đoán" value={diagnosis} onChangeText={setDiagnosis} placeholder="Nhập chẩn đoán sau khi thăm khám" />
        <AppInput label="Tên thuốc (nếu có)" value={medicineName} onChangeText={setMedicineName} />
        <AppInput label="Liều dùng và hướng dẫn" value={dosage} onChangeText={setDosage} />
        <AppInput label="Dặn dò" value={notes} onChangeText={setNotes} />
        <AppButton title="Lưu bệnh án và hoàn thành khám" loading={busy} disabled={busy || diagnosis.trim().length < 2}
          onPress={() => {
            if ((medicineName.trim() && !dosage.trim()) || (!medicineName.trim() && dosage.trim())) {
              Alert.alert('Thông tin thuốc', 'Vui lòng nhập đủ tên thuốc và liều dùng.'); return;
            }
            void perform(async () => {
              await completeClinicAppointment(selected.id, diagnosis,
                medicineName.trim() ? [{ name: medicineName.trim(), dosage: dosage.trim() }] : [], notes);
              setSelected(null);
            });
          }} />
        <AppButton title="Đóng bệnh án đang nhập" variant="outline" onPress={() => setSelected(null)} />
      </View> : null}
      {!pending.length ? <Text style={styles.body}>Chưa có lịch hẹn đang chờ khám.</Text> : null}
      {!embedded && <AppButton title="Đăng xuất" variant="outline" onPress={onLogout} />}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: 40 },
  card: { padding: SPACING.md, gap: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surface },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  body: { fontSize: 14, color: COLORS.textPrimary },
  error: { color: COLORS.error, fontSize: 14 },
});
