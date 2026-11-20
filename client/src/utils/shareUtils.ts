import { Share, Alert } from 'react-native';
import { DoctorItem, PrescriptionDrug } from '../data/mockData';
import { LatestBookingTicket } from '../context/AppContext';

/**
 * Chia sẻ Phiếu hẹn khám bệnh qua Native OS Share Sheet (Zalo, Messenger, Email, Ghi chú...)
 */
export async function shareAppointmentTicket(
  ticket: LatestBookingTicket
): Promise<void> {
  const { doctor } = ticket;
  const isBHYT = ticket.paymentMethod === 'at_clinic_bhyt';
  const paymentStatus = ticket.paymentMethod === 'at_clinic'
    ? 'Thanh toán tại cơ sở y tế — chưa thu tiền'
    : isBHYT
    ? 'Giữ chỗ BHYT (Thanh toán & đối chiếu tại viện)'
    : `Đã thanh toán Online (${ticket.doctor.fee})`;

  const message = [
    `🏥 PHIẾU HẸN KHÁM MEDICARE PLUS`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `• Mã phiếu hẹn: ${ticket.code}`,
    `• Số thứ tự: ${ticket.queueNumber}`,
    `• Bác sĩ: ${doctor.name} (${doctor.degree})`,
    `• Chuyên khoa: ${doctor.specialty}`,
    `• Cơ sở y tế: ${doctor.hospital}`,
    `• Địa chỉ: ${doctor.address}`,
    `• Thời gian: ${ticket.timeRange} — ${ticket.dayLabel}, ${ticket.fullDate}`,
    `• Phòng khám: ${ticket.room}`,
    `• Bệnh nhân: ${ticket.patientName || 'Chưa cập nhật'}`,
    `• Số điện thoại: ${ticket.patientPhone || 'Chưa cập nhật'}`,
    `• Email: ${ticket.patientEmail || 'Chưa cập nhật'}`,
    `• Triệu chứng: ${ticket.symptoms || 'Chưa cập nhật'}`,
    `• Thanh toán: ${paymentStatus}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📌 Lưu ý: Vui lòng có mặt trước 15 phút và mang theo CCCD gắn chip / VssID để check-in QR tại Kiosk.`,
  ].join('\n');

  try {
    await Share.share({
      title: `Phiếu hẹn khám ${ticket.code} - MediCare Plus`,
      message,
    });
  } catch {
    Alert.alert('Không thể chia sẻ', 'Thiết bị không hỗ trợ chia sẻ nội dung này.');
  }
}

/**
 * Chia sẻ Đơn thuốc điện tử qua Native OS Share Sheet
 */
export async function sharePrescription(
  drugs: PrescriptionDrug[],
  diagnosisNote: string,
  doctorName = 'TS. BS. Lê Thu Trang'
): Promise<void> {
  const drugLines = drugs
    .map(
      (d, idx) =>
        `${idx + 1}. ${d.name} (${d.quantity})\n   - Liều dùng: ${d.dosageTag}\n   - Hướng dẫn: ${d.instructionTag}`
    )
    .join('\n');

  const message = [
    `💊 ĐƠN THUỐC ĐIỆN TỬ MEDICARE PLUS (#DT-241029-01)`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `• Bệnh nhân: Nguyễn Văn Vũ (#BN-882910)`,
    `• Bác sĩ kê đơn: ${doctorName}`,
    `• Chẩn đoán: ${diagnosisNote}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 DANH MỤC THUỐC (${drugs.length} loại):`,
    drugLines,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⚠️ Lưu ý: Uống thuốc đúng giờ theo lịch nhắc trên ứng dụng MediCare Plus.`,
  ].join('\n');

  try {
    await Share.share({
      title: 'Đơn thuốc điện tử #DT-241029-01 - MediCare Plus',
      message,
    });
  } catch {
    Alert.alert('Không thể chia sẻ', 'Thiết bị không hỗ trợ chia sẻ đơn thuốc.');
  }
}

/**
 * Chia sẻ thông tin Bác sĩ chuyên khoa qua Native OS Share Sheet
 */
export async function shareDoctorProfile(doctor: DoctorItem): Promise<void> {
  const message = [
    `👨‍⚕️ THÔNG TIN BÁC SĨ — MEDICARE PLUS`,
    `• ${doctor.name} (${doctor.degree})`,
    `• Chuyên khoa: ${doctor.subSpecialty}`,
    `• Bệnh viện: ${doctor.hospital}`,
    `• Địa chỉ: ${doctor.address}`,
    `• Đánh giá: ★ ${doctor.rating}/5.0 (${doctor.reviewCount} lượt đánh giá)`,
    `• Phí tư vấn: ${doctor.fee} (${doctor.bhytSupport})`,
  ].join('\n');

  try {
    await Share.share({
      title: `Bác sĩ ${doctor.name} - MediCare Plus`,
      message,
    });
  } catch {
    Alert.alert('Không thể chia sẻ', 'Thiết bị không hỗ trợ chia sẻ hồ sơ bác sĩ.');
  }
}

