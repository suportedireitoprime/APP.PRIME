import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/questoes/trilhas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Questoes — Direito Prime" }] }),
  component: () => null,
});
