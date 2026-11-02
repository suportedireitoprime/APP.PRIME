import { createFileRoute } from "@tanstack/react-router";

// Rendered by the Direito Prime app mounted in __root; this file only registers the URL.
export const Route = createFileRoute("/audiobooks")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Audiobooks — Direito Prime" },
    { name: "description", content: "Ouça grandes clássicos do Direito em áudio com legendas sincronizadas e ilustrações no Direito Prime." },
    { property: "og:title", content: "Audiobooks — Direito Prime" },
    { property: "og:description", content: "Grandes obras e clássicos jurídicos narrados em áudio imersivo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => null,
});

