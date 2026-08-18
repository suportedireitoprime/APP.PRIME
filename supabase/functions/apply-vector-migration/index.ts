import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!databaseUrl) throw new Error('Missing SUPABASE_DB_URL');

    const client = new Client(databaseUrl);
    await client.connect();

    const sql = `
      -- 1. Create Webhook Trigger function
      create or replace function public.trigger_vademecum_embedder()
      returns trigger
      language plpgsql
      security definer
      as $$
      declare
        request_id bigint;
      begin
        -- Only trigger if texto has changed or it's a new record
        if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.texto is distinct from old.texto) then
          -- Reset embedding to null so we know it needs update
          if tg_op = 'UPDATE' then
            new.embedding = null;
          end if;
          
          -- Call the edge function using pg_net
          select net.http_post(
              url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/vademecum-embedder',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claim.sub', true) || '"}'::jsonb,
              body:=json_build_object('record', row_to_json(new))::jsonb
          ) into request_id;
        end if;
        return new;
      end;
      $$;

      -- 2. Drop if exists, then create the Trigger
      drop trigger if exists on_vademecum_artigo_change on public.vade_mecum_artigos;
      create trigger on_vademecum_artigo_change
      after insert or update on public.vade_mecum_artigos
      for each row execute function public.trigger_vademecum_embedder();
    `;

    await client.queryArray(sql);
    await client.end();

    return new Response(JSON.stringify({ success: true, message: "Webhook created!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
