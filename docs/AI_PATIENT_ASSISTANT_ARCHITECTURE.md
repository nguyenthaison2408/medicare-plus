# Kiến trúc trợ lý triệu chứng MediCare Plus

## Phạm vi triển khai

Module do Vi Hữu Thành phụ trách sử dụng bộ luật từ khóa chạy tại client, không gọi mô hình ngôn ngữ hoặc dịch vụ suy luận bên ngoài. Kết quả phục vụ định hướng tham khảo trong bản demo, không xác nhận chẩn đoán hay độ chính xác lâm sàng. Chưa có thẩm định y khoa hoặc bằng chứng tuân thủ ESI, HL7/FHIR.

## Luồng xử lý

1. `aiMedicalKnowledge.ts` phát hiện từ khóa cảnh báo; `runClinicalTriage` xử lý nhánh emergency trước câu hỏi về thuốc.
2. Các nhóm từ khóa gợi ý chuyên khoa. Danh sách gợi ý lấy từ catalog bác sĩ được truyền vào từ AppContext; chế độ cloud chỉ dùng danh mục đang hoạt động tải từ Supabase. Không tìm được chuyên khoa thì hiển thị chưa có bác sĩ phù hợp, không thay bằng bác sĩ mẫu.
3. `aiSafetyGuardrails.ts` chỉ dùng danh sách dị ứng được cung cấp. Hồ sơ cloud hiện chưa có nguồn dị ứng đã xác minh, vì vậy không kế thừa dị ứng trong PATIENT_PROFILE mẫu. Không diễn giải danh sách trống thành xác nhận người bệnh không có dị ứng.
4. `aiConversation.ts` liên kết câu trả lời với ID cuộc hội thoại, câu hỏi và lựa chọn hợp lệ. Câu hỏi đã trả lời hoặc của lượt cũ bị bỏ qua; không hạ mức emergency qua câu hỏi tiếp theo. Trọng số là quy tắc nội bộ, không phải điểm nguy cơ lâm sàng đã kiểm định.
5. Màn hình chat đặt lại theo tài khoản; reset/unmount vô hiệu callback đang chờ. Các màn hình cần đăng nhập chờ hồ sơ sẵn sàng. Nhánh emergency không hiển thị nút đặt lịch khám thông thường.

## Dữ liệu và giới hạn

- Danh mục demo offline và catalog Supabase được phân biệt; không tự thêm bác sĩ hoặc bệnh nhân giả lên cloud.
- Cơ chế khớp từ khóa chưa hiểu đầy đủ phủ định, tiếng Việt không dấu, diễn tiến bệnh hay tình huống ngoài bộ luật. Bộ test không chứng minh bao phủ mọi triệu chứng.
- Các nội dung chăm sóc/thuốc có sẵn trong bộ luật chưa được bác sĩ nghiệm thu; không sử dụng demo để đưa ra quyết định điều trị.
- Chưa có UAT lâm sàng hoặc benchmark chất lượng mô hình.

## Kiểm tra

Chạy `npm run test:ai`, `npm run test:portal`, `npm test`, client lint và build. CI Node 22/24 bao gồm AI và portal regression; PR #31/#32 lưu mã và kết quả kiểm tra. Tài liệu kiểm thử phân biệt kết quả cục bộ, smoke test UI và nghiệm thu cloud.
