import type { Disposition, MonitoringPlan } from "./types";
import type { Phq9Result } from "./instruments";

const DAY_MS = 24 * 60 * 60 * 1000;

export function createMonitoringPlan(
  reason: string,
  intervalDays: number,
  now: number,
): MonitoringPlan {
  if (intervalDays <= 0) throw new Error("intervalDays must be positive");
  return {
    active: true,
    intervalDays,
    reason,
    startedAt: now,
    nextDueAt: now + intervalDays * DAY_MS,
  };
}

export function isCheckInDue(plan: MonitoringPlan, now: number): boolean {
  return plan.active && now >= plan.nextDueAt;
}

/** Advance the schedule after a completed check-in. */
export function recordCheckIn(
  plan: MonitoringPlan,
  now: number,
): MonitoringPlan {
  return { ...plan, nextDueAt: now + plan.intervalDays * DAY_MS };
}

export function stopMonitoring(plan: MonitoringPlan): MonitoringPlan {
  return { ...plan, active: false };
}

export interface MonitoringDecision {
  activate: boolean;
  intervalDays: number;
  reason: string;
}

/**
 * Decide whether to switch on every-other-day follow-up. The idea is that most
 * people do not remember how they felt last week, so when something worth
 * watching shows up we ask again soon. GP-routine or more urgent dispositions,
 * or a self-harm flag, turn it on.
 */
export function shouldActivateMonitoring(
  disposition: Disposition,
  phq9?: Phq9Result,
): MonitoringDecision {
  if (phq9?.selfHarmFlag) {
    return {
      activate: true,
      intervalDays: 2,
      reason:
        "Following up closely because of what you shared about your safety.",
    };
  }
  if (disposition.level === "emergency-999" || disposition.level === "urgent-111") {
    return {
      activate: true,
      intervalDays: 2,
      reason: "Checking in every couple of days while this is being sorted out.",
    };
  }
  if (disposition.level === "gp-routine") {
    return {
      activate: true,
      intervalDays: 2,
      reason: "Keeping an eye on this with a quick check-in every other day.",
    };
  }
  return {
    activate: false,
    intervalDays: 0,
    reason: "No follow-up needed for now.",
  };
}
