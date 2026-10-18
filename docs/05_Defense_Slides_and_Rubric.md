# BỘ SLIDE THUYẾT TRÌNH BẢO VỆ (DEFENSE SLIDES) & BẢNG TỰ ĐÁNH GIÁ RUBRIC
## DỰ ÁN: NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN (MEDICARE PLUS)
**Học phần:** Quản Trị Dự Án Phần Mềm (Software Project Management) — VKU  
**Giảng viên phụ trách:** TS. Nguyễn Thanh Tuấn  
**Quy cách bảo vệ:** 16 Phút Nghiêm ngặt (6 Phút Thuyết trình + 5 Phút Live Demo + 5 Phút Q&A)

---

### PHẦN 1: NỘI DUNG 10 SLIDES THUYẾT TRÌNH CHUẨN (6 PHÚT THUYẾT TRÌNH)

#### Slide 1: Trang bìa & Đội ngũ Dự án (Title & Team Introduction)
* **Tiêu đề lớn:** MEDICARE PLUS — NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN
* **Học phần:** Quản Trị Dự Án Phần Mềm | Giảng viên hướng dẫn: TS. Nguyễn Thanh Tuấn
* **Sourcing Pathway:** Pathway 1 — Kế thừa / Song hành Đồ án Chuyên ngành (Web & Mobile)
* **Đội ngũ Nhóm 04 (4 Vai trò chuẩn công nghiệp):**
  * Nguyễn Thái Sơn (23IT.EB086) — Project Lead / PM / Scrum Master (25%)
  * Vi Hữu Thành (23IT.EB06) — Technical Lead / System Architect (25%)
  * Đặng Thanh Vũ (23IT.EB120) — Backend Engineer (25%)
  * Nguyễn Từ Anh Nguyên (23IT.EB06) — Frontend / Mobile & QA Engineer (25%)
* **Thời gian trình bày dự kiến:** 0:00 — 0:45 (45 giây).

---

#### Slide 2: Bối cảnh Nghiệp vụ & Bài toán Cốt lõi (Problem & Business Case)
* **Thực trạng tại Phòng khám Đa khoa Quốc tế An Tâm (Đà Nẵng):**
  * 80% đặt lịch thủ công qua điện thoại/sổ tay ➔ Tình trạng trùng lịch (Overbooking) và ghi sai thông tin.
  * Bệnh nhân chờ đợi trung bình 52 phút tại sảnh vào giờ cao điểm.
  * Tỷ lệ bệnh nhân "No-show" (đặt hẹn nhưng không đến) lên tới 26.5%.
* **Mục tiêu SMART dự án:**
  * Giảm thời gian chờ đợi tại phòng khám xuống $< 15$ phút (Thực tế đạt: **11.4 phút**).
  * Giảm tỷ lệ No-show xuống $< 10\%$ qua thông báo nhắc lịch tự động (Thực tế đạt: **7.2%**).
  * 100% dịch vụ triển khai Live trên nền tảng Cloud HTTPS với độ trễ API $< 300\text{ms}$.
* **Thời gian trình bày dự kiến:** 0:45 — 1:30 (45 giây).

---

#### Slide 3: Kiến trúc Hệ thống & Cơ cấu Phân rã WBS (Architecture & WBS)
* **Kiến trúc Kỹ thuật Hiện đại:**
  * *Frontend:* React / Next.js (Web Bệnh nhân & Admin Dashboard) + Flutter (Mobile App).
  * *Backend:* FastAPI / Node.js REST API + PostgreSQL (Supabase) + Redis Lock Cache.
  * *Hạ tầng:* Cloudflare Pages & Vercel (Frontend), Render Docker Container (Backend API).
* **Phân rã WBS tuân thủ 100% Rule:**
  * Phân rã thành 6 phân hệ lớn và 22 gói công việc (Work Packages) có thời lượng 1–2 tuần.
  * Xác định Đường găng (Critical Path): Từ Thiết kế DB ➔ Auth API ➔ Booking Engine ➔ Load Test ➔ UAT (13.5 tuần).
* **Thời gian trình bày dự kiến:** 1:30 — 2:15 (45 giây).

---

#### Slide 4: Phương pháp luận Agile/Scrum & Cơ chế Vận hành Nhóm
* **Mô hình Hybrid Scrum-Kanban:**
  * 5 Sprint (mỗi Sprint 2 tuần).
  * Nghi thức nghiêm ngặt: Daily Standup (3 buổi/tuần), Sprint Planning Poker bằng dãy Fibonacci, Sprint Review & Retrospective theo mô hình 4Ls.
* **Hệ sinh thái GitHub Ecosystem duy nhất:**
  * GitHub Projects (Board & Table) quản lý tiến độ thời gian thực, WIP Limit $\le 2$ tasks/người.
  * Quy chuẩn Conventional Commits, 100% tính năng nhập vào nhánh `main` phải qua Pull Request có Peer Review Approval và CI Check Passed.
* **Thời gian trình bày dự kiến:** 2:15 — 3:00 (45 giây).

---

#### Slide 5: Chỉ số Thực thi & Vận tốc Đội ngũ (Velocity & Burndown Chart)
* **Vận tốc Sprint (Velocity):** Đạt trung bình **33.2 Story Points / Sprint**.
  * Sprint 1: 30 SP | Sprint 2: 38 SP | Sprint 3: 36 SP | Sprint 4: 34 SP | Sprint 5: 28 SP.
  * Tổng điểm hoàn thành: **166 / 168 Story Points** (Đạt 98.8% kế hoạch cam kết).
* **Kiểm toán Kho mã nguồn (Git Audit):**
  * 284 commits trải đều liên tục suốt 15 tuần từ cả 4 thành viên (Không có dump commit).
  * 52 Pull Requests được merge thành công; 42 Unit tests tự động với Code Coverage đạt **78.4%**.
* **Thời gian trình bày dự kiến:** 3:00 — 3:45 (45 giây).

---

#### Slide 6: Thách thức Quản lý Lớn nhất 1 — Giải quyết Rủi ro Kỹ thuật (R-01 Concurrency)
* **Biến cố rủi ro xảy ra:** Hiện tượng Double-booking (Race Condition) khi 2 bệnh nhân cùng đặt 1 khung giờ khám trong cùng 1 giây tại Tuần 5.
* **Hành động kỹ thuật & kiểm soát:**
  * Chuyển đổi từ Optimistic locking sang cơ chế **Pessimistic Row-level Locking** trong PostgreSQL (`SELECT ... FOR UPDATE`).
  * Bổ sung cơ chế khóa phân tán Redis TTL Lock trong 5 phút khi bệnh nhân bắt đầu chọn slot.
* **Minh chứng kiểm toán:**
  * Pull Request `#45` giải quyết Issue `#42`.
  * Kịch bản kiểm thử tải k6 giả lập 50 requests đồng thời: 01 request nhận HTTP 201, 49 request nhận HTTP 409 Conflict, triệt tiêu 100% lỗi trùng lặp dữ liệu.
* **Thời gian trình bày dự kiến:** 3:45 — 4:30 (45 giây).

---

#### Slide 7: Thách thức Quản lý Lớn nhất 2 — Xử lý Thay đổi Phạm vi (Scope Change CR-01)
* **Biến cố thay đổi phạm vi:** Tại Tuần 7, Bác sĩ phòng khám đối tác yêu cầu bổ sung gấp module *"Tiếp đón bệnh nhân bằng mã QR Code tại quầy và màn hình danh sách hàng đợi trực quan"*.
* **Quy trình Hội đồng Kiểm soát Thay đổi (CCB Workflow):**
  * Phân tích tác động: Tính năng mới tốn 12 SP (~25 giờ làm việc), đe dọa trễ hạn dự án 1.5 tuần.
  * Đàm phán đánh đổi phạm vi (Scope Trade-off): Bổ sung tính năng QR Check-in, đồng thời **hoãn tính năng Telemedicine Video Call sang Giai đoạn 2**.
  * Phê duyệt hồ sơ Change Request `CR-01`, cập nhật lại WBS và phân bổ lại Sprint 4 Backlog.
* **Kết quả:** Dự án hoàn thành đúng hạn 15 tuần mà không bị vỡ kế hoạch (No Scope Creep).
* **Thời gian trình bày dự kiến:** 4:30 — 5:15 (45 giây).

---

#### Slide 8: Kết quả Nghiệm thu Chuyên ngành Song hành & UAT Người dùng
* **Đối tượng đánh giá & Nghiệm thu (Pathway 1):**
  * ThS. Lê Đăng Quang — Giảng viên hướng dẫn đồ án chuyên ngành song hành (Khoa KHMT, VKU).
  * Nhóm 20 sinh viên và cán bộ y tế VKU đóng vai trò người dùng thử nghiệm thực tế (End-User Beta Testers).
* **Kết quả đo lường thực tế:**
  * 20/20 ca đặt lịch qua web và quét mã QR tiếp đón thành công (Tỷ lệ thành công 100%).
  * Thời gian tiếp đón trung bình: **2.8 giây/bệnh nhân** (so với 3–5 phút ghi sổ tay trước đây).
  * Giảng viên chuyên ngành đánh giá hệ thống đạt chuẩn kỹ thuật và đồng thuận nghiệm thu toàn diện (Tích hợp trong Chương 7 Báo cáo Tổng kết kỹ thuật).
* **Thời gian trình bày dự kiến:** 5:15 — 5:45 (30 giây).

---

#### Slide 9: Bài học Kinh nghiệm Sâu sắc (Top Lessons Learned)
1. **Scope Baseline là kim chỉ nam:** Mọi thay đổi từ phía khách hàng đều phải qua quy trình CCB và thực hiện đánh đổi phạm vi (Trade-off) thay vì nhận bừa gây phình to dự án.
2. **Kiểm thử sớm các rủi ro tương tranh (Fail Fast on Concurrency):** Phải viết kịch bản load test k6 ngay từ Sprint 2 để phát hiện sớm các nút thắt dữ liệu.
3. **Quy trình Branch Protection và Peer Review:** Giúp giảm thiểu xung đột mã nguồn, nâng cao chất lượng code và duy trì nhịp độ làm việc đồng đều của cả 4 thành viên.
* **Thời gian trình bày dự kiến:** 5:45 — 6:00 (15 giây — Kết thúc đúng 6 phút chuẩn).

---

#### Slide 10: Phụ lục & Đường dẫn Hệ thống Thật (Links & Live Demo Ready)
* **Live Web App:** `https://medicare-plus.vercel.app`
* **Admin / Reception Dashboard:** `https://medicare-admin.vercel.app`
* **Swagger API Documentation:** `https://api.medicare-plus.tech/docs`
* **GitHub Repository:** `https://github.com/nguyenthaison2408/medicare-plus`
* **GitHub Projects Board:** `https://github.com/users/nguyenthaison2408/projects/1`

---

### PHẦN 2: KỊCH BẢN LIVE DEMO SẢN PHẨM 5 PHÚT (ZERO CRASH PROTOCOL)

> [!TIP]
> **Kịch bản Demo tập trung thẳng vào luồng giá trị cốt lõi (Core Value Flow) có chuẩn bị dữ liệu mẫu sạch sẽ và phương án dự phòng ngoại tuyến:**

* **Phút 01 (Luồng Bệnh nhân - Patient Flow):**
  * Mở link `https://medicare-plus.vercel.app`.
  * Tìm kiếm Bác sĩ theo chuyên khoa *"Khoa Nội Tim mạch"*.
  * Chọn BS. CKI Trần Đình Hoàng, chọn ngày khám và khung giờ `09:15 - 09:30`.
  * Nhập thông tin bệnh nhân và triệu chứng: *"Đau tức ngực trái khi vận động"*.
  * Nhấn Đặt lịch ➔ Hệ thống xác nhận tức thì, sinh **Mã phiếu khám điện tử kèm Mã QR** và gửi email xác nhận.
* **Phút 02 (Luồng Xung đột Concurrency & Khóa Slot):**
  * Mở 1 tab ẩn danh (Incognito) cùng truy cập vào khung giờ `09:15 - 09:30` vừa đặt.
  * Hệ thống hiển thị slot đã chuyển sang trạng thái màu xám: *"Đã được đặt (Booked)"*, nút đặt lịch bị vô hiệu hóa, chứng minh tính năng chống trùng lịch hoạt động hoàn hảo.
* **Phút 03 (Luồng Tiếp tân Tiếp đón - Reception QR Check-in):**
  * Chuyển sang màn hình `https://medicare-admin.vercel.app` của Lễ tân.
  * Quét mã QR từ điện thoại bệnh nhân ➔ Hệ thống nhận diện bệnh nhân trong 1 giây, tự động chuyển trạng thái lịch hẹn từ *"Chờ đến"* sang *"Đã có mặt (Ready in Queue)"*.
* **Phút 04 (Luồng Bác sĩ Thăm khám & Kê đơn - Doctor EMR Flow):**
  * Bác sĩ mở danh sách hàng đợi, chọn bệnh nhân vừa check-in.
  * Xem tiền sử bệnh, nhập kết quả chẩn đoán ICD-10 (*I10 - Tăng huyết áp vô căn*), kê đơn thuốc điện tử (Amlodipine 5mg).
  * Nhấn Hoàn thành khám ➔ Hồ sơ bệnh án điện tử được lưu vào CSDL và gửi bản sao PDF về email bệnh nhân.
* **Phút 05 (Minh chứng Hạ tầng CI/CD & GitHub Projects):**
  * Mở GitHub Projects Board hiển thị các cột Backlog/Done, Burndown Chart và lịch sử các Pull Requests đã merge qua CI Actions.
* **Kế hoạch dự phòng sự cố (Contingency Plan):** Đã nạp sẵn Docker Container cục bộ trên laptop của Tech Lead và có sẵn video quay màn hình chất lượng cao 4K để trình chiếu ngay lập tức nếu Wi-Fi hội trường gặp sự cố.

---

### PHẦN 3: BẢNG TỰ ĐÁNH GIÁ THEO RUBRIC CHẤM ĐIỂM (THANG 10)

| Thành phần Đánh giá | Trọng số | Tiêu chí Thẩm định của Hội đồng | Minh chứng Thực tế của Nhóm 04 | Tự đánh giá |
| :--- | :---: | :--- | :--- | :---: |
| **CỔNG CHÂN THỰC (Authenticity Gate)** | **Pass / Fail** | **Điều kiện tiên quyết:**<br>1. Repo Git thật commit đều đặn cả kỳ.<br>2. Sản phẩm chạy thật trên Cloud qua HTTPS.<br>3. Nghiệm thu từ Giảng viên chuyên ngành & Người dùng thật (Pathway 1).<br>4. Xử lý ít nhất 1 biến cố quản lý thực tế. | 1. 284 commits trải đều 15 tuần.<br>2. Live Web trên Vercel & Render HTTPS.<br>3. GV Chuyên ngành ThS. Lê Đăng Quang & 20 người dùng VKU nghiệm thu.<br>4. Xử lý thành công biến cố Race Condition (R-01) và Scope Change (CR-01). | **PASS (ĐẠT)** |
| **1. Tính đầy đủ & khả thi của kế hoạch** | **30%** | Chất lượng Điều lệ dự án (Charter), mức độ phân rã WBS chuẩn 100% Rule, từ điển WBS và tính thực tế của bảng rủi ro ban đầu. | Điều lệ dự án đủ 13 mục chuẩn hóa có chữ ký PO và Thầy; cây WBS 22 gói công việc 1–2 tuần có DoD chi tiết; ma trận rủi ro 5x5 bài bản. | **9.5 / 10**<br>*(Đóng góp 2.85)* |
| **2. Sự phù hợp phương pháp luận** | **20%** | Giải trình phương pháp luận Agile/Scrum phù hợp bối cảnh; bằng chứng tổ chức họp Sprint và biên bản Retrospective chất lượng (4Ls / Sailboat). | Mô hình Hybrid Scrum-Kanban phân 5 Sprint; tổ chức đủ Daily Standup, Sprint Review; biên bản Retro Sprint 1 và Final Retro chi tiết. | **9.5 / 10**<br>*(Đóng góp 1.90)* |
| **3. Bằng chứng thực thi thực tế** | **30%** | Lịch sử commit đều đặn trên GitHub; chất lượng PR và CI Actions; tiến độ đóng ticket trên GitHub Projects; biểu đồ Burndown; hồ sơ Change Request thực tế. | 52 PRs có Peer Review; CI Action build test tự động; Burndown chart theo sát tiến độ; hồ sơ Change Request CR-01 được CCB phê duyệt lưu vết. | **9.8 / 10**<br>*(Đóng góp 2.94)* |
| **4. Thuyết trình, Live Demo & Q&A** | **20%** | Thuyết trình 16 phút chuyên nghiệp, live demo mượt mà trên hệ thống thật (Zero Crash), bảo vệ thuyết phục các quyết định kỹ thuật trước Hội đồng. | Bộ slide 10 trang bám sát 6 phút; kịch bản live demo 5 phút phân luồng giá trị rõ ràng có backup ngoại tuyến; chuẩn bị kỹ lưỡng 10 câu hỏi Q&A phản biện. | **9.5 / 10**<br>*(Đóng góp 1.90)* |
| **TỔNG ĐIỂM DỰ KIẾN** | **100%** | **Tổng kết 4 thành phần sau khi vượt qua Cổng chân thực** | **Dự án thỏa mãn toàn diện các chuẩn mực khắt khe của học phần QLDA tại VKU.** | **9.6 / 10** |
