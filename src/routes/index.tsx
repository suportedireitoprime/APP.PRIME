import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Direito Prime — Estudos Jurídicos" },
      { name: "description", content: "Vade Mecum, questões, aulas e ferramentas para estudar Direito." },
      { property: "og:title", content: "Direito Prime — Estudos Jurídicos" },
      { property: "og:description", content: "Vade Mecum, questões, aulas e ferramentas para estudar Direito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
