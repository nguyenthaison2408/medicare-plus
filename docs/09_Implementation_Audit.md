# Đối chiếu thực thi MediCare Plus

Ngày kiểm tra: 19/11/2026. Hạn báo cáo do Nguyễn Thái Sơn xác nhận: **23/11/2026**.

Tài liệu này phân biệt phần đã kiểm chứng, phần đang triển khai và phần chưa có bằng chứng. Các báo cáo tổng kết cũ vẫn là bản nháp cần đối chiếu; các cụm “đã ký”, “đã nghiệm thu”, số đo hiệu năng và kết quả UAT chỉ được dùng sau khi có bằng chứng tương ứng.

## Các quyết định đã chốt

- Dùng Supabase để lưu dữ liệu PostgreSQL trực tuyến. Tại thời điểm bắt đầu, chưa có tài khoản/project Supabase được kết nối.
- Giữ lịch kế hoạch ban đầu trong hồ sơ; bổ sung lịch đối chiếu từ các ngày đang hiển thị trong Git và một kỳ hoàn thiện trước 23/11.
- Lịch chat cho thấy có thao tác điều chỉnh ngày commit trước phiên này. Vì vậy ngày Git được dùng làm mốc đối chiếu, không tự chứng minh thời điểm thực hiện, peer review hoặc nghiệm thu.
- Tỷ lệ đóng góp thống nhất: Sơn 40%; Thành, Vũ, Nguyên mỗi người 20%.
- Không ghi nhận chữ ký, nghiệm thu hoặc chỉ số chưa thu thập được là đã hoàn tất.

## Lịch đối chiếu Git đề xuất theo chỉ đạo mới

| Kỳ | Ngày | Ví dụ mốc trong Git hiện tại |
|---|---|---|
| Sprint 1 | 07/09–20/09/2026 | `11ddc91`, `cb16c0b`, khung Expo và theme |
| Sprint 2 | 21/09–04/10/2026 | `05378a0`, bộ API demo, component và state |
| Sprint 3 | 05/10–18/10/2026 | màn hình đăng nhập, chọn bác sĩ và luồng đặt khám |
| Sprint 4 | 19/10–01/11/2026 | thẻ lịch hẹn, trang chính, component bệnh án |
| Sprint 5 | 02/11–15/11/2026 | dashboard, hồ sơ gia đình, Word và tài liệu |
| Sprint 6 — hoàn thiện | 16/11–22/11/2026 | `773bd99`, PR #19 (`e2a1beb`), kiểm thử và tích hợp trực tuyến |
| Báo cáo | 23/11/2026 | trình bày 6 phút, demo 5 phút, hỏi đáp 5 phút |

Các kỳ trên là lịch đối chiếu được lập ngày 19/11, không phải bằng chứng rằng đã tổ chức đầy đủ nghi thức Scrum trong từng kỳ. Story Points và Burndown phải dựa trên dữ liệu thu thập được; chưa có dữ liệu thì ghi rõ chưa có.

## Kiểm kê 19 thẻ trên Board

Trạng thái đọc trực tiếp trong Opera trước chỉnh sửa: Backlog 0, Ready 0, In Progress 2, In Review 2, Done 15.

| Thẻ | Trạng thái ban đầu | Bằng chứng / phần cần bổ sung | Hướng xử lý |
|---|---|---|---|
| #1 CI/CD | Done | Có workflow; trước sửa thiếu lint, build chỉ typecheck; Node 20 không đáp ứng React Native hiện có | Kiểm tra lại workflow mới và bản build |
| #2 PostgreSQL | Done | Trước phiên này server chỉ lưu trong bộ nhớ | Triển khai migration Supabase và kiểm thử lưu bền vững |
| #3 JWT/RBAC | Done | Đăng nhập trước đây suy vai trò từ email; token demo | Tích hợp Auth thật và kiểm thử quyền theo tài khoản |
| #4 Charter/RACI | Done | Có tài liệu, chưa xác minh các chữ ký được mô tả | Kiểm tra nội dung và xác nhận thực tế |
| #5 Danh mục bác sĩ | Done | API danh mục demo chạy được; dữ liệu cố định | Phân biệt danh mục minh họa với dữ liệu vận hành |
| #6 Booking MVP | Done | API demo đặt lịch được; chưa có lưu trữ trực tuyến | Kiểm tra giao dịch đặt lịch trên Supabase |
| #7 UI chọn lịch | Done | Có giao diện Expo; tiêu đề thẻ vẫn ghi React/Next.js | Đổi mô tả công nghệ và kiểm thử lịch trống trực tuyến |
| #8 PostgreSQL/Redis lock | Done | Trước phiên này chỉ có Map trong một tiến trình | Kiểm thử row lock và ràng buộc unique trên PostgreSQL; Redis chưa được triển khai |
| #9 Phiếu khám | Done | Có màn hình; QR trước đây là icon trang trí | Dùng QR mã hóa booking_code thật, kiểm tra trên thiết bị |
| #10 QR check-in | Done | Có API demo; chưa nối đầy đủ với người dùng độc lập | Kiểm tra mã phiếu thật trên cổng nhân viên |
| #11 Doctor/EMR | Done | Có giao diện và trạng thái cục bộ | Kiểm tra lưu bệnh án, đơn thuốc và quyền truy cập |
| #12 Email | Done | Không tìm thấy hệ thống gửi nhắc hẹn trong mã nguồn đã đọc | Đưa về phần chưa hoàn thành; cần quyết định phạm vi trước khi thêm |
| #13 Load test | In Review | Bộ cũ có 5 ca; không tìm thấy k6 script 100 CCU | Bổ sung kiểm thử và lưu kết quả; không đồng nhất test demo với test PostgreSQL |
| #14 Cloud/UAT | In Review | Chưa xác minh triển khai/UAT; báo cáo mô tả UAT ngày 02/12 trong tương lai | Triển khai, chạy UAT thực tế trước hạn mới, lưu dữ liệu thật |
| #15 Báo cáo/slide | Done | Còn sai khác số liệu, lịch và công nghệ | Chỉ chốt sau khi kiểm chứng và cập nhật các định dạng |
| #16 Release | Done | Chưa kiểm tra lại release artifact trực tuyến trong phiên này | Xác minh tag, changelog, bản web/APK sử dụng được |
| #17 Evidence | In Progress | Hồ sơ đang đối chiếu | Hoàn thiện bảng bằng chứng và quyền Drive |
| #18 Demo | In Progress | Cần tổng duyệt trước 23/11 | Chuẩn bị kịch bản thật, dữ liệu sạch và bản dự phòng |
| PR #19 | Done | Thay đổi đã có tại `e2a1beb`: CI typecheck, validation | Giữ dấu vết PR, xác minh lại CI sau thay đổi mới |

## Sai khác đã phát hiện trong hồ sơ

- Nhánh `HEAD` khi bắt đầu có 43 commit, không phải 284. Đây là số commit reachable trong nhánh đang kiểm tra, không phải tổng mọi nhánh/PR của GitHub.
- Bộ test ban đầu có 5 ca, không phải 42; chưa có phép đo coverage 78,4% được xác minh.
- Cây WBS liệt kê 25 mã gói lá, trong khi báo cáo ghi 22.
- Nội dung 18 Issue công khai hiện ghi tổng cộng 136 Story Points ước lượng; đây không phải 168 SP và chưa chứng minh số điểm đã hoàn thành. PR #19 được theo dõi riêng để tránh cộng trùng User Story.
- API công khai xác nhận #3, #7, #15, #17 và #18 đã đóng; trong đó #17 và #18 vẫn ở In Progress trên Board. Cần đồng bộ lại vòng đời Issue với trạng thái công việc.
- README cũ ghi 25% mỗi người, khác tỷ lệ 40/20/20/20 đã chốt.
- Client thực tế dùng Expo/React Native, không phải Vite/Next.js như một số đoạn hồ sơ.
- Ngày UAT 02/12/2026 và một số mốc bàn giao chưa diễn ra tại thời điểm kiểm tra 19/11/2026.
- Yêu cầu gốc liệt kê Risk Register `.xlsx`; thư mục hiện có Markdown, Word và PDF nhưng chưa có bản bảng tính tương ứng.
- Việc bỏ file 07 riêng là yêu cầu của nhóm trong chat; cần xác nhận cách đáp ứng bằng chứng nghiệm thu với giảng viên.

## Công việc trước hạn báo cáo

1. Ngày 19/11: chuẩn hóa Board, lịch đối chiếu, schema và cấu hình Supabase; sửa các lỗi validation/build.
2. Ngày 20/11: kết nối project, kiểm thử đăng nhập, RLS, đặt lịch chống trùng và lưu qua khởi động lại.
3. Ngày 21/11: kiểm thử luồng bệnh nhân–nhân viên–bác sĩ, thu nhận phản hồi và lưu bằng chứng.
4. Ngày 22/11: tổng duyệt 16 phút, sửa hồ sơ theo số liệu đã đo, đóng gói bản dự phòng.
5. Ngày 23/11: báo cáo với đúng trạng thái và giới hạn đã kiểm chứng.

## Tiêu chí chốt hoàn thành

- Bệnh nhân A không đọc/sửa lịch của bệnh nhân B; tài khoản tự đăng ký không tự cấp vai trò bác sĩ/admin.
- Nhiều request cùng chọn một slot chỉ có một lịch hẹn hoạt động; hủy lịch đúng quyền giải phóng slot.
- Nhân viên tiếp đón đúng phiếu hẹn, đúng ngày; bác sĩ chỉ xử lý bệnh nhân trong phạm vi được phân công.
- Bệnh án và đơn thuốc sau lưu xuất hiện ở tài khoản bệnh nhân; dữ liệu không phụ thuộc bộ nhớ một thiết bị.
- Lint, TypeScript, API regression và xuất web có kết quả lưu được.
- UAT, chữ ký, cloud URL và số đo hiệu năng chỉ ghi “đã đạt” khi đã kiểm tra tương ứng.

## Kết quả đã thực hiện trong phiên 19/11/2026

### Quyết định phạm vi đã được PM xác nhận

Ưu tiên Supabase, xác thực mật khẩu/JWT, đặt lịch chống trùng, QR check-in và bệnh án. **Hoãn email thông báo và Redis** sang giai đoạn sau. Đây là quyết định trong phiên làm việc với PM, chưa thay thế chữ ký hoặc biên bản phê duyệt của giảng viên/CCB.

### GitHub Projects

Đã áp dụng bảng trạng thái được PM duyệt: Backlog 1 (#12), Ready 1 (#18), In Progress 9 (#3, #8, #10, #11, #13–#17), In Review 6 (#1, #2, #4, #6, #7, #9), Done 2 (#5 và PR #19).

- Issue #5 được đóng theo DoD API danh mục trả JSON đã kiểm thử. Các Issue còn lại phải Open; PR #19 giữ trạng thái đã merge.
- Đã tạo Sprint Iteration gồm sáu kỳ trong bảng lịch ở trên; năm kỳ đầu đã kết thúc, kỳ hoàn thiện là 16–22/11/2026.
- Phần việc chưa hoàn thành được chuyển sang Sprint 6; Milestone gốc được giữ để đối chiếu phạm vi ban đầu. #5 ở Sprint 2 theo mốc API trong Git; PR #19 ở Sprint 6 theo ngày merge 17/11. #12 chưa xếp kỳ thực hiện tiếp.
- Đã nhập 136 Story Points gốc cho 18 Issue, không cộng PR #19. Đây là tổng ước lượng nguồn, không phải số điểm đã hoàn thành hoặc cam kết làm mới trong bốn ngày.
- Table hiển thị Sprint, Story Points, Priority, Milestone; Roadmap dùng Sprint start/end và mốc Sprint. #12 có Priority P2; phần bắt buộc hoàn thiện trước báo cáo được đánh dấu P0.
- Kiểm tra cuối phát hiện hai workflow cũ dùng nhầm In Progress làm trạng thái đóng. Đã sửa **Status Done → đóng Issue** và **Issue closed → Status Done**, rồi xác minh lại đủ 19 hàng. Bằng chứng: `docs/evidence/2026-11-19-project-board.json`.
- Tiêu đề #7 đã đổi sang Expo/React Native Web. #8 dùng PostgreSQL Row Lock/Unique; phần mô tả ghi quyết định hoãn Redis và giữ baseline trong mục đối chiếu.

### Supabase và dữ liệu trực tuyến

Đã tạo tổ chức **MediCare Plus - VKU**, project **medicare-plus**, gói **Free**, vùng **Singapore (ap-southeast-1)**.

- Dashboard dành cho chủ project: https://supabase.com/dashboard/project/eulckfyojbbovwpslrep
- Project URL: https://eulckfyojbbovwpslrep.supabase.co — đây là endpoint dữ liệu, không phải URL trang web sản phẩm.
- Hai migration đã được áp dụng; bốn bảng clinic đều bật RLS. Script ghi lịch sử migration và SHA-256 trong schema riêng `clinic_private`.
- TLS của kết nối PostgreSQL xác minh CA Supabase chính thức; không tắt kiểm tra chứng chỉ.
- `client/.env.local` đã bật chế độ Supabase, chỉ chứa Project URL và publishable key. Khóa server và mật khẩu CSDL nằm trong `.env.supabase.local`; tài khoản demo nằm trong `.env.demo.local`. Các tệp này được Git bỏ qua, không đưa vào gói nộp bài.
- Có năm tài khoản demo với dữ liệu giả: bệnh nhân A/B, tiếp đón, bác sĩ doc-1 và admin. Việc tạo tài khoản dùng Auth Admin với xác nhận sẵn, không gửi thư mời/email.

### Kiểm chứng kỹ thuật

| Hạng mục | Kết quả đã đo | Giới hạn |
|---|---|---|
| Express API demo | 26/26 kiểm tra | Lưu bộ nhớ; không dùng làm bằng chứng PostgreSQL |
| PostgreSQL nhúng / RLS | 27/27 kiểm tra | Auth schema/claims là fixture cục bộ |
| Supabase thật | 26/26 kiểm tra | Tài khoản giả; chưa phải UAT người dùng |
| Tranh chấp slot trên cloud | 50 request, 1 thành công, 49 lỗi nghiệp vụ trùng slot | Chia sẻ một tài khoản bệnh nhân thử nghiệm |
| Realtime | Kết nối và nhận cập nhật lịch theo JWT người dùng | Cần kiểm tra tiếp trên thiết bị/phiên trình duyệt thực tế |
| Lint, TypeScript, web export | Đã chạy thành công trên Node 22 | Chưa phải CI trên GitHub vì chưa push thay đổi |
| Dependency audit | Root và server: 0 lỗ hổng; client không có high/critical, còn 3 moderate | Nằm ở minimatch/@expo/fingerprint; chưa dùng force hạ Expo 58 xuống 52 |
| k6 tra cứu / lịch trống | 100 VU, 30 giây, 8.596 request, p95 137,53 ms, lỗi HTTP 0% | Không đo 100 bệnh nhân thực hiện toàn bộ quy trình |
| k6 tranh chấp đặt lịch | 50 VU, 1 HTTP 200 + 49 HTTP 409 đúng dự kiến; p95 182,43 ms | Không phải tải đặt lịch 100 người dùng duy trì liên tục |

Bằng chứng: `docs/evidence/2026-11-19-cloud-tests.json`, hai cặp báo cáo HTML/JSON `2026-11-19-k6-*`. Kiểm thử check-in ngày hiện tại dùng fixture đổi giờ có kiểm soát và đã dọn; không mô tả là tiếp đón một lịch hẹn ngày mai theo quy trình bình thường.

### Các sửa đổi giao diện đang hoàn thiện

- Đăng nhập kiểm tra mật khẩu thật; vai trò lấy từ profile trên server, không suy ra từ email.
- Đặt lịch chờ kết quả transaction trước khi báo thành công; lỗi nghiệp vụ được hiển thị. Phiếu QR mã hóa booking code thật, chọn đúng lịch hẹn khi có nhiều lịch.
- Bệnh án, hồ sơ và danh sách lịch trong chế độ Supabase dùng dữ liệu tài khoản thực; không hiển thị CCCD, xét nghiệm, eKYC và bệnh án mẫu như kết quả đã xác minh.
- Chặn các chức năng chưa có trong phạm vi thử nghiệm. Bước xác nhận dùng đúng bệnh nhân; không báo đã gửi SMS, đã thanh toán online hoặc được hưởng tỷ lệ BHYT chưa xác nhận.
- Cổng nhân viên có nhập mã/quét camera, check-in và bác sĩ lưu chẩn đoán/thuốc. Quét camera thật, UAT và tổng duyệt vẫn cần bằng chứng riêng.

Đã kiểm tra trực tiếp trên Opera luồng bệnh nhân đặt lịch/nhận QR → đăng xuất → tiếp đón bằng mã → bác sĩ lưu bệnh án → bệnh nhân đăng nhập lại đọc kết quả. Một lịch demo thứ hai đã hủy qua bước xác nhận. Trạng thái COMPLETED/CANCELLED và bệnh án được đối chiếu lại bằng PostgreSQL. Hai ca này được giữ làm dữ liệu minh họa, không tính là UAT người dùng. Bằng chứng: `docs/evidence/2026-11-19-opera-ui-checks.json`. Camera vật lý và quét giữa hai thiết bị chưa kiểm tra.

### Phần còn lại trước 23/11

1. Kiểm tra giao diện đầy đủ trên Opera và ít nhất một điện thoại, đặc biệt quyền camera và quét QR giữa hai màn hình.
2. Push thay đổi sau khi nhóm rà soát để CI GitHub thực sự chạy; kiểm tra lại peer review/branch protection, không suy ra từ cấu hình local.
3. Chọn nơi host bản web và kiểm tra URL truy cập ngoài máy; database online chưa đồng nghĩa app đã có website công khai.
4. Thu UAT và nghiệm thu thật; không ghi sẵn số người tham gia hoặc chữ ký. Tổng duyệt 22/11, báo cáo 23/11.
5. Đối chiếu báo cáo/slide cũ với bản cập nhật này. Các tệp 01–08 cũ vẫn chứa các đoạn chưa xác minh và không nên được dùng nguyên trạng làm hồ sơ cuối.

Tài liệu thực hành: `docs/11_Demo_Runbook_20261123.md`. Bảng rủi ro hiện tại: `docs/10_Risk_Register_Current.xlsx`.
