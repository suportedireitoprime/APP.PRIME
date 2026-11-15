import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/aulas-modulo/$moduloId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Módulo de Aulas — Direito Prime" }] }),
  component: () => null,
});
