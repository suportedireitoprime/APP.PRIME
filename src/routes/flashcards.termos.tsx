import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/flashcards/termos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Flashcards — Direito Prime" }] }),
  component: () => null,
});
