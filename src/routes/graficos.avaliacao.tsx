import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/graficos/avaliacao")({
  ssr: false,
  head: () => ({ meta: [{ title: "Graficos — Direito Prime" }] }),
  component: () => null,
});
