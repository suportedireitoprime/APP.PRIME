import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from 'https://deno.land/x/postgresjs@v3.3.5/mod.js';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const { sql, secret } = await req.json();
    if (secret !== 'super-secret-admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const databaseUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!databaseUrl) {
      return new Response(JSON.stringify({ error: 'SUPABASE_DB_URL not set' }), { status: 500 });
    }

    const sqlClient = postgres(databaseUrl);
    
    // Execute the raw SQL!
    const result = await sqlClient.unsafe(sql);
    
    await sqlClient.end();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
