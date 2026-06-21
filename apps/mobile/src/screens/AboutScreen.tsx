import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { ConsentRecord } from "@apple/core";
import { palette } from "../theme";
import { s } from "../styles";
import { useApp } from "../lib/state";

export function AboutScreen() {
  const { consent, points, resetAll, saveConsent } = useApp();

  const toggle = (key: keyof ConsentRecord) => {
    if (!consent) return;
    saveConsent({ ...consent, [key]: !consent[key], timestamp: Date.now() });
  };

  const Toggle = ({ on, label, k }: { on: boolean; label: string; k: keyof ConsentRecord }) => (
    <TouchableOpacity
      style={[s.pill, on ? { backgroundColor: palette.accentSoft, borderColor: palette.accent } : null]}
      onPress={() => toggle(k)}
    >
      <Text style={[s.pillText, on ? { color: palette.ink } : null]}>
        {label}: {on ? "on" : "off"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.h1}>About & privacy</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Not a medical device</Text>
        <Text style={s.cardBody}>
          An Apple a Day logs wellbeing and points you to NHS advice. It does not
          diagnose or replace a doctor. Red-flag answers send you to 999 and
          urgent ones to NHS 111.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Local-first by design</Text>
        <Text style={s.cardBody}>
          Voice and face become a small set of numbers on your device. The raw
          audio and video are never stored or uploaded. Your {points.length}{" "}
          check-in{points.length === 1 ? "" : "s"} live only on this phone.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Your choices</Text>
        <Text style={s.cardBody}>Change what the app reads. Takes effect next check-in.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
          <Toggle on={consent?.voiceCapture ?? false} label="Voice" k="voiceCapture" />
          <Toggle on={consent?.faceCapture ?? false} label="Face" k="faceCapture" />
          <Toggle on={consent?.federatedSharing ?? false} label="Federated" k="federatedSharing" />
        </View>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Your data</Text>
        <Text style={s.cardBody}>Clear everything stored on this device.</Text>
        <TouchableOpacity
          style={[s.btn, s.btnDanger]}
          onPress={() =>
            Alert.alert("Delete all check-ins?", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => resetAll() },
            ])
          }
        >
          <Text style={[s.btnText, { color: "#2a0a0a" }]}>Delete all check-ins</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.disclaimer}>
        Built with codeplain. Federated learning via FLock.io. Clinical content
        uses public-domain instruments (PHQ-9, GAD-7, WHO-5, mMRC) and NHS.uk
        safety wording. Not affiliated with the NHS.
      </Text>
    </ScrollView>
  );
}
