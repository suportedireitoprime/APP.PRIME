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
      CREATE TABLE IF NOT EXISTS public.pilulas_decks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          titulo TEXT NOT NULL,
          descricao TEXT,
          imagem TEXT,
          quantidade_estimada INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.pilulas_cards (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          deck_id UUID REFERENCES public.pilulas_decks(id) ON DELETE CASCADE,
          titulo TEXT NOT NULL,
          subtitulo TEXT,
          imagem TEXT,
          texto_detalhado TEXT NOT NULL,
          ordem INT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      INSERT INTO public.pilulas_decks (id, slug, titulo, descricao, imagem, quantidade_estimada)
      VALUES ('00000000-0000-4000-8000-000000000001', 'stf', 'Supremo Tribunal Federal', 'Entenda a estrutura, as funções e conheça os ministros da Suprema Corte.', '/assets/stf-1.jpg', 3)
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO public.pilulas_decks (id, slug, titulo, descricao, imagem, quantidade_estimada)
      VALUES ('00000000-0000-4000-8000-000000000002', 'penal', 'Direito Penal Essencial', 'Conceitos fundamentais de dolo, culpa, ilicitude e muito mais.', '/assets/penal.jpg', 3)
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO public.pilulas_cards (deck_id, titulo, subtitulo, imagem, texto_detalhado, ordem) VALUES
      ('00000000-0000-4000-8000-000000000001', 'Supremo Tribunal Federal', 'O guardião da Constituição', '/assets/stf-1.jpg', 'O STF é a mais alta instância do Poder Judiciário brasileiro. Sua principal função é zelar pela Constituição Federal, atuando como o guardião dos princípios fundamentais da República.', 1),
      ('00000000-0000-4000-8000-000000000001', 'Composição da Corte', 'Como os ministros são escolhidos', '/assets/stf-2.jpg', 'O STF é composto por 11 Ministros, nomeados pelo Presidente da República após aprovação por maioria absoluta do Senado Federal. Devem ter entre 35 e 70 anos e notável saber jurídico.', 2),
      ('00000000-0000-4000-8000-000000000001', 'Presidente Atual', 'A liderança da Suprema Corte', '/assets/stf-3.jpg', 'A presidência do STF tem mandato de dois anos, seguindo tradicionalmente a ordem de antiguidade entre os ministros que ainda não exerceram o cargo.', 3);

      INSERT INTO public.pilulas_cards (deck_id, titulo, subtitulo, imagem, texto_detalhado, ordem) VALUES
      ('00000000-0000-4000-8000-000000000002', 'Dolo vs Culpa', 'A intenção por trás do ato', '/assets/penal-1.jpg', 'No Dolo, o agente quer o resultado ou assume o risco de produzi-lo. Na Culpa, o resultado ocorre por imprudência, negligência ou imperícia, sem a intenção do agente.', 1),
      ('00000000-0000-4000-8000-000000000002', 'Excludentes de Ilicitude', 'Quando uma ação não é crime', '/assets/penal-2.jpg', 'São causas que afastam o crime: Estado de Necessidade, Legítima Defesa, Estrito Cumprimento de Dever Legal e Exercício Regular de Direito.', 2),
      ('00000000-0000-4000-8000-000000000002', 'Princípio da Insignificância', 'O crime de bagatela', '/assets/penal-3.jpg', 'Também chamado de Princípio da Bagatela, afasta a tipicidade material do crime quando a lesão ao bem jurídico é ínfima, como pequenos furtos sem violência.', 3);

      ALTER TABLE public.pilulas_decks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.pilulas_cards ENABLE ROW LEVEL SECURITY;
    `;

    await client.queryArray(sql);

    try { await client.queryArray(`CREATE POLICY "Decks are viewable by everyone" ON public.pilulas_decks FOR SELECT USING (true);`); } catch(e) {}
    try { await client.queryArray(`CREATE POLICY "Cards are viewable by everyone" ON public.pilulas_cards FOR SELECT USING (true);`); } catch(e) {}

    await client.end();

    return new Response(JSON.stringify({ success: true }), {
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
