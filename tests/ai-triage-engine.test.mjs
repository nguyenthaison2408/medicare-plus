import {buildGeminiHistory,sanitizeGeminiReply} from '../client/src/utils/aiHistory.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
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

const clean = source => stripTypeScriptTypes(source.replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g, '')).replace(/export\s+/g, '');
const source = file => fs.readFileSync(new URL('../client/src/' + file, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const engineCode = ['services/aiMedicalKnowledge.ts', 'services/aiFollowUpQuestions.ts', 'services/aiTriageEngine.ts']
  .map(file => clean(source(file))).join('\n');
const engine = vm.runInNewContext(engineCode + ';({getDoctorsForSpecialty,runClinicalTriage})', {DOCTORS});
const resolveSpecialtyDoctors = engine.getDoctorsForSpecialty;

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

test('cloud routing uses only supplied active doctors and never falls back to mock ids', () => {
  const catalog = [DOCTORS[0], DOCTORS[1]];
  const result = engine.runClinicalTriage('Nổi mẩn ngứa phát ban', {availableDoctors: catalog});
  assert.equal(result.recommendedDoctors.length, 0);
  const empty = engine.runClinicalTriage('đau đầu', {availableDoctors: []});
  assert.equal(empty.recommendedDoctors.length, 0);
  const cardiology = engine.runClinicalTriage('hồi hộp đánh trống ngực', {availableDoctors: catalog});
  assert.ok(cardiology.recommendedDoctors.length > 0);
  assert.ok(cardiology.recommendedDoctors.every(d => catalog.some(c => c.id === d.id)));
});
test('actual screen analysis preserves emergency even with medication keywords', () => {
  const main = source('screens/MainTabScreens.tsx');
  const analyzer = main.slice(main.indexOf('const analyzeMedicalSymptom ='), main.indexOf('export const AIAssistantScreen:'));
  const analyze = vm.runInNewContext(clean(analyzer) + ';analyzeMedicalSymptom', {runClinicalTriage: engine.runClinicalTriage, checkEHRSafetyGuardrails});
  assert.equal(analyze('đau ngực dữ dội, uống thuốc gì?', [], []).clinicalCard.urgencyLevel, 'emergency');
  assert.equal(analyze('nổi mẩn ngứa phát ban', [], []).clinicalCard.doctors.length, 0);
});
test('cloud patient profile does not inherit the sample allergy list', () => {
  const src = source('context/AppContext.tsx');
  const begin = src.indexOf('CLOUD_MODE\n    ? {', src.indexOf('const resolvedPatientProfile:'));
  const end = src.indexOf('\n    : localPatientProfile;', begin) + '\n    : localPatientProfile'.length;
  const profile = vm.runInNewContext('(' + src.slice(begin, end) + ')', {CLOUD_MODE: true, PATIENT_PROFILE: {allergies: ['SAMPLE-ALLERGY']}, localPatientProfile: {}, cloudProfile: {id:'patient',full_name:'Patient'}});
  assert.equal(profile.allergies.length, 0);
});
const refine = vm.runInNewContext(clean(source('services/aiConversation.ts')) + ';refineFollowUp');
const context = () => ({id: 1, urgencyLevel: 'routine', remainingFollowUps: getFollowUpQuestions('neurology'), accumulatedRisk: 0});
test('follow-up responses cannot be applied twice or to a different conversation', () => {
  const initial = context();
  const q = initial.remainingFollowUps[0];
  const next = refine(initial, 1, q.id, q.options[1].value);
  assert.ok(next);
  assert.equal(refine(next, 1, q.id, q.options[1].value), null);
  assert.equal(refine(initial, 2, q.id, q.options[1].value), null);
});
test('follow-up cannot downgrade emergency or accept an unknown answer', () => {
  const initial = context(), q = initial.remainingFollowUps[0];
  assert.equal(refine({...initial, urgencyLevel:'emergency'}, 1, q.id, q.options[0].value), null);
  assert.equal(refine(initial, 1, q.id, 'unrecognized'), null);
});
test('severe canonical answer increases urgency while preserving specialty context', () => {
  const initial = {...context(), specialtyName:'Original specialty'};
  const q = initial.remainingFollowUps.find(x => x.id === 'neuro_severity');
  const next = refine(initial, 1, q.id, 'severe');
  assert.equal(next.urgencyLevel, 'soon');
  assert.equal(next.specialtyName, initial.specialtyName);
});

test('leg and joint pain route to orthopedics (accented & unaccented), never neurology or pulmonology', () => {
  const accented = engine.runClinicalTriage('Tôi bị đau chân và sưng cổ chân');
  assert.equal(accented.specialtyKey, 'orthopedics');
  assert.ok(accented.specialtyName.includes('Cơ Xương Khớp'));
  assert.equal(
    accented.recommendedDoctors.some((d) => d.id === 'doc-1'),
    false,
    'Orthopedics must not recommend headache neurologist doc-1'
  );

  const unaccented = engine.runClinicalTriage('bac si cho toi hoi toi bi dau chan');
  assert.equal(unaccented.specialtyKey, 'orthopedics', 'Should route unaccented "dau chan" to orthopedics and ignore "ho" inside "cho"');

  const ent = engine.runClinicalTriage('Tôi bị đau tai và nghẹt mũi');
  assert.equal(ent.specialtyKey, 'ent');

  const fallback = engine.runClinicalTriage('Hôm nay tôi thấy người hơi uể oải');
  assert.equal(fallback.specialtyKey, 'general', 'Unknown symptoms must fall back to general medicine, never neurology');
  assert.ok(fallback.specialtyName.includes('Nội Tổng Quát'));
});

test('mobile booking refuses another doctor at the same time before sending a cloud write', async () => {
 const text=source('context/AppContext.tsx');const a=text.indexOf('  const createBooking =');const b=text.indexOf('    if (CLOUD_MODE) {\n      if (consultMode',a);assert.ok(a>=0&&b>a);
 const code=stripTypeScriptTypes(text.slice(a,b)+' return null; };');let calls=0;
 const invoke=vm.runInNewContext(code+';createBooking',{CLOUD_MODE:true,cloudUserIdRef:{current:'patient-a'},appointments:[{status:'upcoming',startsAt:'2026-11-27T09:00:00+07:00',patientId:'patient-a',doctor:{id:'doc-2',name:'Other doctor'}}],toClinicStart:()=> '2026-11-27T09:00:00+07:00',bookClinicAppointment:()=>calls++});
 await assert.rejects(invoke({doctor:{id:'doc-1',name:'Doctor'},day:{fullDate:'27/11/2026'},slot:{time:'09:00'}}),/2 bác sĩ/);assert.equal(calls,0);
});

test('client source never embeds provider API credentials or bypasses PayOS verification',()=>{
 const files=fs.readdirSync(new URL('../client/src/',import.meta.url),{recursive:true}).filter(p=>/\.(ts|tsx)$/.test(p));
 for(const p of files)assert.doesNotMatch(source(p),/EXPO_PUBLIC_(?:GEMINI|GROQ).*KEY|generativelanguage\.googleapis\.com|api\.groq\.com/,p);
 const payment=source('screens/BookingFlowScreens.tsx');assert.doesNotMatch(payment,/isDirectQr|directQrImageUrl|Tôi đã chuyển khoản/);
});

test('buildGeminiHistory bounds turns and extracts clinicalCard analysisText', () => {
  const msgs = [
    { sender: 'user', text: 'Tôi bị đau đầu' },
    { sender: 'ai', clinicalCard: { analysisText: 'Bạn có thể khám Thần kinh.' } },
    { sender: 'user', text: '   ' },
    { sender: 'ai', text: 'Bạn đau mấy ngày rồi?' },
  ];
  const history = buildGeminiHistory(msgs, 2);
  assert.equal(history.length, 2);
  assert.deepEqual(history[0], { role: 'model', text: 'Bạn có thể khám Thần kinh.' });
  assert.deepEqual(history[1], { role: 'model', text: 'Bạn đau mấy ngày rồi?' });
});
test('sanitizeGeminiReply strips markdown noise and enforces max length', () => {
  assert.equal(sanitizeGeminiReply('   '), '');
  assert.equal(
    sanitizeGeminiReply('**Khuyến nghị:** Uống nhiều nước và `nghỉ ngơi`'),
    'Khuyến nghị: Uống nhiều nước và nghỉ ngơi'
  );
  const longText = 'A'.repeat(120);
  const clipped = sanitizeGeminiReply(longText, 50);
  assert.equal(clipped.length, 50);
  assert.ok(clipped.endsWith('...'));
});
test('security guardrail: client source never embeds Gemini API keys or direct endpoints', () => {
  const srcRoot = new URL('../client/src/', import.meta.url);
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const full = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isDirectory()) files = files.concat(walk(full));
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(full);
    }
    return files;
  };
  for (const fileUrl of walk(srcRoot)) {
    const content = fs.readFileSync(fileUrl, 'utf8');
    assert.equal(/EXPO_PUBLIC_GEMINI/i.test(content), false, `Forbidden env var in ${fileUrl}`);
    assert.equal(/AIza[0-9A-Za-z_-]{20,}/.test(content), false, `Forbidden API key literal in ${fileUrl}`);
    assert.equal(/generativelanguage\.googleapis\.com/i.test(content), false, `Direct Gemini URL in ${fileUrl}`);
  }
});
