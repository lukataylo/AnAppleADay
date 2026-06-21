import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  ConsentRecord,
  DailyPoint,
  MonitoringPlan,
  TriageState,
} from "@apple/core";

// Local-first storage on the device. Only derived numbers are kept, never raw
// audio or video.
const POINTS = "aad_points";
const CONSENT = "aad_consent";
const MONITORING = "aad_monitoring";
const TRIAGE = "aad_triage";

function parse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function allPoints(): Promise<DailyPoint[]> {
  const points = parse<DailyPoint[]>(await AsyncStorage.getItem(POINTS)) ?? [];
  return points.sort((a, b) => a.timestamp - b.timestamp);
}

// Serialize writes so concurrent saves cannot drop each other's points.
let writeChain: Promise<void> = Promise.resolve();

export function savePoint(point: DailyPoint): Promise<void> {
  writeChain = writeChain.then(async () => {
    const points = await allPoints();
    points.push(point);
    await AsyncStorage.setItem(POINTS, JSON.stringify(points));
  });
  return writeChain;
}

export async function clearPoints(): Promise<void> {
  await AsyncStorage.multiRemove([POINTS, TRIAGE]);
}

export async function getConsent(): Promise<ConsentRecord | undefined> {
  return parse<ConsentRecord>(await AsyncStorage.getItem(CONSENT));
}

export async function setConsent(consent: ConsentRecord): Promise<void> {
  await AsyncStorage.setItem(CONSENT, JSON.stringify(consent));
}

export async function getMonitoring(): Promise<MonitoringPlan | undefined> {
  return parse<MonitoringPlan>(await AsyncStorage.getItem(MONITORING));
}

export async function setMonitoring(plan: MonitoringPlan | null): Promise<void> {
  if (plan) await AsyncStorage.setItem(MONITORING, JSON.stringify(plan));
  else await AsyncStorage.removeItem(MONITORING);
}

export async function getLastTriage(): Promise<TriageState | undefined> {
  return parse<TriageState>(await AsyncStorage.getItem(TRIAGE));
}

export async function setLastTriage(state: TriageState): Promise<void> {
  await AsyncStorage.setItem(TRIAGE, JSON.stringify(state));
}

export function newId(): string {
  return `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}
