import { createFileRoute } from "@tanstack/react-router";


// Every other URL is handled by the imported Direito Prime app's own route table.
export const Route = createFileRoute("/$")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Direito Prime" },
      { name: "description", content: "Plataforma de estudos jurídicos Direito Prime." },
      { property: "og:title", content: "Direito Prime" },
      { property: "og:description", content: "Plataforma de estudos jurídicos Direito Prime." },
    ],
  }),
  component: () => null,
});
