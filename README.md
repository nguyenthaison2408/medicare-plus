# MediCare Plus

Đồ án Quản trị dự án phần mềm — VKU, Nhóm 04. Giảng viên: TS. Nguyễn Thanh Tuấn. Mốc báo cáo: **23/11/2026**; hồ sơ bàn giao đối chiếu đến **28/11/2026**.

## Nhóm và trách nhiệm

| Thành viên | MSV | Trách nhiệm | Tỷ lệ nhóm chốt |
|---|---|---|---:|
| Nguyễn Thái Sơn | 23IT.EB086 | PM/Scrum Master, QA, Supabase và tích hợp | 30% |
| Vi Hữu Thành | 23IT.EB096 | Backend/CI, trợ lý AI và hỗ trợ review | 22% |
| Đặng Thanh Vũ | 23IT.EB120 | Tech Lead, điều phối kỹ thuật, Frontend/Mobile và tích hợp UI/cloud | 28% |
| Nguyễn Từ Anh Nguyên | 23IT.EB064 | Full-stack/Booking, tủ thuốc, bệnh viện | 20% |

Tỷ lệ do trưởng nhóm quyết định sau đối chiếu công việc. Số commit không phải giờ công hoặc công thức chia tỷ lệ.

## Sản phẩm và phạm vi nghiệm thu

- Main **bffbde8** có cùng cây mã với head PR #59 đã được kiểm tra; mốc đối chiếu mã nguồn 28/11/2026, bộ kiểm thử mới nhất 27/11.
- Expo 58/React Native/TypeScript gọi Supabase Auth, Data API/RPC, PostgreSQL/RLS và Realtime. Storage riêng lưu tệp xét nghiệm. Express có API demo độc lập và backend PayOS kết nối Supabase.
- Luồng chính: đăng nhập đúng vai trò → đặt/hủy lịch chống trùng → phiếu QR → tiếp đón đúng ngày và cấp STT → bác sĩ lưu EMR → bệnh nhân đọc kết quả/đánh giá. Chat riêng hai chiều, hồ sơ gia đình, nhật ký/tủ thuốc, hồ sơ cá nhân và lưu/duyệt bác sĩ có kiểm tra trên web.
- AI có luật cục bộ và Gemini qua Edge Function; khóa Gemini giữ ở server. Đã có kiểm tra gọi Gemini thật; kết quả hỗ trợ thông tin, không phải chẩn đoán lâm sàng.
- PayOS có backend/webhook, đối chiếu số tiền/quyền sở hữu và lưu giao dịch Supabase. Kiểm tra kỹ thuật dùng provider/webhook giả lập; chưa chứng minh chuyển tiền thật.
- OTP do Supabase Auth xác minh. Email phiếu hẹn đã có mã; cần xác nhận thư đến hộp nhận thực. Webhook chỉ báo thành công khi trả JSON xác nhận hợp lệ.
- BHYT là cấu hình/ước tính; Redis, gọi video và eKYC chưa triển khai. Camera/thiết bị, Google OAuth, triển khai giao diện công khai và UAT cần nghiệm thu riêng. Hai tab EHR/kê đơn cloud đang dùng chung màn; đường mở chức năng tải xét nghiệm của bác sĩ còn cần hoàn thiện.

## Database và triển khai

Supabase project medicare-plus lưu dữ liệu trực tuyến với **14 bảng clinic_***. Source có **21 tệp SQL**; ledger ghi **18 migration** khi đối chiếu ngày 28/11. Ba tệp `202611200007_clinic_family_members_enhancements.sql`, `202611200008_clinic_consult_messages.sql`, `202611220009_clinic_doctors_avatar.sql` chưa có ledger dù các cấu trúc tương ứng đã xuất hiện. Cần đối chiếu schema/RLS/trigger/publication và checksum trước khi reconcile; không chạy lại SQL chỉ theo số đếm. Migration quản trị bác sĩ `202611270001_clinic_admin_doctors.sql` đã triển khai và có ledger.

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

- [Tổng hợp QA 27/11](docs/evidence/2026-11-27-qa-summary.json): **414/414 ca đạt**, gồm 123 logic ứng dụng, 164 SQL/RLS, 15 API + 24 hồi quy, 60 cloud và 28 UI web. Tổng cục bộ là **326**; không dùng số ca để suy phần trăm coverage.
- CI Node 22/24, lint, TypeScript và Expo web đạt trên head PR #59. Main bffbde8 giữ cùng cây mã; bảo vệ nhánh yêu cầu một phê duyệt và kiểm tra bắt buộc, áp dụng cả admin. Các ngoại lệ do chủ kho cho phép được ghi riêng trước khi khôi phục chính sách.
- [Demo web](docs/evidence/2026-11-28-demo-verification.json): **4 phút 50 giây**, 720×1560, giọng/phụ đề tiếng Việt, 15 phần, 121 lượt bấm và 38 lần nhập dữ liệu; có chat riêng bệnh nhân–bác sĩ hai chiều. MP4 được bàn giao riêng. Đây là thao tác web với tài khoản giả, không thay thử camera hoặc chat trên hai thiết bị.
- Các số k6 19/11 (100 VU/30 giây, 8.596 request, p95 137,53 ms và ca tranh chấp 1 thành công/49 xung đột) là phép đo lịch sử, chưa chạy lại benchmark đầy đủ trên bffbde8.
- Chưa có kết luận UAT/sign-off, gửi email thật, Google OAuth, camera vật lý hoặc thanh toán tiền thật trên bản bàn giao. Các bộ kiểm tra 19–22/11 được giữ theo phiên bản, không cộng trùng với bộ 27/11.

## Scrum và hồ sơ

Ảnh chụp [Scrum Project](https://github.com/users/nguyenthaison2408/projects/1) ngày 22/11: 31 thẻ, 4 Done / 20 In Review / 4 In Progress / 2 Ready / 1 Backlog tại mốc đối chiếu 22/11. Giữ 136 SP đường cơ sở; Sprint 6 có 123 SP, gồm 5 Done và 118 chưa Done. Thẻ bổ sung chưa ước lượng để trống SP. Không suy velocity hoặc nghiệm thu Sprint từ ngày commit.

Đối chiếu main ngày 28/11 có **186 commit: 140 commit thường, 46 merge**. Gộp bí danh tác giả: Sơn 36, Thành 35, Vũ 49, Nguyên 20. Thống kê 17 nhánh/115 commit trong hồ sơ 22/11 là ảnh chụp lịch sử. Vai trò Tech Lead của Vũ và tỷ lệ nhóm được ghi riêng, không suy từ số commit.

Năm Sprint gốc và M1–M5 giữ làm đường cơ sở; Sprint 6: 16–22/11, tổng duyệt 22/11, báo cáo 23/11. [Ma trận toàn bộ commit](docs/evidence/2026-11-22-commit-traceability.csv) phân biệt tác giả, merge và hạng mục liên quan; [hồ sơ đối chiếu](docs/evidence/2026-11-22-full-history-audit.json) có phạm vi/giới hạn.

Bảy tệp nộp chính:

1. [Báo cáo kỹ thuật](docs/01_Final_Technical_Report.docx)
2. [Project Charter](docs/02_Project_Charter_Signed.docx)
3. [WBS và từ điển](docs/03_WBS_and_WBS_Dictionary.docx)
4. [Risk Register Excel](docs/04_Risk_Register_Evolution.xlsx)
5. [Hồi cứu Sprint](docs/05_Sprint_Retrospectives.docx)
6. [Scope Change Record](docs/06_Scope_Change_Control_Record.docx)
7. [PowerPoint 9 slide](docs/08_Presentation_Slide_Deck.pptx)

Không tạo tệp 07 tùy chọn. Word/Excel/PowerPoint là bản nguồn giữ định dạng; node scripts/export-word-reports.cjs chỉ sao chép/kiểm tra các bản Office, không sinh lại từ bản thảo Markdown. Bằng chứng nằm trong docs/evidence; hướng dẫn thao tác nằm trong demo. PR tài liệu #22 được PR #46 thay thế; bằng chứng riêng của #22 được lưu trong docs/evidence. PR #28 về dữ liệu bệnh án/identity đã merge ngày 22/11. Các thống kê Board/Sprint cũ là số liệu tại thời điểm chụp, không phải trạng thái hiện tại.


### Bản PDF để nộp

PDF được xuất trực tiếp từ các bản Word/Excel/PowerPoint đang duy trì; bảng phân công ghi Vũ là Tech Lead, tỷ lệ 30–22–28–20 giữ nguyên.

- [01 — Báo cáo kỹ thuật](docs/01_Final_Technical_Report.pdf)
- [02 — Project Charter](docs/02_Project_Charter_Signed.pdf)
- [03 — WBS và từ điển](docs/03_WBS_and_WBS_Dictionary.pdf)
- [04 — Risk Register](docs/04_Risk_Register_Evolution.pdf)
- [05 — Sprint Retrospectives](docs/05_Sprint_Retrospectives.pdf)
- [06 — Scope Change Record](docs/06_Scope_Change_Control_Record.pdf)
- [08 — Slide thuyết trình](docs/08_Presentation_Slide_Deck.pdf)
