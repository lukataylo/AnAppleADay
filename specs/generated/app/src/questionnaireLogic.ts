import { Disposition } from './types';

export type QuestionnaireType = 'PHQ9' | 'GAD7';

export interface QuestionnaireItem {
  text: string;
  options: { label: string; value: number }[];
}

const COMMON_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

export const PHQ9_QUESTIONS: QuestionnaireItem[] = [
  { text: 'Little interest or pleasure in doing things', options: COMMON_OPTIONS },
  { text: 'Feeling down, depressed, or hopeless', options: COMMON_OPTIONS },
  { text: 'Trouble falling or staying asleep, or sleeping too much', options: COMMON_OPTIONS },
  { text: 'Feeling tired or having little energy', options: COMMON_OPTIONS },
  { text: 'Poor appetite or overeating', options: COMMON_OPTIONS },
  { text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', options: COMMON_OPTIONS },
  { text: 'Trouble concentrating on things, such as reading the newspaper or watching television', options: COMMON_OPTIONS },
  { text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', options: COMMON_OPTIONS },
  { text: 'Thoughts that you would be better off dead or of hurting yourself in some way', options: COMMON_OPTIONS },
];

export const GAD7_QUESTIONS: QuestionnaireItem[] = [
  { text: 'Feeling nervous, anxious or on edge', options: COMMON_OPTIONS },
  { text: 'Not being able to stop or control worrying', options: COMMON_OPTIONS },
  { text: 'Worrying too much about different things', options: COMMON_OPTIONS },
  { text: 'Trouble relaxing', options: COMMON_OPTIONS },
  { text: 'Being so restless that it is hard to sit still', options: COMMON_OPTIONS },
  { text: 'Becoming easily annoyed or irritable', options: COMMON_OPTIONS },
  { text: 'Feeling afraid as if something awful might happen', options: COMMON_OPTIONS },
];

export const calculatePHQ9Disposition = (scores: number[]): Disposition => {
  const total = scores.reduce((a, b) => a + b, 0);
  const itemNine = scores[8];

  if (itemNine >= 1) {
    return {
      level: 'urgent-111',
      title: 'Urgent Support Recommended',
      detail: 'You mentioned having thoughts of self-harm or being better off dead. Please talk to someone now.',
      reason: 'PHQ-9 Item 9 score indicates risk.',
      actions: ['Call Samaritans on 116 123 (24/7)', 'Contact NHS 111', 'Book an urgent GP appointment']
    };
  }

  if (total >= 5) {
    return {
      level: 'gp-routine',
      title: 'Discuss with your GP',
      detail: `Your score is ${total}, suggesting mild to severe symptoms of low mood.`,
      actions: ['Book a routine GP appointment', 'Continue tracking your mood in the app']
    };
  }

  return {
    level: 'self-care',
    title: 'Self-Care',
    detail: `Your score is ${total}, which is within the minimal range.`,
    actions: ['Focus on sleep and exercise', 'Check back in a few days']
  };
};

export const calculateGAD7Disposition = (scores: number[]): Disposition => {
  const total = scores.reduce((a, b) => a + b, 0);

  if (total >= 10) {
    return {
      level: 'gp-routine',
      title: 'Discuss with your GP',
      detail: `Your score is ${total}, which suggests moderate to severe anxiety symptoms.`,
      actions: ['Book a routine GP appointment', 'Try breathing exercises in the meantime']
    };
  }

  return {
    level: 'self-care',
    title: 'Self-Care',
    detail: `Your score is ${total}, which is below the threshold for further assessment.`,
    actions: ['Practice mindfulness', 'Keep monitoring your trends']
  };
};