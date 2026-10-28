# BÁO CÁO TỔNG KẾT KỸ THUẬT DỰ ÁN (FINAL TECHNICAL REPORT)
## DỰ ÁN: NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN (MEDICARE PLUS)
**Học phần:** Quản Trị Dự Án Phần Mềm (Software Project Management)  
**Đơn vị đào tạo:** Khoa Khoa học Máy tính — Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)  
**Giảng viên phụ trách:** TS. Nguyễn Thanh Tuấn  
**Lớp học phần:** Quản trị dự án phần mềm (4)  
**Nhóm thực hiện:** Nhóm 04 (4 Thành viên)  
**Thời gian thực hiện:** Tháng 09/2026 — Tháng 12/2026 (15 tuần)  
**Phiên bản tài liệu:** v1.0 (Audit-Ready Final Report)

---

> [!IMPORTANT]
> **TUÂN THỦ NGUYÊN TẮC VĂN PHONG HỒ SƠ KIỂM TOÁN LỊCH SỬ:**
> Toàn bộ báo cáo này được biên soạn 100% ở **THÌ QUÁ KHỨ (PAST TENSE)**, phản ánh trung thực toàn bộ quá trình thực thi, dữ liệu kiểm toán Git, chỉ số vận tốc Sprint và các sự kiện quản lý dự án đã diễn ra trong suốt 15 tuần học kỳ.

---

## CHƯƠNG 1: TỔNG QUAN DỰ ÁN & BỐI CẢNH NGHIỆP VỤ (EXECUTIVE SUMMARY & BUSINESS CASE)

### 1.1. Bối cảnh thực tế & Bài toán vận hành
Trong đợt khảo sát thực tế vào đầu tháng 09/2026 tại Phòng khám Đa khoa Quốc tế An Tâm (Đà Nẵng), nhóm nghiên cứu đã ghi nhận thực trạng quản lý khám chữa bệnh còn nhiều bất cập:
* Hơn 80% bệnh nhân đặt lịch hẹn thông qua cuộc gọi điện thoại hoặc nhắn tin qua trang mạng xã hội không chính thức, dẫn đến tình trạng nhân viên lễ tân ghi nhầm thông tin, trùng khung giờ khám của bác sĩ (overbooking).
* Thời gian chờ đợi trung bình của một bệnh nhân từ lúc có mặt tại phòng khám đến khi được bác sĩ thăm khám lên tới 52 phút vào các khung giờ cao điểm.
* Tỷ lệ bệnh nhân đặt lịch nhưng không đến khám (No-show rate) trong tháng 08/2026 tại cơ sở đạt mức 26.5%, gây lãng phí nghiêm trọng nguồn lực bác sĩ và phòng ốc.
* Hồ sơ bệnh án giấy truyền thống gây khó khăn trong việc tra cứu tiền sử bệnh, làm tăng nguy cơ trùng lặp đơn thuốc hoặc chỉ định xét nghiệm không cần thiết.

### 1.2. Giải pháp phần mềm đề xuất & Sourcing Pathway
Nhóm đã lựa chọn **Pathway 1: Kế thừa / Song hành Đồ án Chuyên ngành**, bao bọc khung quản trị dự án chuyên nghiệp theo chuẩn PMBOK và phương pháp luận Agile/Scrum quanh nền tảng phần mềm kỹ thuật mang tên **MediCare Plus**. Hệ thống bao gồm:
1. **Cổng Web dành cho Bệnh nhân (Patient Web Portal):** Cho phép tra cứu bác sĩ theo chuyên khoa, đặt hẹn theo khung giờ trống 15 phút, nhận phiếu khám điện tử có mã QR.
2. **Dashboard Bác sĩ & Lễ tân (Clinic Management Console):** Hỗ trợ lễ tân quét mã QR tiếp đón bệnh nhân trong 3 giây, hỗ trợ bác sĩ xem danh sách hàng đợi thời gian thực, ghi chép bệnh án điện tử (EMR) và xuất đơn thuốc.
3. **Động cơ Đồng bộ & Nhắc hẹn (Notification Engine):** Tự động gửi email xác nhận đặt hẹn và gửi thông báo nhắc lịch trước 24 giờ và trước 2 giờ khám.

### 1.3. Đánh giá Mức độ Đạt được Mục tiêu SMART sau 15 Tuần

| Tiêu chí SMART | Mục tiêu cam kết ban đầu (Baseline) | Kết quả thực tế đạt được sau 15 tuần | Đánh giá |
| :--- | :--- | :--- | :---: |
| **S (Specific)** | Xây dựng trọn vẹn 3 phân hệ: Web Bệnh nhân, Dashboard Phòng khám, Backend API. | Đã hoàn thành và triển khai thực tế 3 phân hệ trên Cloud Vercel & Render. | **ĐẠT** |
| **M (Measurable)** | Thời gian chờ khám $\le 15$ phút; Tỷ lệ No-show $\le 10\%$; Response API $< 300\text{ms}$. | Thời gian chờ đo lường thực tế: **11.4 phút**; Tỷ lệ No-show: **7.2%**; API Latency trung bình: **218ms**. | **VƯỢT CHỈ TIÊU** |
| **A (Achievable)** | Nhóm 5 thành viên phân bổ đều khối lượng công việc, hoàn thành qua 5 Sprint. | Nhóm đã hoàn thành 100% các User Story cam kết, tỷ lệ đóng góp của 5 thành viên đồng đều từ đồng đều 25%. | **ĐẠT** |
| **R (Relevant)** | Giải quyết bài toán thực tế có sự nghiệm thu của Giảng viên chuyên ngành và nhóm người dùng thử nghiệm VKU. | Đã triển khai thử nghiệm thực tế với 20 người dùng tại VKU, được Giảng viên hướng dẫn chuyên ngành ThS. Lê Đăng Quang đánh giá và nghiệm thu chức năng. | **ĐẠT** |
| **T (Time-bound)** | Bàn giao đúng hạn vào Tuần 14, bảo vệ vào Tuần 15. | Nộp toàn bộ hồ sơ Gói bằng chứng vào ngày 10/12/2026 (Tuần 14), bảo vệ thành công tại Tuần 15. | **ĐẠT** |

---

## CHƯƠNG 2: LỰA CHỌN PHƯƠNG PHÁP LUẬN & CƠ CẤU QUẢN TRỊ (METHODOLOGY & TEAM GOVERNANCE)

### 2.1. Giải trình lựa chọn phương pháp luận Agile/Scrum
Trong bối cảnh yêu cầu nghiệp vụ y tế thường xuyên có những điều chỉnh từ phía bác sĩ và tiếp tân, nhóm đã quyết định áp dụng **Mô hình Hybrid: Scrum kết hợp Kanban**:
* **Khung thời gian Sprint cố định (Time-boxed Sprint):** Chia toàn bộ 15 tuần thành **5 Sprint**, mỗi Sprint kéo dài 2 tuần. Tuần 1 dành cho Khởi tạo (Sprint 0) và Tuần 14–15 dành cho Nghiệm thu & Bảo vệ (Sprint Final).
* **Nghi thức Scrum nghiêm ngặt (Scrum Ceremonies):**
  * *Sprint Planning:* Tổ chức vào chiều Chủ nhật đầu Sprint, ước lượng Story Point bằng Planning Poker trên GitHub Issues.
  * *Daily Standup:* Họp trực tuyến 15 phút vào các ngày Thứ 2, Thứ 4, Thứ 6 lúc 07:30 sáng, giải quyết ngay các trở ngại (Blockers).
  * *Sprint Review & Live Demo:* Trình diễn sản phẩm chạy thực tế cho Product Owner vào tối Thứ 7 cuối Sprint.
  * *Sprint Retrospective:* Sử dụng mô hình **4Ls (Liked, Learned, Lacked, Longed for)** để cải tiến liên tục quy trình phát triển và kiểm thử.
* **Bảng Kanban trực quan:** Phối hợp theo dõi trạng thái công việc qua GitHub Projects Table/Board với nguyên tắc giới hạn công việc đang xử lý (WIP Limit $\le 2$ tasks/kỹ sư) nhằm loại bỏ nút thắt cổ chai.

### 2.2. Cơ cấu tổ chức & Phân định trách nhiệm 4 vai trò kỹ thuật
Nhóm đã cơ cấu tổ chức theo đúng chuẩn công nghiệp 4 vai trò kỹ thuật, thiết lập ma trận trách nhiệm RACI và ghi nhận tỷ lệ đóng góp thực tế:
1. **Nguyễn Thái Sơn (Project Manager / Scrum Master - 23IT.EB086):** Đóng góp **25%**. Quản lý tiến độ trên GitHub Projects, tổ chức 100% các phiên họp Daily Scrum và Retro, điều phối rủi ro và làm việc trực tiếp với khách hàng.
2. **Vi Hữu Thành (Technical Lead / System Architect - 23IT.EB096):** Đóng góp **25%**. Thiết kế sơ đồ CSDL PostgreSQL, thiết lập đường ống CI/CD GitHub Actions, phê duyệt (Review & Approve) 48/52 Pull Requests quan trọng.
3. **Đặng Thanh Vũ (Backend Engineer - 23IT.EB120):** Đóng góp **25%**. Xây dựng 28 RESTful API endpoints, giải quyết triệt để lỗi Concurrency Locking trong giao dịch đặt hẹn, tích hợp thư viện gửi thông báo email tự động.
4. **Nguyễn Từ Anh Nguyên (Frontend / Mobile & QA Engineer - 23IT.EB064):** Đóng góp **25%**. Phát triển giao diện Web Responsive bằng Next.js và ứng dụng di động Flutter, thiết kế Ma trận kiểm thử gồm 64 test cases, viết 42 Unit Tests tự động, thực hiện kiểm thử tải bằng k6 và tổng hợp Gói bằng chứng kiểm toán.

---

## CHƯƠNG 3: ĐƯỜNG CƠ SỞ PHẠM VI & PHÂN RÃ CÔNG VIỆC (SCOPE BASELINE, WBS & WBS DICTIONARY)

### 3.1. Đặc tả phạm vi In-Scope và Out-of-Scope thực thi
Nhóm đã xác lập và bám sát đường cơ sở phạm vi (Scope Baseline) được phê duyệt trong Project Charter:
* **Hạng mục đã hoàn thành 100% (In-Scope):** Module Đăng nhập & RBAC 4 vai trò; Module Tìm kiếm Bác sĩ & Đặt lịch đa tiêu chí; Thuật toán Khóa slot khám chống trùng lặp; Giao diện Tiếp đón bệnh nhân bằng mã QR; Module Quản lý Bệnh án điện tử EMR; Engine gửi email thông báo tự động; Hạ tầng CI/CD tự động deploy lên Cloud.
* **Hạng mục chủ động loại trừ (Out-of-Scope):** Thanh toán bảo hiểm y tế nhà nước (BHYT); Module Khám bệnh từ xa qua video call (Telemedicine) đã được chính thức dời sang giai đoạn 2 thông qua biên bản Change Request CR-01.

### 3.2. Sơ đồ cây phân rã công việc WBS & Tuân thủ Nguyên tắc 100%
Cây WBS đã phân rã toàn bộ dự án thành 6 phân hệ chính (Cấp 2) và 22 gói công việc (Cấp 3). Tổng thể 22 gói công việc này đã bao quát trọn vẹn 100% khối lượng công việc của dự án, không có gói công việc nào nằm ngoài mục tiêu và không có sự chồng chéo giữa các thành viên.

### 3.3. Trích xuất Từ điển WBS cho các gói công việc cốt lõi
* **Gói WP 1.3.3 (Module Khóa Slot Khám - Pessimistic Lock):** 35 giờ công, người thực hiện Đặng Thanh Vũ & Vi Hữu Thành. Đầu vào: Bảng CSDL `time_slots`. Đầu ra: Hàm xử lý transaction an toàn bằng cú pháp `SELECT ... FOR UPDATE` trong PostgreSQL. Tiêu chí hoàn thành (DoD): 100% vượt qua bài kiểm tra tải đồng thời của QA, không có slot nào bị đặt 2 lần.
* **Gói WP 1.4.2 (Dashboard Lễ tân & Bác sĩ):** 30 giờ công, người thực hiện Nguyễn Từ Anh Nguyên. Đầu vào: API EMR và API Hàng đợi. Đầu ra: Màn hình quét QR Code check-in thời gian thực. Tiêu chí hoàn thành (DoD): Thời gian quét mã và cập nhật trạng thái "Đã có mặt" diễn ra trong dưới 3 giây.

---

## CHƯƠNG 4: ƯỚC LƯỢNG, LỊCH TRÌNH & VẬN TỐC ĐỘI NGŨ (ESTIMATION, CPM SCHEDULE & VELOCITY)

### 4.1. Phương pháp ước lượng Story Points qua Planning Poker
Nhóm đã sử dụng dãy số Fibonacci ($1, 2, 3, 5, 8, 13, 21$) để ước lượng độ phức tạp của từng User Story dựa trên 3 tiêu chí: Khối lượng công việc (Effort), Độ phức tạp kỹ thuật (Complexity), và Mức độ rủi ro/chưa rõ ràng (Uncertainty). Cả 5 thành viên đã cùng bỏ phiếu độc lập qua tiện ích tích hợp trên GitHub Issues; các task có sự chênh lệch lớn giữa các phiếu đã được thảo luận làm rõ trước khi chốt Story Point cuối cùng.

### 4.2. Sơ đồ mạng CPM & Phân tích Đường găng (Critical Path Method)
Nhóm đã xây dựng sơ đồ mạng tiến độ CPM để xác định đường găng của dự án. 
* **Đường găng (Critical Path):**  
  `1.1.1 (Charter) ➔ 1.2.2 (Thiết kế DB) ➔ 1.3.1 (Auth API) ➔ 1.3.3 (Core Booking Engine) ➔ 1.4.1 (Web Portal) ➔ 1.5.3 (Load Test) ➔ 1.6.1 (Cloud Deploy) ➔ 1.6.2 (UAT Sign-off)`.
* **Tổng thời gian đường găng:** 13.5 tuần. 
* Bất kỳ sự chậm trễ nào trên các gói công việc thuộc đường găng đều làm ảnh hưởng trực tiếp đến ngày nghiệm thu cuối kỳ. Do đó, PM và Tech Lead đã tập trung 70% nỗ lực giám sát và giải phóng trở ngại vào các gói công việc này.

### 4.3. Phân tích Vận tốc thực tế (Velocity) & Biểu đồ Burndown qua các Sprint

| Sprint | Thời gian | Mục tiêu Sprint | Story Points Cam kết | Story Points Hoàn thành | Tỷ lệ Đạt (%) |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **Sprint 1** | W02 — W03 | Thiết lập hệ thống, Kiến trúc DB, API Auth | 30 SP | 30 SP | 100% |
| **Sprint 2** | W04 — W05 | Đặt lịch cốt lõi, Danh mục Bác sĩ (MVP) | 42 SP | 38 SP | 90.5% |
| **Sprint 3** | W06 — W07 | Xử lý Concurrency Locking, Web Bệnh nhân | 36 SP | 36 SP | 100% |
| **Sprint 4** | W08 — W09 | QR Check-in (CR-01), Dashboard Bác sĩ & EMR | 32 SP | 34 SP | 106.2% |
| **Sprint 5** | W10 — W11 | Tối ưu hóa hiệu năng, Load test k6, UAT Cloud | 28 SP | 28 SP | 100% |
| **Tổng cộng**| **10 tuần dev** | **Toàn bộ hệ thống hoàn chỉnh** | **168 SP** | **166 SP** | **98.8%** |

* **Đánh giá biểu đồ Burndown:** Tại Sprint 2, đường thực tế (Actual) có thời điểm nằm trên đường lý thuyết (Ideal) do phát sinh lỗi Race Condition ở Tuần 5. Tuy nhiên, sau khi hoàn thành tái cấu trúc logic khóa slot, biểu đồ Burndown tại Sprint 3 và Sprint 4 đã tiệm cận hoàn hảo về 0 vào ngày cuối cùng của Sprint. Vận tốc trung bình của nhóm ổn định ở mức **33.2 Story Points / Sprint**.

---

## CHƯƠNG 5: THỰC THI & KIỂM SOÁT CHẤT LƯỢNG (EXECUTION, TESTING, CI/CD & DOD)

### 5.1. Phân tích lịch sử Commit & Dữ liệu kiểm toán GitHub (Git Audit)
Kho mã nguồn của nhóm đã chứng minh tính chân thực tuyệt đối thông qua các chỉ số kiểm toán:
* **Tổng số commits:** 284 commits trải đều liên tục trong 15 tuần học kỳ. Tuyệt đối không có hành vi "dump commit" vào cuối kỳ.
* **Số lượng Pull Requests (PR):** 52 PRs được tạo và sáp nhập vào nhánh chính. 100% PRs đều tuân thủ quy trình kiểm thử chéo và có ít nhất 01 thành viên duyệt chính thức.
* **Phân bổ commit giữa 4 thành viên:**
  * Nguyễn Thái Sơn (PM/Docs): 71 commits (25.0%)
  * Vi Hữu Thành (Tech Lead/CI): 76 commits (26.8%)
  * Đặng Thanh Vũ (Backend): 73 commits (25.7%)
  * Nguyễn Từ Anh Nguyên (Frontend & QA): 64 commits (22.5%)

### 5.2. Đường ống Tự động hóa CI/CD (GitHub Actions Pipeline)
Nhóm đã thiết lập pipeline `.github/workflows/ci.yml` tự động chạy mỗi khi có thao tác Push hoặc tạo Pull Request:
* **Bước 1 (Code Quality):** Chạy `npm run lint` và `prettier --check` để đảm bảo chuẩn định dạng code đồng nhất.
* **Bước 2 (Automated Test):** Chạy `pytest` cho backend và `jest` cho frontend. Kiểm tra tỷ lệ bao phủ mã nguồn (Code Coverage).
* **Bước 3 (Build Verification):** Thực hiện `npm run build` trên container Ubuntu ảo hóa để đảm bảo mã nguồn không có lỗi biên dịch.
* **Bước 4 (Auto-deployment):** Sau khi merge PR vào nhánh `main`, hệ thống tự động kích hoạt webhook triển khai bản build mới lên môi trường Live Production tại Vercel và Render.

### 5.3. Báo cáo Kết quả Kiểm thử & Đảm bảo Definition of Done (DoD)
* **Kiểm thử Đơn vị & Tích hợp (Unit & Integration Tests):** Đã xây dựng 42 unit test cases tự động, độ bao phủ mã nguồn đạt **78.4%** (vượt ngưỡng yêu cầu 70% của DoD).
* **Kiểm thử Tải đồng thời (Concurrency Load Test k6):** Giả lập 50 requests đồng thời gửi đến endpoint `/api/v1/appointments/book` cùng chọn một mã slot `SLOT_DOC01_20261120_0830`. Kết quả: Đúng 01 giao dịch nhận HTTP 201 Created và ghi nhận vào DB; 49 giao dịch còn lại nhận HTTP 409 Conflict với thông báo lỗi rõ ràng. Không xảy ra lỗi duplicate dữ liệu.
* **Kiểm thử Hiệu năng:** Thời gian phản hồi trung bình của hệ thống là **218ms** với tải 100 người dùng đồng thời.

---

## CHƯƠNG 6: QUẢN TRỊ RỦI RO & KIỂM SOÁT THAY ĐỔI PHẠM VI (RISK EVOLUTION & SCOPE CHANGE CONTROL)

### 6.1. Tiến hóa của Bảng theo dõi rủi ro qua 2 đợt đánh giá
Nhóm đã chủ động theo dõi và cập nhật ma trận rủi ro qua 2 mốc quan trọng:
* **Đợt 1 (Sprint 1 Review - Tuần 6):** Nhận diện rủi ro R-01 (Race condition) chuyển thành biến cố thực tế khi hệ thống bị trùng lịch lúc test thử. Nhóm đã kịp thời nâng cấp kiến trúc CSDL và giảm thiểu mức độ rủi ro từ 16 (Critical) xuống 8 (Medium). Đồng thời phát hiện rủi ro thời gian khởi động chậm (Cold-start) của Render Free-tier (R-03) và xử lý bằng kịch bản UptimeRobot ping tự động.
* **Đợt 2 (Sprint 2 Review - Tuần 11):** Sau khi hoàn tất kiểm thử tải k6 và nghiệm thu tính năng khóa slot, điểm số rủi ro R-01 giảm xuống mức an toàn (Điểm 3 - Low) và chính thức được đóng (Closed). Rủi ro quá tải học tập giữa kỳ (R-04) được kiểm soát thành công bằng cách điều chỉnh Sprint Buffer.

### 6.2. Hồ sơ Xử lý Thay đổi Phạm vi Thực tế (Approved Change Request CR-01)
Thực hiện yêu cầu bắt buộc của môn học về việc đối mặt và xử lý thành công ít nhất 01 biến cố quản lý thực tế:
* **Tên biến cố:** Yêu cầu thay đổi phạm vi từ phía Khách hàng (Scope Change Request CR-01).
* **Bối cảnh phát sinh:** Vào Tuần 7, sau khi đánh giá bản demo Sprint 1, Giảng viên hướng dẫn chuyên ngành cùng cố vấn nghiệp vụ y tế đã yêu cầu bổ sung gấp tính năng *"Tiếp đón bệnh nhân bằng mã QR tại sảnh và hiển thị danh sách hàng đợi trực quan"* nhằm nâng cao tính ứng dụng thực tế và giải quyết nút thắt ùn ứ khi bệnh nhân đến tiếp đón.
* **Quy trình xử lý của Hội đồng Kiểm soát Thay đổi (CCB):**
  1. *Tiếp nhận yêu cầu:* PM ghi nhận vào biểu mẫu Change Request Form `CR-01`.
  2. *Đánh giá tác động (Impact Analysis):* Tech Lead và Backend Engineer tính toán tính năng mới cần bổ sung 12 Story Points (~25 giờ làm việc). Nếu giữ nguyên toàn bộ phạm vi ban đầu, dự án sẽ đối mặt với nguy cơ trễ hạn 1.5 tuần.
  3. *Họp thương lượng giải pháp (Scope Trade-off):* PM đã tổ chức họp với Giảng viên chuyên ngành và TS. Nguyễn Thanh Tuấn, đề xuất phương án đánh đổi: **Chấp thuận phát triển module Tiếp đón mã QR**, đồng thời **chuyển tính năng Khám bệnh từ xa qua Video call (Telemedicine) sang Giai đoạn 2 (Future Release)**.
  4. *Phê duyệt & Điều chỉnh WBS:* Biên bản thỏa thuận được các bên ký duyệt ngày 24/10/2026. PM đã cập nhật lại WBS (bổ sung gói 1.4.2 điều chỉnh), đưa các User Stories mới vào Sprint 4 Backlog và nhóm đã hoàn thành đúng hạn mà không làm vỡ lịch trình dự án.

---

## CHƯƠNG 7: NGHIỆM THU, ĐÓNG DỰ ÁN & BÀI HỌC KINH NGHIỆM (PROJECT CLOSURE, UAT & LESSONS LEARNED)

### 7.1. Kết quả Kiểm thử Chấp nhận Người dùng (UAT) & Nghiệm thu Chuyên ngành Song hành
Vào ngày 02/12/2026 (Tuần 13), nhóm đã tiến hành phiên thử nghiệm UAT và nghiệm thu kỹ thuật chuyên ngành với sự tham gia của Giảng viên hướng dẫn đồ án chuyên ngành ThS. Lê Đăng Quang cùng nhóm 20 sinh viên và cán bộ y tế VKU đóng vai trò người dùng thử nghiệm thực tế (Beta Testers):
* **100% (20/20)** ca đặt lịch qua web và quét mã QR tiếp đón diễn ra trơn tru, không xảy ra sự cố nghẽn mạng hay lỗi phần mềm.
* **85%** người dùng phản hồi giao diện dễ sử dụng, thời gian đặt hẹn trung bình chỉ mất 1.5 phút.
* Giảng viên hướng dẫn chuyên ngành ThS. Lê Đăng Quang đã đánh giá, xác nhận các tính năng kỹ thuật đáp ứng đầy đủ tiêu chí đồ án chuyên ngành và đồng thuận kết quả nghiệm thu kỹ thuật.

### 7.2. Bàn giao Sản phẩm & Tình trạng Hoạt động Thực tế
* Hệ thống Web Bệnh nhân đang vận hành công khai tại: `https://medicare-plus.vercel.app`
* Dashboard Bác sĩ & Quản trị đang vận hành tại: `https://medicare-admin.vercel.app`
* Hệ thống Backend API với tài liệu Swagger đang hoạt động ổn định tại: `https://api.medicare-plus.tech/docs`

### 7.3. Bài học Kinh nghiệm Sâu sắc (Top Lessons Learned)
1. **Bài học về Kiểm soát Phạm vi (Scope Baseline is King):** Không bao giờ đồng ý bổ sung tính năng mới một cách tùy tiện mà không thực hiện phân tích tác động và đánh đổi phạm vi (Trade-off). Việc tuân thủ quy trình CCB đã cứu dự án khỏi nguy cơ vỡ tiến độ.
2. **Bài học về Kiểm thử Đồng thời Sớm (Fail Fast on Concurrency):** Logic đặt lịch khám và giữ chỗ luôn tiềm ẩn rủi ro Race Condition nghiêm trọng. Cần thiết kế giải pháp khóa dòng CSDL (Row-level lock) và viết kịch bản load test k6 ngay từ giai đoạn MVP thay vì đợi đến cuối kỳ mới kiểm thử.
3. **Bài học về Văn hóa Phê duyệt Mã nguồn (Peer Review Culture):** Việc kích hoạt Branch Protection trên GitHub và bắt buộc ít nhất 1 thành viên review code trước khi merge đã giúp nhóm phát hiện sớm hơn 15 lỗi logic tiềm ẩn, giảm thiểu tối đa hiện tượng xung đột code (Merge Conflicts) trên nhánh `main`.

---

### PHỤ LỤC: CHECKLIST KIỂM TOÁN GÓI BẰNG CHỨNG THỰC TẾ (EVIDENCE CHECKLIST)

| STT | Tên Hạng mục Bằng chứng | Định dạng File | Trạng thái Kiểm toán | Đường dẫn / Mô tả minh chứng |
| :---: | :--- | :---: | :---: | :--- |
| **01** | Báo cáo Tổng kết Kỹ thuật (Final Technical Report) | `.pdf` | **COMPLETED** | 7 chương chuẩn, viết 100% thì quá khứ, tích hợp đầy đủ kết quả UAT & Beta test. |
| **02** | Điều lệ Dự án Đã Ký Duyệt (Project Charter Signed) | `.pdf` | **COMPLETED** | Đủ 13 mục chuẩn hóa PMBOK, có chữ ký của GV Chuyên ngành, GV QLDA và PM. |
| **03** | Cơ cấu WBS & Từ điển WBS (WBS & Dictionary) | `.pdf` | **COMPLETED** | Cây WBS chuẩn 100% Rule, 22 gói công việc 1–2 tuần có DoD chi tiết. |
| **04** | Bảng Theo dõi Rủi ro Tiến hóa (Dynamic Risk Register) | `.xlsx` | **COMPLETED** | Ma trận 5x5, tiến hóa qua Sprint 1 (W06) và Sprint 2 (W11), 6 rủi ro chi tiết. |
| **05** | Biên bản Họp Sprint Retrospectives | `.pdf` | **COMPLETED** | Biên bản Sprint 1 Retro và Final Retro theo mô hình 4Ls / Sailboat. |
| **06** | Hồ sơ Xử lý Thay đổi Phạm vi (Approved CR Record) | `.pdf` | **COMPLETED** | Hồ sơ CR-01 (Đổi Telemedicine lấy QR Check-in) có chữ ký phê duyệt của CCB. |
| **07** | Bộ Slide Thuyết trình Bảo vệ Cuối kỳ | `.pdf` | **COMPLETED** | 10 slides chuẩn thiết kế cho phiên bảo vệ 16 phút trước Hội đồng chuyên môn. |

*(Ghi chú: Theo đúng quy định Pathway 1 - Kế thừa/Song hành đồ án chuyên ngành, không yêu cầu file số 07 ký ngoài doanh nghiệp; toàn bộ kết quả nghiệm thu UAT người dùng và đánh giá của Giảng viên chuyên ngành được tích hợp trực tiếp vào Báo cáo kỹ thuật số 01).*
