# Kịch bản kiểm tra và báo cáo MediCare Plus

Ngày báo cáo đã xác nhận: **23/11/2026**. Tổng duyệt dự kiến: **22/11/2026**. Đây là hướng dẫn thực hiện, không phải biên bản nghiệm thu đã ký.

## Mở ứng dụng

Trong thư mục dự án, chạy `npm run build:client`, sau đó `npm run preview:web`. Mở http://127.0.0.1:4173 trong Opera GX. Máy hiện tại đang có server xem thử tại địa chỉ này; khi khởi động lại máy cần chạy lại lệnh preview.

Database đã nằm trên Supabase; ứng dụng cần Internet để đăng nhập và truy cập dữ liệu thật. Địa chỉ localhost chỉ truy cập trên máy chạy server. Muốn người khác dùng từ xa cần triển khai bản web lên một host riêng.

Tài khoản demo được lưu trong tệp riêng `.env.demo.local`: PATIENT, PATIENT_B, RECEPTION, DOCTOR, ADMIN. Không đưa tệp này hoặc `.env.supabase.local` lên Git/Drive/gói nộp công khai. Bác sĩ demo được phân công doc-1. Tất cả thông tin thử nghiệm phải dùng dữ liệu giả.

## Luồng demo 5 phút

1. **Bệnh nhân A (1 phút):** Đăng nhập, chọn bác sĩ doc-1 và slot còn trống trong ngày. Kiểm tra bước xác nhận hiển thị đúng tên tài khoản, ngày và giờ. Xác nhận đặt lịch; ghi lại booking code và mở phiếu QR.
2. **Kiểm tra lưu bền vững (30 giây):** Tải lại/đăng nhập trên một phiên độc lập. Lịch vẫn tồn tại. Dùng bệnh nhân B để kiểm tra không thấy lịch hoặc bệnh án của A.
3. **Tiếp đón (1 phút):** Dùng RECEPTION ở cửa sổ/thiết bị khác. Quét QR từ màn hình bệnh nhân hoặc nhập nguyên booking code; xác nhận tiếp đón. Lịch phải đúng ngày hiện tại và chuyển thành CHECKED_IN.
4. **Bác sĩ (1 phút):** Dùng DOCTOR, chọn lịch vừa tiếp đón, lưu chẩn đoán và đơn thuốc minh họa. Kiểm tra trạng thái COMPLETED.
5. **Bệnh nhân xem bệnh án (1 phút):** Quay về tài khoản A, mở Hồ sơ. Hiển thị chẩn đoán/thuốc do bác sĩ vừa lưu; không có kết quả xét nghiệm hay thông tin định danh mẫu.
6. **Kết quả kỹ thuật (30 giây):** Mở báo cáo cloud và HTML k6, chỉ đúng môi trường, tải, ngưỡng và số đo. Không gọi đây là UAT 20 người.

Lưu ý về lịch: đặt lịch chỉ nhận giờ tương lai; check-in chỉ nhận đúng ngày khám. Nếu buổi báo cáo diễn ra sau giờ nhận đặt lịch cuối ngày, hãy chuẩn bị trước một lịch demo ngày 23/11 bằng tài khoản demo, thay vì sửa đồng hồ hệ thống hoặc bỏ kiểm tra ngày.

## Bố cục 16 phút

| Thời lượng | Nội dung | Bằng chứng |
|---|---|---|
| 0:00–1:00 | Bài toán, nhóm 40/20/20/20, phạm vi | Charter đã đối chiếu, không đọc chữ ký chưa có |
| 1:00–3:00 | WBS, lịch Git và Sprint hoàn thiện | Board, Table, Roadmap; phân biệt kế hoạch và số liệu thực tế |
| 3:00–4:30 | Rủi ro trùng lịch và thay đổi phạm vi | Migration row lock/unique; quyết định hoãn email/Redis ngày 19/11 |
| 4:30–6:00 | Kiến trúc và kết quả kiểm thử | 26 API + 27 SQL + 26 cloud; HTML k6 và giới hạn |
| 6:00–11:00 | Demo luồng bệnh nhân–tiếp đón–bác sĩ | Các bước trên |
| 11:00–16:00 | Hỏi đáp, giới hạn, kế hoạch tiếp | Không tự nhận đã UAT/nghiệm thu/release khi chưa có bằng chứng |

## Checklist tổng duyệt

- [ ] Đăng nhập sai mật khẩu có lỗi hiển thị; đăng xuất/đổi tài khoản không lẫn dữ liệu.
- [ ] Có hai phiên bệnh nhân riêng và tài khoản tiếp đón/bác sĩ đúng quyền.
- [ ] Hai người cùng chọn một slot: người sau nhận báo trùng, không nhận phiếu thành công giả.
- [ ] Camera thật được cấp quyền; mã quét khớp booking code. Có phương án nhập mã nếu thiết bị không hỗ trợ camera.
- [ ] Hủy lịch có bước xác nhận, chờ phản hồi cloud; slot được giải phóng.
- [ ] Bác sĩ khác không đọc/ghi hồ sơ của doc-1; lễ tân không đọc bệnh án.
- [ ] Tài khoản bệnh nhân đọc lại được bệnh án sau khi bác sĩ lưu.
- [ ] Đã đo thời gian trình bày/demo thật; lưu người tham gia và lỗi phát hiện, không đánh dấu trước.
- [ ] Có bản build dự phòng và báo cáo kiểm thử đã lưu; nói rõ khi demo đang offline.
- [ ] Tất cả link nộp bài đã mở thử bằng tài khoản người xem; không dùng URL mẫu.

## Những việc chưa được coi là đã hoàn thành

Quét camera trên điện thoại, UAT người dùng, chữ ký nghiệm thu, peer review của thay đổi mới, CI trên remote và host web công khai cần được kiểm tra riêng. Email thông báo và Redis đã được PM đồng ý hoãn, không đưa vào phần trình diễn đã triển khai.
