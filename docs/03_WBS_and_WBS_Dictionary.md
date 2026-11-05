# CƠ CẤU PHÂN RÃ CÔNG VIỆC (WBS) & TỪ ĐIỂN WBS (WBS DICTIONARY)
## DỰ ÁN: NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN (MEDICARE PLUS)
**Mã dự án:** `VKU-SPM-MEDICARE` | **Học phần:** Quản Trị Dự Án Phần Mềm — VKU  
**Đội ngũ thực hiện:** Nhóm 04 (Nguyễn Thái Sơn, Vi Hữu Thành, Đặng Thanh Vũ, Nguyễn Từ Anh Nguyên)  
**Phiên bản:** v1.0 | **Ngày ban hành:** 12/09/2026

---

### PHẦN 1: CÂY CƠ CẤU PHÂN RÃ CÔNG VIỆC (WBS HIERARCHY — 100% RULE)

> [!NOTE]
> Cấu trúc WBS dưới đây tuân thủ nghiêm ngặt **Nguyên tắc 100% (The 100% Rule)** của chuẩn PMBOK: Tổng hợp tất cả các gói công việc con ở cấp dưới bao quát 100% phạm vi công việc của cấp trên mà không thừa, không thiếu và không trùng lặp.

```text
1.0 DỰ ÁN NỀN TẢNG QUẢN LÝ PHÒNG KHÁM MEDICARE PLUS
├── 1.1 Khởi tạo & Quản trị Dự án (Project Management & Governance)
│   ├── 1.1.1 Xây dựng Điều lệ dự án (Project Charter) & Ma trận RACI
│   ├── 1.1.2 Thiết lập Hệ sinh thái GitHub (Repo, Board, Branch Protection)
│   ├── 1.1.3 Lập kế hoạch quản trị rủi ro & Ma trận truyền thông
│   └── 1.1.4 Điều phối Sprint, Tổ chức Daily Scrum & Họp Retrospective
├── 1.2 Phân tích Nghiệp vụ & Thiết kế Hệ thống (Analysis & Architecture)
│   ├── 1.2.1 Khảo sát nghiệp vụ phòng khám & Lập Đặc tả yêu cầu (SRS)
│   ├── 1.2.2 Thiết kế Kiến trúc hệ thống tổng thể & Sơ đồ CSDL (ERD/Schema)
│   ├── 1.2.3 Thiết kế Wireframe & UI/UX Design System (Figma)
│   └── 1.2.4 Thiết lập Hạ tầng Cloud & CI/CD Pipeline (Docker, GitHub Actions)
├── 1.3 Phát triển Nền tảng Backend & API (Backend Services & DB Engine)
│   ├── 1.3.1 Module Xác thực, Phân quyền người dùng & Bảo mật JWT/RBAC
│   ├── 1.3.2 Module Quản lý Danh mục Bác sĩ, Chuyên khoa & Ca làm việc
│   ├── 1.3.3 Module Lõi Đặt lịch khám & Xử lý Khóa Slot (Locking Engine)
│   ├── 1.3.4 Module Hồ sơ Bệnh án Điện tử (EMR) & Đơn thuốc
│   └── 1.3.5 Module Tự động hóa Thông báo & Nhắc hẹn (Email/SMS Notification)
├── 1.4 Phát triển Ứng dụng Frontend & Mobile (Patient Portal & Staff Dashboard)
│   ├── 1.4.1 Cổng thông tin Bệnh nhân (Web Portal: Tìm kiếm, Chọn slot, Đặt hẹn)
│   ├── 1.4.2 Dashboard Tiếp tân & Tiếp đón Bệnh nhân bằng Mã QR
│   ├── 1.4.3 Dashboard Bác sĩ Thăm khám & Kê đơn thuốc EMR
│   └── 1.4.4 Tích hợp API Client, Quản lý State & Xử lý Ngoại lệ mạng
├── 1.5 Đảm bảo Chất lượng & Kiểm thử (Quality Assurance & Testing)
│   ├── 1.5.1 Thiết kế Ma trận Kiểm thử (Test Matrix) & Kế hoạch Test (Test Plan)
│   ├── 1.5.2 Viết Bộ kiểm thử Tự động Unit Test & Integration Test (API & Core)
│   ├── 1.5.3 Kiểm thử Hiệu năng & Tải đồng thời (Load Testing 100 CCU Concurrency)
│   └── 1.5.4 Kiểm thử Bảo mật phân quyền & Kiểm toán lỗ hổng (Security & RBAC Audit)
└── 1.6 Nghiệm thu, Chuyển giao & Đóng dự án (UAT, Deployment & Closure)
    ├── 1.6.1 Triển khai Hệ thống lên Môi trường Live Production (Cloudflare/Vercel/Render)
    ├── 1.6.2 Kiểm thử Chấp nhận Người dùng (UAT) & Nghiệm thu Chuyên ngành Song hành
    ├── 1.6.3 Biên soạn Hồ sơ Kỹ thuật, Cẩm nang sử dụng & Gói bằng chứng kiểm toán
    └── 1.6.4 Tổ chức Báo cáo Tổng kết & Bảo vệ Đồ án trước Hội đồng Chuyên môn
```

---

### PHẦN 2: TỪ ĐIỂN WBS CHI TIẾT (WBS DICTIONARY)

Tất cả các Gói công việc (Work Package - WP) ở mức phân rã thấp nhất đều có thời lượng thực hiện từ 1 đến 2 tuần (hoặc tương đương 16–35 giờ làm việc), có chỉ tiêu bàn giao và tiêu chí hoàn thành (DoD) rõ ràng:

#### Gói công việc 1.1.2: Thiết lập Hệ sinh thái GitHub
* **Mã WBS:** `1.1.2` | **Gói cha:** `1.1 Khởi tạo & Quản trị Dự án`
* **Người phụ trách (Owner):** Nguyễn Thái Sơn (PM) & Vi Hữu Thành (Tech Lead)
* **Thời lượng ước lượng:** 1 tuần (18 giờ làm việc) | **Story Points:** 5 SP
* **Mô tả công việc:** Khởi tạo Repository `medicare-plus`, cấu hình quy tắc Branch Protection cho nhánh `main` (yêu cầu review bắt buộc và CI pass). Khởi tạo GitHub Projects với 5 cột chuẩn (Backlog, Ready, In Progress, In Review, Done), thiết lập nhãn (labels), mẫu Issue Template và Pull Request Template.
* **Đầu vào (Inputs):** Điều lệ dự án đã ký duyệt, Danh sách 4 thành viên nhóm.
* **Đầu ra bàn giao (Deliverables):** Repo công khai trên GitHub, GitHub Projects Board hoạt động, file `.github/pull_request_template.md` và `.github/ISSUE_TEMPLATE/`.
* **Tiêu chí hoàn thành (DoD):** Không thành viên nào có thể push trực tiếp vào `main`; ít nhất 1 issue mẫu và 1 PR mẫu được tạo thử nghiệm thành công.
* **Quan hệ phụ thuộc (Dependencies):** Sau gói 1.1.1.

---

#### Gói công việc 1.2.2: Thiết kế Kiến trúc Hệ thống & Sơ đồ CSDL (ERD/Schema)
* **Mã WBS:** `1.2.2` | **Gói cha:** `1.2 Phân tích Nghiệp vụ & Thiết kế Hệ thống`
* **Người phụ trách (Owner):** Vi Hữu Thành (Tech Lead) & Đặng Thanh Vũ (Backend)
* **Thời lượng ước lượng:** 1.5 tuần (26 giờ làm việc) | **Story Points:** 8 SP
* **Mô tả công việc:** Lập sơ đồ kiến trúc hệ thống; mô hình hóa thực thể CSDL (ERD) gồm các bảng: `users`, `roles`, `doctors`, `departments`, `schedules`, `time_slots`, `appointments`, `medical_records`, `prescriptions`. Tạo script migration ban đầu trên PostgreSQL.
* **Đầu vào (Inputs):** Bản đặc tả yêu cầu SRS từ gói 1.2.1.
* **Đầu ra bàn giao (Deliverables):** File tài liệu kiến trúc kỹ thuật kèm sơ đồ ERD trực quan, file migration SQL chuẩn hóa.
* **Tiêu chí hoàn thành (DoD):** Sơ đồ quan hệ đạt chuẩn 3NF, script chạy tạo bảng thành công trên local và PostgreSQL Supabase không có lỗi khóa ngoại.
* **Quan hệ phụ thuộc (Dependencies):** Sau gói 1.2.1.

---

#### Gói công việc 1.2.4: Thiết lập Hạ tầng Cloud & CI/CD Pipeline
* **Mã WBS:** `1.2.4` | **Gói cha:** `1.2 Phân tích Nghiệp vụ & Thiết kế Hệ thống`
* **Người phụ trách (Owner):** Vi Hữu Thành (Tech Lead)
* **Thời lượng ước lượng:** 1 tuần (16 giờ làm việc) | **Story Points:** 5 SP
* **Mô tả công việc:** Tạo Dockerfile cho backend API và cấu hình workflow GitHub Actions (`.github/workflows/ci.yml`). Tự động chạy Linting, Typecheck và Unit Test mỗi khi có PR vào nhánh `main`/`develop`. Liên kết tự động deploy lên Vercel (Frontend) và Render (Backend Web Service).
* **Đầu vào (Inputs):** Mã nguồn khung ban đầu, tài khoản cloud staging.
* **Đầu ra bàn giao (Deliverables):** File cấu hình CI/CD hoàn chỉnh, badge build passing trên README.md của repo.
* **Tiêu chí hoàn thành (DoD):** Khi mở một Pull Request thử nghiệm, GitHub Actions tự động kích hoạt và trả về kết quả `Check passed` màu xanh lá cây; merge PR tự động kích hoạt deploy bản build mới lên URL staging.
* **Quan hệ phụ thuộc (Dependencies):** Song hành với 1.1.2 và 1.2.2.

---

#### Gói công việc 1.3.1: Module Xác thực, Phân quyền Người dùng (Auth & RBAC)
* **Mã WBS:** `1.3.1` | **Gói cha:** `1.3 Phát triển Nền tảng Backend & API`
* **Người phụ trách (Owner):** Đặng Thanh Vũ (Backend Engineer)
* **Thời lượng ước lượng:** 1.5 tuần (24 giờ làm việc) | **Story Points:** 8 SP
* **Mô tả công việc:** Cài đặt các API đăng ký, đăng nhập tài khoản bệnh nhân, bác sĩ và nhân viên lễ tân; cấp phát JWT Access Token và Refresh Token; mã hóa mật khẩu bằng bcrypt; xây dựng middleware kiểm tra phân quyền RBAC (Role-Based Access Control) trên các route nhạy cảm.
* **Đầu vào (Inputs):** Schema CSDL bảng `users` và `roles` từ gói 1.2.2.
* **Đầu ra bàn giao (Deliverables):** Các endpoints `/api/v1/auth/register`, `/login`, `/refresh`, `/me`; Swagger docs mô tả chi tiết header `Authorization: Bearer <token>`.
* **Tiêu chí hoàn thành (DoD):** Có ít nhất 8 Unit Tests kiểm tra các trường hợp đăng nhập đúng, sai mật khẩu, token hết hạn, và truy cập trái quyền (HTTP 403 Forbidden); test coverage đạt $\ge 80\%$.
* **Quan hệ phụ thuộc (Dependencies):** Sau gói 1.2.2 và 1.2.4.

---

#### Gói công việc 1.3.3: Module Lõi Đặt lịch Khám & Xử lý Khóa Slot (Locking Engine)
* **Mã WBS:** `1.3.3` | **Gói cha:** `1.3 Phát triển Nền tảng Backend & API`
* **Người phụ trách (Owner):** Đặng Thanh Vũ (Backend) & Vi Hữu Thành (Tech Lead)
* **Thời lượng ước lượng:** 2 tuần (35 giờ làm việc) | **Story Points:** 13 SP
* **Mô tả công việc:** Xây dựng logic sinh động các khung giờ khám (15–30 phút/slot) theo ca làm việc của bác sĩ; thiết kế thuật toán đặt lịch an toàn với cơ chế khóa tạm thời (Pessimistic Locking / PostgreSQL `SELECT FOR UPDATE` hoặc Redis lock trong 5 phút) để giải quyết triệt để rủi ro Race Condition khi nhiều bệnh nhân cùng chọn một slot khám.
* **Đầu vào (Inputs):** Schema bảng `time_slots` và `appointments`; API Auth từ 1.3.1.
* **Đầu ra bàn giao (Deliverables):** API `/api/v1/appointments/book`, `/slots`, logic giải phóng slot tự động khi hết hạn tạm giữ.
* **Tiêu chí hoàn thành (DoD):** Vượt qua kịch bản kiểm thử tải đồng thời (Concurrent Request Test) với 50 request đồng thời tranh chấp 1 slot: đảm bảo duy nhất 1 giao dịch thành công (HTTP 201), 49 giao dịch còn lại nhận mã lỗi xung đột (HTTP 409 Conflict).
* **Quan hệ phụ thuộc (Dependencies):** Sau gói 1.3.1 và 1.3.2.

---

#### Gói công việc 1.4.1: Cổng thông tin Bệnh nhân (Web Patient Portal)
* **Mã WBS:** `1.4.1` | **Gói cha:** `1.4 Phát triển Ứng dụng Frontend & Mobile`
* **Người phụ trách (Owner):** Nguyễn Từ Anh Nguyên (Frontend Engineer)
* **Thời lượng ước lượng:** 2 tuần (32 giờ làm việc) | **Story Points:** 13 SP
* **Mô tả công việc:** Xây dựng giao diện Web Responsive bằng React/Next.js và Tailwind CSS cho phép bệnh nhân: Tra cứu danh sách bác sĩ theo chuyên khoa, xem thông tin và đánh giá, chọn ngày khám trên lịch trực quan, chọn khung giờ còn trống và điền thông tin triệu chứng để đặt hẹn; xem trang lịch sử và phiếu khám điện tử có mã QR.
* **Đầu vào (Inputs):** Bản thiết kế Figma từ gói 1.2.3, Swagger API backend từ gói 1.3.2 và 1.3.3.
* **Đầu ra bàn giao (Deliverables):** Mã nguồn frontend trên nhánh `feature/patient-portal`, giao diện hiển thị mượt mà trên cả máy tính bàn và điện thoại di động.
* **Tiêu chí hoàn thành (DoD):** Tương thích 100% trên Chrome, Safari, Edge; điểm Google Lighthouse Performance $\ge 85$; kết nối API đặt lịch thành công với trạng thái cập nhật tức thì.
* **Quan hệ phụ thuộc (Dependencies):** Song hành và phụ thuộc vào API gói 1.3.3.

---

#### Gói công việc 1.4.2: Dashboard Tiếp đón Bệnh nhân bằng Mã QR
* **Mã WBS:** `1.4.2` | **Gói cha:** `1.4 Phát triển Ứng dụng Frontend & Mobile`
* **Người phụ trách (Owner):** Nguyễn Từ Anh Nguyên (Frontend) & Đặng Thanh Vũ (Backend)
* **Thời lượng ước lượng:** 2 tuần (30 giờ làm việc) | **Story Points:** 10 SP
* **Mô tả công việc:** Phát triển giao diện quản trị cho Lễ tân: Màn hình quét/nhập mã QR check-in tiếp đón; bảng hàng đợi khám bệnh trực quan (Chờ khám, Đang khám, Đã khám xong); cập nhật trạng thái lịch hẹn sang `CHECKED_IN` thời gian thực trong dưới 3 giây.
* **Đầu vào (Inputs):** API Check-in QR từ 1.3.3, Thiết kế giao diện Dashboard từ 1.2.3.
* **Đầu ra bàn giao (Deliverables):** Giao diện quản trị tiếp đón tích hợp quét mã QR và tìm kiếm bệnh nhân nhanh.
* **Tiêu chí hoàn thành (DoD):** Tiếp tân thực hiện check-in cho bệnh nhân bằng mã QR thành công trong vòng < 3 giây.
* **Quan hệ phụ thuộc (Dependencies):** Sau gói 1.3.4 và 1.4.1.

---

#### Gói công việc 1.5.3: Kiểm thử Hiệu năng & Tải đồng thời (Load Testing)
* **Mã WBS:** `1.5.3` | **Gói cha:** `1.5 Đảm bảo Chất lượng & Kiểm thử`
* **Người phụ trách (Owner):** Nguyễn Từ Anh Nguyên (QA Engineer)
* **Thời lượng ước lượng:** 1 tuần (18 giờ làm việc) | **Story Points:** 5 SP
* **Mô tả công việc:** Sử dụng công cụ k6 / Apache JMeter viết kịch bản giả lập 100 người dùng đồng thời (100 CCU) truy cập tra cứu lịch bác sĩ và 50 người dùng gửi request đặt hẹn trong cùng 1 giây để kiểm tra độ trễ (Latency) và tỷ lệ lỗi (Error Rate) của backend API.
* **Đầu vào (Inputs):** Môi trường API Staging từ gói 1.3.3 và 1.6.1.
* **Đầu ra bàn giao (Deliverables):** Kịch bản test script `load-test.js`, báo cáo hiệu năng dạng biểu đồ HTML xuất từ k6.
* **Tiêu chí hoàn thành (DoD):** $95\%$ số request có thời gian phản hồi (p95 latency) $< 400\text{ms}$; tỷ lệ lỗi HTTP 5xx bằng $0.0\%$; không xảy ra hiện tượng duplicate booking trong CSDL.
* **Quan hệ phụ thuộc (Dependencies):** Sau gói 1.3.3 và 1.5.2.

---

#### Gói công việc 1.6.2: Kiểm thử Chấp nhận Người dùng (UAT) & Nghiệm thu Chuyên ngành Song hành
* **Mã WBS:** `1.6.2` | **Gói cha:** `1.6 Nghiệm thu, Chuyển giao & Đóng dự án`
* **Người phụ trách (Owner):** Nguyễn Thái Sơn (PM) & Nguyễn Từ Anh Nguyên (QA)
* **Thời lượng ước lượng:** 1.5 tuần (20 giờ làm việc) | **Story Points:** 5 SP
* **Mô tả công việc:** Triển khai phiên bản Live Production trên Cloud; tổ chức phiên thử nghiệm người dùng (UAT Beta Testing) với nhóm 20 sinh viên và cán bộ y tế VKU; demo nghiệm thu kỹ thuật và chức năng với Giảng viên hướng dẫn đồ án chuyên ngành song hành ThS. Lê Đăng Quang; tổng hợp kết quả phản hồi người dùng và ma trận kiểm thử UAT trực tiếp vào Chương 7 Báo cáo tổng kết kỹ thuật.
* **Đầu vào (Inputs):** Hệ thống chạy thực tế trên Cloud (1.6.1), Ma trận kịch bản kiểm thử UAT.
* **Đầu ra bàn giao (Deliverables):** Ma trận kết quả chạy UAT (UAT Test Execution Matrix) và bảng đánh giá độ hài lòng người dùng (tích hợp trong Báo cáo tổng kết kỹ thuật).
* **Tiêu chí hoàn thành (DoD):** $100\%$ các ca kiểm thử chính đạt chuẩn nghiệm thu; Giảng viên chuyên ngành xác nhận hệ thống hoàn thành mục tiêu kỹ thuật.
* **Quan hệ phụ thuộc (Dependencies):** Sau gói 1.6.1 và 1.4.2.
