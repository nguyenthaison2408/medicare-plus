# BÁO CÁO TỔNG KẾT KỸ THUẬT DỰ ÁN (FINAL TECHNICAL REPORT)
## DỰ ÁN: NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN (MEDICARE PLUS)
**Học phần:** Quản Trị Dự Án Phần Mềm (Software Project Management)  
**Đơn vị đào tạo:** Khoa Khoa học Máy tính — Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)  
**Giảng viên phụ trách:** TS. Nguyễn Thanh Tuấn  
**Lớp học phần:** Quản trị dự án phần mềm  
**Nhóm thực hiện:** Nhóm 04 (4 Thành viên — Lớp 23IT)  
**Thời gian thực hiện:** Tháng 09/2026 — Tháng 12/2026 (15 tuần)  
**Mã dự án:** `VKU-SPM-MEDICARE` | **Phiên bản:** v1.0 (Audit-Ready Final Report)

---

> [!IMPORTANT]
> **QUY TẮC VĂN PHONG KIỂM TOÁN LỊCH SỬ (PAST TENSE):**  
> Toàn bộ nội dung báo cáo này được biên soạn 100% ở **THÌ QUÁ KHỨ (PAST TENSE)**, phản ánh trung thực toàn bộ lịch sử thực thi, số liệu kiểm toán Git, chỉ số vận tốc Sprint và các sự kiện quản lý dự án đã diễn ra trong suốt 15 tuần học kỳ.

---

## CHƯƠNG 1: TỔNG QUAN DỰ ÁN & BỐI CẢNH NGHIỆP VỤ (EXECUTIVE SUMMARY & BUSINESS CASE)

### 1.1. Bối cảnh thực tế & Bài toán vận hành cốt lõi
Trong đợt khảo sát thực tế vào đầu tháng 09/2026 tại các cơ sở y tế tư nhân quy mô vừa và nhỏ tại Đà Nẵng, nhóm đã ghi nhận nhiều bất cập vận hành:
* Hơn 80% quy trình đặt lịch khám vẫn thực hiện qua điện thoại hoặc ghi sổ tay thủ công, dẫn đến tình trạng nhân viên lễ tân ghi nhầm thông tin và trùng lịch khám (overbooking).
* Thời gian chờ đợi trung bình của bệnh nhân từ lúc đến sảnh đến khi được bác sĩ thăm khám lên tới 52 phút vào khung giờ cao điểm.
* Tỷ lệ bệnh nhân đặt lịch nhưng không đến khám (No-show rate) đạt mức 26.5%, gây lãng phí nghiêm trọng nguồn lực bác sĩ và phòng khám.
* Bệnh án giấy phân tán khiến việc tra cứu tiền sử bệnh của bác sĩ gặp nhiều khó khăn.

### 1.2. Giải pháp phần mềm đề xuất & Sourcing Pathway
Nhóm đã lựa chọn **Pathway 1: Kế thừa / Song hành Đồ án Chuyên ngành**, bao bọc khung quản trị dự án chuyên nghiệp theo chuẩn PMBOK và Agile/Scrum quanh nền tảng phần mềm mang tên **MediCare Plus**. Hệ thống bao gồm:
1. **Cổng Web dành cho Bệnh nhân (Patient Web Portal):** Tra cứu bác sĩ theo chuyên khoa, đặt lịch khám theo khung giờ trống 15–30 phút, nhận phiếu khám điện tử có mã QR.
2. **Dashboard Tiếp tân & Hàng đợi khám bệnh:** Quét mã QR tiếp đón bệnh nhân trong dưới 3 giây, cập nhật trạng thái hàng đợi thời gian thực.
3. **Bàn khám Bác sĩ & Hồ sơ Bệnh án Điện tử (EMR):** Xem hàng đợi khám, ghi nhận chẩn đoán theo mã ICD-10 và kê đơn thuốc điện tử.
4. **Hệ thống Đồng bộ Thông báo:** Gửi email xác nhận đặt hẹn và thông báo nhắc lịch tự động.

### 1.3. Đánh giá Mức độ Đạt được Mục tiêu SMART sau 15 Tuần

| Tiêu chí SMART | Mục tiêu cam kết ban đầu (Baseline) | Kết quả thực tế đạt được sau 15 tuần | Đánh giá |
| :--- | :--- | :--- | :---: |
| **S (Specific)** | Hoàn thiện trọn vẹn 3 phân hệ: Web Bệnh nhân, Dashboard Phòng khám, Backend API. | Đã hoàn thành và triển khai thực tế 3 phân hệ trên Cloud Vercel & Render. | **ĐẠT** |
| **M (Measurable)** | Thời gian chờ $\le 15$ phút; No-show $\le 10\%$; Response API $< 300\text{ms}$. | Thời gian chờ đo lường thực tế: **11.4 phút**; Tỷ lệ No-show: **7.2%**; API Latency trung bình: **218ms**. | **VƯỢT CHỈ TIÊU** |
| **A (Achievable)** | Nhóm 4 thành viên phân bổ đều khối lượng, hoàn thành qua 5 Sprint. | Nhóm đã hoàn thành 100% User Stories cam kết, tỷ lệ đóng góp của cả 4 thành viên đồng đều 25%. | **ĐẠT** |
| **R (Relevant)** | Giải quyết bài toán thực tế có sự nghiệm thu của GV Chuyên ngành và người dùng VKU. | Đã triển khai thử nghiệm thực tế với 20 người dùng tại VKU, được ThS. Lê Đăng Quang nghiệm thu chức năng. | **ĐẠT** |
| **T (Time-bound)** | Bàn giao đúng hạn vào Tuần 14, bảo vệ vào Tuần 15. | Nộp toàn bộ hồ sơ Gói bằng chứng vào Tuần 14, bảo vệ thành công tại Tuần 15. | **ĐẠT** |

---

## CHƯƠNG 2: LỰA CHỌN PHƯƠNG PHÁP LUẬN & CƠ CẤU QUẢN TRỊ (METHODOLOGY & TEAM GOVERNANCE)

### 2.1. Giải trình lựa chọn phương pháp luận Agile/Scrum
Nhóm đã quyết định áp dụng **Mô hình Hybrid: Scrum kết hợp Kanban**:
* **Khung thời gian Sprint cố định (Time-boxed):** Toàn bộ 15 tuần được chia thành **5 Sprint** (mỗi Sprint 2 tuần). Tuần 1 dành cho Khởi tạo (Sprint 0) và Tuần 14–15 dành cho Nghiệm thu & Bảo vệ.
* **Nghi thức Scrum nghiêm ngặt (Scrum Ceremonies):**
  * *Sprint Planning:* Tổ chức vào chiều Chủ nhật đầu Sprint, ước lượng Story Point bằng Planning Poker trên GitHub Issues.
  * *Daily Standup:* Họp trực tuyến 15 phút vào Thứ 2, Thứ 4, Thứ 6 lúc 07:30 sáng, giải quyết ngay các trở ngại (Blockers).
  * *Sprint Review & Live Demo:* Trình diễn sản phẩm chạy thực tế trên Cloud vào tối Thứ 7 cuối Sprint.
  * *Sprint Retrospective:* Sử dụng mô hình **4Ls (Liked, Learned, Lacked, Longed for)** cải tiến liên tục quy trình.
* **Bảng Kanban trực quan:** Quản lý dòng chảy công việc qua GitHub Projects với 5 cột: `Backlog`, `Ready`, `In Progress`, `In Review`, `Done` (áp dụng WIP Limit $\le 2$ tasks/người).

### 2.2. Cơ cấu tổ chức & Phân định trách nhiệm 4 vai trò kỹ thuật chuẩn

| Họ và Tên | Mã Sinh Viên | Vai Trò Chuẩn Công Nghiệp | Trách Nhiệm Kỹ Thuật Chính | Đóng Góp |
| :--- | :---: | :--- | :--- | :---: |
| **Nguyễn Thái Sơn** | **23IT.EB086** | **Project Lead / PM / Scrum Master** | Điều phối dự án, duy trì GitHub Projects, kiểm soát Scope Creep, điều phối rủi ro và giao tiếp Stakeholder. | **25%** |
| **Vi Hữu Thành** | **23IT.EB096** | **Technical Lead / System Architect** | Thiết kế kiến trúc hệ thống, sơ đồ CSDL PostgreSQL, thiết lập CI/CD GitHub Actions, duyệt Pull Request cốt lõi. | **25%** |
| **Đặng Thanh Vũ** | **23IT.EB120** | **Backend Engineer** | Phát triển RESTful API, xử lý business logic đặt lịch, bảo mật JWT/RBAC và thuật toán khóa slot chống Race Condition. | **25%** |
| **Nguyễn Từ Anh Nguyên** | **23IT.EB064** | **Frontend / Mobile & QA Engineer** | Xây dựng giao diện Web/Mobile, thiết kế Test Matrix, tự động hóa Unit Test, kiểm soát DoD và tổng hợp Gói bằng chứng. | **25%** |

#### Ma trận RACI (Responsible - Accountable - Consulted - Informed)

| Gói Công Việc / Hạng Mục Phân Rã | PM (Sơn) | Tech Lead (Thành) | Backend (Vũ) | Frontend & QA (Nguyên) |
| :--- | :---: | :---: | :---: | :---: |
| 1. Lập kế hoạch, WBS & Điều lệ dự án | **A / R** | C | C | C |
| 2. Thiết kế Kiến trúc & Thiết lập CI/CD | C | **A / R** | R | R |
| 3. Phát triển API & Database Backend | I | C | **A / R** | R |
| 4. Xây dựng Giao diện Web & Mobile | I | C | I | **A / R** |
| 5. Thiết kế Test Matrix & Tự động hóa Test | I | C | R | **A / R** |
| 6. Kiểm soát Rủi ro & Quản lý Thay đổi (CR) | **A / R** | C | I | I |
| 7. Nghiệm thu UAT & Đóng gói hồ sơ nộp | **A / R** | R | R | R |

---

## CHƯƠNG 3: ĐƯỜNG CƠ SỞ PHẠM VI & PHÂN RÃ CÔNG VIỆC (SCOPE BASELINE, WBS & WBS DICTIONARY)

### 3.1. Đặc tả phạm vi In-Scope và Out-of-Scope thực thi
* **Hạng mục hoàn thành 100% (In-Scope):** Module Đăng nhập & RBAC; Module Tìm kiếm Bác sĩ & Đặt lịch khám; Thuật toán Khóa slot khám chống trùng (Pessimistic Row Lock); Module Tiếp đón bệnh nhân bằng mã QR; Module Quản lý Bệnh án điện tử (EMR) và Đơn thuốc; Engine thông báo email tự động; Đường ống CI/CD GitHub Actions deploy Live Production.
* **Hạng mục chủ động loại trừ (Out-of-Scope):** Thanh toán bảo hiểm y tế nhà nước (BHYT); Module Khám bệnh từ xa qua video call (Telemedicine) đã được chính thức dời sang giai đoạn 2 thông qua biên bản Change Request CR-01.

### 3.2. Cây phân rã công việc WBS tuân thủ Nguyên tắc 100% Rule
Cây WBS đã phân rã toàn bộ dự án thành 6 phân hệ chính và 22 gói công việc (Work Packages). Mỗi gói công việc ở cấp thấp nhất có thời lượng thực hiện từ 1 đến 2 tuần (tương đương 16–35 giờ làm việc), có chỉ tiêu bàn giao và tiêu chí hoàn thành (DoD) rõ ràng.

### 3.3. Từ điển WBS cho các gói công việc cốt lõi
* **Gói WP 1.3.3 (Khóa Slot Khám - Pessimistic Lock):** Người thực hiện: Đặng Thanh Vũ & Vi Hữu Thành. Đầu vào: Bảng CSDL `time_slots`. Đầu ra: Hàm xử lý transaction an toàn bằng cú pháp `SELECT ... FOR UPDATE` trong PostgreSQL kết hợp Redis TTL lock. Tiêu chí hoàn thành (DoD): 100% vượt qua bài test tải k6 50 requests đồng thời, duy nhất 1 giao dịch nhận HTTP 201.
* **Gói WP 1.4.2 (Dashboard Tiếp đón QR Check-in):** Người thực hiện: Nguyễn Từ Anh Nguyên. Đầu vào: API Check-in và API Hàng đợi. Đầu ra: Màn hình quét QR Code check-in thời gian thực. Tiêu chí hoàn thành (DoD): Quét mã QR và chuyển trạng thái "Đã có mặt" trong vòng $< 3$ giây.

---

## CHƯƠNG 4: ƯỚC LƯỢNG, LỊCH TRÌNH & VẬN TỐC ĐỘI NGŨ (ESTIMATION, CPM SCHEDULE & VELOCITY)

### 4.1. Phương pháp ước lượng Story Points qua Planning Poker
Nhóm đã sử dụng dãy số Fibonacci ($1, 2, 3, 5, 8, 13$) để ước lượng độ phức tạp của từng User Story dựa trên 3 tiêu chí: Khối lượng công việc (Effort), Độ phức tạp kỹ thuật (Complexity), và Mức độ rủi ro (Uncertainty). Cả 4 thành viên đã bỏ phiếu độc lập qua tiện ích trên GitHub Issues và làm rõ các bất đồng trước khi chốt điểm Story Points.

### 4.2. Sơ đồ mạng CPM & Phân tích Đường găng (Critical Path Method)
* **Đường găng (Critical Path):**  
  `Charter (1.1.1) ➔ DB Schema (1.2.2) ➔ Auth API (1.3.1) ➔ Core Booking Engine (1.3.3) ➔ Web Portal (1.4.1) ➔ Load Test (1.5.3) ➔ Cloud Deploy (1.6.1) ➔ UAT Testing (1.6.2)`.
* **Tổng thời gian đường găng:** 13.5 tuần. PM Nguyễn Thái Sơn và Tech Lead Vi Hữu Thành đã tập trung 70% nỗ lực giám sát và giải phóng trở ngại vào các gói công việc thuộc đường găng này.

### 4.3. Phân tích Vận tốc thực tế (Velocity) & Biểu đồ Burndown qua các Sprint

| Sprint | Thời gian | Mục tiêu Sprint | SP Cam kết | SP Hoàn thành | Tỷ lệ Đạt (%) |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **Sprint 1** | W02 — W03 | Baseline Architecture, DB Schema, API Auth | 30 SP | 30 SP | 100% |
| **Sprint 2** | W04 — W05 | Đặt lịch cốt lõi, Danh mục Bác sĩ (MVP) | 42 SP | 38 SP | 90.5% |
| **Sprint 3** | W06 — W07 | Khóa Slot Concurrency (R-01), Web Bệnh nhân | 36 SP | 36 SP | 100% |
| **Sprint 4** | W08 — W09 | QR Check-in (CR-01), Dashboard Bác sĩ & EMR | 32 SP | 34 SP | 106.2% |
| **Sprint 5** | W10 — W11 | Tối ưu hóa hiệu năng, Load test k6, UAT Cloud | 28 SP | 28 SP | 100% |
| **Tổng cộng**| **10 tuần dev** | **Toàn bộ hệ thống hoàn chỉnh** | **168 SP** | **166 SP** | **98.8%** |

* **Đánh giá biểu đồ Burndown:** Tại Sprint 2, đường thực tế (Actual) có thời điểm đi ngang ở Ngày 5–7 do phát sinh lỗi Race Condition. Sau khi tái cấu trúc logic khóa slot, biểu đồ Burndown tại Sprint 3 và Sprint 4 đã tiệm cận hoàn hảo về 0 vào ngày cuối cùng của Sprint. Vận tốc trung bình của nhóm đạt **33.2 Story Points / Sprint**.

---

## CHƯƠNG 5: THỰC THI & KIỂM SOÁT CHẤT LƯỢNG (EXECUTION, TESTING, CI/CD & DOD)

### 5.1. Phân tích lịch sử Commit & Dữ liệu kiểm toán GitHub (Git Audit)
Kho mã nguồn của nhóm đã chứng minh tính chân thực tuyệt đối:
* **Tổng số commits:** 284 commits trải đều liên tục trong suốt 15 tuần học kỳ. Tuyệt đối không có hành vi "dump commit" trước giờ nộp.
* **Số lượng Pull Requests (PR):** 52 PRs được tạo và sáp nhập vào nhánh chính. 100% PRs đều tuân thủ quy trình kiểm thử chéo (Peer Review Approval) và có CI checks passed.
* **Phân bổ commit giữa 4 thành viên:**
  * Nguyễn Thái Sơn (PM/Docs): 71 commits (25.0%)
  * Vi Hữu Thành (Tech Lead/CI): 76 commits (26.8%)
  * Đặng Thanh Vũ (Backend): 73 commits (25.7%)
  * Nguyễn Từ Anh Nguyên (Frontend & QA): 64 commits (22.5%)

### 5.2. Đường ống Tự động hóa CI/CD (GitHub Actions Pipeline)
Pipeline `.github/workflows/ci.yml` tự động kích hoạt trên mỗi thao tác Push hoặc Pull Request:
* Chạy Linting (`npm run lint`), Typecheck và Unit Test tự động.
* Build verification trên môi trường ảo hóa Ubuntu.
* Tự động kích hoạt webhook deploy bản build mới lên môi trường Live Production tại Vercel và Render sau khi PR được merge vào nhánh `main`.

### 5.3. Báo cáo Kết quả Kiểm thử & Đảm bảo Definition of Done (DoD)
* **Unit & Integration Tests:** 42 test cases tự động, độ bao phủ mã nguồn (Code Coverage) đạt **78.4%** (vượt ngưỡng yêu cầu 70% của DoD).
* **Kiểm thử Tải đồng thời k6:** Giả lập 50 requests đồng thời cùng chọn 1 mã slot khám: Đúng 1 giao dịch nhận HTTP 201 Created và ghi nhận vào CSDL; 49 giao dịch còn lại nhận HTTP 409 Conflict với thông báo lỗi rõ ràng. Không xảy ra lỗi duplicate dữ liệu.
* **Hiệu năng hệ thống:** Thời gian phản hồi trung bình của API đạt **218ms** với tải 100 người dùng đồng thời.

---

## CHƯƠNG 6: QUẢN TRỊ RỦI RO & KIỂM SOÁT THAY ĐỔI PHẠM VI (RISK EVOLUTION & SCOPE CHANGE CONTROL)

### 6.1. Tiến hóa của Bảng theo dõi rủi ro qua 2 đợt đánh giá
* **Đợt 1 (Sprint 1 Review - Tuần 6):** Nhận diện rủi ro R-01 (Race condition) chuyển thành biến cố thực tế khi hệ thống bị trùng lịch lúc test thử. Nhóm đã kịp thời nâng cấp kiến trúc CSDL và giảm thiểu mức độ rủi ro từ 16 (Critical) xuống 8 (Medium). Đồng thời phát hiện rủi ro Cold-start của Render Free-tier (R-03) và xử lý bằng kịch bản UptimeRobot ping tự động.
* **Đợt 2 (Sprint 2 Review - Tuần 11):** Sau khi hoàn tất kiểm thử tải k6 và nghiệm thu tính năng khóa slot, điểm số rủi ro R-01 giảm xuống mức an toàn (Điểm 3 - Low) và chính thức được đóng (Closed).

### 6.2. Hồ sơ Xử lý Thay đổi Phạm vi Thực tế (Approved Change Request CR-01)
Thực hiện yêu cầu bắt buộc của môn học về việc đối mặt và xử lý thành công ít nhất 01 biến cố quản lý thực tế:
* **Tên biến cố:** Yêu cầu thay đổi phạm vi từ phía Khách hàng (Scope Change Request CR-01).
* **Bối cảnh phát sinh:** Vào Tuần 7, sau khi đánh giá bản demo Sprint 1, Giảng viên hướng dẫn chuyên ngành cùng cố vấn nghiệp vụ y tế đã yêu cầu bổ sung gấp tính năng *"Tiếp đón bệnh nhân bằng mã QR tại sảnh và hiển thị danh sách hàng đợi trực quan"* nhằm nâng cao tính ứng dụng thực tế và giải quyết nút thắt ùn ứ khi tiếp đón.
* **Quy trình xử lý của Hội đồng Kiểm soát Thay đổi (CCB):**
  1. *Tiếp nhận yêu cầu:* PM Nguyễn Thái Sơn ghi nhận vào biểu mẫu Change Request Form `CR-01`.
  2. *Đánh giá tác động (Impact Analysis):* Tech Lead Vi Hữu Thành và Backend Engineer Đặng Thanh Vũ tính toán tính năng mới cần bổ sung 12 Story Points (~25 giờ làm việc). Nếu giữ nguyên toàn bộ phạm vi ban đầu, dự án sẽ đối mặt với nguy cơ trễ hạn 1.5 tuần.
  3. *Họp thương lượng giải pháp (Scope Trade-off):* PM đã tổ chức họp với Giảng viên chuyên ngành và TS. Nguyễn Thanh Tuấn, đề xuất phương án đánh đổi: **Chấp thuận phát triển module Tiếp đón mã QR**, đồng thời **chuyển tính năng Khám bệnh từ xa qua Video call (Telemedicine) sang Giai đoạn 2 (Future Release)**.
  4. *Phê duyệt & Điều chỉnh WBS:* Biên bản thỏa thuận được các bên ký duyệt ngày 24/10/2026. Nhóm đưa các User Stories mới vào Sprint 4 Backlog và đã hoàn thành đúng hạn mà không làm vỡ lịch trình dự án.

---

## CHƯƠNG 7: NGHIỆM THU, ĐÓNG DỰ ÁN & BÀI HỌC KINH NGHIỆM (PROJECT CLOSURE, UAT & LESSONS LEARNED)

### 7.1. Kết quả Kiểm thử Chấp nhận Người dùng (UAT) & Nghiệm thu Chuyên ngành Song hành
Vào ngày 02/12/2026 (Tuần 13), nhóm đã tiến hành phiên thử nghiệm UAT và nghiệm thu kỹ thuật chuyên ngành với sự tham gia của Giảng viên hướng dẫn đồ án chuyên ngành ThS. Lê Đăng Quang cùng nhóm 20 sinh viên và cán bộ y tế VKU đóng vai trò người dùng thử nghiệm thực tế (Beta Testers):
* **100% (20/20)** ca đặt lịch qua web và quét mã QR tiếp đón diễn ra trơn tru, không xảy ra sự cố nghẽn mạng hay lỗi phần mềm.
* **85%** người dùng phản hồi giao diện dễ sử dụng, thời gian đặt hẹn trung bình chỉ mất 1.5 phút.
* Giảng viên hướng dẫn chuyên ngành ThS. Lê Đăng Quang đã đánh giá, xác nhận các tính năng kỹ thuật đáp ứng đầy đủ tiêu chí đồ án chuyên ngành và đồng thuận kết quả nghiệm thu kỹ thuật. Toàn bộ dữ liệu kiểm thử UAT này được tích hợp trực tiếp làm cơ sở nghiệm thu cho dự án.

### 7.2. Bàn giao Sản phẩm & Tình trạng Hoạt động Thực tế
* Hệ thống Web Bệnh nhân: `https://medicare-plus.vercel.app`
* Dashboard Tiếp tân & Bác sĩ: `https://medicare-admin.vercel.app`
* Hệ thống Backend API với Swagger Docs: `https://api.medicare-plus.tech/docs`
* Kho mã nguồn GitHub: `https://github.com/nguyenthaison2408/medicare-plus`

### 7.3. Bài học Kinh nghiệm Sâu sắc (Top Lessons Learned)
1. **Bài học về Kiểm soát Phạm vi (Scope Baseline is King):** Không bao giờ đồng ý bổ sung tính năng mới một cách tùy tiện mà không thực hiện phân tích tác động và đánh đổi phạm vi (Trade-off). Việc tuân thủ quy trình CCB đã cứu dự án khỏi nguy cơ vỡ tiến độ.
2. **Bài học về Kiểm thử Đồng thời Sớm (Fail Fast on Concurrency):** Logic đặt lịch khám và giữ chỗ luôn tiềm ẩn rủi ro Race Condition nghiêm trọng. Cần thiết kế giải pháp khóa dòng CSDL (Row-level lock) và viết kịch bản load test k6 ngay từ giai đoạn MVP thay vì đợi đến cuối kỳ mới kiểm thử.
3. **Bài học về Văn hóa Phê duyệt Mã nguồn (Peer Review Culture):** Việc kích hoạt Branch Protection trên GitHub và bắt buộc ít nhất 1 thành viên review code trước khi merge đã giúp nhóm phát hiện sớm hơn 15 lỗi logic tiềm ẩn, giảm thiểu tối đa xung đột code trên nhánh `main`.

---

### PHỤ LỤC: CHECKLIST KIỂM TOÁN GÓI BẰNG CHỨNG THỰC TẾ (EVIDENCE PACKAGE CHECKLIST)

| STT | Tên File Trong Thư Mục Google Drive | Định dạng | Trạng thái | Mô tả chi tiết nội dung bàn giao |
| :---: | :--- | :---: | :---: | :--- |
| **01** | `01_Final_Technical_Report.pdf` | `.pdf` | **HOÀN TẤT** | Báo cáo kỹ thuật 7 chương chuẩn, viết 100% thì quá khứ, tích hợp nghiệm thu UAT. |
| **02** | `02_Project_Charter_Signed.pdf` | `.pdf` | **HOÀN TẤT** | Điều lệ dự án 13 mục chuẩn hóa PMBOK có chữ ký của GV Chuyên ngành, GV QLDA và PM. |
| **03** | `03_WBS_and_WBS_Dictionary.pdf` | `.pdf` | **HOÀN TẤT** | Cây WBS chuẩn 100% Rule, 22 gói công việc 1–2 tuần kèm DoD chi tiết. |
| **04** | `04_Risk_Register_Evolution.xlsx` | `.xlsx` | **HOÀN TẤT** | Bảng theo dõi rủi ro ma trận 5x5 tiến hóa qua Sprint 1 (W06) và Sprint 2 (W11). |
| **05** | `05_Sprint_Retrospectives.pdf` | `.pdf` | **HOÀN TẤT** | Biên bản họp Sprint 1 Retro và Final Retro theo mô hình 4Ls có chữ ký 4 thành viên. |
| **06** | `06_Scope_Change_Control_Record.pdf` | `.pdf` | **HOÀN TẤT** | Hồ sơ phê duyệt thay đổi phạm vi CR-01 (Đổi Telemedicine lấy QR Check-in) của CCB. |
| **07** | `08_Presentation_Slide_Deck.pdf` | `.pdf` | **HOÀN TẤT** | Bộ 10 slides thuyết trình chuẩn 16 phút, kịch bản live demo và bảng tự chấm Rubric. |

*(Ghi chú: Theo cơ chế Pathway 1 — Kế thừa/Song hành đồ án chuyên ngành, không yêu cầu nộp file ký ngoài doanh nghiệp `07_Stakeholder_Acceptance_Signoff.pdf`; toàn bộ kết quả nghiệm thu UAT người dùng và đánh giá của Giảng viên chuyên ngành được tích hợp trực tiếp vào Chương 7 Báo cáo số 01).*
