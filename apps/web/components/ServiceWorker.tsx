"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Registration failures are non-fatal; the app works without offline cache.
        });
    }
  }, []);
  return null;
}
