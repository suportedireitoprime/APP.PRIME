import { createRouter } from "../_shared/fnRouter.ts";
import { handler as mem0 } from "./mem0.ts";
import { handler as nager } from "./nager.ts";
import { handler as wikipedia } from "./wikipedia.ts";

const router = createRouter({
  "mem0": mem0,
  "nager": nager,
  "wikipedia": wikipedia,
});

Deno.serve(router);
