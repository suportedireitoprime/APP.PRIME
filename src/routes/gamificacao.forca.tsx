import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/gamificacao/forca")({
  ssr: false,
  head: () => ({ meta: [{ title: "Gamificacao — Direito Prime" }] }),
  component: () => null,
});
