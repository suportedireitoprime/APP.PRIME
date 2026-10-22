import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/minha-cota")({
  ssr: false,
  head: () => ({ meta: [{ title: "Minha Cota — Direito Prime" }, { name: "description", content: "Veja quanto da sua cota grátis mensal você já usou." }] }),
  component: () => null,
});
