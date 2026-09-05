import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { Search, Scale, ArrowLeft, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { haptic } from '@/lib/nativeHaptics';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import {
  TemaRow,
  CATEGORY_ORDER,
  LEIS_CACHE_KEY,
  getBaseArtigo,
  FlashcardsLeisCategoriasGrid,
  FlashcardsLeisCard,
  FlashcardsLeisWizardSheet,
} from '@/components/flashcards/leis/chunks';

export default function FlashcardsLeis() {
  const navigate = useNavigate();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();

  const [todasLeis, setTodasLeis] = useState<TemaRow[]>([]);
  const [loadingLeis, setLoadingLeis] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);

  // Selected state for the bottom sheet
  const [leiSelecionada, setLeiSelecionada] = useState<TemaRow | null>(null);
  const [cardsDisponiveis, setCardsDisponiveis] = useState<{ tema: string; artigo: string }[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // SEO & Prevenção de bug de scroll/pointer events
  useEffect(() => {
    document.title = 'Leis Secas em Flashcards | Vade Mecum PRIME';
    resetBodyScrollLock();
  }, []);

  useEffect(() => {
    if (!leiSelecionada) return;
    const cacheKey = `flashcards_meta_${leiSelecionada.tema}`;

    // 0. Mostrar cache instantaneamente
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) {
          setCardsDisponiveis(parsed);
          setLoadingCards(false);
        }
      }
    } catch { /* ignora */ }

    const fetchMeta = async () => {
      if (!localStorage.getItem(cacheKey)) {
        setLoadingCards(true);
      }
      const { data } = await supabase
        .from('flashcards_cards')
        .select('tema, artigo_numero')
        .ilike('tema', `${leiSelecionada.tema}%`);
      if (data) {
        const mapped = data.map((d) => ({ tema: d.tema, artigo: d.artigo_numero || 'Geral' }));
        setCardsDisponiveis(mapped);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(mapped));
        } catch { /* ignora */ }
      }
      setLoadingCards(false);
    };
    fetchMeta();
  }, [leiSelecionada]);

  const infoPorTitulo = useMemo(() => {
    const map: Record<string, { count: number; minArt: number; maxArt: number }> = {};
    cardsDisponiveis.forEach((c) => {
      if (!map[c.tema]) {
        map[c.tema] = { count: 0, minArt: 999999, maxArt: 0 };
      }
      map[c.tema].count++;
      const num = parseInt(c.artigo.replace(/\D/g, '')) || 0;
      if (num > 0) {
        map[c.tema].minArt = Math.min(map[c.tema].minArt, num);
        map[c.tema].maxArt = Math.max(map[c.tema].maxArt, num);
      }
    });
    return map;
  }, [cardsDisponiveis]);

  const titulosUnicos = useMemo(() => {
    return Object.keys(infoPorTitulo).sort((a, b) => {
      const minA = infoPorTitulo[a]?.minArt ?? 999999;
      const minB = infoPorTitulo[b]?.minArt ?? 999999;
      if (minA === minB) return a.localeCompare(b, 'pt-BR');
      return minA - minB;
    });
  }, [infoPorTitulo]);

  const artigosUnicos = useMemo(() => {
    return Array.from(new Set(cardsDisponiveis.map((c) => getBaseArtigo(c.artigo)))).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA === numB) return a.localeCompare(b);
      return numA - numB;
    });
  }, [cardsDisponiveis]);

  const cardsPorArtigo = useMemo(() => {
    const counts: Record<string, number> = {};
    cardsDisponiveis.forEach((c) => {
      const baseArt = getBaseArtigo(c.artigo);
      counts[baseArt] = (counts[baseArt] || 0) + 1;
    });
    return counts;
  }, [cardsDisponiveis]);

  const totalCardsFiltrados = cardsDisponiveis.length;

  useEffect(() => {
    let isMounted = true;

    try {
      const cached = localStorage.getItem(LEIS_CACHE_KEY);
      if (cached) {
        const parsed: TemaRow[] = JSON.parse(cached);
        if (parsed.length > 0 && isMounted) {
          setTodasLeis(parsed);
          setLoadingLeis(false);
        }
      }
    } catch { /* ignora */ }

    const fetchAllLeis = async () => {
      if (!localStorage.getItem(LEIS_CACHE_KEY)) {
        setLoadingLeis(true);
      }

      try {
        const { data: vmLeis, error: vmError } = await supabase
          .from('vade_mecum_leis')
          .select('nome, nome_curto, categoria, ordem')
          .order('ordem');

        if (vmError) throw vmError;

        const initialLeis: TemaRow[] = (vmLeis || []).map((lei) => ({
          tema: lei.nome,
          nome_curto: lei.nome_curto,
          total: 0,
          compreendidos: 0,
          a_revisar: 0,
          area: lei.categoria,
        }));

        if (!localStorage.getItem(LEIS_CACHE_KEY) && isMounted) {
          setTodasLeis(initialLeis);
          setLoadingLeis(false);
        }

        if (areasRaw && areasRaw.length > 0) {
          const areasToFetch = [...areasRaw];
          if (!areasToFetch.find((a) => a.area === 'codigo')) areasToFetch.push({ area: 'codigo' } as any);
          if (!areasToFetch.find((a) => a.area === 'lei')) areasToFetch.push({ area: 'lei' } as any);

          const promises = areasToFetch.map((a) =>
            supabase
              .rpc('flashcards_temas', { _area: a.area })
              .then((res) => {
                if (res.error) return [];
                return (res.data || []).map((t) => ({ ...t, area: a.area }));
              })
          );
          const results = await Promise.all(promises);
          const flattenedTemas = results.flat() as TemaRow[];

          if (isMounted) {
            const updatedLeis = initialLeis.map((lei) => {
              const prefix1 = lei.tema.toLowerCase();
              const prefix2 = (lei.nome_curto || '').toLowerCase();

              const matchingTemas = flattenedTemas.filter((t) => {
                const temaLower = t.tema.toLowerCase();
                const match1 =
                  temaLower === prefix1 ||
                  temaLower.startsWith(prefix1 + ' -') ||
                  temaLower.startsWith(prefix1 + ' (');
                const match2 = prefix2
                  ? temaLower === prefix2 ||
                    temaLower.startsWith(prefix2 + ' -') ||
                    temaLower.startsWith(prefix2 + ' (')
                  : false;
                return match1 || match2;
              });

              const total = matchingTemas.reduce((acc, t) => acc + t.total, 0);
              const compreendidos = matchingTemas.reduce((acc, t) => acc + (t.compreendidos || 0), 0);
              const a_revisar = matchingTemas.reduce((acc, t) => acc + (t.a_revisar || 0), 0);
              const realArea = matchingTemas.length > 0 ? matchingTemas[0].area : lei.area;

              return { ...lei, total, compreendidos, a_revisar, area: realArea };
            });

            const updatedLeisFiltradas = updatedLeis.filter((l) => l.total > 0);
            setTodasLeis(updatedLeisFiltradas);
            setLoadingLeis(false);

            try {
              localStorage.setItem(LEIS_CACHE_KEY, JSON.stringify(updatedLeisFiltradas));
            } catch { /* ignora */ }
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoadingLeis(false);
      }
    };

    fetchAllLeis();
    return () => {
      isMounted = false;
    };
  }, [areasRaw]);

  const listaFiltrada = useMemo(() => {
    let list = todasLeis;
    if (categoriaSelecionada) {
      list = list.filter((l) => l.area === categoriaSelecionada);
    }
    if (!busca.trim()) return list;
    const q = busca.toLowerCase();
    return list.filter((t) => t.tema.toLowerCase().includes(q) || (t.area && t.area.toLowerCase().includes(q)));
  }, [todasLeis, busca, categoriaSelecionada]);

  useGSAP(
    () => {
      if (listaFiltrada.length > 0) {
        gsap.fromTo(
          '.lei-card',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.2)' }
        );
      }
    },
    { dependencies: [listaFiltrada], scope: container }
  );

  const groupedByCategoria = useMemo(() => {
    const groups: Record<string, TemaRow[]> = {};
    for (const lei of todasLeis) {
      const cat = lei.area || 'Outras Leis';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(lei);
    }
    return Object.entries(groups).sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a[0]);
      const ib = CATEGORY_ORDER.indexOf(b[0]);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a[0].localeCompare(b[0], 'pt-BR');
    });
  }, [todasLeis]);

  const mostrarCategorias = !categoriaSelecionada && !busca.trim();
  const loading = loadingAreas || loadingLeis;

  const handleStartSession = (config: {
    temas: string[];
    artigos: string[];
    modo: string;
    quantidade?: number | 'todos';
    ordem: 'sequencial' | 'embaralhado';
  }) => {
    const p = new URLSearchParams();
    if (config.temas.length > 0) {
      p.set('temas', config.temas.join('|'));
    }
    if (config.artigos.length > 0) {
      p.set('artigos', config.artigos.join('|'));
    }
    p.set('modo', config.modo);
    p.set('limite', '9999');
    if (config.quantidade && config.quantidade !== 'todos') {
      p.set('quantidade', config.quantidade.toString());
    }
    p.set('ordem', config.ordem);
    navigate(`/flashcards/estudar?${p.toString()}`);
  };

  return (
    <div ref={container} className="min-h-dvh overflow-x-hidden bg-background pb-28 lg:pb-12">
      <PageHeader
        title={categoriaSelecionada || 'Leis e Códigos'}
        onBack={() => (categoriaSelecionada ? setCategoriaSelecionada(null) : navigate('/flashcards'))}
      />
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl px-3 sm:px-6 lg:px-8 mt-4">
        {!categoriaSelecionada && (
          <div className="mb-4 animate-in fade-in slide-in-from-left-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Scale className="w-6 h-6 text-[#36AF85]" />
              Leis e Códigos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse diretamente todas as legislações mapeadas para os flashcards.
            </p>
          </div>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={
              categoriaSelecionada
                ? `Buscar em ${categoriaSelecionada}...`
                : 'Buscar por nome da lei ou matéria...'
            }
            className="pl-10 h-12 rounded-2xl border-border bg-card shadow-sm text-base"
          />
        </div>

        {mostrarCategorias && !loading ? (
          <FlashcardsLeisCategoriasGrid
            groupedByCategoria={groupedByCategoria}
            onSelectCategoria={(cat) => {
              setCategoriaSelecionada(cat);
              setBusca('');
            }}
          />
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse border border-border/60 bg-muted/40" />
            ))}
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-7 w-7 text-[#36AF85]" />
            Nenhum resultado encontrado.
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {categoriaSelecionada && (
              <button
                type="button"
                onClick={() => {
                  haptic.selection?.();
                  setCategoriaSelecionada(null);
                  setBusca('');
                }}
                className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para categorias
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {listaFiltrada.map((lei) => (
                <FlashcardsLeisCard
                  key={lei.tema}
                  lei={lei}
                  onSelect={(selected) => setLeiSelecionada(selected)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Wizard to Start Session for specific law */}
      <FlashcardsLeisWizardSheet
        leiSelecionada={leiSelecionada}
        onClose={() => setLeiSelecionada(null)}
        cardsDisponiveis={cardsDisponiveis}
        loadingCards={loadingCards}
        infoPorTitulo={infoPorTitulo}
        titulosUnicos={titulosUnicos}
        artigosUnicos={artigosUnicos}
        cardsPorArtigo={cardsPorArtigo}
        totalCardsFiltrados={totalCardsFiltrados}
        onStartSession={handleStartSession}
      />
    </div>
  );
}
