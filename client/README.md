# MediCare Plus — Expo client

Client Expo 58, React Native 0.88 và TypeScript. Hướng dẫn cấu hình/chạy đầy đủ, nhóm, tỷ lệ 30–22–28–20 và hồ sơ: [README dự án](../README.md).

Ứng dụng có bốn vai trò từ clinic_profiles: patient, reception, doctor, admin. Cloud dùng Supabase Auth/Data API/RPC; server Express là demo riêng. Không đặt service-role key hoặc mật khẩu DB trong EXPO_PUBLIC_*.

Chạy npm ci rồi npm run web; npm run lint, npm run typecheck và npm run build để kiểm tra. Cấu hình public trong .env.local theo [.env.example](.env.example); không commit .env.local. Cấu hình EAS preview/production không chứng minh có APK được nghiệm thu.

Mã đã tích hợp: booking/QR/EMR, hồ sơ và người thân, thuốc, chat, ca trực, ước tính BHYT, email tùy chọn và trợ lý theo luật. OTP do server Supabase xác minh. Các giới hạn: avatar picker native, Google OAuth end-to-end, email thực, QR/chat hai thiết bị và UAT còn theo dõi theo Issue; trợ lý không gọi LLM, BHYT chưa xác minh với cơ quan bảo hiểm. Xem [Scrum](https://github.com/users/nguyenthaison2408/projects/1).
