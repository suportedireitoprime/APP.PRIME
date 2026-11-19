import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/videoaulas/$catalogo/$area/$videoId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Videoaula — Direito Prime" }] }),
  component: () => null,
});
