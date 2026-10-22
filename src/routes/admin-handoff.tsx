import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-handoff")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Handoff — Direito Prime" }] }),
  component: () => null,
});
