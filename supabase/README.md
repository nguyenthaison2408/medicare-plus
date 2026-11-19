# PostgreSQL trực tuyến qua Supabase

Ngày 19/11/2026 đã tạo project `medicare-plus` trên gói Free tại Singapore, áp dụng hai migration và chạy 26/26 kiểm tra cloud thành công. Project URL là `https://eulckfyojbbovwpslrep.supabase.co`; đây là endpoint dữ liệu, không phải website sản phẩm. Xem `docs/evidence/2026-11-19-cloud-tests.json` và HTML/JSON k6 để kiểm tra kết quả cùng giới hạn.

## Cấu hình lần đầu

1. Tạo tài khoản Supabase và project dành cho MediCare Plus. Kết nối Supabase với phiên làm việc hoặc mở SQL Editor của project.
2. Chạy các file trong `migrations/` theo thứ tự tên, bắt đầu từ `202611190001_clinic_core.sql`. Chúng tạo bảng, policy RLS, RPC, danh mục minh họa và Realtime. Migration 002 đồng bộ tên/chuyên khoa/cơ sở của bốn ID bác sĩ với giao diện kế thừa.
3. Sao chép `client/.env.example` thành `client/.env.local`; đặt Project URL và **publishable key**. Không đặt service-role key hoặc mật khẩu PostgreSQL trong client.
4. Sau khi migration được áp dụng và kiểm tra thành công, đặt `EXPO_PUBLIC_DATA_MODE=supabase`, rồi khởi động lại Expo.
5. Đăng ký ít nhất hai tài khoản bệnh nhân; xác nhận email theo cấu hình Auth thực tế của project.
6. Tạo tài khoản nhân viên qua Auth như người dùng bình thường, sau đó chủ project cấp quyền bằng SQL Editor. Ví dụ dưới đây yêu cầu thay ID bằng ID thực tế, không dùng email làm cơ chế phân quyền.

```sql
-- Chỉ chủ project chạy trong SQL Editor, sau khi xác minh đúng người dùng.
update public.clinic_profiles set role = 'admin' where id = '<UUID-nhan-vien>';
update public.clinic_profiles set role = 'doctor', doctor_id = 'doc-1' where id = '<UUID-bac-si>';
update public.clinic_profiles set role = 'reception', doctor_id = null where id = '<UUID-le-tan>';
```

## Luồng dữ liệu

Ứng dụng dùng Supabase Auth để xác thực mật khẩu. Dữ liệu lịch hẹn và bệnh án được truy cập qua Data API/RPC của Supabase với JWT người dùng; RLS và các hàm PostgreSQL kiểm tra quyền. Backend Express hiện tại tiếp tục là API demo độc lập, không được mô tả là đã lưu PostgreSQL khi chưa nối một adapter phù hợp.

Đặt lịch được xử lý nguyên tử trong PostgreSQL: khóa dòng bác sĩ trong transaction và ràng buộc unique cho `(doctor_id, starts_at)` khi lịch chưa hủy. Đây là giải pháp PostgreSQL, không phải Redis. Chế độ trực tuyến không tự chuyển giao dịch lỗi thành kết quả thành công cục bộ.

Thanh toán trực tuyến và video call chưa nằm trong phần tích hợp này. Lịch trực tuyến dùng thanh toán tại cơ sở y tế; trạng thái thanh toán ban đầu là `UNPAID`.

Danh mục bác sĩ là dữ liệu minh họa kế thừa từ client; cần thay bằng dữ liệu được cơ sở y tế xác nhận trước khi vận hành thực tế.

## Kiểm tra bắt buộc trên project thật

- Bệnh nhân A/B không thấy lịch hoặc bệnh án của nhau; người dùng không tự đổi `role`/`doctor_id`.
- Đặt cùng bác sĩ, cùng giờ từ nhiều phiên chỉ tạo một lịch hoạt động.
- Đăng xuất rồi đăng nhập ở trình duyệt/thiết bị khác vẫn thấy lịch đã đặt.
- Nhân viên check-in bằng nội dung QR `booking_code`; chỉ check-in đúng ngày khám.
- Bác sĩ được phân công lưu chẩn đoán và thuốc; bệnh nhân xem được kết quả từ tài khoản riêng.
- Tắt mạng phải báo lỗi rõ; không sinh lịch hẹn thành công giả trong chế độ trực tuyến.

Chưa có project được kết nối thì migration, RLS và luồng trực tuyến chỉ ở trạng thái chuẩn bị, chưa được nghiệm thu. Xem `docs/09_Implementation_Audit.md` để theo dõi bằng chứng.

## Cấu hình riêng và công cụ trên máy hiện tại

- `client/.env.local`: chế độ Supabase, URL và publishable key; được Git bỏ qua. Không đặt secret key hoặc mật khẩu DB vào client.
- `.env.supabase.local`: Session pooler host/user, mật khẩu DB và server integration key; chỉ dùng cho công cụ quản trị/kiểm thử.
- `.env.demo.local`: năm tài khoản dữ liệu giả cho bệnh nhân A/B, tiếp đón, bác sĩ doc-1 và admin; không đưa lên gói nộp công khai.
- `npm run db:migrate`: áp dụng migration chưa chạy và kiểm tra hash của migration đã ghi nhận. Chỉ chủ project dùng.
- `npm run test:cloud`: tạo các tài khoản test riêng qua Auth Admin không gửi email, kiểm thử rồi dọn fixture của chính lần chạy.
- `node supabase/scripts/run-k6.mjs <đường-dẫn-k6.exe>`: đo 100 VU đọc danh mục/lịch trống và 50 VU tranh một slot; tạo HTML/JSON. Không mặc định đây là test 100 hành trình đặt lịch độc lập.

Kết nối PostgreSQL dùng CA Supabase tại `certs/prod-ca-2021.crt`, có xác minh chứng chỉ. Không chia sẻ tệp cấu hình quản trị để các thành viên dùng ứng dụng; họ đăng nhập bằng tài khoản của mình và được chủ project cấp đúng vai trò.

Tài liệu tham chiếu chính thức: [Kết nối PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [Auth Admin createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/).
