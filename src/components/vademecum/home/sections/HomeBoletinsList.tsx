// @ts-nocheck
import React, { memo, useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Play, Radio, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import radarLeisLocal from '@/assets/radares/radar-leis.webp';

const BoletimPlayer = lazy(() => import('@/components/boletim/BoletimPlayer'));

type Boletim = {
  id: string;
  data_ref: string;
  tipo: 'juridico' | 'noticias' | 'legislativo' | string;
  titulo: string;
  subtitulo: string | null;
  status: string;
  roteiro_json: any[];
  created_at: string;
  youtube_url?: string;
};

const TIPO_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  juridico: { label: 'Jurídico', color: '#FACC15', bg: 'rgba(250, 204, 21, 0.12)', border: 'rgba(250, 204, 21, 0.3)' },
  noticias: { label: 'Notícias', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  legislativo: { label: 'Legislativo', color: '#FB923C', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.3)' },
};

function getBoletimCover(b?: Boletim | null): string {
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

function formatData(dataRef?: string, createdAt?: string): string {
  if (!dataRef && !createdAt) return 'Recente';
  const raw = dataRef ? `${dataRef}T12:00:00` : createdAt;
  const d = new Date(raw);
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Hoje';
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

let boletinsCache: Boletim[] | null = null;

export const HomeBoletinsList: React.FC = () => {
  const navigate = useNavigate();
  const [boletins, setBoletins] = useState<Boletim[]>(() => boletinsCache || []);
  const [loading, setLoading] = useState<boolean>(!boletinsCache);
  const [playerAtivo, setPlayerAtivo] = useState<Boletim | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchBoletins = async () => {
      try {
        const { data, error } = await supabase
          .from('boletins_juridicos')
          .select('*')
          .eq('status', 'pronto')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data && mounted) {
          boletinsCache = data as Boletim[];
          setBoletins(data as Boletim[]);
        }
      } catch (err) {
        console.warn('[HomeBoletinsList] Erro ao carregar boletins:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBoletins();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePlay = useCallback((b: Boletim, e?: React.MouseEvent) => {
    e?.stopPropagation();
    haptic.selection();
    if (Array.isArray(b.roteiro_json) && b.roteiro_json.length > 0) {
      setPlayerAtivo(b);
    } else {
      navigate('/boletins');
    }
  }, [navigate]);

  if (!loading && boletins.length === 0) {
    return null;
  }

  return (
    <section className="pt-2 pb-6 space-y-3">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-5 rounded-full bg-[#38BDF8]" />
            BOLETINS & ATUALIZAÇÕES
          </h3>
          <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3 mt-0.5">
            Notícias jurídicas e informativos em áudio e vídeo
          </p>
        </div>

        <button
          onClick={() => {
            haptic.selection();
            navigate('/boletins');
          }}
          className="flex items-center gap-1 text-[12px] font-medium text-sky-400 hover:text-sky-300 transition-colors py-1 px-2 rounded-lg hover:bg-sky-500/10 active:scale-95 shrink-0"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

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
            const dataStr = formatData(item.data_ref, item.created_at);

            return (
              <div
                key={item.id}
                onClick={() => handlePlay(item)}
                className="group relative flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#18181B]/80 hover:bg-[#202024] active:bg-[#27272C] border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer shadow-lg shadow-black/30 overflow-hidden"
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
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {dataStr}
                    </span>
                  </div>

                  <h4 className="font-sans text-[13.5px] sm:text-[14px] font-semibold text-white/95 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h4>
                </div>

                {/* Botão de Ação Lateral */}
                <div className="shrink-0 pr-1">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                    <Radio className="w-4 h-4 text-sky-400" />
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

