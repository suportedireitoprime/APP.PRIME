import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-cotas-analise")({
  ssr: false,
  head: () => ({ meta: [{ title: "Cotas Análise — Direito Prime" }] }),
  component: () => null,
});
