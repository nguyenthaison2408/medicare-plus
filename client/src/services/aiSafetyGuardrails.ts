export interface PatientEHRContext {
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
}

export interface SafetyCheckResult {
  hasAlert: boolean;
  alertType?: 'allergy' | 'chronic_disease' | 'lifestyle' | 'medication';
  alertMessage?: string;
}

export const checkEHRSafetyGuardrails = (
  rawInput: string,
  ehrContext?: PatientEHRContext
): SafetyCheckResult => {
  const q = (rawInput || '').toLowerCase();

  // 1. Kiểm tra câu hỏi liên quan đến thuốc giảm đau / kháng viêm
  const isAskingMedication =
    q.includes('thuốc') ||
    q.includes('giảm đau') ||
    q.includes('uống gì') ||
    q.includes('liều lượng') ||
    q.includes('kháng viêm') ||
    q.includes('ibuprofen') ||
    q.includes('aspirin') ||
    q.includes('panadol') ||
    q.includes('paracetamol');

  if (isAskingMedication) {
    const allergies = ehrContext?.allergies || ['NSAID (Ibuprofen)'];
    const hasNSAIDAllergy = allergies.some((a) =>
      a.toLowerCase().includes('nsaid') || a.toLowerCase().includes('ibuprofen')
    );

    if (hasNSAIDAllergy) {
      return {
        hasAlert: true,
        alertType: 'allergy',
        alertMessage:
          'CẢNH BÁO AN TOÀN DƯỢC LÂM SÀNG: Hồ sơ bệnh án điện tử (EHR) của bạn có ghi nhận TIỀN SỬ DỊ ỨNG NHÓM NSAIDs (Ibuprofen, Aspirin, Diclofenac). Bạn tuyệt đối KHÔNG tự ý mua các thuốc giảm đau nhóm NSAID vì nguy cơ phù Quincke, co thắt phế quản hoặc sốc phản vệ. Nếu cần giảm đau hạ sốt tạm thời, hãy tham khảo ý kiến bác sĩ hoặc dược sĩ chuyên môn trước khi dùng Paracetamol đúng liều khuyến cáo (10-15mg/kg).',
      };
    }

    return {
      hasAlert: true,
      alertType: 'medication',
      alertMessage:
        'LƯU Ý DÙNG THUỐC AN TOÀN: Mọi đơn thuốc kháng sinh hoặc giảm đau đều cần có chỉ định trực tiếp từ bác sĩ chuyên khoa. Không tự ý tăng giảm liều hoặc sử dụng lại đơn thuốc cũ.',
    };
  }

  // 2. Chế độ dinh dưỡng, ăn uống kiêng cữ
  if (
    q.includes('kiêng') ||
    q.includes('ăn uống') ||
    q.includes('ăn gì') ||
    q.includes('chế độ ăn') ||
    q.includes('sinh hoạt')
  ) {
    return {
      hasAlert: true,
      alertType: 'lifestyle',
      alertMessage:
        'HƯỚNG DẪN CHĂM SÓC & SINH HOẠT TẠI NHÀ:\n• Hạn chế cà phê, trà đặc, rượu bia và thức ăn chiên rán nhiều dầu mỡ/gia vị cay nóng.\n• Bổ sung đủ 1.8 – 2.0 lít nước ấm mỗi ngày, tăng cường rau xanh và hoa quả giàu vitamin C.\n• Nghỉ ngơi hợp lý, ngủ trước 23:00 và tránh nhìn màn hình thiết bị điện tử liên tục.',
    };
  }

  return {
    hasAlert: false,
  };
};
