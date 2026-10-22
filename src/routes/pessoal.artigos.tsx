import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/pessoal/artigos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Pessoal — Direito Prime" }] }),
  component: () => null,
});
