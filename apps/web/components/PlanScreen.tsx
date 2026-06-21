"use client";

import {
  createMonitoringPlan,
  isCheckInDue,
  stopMonitoring,
} from "@apple/core";
import { useApp } from "@/lib/state";

function formatDue(ts: number): string {
  const days = Math.round((ts - Date.now()) / 86400000);
  if (days <= 0) return "due now";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

export function PlanScreen() {
  const { monitoring, setMonitoring } = useApp();

  return (
    <div className="screen">
      <h1 className="h1">Follow-up plan</h1>
      <p className="lead">
        Most people forget how they felt last week. When it matters, we check in
        every other day.
      </p>

      {monitoring?.active ? (
        <div className="card">
          <span className="pill" style={{ marginBottom: 8 }}>
            Active · every {monitoring.intervalDays} days
          </span>
          <p style={{ color: "var(--ink)" }}>{monitoring.reason}</p>
          <p className="muted" data-testid="monitoring-due">
            Next check-in {formatDue(monitoring.nextDueAt)}
            {isCheckInDue(monitoring, Date.now()) ? " · ready now" : ""}
          </p>
          <button
            className="btn ghost"
            data-testid="monitoring-stop"
            onClick={() => setMonitoring(stopMonitoring(monitoring))}
          >
            Turn off follow-up
          </button>
        </div>
      ) : (
        <div className="card">
          <p>
            No follow-up is active. It switches on automatically when a check-in
            suggests something worth keeping an eye on, and you can start one
            yourself.
          </p>
          <button
            className="btn"
            data-testid="monitoring-start"
            onClick={() =>
              setMonitoring(
                createMonitoringPlan(
                  "You chose to keep a closer eye on how things are going.",
                  2,
                  Date.now(),
                ),
              )
            }
          >
            Start every-other-day check-ins
          </button>
        </div>
      )}
    </div>
  );
}
