import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tabela, limit } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let titulo = "Explicação da Lei";
    let bodyText = "Um novo estudo está disponível para você revisar!";
    let category = "LEI";

    if (tabela === "CF88_CONSTITUICAO_FEDERAL") {
      titulo = "📜 CF88 - Estudo Diário";
      bodyText = "Sua pílula diária da Constituição Federal já está pronta! Venha revisar os principais artigos.";
      category = "CF88";
    } else if (tabela === "CP_CODIGO_PENAL") {
      titulo = "⚖️ CP/CC/CPC - Explicação Noturna";
      bodyText = "Revisão dos Códigos: veja as novas explicações geradas sobre os artigos mais cobrados.";
      category = "CODIGOS";
    } else if (tabela === "CLT_CONSOLIDACAO_LEIS_TRABALHO") {
      titulo = "🏢 Trabalhista, Consumidor e Tributário";
      bodyText = "Novos resumos e explicações geradas para CLT, CDC e CTN. Aproveite para gabaritar!";
      category = "TRABALHO";
    }

    // Criar campanha de push
    const pushPayload = {
      title: titulo,
      body: bodyText,
      status: 'pending',
      audience_type: 'all',
      type: 'informational',
    };

    const { error: insertError } = await supabase
      .from('push_campaigns')
      .insert([pushPayload]);

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true, message: "Push campaign created based on table " + tabela }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
