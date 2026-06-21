import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "An Apple a Day",
    short_name: "Apple a Day",
    description:
      "A local-first health check-in with on-device voice and face signals.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a0509",
    theme_color: "#1a0509",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
