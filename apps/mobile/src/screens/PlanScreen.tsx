import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createMonitoringPlan, isCheckInDue, stopMonitoring } from "@apple/core";
import { s } from "../styles";
import { palette } from "../theme";
import { useApp } from "../lib/state";

function formatDue(ts: number): string {
  const days = Math.round((ts - Date.now()) / 86400000);
  if (days <= 0) return "due now";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

export function PlanScreen() {
  const { monitoring, setMonitoring } = useApp();
  return (
    <View style={s.screen}>
      <Text style={s.h1}>Follow-up plan</Text>
      <Text style={s.lead}>
        Most people do not remember how they felt last week. When something is
        worth watching, the app checks in every other day.
      </Text>
      {monitoring?.active ? (
        <View style={s.card}>
          <View style={s.pill}>
            <Text style={s.pillText}>Active · every {monitoring.intervalDays} days</Text>
          </View>
          <Text style={{ color: palette.ink, fontSize: 15 }}>{monitoring.reason}</Text>
          <Text style={s.cardBody}>
            Next check-in {formatDue(monitoring.nextDueAt)}
            {isCheckInDue(monitoring, Date.now()) ? " · ready now" : ""}
          </Text>
          <TouchableOpacity style={s.btn} onPress={() => setMonitoring(stopMonitoring(monitoring))}>
            <Text style={s.btnText}>Turn off follow-up</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.cardBody}>
            No follow-up active. It switches on automatically when a check-in
            suggests something worth watching, and you can start one yourself.
          </Text>
          <TouchableOpacity
            style={s.btn}
            onPress={() =>
              setMonitoring(
                createMonitoringPlan(
                  "You chose to keep a closer eye on how things are going.",
                  2,
                  Date.now(),
                ),
              )
            }
          >
            <Text style={s.btnText}>Start every-other-day check-ins</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
