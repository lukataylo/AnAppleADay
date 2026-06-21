import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  metricBlinkRate,
  metricHnr,
  metricMood,
  metricWellbeing,
  trend,
  type DailyPoint,
  type MetricExtractor,
  type TrendDirection,
} from "@apple/core";
import { palette } from "../theme";
import { s } from "../styles";
import { useApp } from "../lib/state";
import { contributeRound, type RoundResult } from "../lib/flock";

function color(d: TrendDirection) {
  return d === "improving" ? "#7be3a3" : d === "worsening" ? palette.danger : palette.inkDim;
}
function label(d: TrendDirection) {
  return d === "improving" ? "↗ improving" : d === "worsening" ? "↘ needs a look" : "→ steady";
}

const METRICS: Array<{ name: string; extract: MetricExtractor; fmt: (n: number) => string }> = [
  { name: "Wellbeing signal", extract: metricWellbeing, fmt: (n) => `${Math.round(n)}/100` },
  { name: "Self-reported mood", extract: metricMood, fmt: (n) => `${n.toFixed(1)}/5` },
  { name: "Voice clarity", extract: metricHnr, fmt: (n) => `${n.toFixed(1)}` },
  { name: "Blink rate", extract: metricBlinkRate, fmt: (n) => `${Math.round(n)}/min` },
];

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 40, marginTop: 6 }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: palette.accentSoft,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            height: `${Math.max(6, ((v - min) / range) * 100)}%`,
          }}
        />
      ))}
    </View>
  );
}

function valuesOf(points: DailyPoint[], extract: MetricExtractor): number[] {
  return points.map((p) => extract(p)).filter((v): v is number => typeof v === "number");
}

export function TrendsScreen() {
  const { points, consent } = useApp();
  const [round, setRound] = useState<RoundResult | null>(null);
  const [busy, setBusy] = useState(false);
  const fedAllowed = consent?.federatedSharing === true;

  if (points.length === 0) {
    return (
      <View style={s.screen}>
        <Text style={s.h1}>Your trends</Text>
        <View style={s.card}>
          <Text style={s.cardBody}>
            No check-ins yet. Once you have a few, this shows how each signal is
            moving against your own baseline.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.h1}>Your trends</Text>
      <Text style={s.lead}>
        Compared with your own baseline from {points.length} check-in
        {points.length === 1 ? "" : "s"}. Signals over time, not scores or
        diagnoses.
      </Text>
      {METRICS.map((m) => {
        const vals = valuesOf(points, m.extract);
        if (vals.length === 0) return null;
        const t = trend(points, m.extract, { higherIsBetter: true });
        return (
          <View key={m.name} style={s.card}>
            <View style={s.metricHead}>
              <Text style={s.cardTitle}>{m.name}</Text>
              <Text style={{ color: color(t.direction), fontWeight: "600" }}>
                {label(t.direction)}
              </Text>
            </View>
            <View style={s.metricHead}>
              <Text style={s.cardBody}>
                latest {t.latest !== undefined ? m.fmt(t.latest) : "—"}
              </Text>
              <Text style={s.cardBody}>baseline {m.fmt(t.baseline.mean)}</Text>
            </View>
            <Spark values={vals.slice(-14)} />
          </View>
        );
      })}
      <View style={s.card}>
        <Text style={s.cardTitle}>Federated learning (FLock.io)</Text>
        <Text style={s.cardBody}>
          The model improves from everyone&apos;s check-ins without anyone sharing
          data. Your device contributes only a small update; raw data never
          leaves this phone.
        </Text>
        <TouchableOpacity
          style={[s.btn, busy || !fedAllowed ? s.btnDisabled : null]}
          disabled={busy || !fedAllowed}
          onPress={async () => {
            setBusy(true);
            setRound(await contributeRound(points));
            setBusy(false);
          }}
        >
          <Text style={s.btnText}>
            {busy ? "Contributing…" : "Contribute to a federated round"}
          </Text>
        </TouchableOpacity>
        {!fedAllowed && (
          <Text style={s.cardBody}>
            Federated sharing is off. Turn it on under About.
          </Text>
        )}
        {round && (
          <Text style={s.cardBody}>
            Round {round.round} · {round.mode} · {round.note}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
