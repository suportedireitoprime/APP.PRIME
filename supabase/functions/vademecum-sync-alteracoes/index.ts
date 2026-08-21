import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Pegar a configuração de IA para histórico
    const { data: config } = await supabase
      .from('vademecum_config_ia')
      .select('prompt_sistema, modelo_ia')
      .eq('tipo', 'historico')
      .maybeSingle();

    const promptSistema = config?.prompt_sistema || 'A lei foi alterada recentemente. Resuma a mudança com base na tag de alteração informada.';
    const modeloIa = config?.modelo_ia || 'gemini-2.5-flash-lite';
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    // 2. Pegar todas as leis que têm planalto_url
    const { data: leis, error: errLeis } = await supabase
      .from('vade_mecum_leis')
      .select('id, nome, planalto_url')
      .not('planalto_url', 'is', null);
      
    if (errLeis) throw errLeis;
    if (!leis || leis.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma lei para verificar' }), { headers: corsHeaders });
    }

    const alteracoesRealizadas = [];

    // 3. Verificar cada lei usando a edge function interna
    for (const lei of leis) {
      try {
        const checkRes = await fetch(`${supabaseUrl}/functions/v1/verificar-atualizacao-lei`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ lei_id: lei.id })
        });
        
        if (!checkRes.ok) continue;
        const checkData = await checkRes.json();
        
        if (checkData.mudou && !checkData.primeira_verificacao) {
          // A lei realmente foi alterada!
          
          // 4. Pedir pra IA gerar um resumo
          let resumo = `A ${lei.nome} foi atualizada. Houve alterações no texto original publicadas recentemente.`;
          
          if (geminiKey && checkData.ultima_tag) {
            try {
              const aiPrompt = `${promptSistema}\n\nNome da lei: ${lei.nome}\nTag detectada na alteração (indício do que mudou): ${checkData.ultima_tag}\n\nGere apenas o texto de resumo para mostrar ao usuário.`;
              
              const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modeloIa}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: aiPrompt }] }]
                })
              });
              
              const gData = await gRes.json();
              const candidate = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate) {
                resumo = candidate.trim();
              }
            } catch (aiErr) {
              console.error('Erro na IA:', aiErr);
            }
          }

          // 5. Acionar reextração para atualizar os artigos no banco
          const reextrairRes = await fetch(`${supabaseUrl}/functions/v1/reextrair-lei-planalto`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ slug: checkData.lei.slug, preservar_enriquecimento: true })
          });

          if (reextrairRes.ok) {
            // 6. Salvar na tabela de histórico
            await supabase.from('vademecum_historico_alteracoes').insert({
              lei_id: lei.id,
              resumo_ia: resumo,
              data_alteracao: checkData.data_nova || new Date().toISOString()
            });

            alteracoesRealizadas.push({
              lei: lei.nome,
              resumo
            });
          }
        }
      } catch (loopErr) {
        console.error('Erro na lei', lei.id, loopErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, processadas: leis.length, alteradas: alteracoesRealizadas.length, detalhes: alteracoesRealizadas }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
