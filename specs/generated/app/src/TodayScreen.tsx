import React, { useState } from 'react';
import { DotMatrixEyes, VideoCheckIn } from './components';
import { TriageTree } from './TriageTree';
import { DailyPoint } from './types';

/**
 * Today Screen implementing :Mood: selection and check-in initiation.
 * Moved from App.tsx to improve maintainability.
 */
export const TodayScreen: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastPoint, setLastPoint] = useState<DailyPoint | null>(null);
  const [showTriage, setShowTriage] = useState(false);

  const handleCheckInComplete = (point: DailyPoint) => {
    try {
      const raw = localStorage.getItem('aad_points');
      const points: DailyPoint[] = raw ? JSON.parse(raw) : [];
      points.push(point);
      localStorage.setItem('aad_points', JSON.stringify(points));
      setLastPoint(point);
      setIsCheckingIn(false);
      setIsSaved(true);
      setSelectedMood(null);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`Failed to save check-in data. Error context: ${errorMsg}`);
      alert("Error saving data to local storage. Please check device space.");
    }
  };

  const saveMoodOnly = () => {
    if (selectedMood === null) return;
    
    try {
      const raw = localStorage.getItem('aad_points');
      const points: DailyPoint[] = raw ? JSON.parse(raw) : [];
      
      // Calculate WellbeingIndex: Map mood 1-5 to 0-100
      const wellbeingIndex = (selectedMood - 1) * 25;

      const newPoint: DailyPoint = {
        timestamp: Date.now(),
        mood: selectedMood,
        wellbeingIndex
      };

      points.push(newPoint);
      localStorage.setItem('aad_points', JSON.stringify(points));
      
      setLastPoint(newPoint);
      setIsSaved(true);
      setSelectedMood(null);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`Failed to save mood only. Error context: ${errorMsg}`);
      alert("Error saving data to local storage.");
    }
  };

  if (showTriage) {
    return (
      <section className="today-screen">
        <TriageTree 
          onComplete={() => setShowTriage(false)} 
          onCancel={() => setShowTriage(false)} 
        />
      </section>
    );
  }

  if (isSaved) {
    const wbIndex = lastPoint?.wellbeingIndex ?? 0;
    const hasVoice = !!lastPoint?.voiceSignal;
    const hasFace = !!lastPoint?.faceSignal;
    
    let signalSummary = "Mood recorded.";
    if (hasVoice && hasFace) signalSummary = "Mood, voice, and face signals analyzed.";
    else if (hasVoice) signalSummary = "Mood and voice signals analyzed.";
    else if (hasFace) signalSummary = "Mood and face signals analyzed.";

    return (
      <section className="today-screen">
        <div className="success-icon">✓</div>
        <h2 className="question-text">Check-in saved</h2>
        
        <div className="wellbeing-card">
          <div className="wb-header">
            <span>Wellbeing Index</span>
            <strong>{wbIndex} / 100</strong>
          </div>
          <div className="wb-bar-bg">
            <div className="wb-bar-fill" style={{ width: `${wbIndex}%` }} />
          </div>
          <p className="signal-summary">{signalSummary}</p>
        </div>

        <div className="action-buttons" style={{ marginTop: '20px' }}>
          <button 
            className="continue-button" 
            onClick={() => setShowTriage(true)}
          >
            Anything bothering you today?
          </button>
          <button 
            className="secondary-button" 
            onClick={() => { setIsSaved(false); setLastPoint(null); }}
          >
            Done for now
          </button>
        </div>
      </section>
    );
  }

  if (isCheckingIn && selectedMood !== null) {
    return (
      <VideoCheckIn 
        mood={selectedMood} 
        onComplete={handleCheckInComplete}
        onCancel={() => setIsCheckingIn(false)}
      />
    );
  }

  return (
    <section className="today-screen">
      <DotMatrixEyes />
      <h2 className="question-text">How do you feel today?</h2>
      
      <div className="mood-row">
        {[1, 2, 3, 4, 5].map((m) => (
          <button
            key={m}
            className={`mood-btn ${selectedMood === m ? 'selected' : ''}`}
            onClick={() => setSelectedMood(m)}
          >
            {m === 1 && '😞'}
            {m === 2 && '🙁'}
            {m === 3 && '😐'}
            {m === 4 && '🙂'}
            {m === 5 && '😊'}
          </button>
        ))}
      </div>

      <div className="action-buttons">
        <button 
          className="continue-button" 
          disabled={selectedMood === null}
          onClick={() => setIsCheckingIn(true)}
        >
          Start video check-in
        </button>
        <button 
          className="secondary-button" 
          disabled={selectedMood === null}
          onClick={saveMoodOnly}
        >
          Save mood only
        </button>
      </div>
    </section>
  );
};