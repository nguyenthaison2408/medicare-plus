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

export interface RedFlagAssessment {
  isEmergency: boolean;
  triggerPhrase?: string;
  emergencyProtocol: string;
  emergencyHotline: string;
}

export interface MedicalSymptomRule {
  category: SymptomCategory;
  specialtyName: string;
  specialtyDesc: string;
  specialtyIcon: any;
  keywords: string[];
  defaultUrgency: 'emergency' | 'urgent' | 'routine';
  baseAnalysis: string;
  homeCareTips: string[];
}

export const RED_FLAG_SYMPTOMS: { keywords: string[]; protocol: string }[] = [
  {
    keywords: [
      'đau ngực dữ dội',
      'đè nặng lồng ngực',
      'tức ngực lan cánh tay',
      'đau ngực lan cằm',
      'nhồi máu cơ tim',
    ],
    protocol:
      'Nghi ngờ hội chứng mạch vành cấp hoặc nhồi máu cơ tim. Cần gọi cấp cứu 115 và đưa đến cơ sở có can thiệp tim mạch ngay lập tức.',
  },
  {
    keywords: [
      'tê yếu nửa người',
      'méo miệng',
      'nói ngọng',
      'nói đớ',
      'liệt nửa người',
      'đột quỵ',
      'tai biến',
    ],
    protocol:
      'Dấu hiệu cảnh báo đột quỵ não cấp (quy tắc FAST). Thời gian vàng là trong 3-4.5 giờ đầu. Yêu cầu gọi 115 hoặc chuyển cấp cứu thần kinh.',
  },
  {
    keywords: [
      'khó thở dữ dội',
      'tím tái',
      'nghẹt thở',
      'suy hô hấp',
      'thở rít',
    ],
    protocol:
      'Tình trạng tắc nghẽn đường thở hoặc suy hô hấp cấp tính nguy hiểm tính mạng. Cần hỗ trợ y tế khẩn cấp 115.',
  },
  {
    keywords: [
      'co giật',
      'ngất xỉu',
      'mất tri giác',
      'sốt cao co giật',
      'nôn ra máu',
      'đi cầu phân đen',
    ],
    protocol:
      'Tình trạng cấp cứu nội ngoại khoa khẩn cấp. Không cho bệnh nhân ăn uống, đặt nằm nghiêng an toàn và gọi 115 ngay.',
  },
];

export const stripVietnameseAccents = (input: string): string =>
  (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const escapeRegexKeyword = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const matchesMedicalKeyword = (normalizedText: string, keyword: string): boolean => {
  const cleanText = ` ${(normalizedText || '').toLowerCase()} `;
  const cleanKw = (keyword || '').trim().toLowerCase();
  if (!cleanKw) return false;

  const boundaryPattern = new RegExp(
    `(?:^|[\\s,.;:!?()\\-/"'])${escapeRegexKeyword(cleanKw)}(?:$|[\\s,.;:!?()\\-/"'])`,
    'i'
  );
  if (boundaryPattern.test(cleanText)) {
    return true;
  }

  // Hỗ trợ người dùng gõ tiếng Việt không dấu cho cụm từ rõ nghĩa (>= 2 từ)
  if (cleanKw.includes(' ')) {
    const asciiText = ` ${stripVietnameseAccents(normalizedText)} `;
    const asciiKw = stripVietnameseAccents(cleanKw);
    const asciiPattern = new RegExp(
      `(?:^|[\\s,.;:!?()\\-/"'])${escapeRegexKeyword(asciiKw)}(?:$|[\\s,.;:!?()\\-/"'])`,
      'i'
    );
    return asciiPattern.test(asciiText);
  }

  return false;
};

export const checkRedFlags = (normalizedText: string): RedFlagAssessment => {
  const lower = normalizedText.toLowerCase();

  if (
    matchesMedicalKeyword(lower, 'cấp cứu') ||
    matchesMedicalKeyword(lower, 'nguy kịch') ||
    matchesMedicalKeyword(lower, '115')
  ) {
    return {
      isEmergency: true,
      triggerPhrase: 'yêu cầu hỗ trợ cấp cứu',
      emergencyProtocol:
        'Tình trạng y tế khẩn cấp. Vui lòng gọi 115 hoặc đến ngay phòng Cấp cứu bệnh viện gần nhất.',
      emergencyHotline: '115',
    };
  }

  for (const item of RED_FLAG_SYMPTOMS) {
    for (const kw of item.keywords) {
      if (matchesMedicalKeyword(lower, kw)) {
        return {
          isEmergency: true,
          triggerPhrase: kw,
          emergencyProtocol: item.protocol,
          emergencyHotline: '115',
        };
      }
    }
  }

  return {
    isEmergency: false,
    emergencyProtocol: '',
    emergencyHotline: '115',
  };
};

export const CLINICAL_SYMPTOM_KNOWLEDGE_BASE: MedicalSymptomRule[] = [
  {
    category: 'cardiology',
    specialtyName: 'Tim Mạch',
    specialtyDesc: 'Tăng huyết áp, mạch vành & rối loạn nhịp tim',
    specialtyIcon: 'heart',
    keywords: [
      'tim',
      'tức ngực',
      'hồi hộp',
      'đánh trống ngực',
      'huyết áp',
      'huyết áp cao',
      'tụt huyết áp',
      'mạch nhanh',
      'mạch chậm',
      'đau ngực trái',
    ],
    defaultUrgency: 'urgent',
    baseAnalysis:
      'Triệu chứng tim mạch như tức ngực, hồi hộp, đánh trống ngực hoặc dao động huyết áp cần kiểm tra điện tâm đồ (ECG), siêu âm tim Doppler và men tim để đánh giá chức năng tuần hoàn và loại trừ thiếu máu cơ tim.',
    homeCareTips: [
      'Nghỉ ngơi tại chỗ ở tư thế nửa nằm nửa ngồi, nới lỏng trang phục.',
      'Đo và ghi lại chỉ số huyết áp, nhịp tim nếu có máy đo tại nhà.',
      'Tránh uống cà phê, trà đậm đặc, rượu bia và không hút thuốc lá.',
    ],
  },
  {
    category: 'neurology',
    specialtyName: 'Nội Thần Kinh',
    specialtyDesc: 'Đau đầu, chóng mặt, rối loạn tiền đình & mất ngủ',
    specialtyIcon: 'pulse',
    keywords: [
      'đau đầu',
      'nửa đầu',
      'chóng mặt',
      'tiền đình',
      'mất ngủ',
      'hoa mắt',
      'choáng váng',
      'say xẩm',
      'khó ngủ',
      'căng thẳng thần kinh',
      'migraine',
    ],
    defaultUrgency: 'urgent',
    baseAnalysis:
      'Các triệu chứng đau đầu vận mạch Migraine, chóng mặt tiền đình hoặc mất ngủ mạn tính có thể xuất phát từ rối loạn tuần hoàn não, căng thẳng hoặc thoái hóa đốt sống cổ gây chèn ép mạch máu não.',
    homeCareTips: [
      'Nghỉ ngơi trong không gian yên tĩnh, giảm bớt ánh sáng chói.',
      'Bổ sung đủ 1.5 – 2 lít nước mỗi ngày, tránh để cơ thể mất nước.',
      'Áp dụng quy tắc 20-20-20 khi làm việc với màn hình máy tính.',
    ],
  },
  {
    category: 'gastroenterology',
    specialtyName: 'Tiêu Hóa & Gan Mật',
    specialtyDesc: 'Viêm loét dạ dày, trào ngược GERD & đại tràng',
    specialtyIcon: 'restaurant-outline',
    keywords: [
      'dạ dày',
      'đau bụng',
      'trào ngược',
      'ợ chua',
      'ợ nóng',
      'buồn nôn',
      'tiêu chảy',
      'táo bón',
      'chướng bụng',
      'đầy hơi',
      'khó tiêu',
      'viêm đại tràng',
    ],
    defaultUrgency: 'routine',
    baseAnalysis:
      'Triệu chứng đau thượng vị, ợ chua trào ngược hoặc rối loạn tiêu hóa gợi ý tình trạng viêm loét dạ dày - tá tràng hoặc hội chứng ruột kích thích (IBS). Bác sĩ có thể chỉ định nội soi tiêu hóa và test vi khuẩn HP.',
    homeCareTips: [
      'Ăn đúng giờ, không bỏ bữa, chia nhỏ bữa ăn trong ngày.',
      'Kiêng các chất chua cay, thức ăn nhiều dầu mỡ, nước có ga và rượu bia.',
      'Không nằm ngay sau khi ăn ít nhất 2 giờ để phòng trào ngược.',
    ],
  },
  {
    category: 'pulmonology',
    specialtyName: 'Hô Hấp & Phổi',
    specialtyDesc: 'Viêm phế quản, hen suyễn & ho kéo dài',
    specialtyIcon: 'cloud-outline',
    keywords: [
      'ho',
      'ho khan',
      'ho đờm',
      'khò khè',
      'viêm họng',
      'rát họng',
      'sốt nhẹ',
      'cảm cúm',
      'ngạt mũi',
      'chảy nước mũi',
      'viêm phế quản',
      'viêm phổi',
    ],
    defaultUrgency: 'routine',
    baseAnalysis:
      'Tình trạng ho kéo dài kèm khò khè, rát cổ hoặc sốt nhẹ thường liên quan đến nhiễm trùng đường hô hấp trên/dưới hoặc phản ứng viêm do dị ứng thời tiết. Cần khám để nghe phổi và chụp X-quang khi cần thiết.',
    homeCareTips: [
      'Uống nhiều nước ấm, súc họng bằng dung dịch nước muối sinh lý 0.9% ngày 3 lần.',
      'Giữ ấm vùng cổ ngực, đeo khẩu trang khi ra ngoài.',
      'Sử dụng máy tạo độ ẩm nếu ở trong phòng điều hòa liên tục.',
    ],
  },
  {
    category: 'orthopedics',
    specialtyName: 'Cơ Xương Khớp & Chấn Thương Chỉnh Hình',
    specialtyDesc: 'Đau chân tay, khớp gối, cột sống, bong gân & thoái hóa khớp',
    specialtyIcon: 'fitness',
    keywords: [
      'đau chân',
      'nhức chân',
      'mỏi chân',
      'sưng chân',
      'đau bắp chân',
      'đau bàn chân',
      'đau gót chân',
      'đau cổ chân',
      'trẹo chân',
      'đau tay',
      'đau cổ tay',
      'đau cánh tay',
      'đau vai',
      'đau bả vai',
      'đau đầu gối',
      'đau gối',
      'khớp gối',
      'mỏi gối',
      'đau khớp',
      'sưng khớp',
      'viêm khớp',
      'thoái hóa khớp',
      'cứng khớp',
      'đau lưng',
      'đau thắt lưng',
      'cột sống',
      'thoát vị',
      'thoát vị đĩa đệm',
      'cổ vai gáy',
      'đau cổ',
      'thần kinh tọa',
      'tê chân',
      'tê tay',
      'chuột rút',
      'căng cơ',
      'đau cơ',
      'nhức xương',
      'đau xương',
      'gãy xương',
      'trật khớp',
      'bong gân',
      'chấn thương',
      'gút',
      'gout',
    ],
    defaultUrgency: 'urgent',
    baseAnalysis:
      'Triệu chứng đau nhức chân tay, đau khớp, căng cơ, bong gân hoặc đau cột sống thuộc nhóm bệnh lý Cơ Xương Khớp & Chấn thương chỉnh hình. Bác sĩ chuyên khoa cần thăm khám vận động, kiểm tra khớp/dây chằng và có thể chỉ định chụp X-quang, siêu âm khớp hoặc MRI để xác định chính xác nguyên nhân.',
    homeCareTips: [
      'Hạn chế vận động mạnh, đứng lâu hoặc mang vác nặng ở vùng chân/khớp đang đau.',
      'Nếu mới sưng đau do va chạm hoặc bong gân trong 48 giờ đầu: chườm lạnh 15 phút/lần và kê cao chân.',
      'Nếu đau mỏi cơ mạn tính không sưng nóng: chườm ấm nhẹ nhàng 15-20 phút và không tự ý bóp rượu thuốc mạnh.',
    ],
  },
  {
    category: 'ophthalmology',
    specialtyName: 'Mắt (Nhãn Khoa)',
    specialtyDesc: 'Khúc xạ, khô mắt kỹ thuật số & viêm kết mạc',
    specialtyIcon: 'eye',
    keywords: [
      'mắt',
      'nhìn mờ',
      'mỏi mắt',
      'khô mắt',
      'nhức mắt',
      'thị lực',
      'chảy nước mắt',
      'đỏ mắt',
      'cận thị',
      'ngứa mắt',
    ],
    defaultUrgency: 'routine',
    baseAnalysis:
      'Mỏi mắt, cay rát hoặc giảm thị lực tạm thời thường gặp ở hội chứng thị giác màn hình máy tính (Computer Vision Syndrome) hoặc thay đổi tật khúc xạ. Nên đo khúc xạ và khám đáy mắt định kỳ.',
    homeCareTips: [
      'Thực hiện quy tắc 20-20-20 (nhìn xa 20 feet trong 20 giây sau mỗi 20 phút nhìn màn hình).',
      'Nhỏ nước mắt nhân tạo không chất bảo quản khi có cảm giác khô rát.',
      'Đảm bảo ánh sáng làm việc đầy đủ, không nhìn màn hình trong phòng tối.',
    ],
  },
  {
    category: 'pediatrics',
    specialtyName: 'Nhi Khoa',
    specialtyDesc: 'Chăm sóc sức khỏe toàn diện & bệnh lý trẻ em',
    specialtyIcon: 'happy-outline',
    keywords: [
      'trẻ em',
      'em bé',
      'bé sơ sinh',
      'bé sốt',
      'sốt mọc răng',
      'biếng ăn',
      'tiêu chảy trẻ em',
      'nôn trớ',
      'quấy khóc',
      'phát ban trẻ',
    ],
    defaultUrgency: 'urgent',
    baseAnalysis:
      'Bệnh lý ở trẻ em tiến triển rất nhanh. Cần theo dõi sát nhiệt độ cơ thể, tình trạng tỉnh táo, mức độ bú/uống nước và nhịp thở của bé. Đưa trẻ đi khám ngay nếu sốt cao hoặc li bì.',
    homeCareTips: [
      'Mặc quần áo thoáng mát, lau ấm các vùng nách bẹn khi trẻ sốt nhẹ.',
      'Bù nước điện giải Oresol đúng tỷ lệ pha theo hướng dẫn y tế.',
      'Không tự ý dùng thuốc hạ sốt quá liều quy định tính theo cân nặng.',
    ],
  },
  {
    category: 'dermatology',
    specialtyName: 'Da Liễu',
    specialtyDesc: 'Dị ứng da, mẩn ngứa, mề đay & viêm da cơ địa',
    specialtyIcon: 'color-palette-outline',
    keywords: [
      'ngứa',
      'dị ứng',
      'phát ban',
      'mề đay',
      'mẩn đỏ',
      'nổi mụn',
      'viêm da',
      'bong tróc',
      'zona',
      'chàm',
    ],
    defaultUrgency: 'routine',
    baseAnalysis:
      'Các nốt mẩn đỏ, ngứa ngáy hoặc phát ban mề đay thường do phản ứng dị ứng tiếp xúc, thời tiết hoặc thực phẩm. Cần tránh gãi mạnh gây trầy xước bội nhiễm và thăm khám bác sĩ da liễu để xác định dị nguyên.',
    homeCareTips: [
      'Không cào gãi làm tổn thương bề mặt da, cắt ngắn móng tay.',
      'Tắm bằng nước ấm vừa phải, tránh xà phòng có chất tẩy rửa mạnh.',
      'Mặc đồ cotton mềm rộng rãi, tránh tiếp xúc các chất nghi gây dị ứng.',
    ],
  },
  {
    category: 'ent',
    specialtyName: 'Tai - Mũi - Họng',
    specialtyDesc: 'Viêm xoang, viêm tai giữa, viêm amidan & đau họng',
    specialtyIcon: 'ear-outline',
    keywords: [
      'đau tai',
      'ù tai',
      'viêm tai',
      'nghe kém',
      'viêm xoang',
      'nghẹt mũi',
      'viêm mũi dị ứng',
      'viêm amidan',
      'đau họng',
      'nuốt đau',
      'khàn tiếng',
      'mất tiếng',
      'chảy máu cam',
    ],
    defaultUrgency: 'routine',
    baseAnalysis:
      'Triệu chứng đau tai, ù tai, nghẹt mũi xoang hoặc đau rát họng nuốt vướng thường gặp trong các bệnh lý Tai - Mũi - Họng như viêm tai giữa, viêm xoang cấp hoặc viêm amidan. Nên nội soi Tai Mũi Họng để đánh giá chính xác.',
    homeCareTips: [
      'Rửa mũi và súc họng bằng nước muối sinh lý 0.9% hằng ngày.',
      'Uống nước ấm, hạn chế đồ uống quá lạnh hoặc cay nóng.',
      'Không tự ý dùng tăm bông ngoáy sâu vào ống tai khi đang đau tai.',
    ],
  },
];
