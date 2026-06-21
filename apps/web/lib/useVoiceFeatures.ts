"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { VoiceFeatures } from "@apple/core";

// On-device voice feature extraction with the Web Audio API. Nothing is sent
// anywhere; we read the live waveform, derive acoustic features, and keep only
// the aggregated numbers. Pitch comes from autocorrelation, loudness from RMS.
// Jitter and shimmer here are lightweight approximations and are labelled
// experimental in the UI.

interface Frame {
  rms: number;
  f0: number | null;
}

function autocorrelationPitch(buf: Float32Array, sampleRate: number): number | null {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i]! * buf[i]!;
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // too quiet to be voiced

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]!) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]!) < thres) {
      r2 = SIZE - i;
      break;
    }
  }
  const trimmed = buf.subarray(r1, r2);
  const n = trimmed.length;
  const c = new Float32Array(n);
  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) sum += trimmed[i]! * trimmed[i + lag]!;
    c[lag] = sum;
  }
  let d = 0;
  while (d < n - 1 && c[d]! > c[d + 1]!) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < n; i++) {
    if (c[i]! > maxval) {
      maxval = c[i]!;
      maxpos = i;
    }
  }
  if (maxpos <= 0) return null;
  const f0 = sampleRate / maxpos;
  if (f0 < 60 || f0 > 500) return null;
  return f0;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function sd(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

export function useVoiceFeatures() {
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const framesRef = useRef<Frame[]>([]);
  const levelRef = useRef<number>(0);
  const runningRef = useRef<boolean>(false);

  const start = useCallback(async (stream: MediaStream) => {
    streamRef.current = stream;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    framesRef.current = [];
    runningRef.current = true;

    const loop = () => {
      if (!runningRef.current) return;
      analyser.getFloatTimeDomainData(buf);
      let rms = 0;
      for (let i = 0; i < buf.length; i++) rms += buf[i]! * buf[i]!;
      rms = Math.sqrt(rms / buf.length);
      levelRef.current = Math.min(1, rms * 6);
      const f0 = autocorrelationPitch(buf, ctx.sampleRate);
      framesRef.current.push({ rms, f0 });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stop = useCallback((): VoiceFeatures | null => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    const frames = framesRef.current;
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    levelRef.current = 0;
    if (frames.length === 0) return null;

    const voiced = frames.filter((f) => f.f0 !== null);
    const f0s = voiced.map((f) => f.f0 as number);
    const rmsAll = frames.map((f) => f.rms);
    const voicedRms = voiced.map((f) => f.rms);

    const f0Mean = mean(f0s);
    const f0Sd = sd(f0s);
    // Period jitter: relative variation of consecutive periods.
    const periods = f0s.map((f) => 1 / f);
    let jitterAbs = 0;
    for (let i = 1; i < periods.length; i++) {
      jitterAbs += Math.abs(periods[i]! - periods[i - 1]!);
    }
    const jitter =
      periods.length > 1 && mean(periods) > 0
        ? jitterAbs / (periods.length - 1) / mean(periods)
        : 0;
    // Shimmer: relative variation of consecutive voiced amplitudes.
    let shimmerAbs = 0;
    for (let i = 1; i < voicedRms.length; i++) {
      shimmerAbs += Math.abs(voicedRms[i]! - voicedRms[i - 1]!);
    }
    const shimmer =
      voicedRms.length > 1 && mean(voicedRms) > 0
        ? shimmerAbs / (voicedRms.length - 1) / mean(voicedRms)
        : 0;
    // HNR proxy: ratio of voiced energy to overall energy, mapped to a dB-ish scale.
    const voicedRatio = voiced.length / frames.length;
    const hnr = Math.max(0, Math.min(25, voicedRatio * 25));
    const pauseRatio =
      rmsAll.filter((r) => r < 0.01).length / Math.max(1, rmsAll.length);

    return {
      f0Mean: Number(f0Mean.toFixed(1)),
      f0Sd: Number(f0Sd.toFixed(1)),
      jitter: Number(jitter.toFixed(4)),
      shimmer: Number(shimmer.toFixed(4)),
      hnr: Number(hnr.toFixed(1)),
      loudness: Number(mean(rmsAll).toFixed(4)),
      pauseRatio: Number(pauseRatio.toFixed(3)),
    };
  }, []);

  // Release the AudioContext and stop the loop if the component unmounts
  // mid-capture, so the microphone is never left open.
  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Stable object so consumers can safely use this in effect dependencies.
  return useMemo(
    () => ({
      start,
      stop,
      levelRef,
      supported:
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices,
    }),
    [start, stop],
  );
}
