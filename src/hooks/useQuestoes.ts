import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessaoById } from '@/lib/questoesSessoes';
import { useAuth } from '@/hooks/useAuth';

export type Questao = {
  id: string;
  cargo: string | null;
  cargo_id: string | null;
  nivel: string;
  disciplina: string | null;
  assunto: string | null;
  tema_central: string | null;
  ano: number | null;
  banca: string | null;
  orgao: string | null;
  prova: string | null;
  texto_associado: string | null;
  imagem_url: string | null;
  enunciado: string;
  alt_a: string | null;
  alt_b: string | null;
  alt_c: string | null;
  alt_d: string | null;
  alt_e: string | null;
  gabarito_oficial: string | null;
  gabarito_comentado: string | null;
  comentario_ia: string | null;
};

export type Cargo = {
  id: string; nome: string; slug: string; cor: string; icone: string; total_questoes: number;
};

const db = supabase as any;

export function useQuestoesCargos() {
  const [cargos, setCargos] = useState<Cargo[]>(() => {
    try {
      const cached = localStorage.getItem('questoes_cargos_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => cargos.length === 0);

  useEffect(() => {
    db.from('questoes_cargos').select('*').eq('ativo', true).order('ordem')
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setCargos(data);
          try { localStorage.setItem('questoes_cargos_cache', JSON.stringify(data)); } catch {}
        }
        setLoading(false);
      });
  }, []);
  return { cargos, loading };
}
import { bundle, withBundleFallback } from '@/services/offlineBundle';

export function useQuestoesAreas(nivel?: string | null, cargoId?: string | null) {
  const cacheKey = `questoes_areas_cache:${nivel ?? 'todos'}:${cargoId ?? 'todos'}`;
  const [areas, setAreas] = useState<{ area: string; total: number }[]>(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => areas.length === 0);

  useEffect(() => {
    if (areas.length === 0) setLoading(true);

    const onlineReq = db.rpc('questoes_areas', { _nivel: nivel ?? null, _cargo_id: cargoId ?? null })
      .then(({ data }) => data);

    // Fallback: se online falhar ou vier vazio (e.g. offline), usa o bundle instantâneo
    withBundleFallback(
      onlineReq,
      () => bundle.questoesAreas()
    ).then((data: any) => {
      if (data) {
        setAreas(data);
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
      }
      setLoading(false);
    });
  }, [nivel, cargoId]);
  return { areas, loading };
}

/** Limite padrão otimizado por bloco de prática (super rápido e leve). */
const LIMITE_PADRAO = 50;

export type FiltroAvancado = {
  segmentos: string[]; disciplinas: string[]; assuntos: string[]; anos: string[];
  status: string; ordem: 'embaralhado' | 'original'; quantidade: number | null;
};

type SortearOpts = {
  nivel?: string | null;
  area?: string | null;
  cargoId?: string | null;
  /** Quantidade máxima por bloco. Ausente/0 = 50 questões otimizadas. */
  limite?: number;
  novas?: boolean;
  modo?: 'sortear' | 'revisar';
  /** Filtro avançado (sheet "Filtrar questões"). Tem prioridade sobre os demais. */
  filtro?: FiltroAvancado | null;
  sessaoId?: string | null;
};

/** Carrega um bloco de questões e mantém o estado de resposta local. */
export function useQuestoesSessao(opts: SortearOpts) {
  const { user } = useAuth();
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(opts);
  const inicio = useRef<number>(Date.now());

  const [sessaoIdAtiva, setSessaoIdAtiva] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const o = JSON.parse(key) as SortearOpts;
    
    // Se foi passado um ID de sessão, carrega do histórico local
    if (o.sessaoId) {
      const sessao = getSessaoById(o.sessaoId);
      if (sessao && sessao.questoes && sessao.questoes.length > 0) {
        setQuestoes(sessao.questoes);
        setSessaoIdAtiva(sessao.id);
        inicio.current = Date.now();
        setLoading(false);
        return;
      }
    }

    const f = o.filtro;
    const { data, error } = f
      ? await db.rpc('questoes_filtrar', {
          _segmentos: f.segmentos?.length ? f.segmentos : null,
          _disciplinas: f.disciplinas?.length ? f.disciplinas : null,
          _assuntos: f.assuntos?.length ? f.assuntos : null,
          _anos: f.anos?.length ? f.anos.map(Number) : null,
          _bancas: null,
        })
      : o.modo === 'revisar'
      ? await db.rpc('questoes_para_revisar', { _limit: o.limite ?? LIMITE_PADRAO })
      : await db.rpc('questoes_sortear', {
          _nivel: o.nivel ?? null,
          _area: o.area ?? null,
          _cargo_id: o.cargoId ?? null,
          _limit: o.limite ?? LIMITE_PADRAO,
          _excluir_respondidas: !!o.novas,
        });

    if (error) console.error('[questoes] sortear', error);
    
    let res = (data ?? []) as Questao[];
    
    // Aplica o limite e ordem localmente para o filtro (pois a func SQL antiga não tem os parâmetros novos)
    if (f) {
      const limit = f?.quantidade && f.quantidade > 0 ? f.quantidade : LIMITE_PADRAO;
      if (f.ordem === 'embaralhado') {
        res = res.sort(() => Math.random() - 0.5);
      }
      if (res.length > limit) {
        res = res.slice(0, limit);
      }
    }

    setQuestoes(res);
    setSessaoIdAtiva(Date.now().toString());
    inicio.current = Date.now();
    setLoading(false);
  }, [key]);

  useEffect(() => { carregar(); }, [carregar]);

  const registrar = useCallback(async (questaoId: string, alternativa: string, acertou: boolean, contexto = 'pratica') => {
    if (!user) return;
    const tempo = Date.now() - inicio.current;
    inicio.current = Date.now();
    await db.from('questoes_respostas').insert({
      user_id: user.id, questao_id: questaoId, alternativa, acertou, tempo_ms: tempo, contexto,
    });
  }, [user]);

  return { questoes, loading, recarregar: carregar, registrar, sessaoIdAtiva };
}

/** Gera (ou lê do cache) o comentário da IA de uma questão. */
export async function comentarioIA(questao: Questao): Promise<string | null> {
  if (questao.comentario_ia) return questao.comentario_ia;
  const { data, error } = await supabase.functions.invoke('questoes-comentario-ia', {
    body: { questaoId: questao.id },
  });
  if (error) { console.error('[questoes] comentario IA', error); return questao.gabarito_comentado ?? null; }
  return (data as any)?.comentario ?? questao.gabarito_comentado ?? null;
}

export function useQuestoesDesempenho() {
  const { user } = useAuth();
  const cacheKey = user ? `questoes_desempenho_cache:${user.id}` : null;
  const [dados, setDados] = useState<any>(() => {
    if (!cacheKey) return null;
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !dados);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    db.rpc('questoes_desempenho').then(({ data }: any) => {
      if (data) {
        setDados(data);
        if (cacheKey) {
          try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        }
      }
      setLoading(false);
    });
  }, [user, cacheKey]);
  return { dados, loading };
}
