import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  ConsentRecord,
  DailyPoint,
  MonitoringPlan,
  TriageState,
} from "@apple/core";
import {
  allPoints,
  clearPoints,
  getConsent,
  getLastTriage,
  getMonitoring,
  savePoint,
  setConsent as persistConsent,
  setLastTriage as persistTriage,
  setMonitoring as persistMonitoring,
} from "./storage";

interface AppState {
  ready: boolean;
  points: DailyPoint[];
  consent: ConsentRecord | null;
  monitoring: MonitoringPlan | null;
  lastTriage: TriageState | null;
  addPoint: (p: DailyPoint) => Promise<void>;
  saveConsent: (c: ConsentRecord) => Promise<void>;
  setMonitoring: (m: MonitoringPlan | null) => Promise<void>;
  saveTriage: (t: TriageState) => Promise<void>;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [points, setPoints] = useState<DailyPoint[]>([]);
  const [consent, setConsentState] = useState<ConsentRecord | null>(null);
  const [monitoring, setMonitoringState] = useState<MonitoringPlan | null>(null);
  const [lastTriage, setLastTriageState] = useState<TriageState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, c, m, t] = await Promise.all([
          allPoints(),
          getConsent(),
          getMonitoring(),
          getLastTriage(),
        ]);
        if (cancelled) return;
        setPoints(p);
        setConsentState(c ?? null);
        setMonitoringState(m ?? null);
        setLastTriageState(t ?? null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addPoint = useCallback(async (p: DailyPoint) => {
    await savePoint(p);
    setPoints((prev) => [...prev, p].sort((a, b) => a.timestamp - b.timestamp));
  }, []);

  const saveConsent = useCallback(async (c: ConsentRecord) => {
    await persistConsent(c);
    setConsentState(c);
  }, []);

  const setMonitoring = useCallback(async (m: MonitoringPlan | null) => {
    await persistMonitoring(m);
    setMonitoringState(m);
  }, []);

  const saveTriage = useCallback(async (t: TriageState) => {
    await persistTriage(t);
    setLastTriageState(t);
  }, []);

  const resetAll = useCallback(async () => {
    await clearPoints();
    await persistMonitoring(null);
    setPoints([]);
    setMonitoringState(null);
    setLastTriageState(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        ready,
        points,
        consent,
        monitoring,
        lastTriage,
        addPoint,
        saveConsent,
        setMonitoring,
        saveTriage,
        resetAll,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppStateProvider");
  return ctx;
}
