import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/vade-mecum/sumulas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Vade Mecum — Direito Prime" }] }),
  component: () => null,
});
