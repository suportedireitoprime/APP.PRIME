import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/compressao-imagens")({
  ssr: false,
  head: () => ({ meta: [{ title: "Compressao Imagens — Direito Prime" }] }),
  component: () => null,
});
