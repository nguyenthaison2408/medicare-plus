# Kiến trúc Kết quả Cận lâm sàng (PDF / X-Quang) & Supabase Storage

## 1. Tổng quan
Tính năng cho phép **Bác sĩ** tải lên tệp kết quả xét nghiệm máu (`.pdf`) hoặc hình ảnh chẩn đoán hình ảnh (`.jpg`, `.png`, `.webp` như X-Quang, MRI, CT) gắn trực tiếp vào lịch hẹn/bệnh án của bệnh nhân thông qua **Supabase Storage**, đồng thời cho phép **Bệnh nhân** tra cứu, xem ảnh phóng to hoặc tải/mở tệp PDF trực tiếp trên ứng dụng.

## 2. Cơ sở dữ liệu & Bảo mật (PostgreSQL + RLS + Storage)
- **Migration 1** ([202611250001_clinic_lab_results.sql](file:///../supabase/migrations/202611250001_clinic_lab_results.sql)): Tạo bảng `public.clinic_lab_results` với ràng buộc định dạng MIME (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`) và dung lượng tối đa 10 MB (`10485760` bytes).
- **Migration 2** ([202611250002_clinic_lab_results_rls_rpc.sql](file:///../supabase/migrations/202611250002_clinic_lab_results_rls_rpc.sql)): Bật RLS bảo vệ dữ liệu theo từng bệnh nhân (`patient_id = auth.uid()`), chỉ cho phép bác sĩ phụ trách hoặc admin gọi RPC `clinic_add_lab_result` và `clinic_delete_lab_result`.
- **Migration 3** ([202611250003_clinic_lab_results_storage.sql](file:///../supabase/migrations/202611250003_clinic_lab_results_storage.sql)): Khởi tạo private bucket `clinic-lab-results` trên Supabase Storage và chính sách truy cập `storage.objects` (bác sĩ/admin upload & xóa; bệnh nhân chỉ được đọc file thuộc hồ sơ của mình qua Signed URL).

## 3. Thành phần Client & Service
- **Types**: `client/src/types/labResults.ts`
- **Validation & Helpers**: `client/src/utils/labResultValidation.ts` (kiểm tra dung lượng 10MB, định dạng tệp, chuẩn hóa tên tệp tiếng Việt thành đường dẫn Storage an toàn).
- **File Picker**: `client/src/utils/labFilePicker.ts` (hỗ trợ chọn file PDF/Ảnh trên Web).
- **Cloud Service**: `client/src/services/clinicLabResults.ts` (upload lên Storage, rollback file nếu RPC lưu metadata lỗi, tạo Signed URL thời hạn 1 giờ).
- **UI Components**:
  - `DoctorLabUploadModal.tsx`: Giao diện cho bác sĩ chọn loại CĐHA/Xét nghiệm, nhập kết luận, chọn file và tải lên.
  - `LabFileViewerModal.tsx`: Trình xem ảnh PACS phóng to (cho X-Quang/MRI) và mở tệp PDF.
  - Tích hợp vào `RoleDashboards.tsx` (Bác sĩ), `TelehealthAndFamilyScreens.tsx` (`LabAndImagingResultsScreen`) và `MainTabScreens.tsx` (`EHRScreen`).

## 4. Kết quả Kiểm thử Tự động
- `npm run test:lab`: **5/5 unit tests PASS** (kiểm tra MIME, kích thước tối đa 10MB, validate form, sanitize đường dẫn Storage).
- `npm run test:db`: **29/29 core SQL checks + 103/103 extension checks PASS** (gồm 10 test case mới cho `clinic_lab_results`: chặn bệnh nhân/lễ tân upload, cô lập dữ liệu giữa các bệnh nhân, từ chối file >10MB hoặc sai định dạng, xóa kết quả).
- `npm run lint` & `npm run typecheck`: **0 lỗi, 0 cảnh báo**.
