import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Scale, BookOpen, Clock, Gavel, Mic, MicOff, X, Loader2, Heart,
  Play, PenLine, FileText, Newspaper, Film, BookMarked, Stamp, ListChecks 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { track } from '@/lib/analyticsEvents';

import { LEIS_CATALOG } from '@/data/leisCatalog';
import { getRecentes, getPopularLeiIds, bumpLeiSearch } from '@/lib/leisRecentes';
import { isFavorito, toggleFavorito, LEIS_FAVORITOS_EVENT } from '@/lib/leisFavoritos';
import { useBuscaConteudo, type ConteudoTipo } from '@/hooks/useBuscaConteudo';
import ConteudoBusca from './ConteudoBusca';
import type { CategoriaKey } from './CategoriaFiltroBar'; // Still used for type, but we could redefine it

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSelectLei: (lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => void;
}

type UnifiedTab = 'tudo' | 'leis' | 'videoaula' | 'livro' | 'jurisprudencia' | 'blog' | 'resumo' | 'noticia' | 'obra' | 'dicionario' | 'sumula' | 'tese' | 'informativo' | 'pesquisa';

const TAB_LABELS: Record<UnifiedTab, string> = {
  tudo: 'Tudo',
  leis: 'Leis',
  videoaula: 'Videoaulas',
  livro: 'Livros',
  jurisprudencia: 'Jurisprudência',
  blog: 'Blog',
  resumo: 'Resumos',
  noticia: 'Notícias',
  obra: 'Filmes',
  dicionario: 'Dicionário',
  sumula: 'Súmulas',
  tese: 'Teses',
  informativo: 'Informativos',
  pesquisa: 'Pesquisas prontas',
};

const UNIFIED_TABS: UnifiedTab[] = [
  'tudo', 'leis', 'videoaula', 'livro', 'jurisprudencia', 'blog', 'resumo', 
  'noticia', 'obra', 'dicionario', 'sumula', 'tese', 'informativo', 'pesquisa'
];

// Prioridade padrão de relevância (fallback quando não há histórico de buscas)
const DEFAULT_ORDER = ['cf88', 'cp', 'cc', 'cpc', 'cpp', 'ctn', 'cdc', 'clt', 'eca', 'ctb', 'ei', 'epd'];

const getRankedTopLeis = (limit = 12) => {
  const popularIds = getPopularLeiIds();
  const order = [...popularIds, ...DEFAULT_ORDER.filter((id) => !popularIds.includes(id))];
  const byId = new Map(LEIS_CATALOG.map((l) => [l.id, l]));
  const ranked: typeof LEIS_CATALOG = [];
  for (const id of order) {
    const lei = byId.get(id);
    if (lei && !ranked.includes(lei)) ranked.push(lei);
    if (ranked.length >= limit) break;
  }
  return ranked;
};

const sortByRelevance = <T extends { id: string }>(list: T[]) => {
  const popular = getPopularLeiIds();
  const order = [...popular, ...DEFAULT_ORDER.filter((id) => !popular.includes(id))];
  return [...list].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
};

const identificarLeiPorTexto = (text: string) => {
  const artMatch = text.match(/art(?:igo)?\.?\s*(\d+[-a-zA-Z]*)/i);
  const artigoNumero = artMatch ? artMatch[1] : undefined;
  const upper = text.toUpperCase();

  const catalog = [...LEIS_CATALOG].sort((a, b) => b.sigla.length - a.sigla.length);
  for (const lei of catalog) {
    const sigla = lei.sigla.toUpperCase();
    if (!sigla) continue;
    const escaped = sigla.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`);
    if (regex.test(upper)) {
      return { lei, artigoNumero };
    }
  }
  return null;
};

const SearchOverlay = ({ open, onClose, onSelectLei }: SearchOverlayProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 100);
  const [activeTab, setActiveTab] = useState<UnifiedTab>('tudo');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const voice = useVoiceInput((text) => setQuery((prev) => (prev ? prev + ' ' : '') + text));
  const [favVersion, setFavVersion] = useState(0);

  useEffect(() => {
    const h = () => setFavVersion((v) => v + 1);
    window.addEventListener(LEIS_FAVORITOS_EVENT, h);
    return () => window.removeEventListener(LEIS_FAVORITOS_EVENT, h);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: Event) => {
      const s = (e as CustomEvent<string>).detail;
      if (typeof s === 'string') setQuery(s);
    };
    window.addEventListener('search:sugestao', handler);
    return () => window.removeEventListener('search:sugestao', handler);
  }, []);

  const isLeisMode = activeTab === 'leis' || activeTab === 'tudo';

  const filteredByNumero = useFuzzySearch(LEIS_CATALOG, isLeisMode ? query : '', {
    keys: ['descricao', 'sigla', 'nome', 'tags'],
    threshold: 0.35,
    limit: 40,
  });

  const leiNumericResults = useMemo(() => {
    if (!isLeisMode) return [] as typeof LEIS_CATALOG;
    const raw = query.trim();
    if (!raw) return [];
    
    const digits = raw.replace(/[^\d]/g, '');
    const cleanRaw = raw.toLowerCase().replace(/[^\w]/g, '');
    
    return LEIS_CATALOG.filter((l) => {
      const siglaClean = (l.sigla || '').toLowerCase().replace(/[^\w]/g, '');
      if (cleanRaw.length >= 2 && siglaClean === cleanRaw) return true;
      
      if (digits.length >= 2) {
        const descDigits = (l.descricao || '').replace(/[^\d]/g, '');
        if (descDigits.includes(digits)) return true;
      }
      return false;
    });
  }, [isLeisMode, query]);

  const leiResults = useMemo(() => {
    if (!isLeisMode || !query.trim()) return [] as typeof LEIS_CATALOG;
    const seen = new Set<string>();
    const merged: typeof LEIS_CATALOG = [];
    
    for (const l of leiNumericResults) {
      if (!seen.has(l.id)) { seen.add(l.id); merged.push(l); }
    }
    for (const l of filteredByNumero) {
      if (!seen.has(l.id)) { seen.add(l.id); merged.push(l); }
    }
    return merged.slice(0, 40);
  }, [isLeisMode, query, leiNumericResults, filteredByNumero]);

  const artigoQueryDigits = useMemo(() => (query.match(/\d+[-a-zA-Z]*/)?.[0] || '').replace(/^[a-zA-Z]+/, ''), [query]);
  const leiSearchTerm = useMemo(() => query
    .toLowerCase()
    .replace(/\d+[-a-zA-Z]*/g, '')
    .replace(/art(?:igo)?\.?/gi, '')
    .replace(/\b(do|da|de|no|na|paragrafo|parágrafo)\b/gi, '')
    .trim(), [query]);

  const baseArtigoLeis = useMemo(() => sortByRelevance(
    LEIS_CATALOG.filter((l) => l.tipo === 'constituicao' || l.tipo === 'codigo' || l.tipo === 'estatuto')
  ), []);

  const artigoLeis = useMemo(() => {
    if (!isLeisMode || !artigoQueryDigits) return [];
    if (!leiSearchTerm) return baseArtigoLeis;
    const matched = baseArtigoLeis.filter((l) =>
      l.nome.toLowerCase().includes(leiSearchTerm) ||
      l.descricao.toLowerCase().includes(leiSearchTerm) ||
      leiSearchTerm.includes(l.sigla.toLowerCase()) ||
      l.sigla.toLowerCase() === leiSearchTerm
    );
    return matched.length > 0 ? matched : baseArtigoLeis;
  }, [isLeisMode, artigoQueryDigits, leiSearchTerm, baseArtigoLeis]);

  const placeholder = voice.listening
    ? 'Ouvindo…'
    : 'Pesquise artigos, leis, conteúdo, jurisprudência...';

  const emitSelect = (lei: typeof LEIS_CATALOG[number], artigoNumero?: string) => {
    bumpLeiSearch(lei.id);
    track('search_lei_selecionada', {
      lei_id: lei.id,
      lei_nome: lei.nome,
      modo: activeTab,
      artigo_numero: artigoNumero,
      query: debouncedQuery.trim().slice(0, 80),
    });
    onSelectLei({
      tipo: lei.tipo,
      leiId: lei.id,
      nome: lei.nome,
      descricao: lei.descricao,
      tabela_nome: lei.tabela_nome,
      artigoNumero,
    });
    onClose();
  };

  const openArtigoInLei = (lei: typeof LEIS_CATALOG[number]) => emitSelect(lei, artigoQueryDigits);

  const getConteudoBuscaProps = () => {
    if (activeTab === 'tudo') return { grupo: 'conteudo' as const, categoria: 'tudo' as CategoriaKey };
    if (activeTab === 'jurisprudencia') return { grupo: 'jurisprudencia' as const, categoria: 'tudo' as CategoriaKey };
    
    // É uma categoria específica
    const isJurisCategory = ['sumula', 'tese', 'informativo', 'pesquisa'].includes(activeTab);
    return {
      grupo: (isJurisCategory ? 'jurisprudencia' : 'conteudo') as 'conteudo' | 'jurisprudencia',
      categoria: activeTab as CategoriaKey
    };
  };

  return (
    <AnimatePresence>
      {open && (
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[49] bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed z-50 inset-x-0 bottom-0 top-[10vh] bg-background flex flex-col rounded-t-3xl lg:top-[10%] lg:max-w-[800px] lg:mx-auto lg:rounded-t-2xl lg:shadow-2xl"
        >
          {/* Header: back + título */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0"
              aria-label="Fechar"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="font-display text-lg font-semibold text-foreground tracking-wide">Pesquise leis e artigos</h2>
            </div>
            <div className="w-12 shrink-0" />
          </div>

          {/* Barra de pesquisa */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={voice.listening && voice.partial ? voice.partial : query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                inputMode="text"
                className="pl-11 pr-4 h-14 bg-muted border-none text-base rounded-xl"
              />
              {query !== debouncedQuery && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={voice.toggle}
              aria-label={voice.listening ? 'Parar' : 'Buscar por voz'}
              className={`btn-attention-shine w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all shadow-lg ${
                voice.listening
                  ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                  : 'bg-primary text-primary-foreground shadow-primary/30'
              }`}
            >
              {voice.listening ? <MicOff className="w-6 h-6 relative z-[2]" /> : <Mic className="w-6 h-6 relative z-[2]" />}
            </button>
          </div>

          {/* Unified Tabs Menu (substituindo CategoriaFiltroBar e Mode Toggle) */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 pt-2 pb-3">
            {UNIFIED_TABS.map((tab) => {
              const active = activeTab === tab;
              
              const getTabIcon = () => {
                switch (tab) {
                  case 'tudo': return <Search className="w-4 h-4" />;
                  case 'leis': return <Scale className="w-4 h-4" />;
                  case 'jurisprudencia': return <Gavel className="w-4 h-4" />;
                  case 'videoaula': return <Play className="w-4 h-4" />;
                  case 'livro': return <BookOpen className="w-4 h-4" />;
                  case 'blog': return <PenLine className="w-4 h-4" />;
                  case 'resumo': return <FileText className="w-4 h-4" />;
                  case 'noticia': return <Newspaper className="w-4 h-4" />;
                  case 'obra': return <Film className="w-4 h-4" />;
                  case 'dicionario': return <BookMarked className="w-4 h-4" />;
                  case 'sumula': return <Stamp className="w-4 h-4" />;
                  case 'tese': return <ListChecks className="w-4 h-4" />;
                  case 'informativo': return <Gavel className="w-4 h-4" />;
                  case 'pesquisa': return <Search className="w-4 h-4" />;
                  default: return null;
                }
              };

              return (
                <button
                  key={tab}
                  onClick={() => {
                    track('search_tab_selecionada', { tab });
                    setActiveTab(tab);
                  }}
                  className={`shrink-0 px-4 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                      : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                  }`}
                >
                  {getTabIcon()}
                  {TAB_LABELS[tab]}
                </button>
              );
            })}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-2 pb-6 relative border-t border-border/50">
            {isLeisMode && (() => {
              const temTextoSemNumero = !artigoQueryDigits && query.trim().length >= 1;
              const leisPorTexto = temTextoSemNumero ? leiResults : [];
              return (
              <div className="space-y-2 mb-4">
                {!artigoQueryDigits && !temTextoSemNumero && activeTab === 'leis' && (
                  <div className="px-4 py-8 space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Search className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pesquise por qualquer lei ou código. Você pode usar siglas (ex: CF, CP, CDC) ou o número da lei (ex: 8078).
                      </p>
                    </div>
                  </div>
                )}
                {temTextoSemNumero && (
                  <>
                    {leisPorTexto.length > 0 && (
                      <p className="text-xs uppercase tracking-wider text-muted-foreground py-2 px-3 font-semibold mt-2">
                        Leis encontradas
                      </p>
                    )}
                    {leisPorTexto.map((lei) => {
                      const fav = isFavorito(lei.id);
                      return (
                      <div
                        key={lei.id + ':' + favVersion}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all"
                      >
                        <button
                          onClick={() => emitSelect(lei)}
                          className="flex items-center gap-4 flex-1 min-w-0 text-left"
                        >
                          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-red-500">{lei.sigla}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-foreground truncate">{lei.nome}</p>
                            <p className="text-sm text-muted-foreground truncate">{lei.descricao}</p>
                          </div>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorito({ tipo: lei.tipo, leiId: lei.id, nome: lei.nome, descricao: lei.descricao, tabela_nome: lei.tabela_nome }); }}
                          aria-label={fav ? 'Remover dos favoritos' : 'Favoritar lei'}
                          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform ${fav ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          <Heart className={`w-6 h-6 ${fav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      );
                    })}
                  </>
                )}
                {artigoQueryDigits && (
                  <>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground py-2 px-3">
                      Artigo {artigoQueryDigits} em… (por relevância)
                    </p>
                    <AnimatePresence initial={false}>
                    {artigoLeis.map((lei, i) => (
                      <motion.button
                        key={lei.id}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02, type: 'spring', stiffness: 260, damping: 22 }}
                        onClick={() => openArtigoInLei(lei)}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left"
                      >
                        <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-red-500">{lei.sigla}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-foreground truncate">{lei.nome}</p>
                          <p className="text-sm text-muted-foreground truncate">{lei.descricao}</p>
                        </div>
                        <div className="shrink-0 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-bold">
                          Art. {artigoQueryDigits}
                        </div>
                      </motion.button>
                    ))}
                    </AnimatePresence>
                  </>
                )}
              </div>
              );
            })()}

            {/* Conteúdo dinâmico da busca do Supabase (Videoaulas, Livros, Jurisprudência, etc) */}
            {activeTab !== 'leis' && (
              <ConteudoBusca 
                query={debouncedQuery} 
                onNavigate={onClose} 
                {...getConteudoBuscaProps()} 
              />
            )}

          </div>

        </motion.div>

        </>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
