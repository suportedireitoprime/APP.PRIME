import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, normalizeLivro, type ColecaoConfig, type LivroNormalizado } from '@/lib/bibliotecaColecoes';

export interface LeituraNativaStatus {
  status?: string | null;             // pendente | processando | pronto | erro
  etapa?: string | null;
  progresso?: number | null;
  total_etapas?: number | null;
  total_paginas?: number | null;
  erro_detalhe?: string | null;
  updated_at?: string | null;
  refino_status?: string | null;      // pendente | processando | pronto | erro
  refino_updated_at?: string | null;
  refino_erro?: string | null;
}

export interface LivroLeituraItem extends LivroNormalizado {
  colecao: ColecaoConfig;
  leitura?: LeituraNativaStatus | null;
}

// Cache em memória (sobrevive à navegação dentro do app)
let CACHE: LivroLeituraItem[] | null = null;
const SS_KEY = 'admin-leitura-nativa-cache-v1';

function readSessionCache(): LivroLeituraItem[] | null {
  if (CACHE) return CACHE;
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LivroLeituraItem[];
    if (Array.isArray(parsed) && parsed.length) { CACHE = parsed; return parsed; }
  } catch { /* ignore */ }
  return null;
}

export function useBibliotecaLeituraStatus() {
  const cached = readSessionCache();
  const [items, setItems] = useState<LivroLeituraItem[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    // 1) Livros de todas as coleções (em paralelo)
    const allLivros: LivroLeituraItem[] = [];
    const { getPersistedColecao } = await import('@/services/offlineDb');
    const results = await Promise.all(
      COLECOES.map(async (col) => {
        try {
          const cached = await getPersistedColecao<LivroNormalizado>(col.id);
          if (cached && cached.length > 0) return cached.map(row => ({ ...row, colecao: col }));
        } catch {}
        const { data, error } = await supabase
          .from(col.table as any)
          .select(col.select)
          .limit(2000);
        if (error) { console.warn(col.table, error.message); return []; }
        return ((data as any[]) ?? []).map((row) => ({ ...normalizeLivro(row, col), colecao: col }));
      })
    );
    for (const arr of results) allLivros.push(...arr);
    // 2) Status de leitura nativa
    const { data: statusRows } = await supabase
      .from('biblioteca_leitura_nativa' as any)
      .select('livro_id,livro_tabela,status,etapa,progresso,total_etapas,total_paginas,erro_detalhe,updated_at,refino_status,refino_updated_at,refino_erro')
      .limit(5000);
    const statusMap = new Map<string, LeituraNativaStatus>();
    for (const s of (statusRows as any[]) ?? []) {
      statusMap.set(`${s.livro_tabela}::${s.livro_id}`, s);
    }
    for (const it of allLivros) {
      it.leitura = statusMap.get(`${it.colecao.table}::${it.id}`) ?? null;
    }
    CACHE = allLivros;
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(allLivros)); } catch { /* quota */ }
    setItems(allLivros);
    setLoading(false);
  }, []);

  // Primeira carga: se já tem cache, revalida em silêncio no fundo
  useEffect(() => { load(!!CACHE); }, [load]);

  // Realtime — atualiza status quando muda
  useEffect(() => {
    const channel = supabase
      .channel('biblioteca-leitura-nativa-admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'biblioteca_leitura_nativa' },
        (payload: any) => {
          const s = payload.new ?? payload.old;
          if (!s?.livro_id || !s?.livro_tabela) return;
          setItems((prev) => prev.map((it) =>
            it.colecao.table === s.livro_tabela && String(it.id) === String(s.livro_id)
              ? { ...it, leitura: { ...(it.leitura ?? {}), ...s } }
              : it
          ));
          if (CACHE) {
            CACHE = CACHE.map((it) =>
              it.colecao.table === s.livro_tabela && String(it.id) === String(s.livro_id)
                ? { ...it, leitura: { ...(it.leitura ?? {}), ...s } }
                : it
            );
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { items, loading, reload: () => load(false) };
}
