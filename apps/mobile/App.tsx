import React, { useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { isCheckInDue } from "@apple/core";
import { palette } from "./src/theme";
import { Background } from "./src/components/Background";
import { AppStateProvider, useApp } from "./src/lib/state";
import { s } from "./src/styles";
import { CheckInScreen } from "./src/screens/CheckInScreen";
import { TrendsScreen } from "./src/screens/TrendsScreen";
import { PlanScreen } from "./src/screens/PlanScreen";
import { ShareScreen } from "./src/screens/ShareScreen";
import { AboutScreen } from "./src/screens/AboutScreen";
import { ConsentGate } from "./src/screens/ConsentGate";

type Tab = "today" | "trends" | "plan" | "share" | "about";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];
const TABS: Array<{ id: Tab; label: string; icon: MaterialIconName }> = [
  { id: "today", label: "Today", icon: "favorite" },
  { id: "trends", label: "Trends", icon: "show-chart" },
  { id: "plan", label: "Plan", icon: "event" },
  { id: "share", label: "Share", icon: "ios-share" },
  { id: "about", label: "About", icon: "shield" },
];

function Shell() {
  const { ready, consent, monitoring } = useApp();
  const [tab, setTab] = useState<Tab>("today");

  if (!ready) {
    return (
      <View style={s.center}>
        <View style={s.brand}>
          <View style={s.brandDot} />
          <Text style={s.brandText}>An Apple a Day</Text>
        </View>
      </View>
    );
  }

  if (!consent) return <ConsentGate />;

  const due = monitoring ? isCheckInDue(monitoring, Date.now()) : false;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.topbar}>
        <View style={s.brand}>
          <View style={s.brandDot} />
          <Text style={s.brandText}>An Apple a Day</Text>
        </View>
        {due && (
          <View style={s.pill}>
            <Text style={s.pillText}>Check-in due</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {tab === "today" && <CheckInScreen />}
        {tab === "trends" && <TrendsScreen />}
        {tab === "plan" && <PlanScreen />}
        {tab === "share" && <ShareScreen />}
        {tab === "about" && <AboutScreen />}
      </View>

      <View style={s.tabbar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.id} style={s.tab} onPress={() => setTab(t.id)}>
            <MaterialIcons
              name={t.icon}
              size={22}
              color={tab === t.id ? palette.accent : palette.inkFaint}
            />
            <Text style={[s.tabLabel, tab === t.id ? s.tabLabelActive : null]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <Background>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <AppStateProvider>
          <Shell />
        </AppStateProvider>
      </SafeAreaView>
    </Background>
  );
}
