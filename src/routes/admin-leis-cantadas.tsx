import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-leis-cantadas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Leis Cantadas — Direito Prime" }] }),
  component: () => null,
});
