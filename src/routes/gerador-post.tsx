import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/gerador-post")({
  ssr: false,
  head: () => ({ meta: [{ title: "Gerador Post — Direito Prime" }] }),
  component: () => null,
});
