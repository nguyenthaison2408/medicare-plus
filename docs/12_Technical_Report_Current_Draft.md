# BÁO CÁO KỸ THUẬT MEDICARE PLUS — BẢN ĐỐI CHIẾU HIỆN TẠI

**Ngày cập nhật:** 19/11/2026. **Ngày báo cáo:** 23/11/2026. **Trạng thái:** Bản thảo chờ nhóm rà soát và nghiệm thu.

Tài liệu này dùng số liệu đã kiểm tra trong phiên 19/11. Đây là bản chuẩn bị để sửa báo cáo 01; chưa thay thế biên bản nghiệm thu, chữ ký giảng viên hoặc các định dạng nộp cuối cùng. Tên SmartClinic còn xuất hiện trong giao diện kế thừa; MediCare Plus là tên dự án quản trị.

## Chương 1. Bài toán và mục tiêu

Dự án minh họa quy trình đặt lịch khám và tiếp đón tại phòng khám: bệnh nhân đăng nhập, chọn bác sĩ và giờ còn trống, nhận phiếu QR; nhân viên tiếp đón đúng ngày hẹn; bác sĩ được phân công lưu chẩn đoán và đơn thuốc; bệnh nhân đọc lại bệnh án từ tài khoản riêng.

Mục tiêu trước 23/11 là có luồng cốt lõi lưu dữ liệu trực tuyến, phân quyền được kiểm tra và hồ sơ quản trị phản ánh đúng mức hoàn thành. Không mô tả hệ thống là sản phẩm y tế đã vận hành, được chứng nhận bảo mật hoặc có dữ liệu bác sĩ thực đã được xác nhận.

Nhóm: Nguyễn Thái Sơn (23IT.EB086, PM, 40%); Vi Hữu Thành (23IT.EB096, Tech Lead, 20%); Đặng Thanh Vũ (23IT.EB120, Backend, 20%); Nguyễn Từ Anh Nguyên (23IT.EB064, Frontend/QA, 20%). Đây là tỷ lệ đã được nhóm chốt trong ngữ cảnh dự án, không suy từ số commit.

## Chương 2. Phạm vi và thay đổi đã xác nhận

Phạm vi ưu tiên gồm Supabase PostgreSQL, Auth mật khẩu/JWT, RBAC/RLS, đặt lịch chống trùng, QR check-in và bệnh án. Ngày 19/11, PM xác nhận hoãn email thông báo và Redis sang giai đoạn sau để tập trung trước buổi báo cáo.

Thanh toán online, video call, tích hợp BHYT/eKYC, AI y tế, xét nghiệm và dữ liệu gia đình chưa nằm trong phần tích hợp cloud được kiểm chứng. Chế độ Supabase cần hiển thị rõ tính năng nào có dữ liệu thật; không báo đã gửi SMS, thanh toán hoặc xác minh quyền lợi bảo hiểm khi chưa thực hiện.

Hồ sơ CR-01 cũ mô tả yêu cầu QR và việc đánh đổi phạm vi. Nguồn xác nhận của stakeholder, cuộc họp CCB và chữ ký trong hồ sơ đó vẫn cần kiểm tra. Quyết định thực tế ngày 19/11 được ghi riêng, không lập lùi ngày thành biên bản đã ký.

## Chương 3. Kế hoạch và kiểm soát công việc

Lịch đối chiếu Git: Sprint 1 (07–20/09), Sprint 2 (21/09–04/10), Sprint 3 (05–18/10), Sprint 4 (19/10–01/11), Sprint 5 (02–15/11), Sprint 6 hoàn thiện (16–22/11). Tổng duyệt 22/11; báo cáo 23/11/2026.

Lịch chat cho thấy ngày commit đã từng được chỉnh trước phiên kiểm tra. Do đó lịch trên là khung tham chiếu từ Git hiện tại, không tự chứng minh thời điểm thực hiện hoặc việc tổ chức đầy đủ nghi thức Scrum.

GitHub Projects có ba view: Board năm trạng thái, Table có Sprint/Story Points/Priority/Milestone, Roadmap dùng Sprint start/end. Milestone gốc giữ phạm vi ban đầu; phần còn lại chuyển sang Sprint hoàn thiện. Tổng ước lượng nguồn là 136 SP cho 18 Issue; PR #19 không cộng trùng. Chưa có dữ liệu đủ tin cậy để công bố velocity hoặc burndown lịch sử.

Trạng thái được PM duyệt: Backlog 1, Ready 1, In Progress 9, In Review 6, Done 2. Done gồm API danh mục #5 và PR #19 đã merge. Chưa tự nâng các thẻ khác lên Done chỉ từ kết quả kiểm thử mới; còn các bước review/thiết bị/UAT/hồ sơ.

WBS hiện có 25 mã gói lá. Cần sửa các đoạn báo cáo cũ ghi 22 và đối chiếu từng gói với sản phẩm bàn giao, người phụ trách và bằng chứng nghiệm thu.

## Chương 4. Kiến trúc và dữ liệu

Ứng dụng kế thừa Expo 58/React Native, xuất web bằng Expo. Chế độ cloud dùng Supabase Auth và Data API/RPC với JWT người dùng. Express tiếp tục là API demo độc lập lưu bộ nhớ; không dùng kết quả của Express để khẳng định lưu trữ PostgreSQL.

Project Supabase `medicare-plus` được tạo trên gói Free tại Singapore. Bốn bảng clinic là doctors, profiles, appointments và medical_records. Tất cả bật RLS; người dùng tự đăng ký luôn nhận vai trò patient dù metadata gửi lên cố yêu cầu admin. Chủ project cấp vai trò nhân viên bằng cơ chế quản trị riêng.

Patient chỉ đọc dữ liệu của mình; reception quản lý tiếp đón nhưng không đọc bệnh án; doctor chỉ xử lý lịch được phân công; admin phục vụ quản trị demo. Các hàm nghiệp vụ kiểm tra quyền, trạng thái và ngày hẹn trong PostgreSQL, thay vì tin hoàn toàn vào kiểm tra giao diện.

Đặt lịch khóa dòng bác sĩ bằng FOR UPDATE và có unique index cho bác sĩ/giờ khi lịch chưa hủy. Hủy lịch đúng quyền giải phóng slot. Giải pháp này chưa có Redis TTL giữ chỗ; không mô tả thành Redis đã triển khai.

Mật khẩu CSDL và secret key chỉ dùng trong script quản trị trên máy chủ/máy phát triển. Client chỉ có Project URL và publishable key. Kết nối PostgreSQL kiểm tra CA/hostname qua TLS. Tài khoản demo dùng dữ liệu giả và lưu thông tin đăng nhập ngoài Git.

## Chương 5. Kiểm thử và kết quả

| Nhóm kiểm tra | Kết quả | Phạm vi |
|---|---|---|
| API Express | 26/26 | Validation, danh mục, booking, check-in, EMR, tranh chấp trong một tiến trình |
| PostgreSQL nhúng | 27/27 | Migration, SQL/RLS và các tình huống quyền với Auth fixture |
| Supabase thật | 26/26 | Mật khẩu/JWT, RLS giữa tài khoản, dữ liệu lưu bền vững, Realtime và nghiệp vụ |
| k6 tra cứu | 100 VU × 30 giây; 8.596 request; p95 137,53 ms; lỗi HTTP 0% | Danh mục và lịch trống, không đo UI hoặc toàn bộ hành trình |
| k6 tranh chấp | 50 request cùng slot: 1 HTTP 200, 49 HTTP 409 dự kiến; p95 182,43 ms | Một tài khoản giả, không phải 100 bệnh nhân độc lập |
| Chất lượng client | Lint, TypeScript, xuất web đạt | Node 22 trên máy hiện tại |

Không cộng các nhóm test thành một tỷ lệ bao phủ mã nguồn. Chưa có phép đo coverage xác minh; không dùng lại số 78,4% trong bản cũ. Các bài cloud đã dọn tài khoản/dữ liệu test sau khi chạy. Kiểm thử check-in dùng fixture ngày có kiểm soát được mô tả trong JSON.

Các con số k6 là một lần đo trong môi trường hiện tại; không suy ra SLA vận hành hoặc cam kết dài hạn. Kiểm thử camera, thiết bị, UAT người dùng và hiệu năng toàn bộ quy trình cần tiến hành riêng.

Ngoài kiểm thử tự động, đã thao tác trên Opera theo chuỗi bệnh nhân đặt lịch/nhận QR, tiếp đón bằng mã, bác sĩ lưu bệnh án, bệnh nhân đăng nhập lại đọc kết quả và xác nhận hủy một lịch khác. Kết quả giao diện được đối chiếu với PostgreSQL; hai ca dữ liệu giả được giữ lại để minh họa. Đây là kiểm tra chức năng của phiên làm việc, chưa phải UAT hoặc kiểm tra quét camera vật lý.

Bằng chứng nằm trong `docs/evidence`: JSON cloud và hai cặp HTML/JSON k6. Mã kiểm thử ở `server/tests`, `supabase/tests` và `tests/k6`.

## Chương 6. Rủi ro và xử lý

Bảng rủi ro hiện tại được lưu ở `10_Risk_Register_Current.xlsx`. Các rủi ro còn mở gồm hạn báo cáo gần, dữ liệu trong hồ sơ cũ chưa thống nhất, camera/thiết bị chưa nghiệm thu, UAT chưa có đủ người tham gia và giới hạn hạ tầng miễn phí.

Rủi ro trùng lịch đã có bằng chứng giảm thiểu từ transaction/unique và các lần tranh chấp cloud, nhưng không vì thế tự tuyên bố đã hết mọi rủi ro dữ liệu. Cần kiểm tra tiếp thay đổi lịch bác sĩ, vận hành nhiều thiết bị và các tải thực tế.

Phương án dự phòng là giữ bản build, SQL và báo cáo kiểm thử có thể mở lại. Khi mất Internet phải nói rõ giới hạn; không dùng dữ liệu cục bộ để giả một giao dịch cloud thành công.

## Chương 7. Bàn giao và công việc còn lại

Đã có project PostgreSQL trực tuyến, migration, tích hợp client, tài khoản demo, bộ kiểm thử và cấu hình Scrum. Chưa có bằng chứng để nhận là đã nghiệm thu với giảng viên, UAT 20 người, đã publish website sản phẩm hoặc đã chạy CI remote cho thay đổi mới.

Từ 20–21/11: kiểm tra giao diện/thiết bị, thu UAT thật, rà soát thay đổi và triển khai web nếu nhóm chọn host. Ngày 22/11: tổng duyệt 16 phút và chốt hồ sơ bằng số liệu đã đo. Ngày 23/11: trình bày đúng trạng thái và giới hạn.

Các liên kết Vercel/API/Drive và các khẳng định branch protection trong bộ cũ phải được mở kiểm tra trước khi đưa lên slide. Số commit reachable tại thời điểm bắt đầu là 43; chưa có căn cứ để dùng 284 commit. Không tạo chữ ký, phản hồi stakeholder hoặc nhật ký họp bù cho bằng chứng còn thiếu.

Tham chiếu triển khai: `09_Implementation_Audit.md`, `11_Demo_Runbook_20261123.md`, `supabase/README.md` và các script kiểm thử trong repository.
