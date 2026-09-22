const departments = [
  { id: 'dept-01', name: 'Khoa Nội Tim Mạch', icon: 'Heart', description: 'Chuyên khám & điều trị các bệnh lý tim mạch, huyết áp' },
  { id: 'dept-02', name: 'Khoa Nhi', icon: 'Baby', description: 'Chăm sóc sức khỏe toàn diện và dinh dưỡng cho trẻ nhỏ' },
  { id: 'dept-03', name: 'Khoa Tai Mũi Họng', icon: 'Ear', description: 'Khám và nội soi điều trị viêm họng, xoang, thính lực' },
  { id: 'dept-04', name: 'Khoa Cơ Xương Khớp', icon: 'Activity', description: 'Điều trị thoái hóa khớp, cột sống, chấn thương vận động' },
  { id: 'dept-05', name: 'Khoa Da Liễu', icon: 'Shield', description: 'Khám điều trị các bệnh lý da liễu và thẩm mỹ da liễu' }
];

const doctors = [
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
  },
  {
    id: 'doc-03',
    name: 'BS. CKII. Lê Văn Dũng',
    departmentId: 'dept-03',
    departmentName: 'Khoa Tai Mũi Họng',
    title: 'Bác sĩ Chuyên khoa Cấp cao',
    experience: '20 năm kinh nghiệm',
    rating: 4.85,
    reviewsCount: 110,
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
    availableDays: ['Thứ 3', 'Thứ 5', 'Thứ 7']
  }
];

const initialSlots = [
  { id: 'slot-01', doctorId: 'doc-01', time: '08:00 - 08:30', date: '2026-11-20', isBooked: false, lockedUntil: null },
  { id: 'slot-02', doctorId: 'doc-01', time: '08:30 - 09:00', date: '2026-11-20', isBooked: false, lockedUntil: null },
  { id: 'slot-03', doctorId: 'doc-01', time: '09:00 - 09:30', date: '2026-11-20', isBooked: false, lockedUntil: null },
  { id: 'slot-04', doctorId: 'doc-01', time: '09:30 - 10:00', date: '2026-11-20', isBooked: false, lockedUntil: null },
  { id: 'slot-05', doctorId: 'doc-01', time: '10:00 - 10:30', date: '2026-11-20', isBooked: false, lockedUntil: null },
  { id: 'slot-06', doctorId: 'doc-02', time: '08:00 - 08:30', date: '2026-11-20', isBooked: false, lockedUntil: null },
  { id: 'slot-07', doctorId: 'doc-02', time: '08:30 - 09:00', date: '2026-11-20', isBooked: false, lockedUntil: null },
  { id: 'slot-08', doctorId: 'doc-03', time: '09:00 - 09:30', date: '2026-11-20', isBooked: false, lockedUntil: null }
];

let appointments = [
  {
    id: 'APT-1001',
    qrCode: 'MEDICARE-APT-1001-QR',
    patientName: 'Nguyễn Văn Minh',
    phone: '0905123456',
    email: 'minh.nguyen@example.com',
    doctorId: 'doc-01',
    doctorName: 'BS. CKI. Trần Đình Hoàng',
    department: 'Khoa Nội Tim Mạch',
    date: '2026-11-20',
    time: '08:00 - 08:30',
    symptoms: 'Thường xuyên đau tức ngực khi vận động mạnh',
    status: 'COMPLETED', // CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED
    createdAt: '2026-11-14T08:00:00Z',
    prescription: {
      diagnosis: 'I10 - Tăng huyết áp vô căn độ 1',
      medications: [
        { name: 'Amlodipine 5mg', dosage: '1 viên / ngày (uống buổi sáng)' },
        { name: 'Aspirin 81mg', dosage: '1 viên / ngày (sau ăn)' }
      ],
      notes: 'Hạn chế ăn mặn, kiêng cà phê, tái khám sau 30 ngày.'
    }
  },
  {
    id: 'APT-1002',
    qrCode: 'MEDICARE-APT-1002-QR',
    patientName: 'Lê Bảo Anh',
    phone: '0914987654',
    email: 'baoanh.le@example.com',
    doctorId: 'doc-01',
    doctorName: 'BS. CKI. Trần Đình Hoàng',
    department: 'Khoa Nội Tim Mạch',
    date: '2026-11-20',
    time: '08:30 - 09:00',
    symptoms: 'Chóng mặt, huyết áp đo tại nhà dao động 145/95',
    status: 'CHECKED_IN',
    createdAt: '2026-11-14T09:30:00Z',
    prescription: null
  }
];

module.exports = {
  departments,
  doctors,
  initialSlots,
  appointments
};
