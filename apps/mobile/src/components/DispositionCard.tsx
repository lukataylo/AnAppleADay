import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import type { Disposition } from "@apple/core";
import { palette, radius } from "../theme";
import { s } from "../styles";

export function DispositionCard({ d }: { d: Disposition }) {
  const bg =
    d.level === "emergency-999"
      ? palette.dangerFill
      : d.level === "urgent-111"
        ? "rgba(255,170,90,0.14)"
        : palette.cardFill;
  const border =
    d.level === "emergency-999"
      ? palette.danger
      : d.level === "urgent-111"
        ? "rgba(255,170,90,0.5)"
        : palette.cardBorder;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        borderRadius: radius,
        padding: 20,
        gap: 10,
      }}
    >
      {d.urgent && (
        <View style={s.pill}>
          <Text style={s.pillText}>
            {d.level === "emergency-999" ? "Emergency" : "Urgent"}
          </Text>
        </View>
      )}
      <Text style={[s.cardTitle, { fontSize: 20 }]}>{d.title}</Text>
      <Text style={{ color: palette.ink, fontSize: 15, lineHeight: 22 }}>
        {d.detail}
      </Text>
      {d.reason ? <Text style={s.cardBody}>{d.reason}</Text> : null}
      <View style={{ gap: 10, marginTop: 6 }}>
        {d.actions.map((a, i) =>
          a.kind === "info" ? (
            <View key={i} style={s.pill}>
              <Text style={s.pillText}>{a.label}</Text>
            </View>
          ) : (
            <TouchableOpacity
              key={i}
              style={[s.btn, i === 0 ? s.btnPrimary : null]}
              onPress={() =>
                Linking.openURL(
                  a.kind === "call" ? `tel:${a.value}` : (a.value ?? "#"),
                ).catch(() => {})
              }
            >
              <Text style={i === 0 ? s.btnPrimaryText : s.btnText}>{a.label}</Text>
            </TouchableOpacity>
          ),
        )}
      </View>
    </View>
  );
}
