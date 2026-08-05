import { createRouter } from "../_shared/fnRouter.ts";
import { handler as frase } from "./frase.ts";
import { handler as blog_preview } from "./blog_preview.ts";
import { handler as blog_artigo } from "./blog_artigo.ts";
import { handler as triagem } from "./triagem.ts";
import { handleNarracaoArtigo } from "../_shared/narracaoArtigo.ts";

const router = createRouter({
  "frase": frase,
  "blog_preview": blog_preview,
  "blog_artigo": blog_artigo,
  "triagem": triagem,
  "artigo": (req) => handleNarracaoArtigo(req),
});

Deno.serve(router);
