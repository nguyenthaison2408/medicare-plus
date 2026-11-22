# Kết quả kiểm thử trợ lý triệu chứng và cổng phòng khám

Ngày kiểm tra: 20/11/2026. Module AI: Vi Hữu Thành; cổng phòng khám: Đặng Thanh Vũ. Các bản sửa được review và tích hợp trong PR #31 và #32.

## Kiểm thử tự động cục bộ

| Bộ kiểm tra | Kết quả và phạm vi |
| --- | --- |
| `npm run test:ai` | 16 test đạt: từ khóa cảnh báo, ưu tiên cấp cứu ở đúng luồng màn hình, giới hạn catalog cloud, dữ liệu dị ứng mẫu và câu trả lời cũ/lặp. |
| `npm run test:portal` | 17 test đạt: vai trò từ profile, callback đúng scheme/host, pending write khi đổi phiên, giữ điện thoại khi chỉ đổi ảnh, sửa ca theo ID, xóa không có bản ghi và không tự gán nhóm máu/giới tính. |
| `npm run test:db` | 29 kiểm tra PostgreSQL lõi và 76 kiểm tra mở rộng đạt trong PGlite cục bộ; gồm quyền đọc admin_note và ca trực trong API giờ trống/đặt lịch. |
| Client lint / TypeScript / web export | Đạt ở bản tích hợp được kiểm tra. |
| `npm test` | Bộ hồi quy local hoàn tất; không tương đương kiểm thử toàn bộ tính năng trên Supabase đang triển khai. |

CI trên Node 22 và 24 chạy lại các bộ AI/portal cùng các kiểm tra hiện có. Kết quả cuối phải đọc theo commit tại GitHub Actions của PR, không dùng số ca trên phiên bản cũ làm bằng chứng cho phiên bản mới.

## Smoke test giao diện dùng Supabase hiện có

- Bệnh nhân, tiếp đón, bác sĩ và admin đăng nhập/đăng xuất qua đúng cổng; không ghi nhận pageerror trong lượt chạy.
- Bệnh nhân hỏi chuyên khoa chưa có trong catalog: hiện trạng thái chưa có bác sĩ, không có nút đặt bác sĩ mẫu.
- Câu hỏi về thuốc không tự tạo tiền sử dị ứng NSAID.
- Câu có từ khóa cảnh báo và thuốc đi qua nhánh emergency, không hiện nút đặt lịch thường.
- Trang hồ sơ cloud không hiện eKYC/VssID đồng bộ hoặc chỉ số sức khỏe mẫu như dữ liệu xác minh.

Lượt này chỉ sử dụng phiên Auth và dữ liệu đọc; không thay đổi hồ sơ, ca trực, booking hay medication trên Supabase thật. Migration mới của PR #29/#32 chưa áp dụng trong lượt sửa/merge. Thông báo chưa tải được nhật ký thuốc là giới hạn đã biết khi migration tủ thuốc chưa triển khai.

## Chưa được chứng minh

- Google OAuth hoàn chỉnh qua provider thật, upload avatar trên Android native, UAT người dùng cuối và nghiệm thu lâm sàng.
- Độ chính xác chẩn đoán, độ bao phủ mọi triệu chứng, hiệu năng production hoặc tuân thủ một tiêu chuẩn y khoa.
- Việc các test đạt không thay thế review, migration, smoke test trên bản triển khai và quyết định nghiệm thu của nhóm.
