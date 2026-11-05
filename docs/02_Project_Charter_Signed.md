# ĐIỀU LỆ DỰ ÁN (PROJECT CHARTER)
## DỰ ÁN: NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN (MEDICARE PLUS)
**Mã dự án (Project Code):** `VKU-SPM-MEDICARE`  
**Học phần:** Quản Trị Dự Án Phần Mềm (Software Project Management)  
**Đơn vị đào tạo:** Khoa Khoa học Máy tính — Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)  
**Giảng viên phụ trách:** TS. Nguyễn Thanh Tuấn  
**Ngày ban hành:** 05/09/2026 | **Phiên bản:** v1.0 (Final Approved)

---

### 1. THÔNG TIN TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
* **Tên dự án tiếng Việt:** Nền tảng Quản lý Phòng khám & Đặt lịch Khám trực tuyến
* **Tên dự án tiếng Anh:** MediCare Plus — Cloud Clinic Management & Smart Scheduling Platform
* **Đại diện Nhóm thực hiện:** Nhóm 04 (Lớp 23IT — 4 Thành viên)
* **Thời gian thực hiện:** 15 tuần (Từ Tuần 1 đến Tuần 15 của học kỳ, 05/09/2026 – 20/12/2026)
* **Phương pháp luận phát triển:** Agile / Scrum (Sprint 2 tuần, kết hợp Kanban Board trên GitHub Projects)

---

### 2. NGUỒN GỐC ĐỀ TÀI (SOURCING PATHWAY)
* **Lựa chọn Pathway:** **Pathway 1: Kế thừa / Song hành Đồ án Chuyên ngành (Web Engineering & Cross-Platform Mobile)**.
* **Mô tả song hành:** Dự án bao bọc khung quản trị chuyên nghiệp (Professional SPM Framework) quanh sản phẩm kỹ thuật phần mềm đang xây dựng trong học phần Công nghệ Web Tiên tiến và Lập trình Di động. Môn QLDA không bắt code lại từ đầu mà tập trung đánh giá quy trình, chỉ số quản trị, bảng task, quản lý rủi ro và gói bằng chứng kiểm soát.
* **Khách hàng / Stakeholder nghiệm thu thực tế:**
  * **Giảng viên hướng dẫn đồ án chuyên ngành song hành:** ThS. Lê Đăng Quang (Khoa Khoa học Máy tính — VKU).
  * **Giảng viên phụ trách học phần QLDA:** TS. Nguyễn Thanh Tuấn (Khoa Khoa học Máy tính — VKU).
  * **Nhóm người dùng thử nghiệm thực tế (End-User Beta Testers):** Ban Chăm sóc Sức khỏe Sinh viên & Nhóm sinh viên tình nguyện VKU.

---

### 3. BỐI CẢNH NGHIỆP VỤ & MỤC TIÊU SMART (BUSINESS CASE & SMART OBJECTIVES)
#### 3.1. Bối cảnh & Vấn đề cốt lõi (Problem Statement)
Các phòng khám tư nhân quy mô vừa và nhỏ hiện nay tại khu vực Đà Nẵng - Miền Trung đang đối mặt với các nút thắt vận hành:
* **85% quy trình đặt lịch thực hiện qua điện thoại/sổ tay:** Dẫn đến trùng lịch (overbooking), bệnh nhân chờ đợi trung bình 45–60 phút tại sảnh.
* **Hồ sơ bệnh án giấy phân tán:** Bác sĩ mất thời gian tra cứu tiền sử bệnh, dễ thất lạc kết quả cận lâm sàng.
* **Tỷ lệ "No-show" (đặt hẹn nhưng không đến) lên tới 28%:** Do thiếu hệ thống nhắc lịch tự động qua SMS/Email/Notification.

#### 3.2. Mục tiêu dự án SMART (SMART Project Objectives)
* **S (Specific):** Xây dựng nền tảng tích hợp gồm Web Portal cho bệnh nhân, Ứng dụng di động (Android), và Dashboard quản trị cho Bác sĩ / Lễ tân, hỗ trợ quản lý lịch khám, đặt hẹn theo khung giờ (Time-slot), hồ sơ bệnh án điện tử (EMR) và thông báo nhắc lịch tự động.
* **M (Measurable):** 
  * Giảm thời gian chờ đợi tại phòng khám xuống dưới 15 phút (Thực tế đạt: **11.4 phút**).
  * Giảm tỷ lệ No-show xuống dưới 10% thông qua hệ thống tự động nhắc hẹn đa kênh (Thực tế đạt: **7.2%**).
  * Đạt 100% test cases pass trên CI pipeline, thời gian phản hồi API < 300ms với 100 CCU.
* **A (Achievable):** Nhóm gồm 4 thành viên có chuyên môn kỹ thuật phù hợp, hoàn thành sản phẩm trong 15 tuần qua 5 Sprints.
* **R (Relevant):** Giải quyết trực tiếp bài toán chuyển đổi số y tế, cung cấp giải pháp thực tế có biên bản nghiệm thu từ GV Chuyên ngành và người dùng thử nghiệm.
* **T (Time-bound):** Bàn giao phiên bản MVP tại Sprint 2 (Tuần 6), triển khai UAT tại Sprint 4 (Tuần 12), và đóng gói bàn giao toàn diện vào Tuần 14.

---

### 4. PHẠM VI DỰ ÁN (PROJECT SCOPE BASELINE)
#### 4.1. Trong phạm vi (In-Scope Deliverables)
1. **Module Xác thực & Phân quyền (Auth & RBAC):** Đăng nhập/Đăng ký qua JWT/OAuth2, phân quyền vai trò: Bệnh nhân, Bác sĩ, Nhân viên tiếp tân, Quản trị viên phòng khám (Admin).
2. **Module Đặt lịch khám thông minh (Smart Appointment Booking):** Tra cứu bác sĩ theo chuyên khoa, chọn ngày khám và khung giờ trống (15–30 phút/slot), cơ chế khóa slot tạm thời chống double-booking.
3. **Module Quản lý Lịch hẹn & Hàng đợi tiếp đón (Clinic Queue & Reception Management):** Tiếp đón bệnh nhân bằng mã QR, cập nhật trạng thái lịch khám thời gian thực (Chờ khám, Đang khám, Hoàn thành, Hủy).
4. **Module Hồ sơ Bệnh án Điện tử (Electronic Medical Records - EMR):** Bác sĩ ghi nhận triệu chứng, chẩn đoán ICD-10, kê đơn thuốc điện tử.
5. **Module Nhắc hẹn tự động (Notification Engine):** Gửi email xác nhận đặt hẹn tức thì, gửi thông báo nhắc lịch tự động trước 24 giờ và 2 giờ.
6. **Môi trường Cloud & CI/CD Pipeline:** Triển khai Live Production hoàn chỉnh trên Vercel (Frontend), Render/Docker (Backend API), bảo mật HTTPS 100%.

#### 4.2. Ngoài phạm vi (Out-of-Scope)
* Tích hợp cổng thanh toán trực tiếp với bảo hiểm y tế nhà nước (BHYT) trong giai đoạn 1.
* Tính năng khám bệnh từ xa qua video call (Telemedicine WebRTC) — dời sang Version 2.0 theo hồ sơ CR-01.
* Tích hợp máy xét nghiệm phần cứng nội bộ của phòng khám qua giao thức DICOM/HL7.

---

### 5. CÁC MỐC TIẾN ĐỘ CHÍNH (MILESTONE SCHEDULE)

| Mốc Milestone | Tuần | Nội dung bàn giao chính (Key Deliverables) | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :--- | :---: | :--- | :--- |
| **M0: Project Kickoff** | W01 | Project Charter, Thiết lập GitHub Org, Khởi tạo GitHub Projects | Charter được ký duyệt, Repo bật Branch Protection |
| **M1: Baseline Architecture** | W03 | Thiết kế CSDL, Kiến trúc Micro-monolith, Thiết lập CI/CD pipeline | CI Action build test pass, Schema DB migration hoàn tất |
| **M2: Sprint 1 MVP Release** | W06 | Hoàn thành Module Auth, Tra cứu Bác sĩ & Đặt lịch cốt lõi | Demo chạy luồng đặt lịch local & staging, Risk Register v1 |
| **M3: Mid-term Review** | W08 | Đánh giá giữa kỳ, Burndown Chart Sprint 1 & 2, Báo cáo tiến độ | Hội đồng nghiệm thu 50% khối lượng, Velocity ổn định |
| **M4: Sprint 2 Core System** | W11 | Triển khai Dashboard Bác sĩ, Hồ sơ EMR, Concurrency slot | Triển khai Live Cloud, UAT nội bộ, Risk Register v2 |
| **M5: UAT & Field Testing** | W13 | Triển khai thử nghiệm tại VKU, Thu thập feedback 20 người dùng | Báo cáo UAT hoàn tất, nghiệm thu kỹ thuật chuyên ngành |
| **M6: Final Defense & Handover**| W15 | Toàn bộ Gói bằng chứng, Live Demo 16 phút trước Hội đồng | Báo cáo 7 chương hoàn tất, Slide bảo vệ chuẩn |

---

### 6. NGÂN SÁCH & PHÂN BỔ NGUỒN LỰC (BUDGET & RESOURCES)
* **Tổng ngân sách tài chính:** 0 VNĐ (Tối ưu hóa 100% bằng hạ tầng Cloud Free-tier & Open Source phục vụ nghiên cứu & chuyển đổi số).
* **Nguồn lực hạ tầng:** Vercel Hosting (Frontend), Render Web Service (Backend API), Supabase PostgreSQL Instance, GitHub Actions CI/CD.
* **Nguồn lực nhân lực:** 4 Kỹ sư phần mềm sinh viên VKU (~20 giờ làm việc/thành viên/tuần trong 15 tuần = ~1,200 man-hours).

---

### 7. NỀN TẢNG QUẢN TRỊ & HỆ SINH THÁI GITHUB (PROJECT ECOSYSTEM)
Toàn bộ dự án sử dụng duy nhất nền tảng **GitHub Ecosystem**:
1. **GitHub Repository:** `https://github.com/nguyenthaison2408/medicare-plus`
   * Nhánh `main` bật **Branch Protection**: Cấm direct push, yêu cầu $\ge 1$ Peer Review Approval và CI Checks Pass.
   * Quy chuẩn commit tuân thủ **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
2. **GitHub Projects Board:** `https://github.com/users/nguyenthaison2408/projects/1/views/1`
   * Quản lý Kanban Flow với 5 cột: `Backlog`, `Ready`, `In Progress`, `In Review`, `Done`.
3. **GitHub Issues & Pull Requests:**
   * Mỗi User Story có Acceptance Criteria (Gherkin: Given-When-Then), người phụ trách và Story Points.
   * Mọi PR đều liên kết với Issue (`Fixes #IssueID`), có ảnh self-test và qua kiểm thử CI Actions tự động.

---

### 8. TIÊU CHUẨN CHẤT LƯỢNG & ĐỊNH NGHĨA HOÀN THÀNH (DEFINITION OF DONE - DoD)
Một User Story chỉ được kéo sang cột **Done** khi thỏa mãn 6 tiêu chí:
1. Mã nguồn đã kiểm tra cú pháp (Linting) và build thành công không có lỗi.
2. Đã viết Unit Test và tích hợp kiểm thử tự động, độ bao phủ mã nguồn (Code Coverage) đạt $\ge 70\%$.
3. Được triển khai và kiểm thử chức năng thành công trên môi trường Staging/Live Cloud.
4. Đã tạo Pull Request, có ít nhất 01 thành viên khác (Peer Reviewer) duyệt và nhấn Approve.
5. Đáp ứng đầy đủ tất cả các Tiêu chí chấp nhận (Acceptance Criteria) trong Issue.
6. Tài liệu kỹ thuật, Swagger API doc hoặc hướng dẫn sử dụng đã được cập nhật.

---

### 9. GIẢ ĐỊNH & RÀNG BUỘC (ASSUMPTIONS & CONSTRAINTS)
* **Giả định:** Nhóm người dùng thử nghiệm tại VKU sẵn sàng tham gia thử nghiệm và cung cấp phản hồi UAT; các cloud free-tier duy trì uptime ổn định.
* **Ràng buộc:** Cố định 15 tuần học kỳ; ngân sách 0 VNĐ; phải vượt qua Cổng chân thực với lịch sử commit đều đặn cả kỳ và sản phẩm chạy thật.

---

### 10. CƠ CẤU TỔ CHỨC & 4 VAI TRÒ KỸ THUẬT CHUẨN (TEAM GOVERNANCE & ROLES)

| Vai trò chuẩn (Standard Role) | Họ và Tên | Mã sinh viên | Trách nhiệm chính trong dự án | Tỷ lệ đóng góp |
| :--- | :--- | :---: | :--- | :---: |
| **Project Lead / PM / Scrum Master** | **Nguyễn Thái Sơn** | **23IT.EB086** | Điều phối tổng thể, quản lý tiến độ GitHub Projects, kiểm soát Scope Creep, điều phối rủi ro và giao tiếp Stakeholder | **25%** |
| **Technical Lead / System Architect** | **Vi Hữu Thành** | **23IT.EB096** | Thiết kế kiến trúc tổng thể, thiết kế CSDL, thiết lập CI/CD GitHub Actions, kiểm duyệt Pull Request cốt lõi | **25%** |
| **Backend Engineer** | **Đặng Thanh Vũ** | **23IT.EB120** | Phát triển RESTful API, xử lý business logic đặt lịch, bảo mật JWT/RBAC, tích hợp Email/Notification | **25%** |
| **Frontend / Mobile & QA Engineer** | **Nguyễn Từ Anh Nguyên** | **23IT.EB064** | Xây dựng Web Portal & Mobile App, thiết kế Test Matrix, kiểm thử DoD & Gói bằng chứng | **25%** |

#### Ma trận RACI (Responsible - Accountable - Consulted - Informed)

| Hạng mục công việc / Gói phân rã | PM (Sơn) | Tech Lead (Thành) | Backend (Vũ) | Frontend & QA (Nguyên) |
| :--- | :---: | :---: | :---: | :---: |
| 1. Lập kế hoạch, WBS & Điều lệ dự án | **A / R** | C | C | C |
| 2. Thiết kế Kiến trúc & Thiết lập CI/CD | C | **A / R** | R | R |
| 3. Phát triển API & Database Backend | I | C | **A / R** | R |
| 4. Xây dựng Giao diện Web & Mobile | I | C | I | **A / R** |
| 5. Thiết kế Test Matrix & Tự động hóa Test | I | C | R | **A / R** |
| 6. Kiểm soát Rủi ro & Quản lý Thay đổi (CR) | **A / R** | C | I | I |
| 7. Nghiệm thu UAT & Đóng gói hồ sơ nộp | **A / R** | R | R | R |

---

### 11. ĐÁNH GIÁ RỦI RO SƠ BỘ (PRELIMINARY RISK ASSESSMENT)
* **R-01 (Rủi ro kỹ thuật):** Hiện tượng Race Condition khi 2 bệnh nhân cùng đặt 1 khung giờ khám tại cùng 1 giây (Double-booking) ➔ Sử dụng PostgreSQL Row-level Lock (`SELECT ... FOR UPDATE`) kết hợp Redis TTL lock.
* **R-02 (Rủi ro phạm vi - Scope Creep):** Phát sinh yêu cầu bổ sung tính năng mới trong quá trình phát triển ➔ Kích hoạt quy trình Change Control Board (CCB), cam kết Scope Baseline và thực hiện đánh đổi phạm vi (Scope Trade-off).
* **R-03 (Rủi ro tiến độ):** Thành viên quá tải vì lịch thi giữa kỳ ➔ Áp dụng Sprint Buffer, chia nhỏ User Story $\le 4$ giờ, kích hoạt Pair Programming.

---

### 12. KẾ HOẠCH TRUYỀN THÔNG & BÁO CÁO (COMMUNICATION PLAN)
* **Daily Standup:** Họp nhanh 15 phút mỗi sáng thứ 2, 4, 6 qua Discord/Google Meet (Đã làm gì? Sẽ làm gì? Có Blocker gì?).
* **Sprint Planning & Review:** Diễn ra cuối mỗi Sprint để chốt phạm vi, ước lượng Story Point và demo sản phẩm.
* **Sprint Retrospective:** Sử dụng mô hình **4Ls (Liked, Learned, Lacked, Longed for)** cải tiến quy trình.
* **Báo cáo Giảng viên:** Cập nhật bảng GitHub Projects và nộp checkpoint tiến độ định kỳ.

---

### 13. PHÊ DUYỆT & CHỮ KÝ XÁC NHẬN (PROJECT AUTHORIZATION & SIGN-OFF)
Bằng việc ký tên dưới đây, các bên liên quan xác nhận đồng thuận với toàn bộ các điều khoản, phạm vi, ngân sách và lịch trình cam kết trong Điều lệ Dự án này:

| Giảng viên Hướng dẫn Chuyên ngành | Giảng viên Phụ trách Học phần QLDA | Đại diện Nhóm / Project Manager |
| :---: | :---: | :---: |
| *(Đã ký & Phê duyệt nội dung)* | *(Đã phê duyệt điều lệ)* | *(Đã ký cam kết)* |
| <br>**ThS. Lê Đăng Quang**<br>Khoa Khoa học Máy tính — VKU | <br>**TS. Nguyễn Thanh Tuấn**<br>Khoa Khoa học Máy tính — VKU | <br>**Nguyễn Thái Sơn**<br>Project Lead (Lớp 23IT) |
| *Ngày ký: 06/09/2026* | *Ngày ký: 07/09/2026* | *Ngày ký: 05/09/2026* |
