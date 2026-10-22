import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/boletins-noticias")({
  ssr: false,
  head: () => ({ meta: [{ title: "Boletins Noticias — Direito Prime" }] }),
  component: () => null,
});
