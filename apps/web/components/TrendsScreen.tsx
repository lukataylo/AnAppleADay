"use client";

import { useState } from "react";
import {
  metricBlinkRate,
  metricHnr,
  metricMood,
  metricWellbeing,
  trend,
  type DailyPoint,
  type MetricExtractor,
  type TrendDirection,
} from "@apple/core";
import { useApp } from "@/lib/state";
import { computeModelUpdate, contributeRound, type RoundResult } from "@/lib/flock";

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  return (
    <div className="spark">
      {values.map((v, i) => (
        <span key={i} style={{ height: `${((v - min) / range) * 100}%` }} />
      ))}
    </div>
  );
}

function arrow(d: TrendDirection) {
  if (d === "improving") return { sym: "↗", cls: "trend-up", label: "improving" };
  if (d === "worsening") return { sym: "↘", cls: "trend-down", label: "needs a look" };
  return { sym: "→", cls: "trend-flat", label: "steady" };
}

const METRICS: Array<{
  name: string;
  extract: MetricExtractor;
  better: boolean;
  fmt: (n: number) => string;
}> = [
  { name: "Wellbeing signal", extract: metricWellbeing, better: true, fmt: (n) => `${Math.round(n)}/100` },
  { name: "Self-reported mood", extract: metricMood, better: true, fmt: (n) => `${n.toFixed(1)}/5` },
  { name: "Voice clarity (HNR)", extract: metricHnr, better: true, fmt: (n) => `${n.toFixed(1)} dB` },
  { name: "Blink rate", extract: metricBlinkRate, better: true, fmt: (n) => `${Math.round(n)}/min` },
];

function valuesOf(points: DailyPoint[], extract: MetricExtractor): number[] {
  return points
    .map((p) => extract(p))
    .filter((v): v is number => typeof v === "number");
}

export function TrendsScreen() {
  const { points, consent } = useApp();
  const [round, setRound] = useState<RoundResult | null>(null);
  const [busy, setBusy] = useState(false);
  const fedAllowed = consent?.federatedSharing === true;

  if (points.length === 0) {
    return (
      <div className="screen">
        <h1 className="h1">Your trends</h1>
        <div className="card">
          <p>
            No check-ins yet. Once you have a few, this page shows how each signal
            is moving against your own baseline, not against anyone else.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 className="h1">Your trends</h1>
      <p className="lead">
        Against your own baseline from {points.length} check-in
        {points.length === 1 ? "" : "s"}. Signals over time, not scores.
      </p>

      {METRICS.map((m) => {
        const vals = valuesOf(points, m.extract);
        if (vals.length === 0) return null;
        const t = trend(points, m.extract, { higherIsBetter: m.better });
        const a = arrow(t.direction);
        return (
          <div className="card" key={m.name}>
            <div className="metric-head">
              <strong>{m.name}</strong>
              <span className={a.cls} data-testid={`trend-${m.name}`}>
                {a.sym} {a.label}
              </span>
            </div>
            <div className="metric-head" style={{ fontSize: 13 }}>
              <span className="muted">
                latest {t.latest !== undefined ? m.fmt(t.latest) : "—"}
              </span>
              <span className="muted">baseline {m.fmt(t.baseline.mean)}</span>
            </div>
            <Spark values={vals.slice(-14)} />
          </div>
        );
      })}

      <div className="card">
        <h2>Federated learning (FLock.io)</h2>
        <p>
          The model improves from everyone&apos;s check-ins without anyone sharing
          data. Your device contributes a small update, never your records.
        </p>
        <button
          className="btn"
          data-testid="flock-contribute"
          disabled={busy || !fedAllowed}
          onClick={async () => {
            setBusy(true);
            const update = computeModelUpdate(points);
            const r = await contributeRound(update);
            setRound(r);
            setBusy(false);
          }}
        >
          {busy ? "Contributing…" : "Contribute to a federated round"}
        </button>
        {!fedAllowed && (
          <p className="muted" data-testid="flock-disabled" style={{ fontSize: 13 }}>
            Federated sharing is off. You can turn it on under About.
          </p>
        )}
        {round && (
          <p className="muted" data-testid="flock-result" style={{ fontSize: 13 }}>
            Round {round.round} · {round.mode === "live" ? "live" : "simulated"} ·{" "}
            {round.note}
          </p>
        )}
      </div>
    </div>
  );
}
