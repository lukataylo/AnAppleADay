/**
 * Shared interfaces for application state and data points.
 */

export interface Consent {
  voiceSignals: boolean;
  faceSignals: boolean;
  federatedSharing: boolean;
  acknowledgedNotMedical: boolean;
}

export interface VoiceSignal {
  meanPitchHz: number;
  pitchVariation: number;
  clarity: number;
  loudness: number;
  silenceShare: number;
}

export interface FaceSignal {
  blinkRate: number;
  smileIntensity: number;
  headPose: number;
  symmetry: number;
}

export type DispositionLevel = 'emergency-999' | 'urgent-111' | 'gp-routine' | 'pharmacy' | 'self-care';

export interface Disposition {
  level: DispositionLevel;
  title: string;
  detail: string;
  reason?: string;
  actions: string[];
}

export interface DailyPoint {
  timestamp: number;
  mood?: number;
  wellbeingIndex?: number;
  voiceSignal?: VoiceSignal;
  faceSignal?: FaceSignal;
}

export interface MonitoringPlan {
  isActive: boolean;
  intervalDays: number;
  reason: string;
  nextCheckInDue: number; // epoch milliseconds
}

export interface HandoffSummary {
  concerns: string;
  latestDisposition?: string;
  trends: string;
  disclaimer: string;
}