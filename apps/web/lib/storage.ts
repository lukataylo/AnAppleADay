"use client";

import { openDB, type IDBPDatabase } from "idb";
import type {
  ConsentRecord,
  DailyPoint,
  MonitoringPlan,
  TriageState,
} from "@apple/core";

// Local-first storage. Everything lives on the device in IndexedDB. Raw audio
// and video are never written here, only derived features and self-reports.

const DB_NAME = "an-apple-a-day";
const VERSION = 1;
const POINTS = "points";
const META = "meta";

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB unavailable");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(POINTS)) {
          database.createObjectStore(POINTS, { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains(META)) {
          database.createObjectStore(META);
        }
      },
    });
  }
  return dbPromise;
}

export async function savePoint(point: DailyPoint): Promise<void> {
  const d = await db();
  await d.put(POINTS, point);
}

export async function allPoints(): Promise<DailyPoint[]> {
  const d = await db();
  const points = (await d.getAll(POINTS)) as DailyPoint[];
  return points.sort((a, b) => a.timestamp - b.timestamp);
}

export async function clearPoints(): Promise<void> {
  const d = await db();
  await d.clear(POINTS);
}

export async function getConsent(): Promise<ConsentRecord | undefined> {
  const d = await db();
  return (await d.get(META, "consent")) as ConsentRecord | undefined;
}

export async function setConsent(consent: ConsentRecord): Promise<void> {
  const d = await db();
  await d.put(META, consent, "consent");
}

export async function getLastTriage(): Promise<TriageState | undefined> {
  const d = await db();
  return (await d.get(META, "triage")) as TriageState | undefined;
}

export async function setLastTriage(state: TriageState): Promise<void> {
  const d = await db();
  await d.put(META, state, "triage");
}

export async function getMonitoring(): Promise<MonitoringPlan | undefined> {
  const d = await db();
  return (await d.get(META, "monitoring")) as MonitoringPlan | undefined;
}

export async function setMonitoring(
  plan: MonitoringPlan | null,
): Promise<void> {
  const d = await db();
  if (plan) await d.put(META, plan, "monitoring");
  else await d.delete(META, "monitoring");
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}
