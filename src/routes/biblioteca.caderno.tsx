import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/biblioteca/caderno")({
  ssr: false,
  head: () => ({ meta: [{ title: "Biblioteca — Direito Prime" }] }),
  component: () => null,
});
