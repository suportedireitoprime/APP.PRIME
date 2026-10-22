import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-flashcards-editar")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Flashcards Editar — Direito Prime" }] }),
  component: () => null,
});
