import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/leis-cantadas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Leis Cantadas — Direito Prime" }] }),
  component: () => null,
});
