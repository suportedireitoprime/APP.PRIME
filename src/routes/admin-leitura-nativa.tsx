import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-leitura-nativa")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Leitura Nativa — Direito Prime" }] }),
  component: () => null,
});
