import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-conteudo-fila")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Conteudo Fila — Direito Prime" }] }),
  component: () => null,
});
