# MediCare Plus — Phạm vi sản phẩm

## Người dùng và mục tiêu

Bốn vai trò nghiệp vụ: bệnh nhân/chủ hộ, tiếp đón, bác sĩ được phân công và quản trị viên. Sản phẩm minh họa chuỗi đăng nhập → đặt lịch → QR/check-in → EMR → đọc lại dữ liệu, trên Supabase PostgreSQL với Auth và RLS.

Mục tiêu là thông tin nhất quán và quyền dữ liệu đúng vai trò. Giảm thời gian chờ, đặt lịch dưới 60 giây hoặc tăng tuân thủ thuốc là mục tiêu cần đo trong UAT, chưa phải kết quả được xác nhận.

## Các phần đã có mã tích hợp

| Phần | Nguồn dữ liệu / hành vi | Nghiệm thu còn lại |
|---|---|---|
| Xác thực | Supabase Auth; role từ clinic_profiles; OTP server | Template/provider email, OAuth web/Android |
| Đặt lịch | RPC transaction/row lock/unique; ca trực và giờ trống | Hồi quy bản cuối, định danh người khám |
| Tiếp đón | Booking code, camera/nhập mã, RPC theo ngày VN | Camera giữa hai thiết bị |
| Bệnh án | EMR/đơn thuốc cloud, quyền bác sĩ và chủ lịch | UAT và phần dữ liệu/identity PR #28 |
| Gia đình | clinic_family_members, CRUD và metadata | Ledger 007, đổi phiên và liên kết ID |
| Thuốc | Tủ thuốc và log theo đơn/thuốc/cữ/ngày VN | Thao tác UI và tải lại bản cuối |
| Bệnh viện | Danh mục active; RPC thêm bởi admin | Form admin và tình huống không có bác sĩ |
| Review | Sau khám; admin_note riêng tư, moderation RPC | Luồng gửi/ẩn/xóa thực trên UI |
| Chat | clinic_consult_messages, scoped subscription + RLS | Ledger 008, hai tài khoản/thiết bị, lỗi mạng |
| Email booking | Webhook/EmailJS tùy chọn, chỉ báo gửi sau xác nhận | Thư đến thực, retry/chống trùng |
| Trợ lý | Từ khóa/luật phân luồng local, ưu tiên cấp cứu | Không phải LLM hoặc chẩn đoán đã nghiệm thu |
| BHYT/ca trực/hồ sơ | Cấu hình ước tính, phân ca và hồ sơ/avatar web | Chính sách thực, UI, picker native |

## Giới hạn sản phẩm

Redis, thanh toán online, video call, eKYC, tích hợp VssID/xác minh BHYT, sinh hiệu và kết quả xét nghiệm thực chưa triển khai. Không coi màn hình mẫu hoặc nhãn đã xác thực là bằng chứng tích hợp với cơ quan y tế. Admin thêm/duyệt bác sĩ hiện còn thao tác state; không hứa lưu cloud cho chức năng này.

Cloud snapshot có 12 bảng clinic và ledger 10 migration, trong khi source có 12 tệp SQL; #44 theo dõi chênh lệch. Các phần mở rộng không tự trở thành điều kiện demo cốt lõi hoặc được đánh dấu Done vì PR merge.

## Trách nhiệm và kiểm chứng

Sơn: PM/QA/tích hợp 30%; Thành: Tech Lead/CI/backend 22%; Vũ: Frontend/Mobile 28%; Nguyên: Full-stack/Booking 20%. Tỷ lệ do trưởng nhóm quyết định.

Trạng thái nguồn: main 602b76c, 22/11/2026. Xem [README](../README.md), [Scrum](https://github.com/users/nguyenthaison2408/projects/1) và docs/evidence. Lịch sử nguồn được giữ trong Git; tài liệu này mô tả phạm vi hiện hành, không phải biên bản UAT.
