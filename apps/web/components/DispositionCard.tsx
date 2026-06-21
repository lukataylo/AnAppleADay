"use client";

import type { Disposition } from "@apple/core";

export function DispositionCard({ d }: { d: Disposition }) {
  return (
    <div className={`disposition ${d.level}`} data-testid="disposition" data-level={d.level}>
      {d.urgent && (
        <span className="pill" style={{ marginBottom: 10 }}>
          {d.level === "emergency-999" ? "Emergency" : "Urgent"}
        </span>
      )}
      <h2 style={{ margin: "2px 0 6px", fontSize: 20 }}>{d.title}</h2>
      <p style={{ color: "var(--ink)" }}>{d.detail}</p>
      {d.reason && <p className="muted">{d.reason}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {d.actions.map((a, i) =>
          a.kind === "call" ? (
            <a key={i} className="btn primary" href={`tel:${a.value}`}>
              {a.label}
            </a>
          ) : a.kind === "link" ? (
            <a
              key={i}
              className="btn"
              href={a.value}
              target="_blank"
              rel="noreferrer"
            >
              {a.label}
            </a>
          ) : (
            <div key={i} className="pill" style={{ alignSelf: "flex-start" }}>
              {a.label}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
