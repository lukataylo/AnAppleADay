import React, { useState, useEffect } from 'react';
import { 
  Consent 
} from './types';

export { VideoCheckIn } from './VideoCheckIn';

/**
 * Animated dot-matrix eyes for the Today screen.
 */
export const DotMatrixEyes: React.FC = () => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  const renderEye = () => (
    <div className="eye-grid">
      {[...Array(9)].map((_, i) => (
        <div key={i} className={`dot ${isBlinking ? 'hidden' : ''}`} />
      ))}
    </div>
  );

  return (
    <div className="eyes-container">
      {renderEye()}
      {renderEye()}
    </div>
  );
};

/**
 * Consent screen displayed on first run to handle privacy and medical disclaimers.
 */
export const ConsentScreen: React.FC<{ onComplete: (c: Consent) => void }> = ({ onComplete }) => {
  const [data, setData] = useState<Consent>({
    voiceSignals: false,
    faceSignals: false,
    federatedSharing: false,
    acknowledgedNotMedical: false
  });

  const isValid = data.acknowledgedNotMedical;

  return (
    <section className="consent-screen">
      <h1>Before we start</h1>
      <p className="intro-text">
        An Apple a Day helps you track your wellbeing. To protect your privacy, 
        <strong> all processing happens on your device</strong>. Raw audio and video never leave this phone.
      </p>

      <div className="consent-form">
        <label className="consent-option">
          <input 
            type="checkbox" 
            checked={data.voiceSignals} 
            onChange={e => setData({...data, voiceSignals: e.target.checked})} 
          />
          <div className="option-text">
            <strong>Enable Voice Signals</strong>
            <span>Analyze pitch and clarity locally to detect mood trends.</span>
          </div>
        </label>

        <label className="consent-option">
          <input 
            type="checkbox" 
            checked={data.faceSignals} 
            onChange={e => setData({...data, faceSignals: e.target.checked})} 
          />
          <div className="option-text">
            <strong>Enable Face Signals</strong>
            <span>Analyze blinks and symmetry locally for wellness insights.</span>
          </div>
        </label>

        <label className="consent-option">
          <input 
            type="checkbox" 
            checked={data.federatedSharing} 
            onChange={e => setData({...data, federatedSharing: e.target.checked})} 
          />
          <div className="option-text">
            <strong>Improve the model (Optional)</strong>
            <span>Share anonymous, aggregated metadata to help improve the system.</span>
          </div>
        </label>

        <hr />

        <label className="consent-option required-opt">
          <input 
            type="checkbox" 
            checked={data.acknowledgedNotMedical} 
            onChange={e => setData({...data, acknowledgedNotMedical: e.target.checked})} 
          />
          <div className="option-text">
            <strong>I understand this is not a medical device.</strong>
            <span>This app provides signposting and tracking, not clinical diagnosis.</span>
          </div>
        </label>

        <button 
          className="continue-button" 
          disabled={!isValid}
          onClick={() => onComplete(data)}
        >
          Continue
        </button>
      </div>
    </section>
  );
};

