import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/desktop-link/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "Desktop Link — Direito Prime" }] }),
  component: () => null,
});
