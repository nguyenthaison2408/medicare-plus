# Bằng chứng dự án

Mốc hồ sơ bàn giao: main bffbde8, đối chiếu ngày 28/11/2026. Vũ là Tech Lead; Thành phụ trách Backend/CI/AI. Các ảnh chụp 19–22/11 được giữ nguyên theo thời điểm. Tỷ lệ nhóm chốt: Sơn 30%, Thành 22%, Vũ 28%, Nguyên 20%.

- 2026-11-22-full-history-audit.json: 111 commit main, 4 commit ngoài main, so sánh 17 nhánh và 15 PR tại thời điểm chụp; phân biệt author/committer/merge.
- 2026-11-22-commit-traceability.csv: gợi ý liên hệ commit thường với Issue theo nội dung; một commit có thể liên quan nhiều hạng mục. Đây không phải bảng chấm công hoặc tiêu chí tự động đóng Issue.
- 2026-11-22-scrum-verification.json: 31 thẻ, trạng thái, SP, tỷ lệ và đối chiếu assignee sau rà soát.
- 2026-11-22-environment-verification.json: CI, bảo vệ main, ledger/schema đọc trực tiếp; kết quả cloud/UI lịch sử ghi kèm phiên bản và giới hạn. Không chứa thông tin đăng nhập.
- 2026-11-22-report-verification.json: kiểm tra bộ Office, tỷ lệ, hình ảnh, số trang/slide và liên kết.

Các tệp ngày 19/11 được giữ làm chứng cứ lịch sử. Không sửa số liệu cũ để khớp bản mới, không cộng các bộ cloud khác phiên bản thành một lần nghiệm thu. Ngày tác giả hoặc ngày ghi commit không chứng minh giờ công, thời lượng Sprint hay cuộc họp. Các ảnh chụp không tạo đủ chuỗi burndown/velocity; chưa có UAT/sign-off được xác nhận từ chúng.

Bộ hồ sơ chính gồm 5 Word + 1 Excel + 1 PowerPoint ở thư mục docs. Các bảng trạng thái DB được đối chiếu riêng trong docs/reference; hướng dẫn thao tác nằm trong demo.

Bằng chứng riêng từ PR #22 được giữ nguyên trước khi đóng PR: CPM, đối chiếu yêu cầu, kiểm tra hồ sơ/Scrum, daily CSV và hai hình gốc trong figures. Đây là ảnh chụp ngày 19/11, có phân công/tỷ lệ/trạng thái cũ; dùng hồ sơ 28/11 cho hiện trạng và giữ kết quả 22/11 làm lịch sử. Daily CSV để trống ngày không có quan sát, không phải biên bản Daily Scrum. Các script sinh báo cáo cũ và JSON bản thảo của #22 không được dùng lại.


- 2026-11-27-qa-summary.json: bộ 414 ca đạt trên cùng cây mã main bffbde8; 326 local, 60 cloud và 28 UI web. Có phạm vi chưa kiểm thử và liên kết CI.
- 2026-11-28-app-report-audit.json: đối chiếu mã nguồn, PR đã merge, bảo vệ nhánh, 21 SQL / 18 ledger và 14 bảng clinic; không chứa khóa hoặc thông tin đăng nhập.
- 2026-11-28-demo-verification.json: bằng chứng video 720×1560, 4 phút 50 giây, thao tác thật và chat riêng hai chiều; không thay UAT hoặc thử hai thiết bị.
- 2026-11-28-report-verification.json: vai trò, tỷ lệ, bố cục Office và bảy PDF của bộ bàn giao.
