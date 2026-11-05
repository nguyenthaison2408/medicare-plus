# HỒ SƠ KIỂM SOÁT THAY ĐỔI PHẠM VI (SCOPE CHANGE CONTROL RECORD)
## DỰ ÁN: NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN (MEDICARE PLUS)
**Học phần:** Quản Trị Dự Án Phần Mềm (Software Project Management) — VKU  
**Mã hồ sơ yêu cầu thay đổi:** `CR-01` | **Ngày lập:** 20/10/2026 (Tuần 07)  
**Dự án:** `VKU-SPM-MEDICARE` | **Phiên bản:** v1.0 (Approved)

---

### PHẦN 1: THÔNG TIN TIẾP NHẬN YÊU CẦU THAY ĐỔI (CHANGE REQUEST INTAKE)

* **Tên yêu cầu thay đổi:** Bổ sung Module Tiếp đón bệnh nhân bằng Mã QR tại quầy và Màn hình Hàng đợi khám trực quan.
* **Người đề xuất yêu cầu:** ThS. Lê Đăng Quang (Giảng viên hướng dẫn chuyên ngành) & Bác sĩ cố vấn chuyên môn y tế.
* **Người tiếp nhận & Lập hồ sơ:** Nguyễn Thái Sơn (Project Manager / Scrum Master).
* **Ngày đề xuất:** 20/10/2026 (Sau buổi Demo Sprint 1 & giữa Sprint 3).
* **Mô tả chi tiết nội dung thay đổi:**
  * Bổ sung tính năng sinh mã QR điện tử tích hợp vào Phiếu khám sau khi bệnh nhân đặt lịch thành công.
  * Xây dựng giao diện quét/nhập mã QR tại quầy tiếp tân, hỗ trợ lễ tân đối soát thông tin bệnh nhân trong dưới 3 giây.
  * Tự động cập nhật trạng thái lịch hẹn từ `CONFIRMED` sang `CHECKED_IN` và đưa bệnh nhân vào Hàng đợi chờ khám của bác sĩ theo thời gian thực.
* **Lý do & Sự cần thiết (Business Justification):**
  * Trong buổi đánh giá quy trình tiếp đón thực tế, phương án đọc tên hoặc đọc số điện thoại tại quầy gây ồn ào, mất thời gian (trung bình 3–5 phút/ca) và dễ nhầm lẫn giữa các bệnh nhân trùng tên.
  * Việc áp dụng mã QR tiếp đón giải quyết triệt để nút thắt cổ chai tại sảnh chờ, nâng cao tính chuyên nghiệp và hiện đại hóa cho hệ thống.

---

### PHẦN 2: PHÂN TÍCH TÁC ĐỘNG TOÀN DIỆN (IMPACT ANALYSIS)

Nhóm kỹ thuật (Tech Lead Vi Hữu Thành & Backend Đặng Thanh Vũ) đã phối hợp với QA Nguyễn Từ Anh Nguyên thực hiện đánh giá tác động đa chiều:

| Khía cạnh đánh giá | Phân tích chi tiết tác động | Mức độ tác động |
| :--- | :--- | :---: |
| **1. Phạm vi (Scope)** | Phải bổ sung thêm 02 User Stories mới vào hệ thống:<br>• `US-QR-01`: API xác thực và tiếp đón bằng mã QR (`/appointments/check-in`).<br>• `US-QR-02`: Giao diện Dashboard quét mã QR và bảng hàng đợi trực quan cho tiếp tân.<br>Tổng Story Points bổ sung: **12 SP** (~25 giờ công phát triển và kiểm thử). | **CAO** |
| **2. Tiến độ (Schedule)** | Nếu giữ nguyên toàn bộ phạm vi ban đầu và không cắt giảm, tổng khối lượng công việc sẽ vượt quá năng lực (Capacity) của Sprint 4, đe dọa làm trễ hạn bàn giao dự án từ **1.0 đến 1.5 tuần**. | **NGHIÊM TRỌNG** |
| **3. Ngân sách & Chi phí** | Sử dụng thư viện nguồn mở `qrcode.react` và logic API nội bộ, không làm phát sinh thêm chi phí bản quyền phần mềm hay hạ tầng cloud (0 VNĐ). | **KHÔNG** |
| **4. Rủi ro kỹ thuật** | Tăng độ phức tạp kiểm thử tương tranh giữa việc Check-in tại quầy và Bác sĩ gọi khám trên hệ thống thời gian thực. | **TRUNG BÌNH** |

---

### PHẦN 3: PHƯƠNG ÁN ĐÁNH ĐỔI PHẠM VI (SCOPE TRADE-OFF STRATEGY)

Để đảm bảo nguyên tắc vàng **"Thời hạn 15 tuần học kỳ là bất biến (Time-boxed)"**, PM Nguyễn Thái Sơn đã chủ trì phiên họp kỹ thuật và đề xuất phương án đánh đổi phạm vi (Scope Trade-off):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          CHIẾN LƯỢC ĐÁNH ĐỔI PHẠM VI (TRADE-OFF)                       │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│   ➕ BỔ SUNG VÀO PHẠM VI SPRINT 4:       │   ➖ CẮT GIẢM / HOÃN SANG GIAI ĐOẠN 2:      │
│   • Module Tiếp đón bằng Mã QR tại quầy  │   • Module Khám bệnh từ xa qua Video call   │
│   • Màn hình Hàng đợi tiếp tân trực quan │     (Telemedicine WebRTC)                   │
│   (Khối lượng: +12 Story Points)         │   (Khối lượng giải phóng: -14 Story Points) │
└──────────────────────────────────────────┴─────────────────────────────────────────────┘
```

* **Lý do lựa chọn tính năng đánh đổi:** Module Video Call Telemedicine có độ phức tạp hạ tầng mạng cao (cần cấu hình STUN/TURN server), không phải là luồng giá trị cốt lõi của bài toán tiếp đón tại phòng khám trực tiếp. Việc hoãn sang Version 2.0 giải phóng được 14 Story Points, hoàn toàn đủ bù đắp cho 12 Story Points của module QR Check-in.
* **Kế hoạch điều chỉnh WBS:**
  * Bổ sung gói công việc: `WP 1.4.2: Dashboard Tiếp đón Bệnh nhân bằng Mã QR`.
  * Đưa 2 User Stories mới vào Sprint Backlog của **Sprint 4 (Tuần 8 — Tuần 9)**.
  * Tiến độ tổng thể của toàn dự án được bảo toàn nguyên vẹn 100%.

---

### PHẦN 4: PHÊ DUYỆT CỦA HỘI ĐỒNG KIỂM SOÁT THAY ĐỔI (CCB APPROVAL)

Cuộc họp Hội đồng Kiểm soát Thay đổi (Change Control Board - CCB) diễn ra vào ngày 24/10/2026 với sự tham gia đầy đủ của các bên liên quan:

* **Quyết định chính thức:** **APPROVED (CHẤP THUẬN TOÀN BỘ PHƯƠNG ÁN ĐÁNH ĐỔI)**
* **Hiệu lực thi hành:** Áp dụng ngay từ đầu Sprint 4 (Tuần 8, bắt đầu ngày 26/10/2026).
* **Kết quả thực tế bàn giao:** Module QR Check-in được hoàn thiện và tích hợp vào ngày 28/11/2026, thời gian tiếp đón đo lường thực tế đạt **2.8 giây/bệnh nhân**, vượt chỉ tiêu kỳ vọng.

#### Bảng Chữ Ký Phê Duyệt Của Hội Đồng CCB

| Đại diện Giảng viên QLDA | Giảng viên Hướng dẫn Chuyên ngành | Technical Lead | Project Manager |
| :---: | :---: | :---: | :---: |
| *(Đã phê duyệt)* | *(Đã phê duyệt)* | *(Đã thẩm định kỹ thuật)* | *(Đã cam kết tiến độ)* |
| <br>**TS. Nguyễn Thanh Tuấn**<br>Khoa KHMT — VKU | <br>**ThS. Lê Đăng Quang**<br>Khoa KHMT — VKU | <br>**Vi Hữu Thành**<br>MSV: 23IT.EB096 | <br>**Nguyễn Thái Sơn**<br>MSV: 23IT.EB086 |
| *Ngày duyệt: 24/10/2026* | *Ngày duyệt: 24/10/2026* | *Ngày ký: 24/10/2026* | *Ngày ký: 24/10/2026* |
