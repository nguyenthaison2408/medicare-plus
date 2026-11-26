import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_INSTRUCTION = `Bạn là Trợ lý Y tế AI của hệ thống phòng khám MediCare Plus.
Nhiệm vụ của bạn:
1. Lắng nghe triệu chứng của bệnh nhân bằng tiếng Việt rõ ràng, đồng cảm và chuyên nghiệp.
2. Nếu phát hiện dấu hiệu cấp cứu nguy kịch (đau ngực dữ dội lan tay trái/hàm, khó thở nặng, yếu liệt nửa người, méo miệng, nói ngọng, co giật, mất ý thức, xuất huyết ồ ạt), hãy ĐẶT CẢNH BÁO GỌI CẤP CỨU 115 LÊN ĐẦU TIÊN.
3. Gợi ý chuyên khoa phù hợp (Thần kinh, Tim mạch, Nội khoa, Da liễu, Tiêu hóa, Hô hấp, Mắt, Nhi khoa) và các lưu ý chăm sóc tại nhà an toàn.
4. Tuyệt đối KHÔNG tự ý kê đơn thuốc kháng sinh hoặc thuốc kê toa; nếu bệnh nhân có tiền sử dị ứng (như NSAIDs) thì phải nhắc nhở tránh dùng nhóm thuốc đó.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') return new Response(JSON.stringify({error:'METHOD_NOT_ALLOWED'}),{status:405,headers:{...corsHeaders,'Content-Type':'application/json',Allow:'POST, OPTIONS'}});
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Vui lòng đăng nhập để sử dụng Trợ lý AI.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Phiên đăng nhập không hợp lệ.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > 16000) return new Response(JSON.stringify({error:'REQUEST_TOO_LARGE'}),{status:413,headers:{...corsHeaders,'Content-Type':'application/json'}});
    let body;
    try { body = JSON.parse(rawBody); } catch { return new Response(JSON.stringify({error:'INVALID_JSON'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}}); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return new Response(JSON.stringify({error:'INVALID_BODY'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const allergies: string[] = Array.isArray(body?.allergies) ? body.allergies.filter((v: unknown): v is string => typeof v === 'string').slice(0,20).map((v: string)=>v.slice(0,100)) : [];
    const history: {role:'user'|'model';text:string}[] = Array.isArray(body?.history) ? body.history.filter((h: unknown): h is {role:'user'|'model';text:string} => !!h && typeof h === 'object' && ['user','model'].includes((h as {role:string}).role) && typeof (h as {text:string}).text === 'string').slice(-6) : [];

    if (!message || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Nội dung câu hỏi phải từ 1 đến 2000 ký tự.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allergyContext = allergies.length > 0
      ? `\n[Hồ sơ dị ứng của bệnh nhân: ${allergies.join(', ')}]`
      : '\n[Hồ sơ bệnh nhân chưa ghi nhận dị ứng thuốc]';

    const contents = [
      ...history.map((h: { role: string; text: string }) => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(h.text || '').slice(0, 1000) }],
      })),
      {
        role: 'user',
        parts: [{ text: `${message}${allergyContext}` }],
      },
    ];

    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 12000);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 800,
          },
        }),
      }
    );


    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) {
      throw new Error('AI_PROVIDER_FAILED');
    }

    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Xin lỗi, hiện tại tôi chưa thể phân tích câu hỏi này. Vui lòng thử lại hoặc đặt lịch khám bác sĩ.';

    return new Response(JSON.stringify({ reply, model: 'gemini-2.5-flash' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    void err;
    const msg = 'Dịch vụ AI tạm thời chưa khả dụng. Vui lòng thử lại sau.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
});
