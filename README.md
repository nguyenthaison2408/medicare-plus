# MediCare Plus

Đồ án Quản trị dự án phần mềm — VKU, Nhóm 04. Giảng viên: TS. Nguyễn Thanh Tuấn. Báo cáo: **23/11/2026**.

## Nhóm và trách nhiệm

| Thành viên | MSV | Trách nhiệm | Tỷ lệ nhóm chốt |
|---|---|---|---:|
| Nguyễn Thái Sơn | 23IT.EB086 | PM/Scrum Master, QA, Supabase và tích hợp | 30% |
| Vi Hữu Thành | 23IT.EB096 | Tech Lead/CI, backend, trợ lý phân luồng theo luật | 22% |
| Đặng Thanh Vũ | 23IT.EB120 | Frontend/Mobile, các cổng người dùng và tích hợp UI | 28% |
| Nguyễn Từ Anh Nguyên | 23IT.EB064 | Full-stack/Booking, tủ thuốc, bệnh viện | 20% |

Tỷ lệ do trưởng nhóm quyết định sau đối chiếu công việc. Số commit không phải giờ công hoặc công thức chia tỷ lệ.

## Sản phẩm và phạm vi nghiệm thu

- Client Expo 58/React Native/TypeScript gọi Supabase Auth, Data API, RPC và PostgreSQL/RLS. Express là API demo lưu trong bộ nhớ, chạy độc lập.
- Demo cốt lõi: đăng nhập đúng vai trò → đặt lịch chống trùng → phiếu QR → tiếp đón đúng ngày → bác sĩ lưu EMR → bệnh nhân đọc lại.
- Main **602b76c** ngày 22/11 gồm PR #23–#27, #29–#32 và #43: UI/mobile, check-in, EMR, người thân, review, tủ thuốc, bệnh viện, trợ lý, hồ sơ/avatar, ca trực, BHYT, chat và email tùy chọn.
- Trợ lý sử dụng từ khóa/luật cục bộ, không gọi Gemini/OpenAI hoặc LLM. Không xem kết quả là chẩn đoán lâm sàng.
- OTP đăng ký do Supabase Auth xác minh; app không tự tạo hoặc đối chiếu mã để xác nhận email. Liên kết/mã email phụ thuộc template và chính sách Auth của project.
- Email phiếu hẹn đã có mã nhưng chưa có bằng chứng thư đến hộp nhận thực. Webhook phải trả JSON {"ok":true} sau khi xử lý thành công; lỗi HTTP, HTML hoặc phản hồi thiếu xác nhận không được coi là đã gửi.
- Avatar picker hiện hỗ trợ web; BHYT là cấu hình/ước tính, chưa tích hợp xác minh quyền lợi. Redis, video, eKYC và thanh toán online chưa triển khai.

## Database và triển khai

Supabase project medicare-plus lưu dữ liệu trực tuyến. Source có **12 tệp SQL**; ledger ngày 22/11 ghi **10 migration**. Cloud đã có bảng chat và cột người thân mới nhưng chưa ghi ledger 007/008; [Issue #44](https://github.com/nguyenthaison2408/medicare-plus/issues/44) theo dõi đối chiếu schema/RLS/trigger/publication và checksum trước khi reconcile. Không chạy lại SQL hoặc ghi ledger chỉ vì bảng đã tồn tại.

Các thành viên đăng nhập ứng dụng bằng tài khoản được cấp vai trò; quyền quản trị dashboard Supabase được cấp riêng. Cấu hình: [supabase/README.md](supabase/README.md), [client/.env.example](client/.env.example). Publishable key được phép ở client; mật khẩu database và service-role key phải giữ ngoài client/Git.

## Chạy và kiểm tra

Yêu cầu Node 22.13+ trong dòng 22 hoặc 24.3+ trong dòng 24. Chạy npm ci ở root, server và client.

~~~text
npm run dev:server           # API demo: localhost:5000/api/v1
npm run dev:client           # Expo: xem URL do CLI hiển thị
npm test                    # kiểm thử local, không chứng minh UAT cloud
npm --prefix client run lint
npm --prefix client run typecheck
npm run build               # client/dist
npm run preview:web         # localhost:4173
~~~

Chế độ cloud dùng EXPO_PUBLIC_DATA_MODE=supabase cùng URL và publishable key trong client/.env.local. Cấu hình email là tùy chọn, đăng ký Auth không phụ thuộc webhook phiếu hẹn. Công cụ migration/cloud-test yêu cầu cấu hình quản trị riêng; cloud-test có thể tạo dữ liệu QA và phải dọn đúng fixture.

### Kết nối APK với backend PayOS

Áp dụng migration `202611260001_clinic_payos_orders.sql` vào dự án Supabase dùng chung giữa client và backend. Cấu hình backend theo [server/.env.example](server/.env.example), gồm URL Supabase, khóa service role, ba khóa PayOS và URL điều hướng sau thanh toán. Giữ các khóa PayOS và service role ở backend.

**Kiểm tra trên mạng LAN**

1. Từ thư mục gốc, chạy `npm run dev:server`. Kết nối điện thoại và máy chạy server vào cùng Wi-Fi. Trên Windows, dùng `ipconfig` để tìm IPv4 của máy và cho phép kết nối đến cổng 5000 trên mạng riêng.
2. Mở `http://<IP-LAN>:5000/api/v1/health` trên trình duyệt điện thoại. Dùng URL `http://<IP-LAN>:5000/api/v1` cho `EXPO_PUBLIC_API_URL` trong `client/.env.local` khi chạy Expo cục bộ. Một số bản Android chặn HTTP. Khi đó dùng URL HTTPS cho APK. Chỉ dùng HTTP LAN với môi trường và tài khoản thử nghiệm.

**Triển khai backend trên Render**

1. Tạo Node Web Service, kết nối repo và chọn nhánh cần triển khai. Để Root Directory ở gốc repo. Đặt Build Command là `npm ci --prefix server`, Start Command là `npm --prefix server start` và Health Check Path là `/api/v1/health`. [Hướng dẫn Express trên Render](https://render.com/docs/deploy-node-express-app).
2. Khai báo các biến trong `server/.env.example` trên Render, để Render cấp `PORT`, và đặt `PAYOS_RETURN_URL` cùng `PAYOS_CANCEL_URL` trỏ đến trang HTTPS phù hợp. Kiểm tra `https://<service>.onrender.com/api/v1/health`.
3. Đặt `EXPO_PUBLIC_API_URL=https://<service>.onrender.com/api/v1` trong môi trường EAS `preview` hoặc `production` tương ứng. Chạy `npx eas-cli@latest build --platform android --profile preview` trong `client` để tạo lại APK. [Biến môi trường EAS](https://docs.expo.dev/eas/environment-variables/).

Khi kiểm tra, chọn bác sĩ và đối chiếu phí khám với số tiền trong PayOS. Sau khi backend xác nhận đã nhận đủ tiền, nhấn **Hoàn tất đặt lịch**. Kiểm tra Supabase lưu `payment_method = 'vietqr'` và `payment_status = 'PAID'`. Giờ khám được kiểm tra lại khi hoàn tất. Nếu giờ đã có người đặt trong lúc thanh toán, liên hệ bộ phận vận hành để đối soát bằng mã giao dịch PayOS hiển thị trên ứng dụng.

## Bằng chứng kỹ thuật

- Main/PR #43: CI Node 22 và 24 đạt. Bộ local gồm **241 ca**: 16 trợ lý, 27 portal, 32 staff, 5 auth, 5 validation, 29 SQL lõi, 93 SQL mở rộng và 34 API/hồi quy.
- Cloud: bộ 28 checks ngày 19/11 và bộ 29 checks ngày 21/11 có phiên bản/phạm vi khác nhau. Không cộng chúng thành một lần nghiệm thu trên main mới.
- k6 ngày 19/11: tra cứu 100 VU/30 giây, 8.596 request, p95 137,53 ms, lỗi HTTP 0%; tranh chấp 50 request: một thành công/49 xung đột. Chưa chạy lại toàn bộ benchmark trên main 602b76c.
- Chưa có kết luận UAT, camera/chat hai thiết bị hoặc gửi email thực trên bản cuối. [#13](https://github.com/nguyenthaison2408/medicare-plus/issues/13), [#14](https://github.com/nguyenthaison2408/medicare-plus/issues/14), [#18](https://github.com/nguyenthaison2408/medicare-plus/issues/18), [#45](https://github.com/nguyenthaison2408/medicare-plus/issues/45) theo dõi phần còn lại.

## Scrum và hồ sơ

[Scrum Project](https://github.com/users/nguyenthaison2408/projects/1): 31 thẻ, 4 Done / 20 In Review / 4 In Progress / 2 Ready / 1 Backlog tại mốc đối chiếu 22/11. Giữ 136 SP đường cơ sở; Sprint 6 có 123 SP, gồm 5 Done và 118 chưa Done. Thẻ bổ sung chưa ước lượng để trống SP. Không suy velocity hoặc nghiệm thu Sprint từ ngày commit.

Toàn bộ 17 nhánh có 115 commit khác nhau: 111 trên main và 4 ngoài main; merge commit và công việc chưa tích hợp được phân biệt.

Năm Sprint gốc và M1–M5 giữ làm đường cơ sở; Sprint 6: 16–22/11, tổng duyệt 22/11, báo cáo 23/11. [Ma trận toàn bộ commit](docs/evidence/2026-11-22-commit-traceability.csv) phân biệt tác giả, merge và hạng mục liên quan; [hồ sơ đối chiếu](docs/evidence/2026-11-22-full-history-audit.json) có phạm vi/giới hạn.

Bảy tệp nộp chính:

1. [Báo cáo kỹ thuật](docs/01_Final_Technical_Report.docx)
2. [Project Charter](docs/02_Project_Charter_Signed.docx)
3. [WBS và từ điển](docs/03_WBS_and_WBS_Dictionary.docx)
4. [Risk Register Excel](docs/04_Risk_Register_Evolution.xlsx)
5. [Hồi cứu Sprint](docs/05_Sprint_Retrospectives.docx)
6. [Scope Change Record](docs/06_Scope_Change_Control_Record.docx)
7. [PowerPoint 9 slide](docs/08_Presentation_Slide_Deck.pptx)

Không tạo tệp 07 tùy chọn. Word/Excel/PowerPoint là bản nguồn giữ định dạng; node scripts/export-word-reports.cjs chỉ sao chép/kiểm tra các bản Office, không sinh lại từ bản thảo Markdown. Bằng chứng nằm trong docs/evidence; hướng dẫn thao tác nằm trong demo. PR tài liệu #22 được PR #46 thay thế; bằng chứng riêng của #22 được lưu trong docs/evidence. PR #28 về dữ liệu bệnh án/identity vẫn cần review/tích hợp vì còn sửa app chưa vào main.
