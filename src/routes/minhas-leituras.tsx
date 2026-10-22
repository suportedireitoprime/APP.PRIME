import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/minhas-leituras")({
  ssr: false,
  head: () => ({ meta: [{ title: "Minhas Leituras — Direito Prime" }] }),
  component: () => null,
});
