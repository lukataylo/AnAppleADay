"use client";

import { useState } from "react";
import { useApp } from "@/lib/state";

export function ConsentGate() {
  const { saveConsent } = useApp();
  const [voice, setVoice] = useState(true);
  const [faceCap, setFaceCap] = useState(true);
  const [fed, setFed] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const Row = ({
    on,
    set,
    title,
    sub,
    testid,
  }: {
    on: boolean;
    set: (v: boolean) => void;
    title: string;
    sub: string;
    testid: string;
  }) => (
    <button
      className="card"
      data-testid={testid}
      onClick={() => set(!on)}
      role="checkbox"
      aria-checked={on}
      aria-label={title}
      style={{ textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start" }}
    >
      <span
        aria-hidden
        style={{
          marginTop: 2,
          width: 22,
          height: 22,
          borderRadius: 7,
          flexShrink: 0,
          border: "1px solid var(--card-border)",
          background: on ? "var(--accent)" : "transparent",
          color: "#2a0a10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
        }}
      >
        {on ? "✓" : ""}
      </span>
      <span>
        <strong>{title}</strong>
        <span className="muted" style={{ display: "block", fontSize: 13, marginTop: 2 }}>
          {sub}
        </span>
      </span>
    </button>
  );

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <span className="dot" />
          An Apple a Day
        </div>
      </div>
      <div className="screen">
        <h1 className="h1">Before we start</h1>
        <p className="lead">
          Everything runs on your device. Voice and face become a few numbers; the
          originals are never stored. Change this any time.
        </p>

        <Row
          testid="consent-voice"
          on={voice}
          set={setVoice}
          title="Read voice signals on-device"
          sub="Steadiness and pauses from the mic. No audio is saved."
        />
        <Row
          testid="consent-face"
          on={faceCap}
          set={setFaceCap}
          title="Read face signals on-device"
          sub="Blink, smile, head pose. No video is saved."
        />
        <Row
          testid="consent-fed"
          on={fed}
          set={setFed}
          title="Help improve the shared model (optional)"
          sub="Anonymous model updates via FLock. Raw data never leaves your phone."
        />
        <Row
          testid="consent-accept"
          on={accepted}
          set={setAccepted}
          title="I understand this is not a medical device"
          sub="Logs wellbeing and points to NHS advice. It does not diagnose."
        />

        <button
          className="btn primary"
          data-testid="consent-continue"
          disabled={!accepted}
          onClick={() =>
            saveConsent({
              voiceCapture: voice,
              faceCapture: faceCap,
              federatedSharing: fed,
              acceptedNotMedicalDevice: accepted,
              timestamp: Date.now(),
            })
          }
        >
          Continue
        </button>
        <p className="disclaimer">
          In an emergency call 999. For urgent advice call NHS 111.
        </p>
      </div>
    </div>
  );
}
