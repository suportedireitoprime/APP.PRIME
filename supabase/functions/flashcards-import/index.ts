import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SOURCE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/FLASHCARDS_GERADOS';
const SOURCE_KEY = 'sb_publishable_nqyec1qQmLMrbPH3YFPhxw_XtJ449ZC';

// Normalização das áreas do app antigo (36 variações -> 29 áreas canônicas)
const AREA_MAP: Record<string, string> = {
  'Direito Tributario': 'Direito Tributário',
  'Direito Do Trabalho': 'Direito do Trabalho',
  'Direito Processual Do Trabalho': 'Direito Processual do Trabalho',
  'Teoria E Filosofia Do Direito': 'Teoria e Filosofia do Direito',
  'Direito Previndenciario': 'Direito Previdenciário',
  'Direito Urbanistico': 'Direito Urbanístico',
  'Pratica Profissional': 'Prática Profissional',
  'Politicas Publicas': 'Políticas Públicas',
  'Pesquisa Científica': 'Pesquisa Científica',
  'Revisão Oab': 'Revisão OAB',
  'Código Penal': 'Direito Penal',
  'Constituição Federal': 'Direito Constitucional',
};

function normalizeArea(a: string | null): string {
  const raw = (a || '').trim();
  if (!raw) return 'Geral';
  return AREA_MAP[raw] || raw;
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const offset = Number(body.offset ?? 0);
    const limit = Math.min(Number(body.limit ?? 2000), 5000);
    const finalize = Boolean(body.finalize);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (finalize) {
      // Recria o catálogo de áreas a partir dos cards importados
      const { data: rows, error } = await admin.rpc('flashcards_recontar_areas');
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ ok: true, areas: rows }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `${SOURCE_URL}?select=*&order=id.asc&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: { apikey: SOURCE_KEY } });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: 'source_failed', status: res.status, details: t }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const source = await res.json();

    if (!Array.isArray(source) || source.length === 0) {
      return new Response(JSON.stringify({ ok: true, imported: 0, done: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = source
      .filter((c: any) => c.pergunta && c.resposta)
      .map((c: any) => ({
        origem_id: c.id,
        area: normalizeArea(c.area),
        tema: c.tema || null,
        subtema: c.subtema || null,
        pergunta: c.pergunta,
        resposta: c.resposta,
        exemplo: c.exemplo || null,
        base_legal: c.base_legal || null,
        dica: c.dica || null,
        reforco_conteudo: c.reforco_conteudo || null,
        lei_id: c.lei_id || null,
        artigo_id: c.artigo_id || null,
        artigo_numero: c.artigo_numero ? String(c.artigo_numero) : null,
        origem: c.origem || null,
      }));

    const chunkSize = 500;
    let imported = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await admin
        .from('flashcards_cards')
        .upsert(chunk, { onConflict: 'origem_id', ignoreDuplicates: true });
      if (error) throw new Error(error.message);
      imported += chunk.length;
    }

    return new Response(
      JSON.stringify({ ok: true, imported, offset, done: source.length < limit, slugExample: slugify('Direito Tributário') }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('flashcards-import error', e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
