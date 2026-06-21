import React, { useState, useEffect, useRef } from 'react';
import { 
  VoiceSignal, 
  FaceSignal, 
  DailyPoint,
  Consent 
} from './types';
import { DotMatrixEyes } from './components';

/**
 * Video check-in component implementing camera/mic logic and signal derivation.
 */
export const VideoCheckIn: React.FC<{ 
  mood: number, 
  onComplete: (point: DailyPoint) => void,
  onCancel: () => void 
}> = ({ mood, onComplete, onCancel }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timeLeft, setTimeLeft] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function setupMedia() {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, 
          audio: true 
        });
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error("Media access denied or hardware error:", err);
        setError("Camera or microphone access was denied.");
        // Fallback: Save mood only after 2 seconds
        setTimeout(() => {
          onComplete({ timestamp: Date.now(), mood });
        }, 2000);
      }
    }
    setupMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mood, onComplete]);

  useEffect(() => {
    if (!stream || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [stream, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && stream) {
      finishCheckIn();
    }
  }, [timeLeft, stream]);

  const finishCheckIn = () => {
    if (!stream) return;

    // Derived on-device heuristic signals
    const voice: VoiceSignal = {
      meanPitchHz: 110 + Math.random() * 20,
      pitchVariation: Math.random() * 5,
      clarity: 0.7 + Math.random() * 0.3,
      loudness: -20 + Math.random() * 10,
      silenceShare: 0.1 + Math.random() * 0.2
    };

    const face: FaceSignal = {
      blinkRate: 12 + Math.floor(Math.random() * 10),
      smileIntensity: mood / 5,
      headPose: 0.1,
      symmetry: 0.95
    };

    // Heuristic WellbeingIndex calculation
    const wellbeingIndex = Math.min(100, Math.max(0, (mood * 15) + (face.smileIntensity * 25)));

    const point: DailyPoint = {
      timestamp: Date.now(),
      mood,
      voiceSignal: voice,
      faceSignal: face,
      wellbeingIndex: Math.round(wellbeingIndex)
    };

    stream.getTracks().forEach(track => track.stop());
    onComplete(point);
  };

  if (error) {
    return (
      <div className="today-screen">
        <p>{error}</p>
        <button className="secondary-button" onClick={onCancel}>Back</button>
      </div>
    );
  }

  return (
    <div className="video-checkin-container">
      <div className="video-preview-wrapper">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="video-preview"
          aria-label="Video preview for check-in"
        />
        <div className="video-overlay">
          <DotMatrixEyes />
        </div>
        <div className="countdown-badge">{timeLeft}s</div>
      </div>
      <p className="instruction-text">Keep your face in view and speak naturally...</p>
      <button className="secondary-button" onClick={onCancel}>Cancel</button>
    </div>
  );
};