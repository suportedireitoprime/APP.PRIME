import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/audioleis")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Audioleis — Direito Prime" },
    { name: "description", content: "Ouça as leis e os códigos brasileiros artigo por artigo no Direito Prime." },
    { property: "og:title", content: "Audioleis — Direito Prime" },
    { property: "og:description", content: "Leis, códigos e artigos narrados para estudar ouvindo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => null,
});
