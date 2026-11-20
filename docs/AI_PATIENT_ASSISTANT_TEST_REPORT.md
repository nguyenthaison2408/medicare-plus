# BÁO CÁO THỰC THI & KIỂM THỬ TRỢ LÝ Y TẾ AI (AI PATIENT ASSISTANT TEST REPORT)

> **Môn học:** Quản trị Dự án Phần mềm (VKU SPM Capstone)  
> **Module:** AI Patient Assistant & Triage Engine  
> **Người thực hiện:** Vũ Huy Thành (`thanhvihuu2005`)  
> **Thời gian nghiệm thu:** 20/11/2026  
> **Tình trạng:** Passed 100% (6/6 Test Cases)

---

## 1. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Lệnh thực thi:
```bash
npm run test:ai
# hoặc
node --experimental-strip-types --test tests/ai-triage-engine.test.mjs
```

### Chi tiết các ca kiểm thử:

| STT | Tên ca kiểm thử | Mô tả & Đầu vào kiểm thử | Kết quả mong đợi | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **01** | `Red Flag Emergency Detection` | Nhập các triệu chứng nguy kịch: đau ngực dữ dội lan tay, tê yếu nửa người méo miệng, khó thở tím tái, sốt cao co giật, yêu cầu gọi 115. | Nhận diện cờ đỏ, gán `urgencyLevel = 'emergency'`, kích hoạt hotline 115 và phác đồ cấp cứu. | **PASSED** (0.84ms) |
| **02** | `Medical Knowledge Base Coverage` | Kiểm tra độ phủ của 8 chuyên khoa: Tim mạch, Thần kinh, Tiêu hóa, Hô hấp, Cơ xương khớp, Mắt, Nhi khoa, Da liễu. | Mỗi chuyên khoa chứa tối thiểu 5 từ khóa lâm sàng và cẩm nang chăm sóc tại nhà. | **PASSED** (0.16ms) |
| **03** | `Clinical Routing Accuracy` | Kiểm tra khả năng ánh xạ chính xác câu mô tả bệnh nhân vào chuyên khoa đích (7 ca triệu chứng thực tế). | Trả về đúng chuyên khoa và phân tầng mức độ khẩn cấp (Emergency / Urgent / Routine). | **PASSED** (0.25ms) |
| **04** | `EHR Safety Guardrails - Allergy` | Bệnh nhân có tiền sử dị ứng NSAID hỏi về thuốc giảm đau Ibuprofen/Aspirin. | Kích hoạt cảnh báo đỏ an toàn dược lâm sàng, khuyến cáo dùng Paracetamol đúng liều. | **PASSED** (0.22ms) |
| **05** | `EHR Safety Guardrails - Lifestyle` | Bệnh nhân hỏi về chế độ ăn uống, sinh hoạt kiêng cữ. | Trả về hướng dẫn dinh dưỡng, quy tắc 20-20-20 và chế độ nghỉ ngơi. | **PASSED** (0.11ms) |
| **06** | `Follow-up Questions Generator` | Sinh câu hỏi gợi mở đào sâu triệu chứng (thời gian bị, mức độ đau, triệu chứng đi kèm) theo mô hình Ada Health. | Trả về danh sách câu hỏi và các lựa chọn đa tầng kèm trọng số nguy cơ. | **PASSED** (0.14ms) |

---

## 2. TỔNG HỢP KIỂM CHỨNG TOÀN DIỆN (FULL VERIFICATION MATRIX)

- **Client TypeScript Typecheck:**
  - Lệnh: `npm run typecheck` (trong `client/`)
  - Kết quả: **`0 errors`**
- **Root Master Test Suite:**
  - Lệnh: `npm run test:ai && npm run test:booking-validation`
  - Kết quả: **`All passing`**
- **Tích hợp giao diện người dùng:**
  - Tích hợp liền mạch trên màn hình `AIAssistantScreen`.
  - Hiển thị thẻ phản hồi lâm sàng `AIClinicalResponseCard`, gợi ý bác sĩ chuyên khoa thực tế, nút gọi cấp cứu 115 và nút đặt lịch hẹn 1 chạm.
