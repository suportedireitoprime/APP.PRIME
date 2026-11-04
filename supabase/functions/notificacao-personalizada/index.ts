import { createRouter } from "../_shared/fnRouter.ts";
import { handler as app } from "./app.ts";
import { handler as horus } from "./horus.ts";

const router = createRouter({
  "app": app,
  "horus": horus,
});

Deno.serve(router);
