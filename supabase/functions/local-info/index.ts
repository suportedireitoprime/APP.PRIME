import { createRouter } from "../_shared/fnRouter.ts";
import { handler as geocode } from "./geocode.ts";
import { handler as sobre } from "./sobre.ts";
import { handler as transporte } from "./transporte.ts";
import { handler as moderar } from "./moderar.ts";

const router = createRouter({
  "geocode": geocode,
  "sobre": sobre,
  "transporte": transporte,
  "moderar": moderar,
});

Deno.serve(router);
