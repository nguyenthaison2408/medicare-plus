import type { Ionicons } from '@expo/vector-icons';
import type { DoctorItem } from '../data/mockData';
import type {
  ClinicalAnalysisResult,
  FollowUpQuestion,
  SymptomCategory,
  TriageUrgencyLevel,
} from '../types/aiAssistant';
import { getFollowUpQuestions } from './aiFollowUpQuestions';
import { getDoctorsForSpecialty } from './aiTriageEngine';

const VALID_CATEGORIES: SymptomCategory[] = [
  'cardiology',
  'neurology',
  'gastroenterology',
  'pulmonology',
  'orthopedics',
  'ophthalmology',
  'pediatrics',
  'dermatology',
  'ent',
  'general',
];

const SPECIALTY_ICONS: Record<SymptomCategory, keyof typeof Ionicons.glyphMap> = {
  cardiology: 'heart',
  neurology: 'pulse',
  gastroenterology: 'restaurant-outline',
  pulmonology: 'cloud-outline',
  orthopedics: 'fitness',
  ophthalmology: 'eye',
  pediatrics: 'happy-outline',
  dermatology: 'color-palette-outline',
  ent: 'ear-outline',
  general: 'medkit-outline',
};

interface GeminiRawPayload {
  urgencyLevel?: string;
  specialtyKey?: string;
  specialtyName?: string;
  specialtyDesc?: string;
  analysisText?: string;
  homeCareAdvice?: unknown;
  followUpQuestions?: unknown;
}

export interface GeminiTriageOptions {
  availableDoctors?: DoctorItem[];
  allergies?: string[];
  conversationHistory?: { role: 'user' | 'ai'; text: string }[];
  timeoutMs?: number;
}

function getAIConfig(): {
  provider: 'gemini' | 'groq' | null;
  apiKey: string;
  model: string;
} {
  const groqKey = (process.env.EXPO_PUBLIC_GROQ_API_KEY || '').trim();
  if (groqKey) {
    return {
      provider: 'groq',
      apiKey: groqKey,
      model: (process.env.EXPO_PUBLIC_GROQ_MODEL || 'llama-3.3-70b-versatile').trim(),
    };
  }
  const geminiKey = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
  if (geminiKey) {
    return {
      provider: 'gemini',
      apiKey: geminiKey,
      model: (process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash-lite').trim(),
    };
  }
  return { provider: null, apiKey: '', model: '' };
}

export function isGeminiConfigured(): boolean {
  return Boolean(getAIConfig().apiKey);
}

function sanitizeFollowUps(raw: unknown, category: SymptomCategory): FollowUpQuestion[] {
  if (!Array.isArray(raw)) {
    return getFollowUpQuestions(category);
  }
  const parsed: FollowUpQuestion[] = [];
  for (let i = 0; i < raw.length && parsed.length < 2; i++) {
    const item = raw[i] as Record<string, unknown>;
    if (!item || typeof item.question !== 'string' || !Array.isArray(item.options)) continue;
    const options = item.options
      .filter(
        (opt): opt is Record<string, unknown> =>
          Boolean(opt && typeof (opt as Record<string, unknown>).label === 'string')
      )
      .slice(0, 3)
      .map((opt, idx) => ({
        label: String(opt.label).trim(),
        value: typeof opt.value === 'string' && opt.value.trim() ? opt.value.trim() : `opt_${i}_${idx}`,
        riskModifier:
          typeof opt.riskModifier === 'number' && Number.isFinite(opt.riskModifier)
            ? Math.max(0, Math.min(3, Math.round(opt.riskModifier)))
            : idx,
      }))
      .filter((opt) => opt.label.length > 0);

    if (item.question.trim() && options.length >= 2) {
      parsed.push({
        id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `ai_q_${i}`,
        question: item.question.trim(),
        options,
      });
    }
  }
  return parsed.length > 0 ? parsed : getFollowUpQuestions(category);
}

function extractJsonObject(rawText: string): GeminiRawPayload | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;
  const fenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(fenced) as GeminiRawPayload;
  } catch {
    const start = fenced.indexOf('{');
    const end = fenced.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(fenced.slice(start, end + 1)) as GeminiRawPayload;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function runGeminiClinicalTriage(
  rawSymptomInput: string,
  options: GeminiTriageOptions = {}
): Promise<ClinicalAnalysisResult | null> {
  const { provider, apiKey, model } = getAIConfig();
  if (!provider || !apiKey) return null;

  const userText = (rawSymptomInput || '').trim();
  if (!userText) return null;

  const historyLines = (options.conversationHistory || [])
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'Bệnh nhân' : 'Trợ lý AI'}: ${m.text}`)
    .join('\n');

  const allergyNote =
    options.allergies && options.allergies.length > 0
      ? `Tiền sử dị ứng của bệnh nhân: ${options.allergies.join(', ')}.`
      : 'Chưa ghi nhận tiền sử dị ứng thuốc.';

  const systemPrompt = [
    'Bạn là Trợ lý Y tế AI của phòng khám Medicare Plus tại Việt Nam.',
    'Nhiệm vụ: phân tích triệu chứng bệnh nhân mô tả bằng tiếng Việt tự nhiên, định hướng ĐÚNG chuyên khoa, mức độ khẩn cấp, lời khuyên chăm sóc tại nhà an toàn và 1-2 câu hỏi khai thác thêm.',
    'QUY TẮC BẮT BUỘC:',
    '- KHÔNG kê đơn thuốc kê toa, KHÔNG khẳng định chẩn đoán chắc chắn thay bác sĩ.',
    '- Chọn chính xác 1 specialtyKey trong danh sách: cardiology, neurology, gastroenterology, pulmonology, orthopedics, ophthalmology, pediatrics, dermatology, ent, general.',
    '- Ví dụ: đau chân/đau khớp/bong gân/đau lưng -> orthopedics; đau đầu/chóng mặt/mất ngủ -> neurology; đau bụng/dạ dày -> gastroenterology; ho/khò khè -> pulmonology; đau tai/viêm xoang/đau họng -> ent; mẩn ngứa/dị ứng -> dermatology; đau mắt/nhìn mờ -> ophthalmology; trẻ nhỏ -> pediatrics; tức ngực/huyết áp/tim -> cardiology; triệu chứng chung không rõ -> general.',
    '- urgencyLevel chỉ nhận: "emergency" (nguy kịch tính mạng cần gọi 115), "soon" (nên đi khám sớm), hoặc "routine" (khám định kỳ/thông thường).',
    '- Trả về DUY NHẤT 1 JSON object đúng cấu trúc:',
    '{"urgencyLevel":"routine|soon|emergency","specialtyKey":"...","specialtyName":"Tên chuyên khoa tiếng Việt","specialtyDesc":"Mô tả ngắn 1 dòng","analysisText":"Phân tích súc tích 2-4 câu bằng tiếng Việt","homeCareAdvice":["Lời khuyên 1","Lời khuyên 2","Lời khuyên 3"],"followUpQuestions":[{"id":"q1","question":"Câu hỏi ngắn?","options":[{"label":"Lựa chọn 1","value":"v1","riskModifier":0},{"label":"Lựa chọn 2","value":"v2","riskModifier":2}]}]}',
  ].join('\n');

  const userPrompt = [
    allergyNote,
    historyLines ? `Ngữ cảnh hội thoại gần nhất:\n${historyLines}` : '',
    `Triệu chứng hiện tại bệnh nhân mô tả: "${userText}"`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);

  try {
    let text = '';

    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 700,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      text = data?.choices?.[0]?.message?.content || '';
    } else {
      const candidateModels = Array.from(
        new Set([model, 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite'])
      );
      for (const candidateModel of candidateModels) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 700,
              responseMimeType: 'application/json',
            },
          }),
        });
        if (!response.ok) {
          if (response.status === 404 || response.status === 429 || response.status === 503) {
            continue;
          }
          return null;
        }
        const data = (await response.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) break;
      }
      if (!text) return null;
    }

    const parsed = extractJsonObject(text);
    if (!parsed || !parsed.analysisText || typeof parsed.analysisText !== 'string') {
      return null;
    }

    const specialtyKey: SymptomCategory = VALID_CATEGORIES.includes(
      parsed.specialtyKey as SymptomCategory
    )
      ? (parsed.specialtyKey as SymptomCategory)
      : 'general';

    const urgencyLevel: 'emergency' | 'soon' | 'routine' =
      parsed.urgencyLevel === 'emergency'
        ? 'emergency'
        : parsed.urgencyLevel === 'soon'
          ? 'soon'
          : 'routine';

    const specialtyName =
      typeof parsed.specialtyName === 'string' && parsed.specialtyName.trim()
        ? parsed.specialtyName.trim()
        : 'Nội Tổng Quát & Đa Khoa';

    const specialtyDesc =
      typeof parsed.specialtyDesc === 'string' && parsed.specialtyDesc.trim()
        ? parsed.specialtyDesc.trim()
        : 'Tư vấn sàng lọc & định hướng chuyên khoa';

    const homeCareAdvice = Array.isArray(parsed.homeCareAdvice)
      ? parsed.homeCareAdvice
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .slice(0, 4)
      : [];

    const recommendedDoctors =
      urgencyLevel === 'emergency'
        ? []
        : getDoctorsForSpecialty(specialtyKey, specialtyName, options.availableDoctors);

    return {
      urgencyLevel,
      triageLevel: (urgencyLevel === 'soon' ? 'urgent' : urgencyLevel) as TriageUrgencyLevel,
      specialtyKey,
      specialtyName,
      specialtyDesc,
      specialtyIcon: SPECIALTY_ICONS[specialtyKey] || 'medkit-outline',
      analysisText: parsed.analysisText.trim(),
      matchedKeywords: [],
      confidenceScore: 0.92,
      recommendedDoctorIds: recommendedDoctors.map((d) => d.id),
      recommendedDoctors,
      followUpQuestions:
        urgencyLevel === 'emergency'
          ? []
          : sanitizeFollowUps(parsed.followUpQuestions, specialtyKey),
      homeCareAdvice:
        homeCareAdvice.length > 0
          ? homeCareAdvice
          : [
              'Nghỉ ngơi hợp lý và theo dõi diễn tiến triệu chứng.',
              'Đến cơ sở y tế sớm nếu triệu chứng tăng nặng hoặc kéo dài.',
            ],
      disclaimer:
        'Lưu ý: Kết quả phân tích từ Gemini AI chỉ mang tính định hướng chuyên khoa tham khảo, không thay thế chẩn đoán lâm sàng của bác sĩ.',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
