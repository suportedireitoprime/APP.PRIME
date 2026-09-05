import { Suspense, useEffect, useMemo, useState, useRef, memo, useCallback } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { COLECOES, findColecao, normalizeLivro, type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';
import { supabase } from '@/integrations/supabase/client';
import { startCapasPrefetch } from '@/services/bibliotecaCapasPrefetch';
import { startLeituraNativaPrefetch } from '@/services/leituraNativaPrefetch';
import { scheduleWarmBiblioteca } from '@/services/bibliotecaWarmup';
import { styleForPerformance } from '@/lib/bibliotecaIcons';
import { directImg } from '@/lib/cdnImg';
import { withBundleFallback, bundle } from '@/services/offlineBundle';
import { getPersistedColecao, setPersistedColecao } from '@/services/offlineDb';
import BibliotecaAtalhosBar from '@/components/biblioteca/BibliotecaAtalhosBar';
import BibliotecaSearchBar from '@/components/biblioteca/BibliotecaSearchBar';
import BibliotecaHero from '@/components/biblioteca/BibliotecaHero';
import ShapeGrid from '@/components/ui/ShapeGrid';
import RecomendacoesCarousel from '@/components/biblioteca/RecomendacoesCarousel';
import ContinuarLeituraCarousel from '@/components/biblioteca/ContinuarLeituraCarousel';
import { useIsDesktop } from '@/hooks/use-desktop';
import { track } from '@/lib/analyticsEvents';
import { useTrackArea } from "@/hooks/useTrackArea";
import { ChevronRight, Library, BookOpen, Gauge } from 'lucide-react';
import { HardDrive } from 'lucide-react';

const BibliotecasDesktop = lazyWithRetry(() => import('./BibliotecasDesktop'));
const CircularGallery = lazyWithRetry(() => import('@/components/ui/CircularGallery'));
const LivroDetailSheet = lazyWithRetry(() => import('@/components/biblioteca/LivroDetailSheet'));
const PdfScrollReader = lazyWithRetry(() => import('@/components/biblioteca/PdfScrollReader'));
const BibliotecaMateriaSheet = lazyWithRetry(() => import('@/components/biblioteca/BibliotecaMateriaSheet'));

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

  // Ponte 100% Nativa (Jetpack Compose / SwiftUI) no mobile
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let isMounted = true;
      let closeHandler: { remove: () => void } | null = null;

      (async () => {
        try {
          const { NativeBiblioteca } = await import('@/plugins/NativeBibliotecaPlugin');
          const { data: auth } = await supabase.auth.getSession();
          const token = auth.session?.access_token || '';

          if (!isMounted) return;

          closeHandler = await NativeBiblioteca.addListener('onClose', () => {
            navigate(-1);
          });

          await NativeBiblioteca.openBiblioteca({
            aba: abaUrl || 'acervos',
            materia: materiaUrl || '',
            accessToken: token,
          });
        } catch (e) {
          console.warn('Fallback para interface web da biblioteca:', e);
        }
      })();

      return () => {
        isMounted = false;
        closeHandler?.remove();
      };
    }
  }, [abaUrl, materiaUrl, navigate]);
  
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
  const { data: livrosAreas = [] } = useQuery({
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
              <Suspense fallback={<div className="h-[350px] w-full flex items-center justify-center text-zinc-600 text-xs">Carregando acervos...</div>}>
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
              </Suspense>
            </div>
          </div>
        </div>

        {/* Matéria: bottom sheet sob demanda */}
        <Suspense fallback={null}>
          <BibliotecaMateriaSheet
            materiaAberta={materiaAberta}
            onClose={() => setMateriaAberta(null)}
            livrosAreas={livrosAreas}
            onAbrirLivro={(l) => setLivroAberto(l)}
          />
        </Suspense>

        {/* Detalhes do Livro sob demanda */}
        <Suspense fallback={null}>
          {livroAberto && (
            <LivroDetailSheet
              livro={livroAberto}
              open={!!livroAberto}
              onClose={() => setLivroAberto(null)}
            />
          )}
        </Suspense>

        {/* Leitor de PDF sob demanda */}
        <Suspense fallback={null}>
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
        </Suspense>
      </div>
    </main>
  );
};

export default Bibliotecas;
