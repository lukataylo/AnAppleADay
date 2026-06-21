import React, { useState } from "react";
import { ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { buildHandoff, type HandoffSummary } from "@apple/core";
import { palette } from "../theme";
import { s } from "../styles";
import { useApp } from "../lib/state";

export function ShareScreen() {
  const { points, lastTriage } = useApp();
  const [summary, setSummary] = useState<HandoffSummary | null>(null);

  const generate = () => setSummary(buildHandoff(points, lastTriage, Date.now()));

  const share = async () => {
    if (!summary) return;
    const text = [
      "An Apple a Day — GP handoff",
      summary.narrativeDraft,
      `Check-ins: ${summary.checkInCount} over ${summary.windowDays} day(s)`,
      `Concerns: ${summary.presentingTopics.join(", ") || "none recorded"}`,
      summary.redFlagsRaised.length
        ? `Warning signs: ${summary.redFlagsRaised.join("; ")}`
        : "",
      `Trends: ${summary.trends.map((t) => `${t.metric} ${t.direction}`).join(", ")}`,
      summary.disclaimer,
    ]
      .filter(Boolean)
      .join("\n");
    await Share.share({ message: text });
  };

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.h1}>Hand to your GP</Text>
      <Text style={s.lead}>
        A short summary built from your own check-ins, so an appointment starts
        with the history already gathered. You decide whether to share it.
      </Text>
      {!summary ? (
        <TouchableOpacity
          style={[s.btn, s.btnPrimary, points.length === 0 ? s.btnDisabled : null]}
          disabled={points.length === 0}
          onPress={generate}
        >
          <Text style={s.btnPrimaryText}>
            {points.length === 0 ? "Do a check-in first" : "Prepare GP summary"}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={s.card}>
            <Text style={{ color: palette.ink, fontSize: 15, lineHeight: 22 }}>
              {summary.narrativeDraft}
            </Text>
            <Text style={s.cardBody}>
              {summary.checkInCount} check-ins · {summary.windowDays} day window
            </Text>
            {summary.redFlagsRaised.length > 0 && (
              <Text style={{ color: palette.danger, fontSize: 13 }}>
                Warning signs: {summary.redFlagsRaised.join("; ")}
              </Text>
            )}
            {summary.trends.map((t) => (
              <Text key={t.metric} style={s.cardBody}>
                {t.metric}: {t.direction}
              </Text>
            ))}
          </View>
          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={share}>
            <Text style={s.btnPrimaryText}>Share summary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btn} onPress={() => setSummary(null)}>
            <Text style={s.btnText}>Rebuild</Text>
          </TouchableOpacity>
          <Text style={s.disclaimer}>{summary.disclaimer}</Text>
        </>
      )}
    </ScrollView>
  );
}
