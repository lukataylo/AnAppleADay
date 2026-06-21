"use client";

import { useEffect, useRef, useState } from "react";

export type EyePhase =
  | "idle"
  | "listening"
  | "speaking"
  | "thinking"
  | "happy"
  | "concerned";

// 5 wide x 6 tall eye glyphs. 1 = lit dot.
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
const GAP = 3; // columns between eyes
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
  const [look, setLook] = useState(0); // -1..1 horizontal gaze
  const smooth = useRef(0);
  const [, force] = useState(0);

  // Blink loop, faster while listening or thinking.
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

  // Gentle gaze drift while thinking.
  useEffect(() => {
    if (phase !== "thinking") {
      setLook(0);
      return;
    }
    let cancelled = false;
    const id = setInterval(() => {
      if (!cancelled) setLook(Math.round((Math.sin(Date.now() / 600) || 0)));
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase]);

  // Smooth the audio level so dot growth is fluid. Only animate while a voice
  // phase is active or the value is still settling, so idle frames don't force
  // a continuous re-render of every dot.
  const reactive = phase === "speaking" || phase === "listening";
  useEffect(() => {
    if (!reactive && Math.abs(level - smooth.current) < 0.01) {
      smooth.current = level;
      return;
    }
    let raf = 0;
    const tick = () => {
      smooth.current += (level - smooth.current) * 0.2;
      force((n) => (n + 1) % 1000);
      if (!reactive && Math.abs(level - smooth.current) < 0.01) {
        smooth.current = level;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [level, reactive]);

  const pattern = patternFor(phase, blink);
  const cell = size / COLS;
  const litBase = cell * 0.36;
  const dimR = cell * 0.12;
  const amp = phase === "speaking" || phase === "listening" ? smooth.current : 0;
  const litR = litBase * (1 + amp * 0.5);
  const accent = "#ffd27a";
  const height = cell * EYE_H;

  const dots: React.ReactNode[] = [];
  for (let eye = 0; eye < 2; eye++) {
    const colOffset = eye === 0 ? 0 : EYE_W + GAP;
    for (let r = 0; r < EYE_H; r++) {
      for (let c = 0; c < EYE_W; c++) {
        const lit = pattern[r]?.[c] === 1;
        const cx = (colOffset + c + 0.5) * cell + look * cell * 0.5;
        const cy = (r + 0.5) * cell;
        dots.push(
          <circle
            key={`${eye}-${r}-${c}`}
            cx={cx}
            cy={cy}
            r={lit ? litR : dimR}
            fill={lit ? accent : "#ffffff"}
            opacity={lit ? 1 : 0.14}
            style={lit ? { filter: `drop-shadow(0 0 ${4 + amp * 8}px ${accent})` } : undefined}
          />,
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={height}
      viewBox={`0 0 ${cell * COLS} ${height}`}
      role="img"
      aria-label="animated dot-matrix eyes"
      data-phase={phase}
    >
      {dots}
    </svg>
  );
}
