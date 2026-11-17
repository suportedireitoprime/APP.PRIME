import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/atlas-juridico")({
  ssr: false,
  head: () => ({ meta: [{ title: "Atlas Jurídico — Direito Prime" }] }),
  component: () => null,
});
