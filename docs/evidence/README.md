# Bằng chứng dự án

Mốc đối chiếu: main 602b76c ngày 22/11/2026. Tỷ lệ nhóm chốt: Sơn 30%, Thành 22%, Vũ 28%, Nguyên 20%.

- 2026-11-22-full-history-audit.json: 111 commit main, 4 commit ngoài main, so sánh 17 nhánh và 15 PR tại thời điểm chụp; phân biệt author/committer/merge.
- 2026-11-22-commit-traceability.csv: gợi ý liên hệ commit thường với Issue theo nội dung; một commit có thể liên quan nhiều hạng mục. Đây không phải bảng chấm công hoặc tiêu chí tự động đóng Issue.
- 2026-11-22-scrum-verification.json: 31 thẻ, trạng thái, SP, tỷ lệ và đối chiếu assignee sau rà soát.
- 2026-11-22-environment-verification.json: CI, bảo vệ main, ledger/schema đọc trực tiếp; kết quả cloud/UI lịch sử ghi kèm phiên bản và giới hạn. Không chứa thông tin đăng nhập.
- 2026-11-22-report-verification.json: kiểm tra bộ Office, tỷ lệ, hình ảnh, số trang/slide và liên kết.

Các tệp ngày 19/11 được giữ làm chứng cứ lịch sử. Không sửa số liệu cũ để khớp bản mới, không cộng các bộ cloud khác phiên bản thành một lần nghiệm thu. Ngày tác giả hoặc ngày ghi commit không chứng minh giờ công, thời lượng Sprint hay cuộc họp. Các ảnh chụp không tạo đủ chuỗi burndown/velocity; chưa có UAT/sign-off được xác nhận từ chúng.

Bộ hồ sơ chính gồm 5 Word + 1 Excel + 1 PowerPoint ở thư mục docs. Các bảng trạng thái DB được đối chiếu riêng trong docs/reference; hướng dẫn thao tác nằm trong demo.
