import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/planos/ativos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Planos — Direito Prime" }] }),
  component: () => null,
});
