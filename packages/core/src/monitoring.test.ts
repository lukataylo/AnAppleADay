import { describe, expect, it } from "vitest";
import {
  createMonitoringPlan,
  isCheckInDue,
  recordCheckIn,
  shouldActivateMonitoring,
  stopMonitoring,
} from "./monitoring";
import { dispositionFor } from "./dispositions";
import { scorePhq9 } from "./instruments";

const DAY = 86400000;

describe("monitoring schedule", () => {
  it("creates a plan due after the interval", () => {
    const plan = createMonitoringPlan("watching low mood", 2, 1000);
    expect(plan.active).toBe(true);
    expect(plan.nextDueAt).toBe(1000 + 2 * DAY);
    expect(isCheckInDue(plan, 1000)).toBe(false);
    expect(isCheckInDue(plan, 1000 + 2 * DAY)).toBe(true);
  });
  it("advances the due date after a check-in", () => {
    const plan = createMonitoringPlan("x", 2, 0);
    const after = recordCheckIn(plan, 2 * DAY);
    expect(after.nextDueAt).toBe(4 * DAY);
  });
  it("stops monitoring", () => {
    const plan = stopMonitoring(createMonitoringPlan("x", 2, 0));
    expect(plan.active).toBe(false);
    expect(isCheckInDue(plan, 10 * DAY)).toBe(false);
  });
  it("rejects a non-positive interval", () => {
    expect(() => createMonitoringPlan("x", 0, 0)).toThrow();
  });
});

describe("shouldActivateMonitoring", () => {
  it("activates every other day on a self-harm flag", () => {
    const d = shouldActivateMonitoring(
      dispositionFor("self-care"),
      scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 1]),
    );
    expect(d.activate).toBe(true);
    expect(d.intervalDays).toBe(2);
  });
  it("activates for gp-routine and urgent", () => {
    expect(shouldActivateMonitoring(dispositionFor("gp-routine")).activate).toBe(true);
    expect(shouldActivateMonitoring(dispositionFor("urgent-111")).activate).toBe(true);
  });
  it("does not activate for plain self-care", () => {
    expect(shouldActivateMonitoring(dispositionFor("self-care")).activate).toBe(false);
  });
});
