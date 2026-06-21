import { DailyPoint, HandoffSummary, MonitoringPlan } from './types';
import { calculateTrend } from './trendsLogic';

/**
 * Builds a :HandoffSummary: from the person's own :DailyPoint: history.
 * Robust formatting with defensive checks for missing data.
 */
export const buildHandoffSummary = (
  points: DailyPoint[],
  monitoring: MonitoringPlan | null
): HandoffSummary => {
  const disclaimer = "DISCLAIMER: This summary is generated from self-reported data and device signals. It is NOT a clinical diagnosis or a medical device.";
  
  if (points.length === 0) {
    return {
      concerns: "No check-in history available.",
      trends: "N/A",
      disclaimer
    };
  }

  const latestPoint = points[points.length - 1];
  
  // Calculate trends for signals
  const signals = [
    { label: 'Wellbeing', fn: (p: DailyPoint) => p.wellbeingIndex },
    { label: 'Mood', fn: (p: DailyPoint) => p.mood },
    { label: 'Voice Clarity', fn: (p: DailyPoint) => p.voiceSignal?.clarity },
    { label: 'Blink Rate', fn: (p: DailyPoint) => p.faceSignal?.blinkRate }
  ];

  const trendStrings = signals
    .map(s => {
      const stats = calculateTrend(points, s.label, s.fn);
      if (!stats) return null;
      return `${s.label}: ${stats.latest.toFixed(1)} (${stats.direction} vs ${stats.baseline.toFixed(1)} baseline)`;
    })
    .filter(Boolean);

  const concerns = monitoring?.isActive 
    ? `Active monitoring for: ${monitoring.reason}. Latest check-in mood: ${latestPoint.mood ?? 'Not recorded'}.`
    : "No active monitoring plan. Recent status: " + (latestPoint.wellbeingIndex ? `Wellbeing Index ${latestPoint.wellbeingIndex}/100` : "Mood recorded.");

  return {
    concerns,
    latestDisposition: monitoring?.reason,
    trends: trendStrings.length > 0 ? trendStrings.join('\n') : "Insufficient data for trend analysis.",
    disclaimer
  };
};

/**
 * Formats the summary object into a single plain-text string for copying.
 */
export const formatSummaryToText = (summary: HandoffSummary): string => {
  return [
    "--- AN APPLE A DAY: HANDOFF SUMMARY ---",
    `Date: ${new Date().toLocaleDateString()}`,
    "",
    "CONCERNS & STATUS:",
    summary.concerns,
    summary.latestDisposition ? `Latest Triage: ${summary.latestDisposition}` : "",
    "",
    "TRENDS (Self-reported & Device Signals):",
    summary.trends,
    "",
    summary.disclaimer
  ].filter(line => line !== "").join('\n');
};