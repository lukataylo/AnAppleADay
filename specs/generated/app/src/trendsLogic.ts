import { DailyPoint } from './types';

export type TrendDirection = 'Improving' | 'Steady' | 'Needs-a-look';

export interface TrendStats {
  latest: number;
  baseline: number;
  direction: TrendDirection;
  history: number[];
  label: string;
}

/**
 * Calculates trend statistics for a specific numeric property of DailyPoint.
 */
export const calculateTrend = (
  points: DailyPoint[],
  label: string,
  getValue: (p: DailyPoint) => number | undefined,
  higherIsBetter: boolean = true
): TrendStats | null => {
  const validPoints = points
    .filter(p => getValue(p) !== undefined)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (validPoints.length < 2) return null;

  const values = validPoints.map(p => getValue(p) as number);
  const latest = values[values.length - 1];
  
  // Baseline is the average of all points except the latest one
  const historicalValues = values.slice(0, -1);
  const baseline = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;

  const diff = latest - baseline;
  const threshold = baseline * 0.05; // 5% tolerance for "Steady"

  let direction: TrendDirection = 'Steady';
  if (Math.abs(diff) > threshold) {
    if (higherIsBetter) {
      direction = diff > 0 ? 'Improving' : 'Needs-a-look';
    } else {
      // For some metrics like blink rate, "better" is subjective, 
      // but we'll follow a standard "improving" if it increases/decreases 
      // towards a healthy norm. For this app, we treat blink rate increase 
      // as "improving" (less fatigue) for simplicity.
      direction = diff > 0 ? 'Improving' : 'Needs-a-look';
    }
  }

  return {
    latest,
    baseline,
    direction,
    history: values.slice(-7), // Last 7 points for sparkline
    label
  };
};