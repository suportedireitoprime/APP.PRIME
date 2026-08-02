import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    db.from('questoes_cargos').select('*').eq('ativo', true).order('ordem')
      .then(({ data }: any) => { setCargos(data ?? []); setLoading(false); });
  }, []);
  return { cargos, loading };
}

export function useQuestoesAreas(nivel?: string | null, cargoId?: string | null) {
  const [areas, setAreas] = useState<{ area: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    db.rpc('questoes_areas', { _nivel: nivel ?? null, _cargo_id: cargoId ?? null })
      .then(({ data }: any) => { setAreas(data ?? []); setLoading(false); });
  }, [nivel, cargoId]);
  return { areas, loading };
}

/** Sem filtro de quantidade: traz todas as questões disponíveis. */
const SEM_LIMITE = 100000;

export type FiltroAvancado = {
  segmentos: string[]; disciplinas: string[]; assuntos: string[]; anos: string[];
  status: string; ordem: 'embaralhado' | 'original'; quantidade: number | null;
};

type SortearOpts = {
  nivel?: string | null;
  area?: string | null;
  cargoId?: string | null;
  /** Quantidade máxima. Ausente/0 = todas as questões disponíveis. */
  limite?: number;
  novas?: boolean;
  modo?: 'sortear' | 'revisar';
  /** Filtro avançado (sheet "Filtrar questões"). Tem prioridade sobre os demais. */
  filtro?: FiltroAvancado | null;
};

/** Carrega um bloco de questões e mantém o estado de resposta local. */
export function useQuestoesSessao(opts: SortearOpts) {
  const { user } = useAuth();
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(opts);
  const inicio = useRef<number>(Date.now());

  const carregar = useCallback(async () => {
    setLoading(true);
    const o = JSON.parse(key) as SortearOpts;
    const f = o.filtro;
    const { data, error } = f
      ? await db.rpc('questoes_filtrar', {
          _segmentos: f.segmentos?.length ? f.segmentos : null,
          _disciplinas: f.disciplinas?.length ? f.disciplinas : null,
          _assuntos: f.assuntos?.length ? f.assuntos : null,
          _anos: f.anos?.length ? f.anos.map(Number) : null,
          _bancas: null,
          _status: f.status ?? 'todos',
          _ordem: f.ordem ?? 'embaralhado',
          _limit: f.quantidade ?? SEM_LIMITE,
        })
      : o.modo === 'revisar'
      ? await db.rpc('questoes_para_revisar', { _limit: o.limite ?? SEM_LIMITE })
      : await db.rpc('questoes_sortear', {
          _nivel: o.nivel ?? null,
          _area: o.area ?? null,
          _cargo_id: o.cargoId ?? null,
          _limit: o.limite ?? SEM_LIMITE,
          _excluir_respondidas: !!o.novas,
        });

    if (error) console.error('[questoes] sortear', error);
    setQuestoes((data ?? []) as Questao[]);
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

  return { questoes, loading, recarregar: carregar, registrar };
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
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    db.rpc('questoes_desempenho').then(({ data }: any) => { setDados(data); setLoading(false); });
  }, [user]);
  return { dados, loading };
}
