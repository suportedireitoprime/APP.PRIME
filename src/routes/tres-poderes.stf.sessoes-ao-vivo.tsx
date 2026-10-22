import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/tres-poderes/stf/sessoes-ao-vivo")({
  ssr: false,
  head: () => ({ meta: [{ title: "Tres Poderes — Direito Prime" }] }),
  component: () => null,
});
