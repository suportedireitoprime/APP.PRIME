import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/legislacao/$tipo/$leiSlug/$artigoNumero")({
  ssr: false,
  head: () => ({ meta: [{ title: "Legislacao — Direito Prime" }] }),
  component: () => null,
});
