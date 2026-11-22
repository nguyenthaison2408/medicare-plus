# Kiểm tra trải nghiệm MediCare Plus

## Phạm vi kiểm chứng

Đối chiếu mã main 602b76c ngày 22/11/2026. Smoke test web trước PR #43 xác nhận bốn cổng vai trò, bản đồ và tủ thuốc mở được; các kiểm tra đó không thay UAT trên bản cuối. Các thay đổi web alert, nút lồng nhau, thời gian, nhắc thuốc và polling chat trong #43 đã có CI, nhưng vẫn cần kiểm tra trên thiết bị.

## Kịch bản ưu tiên

1. Bệnh nhân đăng nhập, đọc bác sĩ/giờ trống, nhập thông tin thật, lưu lịch; lỗi server không tạo phiếu thành công giả.
2. Chọn đúng người khám; không đồng nhất hai người chỉ vì trùng tên. Đổi bác sĩ mở chat phải đổi đúng hội thoại.
3. Tiếp đón quét/nhập QR đúng ngày; mã sai, đã hủy hoặc sai quyền phải báo đúng; camera có phương án nhập mã dự phòng.
4. Bác sĩ chỉ xử lý phiếu đúng phân công đã check-in; bệnh nhân đọc lại đúng dữ liệu lưu. Theo dõi phần chưa tích hợp ở PR #28.
5. Tủ thuốc/gia đình: lưu, tải lại, đổi tài khoản; không rơi trường dị ứng khi schema thiếu; cữ uống không bị kế thừa toa cũ.
6. Chat hai thiết bị: tin do database xác nhận, tài khoản khác không đọc được, đổi phiên không lộ tin, lỗi gửi giữ retry.
7. Email: cấu hình được inline vào bundle, chỉ báo thành công với phản hồi hợp lệ. OTP đăng ký do Supabase xác minh; không dùng mã lưu trong state client.

## Hạng mục còn chờ

| Hạng mục | Điều kiện đóng |
|---|---|
| Camera/QR và mobile | Có thiết bị, ngày, bước thao tác và kết quả bản cuối |
| Mạng yếu / session | Lỗi rõ ràng, không báo thành công giả hoặc cập nhật phiên cũ |
| Avatar Android | Có picker native hoặc hiển thị đúng giới hạn, không hứa tính năng chưa có |
| BHYT | Phân biệt ước tính và quyền lợi được xác nhận; không suy PAID từ form |
| Dữ liệu y tế | Không hiển thị sinh hiệu, lab hoặc xác thực mẫu như dữ liệu thật |
| Admin thêm/duyệt bác sĩ | Phải nối cloud trước khi công bố lưu được |
| Accessibility | Thử focus/keyboard/screen reader, tương phản và vùng bấm; chưa công bố đạt WCAG |
| UAT | Người tham gia, ngày, kịch bản, phản hồi và kết luận thực |

## Theo dõi

[#14](https://github.com/nguyenthaison2408/medicare-plus/issues/14) triển khai/UAT, [#18](https://github.com/nguyenthaison2408/medicare-plus/issues/18) tổng duyệt, [#44](https://github.com/nguyenthaison2408/medicare-plus/issues/44) ledger, [#45](https://github.com/nguyenthaison2408/medicare-plus/issues/45) chat. Các mục còn chờ không tự đổi Done từ số commit/test.

Phân công: Sơn PM/QA/tích hợp 30%, Thành CI/backend 22%, Vũ Frontend/Mobile 28%, Nguyên Full-stack/Booking 20%. [README](../README.md) là đầu mối cấu hình và bằng chứng.
