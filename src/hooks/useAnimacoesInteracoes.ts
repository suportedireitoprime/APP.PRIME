import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import type { AnimacaoItem } from '@/data/animacoesTypes';

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

interface AvaliacaoRow {
  animacao_slug: string;
  user_id: string;
  nota: number;
}

interface FavoritoRow {
  animacao_slug: string;
  user_id: string;
}

interface ComentarioCountRow {
  animacao_slug: string;
}

interface VisualizacaoRow {
  animacao_slug: string;
}

// Tabelas criadas via migrations 20261128013000 e 20261128103000
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

const EMPTY_STATS: AnimacaoStats = {
  media: 0,
  totalVotos: 0,
  totalFavoritos: 0,
  totalComentarios: 0,
  minhaNota: null,
  favoritada: false,
  visto: false,
};

// Snapshot em memória para sincronizar vistas instantaneamente entre Home e /animacoes
let vistasMemorySet = new Set<string>();
let vistasLoadedUserId: string | null = null;
const vistasListeners = new Set<() => void>();

function notifyVistas() {
  for (const fn of vistasListeners) fn();
}

export function useAnimacoesVistas() {
  const [userId, setUserId] = useState<string | null>(null);
  const [vistasSet, setVistasSet] = useState<Set<string>>(() => new Set(vistasMemorySet));

  useEffect(() => {
    const sync = () => setVistasSet(new Set(vistasMemorySet));
    vistasListeners.add(sync);
    return () => {
      vistasListeners.delete(sync);
    };
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        if (vistasLoadedUserId !== null) {
          vistasMemorySet = new Set();
          vistasLoadedUserId = null;
          notifyVistas();
        }
        return;
      }
      if (vistasLoadedUserId === uid) return;
      const { data: rows, error } = await db
        .from('animacoes_visualizacoes')
        .select('animacao_slug')
        .eq('user_id', uid);
      if (!active) return;
      if (!error && Array.isArray(rows)) {
        vistasMemorySet = new Set((rows as VisualizacaoRow[]).map((r) => r.animacao_slug));
        vistasLoadedUserId = uid;
        notifyVistas();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const marcarComoVista = useCallback(
    async (slug: string) => {
      if (!slug || vistasMemorySet.has(slug)) return;
      vistasMemorySet = new Set(vistasMemorySet).add(slug);
      notifyVistas();

      if (!userId) return;
      await db.from('animacoes_visualizacoes').upsert(
        { animacao_slug: slug, user_id: userId, visto_em: new Date().toISOString() },
        { onConflict: 'animacao_slug,user_id' }
      );
    },
    [userId]
  );

  return { userId, vistasSet, marcarComoVista };
}

export function useAnimacoesInteracoes(
  catalog: AnimacaoItem[],
  activeSlug?: string
) {
  const { userId, vistasSet, marcarComoVista } = useAnimacoesVistas();
  const [userName, setUserName] = useState<string>('Estudante');
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoRow[]>([]);
  const [favoritos, setFavoritos] = useState<FavoritoRow[]>([]);
  const [comentariosCount, setComentariosCount] = useState<Record<string, number>>({});
  const [comentarios, setComentarios] = useState<AnimacaoComentario[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const u = data?.user;
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
      const [avRes, favRes, comRes] = await Promise.all([
        db.from('animacoes_avaliacoes').select('animacao_slug,user_id,nota'),
        db.from('animacoes_favoritos').select('animacao_slug,user_id'),
        db.from('animacoes_comentarios').select('animacao_slug'),
      ]);

      if (!avRes.error && Array.isArray(avRes.data)) {
        setAvaliacoes(avRes.data as AvaliacaoRow[]);
      }
      if (!favRes.error && Array.isArray(favRes.data)) {
        setFavoritos(favRes.data as FavoritoRow[]);
      }
      if (!comRes.error && Array.isArray(comRes.data)) {
        const counts: Record<string, number> = {};
        for (const row of comRes.data as ComentarioCountRow[]) {
          counts[row.animacao_slug] = (counts[row.animacao_slug] || 0) + 1;
        }
        setComentariosCount(counts);
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
      map[item.slug] = {
        ...EMPTY_STATS,
        totalComentarios: comentariosCount[item.slug] || 0,
        visto: vistasSet.has(item.slug),
      };
    }

    const somas: Record<string, number> = {};
    for (const av of avaliacoes) {
      if (!map[av.animacao_slug]) {
        map[av.animacao_slug] = { ...EMPTY_STATS, visto: vistasSet.has(av.animacao_slug) };
      }
      map[av.animacao_slug].totalVotos += 1;
      somas[av.animacao_slug] = (somas[av.animacao_slug] || 0) + Number(av.nota);
      if (userId && av.user_id === userId) {
        map[av.animacao_slug].minhaNota = Number(av.nota);
      }
    }

    for (const slug of Object.keys(somas)) {
      const votos = map[slug].totalVotos;
      map[slug].media = votos > 0 ? Number((somas[slug] / votos).toFixed(1)) : 0;
    }

    for (const fav of favoritos) {
      if (!map[fav.animacao_slug]) {
        map[fav.animacao_slug] = { ...EMPTY_STATS, visto: vistasSet.has(fav.animacao_slug) };
      }
      map[fav.animacao_slug].totalFavoritos += 1;
      if (userId && fav.user_id === userId) {
        map[fav.animacao_slug].favoritada = true;
      }
    }

    return map;
  }, [catalog, avaliacoes, favoritos, comentariosCount, userId, vistasSet]);

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
      const prev = avaliacoes;
      setAvaliacoes((cur) => {
        const filtered = cur.filter((r) => !(r.animacao_slug === slug && r.user_id === userId));
        return [...filtered, { animacao_slug: slug, user_id: userId, nota }];
      });

      const { error } = await db
        .from('animacoes_avaliacoes')
        .upsert(
          { animacao_slug: slug, user_id: userId, nota, updated_at: new Date().toISOString() },
          { onConflict: 'animacao_slug,user_id' }
        );

      if (error) {
        setAvaliacoes(prev);
        toast.error('Não foi possível salvar sua avaliação.');
        return;
      }
      toast.success(`Avaliação ${nota}/5 salva!`);
    },
    [userId, avaliacoes]
  );

  const toggleFavorito = useCallback(
    async (slug: string) => {
      if (!userId) {
        toast.info('Entre na sua conta para favoritar animações.');
        return;
      }
      haptic.selection();
      const jaFavorita = favoritos.some((f) => f.animacao_slug === slug && f.user_id === userId);
      const prev = favoritos;

      if (jaFavorita) {
        setFavoritos((cur) => cur.filter((f) => !(f.animacao_slug === slug && f.user_id === userId)));
        const { error } = await db
          .from('animacoes_favoritos')
          .delete()
          .eq('animacao_slug', slug)
          .eq('user_id', userId);
        if (error) {
          setFavoritos(prev);
          toast.error('Erro ao remover dos favoritos.');
          return;
        }
        toast.success('Removida dos favoritos.');
      } else {
        setFavoritos((cur) => [...cur, { animacao_slug: slug, user_id: userId }]);
        const { error } = await db
          .from('animacoes_favoritos')
          .insert({ animacao_slug: slug, user_id: userId });
        if (error) {
          setFavoritos(prev);
          toast.error('Erro ao favoritar animação.');
          return;
        }
        toast.success('Adicionada aos favoritos!');
      }
    },
    [userId, favoritos]
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
        setComentariosCount((cur) => ({ ...cur, [slug]: (cur[slug] || 0) + 1 }));
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
      const prev = comentarios;
      setComentarios((cur) => cur.filter((c) => c.id !== id));
      setComentariosCount((cur) => ({ ...cur, [slug]: Math.max(0, (cur[slug] || 1) - 1) }));

      const { error } = await db
        .from('animacoes_comentarios')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        setComentarios(prev);
        setComentariosCount((cur) => ({ ...cur, [slug]: (cur[slug] || 0) + 1 }));
        toast.error('Não foi possível excluir o comentário.');
        return;
      }
      toast.success('Comentário excluído.');
    },
    [userId, comentarios]
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
