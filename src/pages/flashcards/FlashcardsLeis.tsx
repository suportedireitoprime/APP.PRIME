import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { ChevronRight, Search, Sparkles, Scale, BookOpen, Clock, FileText, Landmark, Users, Gavel, File, ArrowLeft, CheckCircle2, Circle, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { haptic } from '@/lib/nativeHaptics';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AnimatePresence } from 'framer-motion';
import { StepRow, SelecaoSheet } from '@/components/flashcards/FlashcardsFiltroSheet';

// Types
type TemaRow = {
  tema: string;
  total: number;
  estudados?: number;
  compreendidos: number;
  a_revisar: number;
  area?: string;
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
  'Códigos': Scale,
  'Estatutos': Users,
  'Constituição': Landmark,
  'Súmulas e Resoluções': Gavel,
  'Decretos': File,
  'Leis Especiais': FileText,
};

// Custom order for the categories
const CATEGORY_ORDER = ['Códigos', 'Estatutos', 'Leis Especiais', 'Constituição', 'Súmulas e Resoluções', 'Decretos'];

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

  // Selected state for the bottom sheet
  const [leiSelecionada, setLeiSelecionada] = useState<TemaRow | null>(null);
  const [passo, setPasso] = useState<null | 'titulos' | 'artigos' | 'status' | 'quantidade' | 'ordem'>(null);
  const [statusSel, setStatusSel] = useState<string>('');
  const [quantidadeSel, setQuantidadeSel] = useState<number | null>(null);
  const [ordemSel, setOrdemSel] = useState<'sequencial' | 'embaralhado'>('sequencial');
  const [cardsDisponiveis, setCardsDisponiveis] = useState<{tema: string, artigo: string}[]>([]);
  const [titulosSelecionados, setTitulosSelecionados] = useState<string[]>([]);
  const [artigosSelecionados, setArtigosSelecionados] = useState<string[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [etapaAlcancada, setEtapaAlcancada] = useState<number>(1);

  useEffect(() => {
    if (!leiSelecionada) return;
    const fetchMeta = async () => {
      setLoadingCards(true);
      const { data } = await supabase.from('flashcards_cards')
        .select('tema, artigo_numero')
        .ilike('tema', `${leiSelecionada.tema}%`);
      if (data) {
        setCardsDisponiveis(data.map(d => ({ tema: d.tema, artigo: d.artigo_numero || 'Geral' })));
      }
      setLoadingCards(false);
    };
    fetchMeta();
    setPasso(null);
    setTitulosSelecionados([]);
    setArtigosSelecionados([]);
    setStatusSel('');
    setQuantidadeSel(null);
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
    return Array.from(new Set(filtrados.map(c => c.artigo))).sort((a, b) => {
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

  useEffect(() => {
    document.title = 'Flashcards Leis | Vade Mecum PRIME';
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAllLeis = async () => {
      setLoadingLeis(true);
      try {
        // 1. Fetch vade mecum leis (Rápido)
        const { data: vmLeis, error: vmError } = await supabase
          .from('vade_mecum_leis')
          .select('nome, categoria, ordem')
          .order('ordem');
          
        if (vmError) throw vmError;

        // Mostrar instantaneamente as leis sem os contadores
        const initialLeis: TemaRow[] = (vmLeis || []).map(lei => ({
          tema: lei.nome,
          total: 0,
          compreendidos: 0,
          a_revisar: 0,
          area: lei.categoria
        }));

        if (isMounted) {
          setTodasLeis(initialLeis);
          setLoadingLeis(false); // Libera a UI instantaneamente
        }

        // 2. Fetch all themes in background to get the flashcard counts
        if (areasRaw && areasRaw.length > 0) {
          const promises = areasRaw.map(a => 
            supabase.rpc('flashcards_temas', { _area: a.area })
              .then(res => {
                if (res.error) return [];
                return (res.data || []).map(t => ({ ...t, area: a.area }));
              })
          );
          const results = await Promise.all(promises);
          const flattenedTemas = results.flat() as TemaRow[];

          if (isMounted) {
            setTodasLeis(prev => prev.map(lei => {
              const matchingTemas = flattenedTemas.filter(t => 
                t.tema === lei.tema || t.tema.startsWith(lei.tema + ' -') || t.tema.startsWith(lei.tema + ' (')
              );

              const total = matchingTemas.reduce((acc, t) => acc + t.total, 0);
              const compreendidos = matchingTemas.reduce((acc, t) => acc + (t.compreendidos || 0), 0);
              const a_revisar = matchingTemas.reduce((acc, t) => acc + (t.a_revisar || 0), 0);
              
              return { ...lei, total, compreendidos, a_revisar };
            }));
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
       list = list.filter(l => getCategoria(l.tema) === categoriaSelecionada);
    }
    if (!busca.trim()) return list;
    const q = busca.toLowerCase();
    return list.filter(t => t.tema.toLowerCase().includes(q) || (t.area && t.area.toLowerCase().includes(q)));
  }, [todasLeis, busca, categoriaSelecionada]);


  const groupedByCategoria = useMemo(() => {
    const groups: Record<string, TemaRow[]> = {};
    for (const lei of todasLeis) {
      const cat = getCategoria(lei.tema);
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

  const renderTituloOpcao = (opcao: string) => {
    if (!leiSelecionada) return opcao;
    const prefix = leiSelecionada.tema + ' - ';
    let name = opcao;
    if (opcao.startsWith(prefix)) {
      name = opcao.slice(prefix.length);
    }
    
    const info = infoPorTitulo[opcao];
    const count = info?.count || 0;
    const faixa = info && info.minArt < 999999 ? (
      info.minArt === info.maxArt ? `Art. ${info.minArt}` : `Arts. ${info.minArt} a ${info.maxArt}`
    ) : null;

    // Normalizar quebras de linha e espaços duplos
    const limpo = name.replace(/\r?\n/g, ' - ').replace(/\s+/g, ' ').trim();

    // Match para extrair rótulo estrutural (PARTE, LIVRO, TÍTULO, CAPÍTULO, SEÇÃO, SUBSEÇÃO)
    const match = limpo.match(/^((?:PARTE\s+\S+|LIVRO\s+\S+|T[ÍI]TULO\s+[\wºª-]+|CAP[ÍI]TULO\s+[\wºª-]+|SE[ÇC][ÃA]O\s+[\wºª-]+|SUBSE[ÇC][ÃA]O\s+[\wºª-]+))\s*[-–—:]?\s*(.*)$/i);
    
    const parte1 = match ? match[1].toUpperCase() : null;
    let parte2 = match && match[2] ? match[2].trim() : (!match ? limpo : null);
    if (parte2 && parte2.startsWith('-')) parte2 = parte2.replace(/^[-–—\s]+/, '').trim();
    const description = parte2 ? parte2.charAt(0).toUpperCase() + parte2.slice(1).toLowerCase() : null;

    return (
      <div className="flex w-full items-center justify-between pr-2 py-0.5">
        <div className="flex flex-col min-w-0 pr-2">
          {parte1 && (
            <span className="text-[11px] font-black text-zinc-400 tracking-wider uppercase">
              {parte1}
            </span>
          )}
          {description && (
            <span className="text-[15px] font-semibold text-zinc-100 mt-0.5 leading-snug">
              {description}
            </span>
          )}
          {faixa && (
            <span className="text-[12px] font-medium text-[#36AF85] mt-0.5">
              {faixa}
            </span>
          )}
        </div>
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
    haptic.selection();
    const p = new URLSearchParams();
    if (leiSelecionada.area) p.set('areas', leiSelecionada.area);
    p.set('temas', titulosSelecionados.length > 0 ? titulosSelecionados.join('|') : leiSelecionada.tema);
    if (artigosSelecionados.length > 0) p.set('artigos', artigosSelecionados.join('|'));
    p.set('modo', statusSel);
    p.set('limite', '9999'); // Sempre envia 9999 para garantir a filtragem dos artigos sem perda por paginação
    if (quantidadeSel) p.set('quantidade', quantidadeSel.toString());
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
                    className={`group flex items-center justify-between p-4 rounded-2xl border bg-card text-left transition-all ${lei.total > 0 ? 'border-border/80 hover:border-[#36AF85]/50 hover:shadow-md active:scale-[0.99] cursor-pointer' : 'border-border/40 opacity-70 cursor-default'}`}
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className={`font-bold text-sm sm:text-base leading-tight line-clamp-2 transition-colors ${lei.total > 0 ? 'text-foreground group-hover:text-[#36AF85]' : 'text-muted-foreground'}`}>
                        {lei.tema}
                      </span>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-muted-foreground">
                        <span>{lei.total} {lei.total === 1 ? 'card' : 'cards'}</span>
                        {progresso > 0 && (
                          <span className="flex items-center gap-1 text-[#36AF85]">
                            <Sparkles className="w-3 h-3" /> {progresso}% dominado
                          </span>
                        )}
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
              active={passo === 'titulos'} done={!!titulosSelecionados.length}
              badge={titulosSelecionados.length || undefined}
              onClick={() => setPasso('titulos')}
            />
            <StepRow
              step={2} label="Artigos"
              hint={artigosSelecionados.length ? `${artigosSelecionados.length} selecionado(s)` : 'Todos os artigos'}
              active={passo === 'artigos'} done={!!artigosSelecionados.length}
              locked={etapaAlcancada < 2}
              badge={artigosSelecionados.length || undefined}
              onClick={() => setPasso('artigos')}
            />
            <StepRow
              step={3} label="Status"
              hint={statusSel ? STATUS_LEIS.find(s => s.id === statusSel)?.label || '' : 'Selecione o status'}
              active={passo === 'status'} done={!!statusSel}
              locked={etapaAlcancada < 3}
              onClick={() => setPasso('status')}
            />
            <StepRow
              step={4} label="Quantidade"
              hint={quantidadeSel ? `${quantidadeSel} flashcards` : 'Todos os cards'}
              active={passo === 'quantidade'} locked={etapaAlcancada < 4}
              onClick={() => setPasso('quantidade')}
            />
            <StepRow
              step={5} label="Ordem de Exibição"
              hint={ordemSel === 'sequencial' ? 'Sequencial' : 'Aleatório'}
              active={passo === 'ordem'} locked={etapaAlcancada < 5}
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
                onFechar={() => setPasso(null)}
                onConfirmar={(v) => {
                  setArtigosSelecionados(v);
                  setEtapaAlcancada(prev => Math.max(prev, 3));
                  setPasso('status');
                }}
              />
            )}
            {passo === 'status' && (
              <SelecaoSheet
                key="status" titulo="Status" single
                opcoes={STATUS_LEIS.map(s => s.label)}
                selecionado={statusSel ? [STATUS_LEIS.find(s => s.id === statusSel)?.label || ''] : []}
                onFechar={() => setPasso(null)}
                onConfirmar={(v) => {
                  setStatusSel(STATUS_LEIS.find(s => s.label === v[0])?.id || '');
                  setEtapaAlcancada(prev => Math.max(prev, 4));
                  setPasso('quantidade');
                }}
              />
            )}
            {passo === 'quantidade' && (
              <SelecaoSheet
                key="qtd" titulo="Quantidade" single
                opcoes={['Todos', '10 flashcards', '20 flashcards', '50 flashcards', '100 flashcards']}
                selecionado={quantidadeSel ? [`${quantidadeSel} flashcards`] : []}
                onFechar={() => setPasso(null)}
                onConfirmar={(v) => {
                  setQuantidadeSel(v[0] && v[0] !== 'Todos' ? Number(v[0].replace(/\D/g, '')) : null);
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
