import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/tematica-juridica")({
  ssr: false,
  head: () => ({ meta: [{ title: "Tematica Juridica — Direito Prime" }] }),
  component: () => null,
});
