import { Suspense, useEffect, useMemo, useState, useRef, memo, useCallback } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { COLECOES, findColecao, normalizeLivro, type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';
import { supabase } from '@/integrations/supabase/client';
import { startCapasPrefetch } from '@/services/bibliotecaCapasPrefetch';
import { startLeituraNativaPrefetch } from '@/services/leituraNativaPrefetch';
import { scheduleWarmBiblioteca } from '@/services/bibliotecaWarmup';
import { styleForArea, styleForPerformance } from '@/lib/bibliotecaIcons';
import { directImg } from '@/lib/cdnImg';
import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { withBundleFallback, bundle } from '@/services/offlineBundle';
import { getPersistedColecao, setPersistedColecao } from '@/services/offlineDb';
import BibliotecaAtalhosBar from '@/components/biblioteca/BibliotecaAtalhosBar';
import BibliotecaSearchBar from '@/components/biblioteca/BibliotecaSearchBar';
import BibliotecaHero from '@/components/biblioteca/BibliotecaHero';
import ShapeGrid from '@/components/ui/ShapeGrid';
import CircularGallery from '@/components/ui/CircularGallery';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import RecomendacoesCarousel from '@/components/biblioteca/RecomendacoesCarousel';
import ContinuarLeituraCarousel from '@/components/biblioteca/ContinuarLeituraCarousel';
import PdfScrollReader from '@/components/biblioteca/PdfScrollReader';
import { useIsDesktop } from '@/hooks/use-desktop';
import { track } from '@/lib/analyticsEvents';
import { useTrackArea } from "@/hooks/useTrackArea";
import { ChevronRight, Library, BookOpen, Gauge } from 'lucide-react';
import { useIsPdfCached } from '@/hooks/useIsPdfCached';
import { CheckCircle2, HardDrive } from 'lucide-react';

const BibliotecasDesktop = lazyWithRetry(() => import('./BibliotecasDesktop'));

const VirtualLivroItem = memo(function VirtualLivroItem({ virtualRow, livro: l, onClick }: { virtualRow: VirtualItem, livro: LivroNormalizado, onClick: () => void }) {
  const isDownloaded = useIsPdfCached(l.download);
  const capaUrl = useBibliotecaCapa(l.capa, 200);
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
        paddingBottom: '8px',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 text-left active:scale-[0.99] transition-transform w-full h-full relative"
      >
        <div className="w-[56px] h-[76px] shrink-0 rounded-lg overflow-hidden bg-muted border border-border relative">
          {isDownloaded && (
            <div className="absolute top-1 right-1 z-10 bg-black/60 backdrop-blur-sm p-0.5 rounded-full border border-white/10 shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
            </div>
          )}
          {capaUrl && (
            <img src={capaUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{l.titulo}</p>
          {l.autor && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{l.autor}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    </div>
  );
});

/** Coleções que compõem a aba "Performance" (desenvolvimento além do Direito). */
const PERFORMANCE_IDS = ['fora-da-toga', 'oratoria', 'lideranca', 'portugues', 'pesquisa'];

type AbaBiblioteca = 'performance' | 'acervos' | 'materias';

const ABAS: { id: AbaBiblioteca; label: string; icon: typeof Library }[] = [
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'acervos', label: 'Acervos', icon: Library },
  { id: 'materias', label: 'Matérias', icon: BookOpen },
];

const Bibliotecas = () => {
  useTrackArea("biblioteca_aberta");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const abaUrl = searchParams.get('aba') as AbaBiblioteca;
  const materiaUrl = searchParams.get('materia');

  const [livroAberto, setLivroAberto] = useState<LivroNormalizado | null>(null);
  const [customPdfUrl, setCustomPdfUrl] = useState<string | null>(null);
  const [customPdfTitle, setCustomPdfTitle] = useState<string>('');
  
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const fetchCounts = async () => {
      const newCounts = { ...counts };
      await Promise.all(COLECOES.map(async (c) => {
        if (!newCounts[c.id]) {
          const { count } = await supabase.from(c.table).select('id', { count: 'exact', head: true });
          newCounts[c.id] = count || 0;
        }
      }));
      setCounts(newCounts);
    };
    fetchCounts();
  }, []);
  
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openLivro) {
      setLivroAberto(location.state.openLivro as LivroNormalizado);
      // Limpa o state para não reabrir se o usuário fechar o modal e atualizar a página
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  const aba: AbaBiblioteca = abaUrl && ['performance', 'acervos', 'materias'].includes(abaUrl) ? abaUrl : 'acervos';
  const materiaAberta = materiaUrl || null;

  const setAba = (newAba: AbaBiblioteca) => {
    setSearchParams(prev => {
      prev.set('aba', newAba);
      prev.delete('materia');
      return prev;
    }, { replace: true });
  };

  const setMateriaAberta = (novaMateria: string | null) => {
    setSearchParams(prev => {
      if (novaMateria) prev.set('materia', novaMateria);
      else prev.delete('materia');
      return prev;
    }, { replace: true });
  };

  const isDesktop = useIsDesktop();
  const colecoesVisiveis = useVisibleColecoes();
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPersistedColecao('areas').then((cached) => {
      if (cached && cached.length > 0) {
        const current = queryClient.getQueryData(['biblioteca-colecao', 'areas']);
        if (!current) {
          queryClient.setQueryData(['biblioteca-colecao', 'areas'], cached);
        }
      }
    });
  }, [queryClient]);



  const colecoesPerformance = useMemo(
    () => colecoesVisiveis.filter((c) => PERFORMANCE_IDS.includes(c.id)),
    [colecoesVisiveis],
  );
  // Acervos lista todas as coleções (inclusive as de Performance).
  const colecoesAcervos = colecoesVisiveis;

  // Matérias = áreas do Direito do acervo principal (biblioteca_estudos)
  const colecaoAreas = findColecao('areas');
  const { data: livrosAreas = [], isLoading: loadingAreas } = useQuery({
    queryKey: ['biblioteca-colecao', 'areas'],
    staleTime: 10 * 60 * 1000,
    placeholderData: (prev: LivroNormalizado[] | undefined) => prev,
    queryFn: async () => {
      if (!colecaoAreas) return [] as LivroNormalizado[];
      try {
        let q = supabase.from(colecaoAreas.table as any).select(colecaoAreas.select);
        if (colecaoAreas.orderBy) q = q.order(colecaoAreas.orderBy, { ascending: true, nullsFirst: false }) as any;
        
        const data = await withBundleFallback(
          q.limit(2000).then((res: any) => {
             if (res.error) throw res.error;
             return res.data;
          }),
          async () => {
             const rows = await bundle.bibliotecaEstudos();
             return rows || [];
          }
        );
        
        const normalized = Array.isArray(data) ? data.map((r: any) => normalizeLivro(r, colecaoAreas)) : [];
        setPersistedColecao('areas', normalized).catch(() => {});
        return normalized;
      } catch (err) {
        // Falha de rede extrema: devolve cache persistido para manter visível.
        const cached = await getPersistedColecao<LivroNormalizado>('areas');
        if (cached && cached.length > 0) return cached;
        throw err;
      }
    },
  });

  const materias = useMemo(() => {
    const map = new Map<string, { name: string; capa?: string; count: number }>();
    for (const l of livrosAreas) {
      const a = l.area || 'Outros';
      const cur = map.get(a);
      if (cur) cur.count++;
      else map.set(a, { name: a, capa: l.capa || undefined, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [livrosAreas]);

  const livrosDaMateria = useMemo(
    () => (materiaAberta ? livrosAreas.filter((l) => (l.area || 'Outros') === materiaAberta) : []),
    [livrosAreas, materiaAberta],
  );

  const rowVirtualizer = useVirtualizer({
    count: livrosDaMateria.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // altura aproximada do card (76px imagem + paddings + gap)
    overscan: 5,
  });

  // SEO & Título dinâmico por aba da biblioteca
  useEffect(() => {
    const rotulos = {
      acervos: 'Biblioteca - Acervos | Vade Mecum PRIME',
      performance: 'Biblioteca - Performance & Desenvolvimento | Vade Mecum PRIME',
      materias: 'Biblioteca - Matérias do Direito | Vade Mecum PRIME',
    };
    document.title = rotulos[aba] || 'Biblioteca Jurídica | Vade Mecum PRIME';
  }, [aba]);

  useEffect(() => {
    // Mesma mecânica de aquecimento usada no desktop:
    // hidrata cache persistente → prefetch de todas as coleções → capas.
    const cancel = scheduleWarmBiblioteca(queryClient);

    if (!Capacitor.isNativePlatform()) return cancel;
    // Capas: qualquer rede — usuário quer instantâneo offline.
    startCapasPrefetch({ wifiOnly: false }).catch(() => {});
    startLeituraNativaPrefetch({ wifiOnly: true }).catch(() => {});
    return cancel;
  }, [queryClient]);


  if (isDesktop) {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-background" />}>
        <BibliotecasDesktop />
      </Suspense>
    );
  }

  return (
    <main className="min-h-dvh bg-zinc-950 pb-20 relative overflow-hidden">
      {/* Fundo ShapeGrid (igual Pílulas) */}
      <div className="absolute inset-0 z-0">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
      {/* Hero marrom com Sócrates + busca */}
      <BibliotecaHero>
        <div className="[&>div]:!px-0 [&>div]:!mb-0">
          <BibliotecaSearchBar onAbrirLivro={(l) => setLivroAberto(l)} />
        </div>
      </BibliotecaHero>

      <div className="max-w-3xl mx-auto w-full">
        {/* Painéis hospedados pelos botões do hero (Leitura, Favoritos, Personalizado) */}
        <BibliotecaAtalhosBar 
          onAbrirLivro={(l) => setLivroAberto(l)} 
          onAbrirCustomPdf={(titulo, url) => {
            setCustomPdfTitle(titulo);
            setCustomPdfUrl(url);
          }}
        />



        <div className="mt-8">
          <RecomendacoesCarousel onAbrirLivro={(l) => setLivroAberto(l)} />
        </div>

        <div className="mt-8">
          <ContinuarLeituraCarousel onAbrirLivro={(l) => setLivroAberto(l)} />
        </div>

        {/* Acervos de Livros em Roleta */}
        <div className="space-y-4 pt-6">
          <div className="flex items-start justify-between px-4 mb-4 gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Acervos de Livros</h2>
              <p className="text-[13px] text-zinc-400 truncate">
                Explore as coleções completas por área, autor e temática jurídica.
              </p>
            </div>
          </div>
          <div style={{ height: '350px', position: 'relative' }} className="-mx-4">
            <CircularGallery 
              items={COLECOES.map(c => {
                const count = counts[c.id];
                return {
                  image: c.cover,
                  text: c.label,
                  badgeText: count ? `${count} livros` : undefined,
                  showPlayButton: false,
                  id: c.id
                };
              })}
              bend={1.5}
              textColor="#ffffff"
              scrollEase={0.15}
              borderRadius={0.05}
              onItemClick={(item) => {
                navigate(`/bibliotecas/${item.id}`);
              }}
            />
          </div>
        </div>
      </div>



      {/* Matéria: abre de baixo para cima até 90% (mesmo padrão dos Resumos) */}
      <AnimatePresence>
        {materiaAberta && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMateriaAberta(null)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[71] flex h-[90dvh] flex-col rounded-t-3xl border-t border-border bg-background pb-[calc(1rem+var(--sai-bottom))]"
            >
              <div className="flex items-center justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary/70 flex items-center justify-center shrink-0">
                    {(() => {
                      const s = styleForArea(materiaAberta);
                      const Icon = s.icon;
                      return <Icon className="w-6 h-6" style={{ color: s.color }} strokeWidth={1.4} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl text-foreground font-bold leading-none truncate uppercase">
                      {materiaAberta}
                    </h3>
                    <p className="text-muted-foreground text-[12px] mt-1">
                      {livrosDaMateria.length} {livrosDaMateria.length === 1 ? 'livro' : 'livros'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMateriaAberta(null)}
                  aria-label="Fechar"
                  className="w-9 h-9 rounded-full bg-secondary/70 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div ref={parentRef} className="flex-1 overflow-y-auto px-4 pb-6 relative">
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const l = livrosDaMateria[virtualRow.index];
                    return (
                      <VirtualLivroItem
                        key={virtualRow.key}
                        virtualRow={virtualRow}
                        livro={l}
                        onClick={() => setLivroAberto(l)}
                      />
                    );
                  })}
                </div>
                {livrosDaMateria.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">Nenhum livro nesta matéria.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LivroDetailSheet
        livro={livroAberto}
        open={!!livroAberto}
        onClose={() => setLivroAberto(null)}
      />

      <AnimatePresence>
        {customPdfUrl && (
          <PdfScrollReader
            url={customPdfUrl}
            titulo={customPdfTitle}
            onClose={() => {
              setCustomPdfUrl(null);
              setCustomPdfTitle('');
            }}
          />
        )}
      </AnimatePresence>
      </div>
    </main>
  );
};

export default Bibliotecas;
