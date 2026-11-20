import type { FollowUpQuestion } from './aiFollowUpQuestions';

export interface FollowUpState {
  id: number;
  urgencyLevel: 'emergency' | 'soon' | 'routine';
  remainingFollowUps: FollowUpQuestion[];
  accumulatedRisk: number;
}

export function refineFollowUp<T extends FollowUpState>(
  context: T | null, contextId: number | undefined, questionId: string, optionValue: string
): T | null {
  if (!context || context.id !== contextId || context.urgencyLevel === 'emergency') return null;
  const question = context.remainingFollowUps.find(item => item.id === questionId);
  const option = question?.options.find(item => item.value === optionValue);
  if (!question || !option) return null;
  const accumulatedRisk = context.accumulatedRisk + (option.riskModifier || 0);
  return {
    ...context,
    accumulatedRisk,
    urgencyLevel: accumulatedRisk >= 3 ? 'soon' : context.urgencyLevel,
    remainingFollowUps: context.remainingFollowUps.filter(item => item.id !== questionId),
  };
}
