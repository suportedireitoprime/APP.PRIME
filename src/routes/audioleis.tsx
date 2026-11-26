import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/audioleis")({
  ssr: false,
  head: () => ({ meta: [{ title: "Ouça a Lei — Direito Prime" }] }),
  component: () => null,
});
