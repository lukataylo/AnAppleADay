import type { DailyPoint } from "@apple/core";

// FLock.io federated layer (mobile). The device computes a small model update
// from its own check-ins and would contribute only that to a round; raw data
// never leaves the device. Runs as a local simulation here; wire a coordinator
// URL to contribute to a live round.

export interface RoundResult {
  round: number;
  contributed: boolean;
  mode: "live" | "simulated";
  note: string;
}

export function computeModelUpdate(points: DailyPoint[]): number[] {
  const wb = points.map((p) => p.wellbeingIndex ?? 0);
  const mean = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const slope = (xs: number[]) =>
    xs.length < 2 ? 0 : (xs[xs.length - 1]! - xs[0]!) / (xs.length - 1);
  return [mean(wb) / 100, slope(wb) / 100];
}

export async function contributeRound(points: DailyPoint[]): Promise<RoundResult> {
  const update = computeModelUpdate(points);
  void update;
  const round = 1 + (points.length % 50);
  return {
    round,
    contributed: points.length > 0,
    mode: "simulated",
    note: "Simulated federated round. Only aggregate updates would be shared; raw data stays on this device.",
  };
}
