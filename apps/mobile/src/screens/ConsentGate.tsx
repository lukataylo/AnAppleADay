import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { palette } from "../theme";
import { s } from "../styles";
import { useApp } from "../lib/state";

function Row({
  on,
  set,
  title,
  sub,
}: {
  on: boolean;
  set: (v: boolean) => void;
  title: string;
  sub: string;
}) {
  return (
    <TouchableOpacity
      style={[s.card, { flexDirection: "row", gap: 12 }]}
      onPress={() => set(!on)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          marginTop: 2,
          borderWidth: 1,
          borderColor: palette.cardBorder,
          backgroundColor: on ? palette.accent : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {on && <Text style={{ color: "#2a0a10", fontWeight: "800" }}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.ink, fontWeight: "700" }}>{title}</Text>
        <Text style={[s.cardBody, { marginTop: 2 }]}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function ConsentGate() {
  const { saveConsent } = useApp();
  const [voice, setVoice] = useState(true);
  const [faceCap, setFaceCap] = useState(true);
  const [fed, setFed] = useState(false);
  const [accepted, setAccepted] = useState(false);

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.h1}>Before we start</Text>
      <Text style={s.lead}>
        Everything runs on your device. Voice and face become a few numbers; the
        originals are never stored. Change this any time.
      </Text>
      <Row on={voice} set={setVoice} title="Read voice signals on-device" sub="Steadiness and pauses from the mic. No audio is saved." />
      <Row on={faceCap} set={setFaceCap} title="Read face signals on-device" sub="Blink, smile, head pose. No video is saved." />
      <Row on={fed} set={setFed} title="Help improve the shared model (optional)" sub="Anonymous updates via FLock. Raw data never leaves your phone." />
      <Row on={accepted} set={setAccepted} title="I understand this is not a medical device" sub="Logs wellbeing and points to NHS advice. It does not diagnose." />
      <TouchableOpacity
        style={[s.btn, s.btnPrimary, !accepted ? s.btnDisabled : null]}
        disabled={!accepted}
        onPress={() =>
          saveConsent({
            voiceCapture: voice,
            faceCapture: faceCap,
            federatedSharing: fed,
            acceptedNotMedicalDevice: accepted,
            timestamp: Date.now(),
          })
        }
      >
        <Text style={s.btnPrimaryText}>Continue</Text>
      </TouchableOpacity>
      <Text style={s.disclaimer}>
        In an emergency call 999. For urgent advice call NHS 111.
      </Text>
    </ScrollView>
  );
}
