import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/simulados/resolver/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Simulados — Direito Prime" }] }),
  component: () => null,
});
