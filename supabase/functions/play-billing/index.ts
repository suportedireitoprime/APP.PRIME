import { createRouter } from "../_shared/fnRouter.ts";
import { handler as reconcile } from "./reconcile.ts";
import { handler as reporting } from "./reporting.ts";
import { handler as revoke } from "./revoke.ts";
import { handler as funnel } from "./funnel.ts";

const router = createRouter({
  "reconcile": reconcile,
  "reporting": reporting,
  "revoke": revoke,
  "funnel": funnel,
});

Deno.serve(router);
