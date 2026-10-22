import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/legislacao-estadual/$uf")({
  ssr: false,
  head: () => ({ meta: [{ title: "Legislacao Estadual — Direito Prime" }] }),
  component: () => null,
});
