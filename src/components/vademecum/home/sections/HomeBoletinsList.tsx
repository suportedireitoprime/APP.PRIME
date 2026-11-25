// @ts-nocheck
import React, { memo, useState, useMemo, useCallback, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Play, Radio, CheckCircle2 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import radarLeisLocal from '@/assets/radares/radar-leis.webp';
import HomeSectionHeader from './HomeSectionHeader';

const VISTOS_CACHE_KEY = 'boletins_vistos_cache_v1';

function readCachedVistos(): string[] {
  try {
    const raw = localStorage.getItem(VISTOS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedVistos(ids: string[]) {
  try {
    localStorage.setItem(VISTOS_CACHE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

const BoletimPlayer = lazy(() => import('@/components/boletim/BoletimPlayer'));

type Boletim = {
  id: string;
  data_ref: string;
  tipo: 'juridico' | 'noticias' | 'legislativo' | string;
  titulo: string;
  subtitulo: string | null;
  status: string;
  roteiro_json?: any[] | null;
  created_at: string;
  thumb_url?: string | null;
  thumbnail_url?: string | null;
  youtube_url?: string | null;
};

const TIPO_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  juridico: { label: 'Jurídico', color: '#FACC15', bg: 'rgba(250, 204, 21, 0.12)', border: 'rgba(250, 204, 21, 0.3)' },
  noticias: { label: 'Notícias', color: '#FB7185', bg: 'rgba(225, 29, 72, 0.14)', border: 'rgba(225, 29, 72, 0.35)' },
  legislativo: { label: 'Legislativo', color: '#FB923C', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.3)' },
};

function getBoletimCover(b?: Boletim | null): string {
  if (b?.thumbnail_url) return b.thumbnail_url;
  if (b?.thumb_url) return b.thumb_url;
  if (!b || !Array.isArray(b.roteiro_json) || b.roteiro_json.length === 0) {
    return radarLeisLocal;
  }
  const noticiaComImg = b.roteiro_json.find(
    (s: any) => s.kind !== 'intro' && s.imagem_url && !s.imagem_url.includes('00-slide.jpg')
  );
  if (noticiaComImg?.imagem_url) {
    return noticiaComImg.imagem_url;
  }
  const qualquer = b.roteiro_json.find((s: any) => s.kind !== 'intro' && s.imagem_url);
  return qualquer?.imagem_url || radarLeisLocal;
}

function getCleanTitle(titulo?: string | null): string {
  if (!titulo) return 'Boletim de Notícias';
  return titulo
    .replace(/^Boletim\s*(Jurídico|de Notícias|Legislativo)?\s*[-–—]?\s*/i, '')
    .trim() || 'Boletim de Notícias';
}

export const HomeBoletinsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playerAtivo, setPlayerAtivo] = useState<Boletim | null>(null);
  const [vistosIds, setVistosIds] = useState<string[]>(() => readCachedVistos());

  const vistosSet = useMemo(() => new Set(vistosIds), [vistosIds]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('boletim_visualizacoes')
          .select('boletim_id')
          .eq('user_id', user.id);
        if (!active || error || !Array.isArray(data)) return;
        const remoteIds = data.map((r: any) => String(r.boletim_id)).filter(Boolean);
        setVistosIds((prev) => {
          const merged = Array.from(new Set([...prev, ...remoteIds]));
          writeCachedVistos(merged);
          return merged;
        });
      } catch {
        /* fallback silencioso */
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const markAsSeen = useCallback((boletimId: string) => {
    setVistosIds((prev) => {
      if (prev.includes(boletimId)) return prev;
      const next = [...prev, boletimId];
      writeCachedVistos(next);
      return next;
    });
    if (user?.id) {
      void (supabase as any)
        .from('boletim_visualizacoes')
        .upsert(
          { user_id: user.id, boletim_id: boletimId, visto_em: new Date().toISOString() },
          { onConflict: 'user_id,boletim_id' },
        )
        .then(() => {})
        .catch(() => {});
    }
  }, [user?.id]);

  const { data: boletins = [], isLoading: loading, isError } = useQuery<Boletim[]>({
    queryKey: ['boletins_juridicos_home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boletins_juridicos')
        .select('id, data_ref, tipo, titulo, subtitulo, status, created_at, thumb_url, thumbnail_url, youtube_url')
        .in('status', ['pronto', 'sem_leis'])
        .order('data_ref', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as Boletim[];
    },
    retry: 1,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const handlePlay = useCallback(async (b: Boletim, e?: React.MouseEvent) => {
    e?.stopPropagation();
    haptic.selection();
    markAsSeen(b.id);
    if (Array.isArray(b.roteiro_json) && b.roteiro_json.length > 0) {
      setPlayerAtivo(b);
      return;
    }
    try {
      const { data } = await supabase
        .from('boletins_juridicos')
        .select('roteiro_json')
        .eq('id', b.id)
        .maybeSingle();
      const roteiro = Array.isArray(data?.roteiro_json) ? data.roteiro_json : [];
      if (roteiro.length > 0) {
        setPlayerAtivo({ ...b, roteiro_json: roteiro });
        return;
      }
    } catch {
      /* fallback para /boletins */
    }
    navigate('/boletins');
  }, [navigate]);

  if (isError || (!loading && boletins.length === 0)) {
    return null;
  }

  return (
    <section className="space-y-3.5">
      <HomeSectionHeader
        title="BOLETINS"
        subtitle="Notícias jurídicas e informativos em áudio e vídeo"
        actionLabel="Ver todos"
        onAction={() => navigate('/boletins')}
      />

      {/* Lista Vertical de Boletins */}
      <div className="space-y-2.5">
        {loading ? (
          // Skeletons de Carregamento
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[84px] rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse"
            />
          ))
        ) : (
          boletins.map((item) => {
            const cover = getBoletimCover(item);
            const title = getCleanTitle(item.titulo);
            const style = TIPO_STYLES[item.tipo] || TIPO_STYLES.noticias;
            const isSeen = vistosSet.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handlePlay(item)}
                className="group relative flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-card hover:bg-secondary/60 border border-border/60 transition-colors duration-200 cursor-pointer shadow-sm overflow-hidden"
              >
                {/* Capa com Thumbnail 16:9 e Botão Play Flutuante */}
                <div className="relative w-[100px] sm:w-[110px] h-[66px] rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                  <img
                    src={cover}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Ícone de Play centralizado na miniatura */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all">
                      <Play className="w-3.5 h-3.5 text-white ml-0.5 fill-white" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo textual */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border leading-none"
                      style={{ color: style.color, backgroundColor: style.bg, borderColor: style.border }}
                    >
                      {style.label}
                    </span>
                    {isSeen && (
                      <span
                        className="inline-flex items-center text-emerald-400"
                        title="Boletim já visto"
                        aria-label="Boletim já visto"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2.4} />
                      </span>
                    )}
                  </div>

                  <h4 className="font-sans text-[13.5px] sm:text-[14px] font-semibold text-white/95 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h4>
                </div>

                {/* Botão de Ação Lateral */}
                <div className="shrink-0 pr-1">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                    <Radio className="w-4 h-4 text-rose-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Player Flutuante do Boletim */}
      {playerAtivo && (
        <Suspense fallback={null}>
          <BoletimPlayer
            boletimId={playerAtivo.id}
            scenes={playerAtivo.roteiro_json || []}
            youtubeUrl={playerAtivo.youtube_url}
            dataRef={playerAtivo.data_ref}
            onClose={() => setPlayerAtivo(null)}
          />
        </Suspense>
      )}
    </section>
  );
};

export default memo(HomeBoletinsList);
