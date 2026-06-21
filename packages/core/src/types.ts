// Domain types shared across the web PWA and the React Native app.
// Nothing here touches a platform API. ML capture is platform-specific;
// this package only models the data and the clinical/decision logic.

export type InstrumentId = "phq9" | "gad7" | "who5" | "mmrc";

export type Severity =
  | "minimal"
  | "mild"
  | "moderate"
  | "moderately-severe"
  | "severe";

/** Care levels, mirroring the NHS three-tier signposting pattern. */
export type DispositionLevel =
  | "emergency-999"
  | "urgent-111"
  | "gp-routine"
  | "pharmacy"
  | "self-care";

export interface DispositionAction {
  label: string;
  kind: "call" | "link" | "info";
  /** Phone number for "call", URL for "link". */
  value?: string;
}

/**
 * The outcome of a triage flow. This is signposting where the user keeps the
 * decision, never an automated treatment instruction.
 */
export interface Disposition {
  level: DispositionLevel;
  title: string;
  detail: string;
  reason?: string;
  actions: DispositionAction[];
  /** True when reached via a red-flag answer, for audit and UI emphasis. */
  urgent: boolean;
}

/** Acoustic and transcript-derived voice signals, extracted on-device. */
export interface VoiceFeatures {
  f0Mean: number; // mean fundamental frequency, Hz
  f0Sd: number; // standard deviation of F0, Hz
  jitter: number; // cycle-to-cycle frequency variation, 0..1
  shimmer: number; // cycle-to-cycle amplitude variation, 0..1
  hnr: number; // harmonics-to-noise ratio, dB
  loudness: number; // mean RMS loudness, 0..1
  mfcc?: number[]; // mel-frequency cepstral coefficients
  speechRateWpm?: number; // words per minute, from transcript
  pauseRatio?: number; // fraction of the take that is silence, 0..1
}

/** Facial geometry signals, extracted on-device. No emotion verdict. */
export interface FaceFeatures {
  blinkRate: number; // blinks per minute
  earMean: number; // mean eye aspect ratio
  smileIntensity: number; // 0..1, from smile blendshapes
  headPose: { yaw: number; pitch: number; roll: number }; // degrees
  asymmetry: number; // left/right blendshape difference, 0..1
  valence?: number; // -1..1, pleasantness (trend only, not a label)
  arousal?: number; // 0..1, activation (trend only)
  heartRateBpm?: number; // rPPG estimate, noisy, optional
}

/** One daily check-in record. Stored locally; raw audio/video is never kept. */
export interface DailyPoint {
  id: string;
  timestamp: number; // epoch milliseconds
  moodSelfReport?: number; // 1..5 from "how do you feel today?"
  voice?: VoiceFeatures;
  face?: FaceFeatures;
  wellbeingIndex?: number; // 0..100 composite, derived
  notes?: string;
}

export interface ConsentRecord {
  voiceCapture: boolean;
  faceCapture: boolean;
  federatedSharing: boolean;
  acceptedNotMedicalDevice: boolean;
  timestamp: number;
}

export interface MonitoringPlan {
  active: boolean;
  /** Interval in days between prompted follow-up check-ins. */
  intervalDays: number;
  reason: string;
  startedAt: number;
  nextDueAt: number;
}
