import { describe, expect, it } from "vitest";
import {
  PHQ9,
  GAD7,
  WHO5,
  scorePhq9,
  scoreGad7,
  scoreWho5,
  scoreMmrc,
  dispositionFromPhq9,
  dispositionFromGad7,
} from "./instruments";

describe("instrument definitions", () => {
  it("PHQ-9 has 9 items and four frequency options", () => {
    expect(PHQ9.items).toHaveLength(9);
    expect(PHQ9.options).toHaveLength(4);
  });
  it("GAD-7 has 7 items", () => {
    expect(GAD7.items).toHaveLength(7);
  });
  it("WHO-5 has 5 items and is positively framed", () => {
    expect(WHO5.items).toHaveLength(5);
    expect(WHO5.higherIsWorse).toBe(false);
  });
});

describe("scorePhq9", () => {
  it("sums and bands a minimal score", () => {
    const r = scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(r.total).toBe(0);
    expect(r.band).toBe("minimal");
    expect(r.selfHarmFlag).toBe(false);
  });
  it("bands a severe score", () => {
    const r = scorePhq9([3, 3, 3, 3, 3, 3, 3, 3, 0]);
    expect(r.total).toBe(24);
    expect(r.band).toBe("severe");
  });
  it("bands boundaries correctly", () => {
    expect(scorePhq9([1, 1, 1, 1, 0, 0, 0, 0, 0]).band).toBe("minimal"); // 4
    expect(scorePhq9([1, 1, 1, 1, 1, 0, 0, 0, 0]).band).toBe("mild"); // 5
    expect(scorePhq9([2, 2, 2, 2, 1, 0, 0, 0, 0]).band).toBe("mild"); // 9
    expect(scorePhq9([2, 2, 2, 2, 2, 0, 0, 0, 0]).band).toBe("moderate"); // 10
    expect(scorePhq9([3, 2, 2, 2, 2, 1, 0, 0, 0]).band).toBe("moderate"); // 14
    expect(scorePhq9([3, 3, 3, 3, 3, 0, 0, 0, 0]).band).toBe("moderately-severe"); // 15
    expect(scorePhq9([3, 3, 3, 3, 3, 3, 1, 0, 0]).band).toBe("moderately-severe"); // 19
    expect(scorePhq9([3, 3, 3, 3, 3, 3, 2, 0, 0]).band).toBe("severe"); // 20
  });
  it("raises the self-harm flag when item 9 is 1 or more", () => {
    expect(scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 1]).selfHarmFlag).toBe(true);
  });
  it("rejects wrong length and out-of-range answers", () => {
    expect(() => scorePhq9([0, 0])).toThrow();
    expect(() => scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 4])).toThrow();
  });
});

describe("scoreGad7", () => {
  it("flags assessment threshold at 10", () => {
    expect(scoreGad7([2, 2, 2, 2, 1, 1, 0]).needsAssessment).toBe(true); // 10
    expect(scoreGad7([1, 1, 1, 1, 1, 1, 3]).total).toBe(9);
    expect(scoreGad7([1, 1, 1, 1, 1, 1, 3]).needsAssessment).toBe(false);
  });
  it("bands boundaries correctly", () => {
    expect(scoreGad7([1, 1, 1, 1, 0, 0, 0]).band).toBe("minimal"); // 4
    expect(scoreGad7([1, 1, 1, 1, 1, 0, 0]).band).toBe("mild"); // 5
    expect(scoreGad7([2, 2, 2, 1, 1, 1, 0]).band).toBe("mild"); // 9
    expect(scoreGad7([2, 2, 2, 2, 1, 1, 0]).band).toBe("moderate"); // 10
    expect(scoreGad7([3, 3, 2, 2, 2, 2, 0]).band).toBe("moderate"); // 14
    expect(scoreGad7([3, 3, 3, 2, 2, 2, 0]).band).toBe("severe"); // 15
  });
});

describe("scoreWho5", () => {
  it("indexes raw to 0..100 and flags low wellbeing", () => {
    const good = scoreWho5([5, 5, 5, 5, 5]);
    expect(good.raw).toBe(25);
    expect(good.index).toBe(100);
    expect(good.lowWellbeing).toBe(false);

    const low = scoreWho5([2, 2, 3, 3, 3]); // raw 13
    expect(low.lowWellbeing).toBe(true);
  });
  it("flags low wellbeing when any single item is very low even if total is ok", () => {
    const r = scoreWho5([5, 5, 5, 5, 1]); // raw 21 but one item is 1
    expect(r.lowWellbeing).toBe(true);
  });
});

describe("scoreMmrc", () => {
  it("marks concern at grade 2 and above", () => {
    expect(scoreMmrc(1).concern).toBe(false);
    expect(scoreMmrc(2).concern).toBe(true);
  });
  it("rejects out-of-range grades", () => {
    expect(() => scoreMmrc(5)).toThrow();
  });
});

describe("instrument dispositions", () => {
  it("routes PHQ-9 self-harm to urgent 111, flagged urgent, with Samaritans", () => {
    const d = dispositionFromPhq9(scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 2]));
    expect(d.level).toBe("urgent-111");
    expect(d.urgent).toBe(true);
    expect(d.actions.some((a) => a.value === "116123")).toBe(true);
  });
  it("routes minimal PHQ-9 to self-care", () => {
    expect(dispositionFromPhq9(scorePhq9([0, 0, 0, 0, 0, 0, 0, 0, 0])).level).toBe(
      "self-care",
    );
  });
  it("routes high GAD-7 to GP", () => {
    expect(dispositionFromGad7(scoreGad7([3, 3, 3, 3, 3, 3, 3])).level).toBe(
      "gp-routine",
    );
  });
});
