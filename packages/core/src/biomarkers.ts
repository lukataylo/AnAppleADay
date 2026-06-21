import type { DailyPoint, FaceFeatures, VoiceFeatures } from "./types";

export interface Point2D {
  x: number;
  y: number;
}

function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Eye Aspect Ratio (Soukupova & Cech 2016). Expects six eye landmarks in the
 * order [p1, p2, p3, p4, p5, p6] where p1 and p4 are the corners.
 * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|).
 */
export function eyeAspectRatio(points: Point2D[]): number {
  if (points.length !== 6) {
    throw new Error("eyeAspectRatio needs exactly 6 points");
  }
  const [p1, p2, p3, p4, p5, p6] = points as [
    Point2D,
    Point2D,
    Point2D,
    Point2D,
    Point2D,
    Point2D,
  ];
  const horizontal = dist(p1, p4);
  if (horizontal === 0) return 0;
  return (dist(p2, p6) + dist(p3, p5)) / (2 * horizontal);
}

export const DEFAULT_BLINK_THRESHOLD = 0.2;

export function isBlink(ear: number, threshold = DEFAULT_BLINK_THRESHOLD) {
  return ear < threshold;
}

/**
 * Count blinks from a series of EAR samples by detecting downward crossings of
 * the threshold, then express as blinks per minute over the sampled window.
 */
export function blinkRate(
  earSamples: number[],
  windowMs: number,
  threshold = DEFAULT_BLINK_THRESHOLD,
): number {
  if (windowMs <= 0) return 0;
  let blinks = 0;
  // Treat an eye that is already closed at the start as an in-progress blink,
  // so a take that begins mid-blink does not over-count.
  let closed = (earSamples[0] ?? 1) < threshold;
  for (const ear of earSamples) {
    if (!closed && ear < threshold) {
      blinks += 1;
      closed = true;
    } else if (closed && ear >= threshold) {
      closed = false;
    }
  }
  return (blinks / windowMs) * 60000;
}

/** Left/right asymmetry from paired blendshape coefficients, 0 (symmetric)..1. */
export function facialAsymmetry(
  leftRightPairs: Array<[number, number]>,
): number {
  if (leftRightPairs.length === 0) return 0;
  let total = 0;
  for (const [l, r] of leftRightPairs) total += Math.abs(l - r);
  return clamp01(total / leftRightPairs.length);
}

export function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * A transparent wellbeing composite, 0..100, from whatever signals exist.
 * This is a heuristic for trend tracking, explicitly not a clinical score.
 * Each contributing signal is normalised to 0..1 where higher is better,
 * then averaged over the signals actually present.
 */
export function wellbeingIndex(point: {
  moodSelfReport?: number;
  voice?: Partial<VoiceFeatures>;
  face?: Partial<FaceFeatures>;
}): number {
  const parts: number[] = [];

  if (typeof point.moodSelfReport === "number") {
    // 1..5 -> 0..1
    parts.push(clamp01((point.moodSelfReport - 1) / 4));
  }

  const v = point.voice;
  if (v) {
    if (typeof v.jitter === "number") parts.push(clamp01(1 - v.jitter * 20));
    if (typeof v.shimmer === "number") parts.push(clamp01(1 - v.shimmer * 5));
    if (typeof v.hnr === "number") parts.push(clamp01(v.hnr / 25));
    if (typeof v.pauseRatio === "number") parts.push(clamp01(1 - v.pauseRatio));
  }

  const f = point.face;
  if (f) {
    if (typeof f.smileIntensity === "number")
      parts.push(clamp01(f.smileIntensity));
    if (typeof f.valence === "number") parts.push(clamp01((f.valence + 1) / 2));
    if (typeof f.blinkRate === "number") {
      // Healthy spontaneous blink rate is roughly 8-21 per minute. Penalise
      // both very low and very high rates.
      const ideal = 14;
      const spread = 14;
      parts.push(clamp01(1 - Math.abs(f.blinkRate - ideal) / spread));
    }
  }

  if (parts.length === 0) return 0;
  const mean = parts.reduce((a, b) => a + b, 0) / parts.length;
  return Math.round(mean * 100);
}

/** Attach a derived wellbeing index to a daily point. */
export function withWellbeing(point: DailyPoint): DailyPoint {
  return { ...point, wellbeingIndex: wellbeingIndex(point) };
}
