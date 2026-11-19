import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file registers the URL and metadata.
export const Route = createFileRoute("/pilulas/materia/$slug")({
  ssr: false,
  head: () => ({ meta: [{ title: "Pílulas da Matéria — Direito Prime" }] }),
  component: () => null,
});
