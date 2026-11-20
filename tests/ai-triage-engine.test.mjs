import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkRedFlags,
  CLINICAL_SYMPTOM_KNOWLEDGE_BASE,
} from '../client/src/services/aiMedicalKnowledge.ts';
import { checkEHRSafetyGuardrails } from '../client/src/services/aiSafetyGuardrails.ts';
import {
  getFollowUpQuestions,
} from '../client/src/services/aiFollowUpQuestions.ts';
import { DOCTORS } from '../client/src/data/mockData.ts';

// Helper matching logic as used in aiTriageEngine
function resolveSpecialtyDoctors(category, specialtyName) {
  const target = (specialtyName || '').toLowerCase();
  const bySpecialty = DOCTORS.filter((d) => {
    const spec = d.specialty.toLowerCase();
    const sub = d.subSpecialty.toLowerCase();
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
  return bySpecialty.length > 0 ? bySpecialty : [DOCTORS[0]];
}

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

test('7. Emergency Priority: emergency symptoms combined with medication inquiry MUST trigger emergency', () => {
  const query = 'Tôi đau ngực dữ dội, có nên uống thuốc không?';
  const redFlag = checkRedFlags(query);
  assert.equal(redFlag.isEmergency, true, 'Emergency red flag must be detected even when query asks about medication');
  assert.equal(redFlag.triggerPhrase, 'đau ngực dữ dội');
  assert.equal(redFlag.emergencyHotline, '115');
});

test('8. EHR Allergy Isolation: patient without documented allergy MUST NOT receive fake allergy warnings', () => {
  const cleanProfile = { allergies: [] };
  const alert = checkEHRSafetyGuardrails('Tôi bị sốt có uống thuốc hạ sốt được không?', cleanProfile);
  assert.notEqual(alert.alertType, 'allergy', 'Should not falsely trigger NSAID allergy for patients without allergy');

  const emptyContextAlert = checkEHRSafetyGuardrails('Tôi uống thuốc gì được?', {});
  assert.notEqual(emptyContextAlert.alertType, 'allergy', 'Empty context must not default to NSAID allergy');
});

test('9. Specialty Doctor Recommendation: dermatology routes to dermatologist, NOT ophthalmology or neurology', () => {
  const dermaDocs = resolveSpecialtyDoctors('dermatology', 'Da Liễu');
  assert.ok(dermaDocs.length > 0, 'Dermatology must have recommended doctors');
  assert.ok(
    dermaDocs.some((d) => d.specialty.toLowerCase().includes('da liễu')),
    'Dermatology must recommend a dermatologist'
  );
  assert.equal(
    dermaDocs.some((d) => d.id === 'doc-3' && d.specialty.toLowerCase().includes('mắt')),
    false,
    'Dermatology must NOT map to ophthalmologist doc-3'
  );

  const gastroDocs = resolveSpecialtyDoctors('gastroenterology', 'Tiêu Hóa');
  assert.ok(gastroDocs.some((d) => d.specialty.toLowerCase().includes('tiêu hóa')));

  const pulmoDocs = resolveSpecialtyDoctors('pulmonology', 'Hô Hấp');
  assert.ok(pulmoDocs.some((d) => d.specialty.toLowerCase().includes('hô hấp')));

  const pediaDocs = resolveSpecialtyDoctors('pediatrics', 'Nhi Khoa');
  assert.ok(pediaDocs.some((d) => d.specialty.toLowerCase().includes('nhi')));
});

test('10. Follow-up Risk Modifier & Urgency Escalation: severe options have riskModifier >= 3 to escalate urgency', () => {
  const neuroQuestions = getFollowUpQuestions('neurology');
  const severityQuestion = neuroQuestions.find((q) => q.id === 'neuro_severity');
  assert.ok(severityQuestion, 'Severity follow-up question must exist');

  const severeOption = severityQuestion.options.find((o) => o.value === 'severe');
  assert.ok(severeOption, 'Severe option must exist');
  assert.ok(Number(severeOption.riskModifier) >= 3, 'Severe option riskModifier must be >= 3 to escalate urgency');
});
