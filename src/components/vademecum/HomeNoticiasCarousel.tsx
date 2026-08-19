import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowUpRight, Film, Star, Library } from 'lucide-react';
import { getNoticiasCache, prefetchNoticias, subscribeNoticias, type Noticia } from '@/services/noticiasService';
import { newsImg, cdnImg } from '@/lib/cdnImg';
import NoticiaViewerSheet from '@/components/vademecum/NoticiaViewerSheet';
import BlogPostSheet from '@/components/vademecum/BlogPostSheet';
import ObraDetailSheet, { type Obra } from '@/components/tematica/ObraDetailSheet';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import { findColecao, normalizeLivro, type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { BLOG_POSTS, TEMA_COLORS, type BlogPost } from '@/data/blogPosts';
import { supabase } from '@/integrations/supabase/client';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';

const AUTOPLAY_MS = 10000;
const MAX_NEWS = 8;
const MAX_OBRAS = 6;
const MAX_LIVROS = 12;

type Livro = any;

type FeedItem =
  | { kind: 'noticia'; id: string; data: Noticia }
  | { kind: 'blog'; id: string; data: BlogPost }
  | { kind: 'obra'; id: string; data: Obra }
  | { kind: 'livro'; id: string; data: Livro };

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  if (sameDay) return `Hoje · ${hh}:${mm}`;
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${day} ${months[d.getMonth()]} · ${hh}:${mm}`;
}

function tipoLabel(o: Obra): string {
  if ((o.categorias_juridicas ?? []).includes('Documentário')) return 'Documentário';
  return o.tipo === 'tv' ? 'Série' : 'Filme';
}

// Paleta por categoria — combina com o tema Wine/Ivory do app.
// Filme → wine/bordô (primary do app). Série → índigo profundo. Documentário → verde-musgo.
const OBRA_PALETTE: Record<string, { deep: string; mid: string; chipBg: string; chipText: string }> = {
  Filme:         { deep: '#2a0a12', mid: '#4a1524', chipBg: '#e01f47', chipText: '#fff5f7' },
  Série:         { deep: '#0d1230', mid: '#1e2757', chipBg: '#6366f1', chipText: '#f0f2ff' },
  Documentário:  { deep: '#0f1f14', mid: '#1e3a26', chipBg: '#10b981', chipText: '#ecfdf5' },
};

// Padrão do carrossel (um ciclo = 2 blogs + 1 livro + 1 notícia + 1 filme):
//   2 blogs → 1 livro clássico → 1 notícia → 1 obra (filme) → repete.
// Filas garantem que nada repita antes de esgotar cada fonte.
const CYCLE: Array<'blog' | 'noticia' | 'obra' | 'livro'> = [
  'blog', 'blog',
  'livro',
  'noticia',
  'obra',
];


function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  onOpenChange?: (open: boolean) => void;
  /** Quando false, o carrossel não avança automaticamente. */
  autoplay?: boolean;
}

export default function HomeNoticiasCarousel({ onOpenChange, autoplay = true }: Props) {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const userInteractingRef = useRef(false);
  const [noticias, setNoticias] = useState<Noticia[]>(() => (getNoticiasCache() ?? []).slice(0, MAX_NEWS));
  const [obras, setObras] = useState<Obra[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [selectedLivro, setSelectedLivro] = useState<LivroNormalizado | null>(null);

  const postsAll = useMemo(() => [...BLOG_POSTS], []);

  // Filas persistentes por sessão do carrossel (mantidas em ref, não causam re-render).
  const blogQueueRef = useRef<BlogPost[]>(shuffle(postsAll));
  const noticiaQueueRef = useRef<Noticia[]>([]);
  const obraQueueRef = useRef<Obra[]>([]);
  const livroQueueRef = useRef<Livro[]>([]);
  const usedNoticiaIdsRef = useRef<Set<string>>(new Set());
  const usedObraIdsRef = useRef<Set<string>>(new Set());
  const usedLivroIdsRef = useRef<Set<string>>(new Set());
  const cycleStepRef = useRef(0);

  const [feed, setFeed] = useState<FeedItem[]>([]);

  // Recalcula a fila de notícias sempre que a fonte muda: sempre a mais recente
  // ainda não exibida vai na frente. Notícias já mostradas não voltam.
  useEffect(() => {
    const sorted = [...noticias].sort(
      (a, b) => new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime(),
    );
    noticiaQueueRef.current = sorted.filter((n) => !usedNoticiaIdsRef.current.has(String(n.id)));
  }, [noticias]);

  // Fila de obras: recalcula quando a fonte muda, removendo já exibidas.
  useEffect(() => {
    obraQueueRef.current = obras.filter((o) => !usedObraIdsRef.current.has(String(o.id)));
  }, [obras]);

  // Fila de livros clássicos.
  useEffect(() => {
    livroQueueRef.current = livros.filter((l) => !usedLivroIdsRef.current.has(String(l.id)));
  }, [livros]);

  const takeNext = useCallback((kind: 'blog' | 'noticia' | 'obra' | 'livro'): FeedItem | null => {
    if (kind === 'blog') {
      if (blogQueueRef.current.length === 0) {
        blogQueueRef.current = shuffle(postsAll);
      }
      const p = blogQueueRef.current.shift();
      if (!p) return null;
      return { kind: 'blog', id: `b-${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, data: p };
    }
    if (kind === 'noticia') {
      if (noticiaQueueRef.current.length === 0) {
        // esgotou — reabastece a partir do que há, removendo o histórico p/ reiniciar do topo
        usedNoticiaIdsRef.current.clear();
        noticiaQueueRef.current = [...noticias].sort(
          (a, b) => new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime(),
        );
      }
      const n = noticiaQueueRef.current.shift();
      if (!n) return null;
      usedNoticiaIdsRef.current.add(String(n.id));
      return { kind: 'noticia', id: `n-${n.id}-${Date.now()}`, data: n };
    }
    if (kind === 'livro') {
      if (livroQueueRef.current.length === 0) {
        usedLivroIdsRef.current.clear();
        livroQueueRef.current = shuffle(livros);
      }
      const l = livroQueueRef.current.shift();
      if (!l) return null;
      usedLivroIdsRef.current.add(String(l.id));
      return { kind: 'livro', id: `l-${l.id}-${Date.now()}`, data: l };
    }
    // obra
    if (obraQueueRef.current.length === 0) {
      usedObraIdsRef.current.clear();
      obraQueueRef.current = [...obras];
    }
    const o = obraQueueRef.current.shift();
    if (!o) return null;
    usedObraIdsRef.current.add(String(o.id));
    return { kind: 'obra', id: `o-${o.id}-${Date.now()}`, data: o };
  }, [noticias, obras, livros, postsAll]);

  const extendFeed = useCallback((minItemsAhead: number) => {
    setFeed((prev) => {
      const out = [...prev];
      // Empurra até o ciclo produzir pelo menos `minItemsAhead` itens novos
      let added = 0;
      let guard = 0;
      while (added < minItemsAhead && guard < 64) {
        guard++;
        const slot = CYCLE[cycleStepRef.current % CYCLE.length];
        const item = takeNext(slot);
        if (item) {
          out.push(item);
          added++;
          cycleStepRef.current++;
        } else {
          // fila vazia (ex.: obras ainda carregando) — pula o slot e continua o ciclo
          cycleStepRef.current++;
        }
      }
      if (added === 0) return prev; // Evita loop infinito no useLayoutEffect
      return out;
    });
  }, [takeNext]);

  // Popula o feed inicial e reidrata quando novas fontes chegam.
  useLayoutEffect(() => {
    if (feed.length === 0) extendFeed(9);
  }, [feed.length, extendFeed]);

  // Manter o feed estável ao carregar novas fontes (não reseta o feed visível nem troca os cards após 1s)
  const rebuiltRef = useRef({ livros: false, obras: false });
  useEffect(() => {
    const needLivros = livros.length > 0 && !rebuiltRef.current.livros;
    const needObras = obras.length > 0 && !rebuiltRef.current.obras;
    if (!needLivros && !needObras) return;
    rebuiltRef.current = { livros: livros.length > 0, obras: obras.length > 0 };
    livroQueueRef.current = shuffle(livros);
    obraQueueRef.current = [...obras];
  }, [livros, obras]);

  // À medida que o usuário se aproxima do fim, adiciona mais um ciclo.
  useEffect(() => {
    if (feed.length - activeIndex <= 3) extendFeed(9);
  }, [activeIndex, feed.length, extendFeed]);

  const items = feed;

  const activeItem = items[activeIndex];

  useEffect(() => {
    if (noticias.length === 0) prefetchNoticias().catch(() => {});
    const unsub = subscribeNoticias((data) => setNoticias(data.slice(0, MAX_NEWS)));
    return unsub;
  }, [noticias.length]);

  useEffect(() => {
    const fetchObras = async () => {
      const { data } = await supabase
        .from('tematica_juridica_obras')
        .select('*')
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('ordem', { ascending: true })
        .limit(MAX_OBRAS);
      if (data) setObras((data as unknown) as Obra[]);
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(fetchObras, { timeout: 2000 });
    } else {
      setTimeout(fetchObras, 500);
    }
  }, []);

  useEffect(() => {
    const fetchLivros = async () => {
      const { data } = await supabase
        .from('biblioteca_classicos')
        .select('id, livro, autor, area, imagem, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura')
        .not('imagem', 'is', null)
        .limit(MAX_LIVROS);
      if (data) setLivros((data as unknown) as Livro[]);
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(fetchLivros, { timeout: 2500 });
    } else {
      setTimeout(fetchLivros, 600);
    }
  }, []);

  useEffect(() => {
    const hasOpen = !!selectedNoticia || !!selectedPost || !!selectedObra || !!selectedLivro;
    onOpenChange?.(hasOpen);
    if (!hasOpen) {
      resetBodyScrollLock();
    }
  }, [selectedNoticia, selectedPost, selectedObra, selectedLivro, onOpenChange]);


  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const child = scroller.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (scroller.clientWidth - child.clientWidth) / 2;
    scroller.scrollTo({ left: target, behavior });
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    if (items.length < 2) return;
    const tick = () => {
      if (userInteractingRef.current) return;
      const next = (activeIndex + 1) % items.length;
      setActiveIndex(next);
      scrollToIndex(next);
    };
    autoplayRef.current = window.setInterval(tick, AUTOPLAY_MS);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [autoplay, activeIndex, items.length, scrollToIndex]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    const ratios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.intersectionRatio);
        });

        let maxRatio = -1;
        let bestTarget: Element | null = null;
        ratios.forEach((ratio, target) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            bestTarget = target;
          }
        });

        if (bestTarget) {
          const idx = Array.from(scroller.children).indexOf(bestTarget);
          if (idx !== -1) setActiveIndex(idx);
        }
      },
      {
        root: scroller,
        threshold: Array.from({ length: 11 }, (_, i) => i / 10), // 0, 0.1, 0.2 ... 1.0
      }
    );

    Array.from(scroller.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [items.length]);
  const pauseAutoplay = () => {
    userInteractingRef.current = true;
    window.setTimeout(() => { userInteractingRef.current = false; }, 4000);
  };

  const handleOpen = (item: FeedItem) => {
    if (item.kind === 'noticia') setSelectedNoticia(item.data);
    else if (item.kind === 'blog') setSelectedPost(item.data);
    else if (item.kind === 'livro') {
      const l = item.data;
      const colecaoClassicos = findColecao('classicos');
      const normalized = colecaoClassicos ? normalizeLivro(l, colecaoClassicos) : {
        id: l.id,
        titulo: l.livro ?? 'Clássico',
        autor: l.autor,
        sobre: l.sobre,
        capa: l.imagem,
        link: l.link,
        download: l.download,
        area: l.area,
        colecaoId: 'classicos',
        capaHorizontal: l.capa_horizontal,
        anoLancamento: l.ano_lancamento,
        editora: l.editora,
        curiosidades: l.curiosidades,
        analiseDetalhada: l.analise_detalhada,
      };
      setSelectedLivro(normalized);
    }
    else setSelectedObra(item.data);
  };


  if (items.length === 0) {
    return (
      <div>
        <div className="flex gap-3 overflow-hidden px-4">
          <div className="shrink-0 w-full h-[140px] rounded-2xl bg-card animate-pulse" />
        </div>
      </div>
    );
  }

  const kind = activeItem?.kind ?? 'noticia';
  const headerTitle =
    kind === 'blog'
      ? 'Blogger Jurídico'
      : kind === 'obra'
      ? 'Temática Jurídica'
      : kind === 'livro'
      ? 'Recomendação de Livro'
      : 'Notícias Jurídicas';
  const headerSubtitle =
    kind === 'blog'
      ? 'artigos, filosofia e curiosidades do Direito'
      : kind === 'obra'
      ? 'filmes, séries e documentários para juristas'
      : kind === 'livro'
      ? 'clássicos e obras do Direito'
      : 'notícias do mundo jurídico em tempo real';
  return (
    <div className="space-y-2.5">
      <div className="px-5 min-h-[54px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={kind}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-primary" />
              {headerTitle}
            </h3>
            <p className="font-body text-muted-foreground text-[12.5px] leading-snug mb-3 ml-3 truncate">
              {headerSubtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>


      <div
        ref={scrollerRef}
        onPointerDown={pauseAutoplay}
        onTouchStart={pauseAutoplay}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 px-[7.5%] md:px-[4%] lg:px-[3%] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const isActive = i === activeIndex;

          // LIVRO — card dedicado bordô com capa em destaque
          if (item.kind === 'livro') {
            const l = item.data;
            const meta = l.autor ? `${l.autor} · ${l.area ?? 'Clássicos'}` : (l.area ?? 'Clássico do Direito');
            return (
              <motion.button
                key={item.id}
                onClick={() => handleOpen(item)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className="snap-center shrink-0 w-[85%] md:w-[46%] lg:w-[31%] active:scale-[0.99] text-left"
              >
                <div
                  className={`relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 flex transform-gpu will-change-transform ${
                    isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-60 scale-[0.94]'
                  }`}
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--brand-burgundy-mid)) 60%, hsl(var(--brand-burgundy-deep)) 100%)',
                  }}
                >


                  {/* SVGs jurídicos decorativos ao fundo */}
                  <svg
                    aria-hidden
                    viewBox="0 0 200 200"
                    className="pointer-events-none absolute -right-4 -bottom-6 w-[130px] h-[130px] text-white/10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M100 30 V170 M70 170 H130 M100 55 L55 95 M100 55 L145 95" strokeLinecap="round" />
                    <path d="M35 95 Q55 135 75 95 Z" />
                    <path d="M125 95 Q145 135 165 95 Z" />
                  </svg>
                  <svg
                    aria-hidden
                    viewBox="0 0 100 100"
                    className="pointer-events-none absolute top-2 right-14 w-[54px] h-[54px] text-white/10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M18 78 L58 38" />
                    <rect x="52" y="20" width="30" height="14" rx="2" transform="rotate(45 67 27)" />
                    <path d="M10 88 H50" />
                  </svg>

                  {/* Capa com destaque */}
                  <div className="relative h-full w-[104px] shrink-0 flex items-center justify-center px-2.5 z-[1]">
                    {l.imagem ? (
                      <img
                        src={cdnImg(l.imagem, 240)}
                        alt=""
                        loading={i < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="h-[118px] w-auto max-w-full object-contain rounded-md"
                        style={{
                          boxShadow:
                            '0 14px 26px -8px rgba(0,0,0,0.75), 0 6px 12px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.25)',
                        }}
                      />
                    ) : (
                      <Library className="w-8 h-8 text-white/50" />
                    )}
                  </div>

                  {/* Texto à direita */}
                  <div className="relative flex-1 min-w-0 flex flex-col justify-end px-3.5 pb-3 pt-3 z-[1]">
                    <span className="self-start flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white mb-1.5 bg-black/35 backdrop-blur-sm">
                      <Library className="w-2.5 h-2.5" />
                      Clássico
                    </span>
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-white/85">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{meta}</span>
                    </div>
                    <p className="font-display text-white text-[14px] font-semibold leading-snug line-clamp-2 drop-shadow-sm">
                      {l.livro ?? 'Clássico'}
                    </p>
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
                      <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={2.2} />
                    </div>
                  </div>

                </div>
              </motion.button>
            );
          }

          // OBRA — poster vertical à esquerda + fundo com poster borrado (paleta natural)
          if (item.kind === 'obra') {
            const o = item.data;
            const poster = o.poster_url;
            const bg = o.backdrop_url || poster;
            const label = tipoLabel(o);
            const palette = OBRA_PALETTE[label] ?? OBRA_PALETTE.Filme;
            const meta = [o.ano, o.nota ? `★ ${o.nota.toFixed(1)}` : null].filter(Boolean).join(' · ');
            return (
              <motion.button
                key={item.id}
                onClick={() => handleOpen(item)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className="group snap-center shrink-0 w-[85%] md:w-[46%] lg:w-[31%] active:scale-[0.99] text-left cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              >

                <div
                  className={`relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/40 group-hover:ring-1 group-hover:ring-primary/40 transform-gpu will-change-transform ${
                    isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-60 scale-[0.94] group-hover:opacity-90'
                  }`}
                  style={{ backgroundColor: palette.deep }}
                >


                  {/* Fundo removido por performance (blur-xl degrada no WebView). 
                      O degradê CSS com a paleta natural (abaixo) já fornece o fundo necessário. */}
                  {/* degradê da categoria: entra da direita para a esquerda,
                      conversando com o poster (que fica à esquerda) */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to left, ${palette.deep} 42%, ${palette.mid}cc 68%, transparent 100%)`,
                    }}
                  />

                  {/* poster vertical à esquerda */}
                  <div className="absolute inset-y-2 left-2 w-[92px] rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10">
                    {poster ? (
                      <img
                        src={cdnImg(poster, 200)}
                        alt={o.titulo}
                        loading={i < 2 ? 'eager' : 'lazy'}
                        {...(i < 2 ? { fetchpriority: 'high' as any } : {})}
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <Film className="w-6 h-6 text-white/50" />
                      </div>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-md">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                  </div>

                  <span
                    className="absolute top-2.5 left-[108px] text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: palette.chipBg, color: palette.chipText }}
                  >
                    {label}
                  </span>

                  <div className="absolute inset-y-0 right-0 left-[108px] flex flex-col justify-end pr-4 pb-3">
                    <div className="flex items-center gap-2 mb-1 text-[11.5px] text-white/90">
                      {o.nota ? <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> : <Clock className="w-3 h-3" />}
                      <span className="truncate">{meta || 'Temática jurídica'}</span>
                    </div>
                    <p className="font-display text-white text-[15px] font-normal leading-snug line-clamp-2 drop-shadow-sm">
                      {o.titulo}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          }

          const isB = item.kind === 'blog';
          const c = isB ? TEMA_COLORS[(item.data as BlogPost).tema] : null;
          const rawImg = isB
            ? (item.data as BlogPost).imagem_url ?? ''
            : (item.data as Noticia).imagem_url ?? '';
          const img = isB ? cdnImg(rawImg, 640) : newsImg(rawImg, 640);
          const title = isB ? (item.data as BlogPost).titulo : (item.data as Noticia).titulo;
          const meta = isB
            ? `${(item.data as BlogPost).tempo_leitura_min} min · ${(item.data as BlogPost).tema}`
            : `${formatTime((item.data as Noticia).data_publicacao)} · Migalhas`;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleOpen(item)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.2) }}
              className="snap-center shrink-0 w-[85%] md:w-[46%] lg:w-[31%] active:scale-[0.99] text-left"
            >

              <div
                className={`relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 transform-gpu will-change-transform ${
                  isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-60 scale-[0.94]'
                }`}
                style={isB && c ? { background: c.bg } : undefined}
              >


                {img && (
                  <img
                    src={img}
                    alt=""
                    loading={i < 2 ? 'eager' : 'lazy'}
                    {...(i < 2 ? { fetchpriority: 'high' as any } : {})}
                    decoding="async"
                    className={`absolute inset-0 w-full h-full object-cover ${
                      isB ? 'object-top opacity-90' : 'brightness-110 contrast-105 saturate-110'
                    }`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
                  <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                </div>

                {isB && c && (
                  <span
                    className="absolute top-2.5 left-2.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: c.chip, color: c.chipText }}
                  >
                    Blog · {(item.data as BlogPost).tema}
                  </span>
                )}

                <div className="absolute inset-0 flex flex-col justify-end px-4 pb-3 pt-4">
                  <div className="flex items-center gap-2 mb-1 text-[11.5px] text-white/90">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{meta}</span>
                  </div>
                  <p className="font-display text-white text-[15px] font-normal leading-snug line-clamp-2 drop-shadow-sm">
                    {title}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {items.slice(0, Math.min(items.length, 8)).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}

      <NoticiaViewerSheet noticia={selectedNoticia} onClose={() => setSelectedNoticia(null)} />
      <BlogPostSheet post={selectedPost} onClose={() => setSelectedPost(null)} />
      <ObraDetailSheet obra={selectedObra} open={!!selectedObra} onClose={() => setSelectedObra(null)} />
      <LivroDetailSheet livro={selectedLivro} open={!!selectedLivro} onClose={() => setSelectedLivro(null)} />
    </div>
  );
}

