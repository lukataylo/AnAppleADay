"use client";

import { useCallback, useMemo, useRef } from "react";

// Browser text-to-speech (SpeechSynthesis) and speech-to-text (SpeechRecognition).
// Used to make the check-in a spoken turn: the app asks the question aloud, then
// listens and transcribes the reply. Both degrade gracefully when unsupported.

type SRType = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal: boolean }
  >;
}

function getSR(): (new () => SRType) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => SRType;
    webkitSpeechRecognition?: new () => SRType;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

export function useSpeech() {
  const recRef = useRef<SRType | null>(null);
  const ttsSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const sttSupported = !!getSR();

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!ttsSupported || window.speechSynthesis.getVoices().length === 0) {
          // No speech engine available (or no voices, e.g. headless). Skip
          // straight to listening rather than blocking on a silent utterance.
          resolve();
          return;
        }
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "en-GB";
          u.rate = 1;
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };
          u.onend = finish;
          u.onerror = finish;
          window.speechSynthesis.speak(u);
          // Fallback in case onend never fires.
          setTimeout(finish, 2000 + text.length * 70);
        } catch {
          resolve();
        }
      }),
    [ttsSupported],
  );

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, [ttsSupported]);

  /** Start live transcription. Returns a stop function. */
  const startRecognition = useCallback(
    (onUpdate: (text: string) => void): (() => void) => {
      const SR = getSR();
      if (!SR) return () => {};
      const rec = new SR();
      rec.lang = "en-GB";
      rec.interimResults = true;
      rec.continuous = true;
      let finalText = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const t = r[0]?.transcript ?? "";
          if (r.isFinal) finalText += t + " ";
          else interim += t;
        }
        onUpdate((finalText + interim).trim());
      };
      rec.onerror = () => {};
      try {
        rec.start();
      } catch {
        // already started or not allowed
      }
      recRef.current = rec;
      return () => {
        try {
          rec.stop();
        } catch {
          // ignore
        }
        recRef.current = null;
      };
    },
    [],
  );

  // Stable object so consumers can use this in effect dependencies safely.
  return useMemo(
    () => ({ speak, stopSpeaking, startRecognition, ttsSupported, sttSupported }),
    [speak, stopSpeaking, startRecognition, ttsSupported, sttSupported],
  );
}
