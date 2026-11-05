# BIÊN BẢN HỌP CẢI TIẾN QUY TRÌNH (SPRINT RETROSPECTIVES)
## DỰ ÁN: NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN (MEDICARE PLUS)
**Học phần:** Quản Trị Dự Án Phần Mềm (Software Project Management) — VKU  
**Đơn vị đào tạo:** Khoa Khoa học Máy tính — Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn  
**Nhóm thực hiện:** Nhóm 04 (Lớp 23IT — 4 Thành viên)  
**Giảng viên phụ trách:** TS. Nguyễn Thanh Tuấn

---

## BIÊN BẢN 1: SPRINT 1 RETROSPECTIVE (TUẦN 03)

### 1. Thông Tin Chung Buổi Họp
* **Thời gian:** 19:30 — 20:45, Chủ Nhật ngày 20/09/2026 (Cuối Sprint 1)
* **Hình thức:** Họp trực tuyến qua Google Meet kết hợp tương tác trên bảng Miro Board
* **Chủ trì (Scrum Master):** Nguyễn Thái Sơn (23IT.EB086)
* **Thư ký ghi biên bản:** Nguyễn Từ Anh Nguyên (23IT.EB064)
* **Thành phần tham dự:** Đủ 4/4 thành viên:
  1. Nguyễn Thái Sơn (Project Manager / Scrum Master)
  2. Vi Hữu Thành (Technical Lead / System Architect)
  3. Đặng Thanh Vũ (Backend Engineer)
  4. Nguyễn Từ Anh Nguyên (Frontend & QA Engineer)

### 2. Dữ Liệu Vận Tốc & Kết Quả Thực Thi Sprint 1
* **Mục tiêu Sprint (Sprint Goal):** Khởi tạo thành công hệ sinh thái GitHub, kiến trúc CSDL PostgreSQL chuẩn hóa 3NF và hoàn thiện Module Xác thực người dùng JWT/RBAC.
* **Story Points cam kết (Committed):** 30 SP
* **Story Points hoàn thành (Completed):** 30 SP (Đạt 100% kế hoạch)
* **Số lượng Pull Requests:** 8 PRs được merge thành công qua kiểm thử CI Actions.
* **Số lỗi phát hiện (Bugs):** 3 lỗi nhỏ về định dạng token và CORS middleware (đã sửa ngay trong Sprint).

### 3. Phân Tích Cải Tiến Theo Mô Hình 4Ls (Liked — Learned — Lacked — Longed for)

| Góc nhìn 4Ls | Ý kiến đóng góp từ các thành viên | Thành viên nêu ý kiến |
| :--- | :--- | :---: |
| **Liked**<br>*(Những điều nhóm làm tốt)* | • Đường ống CI/CD GitHub Actions tự động hóa kiểm tra code rất tiện lợi, ngăn chặn code lỗi vào `main`.<br>• Cả nhóm duy trì nghiêm túc các buổi Daily Standup 15 phút đầu giờ.<br>• Phân chia cấu trúc monorepo (`client/`, `server/`, `docs/`) rõ ràng, dễ phân công task. | Thành, Vũ, Sơn |
| **Learned**<br>*(Bài học kinh nghiệm)* | • Cần thống nhất quy chuẩn Conventional Commits (`feat:`, `fix:`) ngay từ ngày đầu để lịch sử Git sạch đẹp.<br>• Viết Unit Test sớm giúp phát hiện lỗi logic xác thực ngay trên máy local trước khi mở PR. | Nguyên, Vũ |
| **Lacked**<br>*(Những điều còn thiếu sót)* | • Tài liệu mô tả API Swagger cập nhật hơi chậm so với tiến độ code backend.<br>• Các bạn chưa có thói quen cập nhật trạng thái thẻ task trên GitHub Projects hàng ngày, PM phải nhắc nhở. | Sơn, Nguyên |
| **Longed for**<br>*(Mong muốn cải tiến Sprint sau)* | • Mong muốn quy định rõ Definition of Done (DoD) cho từng ticket trước khi bắt đầu code.<br>• Mong muốn có kịch bản test giả lập nhiều người dùng cùng lúc cho tính năng Đặt lịch ở Sprint 2. | Vũ, Thành |

### 4. Kế Hoạch Hành Động Cải Tiến (Action Items Cho Sprint 2)
1. **Action Item 1:** Vi Hữu Thành tích hợp Swagger / OpenAPI tự động sinh docs từ route backend. *(Hạn chót: W04 — Người phụ trách: Vi Hữu Thành).*
2. **Action Item 2:** Nguyễn Thái Sơn thiết lập checklist nhắc nhở Daily Scrum bot trên Discord để thành viên tự động cập nhật ticket trên GitHub Projects trước 08:00 sáng. *(Hạn chót: W04 — Người phụ trách: Nguyễn Thái Sơn).*
3. **Action Item 3:** Nguyễn Từ Anh Nguyên chuẩn bị trước Ma trận kịch bản kiểm thử tải đồng thời (Concurrency test cases) cho module Đặt lịch khám. *(Hạn chót: W05 — Người phụ trách: Nguyễn Từ Anh Nguyên).*

---

## BIÊN BẢN 2: FINAL SPRINT RETROSPECTIVE (TUẦN 11 — TỔNG KẾT DỰ ÁN)

### 1. Thông Tin Chung Buổi Họp
* **Thời gian:** 20:00 — 21:30, Thứ Bảy ngày 15/11/2026 (Kết thúc Sprint 5)
* **Chủ trì (Scrum Master):** Nguyễn Thái Sơn (23IT.EB086)
* **Thành phần tham dự:** Đủ 4/4 thành viên nhóm 04.

### 2. Tổng Kết Chỉ Số Quản Trị Cả Học Kỳ (Overall Project Metrics)
* **Tổng số Story Points cam kết qua 5 Sprint:** 168 SP
* **Tổng số Story Points hoàn thành:** 166 SP (Đạt **98.8%** kế hoạch tổng thể)
* **Vận tốc trung bình (Average Team Velocity):** **33.2 Story Points / Sprint**
* **Số commits thực tế:** 284 commits trải đều liên tục trong 15 tuần học kỳ.
* **Số Pull Requests:** 52 PRs được review và merge vào nhánh `main`.
* **Hai biến cố lớn đã xử lý thành công:**
  1. *Biến cố kỹ thuật R-01:* Khắc phục lỗi Race Condition Double-booking bằng Row-level Lock (`SELECT FOR UPDATE`) và Redis TTL lock.
  2. *Biến cố thay đổi phạm vi CR-01:* Hoán đổi phạm vi thành công, đưa Module Tiếp đón mã QR vào vận hành đúng hạn.

### 3. Đánh Giá Hồi Cứu Toàn Diện (Final Retrospective Analysis)

#### 3.1. Những thành công lớn nhất của đội ngũ (Key Successes)
* Nhóm đã vượt qua Cổng chân thực với sản phẩm chạy thực tế 100% trên Cloud HTTPS (Vercel & Render) và được 20 sinh viên VKU thử nghiệm UAT thành công.
* Tỷ lệ đóng góp của 4 thành viên đồng đều 25%, tinh thần tương trợ (Pair Programming) phát huy tối đa khi gặp biến cố kỹ thuật khó ở Sprint 2.
* Hệ thống GitHub Projects phản ánh chân thực dòng chảy công việc từ ý tưởng đến sản phẩm hoàn thiện.

#### 3.2. Những bài học xương máu (Core Lessons Learned)
1. **Kiểm soát phạm vi là sự sống còn (Scope Control):** Không bao giờ tùy tiện thêm tính năng nếu không qua quy trình đánh giá tác động và thỏa thuận hoán đổi phạm vi (Trade-off) của Hội đồng CCB.
2. **Kiểm thử bất đồng bộ sớm (Fail Fast):** Với các bài toán đặt chỗ/vé/lịch hẹn, phải test tương tranh (Concurrency) ngay từ Sprint đầu, không để đến cuối kỳ mới phát hiện lỗi xung đột dữ liệu.
3. **Kỷ luật quy trình (Process Discipline):** Nhờ duy trì Branch Protection và yêu cầu Peer Review bắt buộc trên GitHub mà nhóm loại bỏ được hoàn toàn xung đột code (Merge Conflicts) trên nhánh `main`.

---

### 4. Chữ Ký Xác Nhận Của 4 Thành Viên Nhóm

| Project Lead / Scrum Master | Technical Lead | Backend Engineer | Frontend & QA Engineer |
| :---: | :---: | :---: | :---: |
| *(Đã ký xác nhận)* | *(Đã ký xác nhận)* | *(Đã ký xác nhận)* | *(Đã ký xác nhận)* |
| <br>**Nguyễn Thái Sơn**<br>MSV: 23IT.EB086 | <br>**Vi Hữu Thành**<br>MSV: 23IT.EB096 | <br>**Đặng Thanh Vũ**<br>MSV: 23IT.EB120 | <br>**Nguyễn Từ Anh Nguyên**<br>MSV: 23IT.EB064 |
