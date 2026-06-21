"use client";

import type { DailyPoint } from "@apple/core";

// FLock.io federated learning layer.
//
// The privacy promise: the device computes a small model update from its own
// check-ins and contributes only that update to a shared round. Raw audio,
// video, and the daily feature records never leave the phone. This is what
// makes the local-first design and a population-level model compatible, which
// is the point for the UK Sovereign AI / data-sovereignty brief.
//
// When FLOCK_API_KEY (and a coordinator URL) are configured this would POST the
// gradient to a FLock round. Without them it runs as a clearly labelled local
// simulation so the architecture and the data flow are demonstrable end to end.

export interface ModelUpdate {
  /** A compact gradient-like vector derived from local features. */
  vector: number[];
  /** How many local samples contributed, for federated averaging weights. */
  sampleCount: number;
  /** Hash-free, no raw data: only aggregate statistics leave the device. */
  computedAt: number;
}

export interface RoundResult {
  round: number;
  contributed: boolean;
  mode: "live" | "simulated";
  participants: number;
  note: string;
}

/**
 * Derive a model update from local points. We use normalised aggregate
 * statistics of the derived features, never the raw per-day records.
 */
export function computeModelUpdate(points: DailyPoint[]): ModelUpdate {
  const wb = points.map((p) => p.wellbeingIndex ?? 0);
  const blink = points.map((p) => p.face?.blinkRate ?? 0);
  const hnr = points.map((p) => p.voice?.hnr ?? 0);
  const mean = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const slope = (xs: number[]) => {
    if (xs.length < 2) return 0;
    return (xs[xs.length - 1]! - xs[0]!) / (xs.length - 1);
  };
  return {
    vector: [mean(wb) / 100, slope(wb) / 100, mean(blink) / 30, mean(hnr) / 25],
    sampleCount: points.length,
    computedAt: Date.now(),
  };
}

const LIVE =
  typeof process !== "undefined" && Boolean(process.env.NEXT_PUBLIC_FLOCK_URL);

export async function contributeRound(
  update: ModelUpdate,
): Promise<RoundResult> {
  if (LIVE) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_FLOCK_URL}/round`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(update),
      });
      const data = (await res.json()) as Partial<RoundResult>;
      return {
        round: data.round ?? 0,
        contributed: true,
        mode: "live",
        participants: data.participants ?? 1,
        note: "Contributed an on-device model update to a live FLock round.",
      };
    } catch {
      // Fall through to the simulation so the UI never dead-ends.
    }
  }
  // Deterministic local simulation: a round number derived from sample count.
  const round = 1 + (update.sampleCount % 50);
  return {
    round,
    contributed: update.sampleCount > 0,
    mode: "simulated",
    participants: 1,
    note: "Simulated federated round. Only aggregate updates would be shared; raw data stays on this device.",
  };
}
