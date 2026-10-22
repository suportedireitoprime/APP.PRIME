import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/admin-apple-csr")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Apple Csr — Direito Prime" }] }),
  component: () => null,
});
