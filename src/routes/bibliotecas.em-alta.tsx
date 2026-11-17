import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/bibliotecas/em-alta")({
  ssr: false,
  head: () => ({ meta: [{ title: "Em Alta — Biblioteca Jurídica" }] }),
  component: () => null,
});
