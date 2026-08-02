import { createRouter } from "../_shared/fnRouter.ts";
import { handler as reconcile } from "./reconcile.ts";
import { handler as reporting } from "./reporting.ts";
import { handler as revoke } from "./revoke.ts";

const router = createRouter({
  "reconcile": reconcile,
  "reporting": reporting,
  "revoke": revoke,
});

Deno.serve(router);
