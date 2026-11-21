import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppButton, AppHeader, AppInput, Badge } from '../components';
import { COLORS, RADIUS, SPACING } from '../theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  checkInClinic, completeClinicAppointment, listClinicAppointments,
  loadClinicProfile, subscribeClinicAppointments,
  type ClinicAppointment, type ClinicProfile, type ClinicMedication,
} from '../services/clinicCloud';

export function extractBookingCode(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/(?:booking_code=|code=)?([#]?MC-[A-Za-z0-9]{4,40}|#SC-[A-Za-z0-9\-]+)/i);
  if (match) return match[1].toUpperCase();
  if (/^[A-Za-z0-9\-]{6,40}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

export function ClinicStaffScreen({ onLogout, embedded = false, initialAppointmentId, onComplete }: { onLogout: () => void; embedded?: boolean; initialAppointmentId?: string; onComplete?: (id: string, diagnosis: string, medications: ClinicMedication[], notes: string) => Promise<boolean> }) {
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
  const [successMsg, setSuccessMsg] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>(Platform.OS === 'web' ? 'front' : 'back');
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
    setBusy(true); setError(''); setSuccessMsg('');
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
      {successMsg ? <Text accessibilityRole="alert" style={styles.success}>{successMsg}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.title}>Tiếp đón bệnh nhân (Quét QR / Nhập mã)</Text>
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
        {cameraVisible ? (
          <View style={{ gap: 8, marginVertical: 4 }}>
            <CameraView
              style={{ height: 260, borderRadius: RADIUS.md, overflow: 'hidden' }}
              facing={cameraFacing}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onMountError={() => { setCameraVisible(false); setError('Không mở được luồng camera. Vui lòng nhập mã phiếu hẹn hoặc kiểm tra quyền máy ảnh.'); }}
              onBarcodeScanned={({ data }) => {
                if (scanHandled.current) return;
                scanHandled.current = true;
                const code = extractBookingCode(data);
                if (!code) {
                  setError(`Mã QR không đúng định dạng phiếu khám (${(data || '').slice(0, 24)}...).`);
                  setCameraVisible(false);
                  return;
                }
                setBookingCode(code);
                setCameraVisible(false);
                setError('');
                void perform(async () => {
                  await checkInClinic(code);
                  setBookingCode('');
                  setSuccessMsg(`Đã tiếp đón thành công mã hẹn ${code}!`);
                  Alert.alert('Tiếp đón thành công', `Đã ghi nhận bệnh nhân có mặt (Mã: ${code}).`);
                });
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <AppButton
                title={`Đổi camera (${cameraFacing === 'back' ? 'Camera sau' : 'Camera trước'})`}
                variant="tonal"
                size="sm"
                onPress={() => setCameraFacing(prev => prev === 'back' ? 'front' : 'back')}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Đóng camera"
                variant="outline"
                size="sm"
                onPress={() => setCameraVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}
        <AppButton title="Xác nhận đã có mặt" loading={busy} disabled={!bookingCode.trim() || busy}
          onPress={() => {
            const code = extractBookingCode(bookingCode) || bookingCode.trim();
            void perform(async () => {
              await checkInClinic(code);
              setBookingCode('');
              setSuccessMsg(`Đã tiếp đón thành công mã hẹn ${code}!`);
            });
          }} />
      </View>
      {pending.map(appointment => <View key={appointment.id} style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Badge label={appointment.status === 'CHECKED_IN' ? 'Đã có mặt' : 'Chờ tiếp đón'} variant={appointment.status === 'CHECKED_IN' ? 'teal' : 'blue'} />
          {appointment.status === 'CONFIRMED' && (
            <TouchableOpacity
              onPress={() => {
                void perform(async () => {
                  await checkInClinic(appointment.booking_code);
                  setSuccessMsg(`Đã tiếp đón bệnh nhân ${appointment.patient_name}!`);
                });
              }}
              style={{ backgroundColor: COLORS.tintBlue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.primary }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>Tiếp đón ngay</Text>
            </TouchableOpacity>
          )}
        </View>
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
              const medications = medicineName.trim() ? [{ name: medicineName.trim(), dosage: dosage.trim() }] : [];
              if (onComplete) {
                const success = await onComplete(selected.id, diagnosis, medications, notes);
                if (!success) return;
              } else {
                await completeClinicAppointment(selected.id, diagnosis, medications, notes);
              }
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
  success: { color: COLORS.secondary, fontSize: 14, fontWeight: '700' },
});
