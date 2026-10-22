import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-monitor-usuarios")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Monitor Usuarios — Direito Prime" }] }),
  component: () => null,
});
