"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMonitoringPlan,
  recordCheckIn,
  shouldActivateMonitoring,
  withWellbeing,
  type DailyPoint,
  type Phq9Result,
  type TriageState,
  type VoiceFeatures,
} from "@apple/core";
import { DotMatrixEyes, type EyePhase } from "./DotMatrixEyes";
import { TriageFlow } from "./TriageFlow";
import { useApp } from "@/lib/state";
import { useVoiceFeatures } from "@/lib/useVoiceFeatures";
import { useFaceLandmarker } from "@/lib/useFaceLandmarker";
import { useSpeech } from "@/lib/useSpeech";
import { newId } from "@/lib/storage";

const LISTEN_SECONDS = 15;
const MOODS = ["😣", "😕", "😐", "🙂", "😄"];
const PROMPT = "How do you feel today? Take your time, and tell me about your day.";
const SELF_HARM = /self-harm|harmed? your|better off dead|keep yourself safe/i;

type Phase = "intro" | "capturing" | "saved" | "triage";
type Stage = "speaking" | "listening";

export function CheckInScreen() {
  const { addPoint, monitoring, setMonitoring, consent, saveTriage } = useApp();
  const voice = useVoiceFeatures();
  const face = useFaceLandmarker();
  const speech = useSpeech();

  const [phase, setPhase] = useState<Phase>("intro");
  const [stage, setStage] = useState<Stage>("speaking");
  const [mood, setMood] = useState<number | null>(null);
  const [eyePhase, setEyePhase] = useState<EyePhase>("idle");
  const [level, setLevel] = useState(0);
  const [countdown, setCountdown] = useState(LISTEN_SECONDS);
  const [transcript, setTranscript] = useState("");
  const [lastPoint, setLastPoint] = useState<DailyPoint | null>(null);
  const [captureNote, setCaptureNote] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRafRef = useRef<number>(0);
  const sttStopRef = useRef<(() => void) | null>(null);
  const busyRef = useRef(false);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  const stageRef = useRef<Stage>("speaking");
  const transcriptRef = useRef("");
  const listenStartRef = useRef(0);
  const captureCfgRef = useRef<{ audio: boolean; video: boolean }>({
    audio: true,
    video: true,
  });

  const setStageBoth = useCallback((s: Stage) => {
    stageRef.current = s;
    setStage(s);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(levelRafRef.current);
      sttStopRef.current?.();
      speech.stopSpeaking();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [speech]);

  const savePointWith = useCallback(
    async (v: VoiceFeatures | null) => {
      const point = withWellbeing({
        id: newId(),
        timestamp: Date.now(),
        moodSelfReport: mood ?? undefined,
        voice: v ?? undefined,
        notes: transcriptRef.current || undefined,
      });
      setLastPoint(point);
      await addPoint(point);
      if (monitoring?.active) {
        await setMonitoring(recordCheckIn(monitoring, Date.now()));
      }
      if (!mountedRef.current) return;
      setPhase("saved");
      setEyePhase((mood ?? 3) >= 4 ? "happy" : (mood ?? 3) <= 2 ? "concerned" : "idle");
    },
    [addPoint, mood, monitoring, setMonitoring],
  );

  // Tear down capture. Saves a point when `save`, otherwise returns to the start.
  const stopCapture = useCallback(
    async (save: boolean) => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      cancelAnimationFrame(levelRafRef.current);
      sttStopRef.current?.();
      sttStopRef.current = null;
      speech.stopSpeaking();
      const cfg = captureCfgRef.current;
      const v = cfg.audio ? voice.stop() : null;
      if (cfg.video) face.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setLevel(0);

      if (save) {
        if (v) {
          const words = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length;
          const mins = Math.max(0.05, (Date.now() - listenStartRef.current) / 60000);
          if (words > 0) v.speechRateWpm = Math.round(words / mins);
        }
        setEyePhase("thinking");
        await savePointWith(v);
      } else if (mountedRef.current) {
        setEyePhase("idle");
        setStageBoth("speaking");
        setTranscript("");
        transcriptRef.current = "";
        setPhase("intro");
      }
    },
    [voice, face, speech, savePointWith, setStageBoth],
  );

  const saveMoodOnly = useCallback(async () => {
    transcriptRef.current = "";
    await savePointWith(null);
  }, [savePointWith]);

  const runCapture = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setStarting(true);
    setCaptureNote(null);
    setTranscript("");
    transcriptRef.current = "";
    cancelledRef.current = false;

    const wantAudio = consent?.voiceCapture !== false;
    const wantVideo = consent?.faceCapture !== false;
    captureCfgRef.current = { audio: wantAudio, video: wantVideo };

    if (!wantAudio && !wantVideo) {
      setCaptureNote("Voice and face are both off in your settings, so we saved your mood only.");
      await saveMoodOnly();
      busyRef.current = false;
      setStarting(false);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: wantVideo ? { facingMode: "user" } : false,
        audio: wantAudio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
    } catch {
      setCaptureNote("Camera or microphone was not available, so we saved your mood only.");
      await saveMoodOnly();
      busyRef.current = false;
      setStarting(false);
      return;
    }

    streamRef.current = stream;
    if (wantAudio) await voice.start(stream).catch(() => {});
    setStageBoth("speaking");
    setEyePhase("speaking");
    setPhase("capturing");
    busyRef.current = false;
    setStarting(false);
  }, [consent, voice, saveMoodOnly, setStageBoth]);

  // Capture lifecycle: attach camera, speak the prompt, then listen + transcribe.
  useEffect(() => {
    if (phase !== "capturing") return;
    const stream = streamRef.current;
    if (!stream) return;
    const cfg = captureCfgRef.current;

    const tick = () => {
      if (cancelledRef.current) return;
      const lvl =
        stageRef.current === "listening"
          ? voice.levelRef.current
          : 0.3 + Math.abs(Math.sin(Date.now() / 240)) * 0.3;
      setLevel(lvl);
      levelRafRef.current = requestAnimationFrame(tick);
    };
    levelRafRef.current = requestAnimationFrame(tick);

    (async () => {
      const video = videoRef.current;
      if (video && cfg.video && stream.getVideoTracks().length > 0) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // autoplay can reject
        }
        // Fire-and-forget: face capture runs in the background and must never
        // block the spoken flow (model load can be slow).
        if (!cancelledRef.current) void face.start(video).catch(() => {});
      }

      // App speaks the question.
      await speech.speak(PROMPT);
      if (cancelledRef.current) return;

      // Then listen and transcribe.
      setStageBoth("listening");
      setEyePhase("listening");
      listenStartRef.current = Date.now();
      sttStopRef.current = speech.startRecognition((t) => {
        if (cancelledRef.current) return;
        transcriptRef.current = t;
        setTranscript(t);
      });

      let secs = LISTEN_SECONDS;
      setCountdown(secs);
      timerRef.current = setInterval(() => {
        secs -= 1;
        if (!cancelledRef.current) setCountdown(secs);
        if (secs <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          void stopCapture(true);
        }
      }, 1000);
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(levelRafRef.current);
      sttStopRef.current?.();
    };
  }, [phase, voice, face, speech, stopCapture, setStageBoth]);

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
          <>
            <DotMatrixEyes phase={eyePhase} level={level} size={340} matrix />
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            />
            <div className="pill" data-testid="capture-status">
              {stage === "speaking" ? "Speaking…" : `Listening · ${countdown}s`}
            </div>
            <p className="lead" style={{ minHeight: 48 }}>
              {stage === "speaking"
                ? PROMPT
                : transcript || "Tell me how your day has been. Just keep talking."}
            </p>
            <button
              className="btn primary"
              data-testid="capture-finish"
              onClick={() => stopCapture(true)}
            >
              {stage === "speaking" ? "Skip to talking" : "I'm done"}
            </button>
            <button
              className="btn ghost"
              data-testid="capture-cancel"
              onClick={() => stopCapture(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <DotMatrixEyes phase={eyePhase} level={level} size={220} />
        )}

        {phase === "intro" && (
          <>
            <h1 className="h1">How do you feel today?</h1>
            <p className="lead">
              Tap how you feel. Add a short spoken check-in: the app asks, then
              listens, all on your device.
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
            <button
              className="btn primary"
              disabled={mood === null || starting}
              data-testid="start-capture"
              onClick={runCapture}
            >
              {starting ? "Starting…" : "Start spoken check-in"}
            </button>
            <button
              className="btn ghost"
              disabled={mood === null || starting}
              data-testid="save-mood-only"
              onClick={saveMoodOnly}
            >
              Save mood only
            </button>
          </>
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
                <div className="bar-fill" style={{ width: `${lastPoint.wellbeingIndex ?? 0}%` }} />
              </div>
              {lastPoint.voice && (
                <p className="muted" style={{ fontSize: 13 }}>
                  Voice: pitch {lastPoint.voice.f0Mean} Hz, clarity {lastPoint.voice.hnr}
                  {lastPoint.voice.speechRateWpm
                    ? `, ${lastPoint.voice.speechRateWpm} words/min`
                    : ""}
                </p>
              )}
              {lastPoint.notes && (
                <p className="muted" style={{ fontSize: 13, fontStyle: "italic" }}>
                  &ldquo;{lastPoint.notes}&rdquo;
                </p>
              )}
            </div>
            <button className="btn primary" data-testid="open-triage" onClick={() => setPhase("triage")}>
              Anything bothering you today?
            </button>
            <button
              className="btn ghost"
              data-testid="checkin-again"
              onClick={() => {
                setMood(null);
                setLastPoint(null);
                setCaptureNote(null);
                setTranscript("");
                transcriptRef.current = "";
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
