import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
      const oneSignalRestKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${supabaseKey}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      if (!supabaseUrl || !supabaseKey || !oneSignalAppId || !oneSignalRestKey) {
        throw new Error("Missing environment variables.");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check if there are any sessions scheduled for today that are not finished or canceled
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);

      const { data: sessions, error } = await supabase
        .from("stf_sessions")
        .select("id, title, status")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString())
        .in("status", ["scheduled", "live"]);

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        return new Response(JSON.stringify({ message: "No sessions scheduled for today." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // We have sessions today. Let's send a push notification.
      // E.g., "O STF vai julgar temas importantes hoje. Confira a pauta!"
      const notificationMessage = "O STF vai julgar temas importantes hoje. Confira a pauta!";
      
      const payload = {
        app_id: oneSignalAppId,
        contents: { en: notificationMessage, pt: notificationMessage },
        headings: { en: "Sessões STF", pt: "Sessões STF" },
        included_segments: ["Subscribed Users"], 
        data: { route: "/ferramentas/stf" },
      };

      const pushRes = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${oneSignalRestKey}`,
        },
        body: JSON.stringify(payload),
      });

      const pushData = await pushRes.json();

      return new Response(
        JSON.stringify({ message: "Push notification triggered successfully", data: pushData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  },
};
