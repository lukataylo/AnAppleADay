"use client";

import type { ConsentRecord } from "@apple/core";
import { useApp } from "@/lib/state";

export function AboutScreen() {
  const { consent, points, resetAll, saveConsent } = useApp();

  const toggle = (key: keyof ConsentRecord) => {
    if (!consent) return;
    saveConsent({ ...consent, [key]: !consent[key], timestamp: Date.now() });
  };

  const Toggle = ({
    on,
    label,
    testid,
  }: {
    on: boolean;
    label: string;
    testid: string;
  }) => (
    <button
      className="pill"
      data-testid={testid}
      role="switch"
      aria-checked={on}
      onClick={() => toggle(testid === "edit-voice" ? "voiceCapture" : testid === "edit-face" ? "faceCapture" : "federatedSharing")}
      style={
        on
          ? { background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--ink)" }
          : undefined
      }
    >
      {label}: {on ? "on" : "off"}
    </button>
  );

  return (
    <div className="screen">
      <h1 className="h1">About & privacy</h1>

      <div className="card">
        <h2>Not a medical device</h2>
        <p>
          Logs wellbeing and points to NHS advice. It does not diagnose. Red flags
          route to 999, urgent cases to 111.
        </p>
      </div>

      <div className="card">
        <h2>Local-first by design</h2>
        <p>
          Voice and face become numbers on your device. Raw audio and video are
          never stored. Your {points.length} check-in
          {points.length === 1 ? "" : "s"} live only in this browser.
        </p>
      </div>

      <div className="card">
        <h2>Your choices</h2>
        <p>Change what the app reads. These take effect on your next check-in.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <Toggle on={consent?.voiceCapture ?? false} label="Voice" testid="edit-voice" />
          <Toggle on={consent?.faceCapture ?? false} label="Face" testid="edit-face" />
          <Toggle
            on={consent?.federatedSharing ?? false}
            label="Federated"
            testid="edit-fed"
          />
        </div>
      </div>

      <div className="card">
        <h2>Your data</h2>
        <p>Clear everything stored on this device. This cannot be undone.</p>
        <button
          className="btn danger"
          data-testid="reset-all"
          onClick={() => resetAll()}
        >
          Delete all check-ins
        </button>
      </div>

      <p className="disclaimer">
        Built with codeplain. Federated learning via FLock.io. Clinical content
        uses public-domain instruments (PHQ-9, GAD-7, WHO-5, mMRC) and NHS.uk
        safety wording. Not affiliated with the NHS.
      </p>
    </div>
  );
}
