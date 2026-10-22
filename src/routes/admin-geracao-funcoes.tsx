import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-geracao-funcoes")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Geracao Funcoes — Direito Prime" }] }),
  component: () => null,
});
