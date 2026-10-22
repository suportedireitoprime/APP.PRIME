import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/resumos-juridicos/jurisprudencia")({
  ssr: false,
  head: () => ({ meta: [{ title: "Resumos Juridicos — Direito Prime" }] }),
  component: () => null,
});
