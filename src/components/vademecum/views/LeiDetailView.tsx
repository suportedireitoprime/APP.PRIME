import React, { useMemo, useState, useEffect, useCallback, useRef, useLayoutEffect, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, LayoutGrid, History, Mic, MicOff, Camera, X as XIcon, Heart, ListMusic, StickyNote, Radar, ArrowUp, ArrowLeft, Info, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumGate from '@/components/PremiumGate';
import { Input } from '@/components/ui/input';
import { toggleArtigoFavorito } from '@/lib/artigosFavoritos';
import { toast } from 'sonner';
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
import { buildArtigoBreadcrumbsMap } from '@/components/vademecum/artigo/artigoBreadcrumbs';
import OcrScanner from '@/components/vademecum/grifos_ocr/OcrScanner';
import { haptic } from '@/lib/nativeHaptics';

import NovidadesPanel from '@/components/vademecum/panels/NovidadesPanel';
import { FavPanel, PlaylistPanel, AnotacoesPanel } from '@/components/vademecum/panels/OverlayPanels';
import RadarLegislacaoContent from '@/components/vademecum/outros/RadarLegislacaoContent';
import LeiHero from '@/components/vademecum/artigo/LeiHero';
import LeiCapitulosGrid from '@/components/vademecum/artigo/LeiCapitulosGrid';
import LeiArtigosVirtualList from '@/components/vademecum/artigo/LeiArtigosVirtualList';
import LeiHistoricoCarousel from '@/components/vademecum/artigo/LeiHistoricoCarousel';
import ArtigoComparativoModal, { type AlteracaoDetailData } from '@/components/vademecum/artigo/ArtigoComparativoModal';
import LeiSobreModal from '@/components/vademecum/artigo/LeiSobreModal';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { extractLeiCapitulos, isStructuralArtigo, formatArtigoNumeroOnly } from '@/lib/leiStructure';

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
  const [selectedAlteracaoDetail, setSelectedAlteracaoDetail] = useState<AlteracaoDetailData | null>(null);
  const [showSobreModal, setShowSobreModal] = useState(false);
  
  const [showFooter, setShowFooter] = useState(false);
  const [gridReady, setGridReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setShowFooter(true);
      setGridReady(true);
    }, 320);
    return () => clearTimeout(t);
  }, []);

  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const voiceSearch = useVoiceInput((text) => {
    if (!text) return;
    setSearchQuery(text);
    setTimeout(() => handleSearch(text), 0);
  });

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [showGrafo, setShowGrafo] = useState(false);

  // Efeito Máquina de Escrever (Typewriter) adaptativo à Legislação Selecionada
  const searchPlaceholders = useMemo(() => {
    const nome = (selectedLeiNome || '').toLowerCase();
    const tabela = (selectedTabelaNome || '').toLowerCase();

    if (tabela.includes('penal') || nome.includes('penal')) {
      return [
        'Pesquisar artigo...',
        'Pesquisar 157 (Roubo)...',
        'Pesquisar 121 (Homicídio)...',
        'Pesquisar 171 (Estelionato)...',
        'Pesquisar 155 (Furto)...',
        'Pesquisar Legítima Defesa...',
        'Pesquisar Prescrição...',
      ];
    }
    if (tabela.includes('civil') || nome.includes('civil')) {
      return [
        'Pesquisar artigo...',
        'Pesquisar 186 (Ato Ilícito)...',
        'Pesquisar 421 (Contratos)...',
        'Pesquisar 927 (Indenização)...',
        'Pesquisar Usucapião...',
        'Pesquisar Casamento...',
      ];
    }
    if (tabela.includes('cf88') || tabela.includes('constituicao') || nome.includes('constitui')) {
      return [
        'Pesquisar artigo...',
        'Pesquisar Art. 5º...',
        'Pesquisar Direitos Fundamentais...',
        'Pesquisar Art. 37 (Admin. Pública)...',
        'Pesquisar Habeas Corpus...',
      ];
    }
    if (tabela.includes('clt') || tabela.includes('trabalho') || nome.includes('clt') || nome.includes('trabalho')) {
      return [
        'Pesquisar artigo...',
        'Pesquisar 477 (Rescisão)...',
        'Pesquisar Horas Extras...',
        'Pesquisar Justa Causa...',
        'Pesquisar Férias...',
      ];
    }
    if (tabela.includes('cdc') || tabela.includes('consumidor') || nome.includes('consumidor')) {
      return [
        'Pesquisar artigo...',
        'Pesquisar Art. 6º (Direitos)...',
        'Pesquisar Vício do Produto...',
        'Pesquisar Prazo de Devolução...',
      ];
    }
    if (tabela.includes('tribut') || nome.includes('tribut')) {
      return [
        'Pesquisar artigo...',
        'Pesquisar Fato Gerador...',
        'Pesquisar Imunidade...',
        'Pesquisar Isenção...',
      ];
    }
    return [
      'Pesquisar artigo...',
      'Pesquisar Art. 1º...',
      'Pesquisar termo ou assunto...',
      'Pesquisar por voz ou câmera...',
    ];
  }, [selectedLeiNome, selectedTabelaNome]);

  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('Pesquisar artigo...');

  useEffect(() => {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const tick = () => {
      const currentWord = searchPlaceholders[wordIndex] || 'Pesquisar artigo...';

      if (isDeleting) {
        charIndex--;
        setAnimatedPlaceholder(currentWord.substring(0, charIndex));
        if (charIndex <= 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % searchPlaceholders.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 30);
      } else {
        charIndex++;
        setAnimatedPlaceholder(currentWord.substring(0, charIndex));
        if (charIndex >= currentWord.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2200);
          return;
        }
        timer = setTimeout(tick, 60);
      }
    };

    timer = setTimeout(tick, 800);
    return () => clearTimeout(timer);
  }, [searchPlaceholders]);

  const [expandedCapituloId, setExpandedCapituloId] = useState<string | null>(null);
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
  const artigoBreadcrumbsMap = useMemo(() => buildArtigoBreadcrumbsMap(artigos), [artigos]);
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
    const cleanNum = String(artigo.numero).replace(/^art\.?\s*/i, '').trim();
    const item = { numero: cleanNum, id: String(artigo.id) };
    try {
      localStorage.setItem(`last_artigo_${selectedTabelaNome}`, JSON.stringify(item));
      window.dispatchEvent(new CustomEvent(`last-artigo-updated:${selectedTabelaNome}`, { detail: item }));
    } catch {}
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
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isArtigoFav = useCallback((a: { id: string; numero: string | number }) => {
    const raw = String(a.numero || '').trim();
    const clean = raw.replace(/^art\.?\s*/i, '').trim();
    const digitsOnly = clean.replace(/[º°]/g, '').trim();
    return (
      favArtigoNumeros.has(raw) ||
      favArtigoNumeros.has(clean) ||
      favArtigoNumeros.has(digitsOnly) ||
      favArtigoNumeros.has(`${clean}º`) ||
      favoritos.has(String(a.id))
    );
  }, [favArtigoNumeros, favoritos]);

  const handleToggleFavorito = useCallback(async (artigo: ArtigoLei) => {
    if (!selectedTabelaNome) return;
    const cleanNum = String(artigo.numero || '').replace(/^art\.?\s*/i, '').trim();
    const wasFav = isArtigoFav(artigo);
    haptic.impact();

    // Atualização otimista imediata no estado da lei
    setFavArtigoNumeros((prev) => {
      const next = new Set(prev);
      if (wasFav) {
        next.delete(cleanNum);
        next.delete(String(artigo.numero).trim());
        next.delete(`${cleanNum}º`);
      } else {
        next.add(cleanNum);
      }
      return next;
    });

    try {
      const nowFav = await toggleArtigoFavorito({
        tabela_codigo: selectedTabelaNome,
        numero_artigo: cleanNum,
        conteudo_preview: artigo.caput?.slice(0, 140) || null,
      });
      if (nowFav) {
        toast.success(`Artigo ${cleanNum} salvo nos favoritos (Supabase)!`);
      } else {
        toast.info(`Artigo ${cleanNum} removido dos favoritos.`);
      }
    } catch (err: any) {
      // Reverte estado otimista caso ocorra erro (ex: não logado)
      setFavArtigoNumeros((prev) => {
        const next = new Set(prev);
        if (wasFav) {
          next.add(cleanNum);
        } else {
          next.delete(cleanNum);
          next.delete(String(artigo.numero).trim());
          next.delete(`${cleanNum}º`);
        }
        return next;
      });
      toast.error(err?.message || 'Erro ao sincronizar favorito com o Supabase');
    }
  }, [selectedTabelaNome, isArtigoFav, setFavArtigoNumeros]);

  useEffect(() => {
    if (!selectedLeiId || !selectedLeiNome) return;
    prefetchRadarData(selectedLeiNome, selectedTabelaNome);
  }, [selectedLeiId, selectedLeiNome, selectedTabelaNome]);

  // Item 27: Recálculo debounced/deferred de visibleArtigos durante busca interna
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Item 37: Web Worker para indexação e busca prévia em leis com mais de 800 artigos (ex: CC, CPC)
  const workerRef = useRef<Worker | null>(null);
  const [workerResultIds, setWorkerResultIds] = useState<string[] | null>(null);
  const queryCounterRef = useRef(0);

  useEffect(() => {
    if (typeof Worker === 'undefined' || artigos.length <= 800) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      return;
    }

    try {
      const worker = new Worker(new URL('@/workers/artigoSearchWorker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      worker.postMessage({ type: 'INDEX', payload: { artigos } });

      worker.onmessage = (e) => {
        if (e.data?.type === 'SEARCH_RESULT') {
          setWorkerResultIds(e.data.matchingIds);
        }
      };

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch {
      workerRef.current = null;
    }
  }, [artigos]);

  useEffect(() => {
    if (!workerRef.current || artigos.length <= 800) return;
    const queryId = ++queryCounterRef.current;
    workerRef.current.postMessage({
      type: 'SEARCH',
      payload: { query: deferredSearchQuery, queryId },
    });
  }, [deferredSearchQuery, artigos.length]);

  const filteredArtigos = useMemo(() => {
    const raw = deferredSearchQuery.trim();
    if (!raw) return artigos;

    // Se o Web Worker já respondeu com IDs indexados (leis extensas)
    if (artigos.length > 800 && workerResultIds !== null) {
      const idSet = new Set(workerResultIds);
      return artigos.filter((a) => idSet.has(String(a.id)));
    }

    const q = raw.replace(/[^\d\-a-zA-Z]/g, '').replace(/^[a-zA-Z]+/, '').toLowerCase();
    if (!q) {
      const lower = raw.toLowerCase();
      return artigos.filter(a => (a.caput || '').toLowerCase().includes(lower) || (a.numero || '').toLowerCase().includes(lower));
    }
    return artigos.filter(a => {
      const artNum = (a.numero || '').replace(/^art\.?\s*/i, '').replace(/[º°]/g, '').trim().toLowerCase();
      return artNum === q;
    });
  }, [artigos, deferredSearchQuery, workerResultIds]);

  const previewResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredArtigos.slice(0, 8);
  }, [filteredArtigos, searchQuery]);

  const recentArticles = useMemo(() => {
    if (!recentIds.length || !artigos.length) return [];
    const map = new Map(artigos.map(a => [String(a.id), a]));
    return recentIds.map(id => map.get(id)).filter(Boolean) as ArtigoLei[];
  }, [recentIds, artigos]);

  const scrollToSearch = useCallback(() => {
    setTimeout(() => {
      if (searchBarRef.current) {
        const top = searchBarRef.current.getBoundingClientRect().top + window.scrollY - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const handleViewport = () => {
      if (isSearchFocused && searchBarRef.current) {
        const rect = searchBarRef.current.getBoundingClientRect();
        if (rect.top < 8 || rect.bottom > vv.height) {
          searchBarRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };
    vv.addEventListener('resize', handleViewport);
    vv.addEventListener('scroll', handleViewport);
    return () => {
      vv.removeEventListener('resize', handleViewport);
      vv.removeEventListener('scroll', handleViewport);
    };
  }, [isSearchFocused]);

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

  // Item 65: Atalhos de teclado no Desktop / iPad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        const inputEl = document.querySelector('input[placeholder*="Pesquisar artigo"]') as HTMLInputElement | null;
        inputEl?.focus();
      } else if (e.key === 'Escape') {
        if (openArtigo) {
          setOpenArtigo(null);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Item 89: Suporte a teclado físico em tablets (Magic Keyboard) e desktop
        e.preventDefault();
        window.scrollBy({ top: e.shiftKey ? -window.innerHeight * 0.7 : window.innerHeight * 0.7, behavior: 'smooth' });
      } else if (e.key === 'j' || e.key === 'J') {
        window.scrollBy({ top: 220, behavior: 'smooth' });
      } else if (e.key === 'k' || e.key === 'K') {
        window.scrollBy({ top: -220, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openArtigo, searchQuery]);

  const capitulos = useMemo(() => extractLeiCapitulos(artigos), [artigos]);

  const onlyRealArtigos = useMemo(() => {
    return filteredArtigos.filter((a) => !isStructuralArtigo(a));
  }, [filteredArtigos]);

  const visibleArtigos = useMemo(() => {
    if (!isMasterDetail || !expandedCapituloId) return filteredArtigos;
    const foundCap = capitulos.find((c) => c.id === expandedCapituloId);
    if (foundCap) {
      const ids = new Set(foundCap.artigos.map((a) => String(a.id)));
      return filteredArtigos.filter((a) => ids.has(String(a.id)));
    }
    return filteredArtigos;
  }, [capitulos, expandedCapituloId, filteredArtigos, isMasterDetail]);

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
    radar: { 
      label: 'Radar do Código Penal', 
      icon: Radar, 
      desc: 'Aqui você acompanha os Projetos de Lei (PL) e Proposições em tramitação na Câmara dos Deputados com potencial para alterar, incluir ou revogar dispositivos do Código Penal.' 
    },
  };
  
  const overlayContents: Record<string, React.ReactNode> = {
    fav: <FavPanel artigos={artigos} isArtigoFav={isArtigoFav} onOpenArtigo={(a) => { setOverlayPanel(null); setOpenArtigo(a); }} accentColor={leiAccent} grifadoNumeros={grifadoNumeros} anotadoNumeros={anotadoNumeros} />,
    playlist: <PlaylistPanel artigos={artigos} playlistNarracoes={playlistNarracoes} loadingPlaylist={loadingPlaylist} playingUrl={playingUrl} togglePlayAudio={togglePlayAudio} onOpenArtigo={(a) => { setOverlayPanel(null); setOpenArtigo(a); }} />,
    anotacoes: <AnotacoesPanel />,
    novidades: (
      <NovidadesPanel
        artigos={artigos}
        dbAlteracoes={dbAlteracoes}
        loadingDbAlteracoes={loadingDbAlteracoes}
        tabelaNome={selectedTabelaNome}
        leiId={selectedLeiId}
        onOpenArtigo={(a, modInfo) => {
          setOverlayPanel(null);
          setOpenFromNovidades(true);
          setOpenModInfo(modInfo);
          setOpenArtigo(a);
        }}
        onOpenComparativo={(item) => setSelectedAlteracaoDetail(item)}
      />
    ),
    radar: (
      <RadarLegislacaoContent
        leiNome={selectedLeiNome}
        tabelaNome={selectedTabelaNome}
        navigate={navigate}
        onSelectArtigoNumero={(num) => {
          const clean = (num || '').replace(/[^0-9]/g, '');
          const target = artigos.find(a => (a.numero || '').replace(/[^0-9]/g, '') === clean);
          if (target) {
            setOverlayPanel(null);
            setOpenArtigo(target);
          }
        }}
      />
    ),
  };

  return (
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-28 lg:pb-0 relative overflow-x-hidden">
      {/* Fundo com ShapeGrid idêntico ao do Vade Mecum (fixed na viewport para não esticar) */}
      {gridReady && (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
          <ShapeGrid 
            speed={0.5} 
            squareSize={40}
            direction="diagonal"
            borderColor="rgba(255, 255, 255, 0.05)"
            hoverFillColor="rgba(255, 255, 255, 0.1)"
            shape="square"
            hoverTrailAmount={5}
          />
        </div>
      )}

      {/* Item 75: Skip to Content para acessibilidade WCAG AAA */}
      <a
        href="#lei-conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-xl focus:ring-2 focus:ring-ring font-semibold text-sm transition"
      >
        Pular para o conteúdo principal
      </a>
      <PremiumGate 
        open={showPremiumGate} 
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
        onOpenOverlay={(panel) => {
          if (!isPremium && panel === 'radar') {
            setPremiumGateFeature('radar');
            setPremiumGateDesc('O Radar Legislativo é exclusivo para assinantes.');
            setShowPremiumGate(true);
            return;
          }
          setOverlayPanel(panel);
        }}
        favCount={favArtigoNumeros.size}
      />

      <div id="lei-conteudo" className={`relative z-10 mx-auto px-3 sm:px-4 md:px-6 scroll-mt-2 ${isDesktop ? 'max-w-7xl pt-7 space-y-5' : 'max-w-5xl pt-7 space-y-5'}`}>
        {/* Carrossel de Histórico de Artigos Atualizados (Antes da barra de pesquisa) */}
        <LeiHistoricoCarousel
          artigos={artigos}
          dbAlteracoes={dbAlteracoes}
          tabelaNome={selectedTabelaNome}
          leiId={selectedLeiId}
          leiNome={selectedLeiNome}
          onOpenArtigo={(artigo, modInfo) => {
            setOpenModInfo(modInfo || null);
            setOpenFromNovidades(Boolean(modInfo));
            openArtigoWithRecent(artigo);
          }}
          onOpenComparativo={(item) => setSelectedAlteracaoDetail(item)}
          onOpenVerTodos={() => setOverlayPanel('novidades')}
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1], delay: 0.06 }}
          className="sticky top-0 z-40 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pt-[calc(0.6rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-2.5 bg-[#0e0e10]/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40 space-y-2.5"
        >
          {/* Barra de Pesquisa posicionada fora e abaixo do painel */}
          <div ref={searchBarRef} className={`mx-auto w-full relative ${isDesktop ? 'max-w-none' : ''}`}>
            <form className="flex items-center gap-2.5 min-w-0" onSubmit={(e) => { e.preventDefault(); handleSearch(); setIsSearchFocused(false); }}>
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-zinc-400 pointer-events-none" />
                <Input
                  value={voiceSearch.listening ? (voiceSearch.partial || searchQuery) : searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    scrollToSearch();
                  }}
                  placeholder={animatedPlaceholder}
                  className={`rounded-2xl bg-zinc-800/85 hover:bg-zinc-800 border border-white/10 hover:border-white/20 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30 pl-11 pr-20 text-[14px] sm:text-[15px] font-medium text-white placeholder:text-zinc-400/90 shadow-md transition-all ${isDesktop ? 'h-[52px]' : 'h-[52px] sm:h-[54px]'}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && !voiceSearch.listening && (
                    <button type="button" onClick={() => { setSearchQuery(''); handleSearch(''); }} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" aria-label="Limpar busca">
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => setOcrOpen(true)} aria-label="Fotografar artigo (OCR)" className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/15 text-red-400 hover:bg-red-500/25 active:scale-95 transition-all">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => voiceSearch.toggle()}
                aria-label={voiceSearch.listening ? 'Parar gravação' : 'Buscar por voz'}
                className={`relative overflow-hidden shrink-0 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition-all ${isDesktop ? 'w-[52px] h-[52px]' : 'w-[52px] h-[52px] sm:w-[54px] sm:h-[54px]'} ${voiceSearch.listening ? 'bg-hero-panel text-white animate-pulse shadow-red-950/50' : 'bg-hero-panel text-white shadow-red-950/40'}`}
              >
                {voiceSearch.listening && <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />}
                {voiceSearch.listening ? <MicOff className="relative z-[2] w-6 h-6" strokeWidth={2.4} /> : <Mic className="relative z-[2] w-6 h-6" strokeWidth={2.4} />}
              </button>
            </form>

            {/* Dropdown suspenso de pesquisa (100% opaco, sem transparência, com menu de alternância dos recentes) */}
            <AnimatePresence>
              {isSearchFocused && (
                <>
                  <div
                    className="fixed inset-0 z-50 bg-black/75"
                    onClick={() => setIsSearchFocused(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute left-0 right-0 top-full mt-2 z-[60] bg-[#0E0F12] border border-zinc-800 rounded-2xl shadow-2xl shadow-black overflow-hidden max-h-[65vh] flex flex-col select-none"
                  >
                    {/* Cabeçalho do Dropdown */}
                    <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between text-xs bg-[#121318]">
                      <div className="flex items-center gap-2">
                        {searchQuery.trim() ? (
                          <>
                            <Search className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-extrabold uppercase tracking-wider text-[11px] text-white">
                              Resultados para &ldquo;{searchQuery}&rdquo; ({previewResults.length})
                            </span>
                          </>
                        ) : (
                          <>
                            <History className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-extrabold uppercase tracking-wider text-[11px] text-white">
                              Últimos Artigos Pesquisados
                            </span>
                            {recentArticles.length > 0 && (
                              <span className="text-[11px] text-zinc-400 font-medium">
                                ({recentArticles.length})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSearchFocused(false)}
                        className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                      >
                        Fechar
                      </button>
                    </div>

                    {/* Conteúdo: Menu de alternância dos recentes ou resultados da busca */}
                    {searchQuery.trim() ? (
                      <>
                        {/* Linha compacta de recentes se houver durante a busca */}
                        {recentArticles.length > 0 && (
                          <div className="px-3 pt-2.5 pb-1 border-b border-zinc-800/60 bg-[#101115]">
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
                                Recentes:
                              </span>
                              {recentArticles.slice(0, 8).map((art) => {
                                const cleanNum = (art.numero || '').replace(/^art\.?\s*/i, '').trim();
                                return (
                                  <button
                                    key={art.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      openArtigoWithRecent(art);
                                      setIsSearchFocused(false);
                                      haptic.selection();
                                    }}
                                    className="shrink-0 px-2.5 py-1 rounded-lg bg-[#181920] hover:bg-primary/20 hover:text-primary border border-zinc-800 text-[11px] font-bold text-zinc-300 transition-all active:scale-95 cursor-pointer"
                                  >
                                    Art. {cleanNum}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Lista de resultados correspondentes */}
                        <div className="overflow-y-auto divide-y divide-zinc-800/60 p-2 space-y-1.5 max-h-[45vh] bg-[#0E0F12]">
                          {previewResults.length > 0 ? (
                            previewResults.map((art) => (
                              <button
                                key={art.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  openArtigoWithRecent(art);
                                  setIsSearchFocused(false);
                                  haptic.selection();
                                }}
                                className="w-full text-left p-3 rounded-xl bg-[#14151a] hover:bg-[#1a1b22] active:bg-[#20212a] border border-zinc-800/70 hover:border-zinc-700 transition-all flex flex-col gap-1 group shadow-sm cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-primary group-hover:text-red-400">
                                    {/^art/i.test(art.numero) ? art.numero : `Art. ${art.numero}`}
                                  </span>
                                  {art.topico && (
                                    <span className="text-[10px] text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.05]">
                                      {art.topico}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-serif">
                                  {art.caput.replace(/\([^)]*\)/g, '').trim()}
                                </p>
                              </button>
                            ))
                          ) : (
                            <div className="py-6 text-center text-xs text-zinc-400">
                              Nenhum artigo encontrado para &ldquo;{searchQuery}&rdquo;.
                            </div>
                          )}
                        </div>

                        {filteredArtigos.length > previewResults.length && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIsSearchFocused(false);
                              handleSearch();
                            }}
                            className="w-full py-2.5 px-3 text-center text-xs font-semibold text-primary hover:bg-white/[0.04] border-t border-zinc-800 transition-colors bg-[#111216]"
                          >
                            Ver todos os {filteredArtigos.length} artigos na lista
                          </button>
                        )}
                      </>
                    ) : (
                      /* Menu de Alternância Rolável dos Recentes (Artigo abreviado e número) */
                      <div className="p-3.5 space-y-3 bg-[#0E0F12]">
                        {recentArticles.length > 0 ? (
                          <div
                            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                          >
                            {recentArticles.map((art) => {
                              const cleanNum = (art.numero || '').replace(/^art\.?\s*/i, '').trim();
                              const displayLabel = `Art. ${cleanNum}`;
                              return (
                                <button
                                  key={art.id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    openArtigoWithRecent(art);
                                    setIsSearchFocused(false);
                                    haptic.selection();
                                  }}
                                  className="shrink-0 px-4 py-2 rounded-xl bg-[#17181f] hover:bg-primary/20 hover:text-primary active:scale-95 border border-zinc-800 hover:border-primary/40 text-xs sm:text-sm font-bold text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer group"
                                >
                                  <History className="w-3.5 h-3.5 text-zinc-500 group-hover:text-primary transition-colors" />
                                  <span>{displayLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center space-y-2">
                            <p className="text-xs text-zinc-400">
                              Nenhum artigo pesquisado recentemente.
                            </p>
                            {artigos.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                                  Sugestões de Acesso Rápido
                                </p>
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 justify-center flex-wrap">
                                  {artigos.slice(0, 6).map((art) => {
                                    const cleanNum = (art.numero || '').replace(/^art\.?\s*/i, '').trim();
                                    return (
                                      <button
                                        key={art.id}
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          openArtigoWithRecent(art);
                                          setIsSearchFocused(false);
                                          haptic.selection();
                                        }}
                                        className="px-3.5 py-1.5 rounded-xl bg-[#17181f] hover:bg-primary/20 text-xs font-bold text-zinc-200 hover:text-primary border border-zinc-800 transition-all active:scale-95 cursor-pointer"
                                      >
                                        Art. {cleanNum}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-[11px] text-zinc-500 text-center pt-2 border-t border-zinc-800/60">
                          Toque em um artigo para abrir imediatamente ou digite o número na barra acima.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Abas no Desktop (no mobile a navegação fica no rodapé) */}
          {isDesktop && (
            <div className="flex flex-col gap-3 w-full">
              <div className="grid grid-cols-5 gap-2">
                {[
                  { key: 'art' as const, icon: BookOpen, label: 'Artigos' },
                  { key: 'cap' as const, icon: LayoutGrid, label: 'Capítulos' },
                  { key: 'lot' as const, icon: Layers, label: 'Lotes' },
                  { key: 'rec' as const, icon: History, label: 'Recentes' },
                  { key: 'sobre' as const, icon: Info, label: 'Sobre' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (tab.key === 'sobre') {
                        haptic.selection();
                        setShowSobreModal(true);
                      } else {
                        setActiveTab(tab.key);
                      }
                    }}
                    disabled={loadingArtigos && tab.key !== 'sobre'}
                    className={`flex items-center justify-center gap-1.5 px-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all py-2 cursor-pointer ${
                      (tab.key === 'sobre' ? showSobreModal : activeTab === tab.key)
                        ? 'bg-hero-panel text-white shadow-md shadow-red-950/40'
                        : 'bg-secondary text-foreground hover:text-foreground'
                    } ${loadingArtigos && tab.key !== 'sobre' ? 'opacity-70' : ''}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Item 61: Layout Master-Detail adaptativo para Tablets (iPad/Android) e Desktop */}
        <div className={`flex ${isMasterDetail ? 'md:gap-6 md:items-start' : 'flex-col'}`}>
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
                capitulos={capitulos}
                expandedCapituloId={expandedCapituloId}
                setExpandedCapituloId={setExpandedCapituloId}
                setOpenArtigo={openArtigoWithRecent}
                leiAccent={leiAccent}
                isArtigoFav={isArtigoFav}
                grifadoNumeros={grifadoNumeros}
                anotadoNumeros={anotadoNumeros}
                searchQuery={searchQuery}
              />
            ) : activeTab === 'lot' ? (
              <div className="space-y-4 pb-12 select-none">
                <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">
                    {onlyRealArtigos.length} artigos para acesso rápido
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Toque no número para abrir
                  </span>
                </div>

                {onlyRealArtigos.length === 0 ? (
                  <p className="text-center text-zinc-500 text-sm py-12">Nenhum artigo encontrado.</p>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
                    {onlyRealArtigos.map((a) => {
                      const numDisplay = formatArtigoNumeroOnly(a.numero);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            haptic.impact();
                            openArtigoWithRecent(a);
                          }}
                          className="aspect-square rounded-2xl bg-[#14151a] hover:bg-primary hover:text-white border border-white/[0.06] hover:border-primary/40 flex flex-col items-center justify-center text-zinc-100 font-black text-sm sm:text-base active:scale-90 transition-all shadow-md shadow-black/40 cursor-pointer select-none group"
                          title={`Artigo ${a.numero}`}
                        >
                          <span className="group-hover:scale-110 transition-transform">
                            {numDisplay}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
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
            <div className="w-[280px] lg:w-[320px] xl:w-[360px] shrink-0 sticky top-28 hidden md:block">
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
          aria-label="Navegação do Código"
          initial={false}
          animate={showFooter ? { y: 0, opacity: 1, pointerEvents: 'auto' as const } : { y: 120, opacity: 0, pointerEvents: 'none' as const }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[65] md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto lg:hidden"
        >
          <div className="bg-[#0e0f12]/98 backdrop-blur-xl border-t border-white/10 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.7)] pb-[calc(0.5rem+var(--sai-bottom))] md:border md:rounded-full md:shadow-2xl md:shadow-black/40 md:pb-0">
            <div className="grid grid-cols-4 items-center justify-items-stretch w-full max-w-lg mx-auto px-2 sm:px-4 py-2 md:gap-1 md:px-3 md:py-2">
              {[
                { key: 'art' as const, icon: BookOpen, label: 'Artigos' },
                { key: 'cap' as const, icon: LayoutGrid, label: 'Capítulos' },
                { key: 'lot' as const, icon: Layers, label: 'Lotes' },
                { key: 'sobre' as const, icon: Info, label: 'Sobre' },
              ].map((tab) => {
                const active = tab.key === 'sobre' ? showSobreModal : activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      haptic.selection();
                      if (tab.key === 'sobre') {
                        setShowSobreModal(true);
                      } else {
                        setActiveTab(tab.key);
                      }
                    }}
                    className={`relative w-full min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 rounded-xl transition-colors ${
                      active ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                    }`}
                    aria-label={tab.label}
                  >
                    {active && (
                      <motion.span
                        layoutId="cp-nav-active-pill"
                        className="absolute inset-x-0.5 inset-y-0.5 rounded-xl bg-white/10 ring-1 ring-white/20"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        aria-hidden="true"
                      />
                    )}

                    <Icon className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0" strokeWidth={active ? 1.9 : 1.5} />
                    <span
                      className={`relative w-full text-center truncate px-0.5 text-[11px] sm:text-[12px] leading-tight ${
                        active ? 'font-bold' : 'font-medium'
                      }`}
                    >
                      {tab.label}
                    </span>
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
                className={
                  (overlayPanel === 'novidades' || overlayPanel === 'radar')
                    ? "fixed inset-0 z-[60] h-[100dvh] max-h-[100dvh] bg-[#0f0f0f] flex flex-col shadow-2xl lg:max-w-[780px] lg:mx-auto pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))]"
                    : "fixed inset-x-0 bottom-0 z-[60] h-[80vh] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl flex flex-col shadow-2xl lg:max-w-[720px] lg:mx-auto"
                }
                style={{ willChange: 'transform' }}
              >
                {overlayPanel !== 'novidades' && overlayPanel !== 'radar' && (
                  <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                )}
                <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 shrink-0">
                  <button onClick={() => setOverlayPanel(null)} className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
                    <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-base font-bold text-foreground truncate">{overlayLabels[overlayPanel]?.label}</h1>
                    <p className="text-xs text-muted-foreground truncate">{selectedLeiNome}</p>
                  </div>
                </div>
                {overlayPanel !== 'fav' && overlayPanel !== 'radar' && (
                  <div className="mx-4 mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex gap-3 items-start shrink-0">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80 leading-relaxed">{overlayLabels[overlayPanel]?.desc}</p>
                  </div>
                )}
                {overlayPanel === 'novidades' && (
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
          tabelaNome={selectedTabelaNome || ''}
          tabela_nome={selectedTabelaNome || ''}
          lei_id={selectedLeiId}
          onClose={() => { setOpenArtigo(null); setOpenFromNovidades(false); setOpenModInfo(null); }}
          leiInfo={{ id: selectedLeiId, nome: selectedLeiNome, tipo: tipo || '', cor: leiAccent }}
          modInfo={openModInfo}
          showTimelineFirst={openFromNovidades}
          isFavorito={isArtigoFav(openArtigo)}
          onToggleFavorito={() => handleToggleFavorito(openArtigo)}
          breadcrumb={
            artigoBreadcrumbsMap.get(String(openArtigo.id)) ||
            artigoBreadcrumbsMap.get(String(openArtigo.numero).trim()) ||
            artigoBreadcrumbsMap.get(String(openArtigo.numero).replace(/^art\.\s*/i, '').trim())
          }
        />
      )}

      <ArtigoComparativoModal
        open={Boolean(selectedAlteracaoDetail)}
        onClose={() => setSelectedAlteracaoDetail(null)}
        data={selectedAlteracaoDetail}
        onIrParaArtigo={(artigo) => {
          setSelectedAlteracaoDetail(null);
          setOverlayPanel(null);
          openArtigoWithRecent(artigo);
        }}
      />

      {selectedTabelaNome && <OcrScanner open={ocrOpen} onClose={() => setOcrOpen(false)} leiNome={selectedLeiNome} leiSlug={selectedTabelaNome} />}

      <LeiSobreModal
        open={showSobreModal}
        onClose={() => setShowSobreModal(false)}
        leiNome={selectedLeiNome}
        leiDescricao={selectedLeiDescricao}
      />


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
