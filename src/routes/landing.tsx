import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/landing")({
  ssr: false,
  head: () => ({ meta: [{ title: "Landing — Direito Prime" }] }),
  component: () => null,
});
