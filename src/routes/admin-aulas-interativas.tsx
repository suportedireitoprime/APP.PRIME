import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-aulas-interativas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Aulas Interativas Admin — Direito Prime" }] }),
  component: () => null,
});

