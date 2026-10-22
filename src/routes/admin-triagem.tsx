import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-triagem")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Triagem — Direito Prime" }] }),
  component: () => null,
});
