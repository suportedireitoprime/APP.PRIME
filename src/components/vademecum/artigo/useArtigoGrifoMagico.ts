import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ArtigoLei } from '@/data/mockData';
import type { Highlight } from '@/hooks/useHighlights';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { readArtigoGrifos, writeArtigoGrifos } from '@/lib/artigoGrifosSnapshot';
import { invalidateCache, anotacoesKey } from '@/lib/artigoFuncoesPrefetch';
import {
  MAGIC_COLORS,
  MAGIC_LABELS,
  GRIFO_IA_DEFAULT_KEY,
  type MagicGrifo,
} from './artigoConstants';

export interface UseArtigoGrifoMagicoOptions {
  artigo: ArtigoLei | null;
  tabelaNome: string;
  highlights: Highlight[];
  removeHighlightsByColor: (color: string) => void;
  clearAll: () => void;
  onAnotacoesCountChange?: (updater: (count: number) => number) => void;
  onAnotacoesRefresh?: () => void;
}

export function useArtigoGrifoMagico({
  artigo,
  tabelaNome,
  highlights,
  removeHighlightsByColor,
  clearAll,
  onAnotacoesCountChange,
  onAnotacoesRefresh,
}: UseArtigoGrifoMagicoOptions) {
  const [magicMode, setMagicMode] = useState(false);
  const [magicHighlights, setMagicHighlights] = useState<MagicGrifo[]>([]);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicTooltip, setMagicTooltip] = useState<{ grifo: MagicGrifo; rect: DOMRect } | null>(null);

  const [grifoIaDefaultOn, setGrifoIaDefaultOn] = useState<boolean>(() => {
    try {
      const v = typeof localStorage !== 'undefined' ? localStorage.getItem(GRIFO_IA_DEFAULT_KEY) : null;
      return v == null ? true : v === '1';
    } catch {
      return true;
    }
  });

  const setGrifoIaDefault = useCallback((on: boolean) => {
    setGrifoIaDefaultOn(on);
    try {
      localStorage.setItem(GRIFO_IA_DEFAULT_KEY, on ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  // Persiste grifos IA em `artigos_grifos` (1 linha/artigo) e cria uma
  // anotação por grifo em `artigos_anotacoes`, com dedupe por texto.
  // Chamado tanto quando o usuário clica em "Grifo mágico" quanto quando
  // os grifos são reidratados do cache ao abrir o artigo.
  const persistMagicHighlights = useCallback(async (grifos: MagicGrifo[]) => {
    if (!artigo?.numero || !tabelaNome || !grifos?.length) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      const artigoId = `${tabelaNome}::${artigo.numero}`;
      const buildComment = (g: MagicGrifo) =>
        `${MAGIC_LABELS[g.cor] || 'Grifo IA'}: ${g.explicacao || ''}`.trim();

      // artigos_grifos: substitui o snapshot com o array atual de N grifos.
      const highlightsPayload = grifos.map((g, i) => ({
        id: `ia_${g.cor}_${i}`,
        text: g.trechoExato,
        trechoExato: g.trechoExato,
        color: MAGIC_COLORS[g.cor] || MAGIC_COLORS.amarelo,
        cor: MAGIC_COLORS[g.cor] || MAGIC_COLORS.amarelo,
        corNome: g.cor,
        categoria: MAGIC_LABELS[g.cor] || 'Grifo IA',
        comment: buildComment(g),
        explicacao: g.explicacao,
        hierarquia: g.hierarquia,
        origem: 'ia',
        createdAt: Date.now() + i,
      }));
      await supabase.from('artigos_grifos').upsert(
        {
          user_id: user.id,
          tabela_codigo: tabelaNome,
          numero_artigo: artigo.numero,
          artigo_id: artigoId,
          highlights: highlightsPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,tabela_codigo,numero_artigo' },
      );

      // artigos_anotacoes: N linhas com dedupe por texto exato.
      const { data: existing } = await supabase
        .from('artigos_anotacoes')
        .select('anotacao')
        .eq('user_id', user.id)
        .eq('tabela_codigo', tabelaNome)
        .eq('numero_artigo', artigo.numero);
      const existingSet = new Set(
        (existing || []).map((n: any) => String(n.anotacao || '').trim()),
      );
      const notasRows = grifos
        .map((g) => ({
          user_id: user.id,
          tabela_codigo: tabelaNome,
          numero_artigo: artigo.numero,
          artigo_id: artigoId,
          anotacao: buildComment(g),
        }))
        .filter((row) => row.anotacao && !existingSet.has(row.anotacao));
      if (notasRows.length > 0) {
        const { error: notesInsertError } = await supabase.from('artigos_anotacoes').insert(notasRows);
        if (notesInsertError && notesInsertError.code !== '23505') throw notesInsertError;
      }
      invalidateCache(anotacoesKey(tabelaNome, artigo.numero, user.id));
      onAnotacoesRefresh?.();
    } catch (err) {
      console.warn('persistMagicHighlights falhou', err);
      onAnotacoesRefresh?.();
    }
  }, [artigo?.numero, tabelaNome, onAnotacoesRefresh]);

  // Reset magic highlights when artigo changes; se a preferência "mostrar
  // grifo por padrão" estiver ligada, o snapshot local é lido de forma
  // SÍNCRONA (sem esperar rede) para o artigo já abrir grifado. A revalidação
  // no servidor acontece em paralelo, atrás.
  useEffect(() => {
    setMagicTooltip(null);
    if (!artigo || !tabelaNome || !grifoIaDefaultOn) {
      setMagicHighlights([]);
      setMagicMode(false);
      return;
    }

    // 1) Pintura imediata a partir do espelho local.
    const snap = readArtigoGrifos(tabelaNome, artigo.numero);
    if (snap && snap.length) {
      setMagicHighlights(snap as MagicGrifo[]);
      setMagicMode(true);
    } else {
      setMagicHighlights([]);
      setMagicMode(false);
    }

    let cancelled = false;
    const parseGrifos = (raw: string | null): MagicGrifo[] | null => {
      if (!raw) return null;
      try {
        let cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const m = cleaned.match(/\[[\s\S]*\]/);
        if (m) cleaned = m[0];
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.trechoExato
          ? (parsed as MagicGrifo[])
          : null;
      } catch {
        return null;
      }
    };

    (async () => {
      try {
        const { getLocalAiCache, setLocalAiCache } = await import('@/lib/aiCacheLocal');
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

        let cachedRaw: string | null = null;

        if (!offline) {
          // 2) As duas consultas saem JUNTAS (antes eram uma depois da outra).
          const [savedRes, cacheRes] = await Promise.all([
            supabase
              .from('artigos_grifos')
              .select('highlights')
              .eq('tabela_codigo', tabelaNome)
              .eq('numero_artigo', artigo.numero)
              .maybeSingle(),
            supabase
              .from('artigo_ai_cache')
              .select('conteudo')
              .eq('tabela_codigo', tabelaNome)
              .eq('numero_artigo', artigo.numero)
              .eq('tipo', 'grifo_magico')
              .maybeSingle(),
          ]);

          const saved = savedRes.data;
          if (saved && Array.isArray(saved.highlights)) {
            const savedMagic = saved.highlights
              .filter((item: any) => item?.origem === 'ia')
              .map((item: any) => ({
                trechoExato: item.trechoExato || item.text,
                cor: (item.corNome || Object.keys(MAGIC_COLORS).find((key) => MAGIC_COLORS[key] === item.color || MAGIC_COLORS[key] === item.cor) || 'amarelo') as MagicGrifo['cor'],
                explicacao: item.explicacao || String(item.comment || '').replace(/^[^:]+:\s*/, ''),
                hierarquia: item.hierarquia || '',
              }));
            if (savedMagic.length) {
              cachedRaw = JSON.stringify(savedMagic);
              setLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico', cachedRaw);
            }
          }
          if (!cachedRaw) cachedRaw = (cacheRes.data?.conteudo as string) || null;
        }

        if (!cachedRaw) cachedRaw = getLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico');
        if (cancelled) return;

        const parsed = parseGrifos(cachedRaw);
        if (!parsed) return;

        // Só re-renderiza se realmente mudou em relação ao snapshot já pintado.
        const mudou = JSON.stringify(parsed) !== JSON.stringify(snap ?? []);
        writeArtigoGrifos(tabelaNome, artigo.numero, parsed as any);
        if (mudou) {
          setMagicHighlights(parsed);
          setMagicMode(true);
        }
        persistMagicHighlights(parsed);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [artigo?.id, tabelaNome, grifoIaDefaultOn, persistMagicHighlights]);

  const persistMagicRemoval = useCallback(async (next: MagicGrifo[], removed: MagicGrifo[]) => {
    if (!artigo?.numero || !tabelaNome) return;
    setMagicHighlights(next);
    setMagicMode(next.length > 0);
    setMagicTooltip(null);
    onAnotacoesCountChange?.((count) => Math.max(0, count - removed.length));

    // Garante que o snapshot local síncrono seja limpo ou atualizado
    writeArtigoGrifos(tabelaNome, String(artigo.numero), next.length > 0 ? (next as any) : []);

    const { setLocalAiCache, deleteLocalAiCache } = await import('@/lib/aiCacheLocal');
    if (next.length > 0) setLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico', JSON.stringify(next));
    else deleteLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico');

    const artigoId = `${tabelaNome}::${artigo.numero}`;
    try {
      const { db } = await import('@/services/offlineDb');
      const localRows = await db.highlights.where('artigoId').equals(artigoId).toArray();
      const removedTexts = new Set(removed.map((item) => item.trechoExato));
      const ids = localRows.filter((row) => {
        try {
          const data = JSON.parse(row.data);
          return data?.origem === 'ia' && removedTexts.has(data.text);
        } catch { return false; }
      }).map((row) => row.id);
      if (ids.length > 0) await db.highlights.bulkDelete(ids);
    } catch (error) {
      console.warn('Não foi possível limpar o espelho local dos grifos', error);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
      const payload = next.map((g, i) => ({
        id: `ia_${g.cor}_${i}`,
        text: g.trechoExato,
        trechoExato: g.trechoExato,
        color: MAGIC_COLORS[g.cor] || MAGIC_COLORS.amarelo,
        cor: MAGIC_COLORS[g.cor] || MAGIC_COLORS.amarelo,
        corNome: g.cor,
        categoria: MAGIC_LABELS[g.cor] || 'Grifo IA',
        comment: `${MAGIC_LABELS[g.cor] || 'Grifo IA'}: ${g.explicacao || ''}`.trim(),
        explicacao: g.explicacao,
        hierarquia: g.hierarquia,
        origem: 'ia',
        createdAt: Date.now() + i,
      }));
      const { error: highlightsError } = await supabase.from('artigos_grifos').upsert({
        user_id: user.id,
        tabela_codigo: tabelaNome,
        numero_artigo: artigo.numero,
        artigo_id: artigoId,
        highlights: payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tabela_codigo,numero_artigo' });
      if (highlightsError) throw highlightsError;
      const removedComments = removed.map((g) => `${MAGIC_LABELS[g.cor] || 'Grifo IA'}: ${g.explicacao || ''}`.trim());
      if (removedComments.length > 0) {
        const { error: notesError } = await supabase
          .from('artigos_anotacoes')
          .delete()
          .eq('user_id', user.id)
          .eq('tabela_codigo', tabelaNome)
          .eq('numero_artigo', artigo.numero)
          .in('anotacao', removedComments);
        if (notesError) throw notesError;
      }
    } catch (error) {
      console.error('Erro ao sincronizar exclusão de grifos:', error);
      toast.error('Os grifos foram apagados neste aparelho, mas a sincronização falhou');
    }
  }, [artigo?.numero, tabelaNome, onAnotacoesCountChange]);

  const eraseSheetHighlights = useMemo(() => [
    ...highlights,
    ...magicHighlights.map((grifo, index) => ({
      id: `magic_${index}`,
      lineIndex: -1,
      startOffset: 0,
      endOffset: grifo.trechoExato.length,
      text: grifo.trechoExato,
      color: MAGIC_COLORS[grifo.cor] || MAGIC_COLORS.amarelo,
    })),
  ], [highlights, magicHighlights]);

  const handleRemoveGrifosByColor = useCallback((color: string) => {
    removeHighlightsByColor(color);
    const extractRgb = (c: string) => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      return m ? `${m[1]},${m[2]},${m[3]}` : c.toLowerCase().trim();
    };
    const targetRgb = extractRgb(color);
    const removedMagic = magicHighlights.filter((grifo) => {
      const gColor = MAGIC_COLORS[grifo.cor] || MAGIC_COLORS.amarelo;
      return extractRgb(gColor) === targetRgb;
    });
    const remainingMagic = magicHighlights.filter((grifo) => {
      const gColor = MAGIC_COLORS[grifo.cor] || MAGIC_COLORS.amarelo;
      return extractRgb(gColor) !== targetRgb;
    });

    // Atualiza imediatamente o estado de magicHighlights para refletir no modal e na tela
    setMagicHighlights(remainingMagic);
    if (remainingMagic.length === 0) {
      setMagicMode(false);
      setMagicTooltip(null);
    }

    if (tabelaNome && artigo?.numero) {
      writeArtigoGrifos(tabelaNome, String(artigo.numero), remainingMagic.length > 0 ? (remainingMagic as any) : []);
      import('@/lib/aiCacheLocal').then(({ setLocalAiCache, deleteLocalAiCache }) => {
        if (remainingMagic.length > 0) {
          setLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico', JSON.stringify(remainingMagic));
        } else {
          deleteLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico');
        }
      }).catch(() => {});
    }
    if (removedMagic.length > 0) {
      void persistMagicRemoval(remainingMagic, removedMagic);
    }
    import('@/lib/nativeHaptics').then(({ haptic }) => haptic.selection()).catch(() => {});
    toast.success('Grifos apagados com sucesso');
  }, [magicHighlights, persistMagicRemoval, removeHighlightsByColor, tabelaNome, artigo?.numero]);

  const handleClearAllGrifos = useCallback(() => {
    clearAll();
    if (tabelaNome && artigo?.numero) {
      writeArtigoGrifos(tabelaNome, String(artigo.numero), []);
      import('@/lib/aiCacheLocal').then(({ deleteLocalAiCache }) => {
        deleteLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico');
      }).catch(() => {});
      supabase.from('artigo_ai_cache')
        .delete()
        .eq('tabela_codigo', tabelaNome)
        .eq('numero_artigo', artigo.numero)
        .eq('tipo', 'grifo_magico')
        .then(() => {});
    }
    if (magicHighlights.length > 0) {
      void persistMagicRemoval([], magicHighlights);
    }
    setMagicHighlights([]);
    setMagicMode(false);
    setMagicTooltip(null);
    import('@/lib/nativeHaptics').then(({ haptic }) => haptic.success()).catch(() => {});
    toast.success('Todos os grifos foram apagados');
  }, [clearAll, magicHighlights, persistMagicRemoval, tabelaNome, artigo?.numero]);

  const handleToggleMagic = useCallback(async () => {
    if (magicMode) {
      setMagicMode(false);
      setMagicTooltip(null);
      return;
    }
    if (magicHighlights.length > 0) {
      setMagicMode(true);
      // Garante que anotações existam mesmo quando os grifos vieram do cache.
      persistMagicHighlights(magicHighlights);
      return;
    }
    if (!artigo || !tabelaNome) return;

    setMagicLoading(true);
    try {
      // Helper to parse and validate grifos JSON
      const parseGrifos = (raw: string): MagicGrifo[] | null => {
        try {
          let cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          const arrMatch = cleaned.match(/\[[\s\S]*\]/);
          if (arrMatch) cleaned = arrMatch[0];
          let parsed: unknown;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            cleaned = cleaned.replace(/,\s*([}\]])/g, '$1').replace(/'/g, '"');
            parsed = JSON.parse(cleaned);
          }
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.trechoExato) {
            return parsed as MagicGrifo[];
          }
          return null;
        } catch {
          return null;
        }
      };

      // Local mirror first (funciona offline), depois Supabase
      const { getLocalAiCache, setLocalAiCache, deleteLocalAiCache } = await import('@/lib/aiCacheLocal');
      let cachedRaw: string | null = getLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico');
      if (!cachedRaw && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        const { data: cached } = await supabase
          .from('artigo_ai_cache')
          .select('conteudo')
          .eq('tabela_codigo', tabelaNome)
          .eq('numero_artigo', artigo.numero)
          .eq('tipo', 'grifo_magico')
          .maybeSingle();
        cachedRaw = (cached?.conteudo as string) || null;
        if (cachedRaw) setLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico', cachedRaw);
      }

      let grifos: MagicGrifo[] | null = null;

      if (cachedRaw) {
        grifos = parseGrifos(cachedRaw);
        // If cached data is corrupt, delete it and re-fetch
        if (!grifos) {
          deleteLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico');
          await supabase.from('artigo_ai_cache')
            .delete()
            .eq('tabela_codigo', tabelaNome)
            .eq('numero_artigo', artigo.numero)
            .eq('tipo', 'grifo_magico');
        }
      }

      if (!grifos) {
        // Build full article text
        const fullParts: string[] = [artigo.caput || ''];
        if (artigo.incisos?.length) {
          fullParts.push(...artigo.incisos.map((x: any) => typeof x === 'string' ? x : x?.texto).filter(Boolean));
        }
        if (artigo.paragrafos?.length) {
          fullParts.push(...artigo.paragrafos.map((x: any) => typeof x === 'string' ? x : x?.texto).filter(Boolean));
        }
        const fullText = fullParts.join('\n\n');

        // Try up to 2 times
        for (let attempt = 0; attempt < 2; attempt++) {
          const { data, error } = await supabase.functions.invoke('assistente-juridica', {
            body: {
              mode: 'grifo_magico',
              artigoTexto: fullText,
              artigoNumero: artigo.numero,
              leiNome: tabelaNome,
            },
          });
          if (error) { console.error('Grifo mágico invoke error:', error); continue; }
          const rawReply = data?.reply ?? data?.response ?? data?.text ?? data?.content ?? '';
          const rawStr = typeof rawReply === 'string' ? rawReply : JSON.stringify(rawReply);
          grifos = parseGrifos(rawStr);
          if (grifos) break;
          console.warn(`Grifo mágico: parse failed attempt ${attempt + 1}, retrying...`);
        }

        if (grifos) {
          const payload = JSON.stringify(grifos);
          setLocalAiCache(tabelaNome, artigo.numero, 'grifo_magico', payload);
          // Save valid data to cache
          await supabase.from('artigo_ai_cache').upsert({
            tabela_codigo: tabelaNome,
            numero_artigo: artigo.numero,
            tipo: 'grifo_magico',
            conteudo: payload,
          }, { onConflict: 'tabela_codigo,numero_artigo,tipo' });
        }
      }

      if (grifos && grifos.length > 0) {
        setMagicHighlights(grifos);
        setMagicMode(true);
        // Persiste os N grifos IA:
        // 1) Mirror local (Dexie) para leitura offline instantânea.
        // 2) `artigos_grifos` no Supabase (1 linha por artigo com N highlights no JSON)
        //    → alimenta o badge "grifado" na lista e a página "Meus grifos".
        // 3) `artigos_anotacoes` no Supabase (N linhas, uma por grifo, com a
        //    explicação da IA) → alimenta o badge "anotado" e "Minhas anotações".
        try {
          const { db } = await import('@/services/offlineDb');
          const artigoId = `${tabelaNome}::${artigo.numero}`;
          const existing = await db.highlights.where('artigoId').equals(artigoId).toArray();
          const existingKeys = new Set<string>();
          for (const h of existing) {
            try {
              const d = JSON.parse(h.data);
              if (d?.origem === 'ia' && d?.text) existingKeys.add(`${d.text}::${d.cor || d.color}`);
            } catch { /* ignore */ }
          }
          const LABELS: Record<string, string> = {
            amarelo: 'Chave',
            verde: 'Exceção',
            azul: 'Efeito',
            rosa: 'Termo',
            laranja: 'Pegadinha',
          };
          const now = Date.now();
          const buildComment = (g: MagicGrifo) =>
            `${LABELS[g.cor] || 'Grifo IA'}: ${g.explicacao || ''}`.trim();
          const toInsert = grifos
            .map((g, i) => {
              const color = MAGIC_COLORS[g.cor] || MAGIC_COLORS.amarelo;
              return {
                id: `magic_${artigoId}_${g.cor}_${i}_${now}`,
                artigoId,
                data: JSON.stringify({
                  text: g.trechoExato,
                  color,
                  cor: color,
                  comment: buildComment(g),
                  comentario: buildComment(g),
                  categoria: LABELS[g.cor] || 'Grifo IA',
                  hierarquia: g.hierarquia,
                  origem: 'ia',
                  createdAt: now + i,
                }),
              };
            })
            .filter((item) => {
              try {
                const d = JSON.parse(item.data);
                return !existingKeys.has(`${d.text}::${d.cor}`);
              } catch {
                return true;
              }
            });
          if (toInsert.length > 0) await db.highlights.bulkPut(toInsert);

          // Sincronia com Supabase (best-effort — se offline ou sem sessão, o
          // mirror local acima já garante a UX).
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
              const highlightsPayload = grifos.map((g, i) => ({
                id: `ia_${g.cor}_${i}`,
                text: g.trechoExato,
                trechoExato: g.trechoExato,
                color: MAGIC_COLORS[g.cor] || MAGIC_COLORS.amarelo,
                cor: MAGIC_COLORS[g.cor] || MAGIC_COLORS.amarelo,
                corNome: g.cor,
                categoria: LABELS[g.cor] || 'Grifo IA',
                comment: buildComment(g),
                explicacao: g.explicacao,
                hierarquia: g.hierarquia,
                origem: 'ia',
                createdAt: now + i,
              }));

              // 1 linha por artigo com N highlights no array
              await supabase.from('artigos_grifos').upsert(
                {
                  user_id: user.id,
                  tabela_codigo: tabelaNome,
                  numero_artigo: artigo.numero,
                  artigo_id: artigoId,
                  highlights: highlightsPayload,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,tabela_codigo,numero_artigo' },
              );

              // N linhas em anotações — uma por grifo — com dedupe por texto.
              const { data: existingNotas } = await supabase
                .from('artigos_anotacoes')
                .select('anotacao')
                .eq('user_id', user.id)
                .eq('artigo_id', artigoId);
              const existingNotasSet = new Set(
                (existingNotas || []).map((n: any) => String(n.anotacao || '').trim()),
              );
              const notasRows = grifos
                .map((g) => ({
                  user_id: user.id,
                  tabela_codigo: tabelaNome,
                  numero_artigo: artigo.numero,
                  artigo_id: artigoId,
                  anotacao: buildComment(g),
                }))
                .filter((row) => row.anotacao && !existingNotasSet.has(row.anotacao));
              if (notasRows.length > 0) {
                const { error: notesInsertError } = await supabase.from('artigos_anotacoes').insert(notasRows);
                if (notesInsertError && notesInsertError.code !== '23505') throw notesInsertError;
              }
              // Só agora as linhas existem no banco: invalida o cache do sheet de
              // anotações (senão ele abre com o snapshot antigo, zerado) e recarrega a contagem.
              invalidateCache(anotacoesKey(tabelaNome, artigo.numero, user.id));
              onAnotacoesRefresh?.();
            }
          } catch (syncErr) {
            console.warn('grifo mágico: sync supabase falhou', syncErr);
            onAnotacoesRefresh?.();
          }

          toast.success(
            grifos.length === 1
              ? '1 grifo salvo com anotação'
              : `${grifos.length} grifos salvos com anotações`,
            { position: 'top-center' },
          );
        } catch (err) {
          console.warn('grifo mágico: falha ao salvar em anotações', err);
        }
      } else {
        console.warn('Grifo mágico: no valid highlights generated');
      }
    } catch (e) {
      console.error('Grifo mágico error:', e);
    } finally {
      setMagicLoading(false);
    }
  }, [magicMode, magicHighlights, artigo, tabelaNome, persistMagicHighlights, onAnotacoesRefresh]);

  const handleRemoveSingleMagicHighlight = useCallback((grifo: MagicGrifo) => {
    const next = magicHighlights.filter((g) => g.trechoExato !== grifo.trechoExato);
    setMagicHighlights(next);
    if (next.length === 0) {
      setMagicMode(false);
    }
    void persistMagicRemoval(next, [grifo]);
    if (tabelaNome && artigo?.numero) {
      writeArtigoGrifos(tabelaNome, String(artigo.numero), next.length > 0 ? (next as any) : []);
    }
    setMagicTooltip(null);
    import('@/lib/nativeHaptics').then(({ haptic }) => haptic.light()).catch(() => {});
    toast.success('Grifo removido', { duration: 1500 });
  }, [magicHighlights, persistMagicRemoval, tabelaNome, artigo?.numero]);

  return {
    magicMode,
    setMagicMode,
    magicHighlights,
    setMagicHighlights,
    magicLoading,
    magicTooltip,
    setMagicTooltip,
    grifoIaDefaultOn,
    setGrifoIaDefault,
    eraseSheetHighlights,
    persistMagicRemoval,
    persistMagicHighlights,
    handleRemoveGrifosByColor,
    handleClearAllGrifos,
    handleToggleMagic,
    handleRemoveSingleMagicHighlight,
  };
}
