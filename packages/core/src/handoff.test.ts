import { describe, expect, it } from "vitest";
import { buildHandoff } from "./handoff";
import { buildTriageTree } from "./tree";
import { answerChoice, startTriage } from "./triage";
import type { DailyPoint } from "./types";

function series(): DailyPoint[] {
  return [70, 65, 60, 55, 50, 45, 40].map((v, i) => ({
    id: `d${i}`,
    timestamp: i * 86400000,
    wellbeingIndex: v,
    moodSelfReport: 3,
  }));
}

describe("buildHandoff", () => {
  it("summarises check-ins, topics and a worsening trend", () => {
    const tree = buildTriageTree();
    let state = startTriage(tree);
    state = answerChoice(tree, state, 0); // chest pain
    state = answerChoice(tree, state, 0); // red flag yes -> 999

    const summary = buildHandoff(series(), state, 7 * 86400000);
    expect(summary.checkInCount).toBe(7);
    expect(summary.presentingTopics).toContain("chest-pain");
    expect(summary.redFlagsRaised.length).toBeGreaterThan(0);
    expect(summary.disposition?.level).toBe("emergency-999");

    const wellbeing = summary.trends.find((t) => t.metric === "Wellbeing index");
    expect(wellbeing?.direction).toBe("worsening");
    expect(summary.disclaimer).toMatch(/not a diagnosis|not a medical device/i);
    expect(summary.narrativeDraft.length).toBeGreaterThan(0);
  });

  it("handles no triage and few points", () => {
    const summary = buildHandoff(
      [{ id: "a", timestamp: 0, wellbeingIndex: 60 }],
      null,
      0,
    );
    expect(summary.checkInCount).toBe(1);
    expect(summary.disposition).toBeNull();
    expect(summary.presentingTopics).toHaveLength(0);
  });
});
