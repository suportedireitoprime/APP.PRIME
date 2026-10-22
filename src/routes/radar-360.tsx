import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/radar-360")({
  ssr: false,
  head: () => ({ meta: [{ title: "Radar 360 — Direito Prime" }] }),
  component: () => null,
});
