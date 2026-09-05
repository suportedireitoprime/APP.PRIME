import React, { useMemo, useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, LayoutGrid, History, Mic, MicOff, Camera, X as XIcon, Heart, ListMusic, StickyNote, Radar, ArrowUp, ArrowLeft, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumGate from '@/components/PremiumGate';
import { Input } from '@/components/ui/input';
import { toggleArtigoFavorito } from '@/lib/artigosFavoritos';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useIsTablet } from '@/hooks/use-tablet';
import { track } from '@/lib/analyticsEvents';
import { useLeiData } from '@/hooks/domain/useLeiData';
import { useLeiUserTags } from '@/hooks/domain/useLeiUserTags';
import { useLeiArtigos } from '@/hooks/domain/useLeiArtigos';
import { getLeiColor } from '@/lib/leiTheme';
import { prefetchRadarData } from '@/components/vademecum/outros/RadarLegislacaoContent';
import type { ArtigoLei } from '@/data/mockData';
import ArtigoBottomSheet from '@/components/vademecum/artigo/ArtigoBottomSheet';
import OcrScanner from '@/components/vademecum/grifos_ocr/OcrScanner';
import GrafoOverlay from '@/components/vademecum/overlays/GrafoOverlay';
import NovidadesPanel from '@/components/vademecum/panels/NovidadesPanel';
import { FavPanel, PlaylistPanel, AnotacoesPanel } from '@/components/vademecum/panels/OverlayPanels';
import RadarLegislacaoContent from '@/components/vademecum/outros/RadarLegislacaoContent';
import LeiHero from '@/components/vademecum/artigo/LeiHero';
import LeiArtigosVirtualList from '@/components/vademecum/artigo/LeiArtigosVirtualList';
import LeiCapitulosGrid from '@/components/vademecum/artigo/LeiCapitulosGrid';

const MOBILE_ARTIGOS_VIRTUAL_THRESHOLD = 120;

interface LeiDetailViewProps {
  tipo: string | undefined;
  leis: any[];
  selectedLeiId: string;
  selectedLeiNome: string;
  selectedLeiDescricao: string;
  selectedTabelaNome: string | null;
  subcat: string;
  config: { label: string; icon: React.ElementType; bg: string } | null;
  goBack: () => void;
  pendingArtigoNumero: string | null;
  setPendingArtigoNumero: (v: string | null) => void;
}

const LeiDetailView: React.FC<LeiDetailViewProps> = ({
  tipo,
  leis,
  selectedLeiId,
  selectedLeiNome,
  selectedLeiDescricao,
  selectedTabelaNome,
  subcat,
  config,
  goBack,
  pendingArtigoNumero,
  setPendingArtigoNumero,
}) => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();
  const isMasterDetail = isDesktop || isTablet;

  const { isPremium } = useSubscription();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [premiumGateDesc, setPremiumGateDesc] = useState('');
  const [premiumGateFeature, setPremiumGateFeature] = useState<'radar' | 'favorito'>('radar');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'art' | 'cap' | 'rec' | 'lot'>('art');
  const [overlayPanel, setOverlayPanel] = useState<'fav' | 'playlist' | 'novidades' | 'anotacoes' | 'radar' | null>(null);
  
  const [showFooter, setShowFooter] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowFooter(true), 380);
    return () => clearTimeout(t);
  }, []);

  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const voiceSearch = useVoiceInput((text) => {
    if (!text) return;
    setSearchQuery(text);
    setTimeout(() => handleSearch(text), 0);
  });

  const [stickySearch, setStickySearch] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [showGrafo, setShowGrafo] = useState(false);

  const [expandedTitulo, setExpandedTitulo] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [favoritos, setFavoritos] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('vademecum-favoritos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [openArtigo, setOpenArtigo] = useState<ArtigoLei | null>(null);
  const [openFromNovidades, setOpenFromNovidades] = useState(false);
  const [openModInfo, setOpenModInfo] = useState<any | null>(null);
  const [highlightedArtigoId, setHighlightedArtigoId] = useState<string | null>(null);

  // Hooks do domínio
  const { artigos, loadingArtigos, loadedKey } = useLeiArtigos(selectedLeiId, selectedTabelaNome);
  const { selectedLeiEmenta, dbAlteracoes, loadingDbAlteracoes, playlistNarracoes, loadingPlaylist } = useLeiData(selectedLeiId, selectedTabelaNome, overlayPanel);
  const { grifadoNumeros, anotadoNumeros, favArtigoNumeros, leiFavToggle, setLeiFavToggle, setFavArtigoNumeros } = useLeiUserTags(selectedTabelaNome);

  useEffect(() => {
    if (!selectedTabelaNome) { setRecentIds([]); return; }
    try {
      const raw = localStorage.getItem(`recentes_artigos_${selectedTabelaNome}`);
      setRecentIds(raw ? JSON.parse(raw) : []);
    } catch { setRecentIds([]); }
  }, [selectedTabelaNome]);

  const openArtigoWithRecent = useCallback((artigo: ArtigoLei) => {
    track('legislacao_artigo_opened', { lei_id: selectedLeiId, lei_nome: selectedLeiNome, tabela: selectedTabelaNome, artigo_id: artigo.id, artigo_numero: artigo.numero });
    setOpenArtigo(artigo);
    if (!selectedTabelaNome) return;
    setRecentIds(prev => {
      const next = [String(artigo.id), ...prev.filter(id => id !== String(artigo.id))].slice(0, 30);
      try { localStorage.setItem(`recentes_artigos_${selectedTabelaNome}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [selectedTabelaNome, selectedLeiId, selectedLeiNome]);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as { artigo?: ArtigoLei } | undefined;
      if (detail?.artigo) setOpenArtigo(detail.artigo);
    };
    window.addEventListener('narracao-flutuante:reopen', handler);
    return () => window.removeEventListener('narracao-flutuante:reopen', handler);
  }, []);

  const togglePlayAudio = useCallback((url: string) => {
    if (playingUrl === url && audioRef.current) {
      audioRef.current.pause();
      setPlayingUrl(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => { setPlayingUrl(null); audioRef.current = null; };
    audioRef.current = audio;
    setPlayingUrl(url);
  }, [playingUrl]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 320);
    window.addEventListener('scroll', handleScroll, { passive: true });
    const observer = new IntersectionObserver(([entry]) => setStickySearch(!entry.isIntersecting), { threshold: 0 });
    const el = searchBarRef.current;
    if (el) observer.observe(el);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (el) observer.unobserve(el);
    };
  }, []);

  const isArtigoFav = (a: { id: string; numero: string | number }) => {
    const num = String(a.numero || '').replace(/^Art\.\s*/i, '').trim();
    return favoritos.has(a.id) || favArtigoNumeros.has(num) || favArtigoNumeros.has(String(a.numero));
  };

  useEffect(() => {
    if (!selectedLeiId || !selectedLeiNome) return;
    prefetchRadarData(selectedLeiNome, selectedTabelaNome);
  }, [selectedLeiId, selectedLeiNome, selectedTabelaNome]);

  const filteredArtigos = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) return artigos;
    const q = raw.replace(/[^\d\-a-zA-Z]/g, '').replace(/^[a-zA-Z]+/, '').toLowerCase();
    if (!q) {
      const lower = raw.toLowerCase();
      return artigos.filter(a => (a.caput || '').toLowerCase().includes(lower) || (a.numero || '').toLowerCase().includes(lower));
    }
    return artigos.filter(a => {
      const artNum = (a.numero || '').replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim().toLowerCase();
      return artNum === q;
    });
  }, [artigos, searchQuery]);

  const handleSearch = (override?: string) => {
    const raw = (override ?? searchQuery).trim();
    if (!raw) return;
    const digits = raw.replace(/[^\d\-a-zA-Z]/g, '').replace(/^[a-zA-Z]+/, '');
    if (!digits) return;
    const found = artigos.find(a => {
      const artNum = a.numero.replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim();
      return artNum === digits;
    }) || artigos.find(a => {
      const artNum = a.numero.replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim();
      return artNum.startsWith(digits);
    });
    if (found) {
      (document.activeElement as HTMLElement)?.blur();
      setHighlightedArtigoId(found.id);
      const tryScrollAndOpen = (attempts = 0) => {
        const el = document.getElementById(`artigo-${found.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            setOpenArtigo(found);
            setTimeout(() => setHighlightedArtigoId(null), 2500);
          }, 900);
        } else if (attempts < 20) {
          setTimeout(() => tryScrollAndOpen(attempts + 1), 100);
        } else {
          setOpenArtigo(found);
          setTimeout(() => setHighlightedArtigoId(null), 2500);
        }
      };
      setTimeout(() => tryScrollAndOpen(), 200);
    }
  };

  useEffect(() => {
    if (!pendingArtigoNumero) return;
    if (artigos.length === 0) return;
    const digits = pendingArtigoNumero.replace(/[^\d\-a-zA-Z]/g, '').replace(/^[a-zA-Z]+/, '');
    if (!digits) { setPendingArtigoNumero(null); return; }
    const found = artigos.find((a) => {
      const artNum = a.numero.replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim();
      return artNum === digits;
    }) || artigos.find((a) => {
      const artNum = a.numero.replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim();
      return artNum.startsWith(digits);
    });
    if (found) {
      setHighlightedArtigoId(found.id);
      setOpenArtigo(found);
      setTimeout(() => setHighlightedArtigoId(null), 2500);
    }
    setPendingArtigoNumero(null);
  }, [artigos, pendingArtigoNumero]);

  const showTitulos = useMemo(() => artigos.length > 0 && artigos.some(a => a.titulo && a.titulo.trim() !== ''), [artigos]);

  const capituloGroups = useMemo(() => {
    const isTituloRow = (n: string) => /^\s*T[ÍI]TULO\s+[IVXLCDM0-9]/i.test(n || '');
    const isCapituloRow = (n: string) => /^\s*CAP[ÍI]TULO\s+[IVXLCDM0-9]/i.test(n || '');
    const isStructuralRow = (n: string) => /^\s*(PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[IVXLCDM0-9]/i.test(n || '');

    type CapGroup = { capitulo: string; artigos: typeof artigos };
    type TituloGroup = { titulo: string; capitulos: CapGroup[] };

    const groups: TituloGroup[] = [];
    const tituloMap = new Map<string, TituloGroup>();
    const ensureTitulo = (key: string) => {
      if (!tituloMap.has(key)) {
        const g: TituloGroup = { titulo: key, capitulos: [] };
        tituloMap.set(key, g);
        groups.push(g);
      }
      return tituloMap.get(key)!;
    };
    const ensureCap = (t: TituloGroup, key: string) => {
      let c = t.capitulos.find(x => x.capitulo === key);
      if (!c) { c = { capitulo: key, artigos: [] }; t.capitulos.push(c); }
      return c;
    };

    if (showTitulos) {
      for (const art of artigos) {
        const rawTitulo = art.titulo || 'Sem título';
        const tituloKey = rawTitulo === 'Sem título' ? 'TÍTULO I - DA APLICAÇÃO DA LEI PENAL' : rawTitulo;
        const capKey = art.capitulo || '__sem_capitulo__';
        const t = ensureTitulo(tituloKey);
        ensureCap(t, capKey).artigos.push(art);
      }
      return groups;
    }

    let currentTitulo: string | null = null;
    let currentCapitulo: string | null = null;
    let sawStructural = false;

    for (const art of artigos) {
      const num = (art.numero || '').trim();
      if (isTituloRow(num)) {
        sawStructural = true;
        let sub = (art.caput || '').replace(/<[^>]+>/g, '').trim();
        const dupRe = new RegExp(`^${num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:]?\\s*`, 'i');
        sub = sub.replace(dupRe, '').trim();
        currentTitulo = sub ? `${num} - ${sub}` : num;
        currentCapitulo = null;
        continue;
      }
      if (isCapituloRow(num)) {
        sawStructural = true;
        let sub = (art.caput || '').replace(/<[^>]+>/g, '').trim();
        const dupRe = new RegExp(`^${num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:]?\\s*`, 'i');
        sub = sub.replace(dupRe, '').trim();
        currentCapitulo = sub ? `${num} - ${sub}` : num;
        if (!currentTitulo) currentTitulo = 'TÍTULO ÚNICO';
        continue;
      }
      if (isStructuralRow(num)) continue;

      const tKey = currentTitulo || '__no_titulo__';
      const cKey = currentCapitulo || '__sem_capitulo__';
      ensureCap(ensureTitulo(tKey), cKey).artigos.push(art);
    }

    if (!sawStructural && artigos.length > 0) {
      const t = ensureTitulo('__no_titulo__');
      ensureCap(t, '__sem_capitulo__').artigos.push(...artigos);
    }
    return groups;
  }, [artigos, showTitulos]);

  const visibleArtigos = useMemo(() => {
    if (!isMasterDetail || !expandedTitulo) return filteredArtigos;
    const ids = new Set<string>();
    for (const tg of capituloGroups) {
      for (const cg of tg.capitulos) {
        const ck = `${tg.titulo}__${cg.capitulo}`;
        if (ck === expandedTitulo) {
          cg.artigos.forEach((a) => ids.add(String(a.id)));
          return filteredArtigos.filter((a) => ids.has(String(a.id)));
        }
      }
    }
    return [];
  }, [capituloGroups, expandedTitulo, filteredArtigos, isMasterDetail]);

  const shouldVirtualizeArtigos = Boolean(
    selectedLeiId &&
    activeTab === 'art' &&
    !searchQuery.trim() &&
    visibleArtigos.length > MOBILE_ARTIGOS_VIRTUAL_THRESHOLD
  );

  const leiAccent = getLeiColor(selectedLeiId, tipo);

  const overlayLabels: Record<string, { label: string; icon: typeof Heart; desc: string }> = {
    fav: { label: 'Favoritos', icon: Heart, desc: 'Aqui ficam os artigos que você marcou com o coração. Favoritar facilita o acesso rápido aos dispositivos que você mais consulta.' },
    playlist: { label: 'Playlist', icon: ListMusic, desc: 'Ouça as narrações dos artigos desta lei. Ideal para estudar enquanto faz outras atividades — basta gerar as narrações na tela de Narração.' },
    anotacoes: { label: 'Anotações', icon: StickyNote, desc: 'Veja todas as suas anotações e grifos desta lei em um só lugar. Para criar, abra um artigo e grife um trecho.' },
    novidades: { label: 'Histórico', icon: History, desc: 'Histórico de alterações legislativas — veja quais artigos foram incluídos, revogados ou modificados, organizados por ano.' },
    radar: { label: 'Radar', icon: Radar, desc: 'Proposições em tramitação no Congresso que podem alterar esta legislação. Acompanhe os projetos de lei em tempo real.' },
  };
  
  const overlayContents: Record<string, React.ReactNode> = {
    fav: <FavPanel artigos={artigos} isArtigoFav={isArtigoFav} onOpenArtigo={(a) => { setOverlayPanel(null); setOpenArtigo(a); }} accentColor={leiAccent} grifadoNumeros={grifadoNumeros} anotadoNumeros={anotadoNumeros} />,
    playlist: <PlaylistPanel artigos={artigos} playlistNarracoes={playlistNarracoes} loadingPlaylist={loadingPlaylist} playingUrl={playingUrl} togglePlayAudio={togglePlayAudio} onOpenArtigo={(a) => { setOverlayPanel(null); setOpenArtigo(a); }} />,
    anotacoes: <AnotacoesPanel />,
    novidades: <NovidadesPanel artigos={artigos} dbAlteracoes={dbAlteracoes} loadingDbAlteracoes={loadingDbAlteracoes} onOpenArtigo={(a, modInfo) => { setOverlayPanel(null); setOpenFromNovidades(true); setOpenModInfo(modInfo); setOpenArtigo(a); }} />,
    radar: <RadarLegislacaoContent leiNome={selectedLeiNome} tabelaNome={selectedTabelaNome} navigate={navigate} />,
  };

  return (
    <div className="theme-vademecum min-h-dvh bg-background pb-28 lg:pb-0">
      <PremiumGate 
        isOpen={showPremiumGate} 
        onClose={() => setShowPremiumGate(false)} 
        feature={premiumGateFeature} 
        description={premiumGateDesc} 
      />

      <LeiHero 
        isDesktop={isDesktop}
        selectedLeiId={selectedLeiId}
        tipo={tipo}
        leis={leis}
        selectedLeiNome={selectedLeiNome}
        selectedLeiDescricao={selectedLeiDescricao}
        config={config}
        goBack={goBack}
        leiFavToggle={leiFavToggle}
        setLeiFavToggle={setLeiFavToggle}
        selectedLeiEmenta={selectedLeiEmenta}
      />

      <div id="lei-conteudo" className={`mx-auto px-2 sm:px-4 md:px-6 scroll-mt-2 ${isDesktop ? 'max-w-7xl pt-3 space-y-3' : 'max-w-5xl pt-4 space-y-4'}`}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1], delay: 0.06 }}
          className={isDesktop ? 'sticky top-0 z-40 -mx-2 sm:-mx-4 md:-mx-6 px-2 sm:px-4 md:px-6 py-3 bg-background/95 backdrop-blur-md border-b border-border/60 space-y-2.5' : 'space-y-4'}
        >
          <div ref={searchBarRef} className={`mx-auto w-full ${isDesktop ? 'max-w-none' : ''}`}>
            <form className="flex items-center gap-2.5 min-w-0" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" />
                <Input
                  value={voiceSearch.listening ? (voiceSearch.partial || searchQuery) : searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar artigo..."
                  className={`rounded-2xl bg-secondary border-border pl-10 pr-20 text-sm font-medium ${isDesktop ? 'h-12' : 'h-12'}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && !voiceSearch.listening && (
                    <button type="button" onClick={() => { setSearchQuery(''); handleSearch(''); }} className="p-1.5 rounded-full hover:bg-background/40 text-muted-foreground" aria-label="Limpar busca">
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => setOcrOpen(true)} aria-label="Fotografar artigo (OCR)" className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => voiceSearch.toggle()}
                aria-label={voiceSearch.listening ? 'Parar gravação' : 'Buscar por voz'}
                className={`relative overflow-hidden shrink-0 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition ${isDesktop ? 'w-11 h-11' : 'w-14 h-14'} ${voiceSearch.listening ? 'bg-hero-panel text-white animate-pulse shadow-red-950/50' : 'bg-hero-panel text-white shadow-red-950/40'}`}
              >
                {voiceSearch.listening && <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />}
                {voiceSearch.listening ? <MicOff className={`relative z-[2] ${isDesktop ? 'w-5 h-5' : 'w-6 h-6'}`} strokeWidth={2.5} /> : <Mic className={`relative z-[2] ${isDesktop ? 'w-5 h-5' : 'w-6 h-6'}`} strokeWidth={2.5} />}
              </button>
            </form>
          </div>

          <div className={`flex flex-col gap-3 ${isDesktop ? 'w-full' : 'mx-auto w-full'}`}>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'art' as const, icon: BookOpen, label: 'Artigos' },
                { key: 'cap' as const, icon: LayoutGrid, label: 'Capítulos' },
                { key: 'lot' as const, icon: LayoutGrid, label: 'Lotes' },
                { key: 'rec' as const, icon: History, label: 'Recentes' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  disabled={loadingArtigos}
                  className={`flex items-center justify-center gap-1.5 px-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${isDesktop ? 'py-2' : 'py-3 md:py-3.5'} ${activeTab === tab.key ? 'bg-hero-panel text-white shadow-md shadow-red-950/40' : 'bg-secondary text-foreground hover:text-foreground'} ${loadingArtigos ? 'opacity-70' : ''}`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {stickySearch && !isDesktop && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-2.5 shadow-lg"
            >
              <form className="relative max-w-lg mx-auto" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" />
                <Input
                  value={voiceSearch.listening ? (voiceSearch.partial || searchQuery) : searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar..."
                  className="rounded-full bg-secondary/80 border-border/50 pl-10 pr-20 h-10 text-sm font-medium"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  {searchQuery && !voiceSearch.listening && (
                    <button type="button" onClick={() => { setSearchQuery(''); handleSearch(''); }} className="p-1.5 rounded-full hover:bg-background/50 text-muted-foreground">
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => voiceSearch.toggle()} className={`w-7 h-7 rounded-full flex items-center justify-center ${voiceSearch.listening ? 'bg-red-500 text-white animate-pulse' : 'text-primary hover:bg-primary/10'}`}>
                    {voiceSearch.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex ${isDesktop ? 'gap-6 items-start' : 'flex-col'}`}>
          <div className="flex-1 min-w-0 w-full relative">
            {activeTab === 'art' ? (
              <LeiArtigosVirtualList
                visibleArtigos={visibleArtigos}
                shouldVirtualizeArtigos={shouldVirtualizeArtigos}
                loadedKey={loadedKey}
                selectedTabelaNome={selectedTabelaNome}
                loadingArtigos={loadingArtigos}
                openArtigoWithRecent={openArtigoWithRecent}
                highlightedArtigoId={highlightedArtigoId}
                searchQuery={searchQuery}
                leiAccent={leiAccent}
                isArtigoFav={isArtigoFav}
                grifadoNumeros={grifadoNumeros}
                anotadoNumeros={anotadoNumeros}
              />
            ) : activeTab === 'cap' ? (
              <LeiCapitulosGrid
                capituloGroups={capituloGroups}
                expandedTitulo={expandedTitulo}
                setExpandedTitulo={setExpandedTitulo}
                setOpenArtigo={openArtigoWithRecent}
                leiAccent={leiAccent}
                isArtigoFav={isArtigoFav}
                grifadoNumeros={grifadoNumeros}
                anotadoNumeros={anotadoNumeros}
              />
            ) : activeTab === 'lot' ? (
              <div className="space-y-5 pb-8">
                {(() => {
                  const stripRe = (s: string) => s.replace(/\s*\((?:Redação|Incluído|Revogado|Acrescido|Alterado|Vide|Regulamento)[^)]*\)/gi, '').trim();
                  const formatNumero = (n: string) => {
                    const raw = (n || '').trim();
                    const m = raw.match(/^(\d+)\s*[ºo°]?\s*[-–\s]?\s*([A-Za-z]?)$/);
                    if (m) return `${m[1]}${(m[2] || '').toUpperCase()}`;
                    return raw.replace(/[ºo°]/g, '');
                  };
                  if (capituloGroups.length === 0) {
                    return (
                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {filteredArtigos.map(a => (
                          <button key={a.id} onClick={() => openArtigoWithRecent(a)} className="aspect-square rounded-xl bg-secondary/70 hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all text-foreground font-bold text-sm md:text-base flex items-center justify-center border border-border/40" title={`Art. ${a.numero}`}>
                            {formatNumero(a.numero)}
                          </button>
                        ))}
                      </div>
                    );
                  }
                  return capituloGroups.map((tGroup, ti) => (
                    <div key={ti} className="space-y-3">
                      {stripRe(tGroup.titulo) && !/^T[ÍI]TULO\s+[ÚU]NICO$/i.test(stripRe(tGroup.titulo)) && (
                        <p className="text-primary text-[11px] font-bold uppercase tracking-wider">{stripRe(tGroup.titulo)}</p>
                      )}
                      {tGroup.capitulos.map((cap, ci) => {
                        const displayCap = cap.capitulo === '__sem_capitulo__' ? null : stripRe(cap.capitulo);
                        return (
                          <div key={ci} className="space-y-2">
                            {displayCap && <p className="text-foreground/80 text-xs font-semibold px-0.5 line-clamp-2">{displayCap}</p>}
                            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                              {cap.artigos.map(a => (
                                <button key={a.id} onClick={() => openArtigoWithRecent(a)} className="aspect-square rounded-xl bg-secondary/70 hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all text-foreground font-bold text-sm md:text-base flex items-center justify-center border border-border/40" title={`Art. ${a.numero}`}>
                                  {formatNumero(a.numero)}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            ) : activeTab === 'rec' ? (
              <div className="space-y-2 pb-8">
                {(() => {
                  const map = new Map(artigos.map(a => [String(a.id), a]));
                  const recents = recentIds.map(id => map.get(id)).filter(Boolean) as ArtigoLei[];
                  if (recents.length === 0) return <p className="text-center text-muted-foreground py-8">Nenhum artigo visualizado ainda.</p>;
                  return (
                    <LeiArtigosVirtualList
                      visibleArtigos={recents}
                      shouldVirtualizeArtigos={false}
                      loadedKey={loadedKey}
                      selectedTabelaNome={selectedTabelaNome}
                      loadingArtigos={loadingArtigos}
                      openArtigoWithRecent={openArtigoWithRecent}
                      highlightedArtigoId={highlightedArtigoId}
                      searchQuery={searchQuery}
                      leiAccent={leiAccent}
                      isArtigoFav={isArtigoFav}
                      grifadoNumeros={grifadoNumeros}
                      anotadoNumeros={anotadoNumeros}
                    />
                  );
                })()}
              </div>
            ) : null}
          </div>

          {isMasterDetail && (
            <div className="w-[320px] xl:w-[360px] shrink-0 sticky top-28 hidden lg:block">
              <div className="bg-secondary/40 border border-border/60 rounded-3xl p-4 flex flex-col gap-3 backdrop-blur-xl h-[calc(100vh-140px)]">
                <h3 className="font-display font-bold text-lg px-2 text-foreground">Menu Rápido</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar pb-6">
                  {Object.entries(overlayLabels).map(([key, info]) => {
                    const active = overlayPanel === key;
                    const KIcon = info.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (!isPremium && key === 'radar') {
                            setPremiumGateFeature('radar');
                            setPremiumGateDesc('O Radar Legislativo é exclusivo para assinantes.');
                            setShowPremiumGate(true);
                            return;
                          }
                          setOverlayPanel(key as any);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${active ? 'bg-hero-panel text-white shadow-md shadow-red-950/20' : 'bg-card hover:bg-secondary/80 text-foreground border border-border/40 hover:border-border/80'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                          <KIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-semibold text-sm truncate">{info.label}</p>
                          <p className={`text-[11px] truncate mt-0.5 ${active ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {key === 'fav' ? `${favArtigoNumeros.size} itens` : key === 'radar' ? 'Acompanhe projetos' : 'Acessar área'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  {activeTab !== 'cap' && (
                    <div className="pt-4 mt-4 border-t border-border/50">
                      <h4 className="font-semibold text-sm px-2 mb-3 text-muted-foreground uppercase tracking-wider">Estrutura</h4>
                      {capituloGroups.map((tg, i) => {
                        const ck = `titulo__${tg.titulo}`;
                        const exp = expandedTitulo === ck || (expandedTitulo?.startsWith(`${tg.titulo}__`) ?? false);
                        const num = tg.titulo.match(/(?:T[ÍI]TULO|LIVRO|PARTE)\s+[IVXLCDM0-9]+/i)?.[0] || '';
                        return (
                          <div key={i} className="mb-1">
                            <button
                              onClick={() => {
                                setExpandedTitulo(exp ? null : ck);
                                setActiveTab('cap');
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[13px] transition-colors flex items-center gap-2 ${exp ? 'bg-primary/10 text-primary font-bold' : 'text-foreground/80 hover:bg-secondary'}`}
                            >
                              <BookOpen className={`w-3.5 h-3.5 shrink-0 ${exp ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className="truncate">{num || tg.titulo}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <motion.nav
          initial={{ opacity: 0, y: 14 }}
          animate={showFooter ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
          style={{ willChange: 'transform, opacity', pointerEvents: showFooter ? 'auto' : 'none' }}
          className="fixed bottom-0 left-0 right-0 z-[58] lg:hidden"
        >
          <div className="bg-secondary/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.45)] pb-safe">
            <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto">
              {[
                { key: 'novidades' as const, icon: History, label: 'Histórico' },
                { key: 'playlist' as const, icon: ListMusic, label: 'Playlist' },
                { key: 'anotacoes' as const, icon: StickyNote, label: 'Anotações' },
                { key: 'radar' as const, icon: Radar, label: 'Radar' },
                { key: 'fav' as const, icon: Heart, label: 'Favoritos' },
              ].map((tab) => {
                const active = overlayPanel === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (!isPremium && tab.key === 'radar') {
                        setPremiumGateFeature('radar');
                        setPremiumGateDesc('O Radar Legislativo é exclusivo para assinantes.');
                        setShowPremiumGate(true);
                        return;
                      }
                      setOverlayPanel(tab.key);
                    }}
                    type="button"
                    className={`flex flex-col items-center justify-end gap-1.5 py-1.5 transition-colors ${active ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                  >
                    <tab.icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} fill="none" />
                    <span className="font-body text-[11px] sm:text-[12px] leading-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.nav>

        <AnimatePresence>
          {overlayPanel && (
            <>
              <motion.div
                key={`${overlayPanel}-backdrop`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOverlayPanel(null)}
                className="fixed inset-0 z-[59] bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                key={overlayPanel}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                className="fixed inset-x-0 bottom-0 z-[60] h-[80vh] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl flex flex-col shadow-2xl lg:max-w-[720px] lg:mx-auto"
                style={{ willChange: 'transform' }}
              >
                <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 shrink-0">
                  <button onClick={() => setOverlayPanel(null)} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-base font-bold text-foreground truncate">{overlayLabels[overlayPanel]?.label}</h1>
                    <p className="text-xs text-muted-foreground truncate">{selectedLeiNome}</p>
                  </div>
                </div>
                {overlayPanel !== 'fav' && (
                  <div className="mx-4 mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex gap-3 items-start shrink-0">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80 leading-relaxed">{overlayLabels[overlayPanel]?.desc}</p>
                  </div>
                )}
                {(overlayPanel === 'novidades' || overlayPanel === 'radar') && (
                  <div className="mx-4 mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
                    <p className="text-[11px] text-emerald-400 font-medium">Monitoramento em tempo real</p>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(1rem+var(--sai-bottom))] overscroll-contain">
                  {overlayContents[overlayPanel]}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {openArtigo && (
        <ArtigoBottomSheet
          artigo={openArtigo}
          tabela_nome={selectedTabelaNome || ''}
          lei_id={selectedLeiId}
          onClose={() => { setOpenArtigo(null); setOpenFromNovidades(false); setOpenModInfo(null); }}
          leiInfo={{ id: selectedLeiId, nome: selectedLeiNome, tipo: tipo || '', cor: leiAccent }}
          modInfo={openModInfo}
          showTimelineFirst={openFromNovidades}
        />
      )}

      {selectedTabelaNome && <OcrScanner open={ocrOpen} onOpenChange={setOcrOpen} tabelaNome={selectedTabelaNome} leis={leis} />}
      <GrafoOverlay open={showGrafo} onOpenChange={setShowGrafo} leiNome={selectedLeiNome} artigoFocus={openArtigo?.numero} />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed ${isDesktop ? 'bottom-8 right-8' : 'bottom-[100px] right-4'} z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all`}
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeiDetailView;
