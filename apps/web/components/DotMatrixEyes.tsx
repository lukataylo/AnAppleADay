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
  matrix = false,
}: {
  phase?: EyePhase;
  level?: number;
  size?: number;
  /** Render a full grid of dim dots with the eyes lit within it. */
  matrix?: boolean;
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

  // In matrix mode the eyes sit inside a wider grid of dim dots.
  const GCOLS = matrix ? 17 : COLS;
  const GROWS = matrix ? 11 : EYE_H;
  const startCol = Math.floor((GCOLS - COLS) / 2);
  const startRow = Math.floor((GROWS - EYE_H) / 2);

  const cell = size / GCOLS;
  const litBase = cell * 0.36;
  const dimR = cell * 0.12;
  const amp = phase === "speaking" || phase === "listening" ? smooth.current : 0;
  const litR = litBase * (1 + amp * 0.5);
  const accent = "#ffd27a";
  const height = cell * GROWS;

  // Is grid cell (r,c) a lit dot of one of the two eyes?
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
      const cx = (c + 0.5) * cell + (lit ? look * cell * 0.5 : 0);
      const cy = (r + 0.5) * cell;
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={cx}
          cy={cy}
          r={lit ? litR : dimR}
          fill={lit ? accent : "#ffffff"}
          opacity={lit ? 1 : 0.12}
          style={lit ? { filter: `drop-shadow(0 0 ${4 + amp * 8}px ${accent})` } : undefined}
        />,
      );
    }
  }

  return (
    <svg
      width={size}
      height={height}
      viewBox={`0 0 ${cell * GCOLS} ${height}`}
      role="img"
      aria-label="animated dot-matrix eyes"
      data-phase={phase}
    >
      {dots}
    </svg>
  );
}
