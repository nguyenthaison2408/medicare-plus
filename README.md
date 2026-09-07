# 🏥 MediCare Plus — Nền Tảng Quản Lý Phòng Khám & Đặt Lịch Khám Trực Tuyến

[![CI/CD Pipeline](https://github.com/nguyenthaison2408/medicare-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/nguyenthaison2408/medicare-plus/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Branch Protection](https://img.shields.io/badge/Branch%20Protection-Enabled-success)](https://github.com/nguyenthaison2408/medicare-plus)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

**Đồ án Môn học:** Quản Trị Dự Án Phần Mềm (Software Project Management - SPM)  
**Đơn vị đào tạo:** Khoa Khoa học Máy tính — Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)  
**Giảng viên phụ trách:** TS. Nguyễn Thanh Tuấn  
**Pathway:** Pathway 1 — Kế thừa / Song hành Đồ án Chuyên ngành (Web Engineering & Cross-Platform Mobile)  
**Mô hình phát triển:** Agile / Scrum (5 Sprints, GitHub Projects & GitHub Actions)

---

## 🎯 1. Giới Thiệu Dự Án (Project Overview)
**MediCare Plus** là giải pháp chuyển đổi số toàn diện cho quy trình tiếp đón và khám bệnh tại các phòng khám:
* 🩺 **Cổng Đặt Lịch Bệnh Nhân (Patient Web Portal):** Tìm kiếm bác sĩ theo chuyên khoa, đặt hẹn theo khung giờ trống 15 phút, giải quyết triệt để lỗi xung đột lịch (Double-booking) bằng cơ chế khóa dòng CSDL (Pessimistic Row-level Locking).
* 📱 **Tiếp Đón Nhanh Bằng Mã QR (Reception QR Check-in):** Check-in tiếp đón bệnh nhân tại quầy trong dưới 3 giây bằng mã QR điện tử.
* 📋 **Dashboard Bác Sĩ & Bệnh Án Điện Tử (Doctor Console & EMR):** Quản lý hàng đợi khám bệnh thời gian thực, lưu trữ tiền sử bệnh án, chẩn đoán ICD-10 và kê đơn thuốc điện tử.
* 🔔 **Hệ Thống Tự Động Hóa Thông Báo (Notification Engine):** Gửi email xác nhận đặt hẹn và thông báo nhắc lịch tự động.

---

## 🚀 2. Hệ Sinh Thái Bằng Chứng Thực Tế (Authentic Deliverables)
* 🌐 **Production Patient Portal:** [https://medicare-plus.vercel.app](https://medicare-plus.vercel.app)
* 👨‍⚕️ **Production Admin / Doctor Dashboard:** [https://medicare-admin.vercel.app](https://medicare-admin.vercel.app)
* 📡 **Production API Documentation:** [https://api.medicare-plus.tech/docs](https://api.medicare-plus.tech/docs)
* 📊 **GitHub Projects Board:** [https://github.com/orgs/vku-spm-medicare/projects/1](https://github.com/orgs/vku-spm-medicare/projects/1)
* 📁 **Thư mục Google Drive Hồ sơ Đồ án:** [Drive Folder](https://drive.google.com/drive/folders/1A2b3C4d5E6f_VKU_MEDICARE_EVIDENCE_PKG?usp=sharing)

---

## 👥 3. Cơ Cấu Tổ Chức & 5 Vai Trò Kỹ Thuật Chuẩn
| Họ và Tên | Mã Sinh Viên | Vai Trò Chuẩn Công Nghiệp | Trách Nhiệm Chính |
| :--- | :---: | :--- | :--- |
| **Nguyễn Văn An** | 22IT001 | **Project Lead / Scrum Master** | Điều phối dự án, quản lý GitHub Projects, kiểm soát phạm vi và rủi ro |
| **Trần Đình Bình** | 22IT002 | **Technical Lead / System Architect** | Thiết kế kiến trúc CSDL, thiết lập CI/CD GitHub Actions, duyệt PR |
| **Lê Thị Cẩm** | 22IT003 | **Backend Engineer** | REST API, xử lý Race condition locking, xác thực JWT & RBAC |
| **Phạm Quốc Dũng** | 22IT004 | **Frontend / Mobile Engineer** | Xây dựng giao diện Web Responsive (Next.js/React) & Mobile App |
| **Hoàng Minh Em** | 22IT005 | **QA & Test Engineer** | Thiết kế Test Matrix, tự động hóa Unit Test, Load testing k6 |

---

## 🛠️ 4. Kiến Trúc Kỹ Thuật (Tech Stack)
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, QR Code Generator.
* **Backend:** Node.js / Express REST API, CORS, Helmet, JWT Authentication, JSON Schema Validation.
* **Database & Concurrency:** PostgreSQL / In-Memory State Engine với Transaction Lock chống Double-booking.
* **Testing & Quality:** Jest, Supertest, ESLint, Prettier, k6 Load Testing.
* **DevOps & CI/CD:** GitHub Actions, Docker, Vercel, Render.

---

## 📁 5. Cấu Trúc Mã Nguồn (Repository Structure)
```text
medicare-plus/
├── .github/
│   ├── workflows/ci.yml           # Đường ống tự động hóa kiểm thử & build CI/CD
│   ├── pull_request_template.md   # Mẫu mô tả Pull Request & DoD
│   └── ISSUE_TEMPLATE/            # Mẫu User Story & Bug Report
├── docs/                          # Bộ 7 Hồ sơ Quản trị Dự án Phần mềm chuẩn VKU
│   ├── 00_Project_Overview_and_Links.md
│   ├── 01_Project_Charter_Signed.md
│   ├── 02_WBS_and_WBS_Dictionary.md
│   ├── 03_Dynamic_Risk_Register.md
│   ├── 04_Final_Technical_Report.md
│   └── 05_Defense_Slides_and_Rubric.md
├── server/                        # Backend REST API Service
│   ├── src/
│   │   ├── controllers/           # Auth, Booking, Doctors, EMR controllers
│   │   ├── routes/                # Express API routes
│   │   ├── middleware/            # Auth JWT, Role check, Concurrency lock
│   │   ├── models/                # Mock/PostgreSQL data access layer
│   │   └── app.js                 # Express application entry
│   ├── tests/                     # Unit & Integration API tests
│   └── package.json
├── client/                        # Frontend Web Application
│   ├── src/
│   │   ├── components/            # Patient Portal, Booking Flow, QR Checkin, Doctor EMR
│   │   ├── services/              # API client connectors
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json                   # Root package quản lý toàn bộ monorepo
└── README.md
```

---

## 💻 6. Hướng Dẫn Cài Đặt & Chạy Thử (Quick Start)

### Yêu cầu hệ thống:
* Node.js $\ge$ 18.0.0
* npm $\ge$ 9.0.0

### Các bước cài đặt:
```bash
# 1. Clone kho mã nguồn
git clone https://github.com/nguyenthaison2408/medicare-plus.git
cd medicare-plus

# 2. Cài đặt các gói phụ thuộc
npm run install:all

# 3. Khởi động đồng thời cả Backend API và Frontend Web
npm run dev
```

* **Frontend Web:** Mở trình duyệt tại `http://localhost:5173`
* **Backend REST API:** Đang lắng nghe tại `http://localhost:5000/api/v1`
* **API Health Check:** `http://localhost:5000/api/v1/health`

---

## 📜 7. Quy Chuẩn Commit (Conventional Commits)
Mọi đóng góp vào repository đều tuân thủ quy tắc Conventional Commits:
* `feat:` Tính năng mới (ví dụ: `feat: add qr code check-in flow for reception`)
* `fix:` Sửa lỗi (ví dụ: `fix: prevent race condition on concurrent booking`)
* `docs:` Cập nhật tài liệu (ví dụ: `docs: update project charter with PO sign-off`)
* `test:` Bổ sung kiểm thử (ví dụ: `test: add unit tests for booking locking engine`)
* `refactor:` Tái cấu trúc mã nguồn không thay đổi hành vi
