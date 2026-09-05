import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { track } from '@/lib/analyticsEvents';

import { LEIS_CATALOG } from '@/data/leisCatalog';
import { bumpLeiSearch } from '@/lib/leisRecentes';
import { LEIS_FAVORITOS_EVENT } from '@/lib/leisFavoritos';
import ConteudoBusca from '@/components/vademecum/ui_elements/ConteudoBusca';
import type { CategoriaKey } from '@/components/vademecum/ui_elements/CategoriaFiltroBar';

import { UnifiedTab, sortByRelevance } from './chunks/searchUtils';
import { SearchOverlayHeader } from './chunks/SearchOverlayHeader';
import { SearchOverlayLeiResults } from './chunks/SearchOverlayLeiResults';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSelectLei: (lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => void;
}

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
          className="fixed z-50 inset-0 bg-background flex flex-col lg:top-[10%] lg:bottom-auto lg:h-[80vh] lg:max-w-[800px] lg:mx-auto lg:rounded-2xl lg:shadow-2xl"
        >
          <SearchOverlayHeader
            onClose={onClose}
            inputRef={inputRef}
            query={query}
            setQuery={setQuery}
            debouncedQuery={debouncedQuery}
            placeholder={placeholder}
            voice={voice}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <div className="flex-1 overflow-y-auto px-2 pb-[calc(3.5rem+var(--sai-bottom))] relative border-t border-border/50 pt-2">
            {activeTab !== 'leis' && (
              <ConteudoBusca 
                query={debouncedQuery} 
                onNavigate={onClose} 
                {...getConteudoBuscaProps()} 
              />
            )}

            {isLeisMode && (
              <SearchOverlayLeiResults
                query={query}
                activeTab={activeTab}
                artigoQueryDigits={artigoQueryDigits}
                temTextoSemNumero={!artigoQueryDigits && query.trim().length >= 1}
                leisPorTexto={(!artigoQueryDigits && query.trim().length >= 1) ? leiResults : []}
                artigoLeis={artigoLeis}
                favVersion={favVersion}
                emitSelect={emitSelect}
                openArtigoInLei={openArtigoInLei}
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
