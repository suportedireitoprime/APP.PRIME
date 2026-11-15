import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-laboratorio-aulas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Laboratório de Aulas Admin — Direito Prime" }] }),
  component: () => null,
});
