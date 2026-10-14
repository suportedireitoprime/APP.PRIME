import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. List buckets
    const { data: buckets, error: bErr } = await admin.storage.listBuckets();
    console.log("Existing buckets:", buckets, bErr);

    // Check if "audios" exists, otherwise create it as public
    const hasAudios = buckets?.some(b => b.name === "audios");
    if (!hasAudios) {
      const { data: newB, error: cErr } = await admin.storage.createBucket("audios", {
        public: true,
      });
      console.log("Created bucket audios:", newB, cErr);
    } else {
      // Ensure it is public
      await admin.storage.updateBucket("audios", { public: true });
    }

    return new Response(JSON.stringify({ ok: true, buckets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
