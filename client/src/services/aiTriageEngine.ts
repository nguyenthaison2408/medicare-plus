import { DOCTORS, type DoctorItem } from '../data/mockData';
import type {
  ClinicalAnalysisResult,
  SymptomCategory,
  TriageUrgencyLevel,
} from '../types/aiAssistant';
import {
  checkRedFlags,
  CLINICAL_SYMPTOM_KNOWLEDGE_BASE,
  type MedicalSymptomRule,
} from './aiMedicalKnowledge';
import { getFollowUpQuestions } from './aiFollowUpQuestions';

export const getDoctorsForSpecialty = (
  category: SymptomCategory,
  specialtyName?: string,
  catalog: DoctorItem[] = DOCTORS
): DoctorItem[] => {
  const target = (specialtyName || '').toLowerCase();
  const bySpecialty = catalog.filter((d) => {
    const spec = d.specialty.toLowerCase();
    const sub = (d.subSpecialty || '').toLowerCase();
    if (category === 'dermatology') return spec.includes('da liễu') || sub.includes('da liễu');
    if (category === 'gastroenterology') return spec.includes('tiêu hóa') || sub.includes('tiêu hóa');
    if (category === 'pulmonology') return spec.includes('hô hấp') || sub.includes('hô hấp');
    if (category === 'pediatrics') return spec.includes('nhi') || sub.includes('nhi');
    if (category === 'ophthalmology') return spec.includes('mắt') || sub.includes('mắt');
    if (category === 'cardiology') return spec.includes('tim') || sub.includes('tim');
    if (category === 'neurology') return spec.includes('thần kinh') || sub.includes('thần kinh');
    if (category === 'orthopedics') return sub.includes('cột sống') || sub.includes('ngoại thần kinh') || spec.includes('thần kinh');
    return target && (spec.includes(target) || target.includes(spec));
  });

  return bySpecialty;
};

export interface TriageEngineOptions {
  availableDoctors?: DoctorItem[];
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  hasChronicCondition?: boolean;
}

export const runClinicalTriage = (
  rawSymptomInput: string,
  options?: TriageEngineOptions
): ClinicalAnalysisResult => {
  const normalized = (rawSymptomInput || '').trim().toLowerCase();

  // 1. Phân luồng Cấp cứu Red Flag
  const redFlag = checkRedFlags(normalized);
  if (redFlag.isEmergency) {
    const emergencyDoctors: DoctorItem[] = [];
    return {
      urgencyLevel: 'emergency',
      triageLevel: 'emergency' as TriageUrgencyLevel,
      specialtyKey: 'general',
      specialtyName: 'Cấp Cứu & Hồi Sức Tích Cực',
      specialtyDesc: 'Can thiệp tim mạch & hồi sức đột quỵ khẩn cấp 24/7',
      specialtyIcon: 'medkit',
      analysisText: `CẢNH BÁO ĐỎ Y TẾ: ${redFlag.emergencyProtocol} Bệnh nhân có dấu hiệu "${redFlag.triggerPhrase}" - nguy cơ đe dọa chức năng sống. Tuyệt đối không tự ý dùng thuốc hoặc trì hoãn khám.`,
      matchedKeywords: redFlag.triggerPhrase ? [redFlag.triggerPhrase] : ['cấp cứu'],
      confidenceScore: 0.98,
      redFlag,
      recommendedDoctorIds: emergencyDoctors.map((d) => d.id),
      recommendedDoctors: emergencyDoctors,
      disclaimer:
        'CẢNH BÁO: Tình trạng nghi ngờ cấp cứu y tế. Hãy gọi 115 hoặc di chuyển ngay đến phòng Cấp cứu bệnh viện gần nhất!',
    };
  }

  // 2. Chấm điểm triệu chứng theo từng chuyên khoa
  let bestRule: MedicalSymptomRule | null = null;
  let maxMatchedScore = 0;
  let bestKeywords: string[] = [];

  for (const rule of CLINICAL_SYMPTOM_KNOWLEDGE_BASE) {
    const matched = rule.keywords.filter((kw) => normalized.includes(kw));
    const score = matched.reduce((acc, kw) => acc + (kw.length > 4 ? 2 : 1), 0);

    if (score > maxMatchedScore) {
      maxMatchedScore = score;
      bestRule = rule;
      bestKeywords = matched;
    }
  }

  // 3. Nếu phát hiện chuyên khoa phù hợp
  if (bestRule && maxMatchedScore > 0) {
    const recommendedDocs = getDoctorsForSpecialty(bestRule.category, bestRule.specialtyName, options?.availableDoctors);
    const confidence = Math.min(0.95, 0.65 + maxMatchedScore * 0.08);

    let calculatedUrgency: 'emergency' | 'soon' | 'routine' =
      bestRule.defaultUrgency === 'urgent' ? 'soon' : 'routine';

    if (options?.hasChronicCondition && calculatedUrgency === 'routine') {
      calculatedUrgency = 'soon';
    }

    return {
      urgencyLevel: calculatedUrgency,
      triageLevel: (calculatedUrgency === 'soon' ? 'urgent' : 'routine') as TriageUrgencyLevel,
      specialtyKey: bestRule.category,
      specialtyName: bestRule.specialtyName,
      specialtyDesc: bestRule.specialtyDesc,
      specialtyIcon: bestRule.specialtyIcon,
      analysisText: bestRule.baseAnalysis,
      matchedKeywords: bestKeywords,
      confidenceScore: confidence,
      recommendedDoctorIds: recommendedDocs.map((d) => d.id),
      recommendedDoctors: recommendedDocs,
      followUpQuestions: getFollowUpQuestions(bestRule.category),
      homeCareAdvice: bestRule.homeCareTips,
      disclaimer:
        'Lưu ý: Kết quả phân tích từ AI chỉ mang tính định hướng chuyên khoa tham khảo, không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn.',
    };
  }

  // 4. Fallback mặc định: Nội Thần kinh & Y học gia đình tổng quát
  const defaultDocs = getDoctorsForSpecialty('general', 'Nội khoa', options?.availableDoctors);
  return {
    urgencyLevel: 'soon',
    triageLevel: 'routine' as TriageUrgencyLevel,
    specialtyKey: 'neurology',
    specialtyName: 'Nội Thần Kinh & Đa Khoa',
    specialtyDesc: 'Khám sàng lọc triệu chứng đau đầu, mất ngủ & thể trạng mệt mỏi',
    specialtyIcon: 'pulse',
    analysisText:
      'Dựa trên mô tả triệu chứng của bạn, hệ thống khuyến nghị bạn nên khám sàng lọc ban đầu tại chuyên khoa Nội Thần kinh hoặc Bác sĩ Đa khoa để được thực hiện các xét nghiệm cơ bản, chẩn đoán phân biệt nguyên nhân gây mệt mỏi/khó chịu.',
    matchedKeywords: [],
    confidenceScore: 0.7,
    recommendedDoctorIds: defaultDocs.map((d) => d.id),
    recommendedDoctors: defaultDocs,
    followUpQuestions: getFollowUpQuestions('general'),
    homeCareAdvice: [
      'Uống đủ nước (1.5 - 2 lít/ngày), duy trì ngủ đủ giấc 7-8 tiếng.',
      'Ghi chép nhật ký triệu chứng (thời gian khởi phát, mức độ đau, thời điểm đau tăng).',
      'Đến cơ sở y tế gần nhất nếu triệu chứng kéo dài hoặc tăng nặng.',
    ],
    disclaimer:
      'Lưu ý: Kết quả phân tích từ AI chỉ mang tính định hướng chuyên khoa tham khảo, không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn.',
  };
};
