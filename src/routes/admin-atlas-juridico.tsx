import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-atlas-juridico")({
  ssr: false,
  head: () => ({ meta: [{ title: "Atlas Jurídico — Direito Prime" }] }),
  component: () => null,
});
