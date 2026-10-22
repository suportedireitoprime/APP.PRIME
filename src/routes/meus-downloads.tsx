import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/meus-downloads")({
  ssr: false,
  head: () => ({ meta: [{ title: "Meus Downloads — Direito Prime" }] }),
  component: () => null,
});
