import { createClient } from '@supabase/supabase-js';

const LEIS_SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const LEIS_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

export const leisSupabaseClient = createClient(LEIS_SUPABASE_URL, LEIS_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// Cache em memória para resolução instantânea a 0ms de leis e artigos
const leisCache = new Map<string, string>();
const artigosCache = new Map<string, { texto: string; numero: string; epigrafe?: string | null }>();

/**
 * Busca o texto oficial de um artigo no Vade Mecum unificado.
 */
export async function buscarTextoOficialArtigo(
  slugOrNomeLei: string,
  numeroArtigo: string | number
): Promise<{ texto: string; numero: string; epigrafe?: string | null } | null> {
  if (!slugOrNomeLei || !numeroArtigo) return null;

  const cacheKey = `${slugOrNomeLei.toLowerCase()}::${numeroArtigo}`;
  if (artigosCache.has(cacheKey)) {
    return artigosCache.get(cacheKey)!;
  }

  try {
    // 1. Identificar o lei_id
    let leiId = leisCache.get(slugOrNomeLei.toLowerCase());
    if (!leiId) {
      const isEca = /eca|criança|adolescente/i.test(slugOrNomeLei);
      const isOab = /oab|advocacia|eoab/i.test(slugOrNomeLei);
      let query = leisSupabaseClient
        .from('vade_mecum_leis')
        .select('id, slug, total_artigos');

      if (isEca) {
        query = query.or('slug.eq.eca,slug.ilike.%eca%');
      } else if (isOab) {
        query = query.or('slug.eq.estatuto-oab,slug.eq.eoab,slug.ilike.%oab%');
      } else {
        query = query.or(`slug.ilike.%${slugOrNomeLei}%,nome.ilike.%${slugOrNomeLei}%`);
      }

      const { data: leis } = await query
        .order('total_artigos', { ascending: false })
        .limit(1);

      if (leis && leis[0]) {
        leiId = leis[0].id;
        leisCache.set(slugOrNomeLei.toLowerCase(), leiId);
      }
    }

    if (!leiId) return null;

    // 2. Buscar o artigo exato (ex: '1', '1º', '1°')
    const numLimpo = String(numeroArtigo).replace(/[^0-9A-Za-z-]/g, '').trim();
    const { data: arts } = await leisSupabaseClient
      .from('vade_mecum_artigos')
      .select('id, numero, texto, ordem, epigrafe')
      .eq('lei_id', leiId)
      .or(`numero.eq.${numLimpo},numero.eq.${numLimpo}º,numero.eq.${numLimpo}°,numero.ilike.${numLimpo}-%`)
      .order('ordem', { ascending: true })
      .limit(1);

    if (arts && arts[0]?.texto) {
      const resultado = {
        texto: arts[0].texto,
        numero: arts[0].numero,
        epigrafe: arts[0].epigrafe,
      };
      artigosCache.set(cacheKey, resultado);
      return resultado;
    }

    return null;
  } catch (err) {
    console.warn('[buscarTextoOficialArtigo] Erro ao buscar artigo oficial:', err);
    return null;
  }
}
