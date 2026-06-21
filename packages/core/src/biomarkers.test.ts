import { describe, expect, it } from "vitest";
import {
  blinkRate,
  eyeAspectRatio,
  facialAsymmetry,
  isBlink,
  wellbeingIndex,
  type Point2D,
} from "./biomarkers";

describe("eyeAspectRatio", () => {
  it("computes a known geometry", () => {
    // open eye: corners 0..6 on x, lids +/-1 on y
    const pts: Point2D[] = [
      { x: 0, y: 0 },
      { x: 2, y: 1 },
      { x: 4, y: 1 },
      { x: 6, y: 0 },
      { x: 4, y: -1 },
      { x: 2, y: -1 },
    ];
    // horizontal = 6, vertical pairs = 2 and 2 -> (2+2)/(2*6) = 0.333
    expect(eyeAspectRatio(pts)).toBeCloseTo(0.3333, 3);
  });
  it("returns 0 when the eye is degenerate", () => {
    const pts: Point2D[] = Array.from({ length: 6 }, () => ({ x: 0, y: 0 }));
    expect(eyeAspectRatio(pts)).toBe(0);
  });
  it("rejects wrong point counts", () => {
    expect(() => eyeAspectRatio([{ x: 0, y: 0 }])).toThrow();
  });
});

describe("blink detection", () => {
  it("flags a closed eye below threshold", () => {
    expect(isBlink(0.1)).toBe(true);
    expect(isBlink(0.3)).toBe(false);
  });
  it("counts blinks as downward threshold crossings", () => {
    // two blinks across a 60s window -> 2 per minute
    const samples = [0.3, 0.1, 0.3, 0.3, 0.1, 0.3];
    expect(blinkRate(samples, 60000)).toBeCloseTo(2, 5);
  });
  it("does not double count a sustained closure", () => {
    const samples = [0.3, 0.1, 0.1, 0.1, 0.3];
    expect(blinkRate(samples, 60000)).toBeCloseTo(1, 5);
  });
  it("does not over-count a take that starts mid-blink", () => {
    // starts closed, reopens, no new downward crossing -> 0 blinks
    const samples = [0.1, 0.1, 0.3, 0.3];
    expect(blinkRate(samples, 60000)).toBeCloseTo(0, 5);
    // starts closed, reopens, then a real blink -> 1
    const samples2 = [0.1, 0.3, 0.1, 0.3];
    expect(blinkRate(samples2, 60000)).toBeCloseTo(1, 5);
  });
});

describe("facialAsymmetry", () => {
  it("is zero for symmetric pairs", () => {
    expect(facialAsymmetry([[0.5, 0.5], [0.2, 0.2]])).toBe(0);
  });
  it("grows with difference and clamps to 1", () => {
    expect(facialAsymmetry([[1, 0]])).toBe(1);
  });
});

describe("wellbeingIndex", () => {
  it("returns 0 when there is no signal", () => {
    expect(wellbeingIndex({})).toBe(0);
  });
  it("scores a good day high and a bad day low", () => {
    const good = wellbeingIndex({
      moodSelfReport: 5,
      face: { smileIntensity: 0.9, blinkRate: 14 } as never,
      voice: { hnr: 22, jitter: 0.005, pauseRatio: 0.1 } as never,
    });
    const bad = wellbeingIndex({
      moodSelfReport: 1,
      face: { smileIntensity: 0.05, blinkRate: 40 } as never,
      voice: { hnr: 3, jitter: 0.05, pauseRatio: 0.8 } as never,
    });
    expect(good).toBeGreaterThan(70);
    expect(bad).toBeLessThan(30);
    expect(good).toBeGreaterThan(bad);
  });
  it("only averages the signals present", () => {
    expect(wellbeingIndex({ moodSelfReport: 5 })).toBe(100);
    expect(wellbeingIndex({ moodSelfReport: 1 })).toBe(0);
  });
});
