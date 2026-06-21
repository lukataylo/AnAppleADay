import React, { useState } from 'react';
import { Disposition } from './types';
import { 
  SymptomKey, 
  RED_FLAG_QUESTIONS, 
  getEmergencyDisposition, 
  getFinalDisposition 
} from './triageLogic';
import { 
  PHQ9_QUESTIONS, 
  GAD7_QUESTIONS, 
  calculatePHQ9Disposition, 
  calculateGAD7Disposition 
} from './questionnaireLogic';
import { 
  SymptomSelector, 
  RedFlagView, 
  QuestionnaireView, 
  DispositionView 
} from './TriageComponents';
import { activateMonitoringIfRequired } from './monitoringLogic';

interface TriageTreeProps {
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * :TriageTree: implementation handling initial symptom selection and :RedFlag: branching logic.
 */
export const TriageTree: React.FC<TriageTreeProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'initial' | 'questions' | 'questionnaire' | 'disposition'>('initial');
  const [currentPath, setCurrentPath] = useState<SymptomKey | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Disposition | null>(null);

  const handleSymptomSelect = (symptom: SymptomKey) => {
    if (symptom === 'chest_pain' || symptom === 'breathing' || symptom === 'headache' || symptom === 'low_mood') {
      setCurrentPath(symptom);
      setQuestionIndex(0);
      setStep('questions');
    } else if (symptom === 'anxious') {
      setCurrentPath(symptom);
      setQuestionIndex(0);
      setAnswers([]);
      setStep('questionnaire');
    } else if (symptom === 'nothing') {
      setResult({
        level: 'self-care',
        title: 'Continue Self-Care',
        detail: 'It is good that you are checking in. Continue monitoring your well-being.',
        actions: ['Keep using the app to track trends', 'Maintain a regular sleep schedule']
      });
      setStep('disposition');
    } else {
      // Default for other symptoms
      setResult({
        level: 'gp-routine',
        title: 'Monitor and Consult',
        detail: 'You have mentioned some symptoms that are worth keeping an eye on.',
        actions: ['Book a routine appointment with your GP', 'Check NHS.uk for advice']
      });
      setStep('disposition');
    }
  };

  const handleAnswer = (yes: boolean) => {
    if (!currentPath) return;
    const questions = RED_FLAG_QUESTIONS[currentPath];
    const currentQuestion = questions[questionIndex];

    if (yes && currentQuestion.isRedFlag) {
      setResult(getEmergencyDisposition());
      setStep('disposition');
      return;
    }

    const nextIndex = questionIndex + 1;
    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex);
    } else {
      if (currentPath === 'low_mood') {
        // After low mood safety question, start PHQ9
        setQuestionIndex(0);
        setAnswers([]);
        setStep('questionnaire');
      } else {
        // End of questions, last one was follow-up
        setResult(getFinalDisposition(currentPath, yes));
        setStep('disposition');
      }
    }
  };

  const handleQuestionnaireAnswer = (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    
    const questions = currentPath === 'anxious' ? GAD7_QUESTIONS : PHQ9_QUESTIONS;
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex(questionIndex + 1);
    } else {
      const finalResult = currentPath === 'anxious' 
        ? calculateGAD7Disposition(newAnswers)
        : calculatePHQ9Disposition(newAnswers);
      setResult(finalResult);
      setStep('disposition');
    }
  };

  if (step === 'disposition' && result) {
    // Activate monitoring plan if urgency warrants it
    activateMonitoringIfRequired(result.level, result.title);
    return <DispositionView result={result} onComplete={onComplete} />;
  }

  if (step === 'questionnaire' && currentPath) {
    const questions = currentPath === 'anxious' ? GAD7_QUESTIONS : PHQ9_QUESTIONS;
    return (
      <QuestionnaireView 
        question={questions[questionIndex]}
        index={questionIndex}
        total={questions.length}
        onAnswer={handleQuestionnaireAnswer}
      />
    );
  }

  if (step === 'questions' && currentPath) {
    const questions = RED_FLAG_QUESTIONS[currentPath];
    return (
      <RedFlagView 
        question={questions[questionIndex]}
        index={questionIndex}
        total={questions.length}
        onAnswer={handleAnswer}
      />
    );
  }

  return <SymptomSelector onSelect={handleSymptomSelect} onCancel={onCancel} />;
};