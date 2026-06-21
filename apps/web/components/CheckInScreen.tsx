"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMonitoringPlan,
  recordCheckIn,
  shouldActivateMonitoring,
  withWellbeing,
  type DailyPoint,
  type FaceFeatures,
  type Phq9Result,
  type TriageState,
  type VoiceFeatures,
} from "@apple/core";
import { DotMatrixEyes, type EyePhase } from "./DotMatrixEyes";
import { TriageFlow } from "./TriageFlow";
import { useApp } from "@/lib/state";
import { useVoiceFeatures } from "@/lib/useVoiceFeatures";
import { useFaceLandmarker } from "@/lib/useFaceLandmarker";
import { newId } from "@/lib/storage";

const CAPTURE_SECONDS = 12;
const MOODS = ["😣", "😕", "😐", "🙂", "😄"];

type Phase = "intro" | "capturing" | "saved" | "triage";

const SELF_HARM = /self-harm|harmed? your|better off dead|keep yourself safe/i;

export function CheckInScreen() {
  const { addPoint, monitoring, setMonitoring, consent, saveTriage } = useApp();
  const voice = useVoiceFeatures();
  const face = useFaceLandmarker();

  const [phase, setPhase] = useState<Phase>("intro");
  const [mood, setMood] = useState<number | null>(null);
  const [eyePhase, setEyePhase] = useState<EyePhase>("idle");
  const [level, setLevel] = useState(0);
  const [countdown, setCountdown] = useState(CAPTURE_SECONDS);
  const [lastPoint, setLastPoint] = useState<DailyPoint | null>(null);
  const [captureNote, setCaptureNote] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRafRef = useRef<number>(0);
  const busyRef = useRef(false);
  const captureCfgRef = useRef<{ audio: boolean; video: boolean }>({
    audio: true,
    video: true,
  });

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    cancelAnimationFrame(levelRafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Hard cleanup on unmount: never leave camera, mic, or timers running.
  useEffect(() => () => stopAll(), [stopAll]);

  const savePointWith = useCallback(
    async (v: VoiceFeatures | null, f: FaceFeatures | null) => {
      const point = withWellbeing({
        id: newId(),
        timestamp: Date.now(),
        moodSelfReport: mood ?? undefined,
        voice: v ?? undefined,
        face: f ?? undefined,
      });
      setLastPoint(point);
      await addPoint(point);
      // Advance the follow-up schedule if monitoring is active.
      if (monitoring?.active) {
        await setMonitoring(recordCheckIn(monitoring, Date.now()));
      }
      setPhase("saved");
      setEyePhase((mood ?? 3) >= 4 ? "happy" : (mood ?? 3) <= 2 ? "concerned" : "idle");
    },
    [addPoint, mood, monitoring, setMonitoring],
  );

  const runCapture = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setStarting(true);
    setCaptureNote(null);

    const wantAudio = consent?.voiceCapture !== false;
    const wantVideo = consent?.faceCapture !== false;
    captureCfgRef.current = { audio: wantAudio, video: wantVideo };

    if (!wantAudio && !wantVideo) {
      setCaptureNote(
        "Voice and face are both off in your settings, so we saved your mood only.",
      );
      await savePointWith(null, null);
      busyRef.current = false;
      setStarting(false);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: wantVideo ? { facingMode: "user" } : false,
        audio: wantAudio
          ? { echoCancellation: true, noiseSuppression: true }
          : false,
      });
    } catch {
      setCaptureNote(
        "Camera or microphone was not available, so we saved your mood only. The signals are optional.",
      );
      await savePointWith(null, null);
      busyRef.current = false;
      setStarting(false);
      return;
    }

    streamRef.current = stream;
    if (wantAudio) await voice.start(stream).catch(() => {});
    setPhase("capturing");
    setEyePhase("listening");
    busyRef.current = false;
    setStarting(false);
  }, [consent, voice, savePointWith]);

  // Capture lifecycle. Runs only once the "capturing" phase has rendered, so
  // the <video> element is mounted and the stream can attach to it.
  useEffect(() => {
    if (phase !== "capturing") return;
    const stream = streamRef.current;
    if (!stream) return;
    let cancelled = false;
    const cfg = captureCfgRef.current;

    (async () => {
      const video = videoRef.current;
      if (video && cfg.video && stream.getVideoTracks().length > 0) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // autoplay can reject; the recording still proceeds
        }
        if (!cancelled) await face.start(video).catch(() => {});
      }
    })();

    const tick = () => {
      setLevel(voice.levelRef.current);
      levelRafRef.current = requestAnimationFrame(tick);
    };
    levelRafRef.current = requestAnimationFrame(tick);

    let secs = CAPTURE_SECONDS;
    setCountdown(secs);
    timerRef.current = setInterval(async () => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        cancelAnimationFrame(levelRafRef.current);
        const v = cfg.audio ? voice.stop() : null;
        const f = cfg.video ? face.stop() : null;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setLevel(0);
        setEyePhase("thinking");
        await savePointWith(v, f);
      }
    }, 1000);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      cancelAnimationFrame(levelRafRef.current);
    };
  }, [phase, voice, face, savePointWith]);

  const onTriageComplete = useCallback(
    async (state: TriageState) => {
      if (!state.disposition) return;
      await saveTriage(state);
      if (monitoring?.active) return;
      const selfHarm = SELF_HARM.test(state.disposition.reason ?? "");
      const phq9: Phq9Result | undefined = selfHarm
        ? { total: 0, band: "minimal", selfHarmFlag: true }
        : undefined;
      const decision = shouldActivateMonitoring(state.disposition, phq9);
      if (decision.activate) {
        await setMonitoring(
          createMonitoringPlan(decision.reason, decision.intervalDays, Date.now()),
        );
      }
    },
    [monitoring, setMonitoring, saveTriage],
  );

  if (phase === "triage") {
    return (
      <div className="screen">
        <button
          className="pill"
          style={{ alignSelf: "flex-start" }}
          onClick={() => setPhase("saved")}
        >
          ← Back
        </button>
        <TriageFlow onComplete={onTriageComplete} />
        <p className="disclaimer">
          This is general signposting, not a diagnosis. In an emergency call 999.
        </p>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="center-stage">
        {phase === "capturing" ? (
          <div className="video-wrap">
            <video ref={videoRef} playsInline muted />
            <div className="eyes-overlay">
              <DotMatrixEyes phase={eyePhase} level={level} size={180} />
            </div>
            <div
              className="pill"
              style={{ position: "absolute", top: 12, left: 12 }}
            >
              Listening · {countdown}s
            </div>
          </div>
        ) : (
          <DotMatrixEyes phase={eyePhase} level={level} size={220} />
        )}

        {phase === "intro" && (
          <>
            <h1 className="h1">How do you feel today?</h1>
            <p className="lead">
              One quick check-in. Tap how you feel, then add an optional
              twelve-second video so the app can read voice and face signals on
              your device.
            </p>
            <div className="mood-row" style={{ width: "100%" }}>
              {MOODS.map((m, i) => (
                <button
                  key={i}
                  className={`mood ${mood === i + 1 ? "selected" : ""}`}
                  data-testid={`mood-${i + 1}`}
                  onClick={() => setMood(i + 1)}
                  aria-pressed={mood === i + 1}
                >
                  {m}
                </button>
              ))}
            </div>
            {consent?.voiceCapture === false && consent?.faceCapture === false ? (
              <p className="muted" style={{ fontSize: 13 }}>
                Voice and face signals are off in your settings. You can still log
                your mood, or turn them on under About.
              </p>
            ) : null}
            <button
              className="btn primary"
              disabled={mood === null || starting}
              data-testid="start-capture"
              onClick={runCapture}
            >
              {starting ? "Starting…" : "Start video check-in"}
            </button>
            <button
              className="btn ghost"
              disabled={mood === null || starting}
              data-testid="save-mood-only"
              onClick={() => savePointWith(null, null)}
            >
              Save mood only
            </button>
          </>
        )}

        {phase === "capturing" && (
          <p className="lead">
            Tell me in your own words how your day has been. Just keep talking.
          </p>
        )}

        {phase === "saved" && lastPoint && (
          <>
            <h1 className="h1">Check-in saved</h1>
            {captureNote && <p className="lead">{captureNote}</p>}
            <div className="card" style={{ width: "100%" }}>
              <div className="metric-head">
                <span>Today&apos;s wellbeing signal</span>
                <strong>{lastPoint.wellbeingIndex} / 100</strong>
              </div>
              <div className="bar-track" style={{ marginTop: 8 }}>
                <div
                  className="bar-fill"
                  style={{ width: `${lastPoint.wellbeingIndex ?? 0}%` }}
                />
              </div>
              {(lastPoint.voice || lastPoint.face) && (
                <p className="muted" style={{ fontSize: 13 }}>
                  {lastPoint.voice
                    ? `Voice: pitch ${lastPoint.voice.f0Mean} Hz, clarity ${lastPoint.voice.hnr}`
                    : "Voice: not captured"}
                  {" · "}
                  {lastPoint.face
                    ? `Face: blink ${lastPoint.face.blinkRate}/min, smile ${Math.round(
                        (lastPoint.face.smileIntensity ?? 0) * 100,
                      )}%`
                    : "Face: not captured"}
                </p>
              )}
            </div>
            <button
              className="btn primary"
              data-testid="open-triage"
              onClick={() => setPhase("triage")}
            >
              Anything bothering you today?
            </button>
            <button
              className="btn ghost"
              data-testid="checkin-again"
              onClick={() => {
                setMood(null);
                setLastPoint(null);
                setCaptureNote(null);
                setEyePhase("idle");
                setPhase("intro");
              }}
            >
              Done for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
