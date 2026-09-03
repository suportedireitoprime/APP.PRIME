import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { Search, Scale, ChevronRight, ArrowLeft, BookOpen, ChevronLeft, Sparkles, Check, CheckCircle2, Clock, FileText, Landmark, Users, Gavel, File, Circle, LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { haptic } from '@/lib/nativeHaptics';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { StepRow, SelecaoSheet } from '@/components/flashcards/FlashcardsFiltroSheet';
import { QuantidadeSheet } from '@/components/flashcards/QuantidadeSheet';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Types
type TemaRow = {
  tema: string;
  total: number;
  estudados?: number;
  compreendidos: number;
  a_revisar: number;
  area?: string;
  nome_curto?: string;
};

const isLei = (tema: string) => {
  const t = tema.toLowerCase();
  return (
    t.includes('lei') || t.includes('código') || t.includes('estatuto') ||
    t.includes('constituição') || t.includes('cf') || t.includes('súmula') ||
    t.includes('resolução') || t.includes('decreto') || t.includes('clt') || t.includes('cpc') || t.includes('cpp')
  );
};

const getCategoria = (tema: string) => {
  const t = tema.toLowerCase();
  if (t.includes('código') || t.includes('clt') || t.includes('cpc') || t.includes('cpp')) return 'Códigos';
  if (t.includes('estatuto')) return 'Estatutos';
  if (t.includes('constituição') || t.includes('cf')) return 'Constituição';
  if (t.includes('súmula') || t.includes('resolução')) return 'Súmulas e Resoluções';
  if (t.includes('decreto')) return 'Decretos';
  return 'Leis Especiais';
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Direito Penal': Scale,
  'Direito Civil': Users,
  'Direito Constitucional': Landmark,
  'Direito Administrativo': FileText,
  'Direito do Trabalho': File,
  'Direito Processual Penal': Scale,
  'Direito Processual Civil': Scale,
  'Direito Eleitoral': Users,
  'Direito Tributário': FileText,
  'Direito Empresarial': File,
};

// Custom order for the areas (can just sort alphabetically later)
const CATEGORY_ORDER = ['Direito Constitucional', 'Direito Administrativo', 'Direito Penal', 'Direito Processual Penal', 'Direito Civil', 'Direito Processual Civil', 'Direito do Trabalho', 'Direito Processual do Trabalho', 'Direito Tributário', 'Direito Eleitoral', 'Direito Empresarial'];

const STATUS_LEIS = [
  { id: 'todos', label: 'Todos os Cards' },
  { id: 'novos', label: 'Apenas Novos' },
  { id: 'revisar', label: 'A Revisar' },
];

export default function FlashcardsLeis() {
  const navigate = useNavigate();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];

  const [todasLeis, setTodasLeis] = useState<TemaRow[]>([]);
  const [loadingLeis, setLoadingLeis] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);

  // Selected state for the bottom sheet
  const [leiSelecionada, setLeiSelecionada] = useState<TemaRow | null>(null);
  const [passo, setPasso] = useState<null | 'titulos' | 'artigos' | 'status' | 'quantidade' | 'ordem'>(null);
  const [statusSel, setStatusSel] = useState<string>('');
  const [quantidadeSel, setQuantidadeSel] = useState<number | 'todos' | undefined>(undefined);
  const [ordemSel, setOrdemSel] = useState<'sequencial' | 'embaralhado'>('sequencial');
  const [cardsDisponiveis, setCardsDisponiveis] = useState<{tema: string, artigo: string}[]>([]);
  const [titulosSelecionados, setTitulosSelecionados] = useState<string[]>([]);
  const [artigosSelecionados, setArtigosSelecionados] = useState<string[]>([]);
  const [showQuantidade, setShowQuantidade] = useState(false);

  // SEO & Prevenção de bug de scroll/pointer events
  useEffect(() => {
    document.title = 'Leis Secas em Flashcards | Vade Mecum PRIME';
    resetBodyScrollLock();
  }, []);

  const [loadingCards, setLoadingCards] = useState(false);
  const [etapaAlcancada, setEtapaAlcancada] = useState<number>(1);

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
      // Só mostra skeleton se não havia cache
      if (!localStorage.getItem(cacheKey)) {
        setLoadingCards(true);
      }
      const { data } = await supabase.from('flashcards_cards')
        .select('tema, artigo_numero')
        .ilike('tema', `${leiSelecionada.tema}%`);
      if (data) {
        const mapped = data.map(d => ({ tema: d.tema, artigo: d.artigo_numero || 'Geral' }));
        setCardsDisponiveis(mapped);
        try { localStorage.setItem(cacheKey, JSON.stringify(mapped)); } catch { /* ignora */ }
      }
      setLoadingCards(false);
    };
    fetchMeta();
    setPasso(null);
    setTitulosSelecionados([]);
    setArtigosSelecionados([]);
    setStatusSel('');
    setQuantidadeSel(undefined);
    setEtapaAlcancada(1);
  }, [leiSelecionada]);

  const infoPorTitulo = useMemo(() => {
    const map: Record<string, { count: number; minArt: number; maxArt: number }> = {};
    cardsDisponiveis.forEach(c => {
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
    const filtrados = cardsDisponiveis.filter(c => titulosSelecionados.length === 0 || titulosSelecionados.includes(c.tema));
    
    const getBaseArtigo = (art: string) => {
      if (!art || art === 'Geral') return 'Geral';
      const match = art.match(/^\D*(\d+(?:-[a-zA-Z]|[a-zA-Z])?)/);
      if (match) return match[1].toUpperCase();
      return art;
    };
    
    return Array.from(new Set(filtrados.map(c => getBaseArtigo(c.artigo)))).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA === numB) return a.localeCompare(b);
      return numA - numB;
    });
  }, [cardsDisponiveis, titulosSelecionados]);

  const cardsPorTitulo = useMemo(() => {
    const counts = {} as Record<string, number>;
    cardsDisponiveis.forEach(c => {
      counts[c.tema] = (counts[c.tema] || 0) + 1;
    });
    return counts;
  }, [cardsDisponiveis]);

  const LEIS_CACHE_KEY = 'flashcards_leis_counts_v1';

  useEffect(() => {
    let isMounted = true;

    // 0. Mostrar cache instantaneamente (stale-while-revalidate)
    try {
      const cached = localStorage.getItem(LEIS_CACHE_KEY);
      if (cached) {
        const parsed: TemaRow[] = JSON.parse(cached);
        if (parsed.length > 0 && isMounted) {
          setTodasLeis(parsed);
          setLoadingLeis(false);
        }
      }
    } catch { /* cache corrompido, ignora */ }

    const fetchAllLeis = async () => {
      // Se não tem cache, mostra skeleton
      if (!localStorage.getItem(LEIS_CACHE_KEY)) {
        setLoadingLeis(true);
      }

      try {
        // 1. Fetch vade mecum leis (Rápido)
        const { data: vmLeis, error: vmError } = await supabase
          .from('vade_mecum_leis')
          .select('nome, nome_curto, categoria, ordem')
          .order('ordem');
          
        if (vmError) throw vmError;

        const initialLeis: TemaRow[] = (vmLeis || []).map(lei => ({
          tema: lei.nome,
          nome_curto: lei.nome_curto,
          total: 0,
          compreendidos: 0,
          a_revisar: 0,
          area: lei.categoria
        }));

        // Se não havia cache, pelo menos mostra a lista (com 0)
        if (!localStorage.getItem(LEIS_CACHE_KEY) && isMounted) {
          setTodasLeis(initialLeis);
          setLoadingLeis(false);
        }

        // 2. Fetch all themes in background to get the flashcard counts
        if (areasRaw && areasRaw.length > 0) {
          // Include 'codigo' and 'lei' areas explicitly in case they aren't returned by flashcards_resumo_areas
          const areasToFetch = [...areasRaw];
          if (!areasToFetch.find(a => a.area === 'codigo')) areasToFetch.push({ area: 'codigo' } as any);
          if (!areasToFetch.find(a => a.area === 'lei')) areasToFetch.push({ area: 'lei' } as any);

          const promises = areasToFetch.map(a => 
            supabase.rpc('flashcards_temas', { _area: a.area })
              .then(res => {
                if (res.error) return [];
                return (res.data || []).map(t => ({ ...t, area: a.area }));
              })
          );
          const results = await Promise.all(promises);
          const flattenedTemas = results.flat() as TemaRow[];

          if (isMounted) {
            const updatedLeis = initialLeis.map(lei => {
              const prefix1 = lei.tema.toLowerCase();
              const prefix2 = (lei.nome_curto || '').toLowerCase();
              
              const matchingTemas = flattenedTemas.filter(t => {
                const temaLower = t.tema.toLowerCase();
                const match1 = temaLower === prefix1 || temaLower.startsWith(prefix1 + ' -') || temaLower.startsWith(prefix1 + ' (');
                const match2 = prefix2 ? (temaLower === prefix2 || temaLower.startsWith(prefix2 + ' -') || temaLower.startsWith(prefix2 + ' (')) : false;
                return match1 || match2;
              });

              const total = matchingTemas.reduce((acc, t) => acc + t.total, 0);
              const compreendidos = matchingTemas.reduce((acc, t) => acc + (t.compreendidos || 0), 0);
              const a_revisar = matchingTemas.reduce((acc, t) => acc + (t.a_revisar || 0), 0);
              const realArea = matchingTemas.length > 0 ? matchingTemas[0].area : lei.area;
              
              return { ...lei, total, compreendidos, a_revisar, area: realArea };
            });

            // Filter out laws that have 0 cards, so we only see laws that actually exist in flashcards
            const updatedLeisFiltradas = updatedLeis.filter(l => l.total > 0);

            setTodasLeis(updatedLeisFiltradas);
            setLoadingLeis(false);

            // 3. Salvar no cache para próxima visita instantânea
            try {
              localStorage.setItem(LEIS_CACHE_KEY, JSON.stringify(updatedLeisFiltradas));
            } catch { /* storage cheio, ignora */ }
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoadingLeis(false);
      }
    };

    fetchAllLeis();
    return () => { isMounted = false; };
  }, [areasRaw]);

  const listaFiltrada = useMemo(() => {
    let list = todasLeis;
    if (categoriaSelecionada) {
       list = list.filter(l => l.area === categoriaSelecionada);
    }
    if (!busca.trim()) return list;
    const q = busca.toLowerCase();
    return list.filter(t => t.tema.toLowerCase().includes(q) || (t.area && t.area.toLowerCase().includes(q)));
  }, [todasLeis, busca, categoriaSelecionada]);

  useGSAP(() => {
    if (listaFiltrada.length > 0) {
      gsap.fromTo('.lei-card', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.2)' }
      );
    }
  }, { dependencies: [listaFiltrada], scope: container });


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

  const getBaseArtigo = (art: string) => {
    if (!art || art === 'Geral') return 'Geral';
    const match = art.match(/^\D*(\d+(?:-[a-zA-Z]|[a-zA-Z])?)/);
    if (match) return match[1].toUpperCase();
    return art;
  };

  const cardsPorArtigo = useMemo(() => {
    const counts: Record<string, number> = {};
    const filtrados = cardsDisponiveis.filter(c => titulosSelecionados.length === 0 || titulosSelecionados.includes(c.tema));
    filtrados.forEach(c => {
      const baseArt = getBaseArtigo(c.artigo);
      counts[baseArt] = (counts[baseArt] || 0) + 1;
    });
    return counts;
  }, [cardsDisponiveis, titulosSelecionados]);

  const totalCardsFiltrados = useMemo(() => {
    return cardsDisponiveis.filter(c => {
      const matchTema = titulosSelecionados.length === 0 || titulosSelecionados.includes(c.tema);
      const baseArt = getBaseArtigo(c.artigo);
      const matchArt = artigosSelecionados.length === 0 || artigosSelecionados.includes(baseArt);
      return matchTema && matchArt;
    }).length;
  }, [cardsDisponiveis, titulosSelecionados, artigosSelecionados]);

  const renderTituloOpcao = (opcao: string) => {
    if (!leiSelecionada) return opcao;
    const prefix = leiSelecionada.tema + ' - ';
    const prefixCurto = (leiSelecionada.nome_curto || '') + ' - ';
    
    let name = opcao;
    if (opcao.toLowerCase().startsWith(prefix.toLowerCase())) {
      name = opcao.slice(prefix.length);
    } else if (prefixCurto !== ' - ' && opcao.toLowerCase().startsWith(prefixCurto.toLowerCase())) {
      name = opcao.slice(prefixCurto.length);
    }
    
    const info = infoPorTitulo[opcao];
    const count = info?.count || 0;
    const faixa = info && info.minArt < 999999 ? (
      info.minArt === info.maxArt ? `Art. ${info.minArt}` : `Arts. ${info.minArt} a ${info.maxArt}`
    ) : null;

    // Normalizar quebras de linha e espaços duplos
    const limpo = name.replace(/\r?\n/g, ' - ').replace(/\s+/g, ' ').trim();

    // Match para extrair rótulos estruturais em sequência (Ex: TÍTULO I - CAPÍTULO II - SEÇÃO III)
    const badges: string[] = [];
    let remaining = limpo;
    
    // Expressão regular para encontrar um rótulo estrutural no início da string
    const structRegex = /^(?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[\wºª]+(?:-[\wºª]+)?/i;
    
    while (true) {
      const match = remaining.match(structRegex);
      if (!match) break;
      
      badges.push(match[0].toUpperCase());
      remaining = remaining.slice(match[0].length).trim();
      
      // Remove hifens/dois pontos subsequentes
      if (remaining.startsWith('-') || remaining.startsWith('–') || remaining.startsWith(':')) {
        remaining = remaining.replace(/^[-–—:]+\s*/, '').trim();
      }
    }

    // Formata o nome final usando a mesma lógica de toSentence
    const formatSentence = (s: string) => {
      if (!s) return null;
      const minors = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'às', 'por', 'para', 'com', 'sem', 'sob', 'ou']);
      return s.toLowerCase().split(/\s+/).map((word, i) => {
        if (i === 0 || !minors.has(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      }).join(' ');
    };

    const description = formatSentence(remaining);

    return (
      <div className="flex w-full items-center justify-between pr-2 py-1">
        <div className="flex flex-col min-w-0 pr-2">
          {/* Linha superior: badges + seta + artigos */}
          {(badges.length > 0 || faixa) && (
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {badges.map((b, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-emerald-500/50 shrink-0" />}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    {b}
                  </span>
                </div>
              ))}
              {badges.length > 0 && faixa && (
                <ChevronRight className="h-3 w-3 text-emerald-500/50 shrink-0" />
              )}
              {faixa && (
                <span className="text-[11px] font-bold text-[#36AF85] whitespace-nowrap">
                  {faixa}
                </span>
              )}
            </div>
          )}
          {/* Nome descritivo */}
          {description && (
            <span className="text-[15px] font-bold text-zinc-100 leading-snug tracking-tight">
              {description}
            </span>
          )}
        </div>
        {count > 0 && (
          <span className="text-[12px] font-bold text-zinc-300 bg-zinc-800/90 border border-zinc-700/80 px-2.5 py-1 rounded-lg ml-2 whitespace-nowrap shrink-0 shadow-sm">
            {count} {count === 1 ? 'card' : 'cards'}
          </span>
        )}
      </div>
    );
  };

  const renderArtigoOpcao = (art: string) => {
    const count = cardsPorArtigo[art] || 0;
    const isNum = /^\d+$/.test(art);
    const label = isNum ? `Artigo ${art}` : art;
    return (
      <div className="flex w-full items-center justify-between pr-2 py-0.5">
        <span className="text-[15px] font-bold text-zinc-100">{label}</span>
        {count > 0 && (
          <span className="text-[12px] font-medium text-zinc-400 bg-zinc-800/80 border border-zinc-700/50 px-2.5 py-0.5 rounded-full ml-2 whitespace-nowrap shrink-0">
            {count} {count === 1 ? 'card' : 'cards'}
          </span>
        )}
      </div>
    );
  };

  const handleStartSession = () => {
    if (!leiSelecionada || !statusSel) return;
    haptic.selection?.();
    const p = new URLSearchParams();
    
    // Se selecionou títulos específicos, envia eles; se deixou vazio ("Todos"), envia todos os títulos únicos da lei
    const temasParaEnviar = titulosSelecionados.length > 0 ? titulosSelecionados : titulosUnicos;
    if (temasParaEnviar.length > 0) {
      p.set('temas', temasParaEnviar.join('|'));
    }
    
    if (artigosSelecionados.length > 0) {
      p.set('artigos', artigosSelecionados.join('|'));
    }
    
    p.set('modo', statusSel);
    p.set('limite', '9999'); // Sempre envia 9999 para garantir a filtragem dos artigos sem perda por paginação
    if (quantidadeSel && quantidadeSel !== 'todos') p.set('quantidade', quantidadeSel.toString());
    p.set('ordem', ordemSel);
    navigate(`/flashcards/estudar?${p.toString()}`);
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-28 lg:pb-12">
      <PageHeader title={categoriaSelecionada || "Leis e Códigos"} onBack={() => categoriaSelecionada ? setCategoriaSelecionada(null) : navigate('/flashcards')} />
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
            placeholder={categoriaSelecionada ? `Buscar em ${categoriaSelecionada}...` : "Buscar por nome da lei ou matéria..."}
            className="pl-10 h-12 rounded-2xl border-border bg-card shadow-sm text-base"
          />
        </div>

        {mostrarCategorias && !loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {groupedByCategoria.map(([cat, leis]) => {
              const Icon = CATEGORY_ICONS[cat] || BookOpen;
              return (
                <button
                  key={cat}
                  onClick={() => { haptic.selection(); setCategoriaSelecionada(cat); setBusca(''); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="flex flex-col items-center justify-center p-5 sm:p-6 bg-card border border-border/80 rounded-3xl hover:border-[#36AF85]/50 hover:shadow-md transition-all active:scale-[0.98] group"
                >
                  <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 text-muted-foreground group-hover:text-[#36AF85] group-hover:bg-[#36AF85]/10 transition-colors">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">{cat}</h3>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">{leis.length} {leis.length === 1 ? 'item' : 'itens'}</p>
                </button>
              );
            })}
          </div>
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
                onClick={() => { haptic.selection(); setCategoriaSelecionada(null); setBusca(''); }}
                className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para categorias
              </button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {listaFiltrada.map((lei) => {
                const progresso = lei.total ? Math.round((lei.compreendidos / lei.total) * 100) : 0;
                const strokeDasharray = 2 * Math.PI * 18; // r=18
                const strokeDashoffset = strokeDasharray - (strokeDasharray * progresso) / 100;
                
                return (
                  <button
                    key={lei.tema}
                    onClick={() => {
                      if (lei.total === 0) return; // Prevent clicking if no cards
                      haptic.selection();
                      setLeiSelecionada(lei);
                      setPasso('titulos');
                      setStatusSel('');
                    }}
                    className={`lei-card group flex items-center justify-between p-4 rounded-2xl border bg-card text-left transition-all ${lei.total > 0 ? 'border-border/80 hover:border-[#36AF85]/50 hover:shadow-md active:scale-[0.99] cursor-pointer' : 'border-border/40 opacity-70 cursor-default'}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Circular Progress */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 44 44">
                          {/* Background Circle */}
                          <circle
                            cx="22" cy="22" r="18"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="transparent"
                            className="text-muted/30"
                          />
                          {/* Progress Circle */}
                          <motion.circle
                            cx="22" cy="22" r="18"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="transparent"
                            strokeLinecap="round"
                            className={progresso > 0 ? "text-[#36AF85]" : "text-transparent"}
                            initial={{ strokeDashoffset: strokeDasharray }}
                            animate={{ strokeDashoffset: lei.total > 0 ? strokeDashoffset : strokeDasharray }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{ strokeDasharray }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className={`text-[10px] font-bold ${progresso > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{progresso}%</span>
                        </div>
                      </div>

                      <div className="flex flex-col min-w-0 pr-4">
                        <span className={`font-bold text-sm sm:text-base leading-tight line-clamp-2 transition-colors ${lei.total > 0 ? 'text-foreground group-hover:text-[#36AF85]' : 'text-muted-foreground'}`}>
                          {lei.tema}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-muted-foreground">
                          <span>{lei.total} {lei.total === 1 ? 'card' : 'cards'}</span>
                        </div>
                      </div>
                    </div>
                    {lei.total > 0 && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Wizard to Start Session for specific law */}
      <Sheet open={!!leiSelecionada} onOpenChange={(v) => !v && setLeiSelecionada(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t border-border/50 bg-background/95 p-0 backdrop-blur-xl h-[95dvh] flex flex-col shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 pb-4 pt-safe-header border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md">
            <button onClick={() => setLeiSelecionada(null)} aria-label="Voltar" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition-colors active:scale-95">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[20px] font-extrabold text-zinc-100 tracking-tight uppercase">
                <Scale className="h-5 w-5 text-[#36AF85]" /> CONFIGURAR SESSÃO
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-zinc-400 truncate">
                {leiSelecionada?.tema}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-4 pt-2">
            <StepRow
              step={1} label="Títulos"
              hint={titulosSelecionados.length ? `${titulosSelecionados.length} selecionado(s)` : (loadingCards ? 'Carregando títulos...' : 'Todos os títulos')}
              active={passo === 'titulos'} done={etapaAlcancada >= 2 || !!titulosSelecionados.length}
              badge={titulosSelecionados.length || undefined}
              onClick={() => setPasso('titulos')}
            />
            <StepRow
              step={2} label="Artigos"
              hint={artigosSelecionados.length ? `${artigosSelecionados.length} selecionado(s)` : 'Todos os artigos'}
              active={passo === 'artigos'} done={etapaAlcancada >= 3 || !!artigosSelecionados.length}
              locked={etapaAlcancada < 2}
              badge={artigosSelecionados.length || undefined}
              onClick={() => setPasso('artigos')}
            />
            <StepRow
              step={3} label="Status"
              hint={statusSel ? STATUS_LEIS.find(s => s.id === statusSel)?.label || '' : 'Selecione o status'}
              active={passo === 'status'} done={!!statusSel || etapaAlcancada >= 4}
              locked={etapaAlcancada < 3}
              onClick={() => setPasso('status')}
            />
            <StepRow
              step={4} label="Quantidade"
              hint={quantidadeSel === 'todos' ? 'Todos os flashcards' : (quantidadeSel ? `${quantidadeSel} flashcards` : 'Selecione a quantidade')}
              active={passo === 'quantidade'} done={etapaAlcancada >= 5}
              locked={etapaAlcancada < 4}
              onClick={() => setPasso('quantidade')}
            />
            <StepRow
              step={5} label="Ordem de Exibição"
              hint={ordemSel === 'sequencial' ? 'Sequencial' : 'Aleatório'}
              active={passo === 'ordem'} done={etapaAlcancada >= 5}
              locked={etapaAlcancada < 5}
              onClick={() => setPasso('ordem')}
            />
          </div>

          <div className="flex items-center gap-3 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
            <button
              onClick={handleStartSession}
              disabled={!statusSel}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#36AF85] hover:bg-[#2C9570] text-[16px] font-black text-white shadow-lg shadow-black/40 active:scale-[0.98] transition-all [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)] disabled:opacity-50"
            >
              Iniciar Sessão
            </button>
          </div>

          <AnimatePresence>
            {passo === 'titulos' && (
              <SelecaoSheet
                key="tit" titulo="Títulos" buscavel
                opcoes={titulosUnicos}
                selecionado={titulosSelecionados}
                loading={loadingCards}
                totalCount={cardsDisponiveis.length}
                itemHeight={86}
                onFechar={() => setPasso(null)}
                onConfirmar={(v) => { 
                  setTitulosSelecionados(v); 
                  setArtigosSelecionados([]); 
                  setEtapaAlcancada(prev => Math.max(prev, 2));
                  setPasso('artigos');
                }}
                renderOpcao={renderTituloOpcao}
              />
            )}
            {passo === 'artigos' && (
              <SelecaoSheet
                key="art" titulo="Artigos" buscavel
                opcoes={artigosUnicos}
                selecionado={artigosSelecionados}
                loading={loadingCards}
                totalCount={cardsDisponiveis.filter(c => titulosSelecionados.length === 0 || titulosSelecionados.includes(c.tema)).length}
                itemHeight={64}
                onFechar={() => setPasso(null)}
                onConfirmar={(v) => {
                  setArtigosSelecionados(v);
                  setEtapaAlcancada(prev => Math.max(prev, 3));
                  setPasso('status');
                }}
                renderOpcao={renderArtigoOpcao}
              />
            )}
            {passo === 'status' && (
              <StatusSheet
                key="status"
                statusSel={statusSel}
                totalCount={totalCardsFiltrados}
                onFechar={() => setPasso(null)}
                onConfirmar={(s) => {
                  setStatusSel(s);
                  setEtapaAlcancada(prev => Math.max(prev, 4));
                  setPasso('quantidade');
                }}
              />
            )}
            {passo === 'quantidade' && (
              <QuantidadeSheet
                key="qtd"
                quantidadeSel={quantidadeSel}
                totalCount={totalCardsFiltrados}
                onFechar={() => setPasso(null)}
                onConfirmar={(q) => {
                  setQuantidadeSel(q);
                  setEtapaAlcancada(prev => Math.max(prev, 5));
                  setPasso('ordem');
                }}
              />
            )}
            {passo === 'ordem' && (
              <SelecaoSheet
                key="ord" titulo="Ordem de Exibição" single
                opcoes={['Sequencial', 'Aleatório']}
                selecionado={[ordemSel === 'sequencial' ? 'Sequencial' : 'Aleatório']}
                onFechar={() => setPasso(null)}
                onConfirmar={(v) => {
                  setOrdemSel(v[0] === 'Sequencial' ? 'sequencial' : 'embaralhado');
                  setPasso(null);
                }}
              />
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* -------------------------------------------------- StatusSheet Customizada */
function StatusSheet({
  statusSel,
  totalCount,
  onFechar,
  onConfirmar,
}: {
  statusSel: string;
  totalCount: number;
  onFechar: () => void;
  onConfirmar: (status: string) => void;
}) {
  const [selecionados, setSelecionados] = useState<string[]>(() => {
    if (!statusSel) return [];
    if (statusSel === 'todos') return ['todos', 'novos', 'revisar'];
    return [statusSel];
  });

  const isTodosChecked = selecionados.includes('todos') || (selecionados.includes('novos') && selecionados.includes('revisar'));
  const isNovosChecked = selecionados.includes('novos') || isTodosChecked;
  const isRevisarChecked = selecionados.includes('revisar') || isTodosChecked;

  const toggleTodos = () => {
    haptic.selection?.();
    if (isTodosChecked) {
      setSelecionados([]);
    } else {
      setSelecionados(['todos', 'novos', 'revisar']);
    }
  };

  const toggleNovos = () => {
    haptic.selection?.();
    if (isTodosChecked) {
      setSelecionados(['revisar']);
    } else if (isNovosChecked) {
      setSelecionados(prev => prev.filter(x => x !== 'novos' && x !== 'todos'));
    } else {
      const next = [...selecionados.filter(x => x !== 'todos'), 'novos'];
      if (next.includes('revisar')) {
        setSelecionados(['todos', 'novos', 'revisar']);
      } else {
        setSelecionados(next);
      }
    }
  };

  const toggleRevisar = () => {
    haptic.selection?.();
    if (isTodosChecked) {
      setSelecionados(['novos']);
    } else if (isRevisarChecked) {
      setSelecionados(prev => prev.filter(x => x !== 'revisar' && x !== 'todos'));
    } else {
      const next = [...selecionados.filter(x => x !== 'todos'), 'revisar'];
      if (next.includes('novos')) {
        setSelecionados(['todos', 'novos', 'revisar']);
      } else {
        setSelecionados(next);
      }
    }
  };

  const handleConfirm = () => {
    if (selecionados.length === 0) return;
    haptic.selection?.();
    if (isTodosChecked || (!isNovosChecked && !isRevisarChecked)) {
      onConfirmar('todos');
    } else if (isNovosChecked) {
      onConfirmar('novos');
    } else if (isRevisarChecked) {
      onConfirmar('revisar');
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-20 flex flex-col bg-zinc-950 text-foreground"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/80 px-3 pt-safe-header pb-3 bg-zinc-900/90 backdrop-blur-md">
        <button
          onClick={onFechar}
          className="grid h-10 w-10 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-[17px] font-bold text-white">Status dos Cards</span>
        <div className="ml-auto">
          <button
            onClick={() => setSelecionados([])}
            className="text-[13px] font-medium text-zinc-400 hover:text-zinc-200"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Option: Todos os Cards */}
        <button
          type="button"
          onClick={toggleTodos}
          className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all text-left group ${
            isTodosChecked
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white">
              Todos os Cards
            </span>
            <span className="text-[12px] text-zinc-400 mt-0.5">
              Inclui cards novos e a revisar
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {totalCount > 0 && (
              <span className="text-[12px] font-semibold text-zinc-300 bg-zinc-800/90 border border-zinc-700/60 px-2.5 py-0.5 rounded-full">
                {totalCount} {totalCount === 1 ? 'card' : 'cards'}
              </span>
            )}
            <span className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
              isTodosChecked
                ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
                : 'border-zinc-700 bg-zinc-900/50'
            }`}>
              {isTodosChecked && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
            </span>
          </div>
        </button>

        {/* Option: Apenas Novos */}
        <button
          type="button"
          onClick={toggleNovos}
          className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all text-left group ${
            isNovosChecked
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white">
              Apenas Novos
            </span>
            <span className="text-[12px] text-zinc-400 mt-0.5">
              Cards que você ainda não estudou
            </span>
          </div>
          <span className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
            isNovosChecked
              ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
              : 'border-zinc-700 bg-zinc-900/50'
          }`}>
            {isNovosChecked && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
          </span>
        </button>

        {/* Option: A Revisar */}
        <button
          type="button"
          onClick={toggleRevisar}
          className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all text-left group ${
            isRevisarChecked
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white">
              A Revisar
            </span>
            <span className="text-[12px] text-zinc-400 mt-0.5">
              Cards marcados para repetição espaçada
            </span>
          </div>
          <span className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
            isRevisarChecked
              ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
              : 'border-zinc-700 bg-zinc-900/50'
          }`}>
            {isRevisarChecked && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
          </span>
        </button>
      </div>

      <div className="border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
        <button
          onClick={handleConfirm}
          disabled={selecionados.length === 0}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#36AF85] hover:bg-[#2C9570] text-[15px] font-bold text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          Confirmar Status
        </button>
      </div>
    </motion.div>
  );
}

