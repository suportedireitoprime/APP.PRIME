import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { QuestoesFiltro } from '@/components/questoes/QuestoesFiltroSheet';

const db = supabase as any;

/* ---------------------------------- Cadernos --------------------------------- */

export type Caderno = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  icone: string;
  filtros: QuestoesFiltro;
  total_estimado: number;
  created_at: string;
};

export function useCadernos() {
  const { user } = useAuth();
  const [cadernos, setCadernos] = useState<Caderno[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user) { setCadernos([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await db
      .from('questoes_cadernos')
      .select('*')
      .order('created_at', { ascending: false });
    setCadernos((data ?? []) as Caderno[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  const criar = useCallback(async (dados: Partial<Caderno>) => {
    if (!user) return null;
    const { data, error } = await db.from('questoes_cadernos').insert({
      user_id: user.id,
      nome: dados.nome ?? 'Novo caderno',
      descricao: dados.descricao ?? null,
      cor: dados.cor ?? '#8B5CF6',
      icone: dados.icone ?? 'notebook',
      filtros: dados.filtros ?? {},
      total_estimado: dados.total_estimado ?? 0,
    }).select().single();
    if (error) { console.error('[cadernos] criar', error); return null; }
    await carregar();
    return data as Caderno;
  }, [user, carregar]);

  const atualizar = useCallback(async (id: string, dados: Partial<Caderno>) => {
    await db.from('questoes_cadernos').update(dados).eq('id', id);
    await carregar();
  }, [carregar]);

  const remover = useCallback(async (id: string) => {
    await db.from('questoes_cadernos').delete().eq('id', id);
    await carregar();
  }, [carregar]);

  return { cadernos, loading, criar, atualizar, remover, recarregar: carregar };
}

/* ---------------------------------- Desafios --------------------------------- */

export type DesafioStatus = {
  desafio_id: string;
  ordem: number;
  titulo: string;
  subtitulo: string | null;
  nivel: string;
  meta_diaria: number;
  dias: number;
  cor: string;
  respondidas_hoje: number;
  dias_concluidos: number;
  status: string;
  desbloqueado: boolean;
  trilha: string;
  trilha_label: string;
  area: string | null;
};

export type Trilha = {
  slug: string;
  label: string;
  area: string | null;
  desafios: DesafioStatus[];
};

export function useDesafios() {
  const { user } = useAuth();
  const cacheKey = user ? `questoes_desafios_cache:${user.id}` : null;
  const [desafios, setDesafios] = useState<DesafioStatus[]>(() => {
    if (!cacheKey) return [];
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => desafios.length === 0);

  const carregar = useCallback(async () => {
    if (!user) { setDesafios([]); setLoading(false); return; }
    if (desafios.length === 0) setLoading(true);
    const { data, error } = await db.rpc('questoes_desafio_status');
    if (error) console.error('[desafios] status', error);
    const lista = (data ?? []) as DesafioStatus[];

    // Fecha o dia do desafio ativo de CADA trilha quando a meta do dia foi batida.
    const hojeISO = new Date().toISOString().slice(0, 10);
    const trilhas = Array.from(new Set(lista.map((d) => d.trilha)));
    const ativos = trilhas
      .map((t) => lista.find((d) => d.trilha === t && d.desbloqueado && d.status !== 'concluido'))
      .filter((d): d is DesafioStatus => !!d && d.respondidas_hoje >= d.meta_diaria);

    let mudou = false;
    for (const ativo of ativos) {
      const { data: prog } = await db
        .from('questoes_desafios_progresso')
        .select('*')
        .eq('desafio_id', ativo.desafio_id)
        .maybeSingle();

      if (prog && prog.ultimo_dia_contado === hojeISO) continue;

      const novosDias = Math.min((prog?.dias_concluidos ?? 0) + 1, ativo.dias);
      await db.from('questoes_desafios_progresso').upsert({
        id: prog?.id,
        user_id: user.id,
        desafio_id: ativo.desafio_id,
        dias_concluidos: novosDias,
        ultimo_dia_contado: hojeISO,
        status: novosDias >= ativo.dias ? 'concluido' : 'ativo',
        concluido_em: novosDias >= ativo.dias ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,desafio_id' });
      mudou = true;
    }

    const finalLista = mudou
      ? ((await db.rpc('questoes_desafio_status')).data ?? lista) as DesafioStatus[]
      : lista;

    setDesafios(finalLista);
    if (cacheKey && finalLista.length > 0) {
      try { localStorage.setItem(cacheKey, JSON.stringify(finalLista)); } catch {}
    }
    setLoading(false);
  }, [user, cacheKey, desafios.length]);

  useEffect(() => { carregar(); }, [carregar]);

  // Agrupa por trilha, mantendo "geral" primeiro.
  const trilhas: Trilha[] = [];
  for (const d of desafios) {
    let t = trilhas.find((x) => x.slug === d.trilha);
    if (!t) {
      t = { slug: d.trilha, label: d.trilha_label ?? d.trilha, area: d.area, desafios: [] };
      trilhas.push(t);
    }
    t.desafios.push(d);
  }
  trilhas.sort((a, b) => (a.slug === 'geral' ? -1 : b.slug === 'geral' ? 1 : a.label.localeCompare(b.label)));

  // Pendentes: o desafio ativo (liberado e não concluído) de cada trilha,
  // ordenado por quem está mais perto de concluir.
  const pendentes = trilhas
    .map((t) => t.desafios.find((d) => d.desbloqueado && d.status !== 'concluido'))
    .filter((d): d is DesafioStatus => !!d)
    .sort((a, b) => (b.dias_concluidos / b.dias) - (a.dias_concluidos / a.dias));

  const concluidos = desafios.filter((d) => d.status === 'concluido');

  return { desafios, trilhas, pendentes, concluidos, loading, recarregar: carregar };
}

