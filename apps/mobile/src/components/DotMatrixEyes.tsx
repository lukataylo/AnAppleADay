import React, { useEffect, useState } from "react";
import Svg, { Circle } from "react-native-svg";
import { palette } from "../theme";

export type EyePhase =
  | "idle"
  | "listening"
  | "speaking"
  | "thinking"
  | "happy"
  | "concerned";

const OPEN = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];
const BLINK = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
const HAPPY = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
];
const CONCERNED = [
  [0, 0, 0, 1, 1],
  [0, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0],
  [0, 1, 1, 0, 0],
];

const EYE_W = 5;
const EYE_H = 6;
const GAP = 3;
const COLS = EYE_W * 2 + GAP;

function patternFor(phase: EyePhase, blink: boolean): number[][] {
  if (blink) return BLINK;
  if (phase === "happy") return HAPPY;
  if (phase === "concerned") return CONCERNED;
  return OPEN;
}

export function DotMatrixEyes({
  phase = "idle",
  level = 0,
  size = 200,
  matrix = false,
}: {
  phase?: EyePhase;
  level?: number;
  size?: number;
  matrix?: boolean;
}) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const interval =
      phase === "listening" ? 2400 : phase === "thinking" ? 1400 : 4200;
    const id = setInterval(() => {
      if (cancelled) return;
      setBlink(true);
      setTimeout(() => !cancelled && setBlink(false), 130);
    }, interval);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase]);

  const pattern = patternFor(phase, blink);
  const reactive = phase === "speaking" || phase === "listening";
  const amp = reactive ? level : 0;

  const GCOLS = matrix ? 17 : COLS;
  const GROWS = matrix ? 11 : EYE_H;
  const startCol = Math.floor((GCOLS - COLS) / 2);
  const startRow = Math.floor((GROWS - EYE_H) / 2);

  const cell = size / GCOLS;
  const litR = cell * 0.36 * (1 + amp * 0.5);
  const dimR = cell * 0.12;
  const height = cell * GROWS;

  const eyeLit = (r: number, c: number): boolean => {
    const er = r - startRow;
    if (er < 0 || er >= EYE_H) return false;
    const lc = c - startCol;
    if (lc >= 0 && lc < EYE_W) return pattern[er]?.[lc] === 1;
    const rc = c - (startCol + EYE_W + GAP);
    if (rc >= 0 && rc < EYE_W) return pattern[er]?.[rc] === 1;
    return false;
  };

  const dots: React.ReactNode[] = [];
  for (let r = 0; r < GROWS; r++) {
    for (let c = 0; c < GCOLS; c++) {
      const lit = eyeLit(r, c);
      dots.push(
        <Circle
          key={`${r}-${c}`}
          cx={(c + 0.5) * cell}
          cy={(r + 0.5) * cell}
          r={lit ? litR : dimR}
          fill={lit ? palette.accent : palette.ink}
          opacity={lit ? 1 : 0.12}
        />,
      );
    }
  }

  return (
    <Svg width={size} height={height}>
      {dots}
    </Svg>
  );
}
