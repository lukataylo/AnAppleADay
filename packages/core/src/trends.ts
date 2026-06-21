import type { DailyPoint } from "./types";

export type MetricExtractor = (p: DailyPoint) => number | undefined;

export interface Baseline {
  mean: number;
  sd: number;
  n: number;
}

export type TrendDirection = "improving" | "steady" | "worsening";

/** Minimum relative change across the recent window to count as a real trend. */
export const STEADY_THRESHOLD = 0.08;

export interface TrendSummary {
  direction: TrendDirection;
  /** Slope per day in the metric's own units. */
  slopePerDay: number;
  /** Latest value minus baseline mean, in standard deviations. */
  zVsBaseline: number;
  baseline: Baseline;
  latest: number | undefined;
}

function values(points: DailyPoint[], extract: MetricExtractor): number[] {
  const out: number[] = [];
  for (const p of points) {
    const v = extract(p);
    if (typeof v === "number" && !Number.isNaN(v)) out.push(v);
  }
  return out;
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance =
    xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/** Baseline over the first `window` readings (the user's own normal). */
export function baseline(
  points: DailyPoint[],
  extract: MetricExtractor,
  window = 7,
): Baseline {
  const vs = values(points, extract).slice(0, window);
  return { mean: mean(vs), sd: stdDev(vs), n: vs.length };
}

export function zScore(value: number, base: Baseline): number {
  if (base.sd === 0) return 0;
  return (value - base.mean) / base.sd;
}

/** Least-squares slope of y against an index 0..n-1. */
export function linearSlope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * ((ys[i] as number) - yMean);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Trend over recent readings. `higherIsBetter` flips the meaning of an upward
 * slope so the direction is always reported from the person's point of view.
 * "steady" when the recent change is small relative to the baseline spread.
 */
export function trend(
  points: DailyPoint[],
  extract: MetricExtractor,
  opts: { higherIsBetter?: boolean; recent?: number; baselineWindow?: number } = {},
): TrendSummary {
  const higherIsBetter = opts.higherIsBetter ?? true;
  const recent = opts.recent ?? 5;
  const base = baseline(points, extract, opts.baselineWindow ?? 7);
  const all = values(points, extract);
  const latest = all.length ? all[all.length - 1] : undefined;
  const recentValues = all.slice(-recent);
  const slope = linearSlope(recentValues);

  // Significance is judged on the change predicted across the recent window
  // relative to the metric's own scale, so a tiny blip on otherwise flat data
  // stays "steady" while a real drift is picked up regardless of units.
  const slopePerWindow = slope * recentValues.length;
  const denom = Math.max(Math.abs(mean(recentValues)), base.sd, 1e-6);
  const relativeChange = slopePerWindow / denom;
  let direction: TrendDirection = "steady";
  if (Math.abs(relativeChange) >= STEADY_THRESHOLD) {
    const rising = slope > 0;
    const better = rising === higherIsBetter;
    direction = better ? "improving" : "worsening";
  }

  return {
    direction,
    slopePerDay: slope,
    zVsBaseline: latest === undefined ? 0 : zScore(latest, base),
    baseline: base,
    latest,
  };
}

// Common extractors.
export const metricWellbeing: MetricExtractor = (p) => p.wellbeingIndex;
export const metricMood: MetricExtractor = (p) => p.moodSelfReport;
export const metricBlinkRate: MetricExtractor = (p) => p.face?.blinkRate;
export const metricHnr: MetricExtractor = (p) => p.voice?.hnr;
export const metricJitter: MetricExtractor = (p) => p.voice?.jitter;
export const metricSpeechRate: MetricExtractor = (p) => p.voice?.speechRateWpm;
