import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import type { AnimacaoHomeItem } from '@/data/animacoesTypes';
import { useAnimacoesVistas } from '@/hooks/useAnimacoesVistas';

export { useAnimacoesVistas };

export interface AnimacaoComentario {
  id: string;
  animacao_slug: string;
  user_id: string;
  autor_nome: string;
  texto: string;
  created_at: string;
}

export interface AnimacaoStats {
  media: number;
  totalVotos: number;
  totalFavoritos: number;
  totalComentarios: number;
  minhaNota: number | null;
  favoritada: boolean;
  visto: boolean;
}

export interface AnimacaoRankingEntry {
  slug: string;
  media: number;
  totalVotos: number;
  totalFavoritos: number;
  totalComentarios: number;
}

interface ResumoRpcRow {
  animacao_slug: string;
  media: number;
  total_votos: number;
  total_favoritos: number;
  total_comentarios: number;
  minha_nota: number | null;
  favoritada: boolean;
}

// Tabelas/RPC criadas via migrations 20261128013000, 20261128103000 e 20261128113000
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string) => Promise<{ data: ResumoRpcRow[] | null; error: unknown }>;
};

const EMPTY_STATS: AnimacaoStats = {
  media: 0,
  totalVotos: 0,
  totalFavoritos: 0,
  totalComentarios: 0,
  minhaNota: null,
  favoritada: false,
  visto: false,
};

export function useAnimacoesInteracoes(
  catalog: AnimacaoHomeItem[],
  activeSlug?: string
) {
  const { userId, vistasSet, marcarComoVista } = useAnimacoesVistas();
  const [userName, setUserName] = useState<string>('Estudante');
  const [resumoRows, setResumoRows] = useState<Record<string, ResumoRpcRow>>({});
  const [comentarios, setComentarios] = useState<AnimacaoComentario[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const u = data?.session?.user;
      const meta = (u?.user_metadata || {}) as Record<string, unknown>;
      const nome =
        (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
        (typeof meta.name === 'string' && meta.name.trim()) ||
        (u?.email ? u.email.split('@')[0] : 'Estudante');
      setUserName(nome);
    });
    return () => {
      active = false;
    };
  }, []);

  const carregarResumo = useCallback(async () => {
    setLoadingStats(true);
    try {
      const { data, error } = await db.rpc('get_animacoes_resumo');
      if (!error && Array.isArray(data)) {
        const next: Record<string, ResumoRpcRow> = {};
        for (const r of data) {
          next[r.animacao_slug] = {
            animacao_slug: r.animacao_slug,
            media: Number(r.media || 0),
            total_votos: Number(r.total_votos || 0),
            total_favoritos: Number(r.total_favoritos || 0),
            total_comentarios: Number(r.total_comentarios || 0),
            minha_nota: r.minha_nota !== null && r.minha_nota !== undefined ? Number(r.minha_nota) : null,
            favoritada: Boolean(r.favoritada),
          };
        }
        setResumoRows(next);
      }
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void carregarResumo();
  }, [carregarResumo]);

  useEffect(() => {
    if (!activeSlug) {
      setComentarios([]);
      return;
    }
    let active = true;
    setLoadingComentarios(true);
    db.from('animacoes_comentarios')
      .select('id,animacao_slug,user_id,autor_nome,texto,created_at')
      .eq('animacao_slug', activeSlug)
      .order('created_at', { ascending: false })
      .then(({ data, error }: { data: AnimacaoComentario[] | null; error: unknown }) => {
        if (!active) return;
        if (!error && Array.isArray(data)) {
          setComentarios(data);
        }
        setLoadingComentarios(false);
      });
    return () => {
      active = false;
    };
  }, [activeSlug]);

  const statsMap = useMemo(() => {
    const map: Record<string, AnimacaoStats> = {};
    for (const item of catalog) {
      const row = resumoRows[item.slug];
      map[item.slug] = row
        ? {
            media: row.media,
            totalVotos: row.total_votos,
            totalFavoritos: row.total_favoritos,
            totalComentarios: row.total_comentarios,
            minhaNota: row.minha_nota,
            favoritada: row.favoritada,
            visto: vistasSet.has(item.slug),
          }
        : {
            ...EMPTY_STATS,
            visto: vistasSet.has(item.slug),
          };
    }
    return map;
  }, [catalog, resumoRows, vistasSet]);

  const ranking = useMemo<AnimacaoRankingEntry[]>(() => {
    return catalog
      .map((item) => {
        const s = statsMap[item.slug] || EMPTY_STATS;
        return {
          slug: item.slug,
          media: s.media,
          totalVotos: s.totalVotos,
          totalFavoritos: s.totalFavoritos,
          totalComentarios: s.totalComentarios,
        };
      })
      .sort((a, b) => {
        if (b.media !== a.media) return b.media - a.media;
        if (b.totalVotos !== a.totalVotos) return b.totalVotos - a.totalVotos;
        if (b.totalFavoritos !== a.totalFavoritos) return b.totalFavoritos - a.totalFavoritos;
        return b.totalComentarios - a.totalComentarios;
      });
  }, [catalog, statsMap]);

  const avaliar = useCallback(
    async (slug: string, nota: number) => {
      if (!userId) {
        toast.info('Entre na sua conta para avaliar esta animação.');
        return;
      }
      haptic.impact('light');
      const prev = resumoRows;
      setResumoRows((cur) => {
        const atual = cur[slug] || {
          animacao_slug: slug,
          media: 0,
          total_votos: 0,
          total_favoritos: 0,
          total_comentarios: 0,
          minha_nota: null,
          favoritada: false,
        };
        const tinhaNota = atual.minha_nota !== null;
        const novoTotal = tinhaNota ? atual.total_votos : atual.total_votos + 1;
        const somaAnterior = atual.media * atual.total_votos - (atual.minha_nota || 0);
        const novaMedia = novoTotal > 0 ? Number(((somaAnterior + nota) / novoTotal).toFixed(1)) : nota;
        return {
          ...cur,
          [slug]: { ...atual, minha_nota: nota, total_votos: novoTotal, media: novaMedia },
        };
      });

      const { error } = await db
        .from('animacoes_avaliacoes')
        .upsert(
          { animacao_slug: slug, user_id: userId, nota, updated_at: new Date().toISOString() },
          { onConflict: 'animacao_slug,user_id' }
        );

      if (error) {
        setResumoRows(prev);
        toast.error('Não foi possível salvar sua avaliação.');
        return;
      }
      toast.success(`Avaliação ${nota}/5 salva!`);
    },
    [userId, resumoRows]
  );

  const toggleFavorito = useCallback(
    async (slug: string) => {
      if (!userId) {
        toast.info('Entre na sua conta para favoritar animações.');
        return;
      }
      haptic.selection();
      const atual = resumoRows[slug];
      const jaFavorita = Boolean(atual?.favoritada);
      const prev = resumoRows;

      setResumoRows((cur) => {
        const base = cur[slug] || {
          animacao_slug: slug,
          media: 0,
          total_votos: 0,
          total_favoritos: 0,
          total_comentarios: 0,
          minha_nota: null,
          favoritada: false,
        };
        return {
          ...cur,
          [slug]: {
            ...base,
            favoritada: !jaFavorita,
            total_favoritos: Math.max(0, base.total_favoritos + (jaFavorita ? -1 : 1)),
          },
        };
      });

      if (jaFavorita) {
        const { error } = await db
          .from('animacoes_favoritos')
          .delete()
          .eq('animacao_slug', slug)
          .eq('user_id', userId);
        if (error) {
          setResumoRows(prev);
          toast.error('Erro ao remover dos favoritos.');
          return;
        }
        toast.success('Removida dos favoritos.');
      } else {
        const { error } = await db
          .from('animacoes_favoritos')
          .insert({ animacao_slug: slug, user_id: userId });
        if (error) {
          setResumoRows(prev);
          toast.error('Erro ao favoritar animação.');
          return;
        }
        toast.success('Adicionada aos favoritos!');
      }
    },
    [userId, resumoRows]
  );

  const enviarComentario = useCallback(
    async (slug: string, textoBruto: string): Promise<boolean> => {
      if (!userId) {
        toast.info('Entre na sua conta para comentar.');
        return false;
      }
      const texto = textoBruto.trim();
      if (!texto) return false;

      setEnviandoComentario(true);
      try {
        const { data, error } = await db
          .from('animacoes_comentarios')
          .insert({
            animacao_slug: slug,
            user_id: userId,
            autor_nome: userName,
            texto,
          })
          .select('id,animacao_slug,user_id,autor_nome,texto,created_at')
          .single();

        if (error || !data) {
          toast.error('Não foi possível publicar o comentário.');
          return false;
        }

        haptic.impact('light');
        setComentarios((cur) => [data as AnimacaoComentario, ...cur]);
        setResumoRows((cur) => {
          const base = cur[slug] || {
            animacao_slug: slug,
            media: 0,
            total_votos: 0,
            total_favoritos: 0,
            total_comentarios: 0,
            minha_nota: null,
            favoritada: false,
          };
          return { ...cur, [slug]: { ...base, total_comentarios: base.total_comentarios + 1 } };
        });
        toast.success('Comentário publicado!');
        return true;
      } finally {
        setEnviandoComentario(false);
      }
    },
    [userId, userName]
  );

  const excluirComentario = useCallback(
    async (id: string, slug: string) => {
      if (!userId) return;
      const prevCom = comentarios;
      const prevRows = resumoRows;
      setComentarios((cur) => cur.filter((c) => c.id !== id));
      setResumoRows((cur) => {
        const base = cur[slug];
        if (!base) return cur;
        return { ...cur, [slug]: { ...base, total_comentarios: Math.max(0, base.total_comentarios - 1) } };
      });

      const { error } = await db
        .from('animacoes_comentarios')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        setComentarios(prevCom);
        setResumoRows(prevRows);
        toast.error('Não foi possível excluir o comentário.');
        return;
      }
      toast.success('Comentário excluído.');
    },
    [userId, comentarios, resumoRows]
  );

  return {
    userId,
    vistasSet,
    statsMap,
    ranking,
    comentarios,
    loadingStats,
    loadingComentarios,
    enviandoComentario,
    avaliar,
    toggleFavorito,
    enviarComentario,
    excluirComentario,
    marcarComoVista,
  };
}
