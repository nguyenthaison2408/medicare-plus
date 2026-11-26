export type SymptomCategory =
  | 'cardiology'
  | 'neurology'
  | 'gastroenterology'
  | 'pulmonology'
  | 'orthopedics'
  | 'ophthalmology'
  | 'pediatrics'
  | 'dermatology'
  | 'ent'
  | 'general';

export interface FollowUpOption {
  label: string;
  value: string;
  riskModifier?: number;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  options: FollowUpOption[];
}

export const FOLLOW_UP_TEMPLATES: Record<SymptomCategory, FollowUpQuestion[]> = {
  neurology: [
    {
      id: 'neuro_duration',
      question: 'Triệu chứng đau đầu / chóng mặt đã xuất hiện bao lâu?',
      options: [
        { label: 'Dưới 24 giờ', value: '<24h', riskModifier: 0 },
        { label: '2 - 3 ngày nay', value: '2-3d', riskModifier: 1 },
        { label: 'Kéo dài > 1 tuần', value: '>1w', riskModifier: 2 },
      ],
    },
    {
      id: 'neuro_severity',
      question: 'Mức độ đau ảnh hưởng thế nào đến sinh hoạt?',
      options: [
        { label: 'Nhẹ, vẫn làm việc được', value: 'mild', riskModifier: 0 },
        { label: 'Vừa, cần nghỉ ngơi', value: 'moderate', riskModifier: 1 },
        { label: 'Dữ dội, không thể tập trung', value: 'severe', riskModifier: 3 },
      ],
    },
  ],
  cardiology: [
    {
      id: 'cardio_trigger',
      question: 'Cảm giác tức ngực / hồi hộp xuất hiện nhiều nhất khi nào?',
      options: [
        { label: 'Khi vận động / leo cầu thang', value: 'exertion', riskModifier: 2 },
        { label: 'Ngay cả khi đang nghỉ ngơi', value: 'rest', riskModifier: 3 },
        { label: 'Khi căng thẳng / lo âu', value: 'stress', riskModifier: 1 },
      ],
    },
  ],
  gastroenterology: [
    {
      id: 'gastro_timing',
      question: 'Triệu chứng đau dạ dày / khó tiêu tăng lên vào lúc nào?',
      options: [
        { label: 'Lúc bụng đói', value: 'empty_stomach', riskModifier: 1 },
        { label: 'Ngay sau khi ăn', value: 'post_meal', riskModifier: 1 },
        { label: 'Đau âm ỉ không theo bữa ăn', value: 'continuous', riskModifier: 2 },
      ],
    },
  ],
  pulmonology: [
    {
      id: 'pulmo_cough_type',
      question: 'Đặc điểm cơn ho của bạn như thế nào?',
      options: [
        { label: 'Ho khan, rát họng', value: 'dry_cough', riskModifier: 0 },
        { label: 'Ho có đờm vàng/xanh', value: 'productive_cough', riskModifier: 2 },
        { label: 'Ho kèm theo khò khè', value: 'wheezing', riskModifier: 2 },
      ],
    },
  ],
  orthopedics: [
    {
      id: 'ortho_radiation',
      question: 'Cơn đau chân / tay / khớp hoặc cột sống có kèm dấu hiệu nào sau đây không?',
      options: [
        { label: 'Chỉ đau mỏi tại chỗ, không sưng', value: 'local', riskModifier: 0 },
        { label: 'Sưng, nóng đỏ hoặc bầm tím sau va chạm', value: 'swelling_trauma', riskModifier: 2 },
        { label: 'Lan tê buốt dọc chân hoặc cánh tay', value: 'radiate_leg', riskModifier: 3 },
      ],
    },
    {
      id: 'ortho_mobility',
      question: 'Mức độ ảnh hưởng đến việc đi lại / vận động của bạn?',
      options: [
        { label: 'Vẫn đi lại, cử động bình thường', value: 'normal', riskModifier: 0 },
        { label: 'Đau khi đi lại hoặc đứng lâu', value: 'limited', riskModifier: 1 },
        { label: 'Khó cử động hoặc không thể chịu lực', value: 'severe_immobility', riskModifier: 3 },
      ],
    },
  ],
  ophthalmology: [
    {
      id: 'ophtha_screen',
      question: 'Mắt bạn mỏi và mờ nhiều hơn khi nào?',
      options: [
        { label: 'Sau giờ làm việc máy tính', value: 'screen_fatigue', riskModifier: 0 },
        { label: 'Khi nhìn xa ngoài đường', value: 'distance_blur', riskModifier: 1 },
        { label: 'Mờ liên tục cả ngày', value: 'constant_blur', riskModifier: 2 },
      ],
    },
  ],
  pediatrics: [
    {
      id: 'pedia_alertness',
      question: 'Tình trạng sinh hoạt của bé hiện tại ra sao?',
      options: [
        { label: 'Bé vẫn chơi và ăn uống bình thường', value: 'active', riskModifier: 0 },
        { label: 'Bé mệt mỏi, quấy khóc nhiều', value: 'fussy', riskModifier: 1 },
        { label: 'Bé li bì, bỏ bú, uống nước kém', value: 'lethargic', riskModifier: 3 },
      ],
    },
  ],
  dermatology: [
    {
      id: 'derma_spread',
      question: 'Các nốt mẩn đỏ / mụn có dấu hiệu lan rộng không?',
      options: [
        { label: 'Chỉ khu trú một vùng nhỏ', value: 'localized', riskModifier: 0 },
        { label: 'Lan ra nhiều vùng trên cơ thể', value: 'spreading', riskModifier: 2 },
      ],
    },
  ],
  ent: [
    {
      id: 'ent_fever',
      question: 'Đau họng hoặc nghẹt mũi có kèm sốt không?',
      options: [
        { label: 'Không có sốt', value: 'no_fever', riskModifier: 0 },
        { label: 'Sốt nhẹ dưới 38.5°C', value: 'mild_fever', riskModifier: 1 },
        { label: 'Sốt cao trên 38.5°C', value: 'high_fever', riskModifier: 2 },
      ],
    },
  ],
  general: [
    {
      id: 'gen_duration',
      question: 'Triệu chứng khó chịu này đã diễn ra bao lâu?',
      options: [
        { label: 'Mới xuất hiện trong hôm nay', value: 'today', riskModifier: 0 },
        { label: 'Vài ngày gần đây', value: 'few_days', riskModifier: 1 },
        { label: 'Kéo dài hơn 2 tuần', value: 'chronic', riskModifier: 2 },
      ],
    },
  ],
};

export const getFollowUpQuestions = (category: SymptomCategory): FollowUpQuestion[] => {
  return FOLLOW_UP_TEMPLATES[category] || FOLLOW_UP_TEMPLATES.general;
};
