import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "An Apple a Day",
  description:
    "A local-first health check-in. One easy question a day, on-device voice and face signals, NHS-style follow-up. Not a medical device.",
  applicationName: "An Apple a Day",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "An Apple a Day",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1a0509",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>
        <div className="app-bg" aria-hidden />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
