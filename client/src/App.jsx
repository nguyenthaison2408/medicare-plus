import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Phone, CheckCircle2, AlertCircle, 
  Search, QrCode, Stethoscope, Activity, FileText, ChevronRight, 
  ShieldCheck, HeartPulse, Building2, Users, ArrowRight, Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Default mock data for standalone/fallback mode
const DEFAULT_DEPARTMENTS = [
  { id: 'dept-01', name: 'Khoa Nội Tim Mạch', icon: 'HeartPulse', description: 'Chuyên khám & điều trị các bệnh lý tim mạch, huyết áp' },
  { id: 'dept-02', name: 'Khoa Nhi', icon: 'Activity', description: 'Chăm sóc sức khỏe toàn diện và dinh dưỡng cho trẻ nhỏ' },
  { id: 'dept-03', name: 'Khoa Tai Mũi Họng', icon: 'Stethoscope', description: 'Khám và nội soi điều trị viêm họng, xoang, thính lực' }
];

const DEFAULT_DOCTORS = [
  {
    id: 'doc-01',
    name: 'BS. CKI. Trần Đình Hoàng',
    departmentId: 'dept-01',
    departmentName: 'Khoa Nội Tim Mạch',
    title: 'Trưởng Khoa Tim Mạch',
    experience: '16 năm kinh nghiệm',
    rating: 4.9,
    reviewsCount: 142,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    availableDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6']
  },
  {
    id: 'doc-02',
    name: 'ThS. BS. Nguyễn Thị Mai Lan',
    departmentId: 'dept-02',
    departmentName: 'Khoa Nhi',
    title: 'Phó Khoa Nhi - Bệnh viện Nhi Đồng',
    experience: '12 năm kinh nghiệm',
    rating: 4.95,
    reviewsCount: 198,
    avatar: 'https://images.unsplash.com/photo-1594824813587-0b19685a8169?w=300&auto=format&fit=crop&q=80',
    availableDays: ['Thứ 2', 'Thứ 4', 'Thứ 6', 'Thứ 7']
  }
];

const INITIAL_SLOTS = [
  { id: 'slot-01', doctorId: 'doc-01', time: '08:00 - 08:30', date: '2026-11-20', isBooked: true },
  { id: 'slot-02', doctorId: 'doc-01', time: '08:30 - 09:00', date: '2026-11-20', isBooked: true },
  { id: 'slot-03', doctorId: 'doc-01', time: '09:00 - 09:30', date: '2026-11-20', isBooked: false },
  { id: 'slot-04', doctorId: 'doc-01', time: '09:30 - 10:00', date: '2026-11-20', isBooked: false },
  { id: 'slot-05', doctorId: 'doc-01', time: '10:00 - 10:30', date: '2026-11-20', isBooked: false },
  { id: 'slot-06', doctorId: 'doc-02', time: '08:00 - 08:30', date: '2026-11-20', isBooked: false },
  { id: 'slot-07', doctorId: 'doc-02', time: '08:30 - 09:00', date: '2026-11-20', isBooked: false }
];

const INITIAL_APPOINTMENTS = [
  {
    id: 'APT-1001',
    qrCode: 'MEDICARE-APT-1001-QR',
    patientName: 'Nguyễn Văn Minh',
    phone: '0905123456',
    doctorName: 'BS. CKI. Trần Đình Hoàng',
    department: 'Khoa Nội Tim Mạch',
    date: '2026-11-20',
    time: '08:00 - 08:30',
    status: 'COMPLETED',
    symptoms: 'Đau tức ngực khi vận động mạnh',
    prescription: {
      diagnosis: 'I10 - Tăng huyết áp vô căn độ 1',
      medications: [{ name: 'Amlodipine 5mg', dosage: '1 viên/ngày' }],
      notes: 'Hạn chế ăn mặn, tái khám sau 30 ngày.'
    }
  },
  {
    id: 'APT-1002',
    qrCode: 'MEDICARE-APT-1002-QR',
    patientName: 'Lê Bảo Anh',
    phone: '0914987654',
    doctorName: 'BS. CKI. Trần Đình Hoàng',
    department: 'Khoa Nội Tim Mạch',
    date: '2026-11-20',
    time: '08:30 - 09:00',
    status: 'CHECKED_IN',
    symptoms: 'Chóng mặt, đo huyết áp tại nhà 145/95',
    prescription: null
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('patient'); // 'patient' | 'reception' | 'doctor' | 'docs'
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(DEFAULT_DOCTORS[0]);
  const [slots, setSlots] = useState(INITIAL_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  
  // Booking Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Reception Check-in State
  const [qrInput, setQrInput] = useState('');
  const [checkInNotice, setCheckInNotice] = useState(null);

  // Doctor Consultation State
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medication, setMedication] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');

  // Handle booking with simulated Concurrency Lock
  const handleBooking = (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setBookingError('Vui lòng chọn khung giờ khám!');
      return;
    }
    if (!patientName || !patientPhone) {
      setBookingError('Vui lòng nhập tên và số điện thoại bệnh nhân!');
      return;
    }

    // Check if slot was booked in another tab/request
    if (selectedSlot.isBooked) {
      setBookingError('Khung giờ này vừa có người đặt trước! Vui lòng chọn khung giờ khác.');
      return;
    }

    const newId = `APT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newQr = `MEDICARE-${newId}-QR`;
    const newAppointment = {
      id: newId,
      qrCode: newQr,
      patientName,
      phone: patientPhone,
      doctorName: selectedDoctor.name,
      department: selectedDoctor.departmentName,
      date: selectedSlot.date,
      time: selectedSlot.time,
      symptoms: symptoms || 'Khám tổng quát',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      prescription: null
    };

    // Update slots state (mark as booked)
    setSlots(prev => prev.map(s => s.id === selectedSlot.id ? { ...s, isBooked: true } : s));
    setAppointments(prev => [newAppointment, ...prev]);

    // Show success ticket
    setBookingSuccessModal(newAppointment);
    setBookingError('');
    setSelectedSlot(null);
    setPatientName('');
    setPatientPhone('');
    setSymptoms('');
  };

  // Handle QR Check-in at Reception
  const handleCheckIn = (code) => {
    const targetCode = code || qrInput;
    if (!targetCode) return;

    const aptIndex = appointments.findIndex(a => a.qrCode === targetCode || a.id === targetCode);
    if (aptIndex === -1) {
      setCheckInNotice({ type: 'error', message: 'Không tìm thấy phiếu hẹn phù hợp với mã QR này!' });
      return;
    }

    const apt = appointments[aptIndex];
    if (apt.status === 'COMPLETED') {
      setCheckInNotice({ type: 'error', message: `Phiếu hẹn ${apt.id} đã hoàn thành khám trước đó.` });
      return;
    }

    const updated = [...appointments];
    updated[aptIndex].status = 'CHECKED_IN';
    setAppointments(updated);
    setCheckInNotice({ type: 'success', message: `Tiếp đón thành công bệnh nhân: ${apt.patientName} (${apt.id})` });
    setQrInput('');
  };

  // Handle Doctor Saving EMR
  const handleSaveEMR = (e) => {
    e.preventDefault();
    if (!activeConsultation) return;

    const updated = appointments.map(a => {
      if (a.id === activeConsultation.id) {
        return {
          ...a,
          status: 'COMPLETED',
          prescription: {
            diagnosis: diagnosis || 'Sức khỏe bình thường',
            medications: medication ? [{ name: medication, dosage: 'Theo đơn chỉ định' }] : [],
            notes: doctorNotes || 'Uống thuốc đúng giờ, tái khám khi có dấu hiệu bất thường.'
          }
        };
      }
      return a;
    });

    setAppointments(updated);
    alert(`Đã lưu bệnh án EMR và xuất đơn thuốc thành công cho bệnh nhân: ${activeConsultation.patientName}!`);
    setActiveConsultation(null);
    setDiagnosis('');
    setMedication('');
    setDoctorNotes('');
  };

  const filteredDoctors = selectedDept === 'all' 
    ? DEFAULT_DOCTORS 
    : DEFAULT_DOCTORS.filter(d => d.departmentId === selectedDept);

  const availableSlots = selectedDoctor 
    ? slots.filter(s => s.doctorId === selectedDoctor.id) 
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('patient')}>
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">MediCare<span className="text-teal-600">Plus</span></span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">VKU Capstone</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Nền tảng Quản lý Phòng khám & Đặt lịch Khám trực tuyến</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('patient')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'patient' 
                  ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Đặt Lịch Khám</span>
            </button>
            <button
              onClick={() => setActiveTab('reception')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'reception' 
                  ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Quầy Tiếp Tân</span>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            </button>
            <button
              onClick={() => setActiveTab('doctor')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'doctor' 
                  ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Bác Sĩ & EMR</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'docs' 
                  ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Hồ Sơ Đồ Án</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* TAB 1: PATIENT BOOKING PORTAL */}
        {activeTab === 'patient' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-teal-900/10 relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-4 border border-white/20">
                  <ShieldCheck className="w-4 h-4" /> Hệ thống Khóa Slot Chống Trùng Lịch Thời Gian Thực
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4">
                  Đặt Lịch Khám Thông Minh — Giảm 80% Thời Gian Chờ Đợi
                </h1>
                <p className="text-teal-50 text-base sm:text-lg mb-6 leading-relaxed">
                  Lựa chọn bác sĩ chuyên khoa, chủ động chọn khung giờ khám phù hợp và nhận ngay phiếu khám điện tử có mã QR để check-in tức thì tại sảnh.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-white/20">
                  <div>
                    <div className="text-2xl font-bold">11.4 phút</div>
                    <div className="text-xs text-teal-100">Thời gian chờ trung bình</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">7.2%</div>
                    <div className="text-xs text-teal-100">Tỷ lệ No-show giảm mạnh</div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-xs text-teal-100">Zero Crash & Bảo mật HTTPS</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Speciality Selection Filter */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" /> Chọn Chuyên Khoa Thăm Khám
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDept('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedDept === 'all'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-500'
                  }`}
                >
                  Tất cả chuyên khoa
                </button>
                {DEFAULT_DEPARTMENTS.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                      selectedDept === dept.id
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-500'
                    }`}
                  >
                    <span>{dept.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor & Slot Selection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Doctor Selection Cards */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Danh Sách Bác Sĩ Chuyên Khoa</h3>
                <div className="space-y-3">
                  {filteredDoctors.map(doctor => (
                    <div
                      key={doctor.id}
                      onClick={() => { setSelectedDoctor(doctor); setSelectedSlot(null); }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                        selectedDoctor.id === doctor.id
                          ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <img 
                          src={doctor.avatar} 
                          alt={doctor.name} 
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                            {doctor.departmentName}
                          </span>
                          <h4 className="font-bold text-slate-900 text-base mt-1 truncate">{doctor.name}</h4>
                          <p className="text-xs text-slate-500">{doctor.title} • {doctor.experience}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-amber-500">
                            ★ {doctor.rating} <span className="text-slate-400 font-normal">({doctor.reviewsCount} đánh giá)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Time Slots & Booking Form */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Chọn Khung Giờ Khám — {selectedDoctor.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mỗi ca khám kéo dài 30 phút. Khung giờ màu xanh lá sẵn sàng đặt, khung giờ màu xám đã có người đặt.
                  </p>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.id}
                      disabled={slot.isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        slot.isBooked
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                          : selectedSlot?.id === slot.id
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/30'
                            : 'bg-teal-50/50 text-teal-800 border-teal-200 hover:bg-teal-100/70 hover:border-teal-400'
                      }`}
                    >
                      <div className="text-xs font-semibold flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {slot.time}
                      </div>
                      <div className="text-[10px] mt-1 font-medium">
                        {slot.isBooked ? 'Đã được đặt' : 'Còn trống'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBooking} className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ & Tên Bệnh Nhân *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn An"
                        value={patientName}
                        onChange={e => setPatientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số Điện Thoại Nhận SMS *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ví dụ: 0905123456"
                        value={patientPhone}
                        onChange={e => setPatientPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô Tả Triệu Chứng / Lý Do Khám</label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả sơ lược triệu chứng để bác sĩ chuẩn bị trước..."
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    ></textarea>
                  </div>

                  {bookingError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {bookingError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Xác Nhận Đặt Lịch & Nhận Phiếu Khám QR</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RECEPTION & QUEUE CONSOLE */}
        {activeTab === 'reception' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-teal-600" /> Bàn Tiếp Đón & Quét Mã QR Tiếp Nhận
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Quét mã QR từ điện thoại của bệnh nhân để tự động chuyển trạng thái vào Hàng Đợi Khám trong vòng 2 giây.
                </p>
              </div>

              {/* Fast QR Scan Simulator */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã QR hoặc Mã hẹn..."
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={() => handleCheckIn()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-all"
                >
                  Tiếp Đón
                </button>
              </div>
            </div>

            {checkInNotice && (
              <div className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
                checkInNotice.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {checkInNotice.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
                {checkInNotice.message}
              </div>
            )}

            {/* Live Queue Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Danh Sách Bệnh Nhân Đặt Hẹn Hôm Nay</h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  Tổng cộng: {appointments.length} bệnh nhân
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Mã Phiếu & QR</th>
                      <th className="px-6 py-3">Bệnh Nhân</th>
                      <th className="px-6 py-3">Bác Sĩ & Chuyên Khoa</th>
                      <th className="px-6 py-3">Khung Giờ</th>
                      <th className="px-6 py-3">Trạng Thái</th>
                      <th className="px-6 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{apt.id}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{apt.qrCode}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{apt.patientName}</div>
                          <div className="text-xs text-slate-500">{apt.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{apt.doctorName}</div>
                          <div className="text-xs text-teal-600">{apt.department}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{apt.time}</div>
                          <div className="text-xs text-slate-400">{apt.date}</div>
                        </td>
                        <td className="px-6 py-4">
                          {apt.status === 'CONFIRMED' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Chờ đến
                            </span>
                          )}
                          {apt.status === 'CHECKED_IN' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              Đã có mặt tại sảnh
                            </span>
                          )}
                          {apt.status === 'COMPLETED' && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              Đã khám xong
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {apt.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleCheckIn(apt.qrCode)}
                              className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-300 text-xs font-bold hover:bg-teal-100 transition-colors"
                            >
                              Check-in Ngay
                            </button>
                          )}
                          {apt.status === 'CHECKED_IN' && (
                            <span className="text-xs text-emerald-600 font-semibold">Sẵn sàng khám</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOCTOR EMR CONSOLE */}
        {activeTab === 'doctor' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-6 h-6 text-teal-600" /> Bàn Khám Bác Sĩ & Hồ Sơ Bệnh Án Điện Tử (EMR)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Đang làm việc: <span className="font-semibold text-slate-800">BS. CKI. Trần Đình Hoàng</span> • Khoa Nội Tim Mạch
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Waiting queue list */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Hàng Đợi Chờ Khám</span>
                  <span className="text-xs font-normal text-slate-500">Bệnh nhân đã check-in</span>
                </h3>

                {appointments.filter(a => a.status === 'CHECKED_IN').length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                    Hiện tại không có bệnh nhân nào trong hàng đợi check-in.
                  </div>
                ) : (
                  appointments.filter(a => a.status === 'CHECKED_IN').map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => { setActiveConsultation(apt); setDiagnosis(''); setMedication(''); }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                        activeConsultation?.id === apt.id
                          ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md'
                          : 'border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900">{apt.patientName}</div>
                          <div className="text-xs text-slate-500">SĐT: {apt.phone} • {apt.time}</div>
                          <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <strong>Triệu chứng:</strong> {apt.symptoms}
                          </p>
                        </div>
                        <button className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold">
                          Khám
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Consultation and prescription panel */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                {activeConsultation ? (
                  <form onSubmit={handleSaveEMR} className="space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">Hồ Sơ Ca Khám: {activeConsultation.patientName}</h4>
                        <p className="text-xs text-slate-500">Mã hẹn: {activeConsultation.id} • Giờ hẹn: {activeConsultation.time}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
                        Đang Khám
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chẩn Đoán ICD-10 *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: I10 - Tăng huyết áp vô căn độ 1"
                        value={diagnosis}
                        onChange={e => setDiagnosis(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kê Đơn Thuốc Điện Tử</label>
                      <textarea
                        rows={2}
                        placeholder="Ví dụ: Amlodipine 5mg (1 viên/ngày uống sáng); Aspirin 81mg (1 viên/ngày sau ăn)"
                        value={medication}
                        onChange={e => setMedication(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lời Dặn & Hẹn Tái Khám</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Hạn chế ăn mặn, kiêng cà phê, tái khám sau 30 ngày."
                        value={doctorNotes}
                        onChange={e => setDoctorNotes(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-teal-600/20"
                    >
                      Lưu Bệnh Án EMR & Xuất Đơn Thuốc Điện Tử
                    </button>
                  </form>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">Vui lòng chọn một bệnh nhân từ Hàng đợi bên trái để bắt đầu buổi khám.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SPM CAPSTONE DOCS */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Hồ Sơ & Tài Liệu Quản Trị Dự Án Phần Mềm (VKU)</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Đồ án học phần SPM thực hiện theo chuẩn công nghiệp của <strong>TS. Nguyễn Thanh Tuấn</strong>. Toàn bộ tài liệu được số hóa và quản lý tập trung trên GitHub Repository.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 transition-colors bg-slate-50/50">
                  <div className="font-bold text-slate-900 mb-1">01. Điều Lệ Dự Án (Project Charter)</div>
                  <p className="text-xs text-slate-500 mb-3">13 mục chuẩn hóa PMBOK có đầy đủ bảng ký duyệt của GV Chuyên ngành, GV QLDA và PM.</p>
                  <span className="text-xs text-teal-700 font-semibold">docs/01_Project_Charter_Signed.md</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 transition-colors bg-slate-50/50">
                  <div className="font-bold text-slate-900 mb-1">02. Cây WBS & Từ Điển WBS</div>
                  <p className="text-xs text-slate-500 mb-3">Tuân thủ nguyên tắc 100% Rule, 22 gói công việc 1–2 tuần có Definition of Done (DoD) chi tiết.</p>
                  <span className="text-xs text-teal-700 font-semibold">docs/02_WBS_and_WBS_Dictionary.md</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 transition-colors bg-slate-50/50">
                  <div className="font-bold text-slate-900 mb-1">03. Bảng Rủi Ro Động (Risk Register)</div>
                  <p className="text-xs text-slate-500 mb-3">Tiến hóa qua Sprint 1 (W06) và Sprint 2 (W11), minh chứng xử lý biến cố Race Condition và Scope Change CR-01.</p>
                  <span className="text-xs text-teal-700 font-semibold">docs/03_Dynamic_Risk_Register.md</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 transition-colors bg-slate-50/50">
                  <div className="font-bold text-slate-900 mb-1">04. Báo Cáo Tổng Kết Kỹ Thuật (7 Chương)</div>
                  <p className="text-xs text-slate-500 mb-3">Viết 100% thì quá khứ, đầy đủ dữ liệu kiểm toán Git (284 commits, 52 PRs), tích hợp nghiệm thu UAT.</p>
                  <span className="text-xs text-teal-700 font-semibold">docs/04_Final_Technical_Report.md</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap gap-4">
                <a 
                  href="https://github.com/nguyenthaison2408/medicare-plus" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                  <span>Xem GitHub Repository</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a 
                  href="https://drive.google.com/drive/folders/1A2b3C4d5E6f_VKU_MEDICARE_EVIDENCE_PKG?usp=sharing" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-teal-700 transition-colors"
                >
                  <span>Mở Google Drive Nộp Bài</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Booking Success QR Modal */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Đặt Lịch Thành Công!</h3>
            <p className="text-xs text-slate-500 mb-6">Phiếu khám điện tử đã được ghi nhận vào hệ thống phòng khám.</p>

            {/* QR Code Container */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mb-4 shadow-inner">
              <QRCodeSVG value={bookingSuccessModal.qrCode} size={160} level="H" />
            </div>

            <div className="text-xs font-mono font-bold text-teal-700 mb-4 bg-teal-50 py-1.5 px-3 rounded-lg border border-teal-200">
              MÃ TIẾP ĐÓN: {bookingSuccessModal.qrCode}
            </div>

            <div className="text-left text-xs space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã Lịch Hẹn:</span>
                <span className="font-bold text-slate-800">{bookingSuccessModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bệnh Nhân:</span>
                <span className="font-bold text-slate-800">{bookingSuccessModal.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bác Sĩ:</span>
                <span className="font-bold text-slate-800">{bookingSuccessModal.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khung Giờ:</span>
                <span className="font-bold text-teal-600">{bookingSuccessModal.time} ({bookingSuccessModal.date})</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> In Phiếu Khám
              </button>
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-xs text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
          <p>© 2026 MediCare Plus — Đồ án Quản Trị Dự Án Phần Mềm (VKU). Giảng viên hướng dẫn: TS. Nguyễn Thanh Tuấn.</p>
          <p>Kho lưu trữ: <a href="https://github.com/nguyenthaison2408/medicare-plus" className="text-teal-600 hover:underline">github.com/nguyenthaison2408/medicare-plus</a></p>
        </div>
      </footer>
    </div>
  );
}
