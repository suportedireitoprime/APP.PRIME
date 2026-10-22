import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/tres-poderes/senado/agenda")({
  ssr: false,
  head: () => ({ meta: [{ title: "Tres Poderes — Direito Prime" }] }),
  component: () => null,
});
