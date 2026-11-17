import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkRedFlags,
  CLINICAL_SYMPTOM_KNOWLEDGE_BASE,
  RED_FLAG_SYMPTOMS,
} from '../client/src/services/aiMedicalKnowledge.ts';
import { checkEHRSafetyGuardrails } from '../client/src/services/aiSafetyGuardrails.ts';
import {
  FOLLOW_UP_TEMPLATES,
  getFollowUpQuestions,
} from '../client/src/services/aiFollowUpQuestions.ts';

test('1. Red Flag Emergency Detection: identifies life-threatening signs', () => {
  const criticalSymptoms = [
    { text: 'Tôi bị đau ngực dữ dội lan ra cánh tay trái', trigger: 'đau ngực dữ dội' },
    { text: 'Bệnh nhân có biểu hiện tê yếu nửa người và méo miệng nói đớ', trigger: 'tê yếu nửa người' },
    { text: 'Bé bị khó thở dữ dội, môi tím tái', trigger: 'khó thở dữ dội' },
    { text: 'Bệnh nhân lên cơn co giật và mất tri giác', trigger: 'co giật' },
    { text: 'Gia đình cần hỗ trợ gọi xe cấp cứu 115 khẩn cấp', trigger: 'yêu cầu hỗ trợ cấp cứu' },
  ];

  for (const item of criticalSymptoms) {
    const assessment = checkRedFlags(item.text);
    assert.equal(assessment.isEmergency, true, `Should detect emergency for: ${item.text}`);
    assert.equal(assessment.emergencyHotline, '115');
    assert.ok(assessment.emergencyProtocol.length > 0);
  }
});

test('2. Medical Knowledge Base: verifies comprehensive 8 specialty rules', () => {
  const expectedCategories = [
    'cardiology',
    'neurology',
    'gastroenterology',
    'pulmonology',
    'orthopedics',
    'ophthalmology',
    'pediatrics',
    'dermatology',
  ];

  assert.ok(CLINICAL_SYMPTOM_KNOWLEDGE_BASE.length >= 8);
  for (const cat of expectedCategories) {
    const rule = CLINICAL_SYMPTOM_KNOWLEDGE_BASE.find((r) => r.category === cat);
    assert.ok(rule, `Category ${cat} must exist in knowledge base`);
    assert.ok(rule.keywords.length >= 5, `Category ${cat} must have at least 5 keywords`);
    assert.ok(rule.homeCareTips.length >= 2, `Category ${cat} must include home care tips`);
    assert.ok(rule.specialtyName.length > 0);
  }
});

test('3. Clinical Routing Accuracy: scores symptoms against target specialty', () => {
  const cases = [
    { text: 'Đau đầu dữ dội thái dương và chóng mặt tiền đình hoa mắt', expectedCat: 'neurology' },
    { text: 'Hồi hộp đánh trống ngực, tức ngực trái và dao động huyết áp', expectedCat: 'cardiology' },
    { text: 'Mỏi mắt nhìn mờ và khô rát sau giờ làm việc máy tính', expectedCat: 'ophthalmology' },
    { text: 'Đau thắt lưng lan xuống chân và mỏi cổ vai gáy', expectedCat: 'orthopedics' },
    { text: 'Đau quặn dạ dày ợ chua và đầy hơi khó tiêu', expectedCat: 'gastroenterology' },
    { text: 'Ho có đờm sốt nhẹ và khò khè', expectedCat: 'pulmonology' },
    { text: 'Nổi mẩn ngứa phát ban dị ứng da mề đay', expectedCat: 'dermatology' },
  ];

  for (const c of cases) {
    const normalized = c.text.toLowerCase();
    let bestCat = '';
    let maxMatches = 0;

    for (const rule of CLINICAL_SYMPTOM_KNOWLEDGE_BASE) {
      const matchCount = rule.keywords.filter((kw) => normalized.includes(kw)).length;
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestCat = rule.category;
      }
    }

    assert.equal(bestCat, c.expectedCat, `Input "${c.text}" should route to ${c.expectedCat}`);
    assert.ok(maxMatches > 0);
  }
});

test('4. EHR Safety Guardrails: detects NSAID allergy and triggers pharmacological alert', () => {
  const patientEHR = {
    allergies: ['Dị ứng nhóm NSAID (Ibuprofen)'],
    chronicConditions: ['Tăng huyết áp'],
  };

  const alert = checkEHRSafetyGuardrails('Tôi đau đầu quá có được uống thuốc giảm đau Ibuprofen không?', patientEHR);
  assert.equal(alert.hasAlert, true);
  assert.equal(alert.alertType, 'allergy');
  assert.ok(alert.alertMessage?.includes('TIỀN SỬ DỊ ỨNG NHÓM NSAIDs'));
  assert.ok(alert.alertMessage?.includes('Paracetamol'));
});

test('5. EHR Safety Guardrails: provides lifestyle and home care guidance', () => {
  const lifestyleQuery = checkEHRSafetyGuardrails('Bác sĩ cho tôi hỏi chế độ ăn uống sinh hoạt kiêng cữ thế nào?');
  assert.equal(lifestyleQuery.hasAlert, true);
  assert.equal(lifestyleQuery.alertType, 'lifestyle');
  assert.ok(lifestyleQuery.alertMessage?.includes('HƯỚNG DẪN CHĂM SÓC'));
});

test('6. Follow-up Questions Generator: produces clinical intake questions', () => {
  const neuroQuestions = getFollowUpQuestions('neurology');
  assert.ok(neuroQuestions.length >= 2);
  assert.equal(neuroQuestions[0].id, 'neuro_duration');
  assert.ok(neuroQuestions[0].options.some((o) => o.value === '2-3d'));

  const cardioQuestions = getFollowUpQuestions('cardiology');
  assert.ok(cardioQuestions.length >= 1);
  assert.equal(cardioQuestions[0].id, 'cardio_trigger');

  const generalQuestions = getFollowUpQuestions('general');
  assert.ok(generalQuestions.length >= 1);
});
