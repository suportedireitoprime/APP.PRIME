import { evolution } from "../_shared/evolution.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

export const handler = async (req: Request) => {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone");
  const text = url.searchParams.get("text");
  
  if (!phone || !text) return new Response("missing args");
  
  try {
    const result = await evolution.sendText(phone, text);
    
    // Also log in conversations
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("horus_conversations").insert({
      phone_e164: phone.replace(/\D/g, ""),
      role: "assistant",
      content: text,
    });
    
    return new Response(JSON.stringify(result));
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
};

Deno.serve(handler);
