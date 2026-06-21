import { Disposition, DispositionLevel } from './types';

export type SymptomKey = 
  | 'chest_pain' 
  | 'breathing' 
  | 'headache' 
  | 'low_mood' 
  | 'anxious' 
  | 'tired' 
  | 'cough' 
  | 'nothing';

export interface Question {
  id: string;
  text: string;
  isRedFlag: boolean;
}

export const RED_FLAG_QUESTIONS: Record<string, Question[]> = {
  chest_pain: [
    { id: 'cp_1', text: 'Does the pain feel heavy, pressing, or like a tight band around your chest?', isRedFlag: true },
    { id: 'cp_2', text: 'Does the pain spread to your arms, neck, jaw, or back?', isRedFlag: true },
    { id: 'cp_fup', text: 'Is the pain only there when you breathe in or cough?', isRedFlag: false }
  ],
  breathing: [
    { id: 'br_1', text: 'Are you struggling to get enough air even while resting?', isRedFlag: true },
    { id: 'br_2', text: 'Are you find it difficult to speak in full sentences?', isRedFlag: true },
    { id: 'br_fup', text: 'Do you have a wheeze or a known history of asthma?', isRedFlag: false }
  ],
  headache: [
    { id: 'hd_1', text: 'Did the headache start suddenly and feel like a sudden hit to the head?', isRedFlag: true },
    { id: 'hd_2', text: 'Is it accompanied by a stiff neck, fever, or a rash that doesn\'t fade?', isRedFlag: true },
    { id: 'hd_fup', text: 'Is this a recurring headache similar to ones you have had before?', isRedFlag: false }
  ],
  low_mood: [
    { id: 'lm_1', text: 'Are you currently feeling like you might be at immediate risk of hurting yourself or others?', isRedFlag: true }
  ]
};

export const getEmergencyDisposition = (): Disposition => ({
  level: 'emergency-999',
  title: 'Call 999 Immediately',
  detail: 'Your answers indicate a potential emergency. Please stop using this app and seek help now.',
  reason: 'One or more red flags were identified during screening.',
  actions: ['Call 999', 'Ask someone to stay with you', 'Keep your phone nearby']
});

export const getFinalDisposition = (path: SymptomKey, answeredYesToFollowUp: boolean): Disposition => {
  if (answeredYesToFollowUp) {
    return {
      level: 'gp-routine',
      title: 'Contact your GP',
      detail: 'While not an emergency, these symptoms should be discussed with a doctor.',
      actions: ['Book a routine appointment', 'Monitor symptoms daily in this app']
    };
  }
  return {
    level: 'urgent-111',
    title: 'Contact NHS 111',
    detail: 'You should seek medical advice soon to discuss these symptoms.',
    actions: ['Call 111 or visit 111.nhs.uk', 'Speak to a pharmacist if 111 is busy']
  };
};