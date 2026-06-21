import React from 'react';
import { Disposition, SymptomKey } from './types';
import { Question } from './triageLogic';
import { QuestionnaireItem } from './questionnaireLogic';

interface DispositionViewProps {
  result: Disposition;
  onComplete: () => void;
}

export const DispositionView: React.FC<DispositionViewProps> = ({ result, onComplete }) => {
  const renderActionButton = (action: string, index: number) => {
    // Basic heuristic to detect phone numbers or URLs
    const isPhone = /^[0-9\s]{3,15}$/.test(action.replace(/[^0-9]/g, ''));
    const isUrl = action.startsWith('http') || action.includes('.nhs.uk');
    
    if (isPhone) {
      return (
        <a key={index} href={`tel:${action.replace(/\s/g, '')}`} className="action-link-button">
          📞 Call {action}
        </a>
      );
    }
    
    if (isUrl) {
      return (
        <a key={index} href={action} target="_blank" rel="noopener noreferrer" className="action-link-button">
          🌐 View Guidance
        </a>
      );
    }

    return (
      <div key={index} className="action-text-item">
        {action}
      </div>
    );
  };

  return (
    <div className={`triage-container disposition-card ${result.level}`}>
      <div className="disposition-header">
        <div className="disposition-badge">
          {result.level.replace('-', ' ').toUpperCase()}
        </div>
        <h2>{result.title}</h2>
      </div>
      
      <div className="disposition-body">
        <p className="detail-text">{result.detail}</p>
        {result.reason && (
          <div className="reason-box">
            <strong>Reason:</strong> {result.reason}
          </div>
        )}
        
        <div className="action-grid">
          {result.actions.map((action, i) => renderActionButton(action, i))}
        </div>
      </div>
      
      <button className="continue-button" onClick={onComplete}>
        Return to Today
      </button>
    </div>
  );
};

interface QuestionnaireViewProps {
  question: QuestionnaireItem;
  index: number;
  total: number;
  onAnswer: (value: number) => void;
}

export const QuestionnaireView: React.FC<QuestionnaireViewProps> = ({ question, index, total, onAnswer }) => (
  <div className="triage-container">
    <p className="instruction-text">Over the last 2 weeks, how often have you been bothered by the following?</p>
    <h2 className="question-text">{question.text}</h2>
    <div className="action-buttons">
      {question.options.map((opt) => (
        <button 
          key={opt.value} 
          className="secondary-button" 
          onClick={() => onAnswer(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
    <p style={{ marginTop: '20px', fontSize: '0.8rem', opacity: 0.7 }}>
      Question {index + 1} of {total}
    </p>
  </div>
);

interface RedFlagViewProps {
  question: Question;
  index: number;
  total: number;
  onAnswer: (yes: boolean) => void;
}

export const RedFlagView: React.FC<RedFlagViewProps> = ({ question, index, total, onAnswer }) => (
  <div className="triage-container">
    <h2 className="question-text">{question.text}</h2>
    <div className="action-buttons">
      <button className="continue-button" onClick={() => onAnswer(true)}>Yes</button>
      <button className="secondary-button" onClick={() => onAnswer(false)}>No</button>
    </div>
    <p style={{ marginTop: '20px', fontSize: '0.8rem', opacity: 0.7 }}>
      Question {index + 1} of {total}
    </p>
  </div>
);

interface SymptomSelectorProps {
  onSelect: (symptom: SymptomKey) => void;
  onCancel: () => void;
}

export const SymptomSelector: React.FC<SymptomSelectorProps> = ({ onSelect, onCancel }) => (
  <div className="triage-container">
    <button className="secondary-button" style={{ alignSelf: 'flex-start' }} onClick={onCancel}>
      ← Back
    </button>
    <h2 className="question-text">Is anything bothering you today that you'd like to look into?</h2>
    <div className="action-buttons">
      <button className="secondary-button" onClick={() => onSelect('chest_pain')}>Chest pain or tightness</button>
      <button className="secondary-button" onClick={() => onSelect('breathing')}>Trouble breathing</button>
      <button className="secondary-button" onClick={() => onSelect('headache')}>A headache</button>
      <button className="secondary-button" onClick={() => onSelect('low_mood')}>Low mood</button>
      <button className="secondary-button" onClick={() => onSelect('anxious')}>Feeling anxious or worried</button>
      <button className="secondary-button" onClick={() => onSelect('tired')}>Feeling very tired</button>
      <button className="secondary-button" onClick={() => onSelect('cough')}>A cough</button>
      <button className="continue-button" onClick={() => onSelect('nothing')}>Nothing in particular</button>
    </div>
  </div>
);