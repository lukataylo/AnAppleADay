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
}: {
  phase?: EyePhase;
  level?: number;
  size?: number;
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
  const cell = size / COLS;
  const reactive = phase === "speaking" || phase === "listening";
  const amp = reactive ? level : 0;
  const litR = cell * 0.36 * (1 + amp * 0.5);
  const dimR = cell * 0.12;
  const height = cell * EYE_H;

  const dots: React.ReactNode[] = [];
  for (let eye = 0; eye < 2; eye++) {
    const colOffset = eye === 0 ? 0 : EYE_W + GAP;
    for (let r = 0; r < EYE_H; r++) {
      for (let c = 0; c < EYE_W; c++) {
        const lit = pattern[r]?.[c] === 1;
        dots.push(
          <Circle
            key={`${eye}-${r}-${c}`}
            cx={(colOffset + c + 0.5) * cell}
            cy={(r + 0.5) * cell}
            r={lit ? litR : dimR}
            fill={lit ? palette.accent : palette.ink}
            opacity={lit ? 1 : 0.14}
          />,
        );
      }
    }
  }

  return (
    <Svg width={size} height={height}>
      {dots}
    </Svg>
  );
}
