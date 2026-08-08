import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const key = Deno.env.get("GEMINI_API_KEY");
  return new Response(
    JSON.stringify({ key, length: key?.length, isHash: key?.length === 64 }),
    { headers: { "Content-Type": "application/json" } }
  );
});
