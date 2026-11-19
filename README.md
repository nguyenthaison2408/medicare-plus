# MediCare Plus / SmartClinic

Đồ án Quản trị dự án phần mềm — VKU. Giảng viên: TS. Nguyễn Thanh Tuấn. Pathway 1: kế thừa ứng dụng đa nền tảng SmartClinic. Hạn báo cáo nhóm xác nhận: **23/11/2026**.

## Trạng thái được kiểm tra

- Client: Expo SDK 58, React Native 0.88, TypeScript; giao diện web và di động.
- API Express hiện có sử dụng bộ nhớ trong một tiến trình để chạy demo.
- Đã tạo Supabase project medicare-plus (Free, Singapore), áp dụng hai migration và kiểm thử Auth, PostgreSQL/RLS, Realtime cùng luồng đặt lịch/tiếp đón/bệnh án trên dịch vụ thật.
- Chế độ minh họa giữ dữ liệu cục bộ. Chế độ Supabase chỉ xác nhận giao dịch khi cơ sở dữ liệu xử lý thành công.
- Email thông báo và Redis đã được PM đồng ý hoãn. Thanh toán online, video call, BHYT/eKYC và các tiện ích chưa tích hợp được tách khỏi luồng cloud đã kiểm chứng.
- Kết quả hiện có: 26 API + 27 SQL + 26 cloud checks; k6 tra cứu 100 VU/30 giây đạt p95 137,53 ms, lỗi HTTP 0%; k6 tranh chấp slot có 1 thành công và 49 xung đột dự kiến. Chưa thay thế UAT/kiểm tra camera.

## Nhóm

| Thành viên | MSV | Vai trò | Phân bổ đã thống nhất |
|---|---|---|---|
| Nguyễn Thái Sơn | 23IT.EB086 | PM / Scrum Master | 40% |
| Vi Hữu Thành | 23IT.EB096 | Tech Lead / Architect | 20% |
| Đặng Thanh Vũ | 23IT.EB120 | Backend | 20% |
| Nguyễn Từ Anh Nguyên | 23IT.EB064 | Frontend / QA | 20% |

## Chạy và kiểm tra

Yêu cầu Node.js 22.13+ trong dòng 22, hoặc 24.3+ trong dòng 24. Cài các dependency bằng npm ci ở thư mục gốc, server và client.

- npm run dev:server — API demo tại http://localhost:5000/api/v1.
- npm run dev:client — Expo Web, địa chỉ do Expo hiển thị.
- npm test — kiểm thử PostgreSQL nhúng/RLS và API demo.
- npm --prefix client run lint — kiểm tra lint.
- npm --prefix client run typecheck — kiểm tra TypeScript.
- npm run build — xuất web vào client/dist.
- npm run preview:web — mở bản web đã build tại http://127.0.0.1:4173 (cần Internet để truy cập Supabase).
- npm run test:cloud — kiểm thử project thật bằng tài khoản giả và dọn fixture; cần cấu hình riêng của chủ project.

Phần Supabase: xem [hướng dẫn cấu hình](supabase/README.md) và client/.env.example. Publishable key có thể dùng trong client; mật khẩu CSDL và service-role key không được đặt ở đó.

## Quản lý dự án và bằng chứng

- [Repository](https://github.com/nguyenthaison2408/medicare-plus)
- [Scrum Board](https://github.com/users/nguyenthaison2408/projects/1/views/1)
- [Bảng đối chiếu 19 thẻ, lịch và hạn báo cáo](docs/09_Implementation_Audit.md)
- [Kịch bản demo và tổng duyệt](docs/11_Demo_Runbook_20261123.md)
- [Báo cáo kỹ thuật cập nhật — bản thảo](docs/12_Technical_Report_Current_Draft.md)
- [Bảng rủi ro Excel hiện tại](docs/10_Risk_Register_Current.xlsx)

Các hồ sơ cũ trong docs đang được đối chiếu. Số commit, test, coverage, UAT, chữ ký và URL production chỉ được ghi là đã kiểm chứng khi có bằng chứng tương ứng. Kiểm thử PostgreSQL nhúng không thay thế kiểm thử Auth, Realtime hoặc tải nhiều kết nối trên Supabase thật.
