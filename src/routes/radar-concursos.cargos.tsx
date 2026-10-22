import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/radar-concursos/cargos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Radar Concursos — Direito Prime" }] }),
  component: () => null,
});
