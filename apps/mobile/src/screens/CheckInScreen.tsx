import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
import { palette } from "../theme";
import { s } from "../styles";
import { DotMatrixEyes, type EyePhase } from "../components/DotMatrixEyes";
import { TriageFlow } from "../components/TriageFlow";
import { useApp } from "../lib/state";
import { useVoiceCapture } from "../lib/useVoiceCapture";
import { newId } from "../lib/storage";

const CAPTURE_SECONDS = 12;
const MOODS = ["😣", "😕", "😐", "🙂", "😄"];
const SELF_HARM = /self-harm|harmed? your|better off dead|keep yourself safe/i;

type Phase = "intro" | "capturing" | "saved" | "triage";

export function CheckInScreen() {
  const { addPoint, monitoring, setMonitoring, consent, saveTriage } = useApp();
  const voice = useVoiceCapture();
  const mountedRef = useRef(true);

  const [phase, setPhase] = useState<Phase>("intro");
  const [mood, setMood] = useState<number | null>(null);
  const [eyePhase, setEyePhase] = useState<EyePhase>("idle");
  const [level, setLevel] = useState(0);
  const [countdown, setCountdown] = useState(CAPTURE_SECONDS);
  const [lastPoint, setLastPoint] = useState<DailyPoint | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    timerRef.current = null;
    levelTimerRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const savePointWith = useCallback(
    async (v: VoiceFeatures | null) => {
      const point = withWellbeing({
        id: newId(),
        timestamp: Date.now(),
        moodSelfReport: mood ?? undefined,
        voice: v ?? undefined,
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

  const runCapture = useCallback(async () => {
    setNote(null);
    // Attempt real on-device voice capture only if consented and the optional
    // expo-audio module is present (a dev client build). Either way the check-in
    // moment runs with the animated eyes and a point is saved.
    const wantVoice = consent?.voiceCapture !== false;
    const voiceOn = wantVoice ? await voice.start() : false;

    setPhase("capturing");
    setEyePhase("listening");
    let t = 0;
    levelTimerRef.current = setInterval(() => {
      t += 1;
      setLevel(
        voiceOn
          ? voice.levelRef.current
          : 0.3 + Math.abs(Math.sin(t / 3)) * 0.3, // gentle synthetic pulse
      );
    }, 100);

    let secs = CAPTURE_SECONDS;
    setCountdown(secs);
    timerRef.current = setInterval(async () => {
      secs -= 1;
      if (mountedRef.current) setCountdown(secs);
      if (secs <= 0) {
        cleanup();
        if (mountedRef.current) setEyePhase("thinking");
        const v = voiceOn ? await voice.stop() : null;
        if (mountedRef.current) setLevel(0);
        if (!voiceOn) {
          setNote(
            wantVoice
              ? "On-device voice analysis runs in the native dev build. Saved your mood and check-in."
              : "Voice is off in your settings. Saved your mood and check-in.",
          );
        }
        await savePointWith(v);
      }
    }, 1000);
  }, [consent, voice, savePointWith, cleanup]);

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
      <View style={s.screen}>
        <TouchableOpacity style={s.pill} onPress={() => setPhase("saved")}>
          <Text style={s.pillText}>← Back</Text>
        </TouchableOpacity>
        <TriageFlow onComplete={onTriageComplete} />
        <Text style={s.disclaimer}>
          General signposting, not a diagnosis. In an emergency call 999.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[s.screen, s.center]}>
      <DotMatrixEyes
        phase={eyePhase}
        level={level}
        size={phase === "capturing" ? 300 : 220}
        matrix={phase === "capturing"}
      />

      {phase === "intro" && (
        <>
          <Text style={s.h1}>How do you feel today?</Text>
          <Text style={[s.lead, { textAlign: "center" }]}>
            Tap how you feel. Add a short voice take, read on your device.
          </Text>
          <View style={[s.moodRow, { alignSelf: "stretch" }]}>
            {MOODS.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[s.mood, mood === i + 1 ? s.moodSelected : null]}
                onPress={() => setMood(i + 1)}
              >
                <Text style={s.moodEmoji}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[s.btn, s.btnPrimary, { alignSelf: "stretch" }, mood === null ? s.btnDisabled : null]}
            disabled={mood === null}
            onPress={runCapture}
          >
            <Text style={s.btnPrimaryText}>Start check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, { alignSelf: "stretch" }, mood === null ? s.btnDisabled : null]}
            disabled={mood === null}
            onPress={() => savePointWith(null)}
          >
            <Text style={s.btnText}>Save mood only</Text>
          </TouchableOpacity>
        </>
      )}

      {phase === "capturing" && (
        <>
          <View style={s.pill}>
            <Text style={s.pillText}>Listening · {countdown}s</Text>
          </View>
          <Text style={[s.lead, { textAlign: "center" }]}>
            Tell me how your day has been. Just keep talking.
          </Text>
        </>
      )}

      {phase === "saved" && lastPoint && (
        <>
          <Text style={s.h1}>Check-in saved</Text>
          {note && <Text style={[s.lead, { textAlign: "center" }]}>{note}</Text>}
          <View style={[s.card, { alignSelf: "stretch" }]}>
            <View style={s.metricHead}>
              <Text style={s.cardBody}>Today&apos;s wellbeing signal</Text>
              <Text style={{ color: palette.ink, fontWeight: "700" }}>
                {lastPoint.wellbeingIndex} / 100
              </Text>
            </View>
            <View style={[s.barTrack, { marginTop: 8 }]}>
              <View
                style={[s.barFill, { width: `${lastPoint.wellbeingIndex ?? 0}%` }]}
              />
            </View>
            {lastPoint.voice ? (
              <Text style={s.cardBody}>
                Voice: clarity {lastPoint.voice.hnr}, pauses{" "}
                {Math.round((lastPoint.voice.pauseRatio ?? 0) * 100)}%
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[s.btn, s.btnPrimary, { alignSelf: "stretch" }]}
            onPress={() => setPhase("triage")}
          >
            <Text style={s.btnPrimaryText}>Anything bothering you today?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, { alignSelf: "stretch" }]}
            onPress={() => {
              setMood(null);
              setLastPoint(null);
              setNote(null);
              setEyePhase("idle");
              setPhase("intro");
            }}
          >
            <Text style={s.btnText}>Done for now</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
