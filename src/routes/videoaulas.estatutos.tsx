import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/videoaulas/estatutos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Videoaulas — Direito Prime" }] }),
  component: () => null,
});
