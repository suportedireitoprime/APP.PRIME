import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const ASAAS_API_URL = "https://api.asaas.com/v3";

serve(async (req) => {
  try {
    const { email } = await req.json();
    const API_KEY = Deno.env.get("ASAAS_API_KEY");
    
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "Missing ASAAS_API_KEY" }), { headers: { "Content-Type": "application/json" } });
    }

    const headers = {
      "access_token": API_KEY,
      "Content-Type": "application/json"
    };

    // 1. Search customer by email
    const custRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, { headers });
    const custData = await custRes.json();
    
    if (!custData.data || custData.data.length === 0) {
      return new Response(JSON.stringify({ error: "Customer not found in Asaas", details: custData }), { headers: { "Content-Type": "application/json" } });
    }
    
    const customer = custData.data[0];
    
    // 2. Fetch their subscriptions
    const subRes = await fetch(`${ASAAS_API_URL}/subscriptions?customer=${customer.id}`, { headers });
    const subData = await subRes.json();

    // 3. Fetch their payments (recent 5)
    const payRes = await fetch(`${ASAAS_API_URL}/payments?customer=${customer.id}&limit=5`, { headers });
    const payData = await payRes.json();

    return new Response(JSON.stringify({
      customer,
      subscriptions: subData.data,
      payments: payData.data
    }), { headers: { "Content-Type": "application/json" } });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { "Content-Type": "application/json" } });
  }
});
