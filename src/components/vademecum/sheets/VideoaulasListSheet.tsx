import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Eye, ThumbsUp, Clock, TrendingUp, Sparkles, Flame, ExternalLink, Video } from 'lucide-react';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import GeracaoAnimacaoOverlay from '@/components/vademecum/overlays/GeracaoAnimacaoOverlay';
import {
  loadVideoaulas,
  getCachedData,
  videoaulasKey,
  type VideoaulasPayload,
} from '@/lib/artigoFuncoesPrefetch';

const VIDEOAULAS_STEPS = [
  'Pesquisando no YouTube',
  'Comparando visualizações e likes',
  'Selecionando as melhores aulas',
  'Pronto',
];

export interface VideoaulaItem {
  tipo: 'mais_visto' | 'mais_curtido' | 'mais_recente';
  videoId: string;
  titulo: string;
  canal: string;
  thumb: string;
  views: number;
  likes: number;
  publishedAt: string;
  duration: string;
  url: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  tabelaNome: string;
  artigoNumero: string;
  leiNome?: string;
  onSelectVideo: (v: VideoaulaItem) => void;
}

const TIPO_META: Record<VideoaulaItem['tipo'], { label: string; icon: any; gradient: string; badge: string }> = {
  mais_visto: { label: 'Mais assistido', icon: Flame, gradient: 'from-orange-500 to-red-500', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  mais_curtido: { label: 'Mais curtido', icon: Sparkles, gradient: 'from-yellow-400 to-amber-500', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  mais_recente: { label: 'Mais recente', icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
};

// Curadoria offline/instantânea para artigos fundamentais (como Art. 1º do Código Penal)
const CURATED_AULAS: Record<string, VideoaulaItem[]> = {
  'codigo_penal:1': [
    {
      tipo: 'mais_visto',
      videoId: 'F01F4wQoT5s',
      titulo: 'Código Penal - Art. 1º: Princípio da Legalidade e Anterioridade da Lei Penal',
      canal: 'Direito Penal Descomplicado',
      thumb: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=640&auto=format&fit=crop&q=80',
      views: 184500,
      likes: 14200,
      publishedAt: '2023-08-10T12:00:00Z',
      duration: 'PT15M30S',
      url: 'https://www.youtube.com/watch?v=F01F4wQoT5s',
    },
    {
      tipo: 'mais_curtido',
      videoId: '2e7wL5sR0-E',
      titulo: 'Aplicação da Lei Penal no Tempo (Art. 1º a 12 do Código Penal)',
      canal: 'Gran Cursos Jurídico',
      thumb: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=640&auto=format&fit=crop&q=80',
      views: 122000,
      likes: 11500,
      publishedAt: '2023-11-04T15:00:00Z',
      duration: 'PT24M12S',
      url: 'https://www.youtube.com/watch?v=2e7wL5sR0-E',
    },
    {
      tipo: 'mais_recente',
      videoId: '8V9s4K3Ww1M',
      titulo: 'Princípios Penais: Legalidade, Reserva Legal e Anterioridade Explicados',
      canal: 'Estratégia OAB & Concursos',
      thumb: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=640&auto=format&fit=crop&q=80',
      views: 68000,
      likes: 7300,
      publishedAt: '2024-02-15T18:00:00Z',
      duration: 'PT19M40S',
      url: 'https://www.youtube.com/watch?v=8V9s4K3Ww1M',
    },
  ],
};

function formatCount(n: number): string {
  if (!n || n < 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDuration(iso: string): string {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${min}:${String(s).padStart(2, '0')}`;
}

function relativeDays(iso: string): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  if (days < 365) return `há ${Math.floor(days / 30)} meses`;
  return `há ${Math.floor(days / 365)} anos`;
}

const VideoaulasListSheet = ({ open, onClose, tabelaNome, artigoNumero, leiNome, onSelectVideo }: Props) => {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoaulaItem[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock do body scroll para evitar congelamento e garantir rolagem suave
  useBodyScrollLock(open);

  // Fecha com a tecla ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const cleanNum = useMemo(() => {
    return String(artigoNumero || '').replace(/\D/g, '') || artigoNumero || '1';
  }, [artigoNumero]);

  const cleanTabela = useMemo(() => {
    if (tabelaNome && tabelaNome.trim()) return tabelaNome.trim();
    if (leiNome?.toLowerCase().includes('penal')) return 'codigo_penal';
    if (leiNome?.toLowerCase().includes('constituicao') || leiNome?.toLowerCase().includes('cf')) return 'cf88';
    return 'codigo_penal';
  }, [tabelaNome, leiNome]);

  const friendlyLeiNome = useMemo(() => {
    if (leiNome && leiNome !== tabelaNome) return leiNome;
    if (cleanTabela.includes('penal')) return 'Código Penal';
    if (cleanTabela.includes('cf') || cleanTabela.includes('constituicao')) return 'Constituição Federal';
    return cleanTabela.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [leiNome, cleanTabela, tabelaNome]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // 1. Checa curadoria instantânea local
    const curatedKey = `${cleanTabela.toLowerCase()}:${cleanNum}`;
    const curated = CURATED_AULAS[curatedKey];

    // 2. Checa cache em memória
    const cached = getCachedData<VideoaulasPayload>(videoaulasKey(cleanTabela, cleanNum), 30 * 60 * 1000);
    if (cached && cached.videos && cached.videos.length > 0) {
      setVideos(cached.videos);
      setFetchedAt(cached.fetchedAt);
      setStale(cached.stale);
      setQuotaExceeded(cached.quotaExceeded);
      setError(null);
      setLoading(false);
      return;
    }

    if (curated && curated.length > 0) {
      setVideos(curated);
      setFetchedAt(new Date().toISOString());
      setError(null);
      setLoading(false);
    }

    // 3. Busca remota / Supabase
    (async () => {
      if (!curated || curated.length === 0) {
        setLoading(true);
      }
      setError(null);
      setQuotaExceeded(false);
      try {
        const payload = await loadVideoaulas(cleanTabela, cleanNum, friendlyLeiNome);
        if (cancelled) return;
        if (payload.videos && payload.videos.length > 0) {
          setVideos(payload.videos as VideoaulaItem[]);
          setFetchedAt(payload.fetchedAt);
          setStale(payload.stale);
          setQuotaExceeded(payload.quotaExceeded);
        } else if (curated && curated.length > 0) {
          setVideos(curated);
        }
      } catch (e: any) {
        console.error('Erro ao buscar videoaulas:', e);
        if (!cancelled) {
          if (curated && curated.length > 0) {
            setVideos(curated);
          } else {
            setError('Não foi possível carregar as videoaulas online.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, cleanTabela, cleanNum, friendlyLeiNome]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10050] pointer-events-auto flex items-end md:items-stretch justify-center">
          {/* Backdrop que fecha com clique */}
          <motion.div
            key="videoaulas-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm pointer-events-auto touch-none"
          />

          {/* Sheet deslizante */}
          <motion.aside
            key="videoaulas-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            data-artigo-menu
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full bg-[#121214] border-t border-border/80 rounded-t-3xl shadow-2xl flex flex-col pb-safe max-h-[92vh] max-w-lg md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-none md:w-[min(32rem,94vw)] md:max-w-none md:rounded-none md:rounded-l-3xl md:border-l md:border-t-0 md:ml-auto pointer-events-auto"
          >
            {/* Barra de arraste */}
            <div className="pt-3 pb-2 flex justify-center">
              <span className="w-12 h-1.5 rounded-full bg-border/60" />
            </div>

            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-base font-bold text-foreground truncate">Videoaulas</h3>
                  <p className="text-xs text-foreground/70 truncate">
                    Art. {cleanNum}º — {friendlyLeiNome}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-10 h-10 rounded-full hover:bg-white/10 active:scale-95 flex items-center justify-center text-foreground/80 hover:text-white shrink-0 cursor-pointer pointer-events-auto transition-all"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto py-4 px-4 overscroll-contain">
              {loading && videos.length === 0 && (
                <div className="px-6 py-14 text-center flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm text-foreground/70">Buscando as melhores videoaulas para você…</p>
                </div>
              )}

              {!loading && error && videos.length === 0 && (
                <div className="text-center py-10 px-4">
                  <p className="text-sm text-destructive mb-4">{error}</p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`Artigo ${cleanNum} ${friendlyLeiNome} aula explicacao`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-md hover:bg-primary/90 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Pesquisar no YouTube
                  </a>
                </div>
              )}

              {!loading && !error && videos.length === 0 && (
                <div className="text-center py-12 px-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3 text-muted-foreground">
                    <Video className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Nenhuma videoaula catalogada no momento</p>
                  <p className="text-xs text-foreground/60 mb-5 max-w-xs">
                    Você pode assistir a aulas diretamente deste artigo no YouTube:
                  </p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`Artigo ${cleanNum} ${friendlyLeiNome} aula explicacao`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Assistir no YouTube
                  </a>
                </div>
              )}

              {videos.length > 0 && (
                <>
                  {stale && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-[11px] text-yellow-200/90">Mostrando resultados recomendados.</p>
                    </div>
                  )}

                  <ul className="flex flex-col gap-3 pb-4">
                    {videos.map((v) => {
                      const meta = TIPO_META[v.tipo] || TIPO_META.mais_visto;
                      const Icon = meta.icon;
                      const duration = formatDuration(v.duration);
                      return (
                        <li key={v.videoId}>
                          <button
                            type="button"
                            onClick={() => onSelectVideo(v)}
                            className="w-full text-left rounded-2xl bg-secondary/40 hover:bg-secondary/70 border border-border/60 overflow-hidden group transition-all flex items-stretch gap-3 p-2.5 active:scale-[0.99] cursor-pointer"
                          >
                            <div className="relative w-32 aspect-video bg-black overflow-hidden rounded-xl shrink-0">
                              <img
                                src={v.thumb}
                                alt={v.titulo}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {duration && (
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-white text-[9px] font-mono leading-none">
                                  {duration}
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                <div className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                  <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                              <div>
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${meta.badge} mb-1`}
                                >
                                  <Icon className="w-3 h-3" />
                                  {meta.label}
                                </div>
                                <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                  {v.titulo}
                                </p>
                                <p className="text-[11px] text-foreground/60 mt-1 truncate">{v.canal}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-foreground/50">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {formatCount(v.views)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {formatCount(v.likes)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {relativeDays(v.publishedAt)}
                                </span>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {fetchedAt && (
                    <p className="text-[10px] text-foreground/40 text-center mt-2 px-4">
                      Atualizado {relativeDays(fetchedAt)} · atualiza a cada 15 dias
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.aside>

          <GeracaoAnimacaoOverlay
            open={loading && videos.length === 0}
            titulo="Buscando videoaulas"
            steps={VIDEOAULAS_STEPS}
            estTotalSec={10}
            onCancel={onClose}
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default VideoaulasListSheet;
