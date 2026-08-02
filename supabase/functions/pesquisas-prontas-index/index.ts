import { createRouter } from "../_shared/fnRouter.ts";
import { handler as backfill } from "./backfill.ts";
import { handler as stf } from "./stf.ts";
import { handler as stj } from "./stj.ts";

const router = createRouter({
  "backfill": backfill,
  "stf": stf,
  "stj": stj,
});

Deno.serve(router);
