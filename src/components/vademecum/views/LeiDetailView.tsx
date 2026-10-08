import React, { useMemo, useState, useEffect, useCallback, useRef, useLayoutEffect, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, LayoutGrid, History, Mic, MicOff, Camera, X as XIcon, Heart, ListMusic, StickyNote, Radar, ArrowUp, ArrowLeft, Info, Layers } from 'lucide-react';
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
import { pushRecente } from '@/lib/leisRecentes';
import brasaoImg from '@/assets/brasao-republica.webp';

import NovidadesPanel from '@/components/vademecum/panels/NovidadesPanel';
import { FavPanel, PlaylistPanel, AnotacoesPanel } from '@/components/vademecum/panels/OverlayPanels';
import RadarLegislacaoContent from '@/components/vademecum/outros/RadarLegislacaoContent';
import LeiHero from '@/components/vademecum/artigo/LeiHero';
import LeiCapitulosGrid from '@/components/vademecum/artigo/LeiCapitulosGrid';
import LeiArtigosVirtualList from '@/components/vademecum/artigo/LeiArtigosVirtualList';
import LeiHistoricoCarousel from '@/components/vademecum/artigo/LeiHistoricoCarousel';
import ArtigoComparativoModal, { type AlteracaoDetailData } from '@/components/vademecum/artigo/ArtigoComparativoModal';
import LeiSobreModal from '@/components/vademecum/artigo/LeiSobreModal';
import { useScrapedUpdates } from '@/hooks/useScrapedUpdates';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { extractLeiCapitulos, isStructuralArtigo, formatArtigoNumeroOnly } from '@/lib/leiStructure';

const MOBILE_ARTIGOS_VIRTUAL_THRESHOLD = 120;

interface LeiDetailViewProps {
  tipo: string | undefined;
  leis: { id: string; nome: string; [key: string]: unknown }[];
  selectedLeiId: string;
  selectedLeiNome: string;
  selectedLeiDescricao: string;
  selectedTabelaNome: string | null;
  subcat: string;
  config: { label: string; icon: React.ElementType; bg: string } | null;
  goBack: () => void;
  pendingArtigoNumero: string | null;
  setPendingArtigoNumero: (v: string | null) => void;
  hideBackButton?: boolean;
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
  hideBackButton = false,
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
  const [activeTab, setActiveTab] = useState<'art' | 'cap' | 'rec' | 'sob'>('art');
  const [overlayPanel, setOverlayPanel] = useState<'fav' | 'playlist' | 'novidades' | 'anotacoes' | 'radar' | 'pesquisa' | null>(null);
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

  const { data: scrapedList = [] } = useScrapedUpdates(selectedLeiId);
  const localScrapedCount = scrapedList.length;

  const voiceSearch = useVoiceInput((text) => {
    if (!text) return;
    setSearchQuery(text);
    setTimeout(() => handleSearch(text), 0);
  });

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [showGrafo, setShowGrafo] = useState(false);

  const [openArtigo, setOpenArtigo] = useState<ArtigoLei | null>(null);
  const [openFromNovidades, setOpenFromNovidades] = useState(false);
  const [openModInfo, setOpenModInfo] = useState<AlteracaoDetailData | null>(null);
  const [highlightedArtigoId, setHighlightedArtigoId] = useState<string | null>(null);

  // Smart Auto-Hide Header Logic
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Se estiver no topo ou descendo menos de 120px, manter visível
      if (currentScrollY <= 120) {
        setIsHeaderHidden(false);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      // Rolando para baixo: esconder
      if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
        if (!isSearchFocused && !overlayPanel && !showSobreModal && !openArtigo) {
          setIsHeaderHidden(true);
        }
      } 
      // Rolando para cima: mostrar
      else if (currentScrollY < lastScrollY.current - 10) {
        setIsHeaderHidden(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSearchFocused, overlayPanel, showSobreModal, openArtigo]);

  useEffect(() => {
    if (selectedLeiId && selectedLeiNome) {
      pushRecente({
        tipo: tipo || 'lei',
        leiId: selectedLeiId,
        nome: selectedLeiNome,
        descricao: selectedLeiDescricao || '',
        tabela_nome: selectedTabelaNome || ''
      });
    }
  }, [selectedLeiId, selectedLeiNome, selectedLeiDescricao, selectedTabelaNome, tipo]);

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
    } catch (err: unknown) {
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
      toast.error((err as Error)?.message || 'Erro ao sincronizar favorito com o Supabase');
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
  }, [artigos, pendingArtigoNumero, setPendingArtigoNumero]);

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
    novidades: { label: 'Novidades', icon: History, desc: 'Histórico de alterações legislativas — veja quais artigos foram incluídos, revogados ou modificados, organizados por ano.' },
    radar: { 
      label: 'Radar Legislativo', 
      icon: Radar, 
      desc: `Aqui você acompanha os Projetos de Lei (PL) e Proposições em tramitação na Câmara dos Deputados com potencial para alterar ou afetar o(a) ${selectedLeiNome}.` 
    },
    pesquisa: {
      label: 'Pesquisar na Lei',
      icon: Search,
      desc: 'Pesquise por palavras-chave, artigos, ou tópicos específicos dentro desta lei.'
    }
  };
  
  const overlayContents: Record<string, React.ReactNode> = {
    fav: <FavPanel artigos={artigos} isArtigoFav={isArtigoFav} onOpenArtigo={(a) => { setOverlayPanel(null); setOpenArtigo(a); }} accentColor={leiAccent} grifadoNumeros={grifadoNumeros} anotadoNumeros={anotadoNumeros} />,
    playlist: <PlaylistPanel artigos={artigos} playlistNarracoes={playlistNarracoes} loadingPlaylist={loadingPlaylist} playingUrl={playingUrl} togglePlayAudio={togglePlayAudio} onOpenArtigo={(a) => { setOverlayPanel(null); setOpenArtigo(a); }} />,
    anotacoes: (
      <AnotacoesPanel
        tabelaNome={selectedTabelaNome}
        artigos={artigos}
        onOpenArtigo={(a) => {
          setOverlayPanel(null);
          setOpenArtigo(a);
        }}
        accentColor={leiAccent}
      />
    ),
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
        onOpenComparativo={(item) => setSelectedAlteracaoDetail({ ...item, leiNomePai: selectedLeiNome })}
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
    pesquisa: (
      <div className="flex flex-col gap-4">
        <form className="flex items-center gap-2.5 min-w-0" onSubmit={(e) => { e.preventDefault(); setOverlayPanel(null); handleSearch(); }}>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-zinc-400 pointer-events-none" />
            <Input
              autoFocus
              value={voiceSearch.listening ? (voiceSearch.partial || searchQuery) : searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={animatedPlaceholder}
              className={`rounded-2xl bg-zinc-800/85 hover:bg-zinc-800 border border-white/10 hover:border-white/20 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30 pl-11 pr-20 text-[15px] sm:text-[16px] font-medium text-white placeholder:text-zinc-400/90 shadow-md transition-all h-[60px] sm:h-[64px]`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && !voiceSearch.listening && (
                <button type="button" onClick={() => { setSearchQuery(''); handleSearch(''); }} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" aria-label="Limpar busca">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
              <button type="button" onClick={() => setOcrOpen(true)} aria-label="Fotografar artigo (OCR)" className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/15 text-red-400 hover:bg-red-500/25 active:opacity-70 transition-all">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => voiceSearch.toggle()}
            aria-label={voiceSearch.listening ? 'Parar gravação' : 'Buscar por voz'}
            className={`relative overflow-hidden shrink-0 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition-all w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] ${voiceSearch.listening ? 'bg-hero-panel text-white animate-pulse shadow-red-950/50' : 'bg-hero-panel text-white shadow-red-950/40'}`}
          >
            {voiceSearch.listening && <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />}
            {voiceSearch.listening ? <MicOff className="relative z-[2] w-6 h-6" strokeWidth={2.4} /> : <Mic className="relative z-[2] w-6 h-6" strokeWidth={2.4} />}
          </button>
        </form>

        <div className="flex-1 overflow-y-auto pb-8 space-y-4">
          {searchQuery.trim() ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Search className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-[13px] text-white">
                  Resultados para &ldquo;{searchQuery}&rdquo; ({previewResults.length})
                </span>
              </div>
              
              <div className="divide-y divide-zinc-800/60 border border-zinc-800/80 rounded-2xl bg-[#0E0F12] overflow-hidden">
                {previewResults.length > 0 ? (
                  previewResults.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        openArtigoWithRecent(art);
                        setOverlayPanel(null);
                      }}
                      className="w-full text-left p-4 hover:bg-[#1a1b22] active:bg-[#20212a] transition-all flex flex-col gap-1.5 group cursor-pointer"
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
                      <p className="text-[13px] text-zinc-300 line-clamp-3 leading-relaxed font-serif">
                        {art.caput.replace(/\([^)]*\)/g, '').trim()}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-zinc-400">
                    Nenhum artigo encontrado.
                  </div>
                )}
              </div>
              
              {filteredArtigos.length > previewResults.length && (
                <button
                  type="button"
                  onClick={() => {
                    setOverlayPanel(null);
                    handleSearch();
                  }}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-primary hover:bg-white/[0.04] border border-zinc-800 transition-colors bg-[#111216]"
                >
                  Ver todos os {filteredArtigos.length} artigos na lista principal
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <History className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-[13px] text-white">
                  Acesso Rápido e Recentes
                </span>
              </div>
              
              {recentArticles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {recentArticles.map((art) => {
                    const cleanNum = (art.numero || '').replace(/^art\.?\s*/i, '').trim();
                    return (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => {
                          openArtigoWithRecent(art);
                          setOverlayPanel(null);
                        }}
                        className="px-4 py-3 rounded-xl bg-[#17181f] hover:bg-primary/10 border border-zinc-800 hover:border-primary/30 transition-all flex items-center justify-center gap-2 group shadow-sm"
                      >
                        <History className="w-4 h-4 text-zinc-500 group-hover:text-primary transition-colors" />
                        <span className="text-[13px] font-bold text-white group-hover:text-primary transition-colors">Art. {cleanNum}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-zinc-500 bg-[#0E0F12] rounded-2xl border border-zinc-800/80">
                  Nenhum artigo pesquisado recentemente.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
        hideBackButton={hideBackButton}
        leiFavToggle={leiFavToggle}
        setLeiFavToggle={setLeiFavToggle}
        selectedLeiEmenta={selectedLeiEmenta}
        onOpenSobre={() => setShowSobreModal(true)}
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
        anotacoesCount={anotadoNumeros.size}
        novidadesCount={(dbAlteracoes?.length || 0) + localScrapedCount}
        radarCount={0}
        playlistCount={Object.keys(playlistNarracoes || {}).length}
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
          onOpenComparativo={(item) => setSelectedAlteracaoDetail({ ...item, leiNomePai: selectedLeiNome })}
          onOpenVerTodos={() => setOverlayPanel('novidades')}
        />

        {/* Carrossel de Recentes (logo abaixo de Novidades) */}
        {recentArticles.length > 0 && (
          <div className="mt-6 mb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[4px] h-[16px] rounded-r-sm bg-primary/90" />
              <h3 className="font-display font-black text-[16px] tracking-wide text-foreground uppercase">
                RECENTES
              </h3>
            </div>
            
            <div className="-mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-4 bg-[#0e0e10] shadow-md shadow-black/20">
              <div 
                className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {recentArticles.map((art) => {
                  const cleanNum = (art.numero || '').replace(/^art\.?\s*/i, '').trim();
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        openArtigoWithRecent(art);
                      }}
                      className="shrink-0 px-5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 hover:border-primary/40 transition-all shadow-sm snap-start flex items-center justify-center gap-2 group"
                    >
                      <History className="w-3.5 h-3.5 text-primary/80 group-hover:text-primary transition-colors" />
                      <span className="text-[13px] font-bold text-foreground/90 group-hover:text-white transition-colors">
                        Art. {cleanNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div
          className={`sticky z-40 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pt-[calc(0.6rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-2.5 bg-[#0e0e10]/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40 space-y-2.5 transition-all duration-300 ${
            isHeaderHidden 
              ? '-top-[100px] opacity-0 pointer-events-none' 
              : 'top-0 opacity-100'
          } ${!isDesktop ? 'hidden' : ''}`}
        >

          {/* Abas no Desktop (no mobile a navegação fica no rodapé) */}
          {isDesktop && (
            <div className="flex flex-col gap-3 w-full">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'art' as const, icon: BookOpen, label: 'Artigos' },
                  { key: 'cap' as const, icon: LayoutGrid, label: 'Capítulos' },
                  { key: 'pesq' as const, icon: Search, label: 'Pesquisar' },
                  { key: 'sob' as const, icon: Info, label: 'Sobre' },
                  { key: 'rec' as const, icon: History, label: 'Recentes' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (tab.key === 'sob') {
                        setShowSobreModal(true);
                      } else if (tab.key === 'pesq') {
                        setOverlayPanel('pesquisa');
                      } else {
                        setActiveTab(tab.key as 'art' | 'cap' | 'rec' | 'sob');
                      }
                    }}
                    disabled={loadingArtigos}
                    className={`flex items-center justify-center gap-1.5 px-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all py-2 cursor-pointer ${
                      activeTab === tab.key
                        ? 'bg-hero-panel text-white shadow-md shadow-red-950/40'
                        : 'bg-secondary text-foreground hover:text-foreground'
                    } ${loadingArtigos ? 'opacity-70' : ''}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Item 61: Layout Master-Detail adaptativo para Tablets (iPad/Android) e Desktop */}
        <div className={`flex ${isMasterDetail ? 'md:gap-6 md:items-start' : 'flex-col'}`}>
          <div className="flex-1 min-w-0 w-full relative">
            {activeTab === 'art' ? (
              <div className="flex flex-col">
                {/* Brasão, Nome da Lei e Ementa acima da lista de artigos */}
                {!searchQuery && (
                  <div className="flex flex-col items-center justify-center text-center px-4 pt-12 pb-14 opacity-90 select-none">
                    <img 
                      src={brasaoImg} 
                      alt="Brasão da República" 
                      className="w-16 h-16 sm:w-20 sm:h-20 opacity-[0.8] mb-5 drop-shadow-md mix-blend-luminosity" 
                    />
                    <h2 className="font-display text-[15px] sm:text-[17px] md:text-xl font-black tracking-[0.1em] text-primary mb-4 drop-shadow-sm uppercase text-balance leading-snug">
                      {selectedLeiNome}
                    </h2>
                    <p className="font-serif text-sm sm:text-[15px] text-muted-foreground italic leading-relaxed max-w-2xl text-center drop-shadow-sm text-balance px-2">
                      {selectedLeiEmenta}
                    </p>
                  </div>
                )}
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
              </div>
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
                          setOverlayPanel(key as 'fav' | 'playlist' | 'novidades' | 'anotacoes' | 'radar');
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
                  {activeTab !== 'cap' && capitulos.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-border/50">
                      <h4 className="font-semibold text-sm px-2 mb-3 text-muted-foreground uppercase tracking-wider">Estrutura</h4>
                      {capitulos.map((cap, i) => {
                        const exp = expandedCapituloId === cap.id;
                        return (
                          <div key={cap.id || i} className="mb-1">
                            <button
                              onClick={() => {
                                setExpandedCapituloId(exp ? null : cap.id);
                                setActiveTab('cap');
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[13px] transition-colors flex items-center gap-2 ${exp ? 'bg-primary/10 text-primary font-bold' : 'text-foreground/80 hover:bg-secondary'}`}
                            >
                              <BookOpen className={`w-3.5 h-3.5 shrink-0 ${exp ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className="truncate">{cap.capituloHead ? `${cap.capituloHead} - ${cap.capituloNome}` : cap.capituloNome}</span>
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

        <nav
          aria-label="Navegação do Código"
          className={`fixed z-50 transition-all duration-300 ease-out bottom-0 left-0 right-0 bg-[#1C1C1E] backdrop-blur-md border-t border-white/10 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.6),0_-2px_10px_rgba(0,0,0,0.4)] lg:hidden ${showFooter ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-[140%] opacity-0 pointer-events-none'}`}
        >
          <div
            aria-hidden="true"
            className="absolute bottom-full left-0 right-0 h-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none md:hidden"
          />
          <div className="relative z-10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] md:pb-0 md:h-full">
            <div className="max-w-lg mx-auto px-1 pt-3.5 pb-3.5 md:max-w-2xl md:px-2 md:py-8 md:h-full md:flex md:flex-col md:justify-center md:gap-6">
              <div className="grid grid-cols-5 items-end md:grid-cols-1 md:items-stretch md:gap-6">
                {[
                  { key: 'art' as const, icon: BookOpen, label: 'Artigos' },
                  { key: 'cap' as const, icon: Layers, label: 'Capítulos' },
                  { key: 'pesq' as const, icon: Search, label: 'Pesquisar', isCenter: true },
                  { key: 'fav' as const, icon: Heart, label: 'Favoritos' },
                  { key: 'sob' as const, icon: Info, label: 'Sobre' },
                ].map((tab) => {
                  if (tab.isCenter) {
                    return (
                      <div key={tab.key} className="relative flex flex-col items-center justify-end gap-1.5 py-1.5 md:py-3 md:justify-center md:rounded-xl md:hover:bg-white/10 transition-transform duration-100">
                        <button
                          onClick={() => {
                            haptic.selection();
                            setOverlayPanel('pesquisa');
                          }}
                          aria-label="Pesquisar"
                          className="absolute -top-11 left-1/2 -translate-x-1/2 w-[76px] h-[76px] xs:w-[80px] xs:h-[80px] md:relative md:top-0 md:left-0 md:translate-x-0 md:w-auto md:h-auto md:bg-transparent md:shadow-none rounded-full flex items-center justify-center overflow-hidden bg-primary shadow-[0_10px_26px_rgba(225,29,72,0.6)] active:scale-95 transition-transform cursor-pointer pointer-events-auto"
                        >
                          <Search className="relative w-10 h-10 xs:w-11 xs:h-11 md:w-9 md:h-9 text-white md:text-white/90 drop-shadow-lg" aria-hidden="true" strokeWidth={1.2} />
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/45 to-transparent motion-safe:animate-[vade-mecum-shine_3.4s_ease-in-out_infinite] md:hidden"
                          />
                        </button>
                        <span aria-hidden className="w-7 h-7 sm:w-8 sm:h-8 md:hidden" />
                        <button 
                          onClick={() => {
                            haptic.selection();
                            setOverlayPanel('pesquisa');
                          }}
                          className="font-body text-[11px] sm:text-[12px] md:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5 text-white/80 hover:text-white cursor-pointer active:opacity-70 pointer-events-auto"
                        >
                          Pesquisar
                        </button>
                      </div>
                    );
                  }

                  const active = activeTab === tab.key && tab.key !== 'fav';
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        haptic.selection();
                        if (tab.key === 'sob') {
                          setShowSobreModal(true);
                        } else if (tab.key === 'fav') {
                          setOverlayPanel('fav');
                        } else {
                          setActiveTab(tab.key as 'art' | 'cap' | 'rec' | 'sob');
                        }
                      }}
                      className={`flex flex-col items-center justify-end gap-1.5 py-1.5 md:py-3 md:justify-center md:rounded-xl transition-all active:opacity-70 duration-100 cursor-pointer relative ${
                        active ? 'text-white' : 'text-white/80 hover:text-white md:hover:bg-white/10'
                      }`}
                      aria-label={tab.label}
                    >
                      <Icon className={`w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 transition-transform drop-shadow-md ${active ? 'scale-110' : 'drop-shadow-sm'}`} strokeWidth={1.5} />
                      <span className="font-body text-[11px] sm:text-[12px] md:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

      </div>

      {/* Painéis Rápidos (Favoritos, Anotações, Radar, Playlist, Novidades) em Tela Cheia cobrindo 100% por cima da capa */}
      {overlayPanel && (
        <>
          <div
            onClick={() => setOverlayPanel(null)}
            className="fixed inset-0 z-[99] bg-black/85"
          />
          <div
            className="fixed inset-0 z-[100] h-[100dvh] max-h-[100dvh] bg-[#0f0f0f] flex flex-col shadow-2xl lg:max-w-[780px] lg:mx-auto pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]"
          >
              <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 shrink-0">
                <button
                  onClick={() => {
                    haptic.selection();
                    setOverlayPanel(null);
                  }}
                  aria-label="Voltar para a lei"
                  className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center active:opacity-70 transition-transform cursor-pointer"
                >
                  <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                    {overlayLabels[overlayPanel]?.label}
                  </h1>
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
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <p className="text-[11px] text-emerald-400 font-medium">Monitoramento em tempo real</p>
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] overscroll-contain">
                {overlayContents[overlayPanel]}
              </div>
            </div>
          </>
        )}

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
          showNomenJuris={true}
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
        leiId={selectedLeiId}
      />


      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed ${isDesktop ? 'bottom-8 right-8' : 'bottom-[100px] right-4'} z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:opacity-70 transition-all`}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default LeiDetailView;
