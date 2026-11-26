import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppHeader, AppInput, Badge, SegmentedControl } from '../components';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppContext } from '../context/AppContext';
import { CLOUD_MODE } from '../services/supabaseClient';
import {
  checkInClinic, completeClinicAppointment, listClinicAppointments,
  loadClinicProfile, subscribeClinicAppointments,
  type ClinicAppointment, type ClinicProfile, type ClinicMedication,
} from '../services/clinicCloud';

export type StaffStatusFilter = 'pending' | 'confirmed' | 'checked_in' | 'completed';

export interface CheckedInQueueTicket {
  queueNumber: string;
  patientName: string;
  bookingCode: string;
  timeLabel: string;
  roomLabel: string;
}

export function extractBookingCode(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/(?:booking_code=|code=)?([#]?MC-[A-Za-z0-9]{4,40}|#SC-[A-Za-z0-9\-]+)/i);
  if (match) return match[1].toUpperCase();
  if (/^[A-Za-z0-9\-]{6,40}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

export function normalizeSearchText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export function filterStaffAppointments(
  appointments: ClinicAppointment[],
  statusFilter: StaffStatusFilter,
  searchQuery: string
): ClinicAppointment[] {
  const byStatus = appointments.filter((a) => {
    if (statusFilter === 'confirmed') return a.status === 'CONFIRMED';
    if (statusFilter === 'checked_in') return a.status === 'CHECKED_IN';
    if (statusFilter === 'completed') return a.status === 'COMPLETED';
    return a.status === 'CONFIRMED' || a.status === 'CHECKED_IN';
  });

  const query = normalizeSearchText(searchQuery);
  if (!query) return byStatus;

  return byStatus.filter((a) => {
    const haystack = normalizeSearchText(
      `${a.patient_name} ${a.patient_phone} ${a.patient_email} ${a.booking_code} ${a.symptoms}`
    );
    return haystack.includes(query);
  });
}

export function computeQueueNumber(
  appointments: ClinicAppointment[],
  bookingCodeOrId: string
): string {
  const target = appointments.find(a => a.id === bookingCodeOrId || a.booking_code.trim().toUpperCase() === bookingCodeOrId.trim().toUpperCase());
  return target?.queue_number ? 'STT ' + String(target.queue_number).padStart(2,'0') : 'Chưa cấp STT';
}

export function ClinicStaffScreen({
  onLogout,
  embedded = false,
  initialAppointmentId,
  onComplete,
}: {
  onLogout: () => void;
  embedded?: boolean;
  initialAppointmentId?: string;
  onComplete?: (id: string, diagnosis: string, medications: ClinicMedication[], notes: string) => Promise<boolean>;
}) {
  const {
    appointments: contextAppointments,
    checkInByCode: contextCheckInByCode,
    completeAppointment: contextCompleteAppointment,
  } = useAppContext();

  const [profile, setProfile] = useState<ClinicProfile | null>(() =>
    CLOUD_MODE
      ? null
      : {
          id: 'demo-reception',
          full_name: 'Lễ tân Quầy Tiếp Đón (Demo)',
          phone: '1900 6868',
          role: 'reception',
          doctor_id: null,
        }
  );
  const [cloudAppointments, setCloudAppointments] = useState<ClinicAppointment[]>([]);
  const [bookingCode, setBookingCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('pending');
  const [pendingTicketCode, setPendingTicketCode] = useState<string | null>(null);
  const [issuedTicket, setCheckedInTicket] = useState<CheckedInQueueTicket | null>(null);
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

  const mockAppointments = useMemo<ClinicAppointment[]>(() => {
    if (CLOUD_MODE) return [];
    return contextAppointments.map((item) => {
      let status: ClinicAppointment['status'] = 'CONFIRMED';
      if (item.status === 'completed') status = 'COMPLETED';
      else if (item.status === 'cancelled') status = 'CANCELLED';
      else if (item.statusBadge === 'Đã có mặt' || item.statusBadge === 'Đang khám') status = 'CHECKED_IN';
      return {
        id: item.id,
        booking_code: item.code,
        doctor_id: item.doctor.id,
        patient_id: item.patientId || 'demo-patient',
        patient_name: item.patientName || 'Bệnh nhân MediCare',
        patient_phone: item.patientPhone || '0901 234 567',
        patient_email: item.patientEmail || '',
        symptoms: item.symptoms || 'Khám tổng quát',
        starts_at: item.startsAt || '',
        queue_number: Number(item.queueNumber?.match(/\d+/)?.[0]) || null,
        status,
        payment_method: 'at_clinic',
        payment_status: 'UNPAID',
      };
    });
  }, [contextAppointments]);

  const appointments = CLOUD_MODE ? cloudAppointments : mockAppointments;

  const refresh = useCallback(async () => {
    if (!CLOUD_MODE) {
      setError('');
      return;
    }
    try {
      setCloudAppointments(await listClinicAppointments());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được lịch khám.');
    }
  }, []);

  useEffect(() => {
    if (!CLOUD_MODE) return;
    let mounted = true;
    void loadClinicProfile().then(data => { if (mounted) setProfile(data); }).catch(err => {
      if (mounted) setError(err instanceof Error ? err.message : 'Không tải được tài khoản.');
    });
    void listClinicAppointments().then(data => {
      if (mounted) {
        setCloudAppointments(data);
        const initial = data.find(a => a.id === initialAppointmentId && a.status === 'CHECKED_IN');
        if (initial) setSelected(initial);
      }
    }).catch(err => {
      if (mounted) setError(err instanceof Error ? err.message : 'Không tải được lịch khám.');
    });
    const unsubscribe = subscribeClinicAppointments(() => { void refresh(); });
    return () => { mounted = false; unsubscribe(); };
  }, [refresh, initialAppointmentId]);

  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(''); setSuccessMsg('');
    try { await action(); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không hoàn tất được thao tác.'); }
    finally { setBusy(false); }
  };

  const issueQueueTicket = useCallback((code: string, matched?: ClinicAppointment) => {
    const target =
      matched ||
      appointments.find((a) => a.booking_code.trim().toUpperCase() === code.trim().toUpperCase());
    if (!target || target.status !== 'CHECKED_IN' || !target.queue_number) throw new Error('Chưa nhận được STT đã xác nhận. Vui lòng tải lại lịch khám.');
    const queueNumber = computeQueueNumber([target], target.id);
    const timeLabel = target.starts_at
      ? new Date(target.starts_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      : 'Xem giờ hẹn trên phiếu gốc';
    setPendingTicketCode(null);
    setCheckedInTicket({
      queueNumber,
      patientName: target?.patient_name || 'Bệnh nhân đã tiếp đón',
      bookingCode: target?.booking_code || code,
      timeLabel,
      roomLabel: 'Quầy tiếp đón sẽ hướng dẫn phòng khám',
    });
  }, [appointments]);

  const checkedInTicket = useMemo<CheckedInQueueTicket | null>(() => {
    if (!pendingTicketCode) return issuedTicket;
    const target=appointments.find(a=>a.booking_code.toUpperCase()===pendingTicketCode.toUpperCase() && a.status==='CHECKED_IN' && a.queue_number);
    return target ? {
      queueNumber:computeQueueNumber([target],target.id),patientName:target.patient_name,bookingCode:target.booking_code,
      timeLabel:target.starts_at ? new Date(target.starts_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}) : 'Xem giờ hẹn trên phiếu gốc',
      roomLabel:'Quầy tiếp đón sẽ hướng dẫn phòng khám'
    } : null;
  }, [appointments,pendingTicketCode,issuedTicket]);

  const executeCheckIn = async (code: string) => {
    if (CLOUD_MODE) {
      const checked = await checkInClinic(code);
      issueQueueTicket(code, checked);
    } else {
      const ok = await contextCheckInByCode(code);
      if (!ok) {
        throw new Error(`Không tìm thấy lịch hẹn chờ tiếp đón với mã ${code}.`);
      }
    }
    if (!CLOUD_MODE) setPendingTicketCode(code);
  };

  const handlePrintOrShareTicket = async () => {
    if (!checkedInTicket) return;
    const slipText = [
      '=== PHIẾU SỐ THỨ TỰ KHÁM BỆNH - MEDICARE PLUS ===',
      `Số thứ tự: ${checkedInTicket.queueNumber}`,
      `Bệnh nhân: ${checkedInTicket.patientName}`,
      `Mã phiếu hẹn: ${checkedInTicket.bookingCode}`,
      `Giờ hẹn: ${checkedInTicket.timeLabel}`,
      `Vị trí: ${checkedInTicket.roomLabel}`,
      'Vui lòng ngồi chờ tại sảnh và theo dõi bảng gọi số.',
    ].join('\n');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) { setError('Trình duyệt chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại.'); return; }
      try {
        printWindow.opener = null;
        printWindow.document.title = 'Phiếu số thứ tự MediCare Plus';
        const text = printWindow.document.createElement('pre');
        text.style.whiteSpace='pre-wrap';
        text.textContent=slipText;
        printWindow.document.body.appendChild(text);
        printWindow.focus();
        printWindow.print();
      } catch { printWindow.close(); setError('Không mở được hộp thoại in. Vui lòng thử lại.'); }
      return;
    }

    try {
      await Share.share({
        title: `Phiếu ${checkedInTicket.queueNumber} - ${checkedInTicket.patientName}`,
        message: slipText,
      });
    } catch {
      Alert.alert('Phiếu số thứ tự', slipText);
    }
  };

  const canPrescribe = profile?.role === 'doctor' || profile?.role === 'admin';
  const confirmedList = useMemo(() => appointments.filter(a => a.status === 'CONFIRMED'), [appointments]);
  const checkedInList = useMemo(() => appointments.filter(a => a.status === 'CHECKED_IN'), [appointments]);
  const completedList = useMemo(() => appointments.filter(a => a.status === 'COMPLETED'), [appointments]);
  const pendingCount = confirmedList.length + checkedInList.length;

  const filteredAppointments = useMemo(
    () => filterStaffAppointments(appointments, statusFilter, searchQuery),
    [appointments, statusFilter, searchQuery]
  );

  return (
    <View style={styles.screen}>
      {!embedded && (
        <AppHeader
          title={profile?.role === 'doctor' ? 'Bàn khám bác sĩ' : 'Quầy tiếp đón bệnh nhân'}
          subtitle="Hệ thống phòng khám MediCare Plus"
          leftIconBox="qr-code-outline"
          rightActions={[
            { icon: 'refresh-outline', label: 'Làm mới', onPress: () => { void refresh(); } },
            { icon: 'log-out-outline', label: 'Đăng xuất', onPress: onLogout },
          ]}
        />
      )}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header Summary Bar */}
        <View style={[styles.summaryCard, SHADOWS.sm]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{profile?.full_name || 'Đang tải tài khoản...'}</Text>
            <Text style={styles.summarySub}>
              Chờ tiếp đón: <Text style={styles.boldNum}>{confirmedList.length}</Text> · Đã có mặt:{' '}
              <Text style={styles.boldNum}>{checkedInList.length}</Text> · Đã khám:{' '}
              <Text style={styles.boldNum}>{completedList.length}</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { void refresh(); }}
            style={styles.refreshChip}
            accessibilityRole="button"
            accessibilityLabel="Làm mới lịch khám"
          >
            <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
            <Text style={styles.refreshChipText}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {successMsg ? <Text accessibilityRole="alert" style={styles.success}>{successMsg}</Text> : null}

        {/* Issued Queue Number Slip (Phiếu STT tại quầy) */}
        {checkedInTicket ? (
          <View style={[styles.queueSlipCard, SHADOWS.md]}>
            <View style={styles.queueSlipHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="ticket" size={20} color={COLORS.secondary} />
                <Text style={styles.queueSlipTitle}>PHIẾU CẤP SỐ THỨ TỰ TẠI QUẦY</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setCheckedInTicket(null); setPendingTicketCode(null); }}
                accessibilityLabel="Đóng phiếu STT"
              >
                <Ionicons name="close-circle-outline" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.queueSlipBody}>
              <View style={styles.queueNumberBox}>
                <Text style={styles.queueNumberCaption}>SỐ THỨ TỰ</Text>
                <Text style={styles.queueNumberBig}>{checkedInTicket.queueNumber}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.queuePatientName}>{checkedInTicket.patientName}</Text>
                <Text style={styles.queueMeta}>Mã hẹn: {checkedInTicket.bookingCode}</Text>
                <Text style={styles.queueMeta}>Giờ khám: {checkedInTicket.timeLabel}</Text>
                <Text style={styles.queueMeta}>{checkedInTicket.roomLabel}</Text>
              </View>
            </View>
            <View style={styles.queueSlipActions}>
              <AppButton
                title="In / Chia sẻ phiếu STT"
                size="sm"
                leftIcon="print-outline"
                onPress={() => { void handlePrintOrShareTicket(); }}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Đóng"
                variant="outline"
                size="sm"
                onPress={() => setCheckedInTicket(null)}
                fullWidth={false}
              />
            </View>
          </View>
        ) : null}

        {/* QR Check-in & Manual Code Card */}
        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={styles.title}>Tiếp đón bệnh nhân (Quét QR / Nhập mã)</Text>
          <AppInput
            label="Mã phiếu hẹn"
            value={bookingCode}
            onChangeText={setBookingCode}
            placeholder="MC-... hoặc #SC-..."
            autoCapitalize="characters"
            leftIcon="qr-code-outline"
          />
          <AppButton
            title={cameraVisible ? 'Đóng camera' : 'Quét mã QR phiếu hẹn'}
            variant="outline"
            leftIcon="camera-outline"
            onPress={async () => {
              if (cameraVisible) { setCameraVisible(false); return; }
              try {
                const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
                if (!permission.granted) { setError('Chưa được cấp quyền camera. Bạn có thể nhập hoặc dán mã phiếu hẹn.'); return; }
                scanHandled.current = false;
                setCameraVisible(true);
              } catch { setError('Không mở được camera. Bạn có thể nhập hoặc dán mã phiếu hẹn.'); }
            }}
          />
          {cameraVisible ? (
            <View style={{ gap: 8, marginVertical: 4 }}>
              <CameraView
                style={{ height: 260, borderRadius: RADIUS.md, overflow: 'hidden' }}
                facing={cameraFacing}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onMountError={() => {
                  setCameraVisible(false);
                  setError('Không mở được luồng camera. Vui lòng nhập mã phiếu hẹn hoặc kiểm tra quyền máy ảnh.');
                }}
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
                    await executeCheckIn(code);
                    setBookingCode('');
                    setSuccessMsg(`Đã tiếp đón thành công mã hẹn ${code}!`);
                    Alert.alert('Tiếp đón thành công', `Đã ghi nhận bệnh nhân có mặt và cấp STT (Mã: ${code}).`);
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
          <AppButton
            title="Xác nhận đã có mặt & Cấp STT"
            loading={busy}
            disabled={!bookingCode.trim() || busy}
            leftIcon="checkmark-circle-outline"
            onPress={() => {
              const code = extractBookingCode(bookingCode) || bookingCode.trim();
              void perform(async () => {
                await executeCheckIn(code);
                setBookingCode('');
                setSuccessMsg(`Đã tiếp đón thành công mã hẹn ${code}!`);
              });
            }}
          />
        </View>

        {/* Quick Search & Status Filter Section */}
        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={styles.sectionTitle}>Tra cứu & Lọc danh sách khám</Text>
          <View style={{ position: 'relative' }}>
            <AppInput
              label="Tìm nhanh bệnh nhân"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Nhập tên, SĐT, email hoặc mã hẹn..."
              leftIcon="search-outline"
            />
            {searchQuery.trim().length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
                accessibilityLabel="Xóa từ khóa tìm kiếm"
              >
                <Text style={styles.clearSearchText}>Xóa lọc</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <SegmentedControl
            variant="box"
            selectedKey={statusFilter}
            onSelect={(key) => setStatusFilter(key as StaffStatusFilter)}
            options={[
              { key: 'pending', label: 'Chờ khám', count: pendingCount },
              { key: 'confirmed', label: 'Chờ Đón', count: confirmedList.length },
              { key: 'checked_in', label: 'Có mặt', count: checkedInList.length },
              { key: 'completed', label: 'Đã khám', count: completedList.length },
            ]}
          />
        </View>

        {/* Filtered Appointment List */}
        {filteredAppointments.map((appointment) => {
          const queueLabel = computeQueueNumber(appointments, appointment.id);
          const badgeLabel =
            appointment.status === 'COMPLETED'
              ? 'Đã khám xong'
              : appointment.status === 'CHECKED_IN'
              ? `Đã có mặt • ${queueLabel}`
              : 'Chờ tiếp đón';
          const badgeVariant =
            appointment.status === 'COMPLETED'
              ? 'surface'
              : appointment.status === 'CHECKED_IN'
              ? 'teal'
              : 'blue';

          return (
            <View key={appointment.id} style={[styles.card, SHADOWS.sm]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Badge label={badgeLabel} variant={badgeVariant} />
                {appointment.status === 'CONFIRMED' && (
                  <TouchableOpacity
                    disabled={busy}
                    onPress={() => {
                      void perform(async () => {
                        await executeCheckIn(appointment.booking_code);
                        setSuccessMsg(`Đã tiếp đón bệnh nhân ${appointment.patient_name} (${queueLabel})!`);
                      });
                    }}
                    style={styles.quickCheckInBtn}
                  >
                    <Text style={styles.quickCheckInText}>Tiếp đón ngay</Text>
                  </TouchableOpacity>
                )}
                {appointment.status === 'CHECKED_IN' && (
                  <TouchableOpacity
                    onPress={() => issueQueueTicket(appointment.booking_code, appointment)}
                    style={styles.viewTicketBtn}
                  >
                    <Ionicons name="ticket-outline" size={14} color={COLORS.secondary} />
                    <Text style={styles.viewTicketText}>Phiếu STT</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.title}>{appointment.patient_name}</Text>
              <Text selectable style={styles.body}>Mã hẹn: {appointment.booking_code}</Text>
              <Text style={styles.body}>
                Giờ khám: {new Date(appointment.starts_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
              </Text>
              <Text style={styles.body}>SĐT: {appointment.patient_phone || 'Chưa cập nhật'}</Text>
              {appointment.patient_email ? (
                <Text style={styles.body}>Email: {appointment.patient_email}</Text>
              ) : null}
              <Text style={styles.body}>Triệu chứng: {appointment.symptoms}</Text>
              {canPrescribe && appointment.status === 'CHECKED_IN' ? (
                <AppButton
                  title="Khám và kê đơn"
                  variant="outline"
                  onPress={() => {
                    setSelected(appointment);
                    setDiagnosis('');
                    setMedicineName('');
                    setDosage('');
                    setNotes('');
                  }}
                />
              ) : null}
            </View>
          );
        })}

        {selected && canPrescribe ? (
          <View style={[styles.card, SHADOWS.md]}>
            <Text style={styles.title}>Bệnh án: {selected.patient_name}</Text>
            <AppInput label="Chẩn đoán" value={diagnosis} onChangeText={setDiagnosis} placeholder="Nhập chẩn đoán sau khi thăm khám" />
            <AppInput label="Tên thuốc (nếu có)" value={medicineName} onChangeText={setMedicineName} />
            <AppInput label="Liều dùng và hướng dẫn" value={dosage} onChangeText={setDosage} />
            <AppInput label="Dặn dò" value={notes} onChangeText={setNotes} />
            <AppButton
              title="Lưu bệnh án và hoàn thành khám"
              loading={busy}
              disabled={busy || diagnosis.trim().length < 2}
              onPress={() => {
                if ((medicineName.trim() && !dosage.trim()) || (!medicineName.trim() && dosage.trim())) {
                  Alert.alert('Thông tin thuốc', 'Vui lòng nhập đủ tên thuốc và liều dùng.'); return;
                }
                void perform(async () => {
                  const medications = medicineName.trim() ? [{ name: medicineName.trim(), dosage: dosage.trim() }] : [];
                  if (onComplete) {
                    const success = await onComplete(selected.id, diagnosis, medications, notes);
                    if (!success) return;
                  } else if (CLOUD_MODE) {
                    await completeClinicAppointment(selected.id, diagnosis, medications, notes);
                  } else {
                    const success = await contextCompleteAppointment(selected.id, diagnosis, medications, notes);
                    if (!success) return;
                  }
                  setSelected(null);
                });
              }}
            />
            <AppButton title="Đóng bệnh án đang nhập" variant="outline" onPress={() => setSelected(null)} />
          </View>
        ) : null}

        {!filteredAppointments.length ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={28} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `Không tìm thấy bệnh nhân phù hợp với "${searchQuery.trim()}".`
                : 'Chưa có lịch hẹn nào trong mục này.'}
            </Text>
          </View>
        ) : null}

        {!embedded && <AppButton title="Đăng xuất" variant="outline" onPress={onLogout} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: 40 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  summarySub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  boldNum: { fontWeight: '700', color: COLORS.textPrimary },
  refreshChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.tintBlue,
  },
  refreshChipText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  card: { padding: SPACING.md, gap: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surface },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  body: { fontSize: 14, color: COLORS.textPrimary },
  error: { color: COLORS.error, fontSize: 14, fontWeight: '600' },
  success: { color: COLORS.secondary, fontSize: 14, fontWeight: '700' },
  clearSearchBtn: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 4 },
  clearSearchText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  quickCheckInBtn: {
    backgroundColor: COLORS.tintBlue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickCheckInText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  viewTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.tintTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  viewTicketText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  queueSlipCard: {
    padding: SPACING.md,
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  },
  queueSlipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueSlipTitle: { fontSize: 13, fontWeight: '800', color: COLORS.secondary, letterSpacing: 0.4 },
  queueSlipBody: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  queueNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 92,
  },
  queueNumberCaption: { fontSize: 10, fontWeight: '700', color: '#E0F2FE', letterSpacing: 0.5 },
  queueNumberBig: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  queuePatientName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  queueMeta: { fontSize: 13, color: COLORS.textSecondary },
  queueSlipActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
