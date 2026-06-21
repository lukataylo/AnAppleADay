"use client";

import { useState } from "react";
import { buildHandoff, type HandoffSummary } from "@apple/core";
import { useApp } from "@/lib/state";

interface PhrasedHandoff {
  mode: string;
  gpNarrative: string;
  patientNote: string;
}

export function ShareScreen() {
  const { points, lastTriage } = useApp();
  const [summary, setSummary] = useState<HandoffSummary | null>(null);
  const [phrased, setPhrased] = useState<PhrasedHandoff | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    const s = buildHandoff(points, lastTriage, Date.now());
    setSummary(s);
    try {
      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ summary: s }),
      });
      setPhrased(await res.json());
    } catch {
      setPhrased({
        mode: "local",
        gpNarrative: s.narrativeDraft,
        patientNote: "Built on your device from your own check-ins.",
      });
    }
    setBusy(false);
  };

  const copy = async () => {
    if (!summary) return;
    const text = [
      "An Apple a Day — GP handoff",
      phrased?.gpNarrative ?? summary.narrativeDraft,
      "",
      `Check-ins: ${summary.checkInCount} over ${summary.windowDays} day(s)`,
      `Concerns: ${summary.presentingTopics.join(", ") || "none recorded"}`,
      summary.redFlagsRaised.length
        ? `Warning signs: ${summary.redFlagsRaised.join("; ")}`
        : "",
      `Trends: ${summary.trends.map((t) => `${t.metric} ${t.direction}`).join(", ")}`,
      "",
      summary.disclaimer,
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="screen">
      <h1 className="h1">Hand to your GP</h1>
      <p className="lead">
        A short summary built from your own check-ins, so an appointment starts
        with the history already gathered. You decide whether to share it.
      </p>

      {!summary ? (
        <button
          className="btn primary"
          data-testid="generate-handoff"
          disabled={busy || points.length === 0}
          onClick={generate}
        >
          {points.length === 0
            ? "Do a check-in first"
            : busy
              ? "Preparing…"
              : "Prepare GP summary"}
        </button>
      ) : (
        <>
          <div className="card" data-testid="handoff-summary">
            <p style={{ color: "var(--ink)", marginTop: 0 }}>
              {phrased?.gpNarrative ?? summary.narrativeDraft}
            </p>
            <div className="metric-head" style={{ fontSize: 13 }}>
              <span className="muted">
                {summary.checkInCount} check-ins · {summary.windowDays} day window
              </span>
              <span className="pill">
                {phrased?.mode === "ai" ? "phrased by Claude" : "on-device"}
              </span>
            </div>
            {summary.redFlagsRaised.length > 0 && (
              <p className="trend-down" style={{ fontSize: 13 }}>
                Warning signs: {summary.redFlagsRaised.join("; ")}
              </p>
            )}
            <ul className="muted" style={{ fontSize: 13, paddingLeft: 18 }}>
              {summary.trends.map((t) => (
                <li key={t.metric}>
                  {t.metric}: {t.direction}
                </li>
              ))}
            </ul>
          </div>
          <button className="btn" data-testid="copy-handoff" onClick={copy}>
            Copy summary
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              setSummary(null);
              setPhrased(null);
            }}
          >
            Rebuild
          </button>
          <p className="disclaimer">{summary.disclaimer}</p>
        </>
      )}
    </div>
  );
}
