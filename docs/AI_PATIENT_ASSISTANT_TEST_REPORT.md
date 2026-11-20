# BÁO CÁO THỰC THI & KIỂM THỬ TRỢ LÝ Y TẾ AI (AI PATIENT ASSISTANT TEST REPORT)

> **Môn học:** Quản trị Dự án Phần mềm (VKU SPM Capstone)  
> **Module:** AI Patient Assistant & Triage Engine  
> **Người thực hiện:** Vi Hữu Thành (`thanhvihuu2005`)  
> **Thời gian nghiệm thu:** 20/11/2026  
> **Tình trạng:** Passed 100% (10/10 Test Cases)

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
| **01** | `Red Flag Emergency Detection` | Nhập các triệu chứng nguy kịch: đau ngực dữ dội lan tay, tê yếu nửa người méo miệng, khó thở tím tái, sốt cao co giật, yêu cầu gọi 115. | Nhận diện cờ đỏ, gán `urgencyLevel = 'emergency'`, kích hoạt hotline 115 và phác đồ cấp cứu. | **PASSED** (1.3ms) |
| **02** | `Medical Knowledge Base Coverage` | Kiểm tra độ phủ của 8 chuyên khoa: Tim mạch, Thần kinh, Tiêu hóa, Hô hấp, Cơ xương khớp, Mắt, Nhi khoa, Da liễu. | Mỗi chuyên khoa chứa tối thiểu 5 từ khóa lâm sàng và cẩm nang chăm sóc tại nhà. | **PASSED** (0.3ms) |
| **03** | `Clinical Routing Accuracy` | Kiểm tra khả năng ánh xạ chính xác câu mô tả bệnh nhân vào chuyên khoa đích (7 ca triệu chứng thực tế). | Trả về đúng chuyên khoa và phân tầng mức độ khẩn cấp (Emergency / Urgent / Routine). | **PASSED** (0.4ms) |
| **04** | `EHR Safety Guardrails - Allergy` | Bệnh nhân có tiền sử dị ứng NSAID hỏi về thuốc giảm đau Ibuprofen/Aspirin. | Kích hoạt cảnh báo an toàn dược lâm sàng, khuyến cáo dùng Paracetamol đúng liều. | **PASSED** (0.2ms) |
| **05** | `EHR Safety Guardrails - Lifestyle` | Bệnh nhân hỏi về chế độ ăn uống, sinh hoạt kiêng cữ. | Trả về hướng dẫn dinh dưỡng, quy tắc 20-20-20 và chế độ nghỉ ngơi. | **PASSED** (0.1ms) |
| **06** | `Follow-up Questions Generator` | Sinh câu hỏi gợi mở đào sâu triệu chứng (thời gian bị, mức độ đau, triệu chứng đi kèm) theo mô hình Ada Health. | Trả về danh sách câu hỏi và các lựa chọn đa tầng kèm trọng số nguy cơ. | **PASSED** (0.2ms) |
| **07** | `Emergency Priority over Medication` | Nhập "Tôi đau ngực dữ dội, có nên uống thuốc không?". | Ưu tiên cấp cứu tuyệt đối: gán `urgencyLevel = 'emergency'`, không bị câu hỏi thuốc hạ xuống `soon`. | **PASSED** (0.1ms) |
| **08** | `EHR Allergy Isolation` | Kiểm tra bệnh nhân không có tiền sử dị ứng (`allergies: []`). | Không gán cảnh báo dị ứng giả, tôn trọng hồ sơ thực tế của bệnh nhân. | **PASSED** (0.1ms) |
| **09** | `Specialty Doctor Recommendation` | Kiểm tra định tuyến bác sĩ chuyên khoa Da liễu, Tiêu hóa, Hô hấp, Nhi khoa. | Nhóm Da liễu trỏ đúng bác sĩ Da liễu (`doc-5`), không bị trỏ sai sang Mắt hay Thần kinh. | **PASSED** (0.3ms) |
| **10** | `Follow-up Risk Modifier Escalation` | Bệnh nhân chọn các phương án có `riskModifier >= 3` (đau dữ dội). | Hệ thống tự động tích lũy điểm nguy cơ và leo thang mức độ khẩn cấp sang `soon`. | **PASSED** (0.2ms) |

---

## 2. TỔNG HỢP KIỂM CHỨNG TOÀN DIỆN (FULL VERIFICATION MATRIX)

- **Client ESLint:**
  - Lệnh: `npm run lint` (trong `client/`)
  - Kết quả: **`0 errors, 0 warnings`** (Đã dọn sạch các biến không dùng).
- **Client TypeScript Typecheck:**
  - Lệnh: `npm run typecheck` (trong `client/`)
  - Kết quả: **`0 errors`**
- **Root Master Test Suite:**
  - Lệnh: `npm run test:ai && npm run test:booking-validation && npm run test:auth`
  - Kết quả: **`100% Passed`**
- **Đồng bộ nhánh Main:**
  - Đã merge sạch toàn bộ commit mới nhất từ `origin/main`.
