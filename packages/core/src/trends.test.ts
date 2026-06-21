import { describe, expect, it } from "vitest";
import {
  baseline,
  linearSlope,
  mean,
  stdDev,
  trend,
  zScore,
} from "./trends";
import type { DailyPoint } from "./types";

function pts(values: number[]): DailyPoint[] {
  return values.map((v, i) => ({
    id: `p${i}`,
    timestamp: i * 86400000,
    wellbeingIndex: v,
  }));
}

describe("stats helpers", () => {
  it("mean and stdDev", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(stdDev([2, 4, 6])).toBeCloseTo(2, 5);
    expect(stdDev([5])).toBe(0);
  });
  it("linearSlope of a rising line", () => {
    expect(linearSlope([0, 1, 2, 3])).toBeCloseTo(1, 5);
    expect(linearSlope([3, 2, 1, 0])).toBeCloseTo(-1, 5);
  });
  it("zScore against a baseline", () => {
    const b = baseline(pts([10, 12, 14, 16, 18, 20, 22]), (p) => p.wellbeingIndex);
    expect(zScore(b.mean, b)).toBe(0);
    expect(zScore(b.mean + b.sd, b)).toBeCloseTo(1, 5);
  });
});

describe("trend direction", () => {
  it("reports improving when a higher-is-better metric rises", () => {
    const t = trend(pts([40, 42, 45, 50, 60]), (p) => p.wellbeingIndex, {
      higherIsBetter: true,
    });
    expect(t.direction).toBe("improving");
  });
  it("reports worsening when a higher-is-better metric falls", () => {
    const t = trend(pts([80, 70, 60, 50, 40]), (p) => p.wellbeingIndex, {
      higherIsBetter: true,
    });
    expect(t.direction).toBe("worsening");
  });
  it("reports steady for flat data", () => {
    const t = trend(pts([50, 50, 50, 50, 50, 50, 50, 51, 50]), (p) => p.wellbeingIndex, {
      higherIsBetter: true,
    });
    expect(t.direction).toBe("steady");
  });
  it("flips meaning for lower-is-better metrics", () => {
    // jitter rising is bad
    const points: DailyPoint[] = [0.01, 0.02, 0.03, 0.04, 0.05].map((v, i) => ({
      id: `j${i}`,
      timestamp: i * 86400000,
      voice: { f0Mean: 0, f0Sd: 0, jitter: v, shimmer: 0, hnr: 0, loudness: 0 },
    }));
    const t = trend(points, (p) => p.voice?.jitter, { higherIsBetter: false });
    expect(t.direction).toBe("worsening");
  });
  it("handles empty data without throwing", () => {
    const t = trend([], (p) => p.wellbeingIndex);
    expect(t.latest).toBeUndefined();
    expect(t.direction).toBe("steady");
  });
});
