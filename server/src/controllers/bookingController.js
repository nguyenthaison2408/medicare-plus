const { departments, doctors, initialSlots, appointments } = require('../data/mockData');

let slots = [...initialSlots];
// In-memory Mutex Lock table for simulating Row-level Concurrency Lock
const activeLocks = new Map();

/**
 * Lấy danh mục chuyên khoa
 */
const getDepartments = (req, res) => {
  return res.status(200).json({ success: true, data: departments });
};

/**
 * Lấy danh sách bác sĩ kèm chuyên khoa
 */
const getDoctors = (req, res) => {
  const { departmentId } = req.query;
  let filtered = doctors;
  if (departmentId) {
    filtered = doctors.filter(d => d.departmentId === departmentId);
  }
  return res.status(200).json({ success: true, data: filtered });
};

/**
 * Lấy danh sách khung giờ khám theo bác sĩ & ngày
 */
const getSlots = (req, res) => {
  const { doctorId, date } = req.query;
  let available = slots;
  if (doctorId) {
    available = available.filter(s => s.doctorId === doctorId);
  }
  if (date) {
    available = available.filter(s => s.date === date);
  }
  return res.status(200).json({ success: true, data: available });
};

/**
 * Đặt lịch khám bệnh - Có cơ chế Locking chống Concurrency / Race Condition (Giải quyết R-01)
 */
const bookAppointment = (req, res) => {
  const { slotId, patientName, phone, email, symptoms } = req.body;

  if (!slotId || !patientName || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ slotId, tên bệnh nhân và số điện thoại.'
    });
  }

  // 1. Kiểm tra Concurrency Lock (Mô phỏng Pessimistic Locking SELECT FOR UPDATE)
  if (activeLocks.has(slotId)) {
    return res.status(409).json({
      success: false,
      code: 'SLOT_LOCKED_CONCURRENT_TRANSACTION',
      message: 'Khung giờ khám này đang được xử lý bởi một bệnh nhân khác. Vui lòng chọn khung giờ khác.'
    });
  }

  // Khóa slot trong 3 giây
  activeLocks.set(slotId, Date.now());

  try {
    const slotIndex = slots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) {
      activeLocks.delete(slotId);
      return res.status(404).json({ success: false, message: 'Khung giờ khám không tồn tại.' });
    }

    const slot = slots[slotIndex];
    if (slot.isBooked) {
      activeLocks.delete(slotId);
      return res.status(409).json({
        success: false,
        code: 'SLOT_ALREADY_BOOKED',
        message: 'Khung giờ khám này đã có bệnh nhân đặt trước.'
      });
    }

    // Đánh dấu slot đã được đặt
    slots[slotIndex].isBooked = true;

    const doctor = doctors.find(d => d.id === slot.doctorId);
    const newAppointmentId = `APT-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrCode = `MEDICARE-${newAppointmentId}-QR`;

    const newAppointment = {
      id: newAppointmentId,
      qrCode,
      patientName,
      phone,
      email: email || `${phone}@patient.medicare.vn`,
      doctorId: slot.doctorId,
      doctorName: doctor ? doctor.name : 'Bác sĩ chuyên khoa',
      department: doctor ? doctor.departmentName : 'Đa khoa',
      date: slot.date,
      time: slot.time,
      symptoms: symptoms || 'Khám tổng quát định kỳ',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      prescription: null
    };

    appointments.unshift(newAppointment);

    // Giải phóng lock
    activeLocks.delete(slotId);

    return res.status(201).json({
      success: true,
      message: 'Đặt lịch khám thành công!',
      data: newAppointment
    });
  } catch (err) {
    activeLocks.delete(slotId);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xử lý giao dịch đặt lịch.' });
  }
};

/**
 * Lấy danh sách lịch hẹn (Dành cho Lễ tân & Bác sĩ)
 */
const getAppointments = (req, res) => {
  const { status, doctorId, search } = req.query;
  let list = [...appointments];

  if (status) {
    list = list.filter(a => a.status === status);
  }
  if (doctorId) {
    list = list.filter(a => a.doctorId === doctorId);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(a =>
      a.patientName.toLowerCase().includes(s) ||
      a.phone.includes(s) ||
      a.id.toLowerCase().includes(s) ||
      a.qrCode.toLowerCase().includes(s)
    );
  }

  return res.status(200).json({ success: true, count: list.length, data: list });
};

/**
 * Check-in tiếp đón bằng Mã QR tại quầy Lễ tân (Xử lý biến cố Scope Change CR-01)
 */
const checkInByQR = (req, res) => {
  const { qrCode } = req.body;
  if (!qrCode) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã QR.' });
  }

  const appointment = appointments.find(a => a.qrCode === qrCode || a.id === qrCode);
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu hẹn phù hợp với mã QR này.' });
  }

  if (appointment.status === 'COMPLETED') {
    return res.status(400).json({ success: false, message: 'Lịch khám này đã hoàn tất trước đó.' });
  }

  appointment.status = 'CHECKED_IN';
  appointment.checkInTime = new Date().toISOString();

  return res.status(200).json({
    success: true,
    message: `Tiếp đón thành công bệnh nhân: ${appointment.patientName}`,
    data: appointment
  });
};

/**
 * Bác sĩ lưu chẩn đoán và đơn thuốc EMR, hoàn thành ca khám
 */
const saveMedicalRecord = (req, res) => {
  const { id } = req.params;
  const { diagnosis, medications, notes } = req.body;

  const appointment = appointments.find(a => a.id === id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ lịch khám.' });
  }

  appointment.prescription = {
    diagnosis: diagnosis || 'Đã kiểm tra sức khỏe tổng quát',
    medications: medications || [],
    notes: notes || 'Uống thuốc đúng liều lượng chỉ định.'
  };
  appointment.status = 'COMPLETED';
  appointment.completedAt = new Date().toISOString();

  return res.status(200).json({
    success: true,
    message: 'Lưu bệnh án điện tử (EMR) và xuất đơn thuốc thành công!',
    data: appointment
  });
};

module.exports = {
  getDepartments,
  getDoctors,
  getSlots,
  bookAppointment,
  getAppointments,
  checkInByQR,
  saveMedicalRecord
};
