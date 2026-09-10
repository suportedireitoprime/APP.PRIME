import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFlashcardsDashboard, useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { getAreaCover, prefetchAreaCovers } from '@/lib/areasDireitoCovers';
import { prefetchAprenderAula } from '@/lib/aprenderAulaPrefetch';
import { warmAprenderCache } from '@/lib/warmAprenderCache';
import {
  readAprenderHomeLocal,
  writeAprenderHomeLocal,
  pruneAprenderHomeLocal,
  type AprenderHomeData,
  type AprenderHomeAula,
} from '@/lib/aprenderHomeSnapshot';
import { EMPTY_HOME_DATA, onIdle } from './aprenderConstants';

// Cache em memória compartilhado para evitar qualquer flash durante navegação na sessão
let memoData: AprenderHomeData | null = null;
let memoUid: string | null | undefined;

export function useAprenderHome(uid: string | null, activeTab: 'aulas' | 'flashcards' | 'questoes') {
  const [data, setData] = useState<AprenderHomeData>(() => {
    if (memoData && memoUid === uid) return memoData;
    return readAprenderHomeLocal(uid) ?? EMPTY_HOME_DATA;
  });
  const [loading, setLoading] = useState(() => !(memoData && memoUid === uid) && !readAprenderHomeLocal(uid));
  const [filtro, setFiltro] = useState<'todas' | 'andamento'>('todas');
  const painted = useRef(false);

  const { data: flashDash } = useFlashcardsDashboard();
  const { data: flashAreas } = useFlashcardsResumoAreas();

  // Contagem direta de flashcards concluídos pelo usuário
  const { data: userFlashcardsProgressoCount } = useQuery({
    queryKey: ['user_flashcards_progresso_count', uid],
    queryFn: async () => {
      if (!uid) return 0;
      const { count, error } = await supabase
        .from('flashcards_progresso')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!uid,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    pruneAprenderHomeLocal();
  }, []);

  // Carga única e agregada no banco (stale-while-revalidate)
  useEffect(() => {
    let cancelled = false;

    if (!(memoData && memoUid === uid)) {
      const local = readAprenderHomeLocal(uid);
      if (local) {
        setData(local);
        setLoading(false);
      }
    }

    (async () => {
      const { data: res, error } = await supabase.rpc('aprender_home_resumo');
      if (cancelled || error || !res) {
        if (!cancelled) setLoading(false);
        return;
      }
      const next = res as unknown as AprenderHomeData;
      memoData = next;
      memoUid = uid;
      setData(next);
      setLoading(false);
      writeAprenderHomeLocal(uid, next);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Aquecimento leve em segundo plano após render inicial
  useEffect(() => {
    if (painted.current || !data.areas.length) return;
    painted.current = true;
    const handle = onIdle(() => {
      warmAprenderCache(uid);
      prefetchAreaCovers(data.areas);
      [...data.emAndamento.slice(0, 4), ...(data.proxima ? [data.proxima] : [])].forEach((a) =>
        prefetchAprenderAula(a.aulaId),
      );
    }, 1500);
    return () => {
      const cancel: any = (window as any).cancelIdleCallback;
      if (cancel) cancel(handle);
    };
  }, [data, uid]);

  const continuar: AprenderHomeAula[] = useMemo(() => {
    if (data.emAndamento.length) return data.emAndamento;
    return data.proxima ? [data.proxima] : [];
  }, [data]);

  const isAulas = activeTab === 'aulas';
  const isFlashcards = activeTab === 'flashcards';

  // Mapa de progresso de flashcards por área para ordenação e filtro
  const flashAreaProgressoMap = useMemo(() => {
    const map = new Map<string, number>();
    (flashAreas || []).forEach((fa) => {
      const concluidas = (fa.compreendidos || 0) + (fa.estudados || 0);
      if (fa.area_slug) map.set(fa.area_slug, concluidas);
      if (fa.area_nome) map.set(fa.area_nome.toLowerCase(), concluidas);
    });
    return map;
  }, [flashAreas]);

  const emAndamentoCount = useMemo(() => {
    if (isFlashcards) {
      return data.areas.filter((a) => {
        const p = (flashAreaProgressoMap.get(a.slug) || 0) + (flashAreaProgressoMap.get(a.nome.toLowerCase()) || 0);
        return p > 0;
      }).length;
    }
    return data.areas.filter((a) => a.pct > 0).length;
  }, [data.areas, isFlashcards, flashAreaProgressoMap]);

  const areasOrdenadas = useMemo(() => {
    const lista = [...data.areas];
    if (isFlashcards) {
      lista.sort((a, b) => {
        const aProg = (flashAreaProgressoMap.get(a.slug) || 0) + (flashAreaProgressoMap.get(a.nome.toLowerCase()) || 0);
        const bProg = (flashAreaProgressoMap.get(b.slug) || 0) + (flashAreaProgressoMap.get(b.nome.toLowerCase()) || 0);
        const ai = aProg > 0 ? 0 : 1;
        const bi = bProg > 0 ? 0 : 1;
        if (ai !== bi) return ai - bi;
        if (ai === 0 && bProg !== aProg) return bProg - aProg;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
      return filtro === 'andamento'
        ? lista.filter((a) => ((flashAreaProgressoMap.get(a.slug) || 0) + (flashAreaProgressoMap.get(a.nome.toLowerCase()) || 0)) > 0)
        : lista;
    }

    lista.sort((a, b) => {
      const ai = a.pct > 0 ? 0 : 1;
      const bi = b.pct > 0 ? 0 : 1;
      if (ai !== bi) return ai - bi;
      if (ai === 0 && b.pct !== a.pct) return b.pct - a.pct;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
    return filtro === 'andamento' ? lista.filter((a) => a.pct > 0) : lista;
  }, [data.areas, filtro, isFlashcards, flashAreaProgressoMap]);

  // Métricas robustas de flashcards com fallback para áreas e banco
  const flashAreasTotalCards = useMemo(() => {
    if (!flashAreas || !flashAreas.length) return 0;
    return flashAreas.reduce((acc, a) => acc + (a.total_cards || 0), 0);
  }, [flashAreas]);

  const flashAreasTotalConcluidas = useMemo(() => {
    if (!flashAreas || !flashAreas.length) return 0;
    return flashAreas.reduce((acc, a) => acc + (a.compreendidos || 0), 0);
  }, [flashAreas]);

  const totalFlashcards = useMemo(() => {
    if (flashDash?.total_cards && flashDash.total_cards > 0) return flashDash.total_cards;
    if (flashAreasTotalCards > 0) return flashAreasTotalCards;
    return 78077;
  }, [flashDash?.total_cards, flashAreasTotalCards]);

  const totalConcluidasFlashcards = useMemo(() => {
    const raw = Math.max(
      userFlashcardsProgressoCount ?? 0,
      flashDash?.compreendidos ?? 0,
      flashDash?.estudados ?? 0,
      flashAreasTotalConcluidas ?? 0,
    );
    return Math.min(totalFlashcards, Math.max(0, raw));
  }, [userFlashcardsProgressoCount, flashDash?.compreendidos, flashDash?.estudados, flashAreasTotalConcluidas, totalFlashcards]);

  const pct = useMemo(() => {
    if (isAulas) {
      const raw = Number(data.pctGeral) || 0;
      return Math.min(100, Math.max(0, Math.round(raw)));
    }
    if (isFlashcards) {
      if (!totalFlashcards || totalFlashcards <= 0) return 0;
      const safe = Math.round((totalConcluidasFlashcards / totalFlashcards) * 100);
      return Math.min(100, Math.max(0, isNaN(safe) ? 0 : safe));
    }
    return 0;
  }, [isAulas, isFlashcards, data.pctGeral, totalFlashcards, totalConcluidasFlashcards]);

  return {
    data,
    loading,
    filtro,
    setFiltro,
    continuar,
    areasOrdenadas,
    emAndamentoCount,
    flashAreas,
    totalFlashcards,
    totalConcluidasFlashcards,
    pct,
  };
}
