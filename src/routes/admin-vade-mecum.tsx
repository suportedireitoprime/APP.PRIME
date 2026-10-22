import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-vade-mecum")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Vade Mecum — Direito Prime" }] }),
  component: () => null,
});
