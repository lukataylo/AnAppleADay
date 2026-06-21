"use client";

import { useState } from "react";
import { AppStateProvider, useApp } from "@/lib/state";
import { CheckInScreen } from "@/components/CheckInScreen";
import { TrendsScreen } from "@/components/TrendsScreen";
import { PlanScreen } from "@/components/PlanScreen";
import { ShareScreen } from "@/components/ShareScreen";
import { AboutScreen } from "@/components/AboutScreen";
import { ConsentGate } from "@/components/ConsentGate";
import { Icon } from "@/components/Icon";
import { isCheckInDue } from "@apple/core";

type Tab = "today" | "trends" | "plan" | "share" | "about";

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "today", label: "Today", icon: "favorite" },
  { id: "trends", label: "Trends", icon: "show_chart" },
  { id: "plan", label: "Plan", icon: "event" },
  { id: "share", label: "Share", icon: "ios_share" },
  { id: "about", label: "About", icon: "shield" },
];

function Shell() {
  const { ready, consent, monitoring } = useApp();
  const [tab, setTab] = useState<Tab>("today");

  if (!ready) {
    return (
      <div className="shell">
        <div className="center-stage" style={{ flex: 1 }}>
          <div className="brand" style={{ fontSize: 22 }}>
            <span className="dot" /> An Apple a Day
          </div>
        </div>
      </div>
    );
  }

  if (!consent) return <ConsentGate />;

  const due = monitoring ? isCheckInDue(monitoring, Date.now()) : false;

  return (
    <>
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <span className="dot" /> An Apple a Day
          </div>
          {due && (
            <span className="pill" data-testid="due-pill">
              Check-in due
            </span>
          )}
        </div>

        {tab === "today" && <CheckInScreen />}
        {tab === "trends" && <TrendsScreen />}
        {tab === "plan" && <PlanScreen />}
        {tab === "share" && <ShareScreen />}
        {tab === "about" && <AboutScreen />}
      </div>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}

export default function Page() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
