import { createRouter } from "../_shared/fnRouter.ts";
import { handler as triagem } from "./triagem.ts";
import { handler as jurisprudencia } from "./jurisprudencia.ts";
import { handler as elaborar } from "./elaborar.ts";

const router = createRouter({
  "triagem": triagem,
  "jurisprudencia": jurisprudencia,
  "elaborar": elaborar,
});

Deno.serve(router);
