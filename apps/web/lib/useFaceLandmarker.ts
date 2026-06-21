"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { facialAsymmetry, type FaceFeatures } from "@apple/core";

// On-device facial geometry with MediaPipe Face Landmarker, loaded lazily in
// the browser. We surface blink rate, smile intensity, head pose, asymmetry,
// and a coarse valence/arousal trend. No emotion label, no diagnosis.

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

interface FrameAgg {
  blinks: number;
  smile: number[];
  asym: number[];
  yaw: number[];
  pitch: number[];
  roll: number[];
  valence: number[];
  arousal: number[];
  startedAt: number;
  blinkOpen: boolean;
}

function score(cats: Array<{ categoryName: string; score: number }>, name: string) {
  return cats.find((c) => c.categoryName === name)?.score ?? 0;
}

function eulerFromMatrix(data: number[]): {
  yaw: number;
  pitch: number;
  roll: number;
} {
  // Column-major 4x4. r(row,col) = data[col*4 + row].
  const r = (row: number, col: number) => data[col * 4 + row] ?? 0;
  const yaw = Math.atan2(r(0, 2), r(2, 2));
  const pitch = Math.atan2(-r(1, 2), Math.hypot(r(1, 0), r(1, 1)));
  const roll = Math.atan2(r(1, 0), r(1, 1));
  const deg = (x: number) => (x * 180) / Math.PI;
  return { yaw: deg(yaw), pitch: deg(pitch), roll: deg(roll) };
}

export function useFaceLandmarker() {
  const landmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef<boolean>(false);
  const aggRef = useRef<FrameAgg | null>(null);

  const start = useCallback(async (video: HTMLVideoElement) => {
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
    const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    });
    landmarkerRef.current = landmarker;
    aggRef.current = {
      blinks: 0,
      smile: [],
      asym: [],
      yaw: [],
      pitch: [],
      roll: [],
      valence: [],
      arousal: [],
      startedAt: performance.now(),
      blinkOpen: true,
    };
    runningRef.current = true;

    const loop = () => {
      if (!runningRef.current || !landmarkerRef.current) return;
      if (video.readyState >= 2) {
        const res = (
          landmarkerRef.current as {
            detectForVideo: (v: HTMLVideoElement, t: number) => unknown;
          }
        ).detectForVideo(video, performance.now()) as {
          faceBlendshapes?: Array<{
            categories: Array<{ categoryName: string; score: number }>;
          }>;
          facialTransformationMatrixes?: Array<{ data: number[] }>;
        };
        const agg = aggRef.current!;
        const bs = res.faceBlendshapes?.[0]?.categories;
        if (bs) {
          const blinkL = score(bs, "eyeBlinkLeft");
          const blinkR = score(bs, "eyeBlinkRight");
          const closed = (blinkL + blinkR) / 2 > 0.5;
          if (closed && agg.blinkOpen) {
            agg.blinks += 1;
            agg.blinkOpen = false;
          } else if (!closed) {
            agg.blinkOpen = true;
          }
          const smile = (score(bs, "mouthSmileLeft") + score(bs, "mouthSmileRight")) / 2;
          agg.smile.push(smile);
          const browDown =
            (score(bs, "browDownLeft") + score(bs, "browDownRight")) / 2;
          const frown =
            (score(bs, "mouthFrownLeft") + score(bs, "mouthFrownRight")) / 2;
          agg.valence.push(smile - frown);
          agg.arousal.push(Math.min(1, browDown + smile));
          agg.asym.push(
            facialAsymmetry([
              [score(bs, "mouthSmileLeft"), score(bs, "mouthSmileRight")],
              [score(bs, "eyeBlinkLeft"), score(bs, "eyeBlinkRight")],
              [score(bs, "browDownLeft"), score(bs, "browDownRight")],
              [score(bs, "cheekSquintLeft"), score(bs, "cheekSquintRight")],
            ]),
          );
        }
        const mat = res.facialTransformationMatrixes?.[0]?.data;
        if (mat) {
          const e = eulerFromMatrix(mat);
          agg.yaw.push(e.yaw);
          agg.pitch.push(e.pitch);
          agg.roll.push(e.roll);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stop = useCallback((): FaceFeatures | null => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    const l = landmarkerRef.current as { close?: () => void } | null;
    l?.close?.();
    landmarkerRef.current = null;
    const agg = aggRef.current;
    aggRef.current = null;
    if (!agg) return null;
    const avg = (xs: number[]) =>
      xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    const elapsedMin = Math.max(
      0.05,
      (performance.now() - agg.startedAt) / 60000,
    );
    return {
      blinkRate: Number((agg.blinks / elapsedMin).toFixed(1)),
      earMean: 0,
      smileIntensity: Number(avg(agg.smile).toFixed(3)),
      headPose: {
        yaw: Number(avg(agg.yaw).toFixed(1)),
        pitch: Number(avg(agg.pitch).toFixed(1)),
        roll: Number(avg(agg.roll).toFixed(1)),
      },
      asymmetry: Number(avg(agg.asym).toFixed(3)),
      valence: Number(avg(agg.valence).toFixed(3)),
      arousal: Number(avg(agg.arousal).toFixed(3)),
    };
  }, []);

  // Close the landmarker and cancel the loop if unmounted mid-capture.
  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      const l = landmarkerRef.current as { close?: () => void } | null;
      l?.close?.();
      landmarkerRef.current = null;
    };
  }, []);

  return useMemo(() => ({ start, stop }), [start, stop]);
}
