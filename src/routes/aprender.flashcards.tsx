import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/aprender/flashcards")({
  ssr: false,
  head: () => ({ meta: [{ title: "Aprender — Direito Prime" }] }),
  component: () => null,
});
