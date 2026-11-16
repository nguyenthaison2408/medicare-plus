# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

1. **Bệnh nhân & Chủ hộ gia đình tại Việt Nam (Primary):**
   - Người trưởng thành đi làm (25–45 tuổi) vừa đặt lịch khám chuyên khoa cho bản thân, vừa quản lý hồ sơ sức khỏe, lịch tiêm chủng và nhắc uống thuốc cho con nhỏ và cha mẹ lớn tuổi.
   - Tình huống sử dụng: Khi xuất hiện triệu chứng bất thường cần sàng lọc nhanh với Trợ lý AI, đặt lịch khám trước để không phải xếp hàng chờ đợi từ sáng sớm tại các bệnh viện tuyến cuối (BV Đại học Y Dược, BV Chợ Rẫy, BV Mắt TP.HCM, BV Vinmec), tra cứu kết quả MRI/xét nghiệm, hoặc theo dõi lịch uống thuốc hàng ngày.
2. **Bác sĩ điều trị (Doctor Portal):**
   - Bác sĩ chuyên khoa đang trực tại phòng khám hoặc tư vấn từ xa, cần theo dõi hàng đợi số thứ tự (STT) đã check-in QR, xem nhanh bệnh án điện tử (EHR) kèm cảnh báo dị ứng thuốc, và kê đơn thuốc điện tử đồng bộ tức thì sang máy bệnh nhân.
3. **Quản trị viên cơ sở y tế (Admin Portal):**
   - Điều phối viên và quản trị hệ thống theo dõi KPI vận hành theo thời gian thực, quản lý danh sách bác sĩ trực chuyên khoa và điều phối lịch hẹn toàn viện.

## Product Purpose

**SmartClinic** là hệ sinh thái y tế số đa nền tảng (iOS & Android) giúp số hóa trọn vẹn hành trình khám chữa bệnh tại Việt Nam: từ bước sàng lọc triệu chứng bằng AI 24/7, đặt lịch khám chuyên khoa, thanh toán viện phí đa phương thức (hoặc giữ chỗ đối chiếu BHYT tại viện), dẫn đường tới đúng cổng/hầm gửi xe bệnh viện, cho đến lưu trữ Hồ sơ bệnh án điện tử (EHR), quản lý tủ thuốc gia đình và nhắc lịch uống thuốc thông minh.

Thành công của sản phẩm được đo bằng việc bệnh nhân hoàn tất đặt lịch khám trong dưới 60 giây, nắm rõ thông tin phòng khám/số thứ tự/cổng vào mà không bối rối tại bệnh viện, và duy trì tỷ lệ tuân thủ phác đồ uống thuốc cao.

## Positioning

Khác với các ứng dụng đặt lịch đơn thuần chỉ dừng ở bước lấy số hẹn, **SmartClinic** kết nối đồng bộ 2 chiều theo thời gian thực giữa **3 vai trò (Bệnh nhân ⇄ Bác sĩ ⇄ Admin)** trong cùng một nền tảng, đồng thời bản địa hóa sâu cho quy trình khám chữa bệnh tại Việt Nam:
- Hỗ trợ quy trình **"Giữ chỗ BHYT — Đối chiếu VssID/CCCD gắn chip tại Kiosk"** song song với thanh toán trực tuyến (**VietQR 24/7, VNPAY-QR, Ví MoMo**).
- Tích hợp bản đồ dẫn đường thực tế đến tận **cổng vào khám và hầm giữ xe** của từng bệnh viện lớn tại TP.HCM.
- Bảo vệ quyền riêng tư y tế với cơ chế **PII Masking** (ẩn số CCCD và mã thẻ BHYT mặc định, bật/tắt chủ động khi xuất trình tại quầy).

## Operating Context

- **Môi trường sử dụng thực tế:** Bệnh nhân sử dụng bằng một tay trên điện thoại di động khi đang di chuyển đến bệnh viện, đứng tại quầy tiếp đón/Kiosk tự động để quét mã QR check-in, hoặc xem lịch uống thuốc tại nhà trong điều kiện ánh sáng đa dạng.
- **Tài liệu & Định danh thực tế:** Thẻ Bảo hiểm Y tế (BHYT / VssID), Căn cước công dân (CCCD) gắn chip, Mã phiếu hẹn (`#SC-...`), Mã bệnh nhân (`#BN-...`), Đơn thuốc điện tử (`#DT-...`), và phân loại bệnh tật quốc tế ICD-10.
- **Tích hợp thiết bị:** Deep linking trực tiếp sang Google Maps / Apple Maps để dẫn đường theo phương tiện (Xe máy, Ô tô, Đi bộ), gọi thẳng tổng đài cấp cứu (`tel:`), và xuất/chia sẻ phiếu khám hoặc đơn thuốc qua Native OS Share Sheet (Zalo, Messenger, Email).

## Capabilities and Constraints

- **Nền tảng kỹ thuật:** Expo (SDK 58) + React Native (0.88) + TypeScript (Strict mode).
- **Kiến trúc dữ liệu Offline-First:** Sử dụng `AppContext` kết hợp lưu trữ bền vững `@react-native-async-storage/async-storage` và tầng dịch vụ RESTful `src/services/apiClient.ts` (hỗ trợ JWT Auth & tự động fallback về bộ nhớ máy khi chạy không cần Backend).
- **Hiệu năng & Chuyển động:** Toàn bộ animation sử dụng React Native `Animated` API với `useNativeDriver: true` đảm bảo 60 FPS mượt mà trên cả thiết bị cấu hình tầm trung.
- **Bảo mật & Quyền riêng tư:** Mặc định che thông tin định danh nhạy cảm (CCCD `079201******`, BHYT `DN4 79 *** 82390`); kiểm tra hợp lệ dữ liệu đầu vào (SĐT 10 số Việt Nam, email, mật khẩu).

## Brand Commitments

- **Tên sản phẩm:** SmartClinic
- **Ngôn ngữ & Giọng điệu:** Tiếng Việt chuẩn y khoa nhưng gần gũi, rõ ràng, trấn an tâm lý người bệnh; tránh thuật ngữ gây hoang mang và luôn đi kèm hướng dẫn hành động cụ thể.

## Evidence on Hand

- **Dữ liệu lâm sàng & Cơ sở y tế thực tế (`src/data/mockData.ts`):** Tọa độ GPS, địa chỉ, cổng vào, hầm gửi xe và hotline thực tế của 4 bệnh viện lớn tại TP.HCM (BV Đại học Y Dược TP.HCM, BV Chợ Rẫy, BV Đa khoa Quốc tế Vinmec, BV Mắt TP.HCM).
- **Hệ thống màn hình & Component hoàn chỉnh (`src/screens/`, `src/components/`):** Đầy đủ luồng Xác thực 3 vai trò, Trang chủ, Hồ sơ EHR, Lịch khám, Trợ lý AI, Đặt lịch & Thanh toán 4 phương thức, Vé khám QR, Tư vấn từ xa, Hồ sơ gia đình, Tủ thuốc & Nhật ký uống thuốc, Cổng Bác sĩ và Cổng Admin.

## Product Principles

1. **Rõ ràng lâm sàng trong 3 giây (Clinical Clarity First):** Thông tin quan trọng nhất với người bệnh (Số thứ tự, Giờ khám, Phòng khám, Cảnh báo dị ứng, Liều thuốc) phải nổi bật ngay lập tức nhờ phân cấp thị giác rõ ràng.
2. **Bản địa hóa thực tiễn cho Y tế Việt Nam:** Mọi luồng nghiệp vụ đều tôn trọng thói quen thực tế của bệnh nhân Việt Nam (khám BHYT đúng tuyến/thông tuyến, đi xe máy gửi hầm, chuyển khoản VietQR, chia sẻ phiếu khám qua Zalo cho người nhà).
3. **Liên thông tức thì & Bền vững (Zero Dead-Ends):** Không có nút bấm giả lập vô nghĩa; mọi thao tác đặt lịch, hủy lịch, kê đơn hay thêm người thân đều cập nhật xuyên suốt giữa các màn hình và lưu bền vững trên thiết bị.
4. **An toàn & Tôn trọng quyền riêng tư (Privacy by Default):** Thông tin định danh cá nhân (CCCD, BHYT) và cảnh báo tương tác thuốc luôn được bảo vệ và hiển thị có kiểm soát.

## Accessibility & Inclusion

- Phục vụ đa dạng độ tuổi từ người trẻ đến người cao tuổi (như hồ sơ cha mẹ 60+ tuổi): vùng chạm tối thiểu đạt chuẩn cảm ứng di động, độ tương phản chữ cao trên nền sáng sạch sẽ, hỗ trợ đầy đủ `accessibilityRole` và `accessibilityLabel` tiếng Việt cho trình đọc màn hình.

