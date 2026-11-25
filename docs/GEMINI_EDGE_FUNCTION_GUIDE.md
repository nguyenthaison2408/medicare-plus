# Bảo mật Gemini API Key qua Supabase Edge Function (`ai-triage`)

## 1. Mục tiêu bảo mật
Không bao giờ nhúng `GEMINI_API_KEY` dưới dạng `EXPO_PUBLIC_*` vào mã nguồn client hoặc bundle `.apk`. Mọi lời gọi đến Google Gemini API đều đi qua **Supabase Edge Function** `ai-triage` chạy trên server của Supabase.

## 2. Luồng xử lý
```text
Client (App / Web)
  ├── [Khẩn cấp Red Flag] ──> Cảnh báo gọi 115 tức thì (0ms, không cần mạng)
  └── [Tư vấn thường] ──────> Supabase Edge Function: /functions/v1/ai-triage
                                 ├── Xác thực JWT người dùng (supabase.auth.getUser)
                                 ├── Đọc GEMINI_API_KEY từ Supabase Secrets
                                 ├── Áp dụng System Prompt y khoa cố định
                                 └── Gọi Gemini 2.5 Flash (timeout 12s)
```

## 3. Triển khai trên Supabase Dashboard
1. Mở **Edge Functions** $\rightarrow$ tạo hoặc mở function **`ai-triage`** với mã nguồn tại `supabase/functions/ai-triage/index.ts`.
2. Mở **Edge Functions** $\rightarrow$ **Secrets** $\rightarrow$ thêm biến:
   - `Name`: `GEMINI_API_KEY`
   - `Value`: Key từ Google AI Studio (`https://aistudio.google.com/apikey`).
3. Client gọi qua `askGeminiEdgeAssistant()` trong `client/src/services/aiEdgeClient.ts` và tự động fallback về `aiTriageEngine` cục bộ nếu mất mạng hoặc chưa đăng nhập.

## 4. Kiểm thử tự động
- `npm run test:ai`: **19/19 tests PASS**, bao gồm kiểm tra `sanitizeGeminiReply`, `buildGeminiHistory`, và bài test bảo mật quét toàn bộ `client/src/` để đảm bảo không rò rỉ API Key.
- `npm run lint` & `npm run typecheck`: **0 lỗi, 0 cảnh báo**.
