import { useCallback, useEffect, useRef } from "react";
import type { VoiceFeatures } from "@apple/core";

// On-device voice capture for the mobile app. It loads expo-audio at runtime if
// present (in a dev client build) and derives loudness, pause ratio, and a
// coarse voice-quality value from the recorder's metering. In Expo Go without
// expo-audio it reports unsupported and the check-in falls back to mood only.
// Pitch and jitter need raw PCM (expo-audio useAudioSampleListener) and are
// left at zero here; they are documented as the dev-client upgrade.
//
// Face signals on mobile use react-native-vision-camera plus the ML Kit face
// detector in a dev client; see the README for the prebuild steps.

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function useVoiceCapture() {
  const modRef = useRef<unknown>(null);
  const recorderRef = useRef<{ stop?: () => Promise<void>; getStatus?: () => { metering?: number }; record?: () => void; prepareToRecordAsync?: (o: unknown) => Promise<void> } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplesRef = useRef<number[]>([]);
  const levelRef = useRef(0);

  const triedRef = useRef(false);
  const load = async (): Promise<{ [k: string]: unknown } | null> => {
    if (triedRef.current) return modRef.current as { [k: string]: unknown } | null;
    triedRef.current = true;
    try {
      modRef.current = await import("expo-audio");
    } catch {
      modRef.current = null;
    }
    return modRef.current as { [k: string]: unknown } | null;
  };

  const start = useCallback(async (): Promise<boolean> => {
    const mod = await load();
    if (!mod) return false;
    try {
      const requestPerms = mod.requestRecordingPermissionsAsync as
        | (() => Promise<{ granted: boolean }>)
        | undefined;
      const perm = await requestPerms?.();
      if (perm && perm.granted === false) return false;

      const setMode = mod.setAudioModeAsync as ((o: unknown) => Promise<void>) | undefined;
      await setMode?.({ allowsRecording: true, playsInSilentMode: true });

      const Recorder = mod.AudioRecorder as
        | (new (preset: unknown) => NonNullable<typeof recorderRef.current>)
        | undefined;
      const presets = mod.RecordingPresets as { HIGH_QUALITY?: unknown } | undefined;
      if (!Recorder) return false;
      const recorder = new Recorder(presets?.HIGH_QUALITY ?? {});
      await recorder.prepareToRecordAsync?.({ isMeteringEnabled: true });
      recorder.record?.();
      recorderRef.current = recorder;

      samplesRef.current = [];
      pollRef.current = setInterval(() => {
        const status = recorder.getStatus?.();
        const metering = status?.metering ?? -160; // dBFS
        const norm = Math.max(0, Math.min(1, (metering + 60) / 60));
        levelRef.current = norm;
        samplesRef.current.push(norm);
      }, 100);
      return true;
    } catch {
      return false;
    }
  }, []);

  const stop = useCallback(async (): Promise<VoiceFeatures | null> => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    levelRef.current = 0;
    if (recorder) {
      try {
        await recorder.stop?.();
      } catch {
        // ignore stop errors
      }
    }
    const samples = samplesRef.current;
    if (samples.length === 0) return null;
    const loud = mean(samples);
    const pauseRatio = samples.filter((s) => s < 0.05).length / samples.length;
    let shimmerAbs = 0;
    for (let i = 1; i < samples.length; i++) {
      shimmerAbs += Math.abs((samples[i] ?? 0) - (samples[i - 1] ?? 0));
    }
    const shimmer = samples.length > 1 ? shimmerAbs / (samples.length - 1) : 0;
    return {
      f0Mean: 0,
      f0Sd: 0,
      jitter: 0,
      shimmer: Number(shimmer.toFixed(3)),
      hnr: Number(((1 - pauseRatio) * 25).toFixed(1)),
      loudness: Number(loud.toFixed(3)),
      pauseRatio: Number(pauseRatio.toFixed(3)),
    };
  }, []);

  // Release the recorder and metering interval if the screen unmounts
  // mid-capture, so the microphone is never left recording.
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      recorderRef.current?.stop?.().catch(() => {});
      recorderRef.current = null;
    };
  }, []);

  return { start, stop, levelRef };
}
