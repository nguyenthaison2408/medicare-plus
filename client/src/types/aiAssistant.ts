import type { Ionicons } from '@expo/vector-icons';
import type { DoctorItem } from '../data/mockData';

export type TriageUrgencyLevel = 'emergency' | 'urgent' | 'routine' | 'self_care';

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

export interface RedFlagAssessment {
  isEmergency: boolean;
  triggerPhrase?: string;
  emergencyProtocol: string;
  emergencyHotline: string;
}

export interface ClinicalAnalysisResult {
  urgencyLevel: 'emergency' | 'soon' | 'routine';
  triageLevel: TriageUrgencyLevel;
  specialtyKey: SymptomCategory;
  specialtyName: string;
  specialtyDesc: string;
  specialtyIcon: keyof typeof Ionicons.glyphMap;
  analysisText: string;
  matchedKeywords: string[];
  confidenceScore: number;
  redFlag?: RedFlagAssessment;
  recommendedDoctorIds: string[];
  recommendedDoctors?: DoctorItem[];
  followUpQuestions?: FollowUpQuestion[];
  homeCareAdvice?: string[];
  allergyWarning?: string;
  disclaimer: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text?: string;
  time: string;
  clinicalCard?: {
    urgencyLevel?: 'emergency' | 'soon' | 'routine';
    analysisText: string;
    specialtyName: string;
    specialtyDesc: string;
    specialtyIcon: keyof typeof Ionicons.glyphMap;
    doctors: DoctorItem[];
    followUpQuestions?: FollowUpQuestion[];
    allergyWarning?: string;
    homeCareAdvice?: string[];
  };
}
