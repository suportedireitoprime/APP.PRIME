import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-lousa-magica")({
  ssr: false,
  head: () => ({ meta: [{ title: "Lousa Mágica Admin — Direito Prime" }] }),
  component: () => null,
});
