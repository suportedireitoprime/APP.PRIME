import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
const QuizView = lazyWithRetry(() => import('@/components/estudar/QuizView'));
const JurisprudenciaArtigoView = lazyWithRetry(() => import('@/pages/JurisprudenciaArtigo'));
import ArtigoSidePanel from '@/components/vademecum/artigo/ArtigoSidePanel';
import GrifoVoicePanel, { type GrifoVoicePanelHandle, type VoicePhase } from '@/components/vademecum/grifos_ocr/GrifoVoicePanel';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import brasaoImgAsset from '@/assets/brasao-republica.webp';
const brasaoImg = brasaoImgAsset;

import { useIsDesktop } from '@/hooks/use-desktop';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHighlights } from '@/hooks/useHighlights';
import { supabase } from '@/integrations/supabase/client';
import { buildPlanaltoArticleUrl } from '@/services/legislacaoService';
import { LEIS_CATALOG } from '@/data/leisCatalog';

import { useSubscription } from '@/hooks/useSubscription';
import { type PremiumFeatureKey } from '@/components/PremiumGate';

import { toast } from 'sonner';
import { requireOnline } from '@/lib/offlineFeatures';
import { useArtigoGrifoMagico } from './useArtigoGrifoMagico';
import { parseAiSections, type AiSection } from '@/lib/artigoSegments';
import ArtigoIAFullscreen from '@/components/vademecum/artigo/ArtigoIAFullscreen';

import GrifoMagicoLoader from '@/components/vademecum/grifos_ocr/GrifoMagicoLoader';
import {
  prefetchArtigoFuncoesChunks,
  prefetchArtigoFuncoesDados,
} from '@/lib/artigoFuncoesPrefetch';

import { copiarTexto } from '@/lib/nativo/copiar';
import { useArtigoNarracao } from './useArtigoNarracao';

import {
  type ArtigoBottomSheetProps,
} from './artigoConstants';
export type { ModificationInfo } from './artigoConstants';
import {
  ArtigoTabsNavigation,
  ArtigoTabHistorico,
  ArtigoSheetHeader,
  ArtigoBottomBar,
  ArtigoActionMenuSheet,
  ArtigoPraticarModal,
  ArtigoTermosSheet,
  ArtigoOverlays,
  GrifoCommentPrompt,
  NarracaoProgressBar,
  ArtigoLineRenderer,
  ArtigoMagicTooltipModal,
  ArtigoGrifoTopBar,
  ArtigoTabExplicacao,
  ArtigoTabExemplo,
  ArtigoDesktopRails,
  useArtigoTextProcessing,
  useArtigoCommentsAndAi,
} from './chunks';

import { highlightTermos, stripRedacao } from './artigoTextUtils';
import { fixMojibake, sanitizeArtigo } from '@/lib/mojibake';

const ArtigoBottomSheet = ({
  artigo: rawArtigo,
  onClose,
  isFavorito,
  onToggleFavorito,
  showNomenJuris = false,
  tabelaNome,
  forceShowRedacao,
  modificationInfo,
  breadcrumb: rawBreadcrumb,
}: ArtigoBottomSheetProps) => {
  const artigo = useMemo(() => sanitizeArtigo(rawArtigo), [rawArtigo]);
  const breadcrumb = useMemo(() => {
    if (!rawBreadcrumb) return undefined;
    return {
      parte: rawBreadcrumb.parte ? fixMojibake(rawBreadcrumb.parte) : undefined,
      titulo: rawBreadcrumb.titulo ? fixMojibake(rawBreadcrumb.titulo) : undefined,
      tituloDesc: rawBreadcrumb.tituloDesc ? fixMojibake(rawBreadcrumb.tituloDesc) : undefined,
    };
  }, [rawBreadcrumb]);
  const [showRedacao, setShowRedacao] = useState(forceShowRedacao ?? false);

  useEffect(() => {
    if (forceShowRedacao !== undefined) setShowRedacao(forceShowRedacao);
  }, [forceShowRedacao, artigo?.id]);

  // GA4
  useEffect(() => {
    if (!artigo?.numero) return;
    import('@/lib/appEvents')
      .then(({ appEvents }) =>
        appEvents.viewArtigo({ tabela: tabelaNome, numero: artigo.numero })
      )
      .catch(() => {});
  }, [artigo?.id, artigo?.numero, tabelaNome]);

  // Prefetch de jurisprudência
  useEffect(() => {
    if (!artigo?.numero || !tabelaNome) return;
    const t = setTimeout(() => {
      import('@/lib/jurisprudenciaCache')
        .then(({ prefetchJurisprudenciaArtigo }) =>
          prefetchJurisprudenciaArtigo(tabelaNome, artigo.numero)
        )
        .catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [artigo?.id, artigo?.numero, tabelaNome]);

  // Prefetch de funções
  useEffect(() => {
    if (!artigo?.numero) return;
    prefetchArtigoFuncoesChunks();
    let cancelado = false;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelado) return;
        prefetchArtigoFuncoesDados({
          tabela: tabelaNome,
          numero: String(artigo.numero),
          userId: data.user?.id ?? null,
        });
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [artigo?.id, artigo?.numero, tabelaNome]);

  const [fontSize, setFontSize] = useState(18);
  const [showFontControls, setShowFontControls] = useState(false);
  const [, setShowCommentPanel] = useState(false);
  const [showPraticarSheet, setShowPraticarSheet] = useState(false);

  const [videoaula, setVideoaula] = useState<{
    titulo: string;
    url: string;
    canal: string;
    videoId: string;
    transcricao?: string;
  } | null>(null);
  const [showVideoaulaSheet, setShowVideoaulaSheet] = useState(false);
  const [showVideoaulasListSheet, setShowVideoaulasListSheet] = useState(false);

  const [showAnotacoesSheet, setShowAnotacoesSheet] = useState(false);
  const [showPerguntarSheet, setShowPerguntarSheet] = useState(false);
  const [activeTab, setActiveTab] = useState('artigo');

  const [iaFull, setIaFull] = useState<{ mode: 'explicacao' | 'exemplo'; sectionId: string | null } | null>(null);
  const [focusedSegment, setFocusedSegment] = useState<string | null>(null);

  const [commentPrompt, setCommentPrompt] = useState<{ id: string; show: boolean; mode: 'create' | 'view' } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentTags, setCommentTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [tooltipData, setTooltipData] = useState<{ id: string; rect: DOMRect } | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sheetContentRef = useRef<HTMLDivElement | null>(null);
  const [sheetNode, setSheetNode] = useState<HTMLDivElement | null>(null);

  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showGrafo, setShowGrafo] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<null | 'funcoes' | 'grifar'>(null);
  const [selectionPill, setSelectionPill] = useState<{ x: number; y: number } | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [premiumGateDesc, setPremiumGateDesc] = useState<string | undefined>(undefined);
  const [premiumGateFeature, setPremiumGateFeature] = useState<PremiumFeatureKey>('default');
  const [showTermosSheet, setShowTermosSheet] = useState(false);
  const [showLembretesLocal, setShowLembretesLocal] = useState(false);
  const [showQuestoesPanel, setShowQuestoesPanel] = useState(false);
  const [showJurisPanel, setShowJurisPanel] = useState(false);
  const [showBaixarSheet, setShowBaixarSheet] = useState(false);

  useEffect(() => {
    setShowLembretesLocal(false);
    setShowGrafo(false);
    setShowQuestoesPanel(false);
    setShowJurisPanel(false);
    setShowBaixarSheet(false);
    setShowAnotacoesSheet(false);
    setShowPerguntarSheet(false);
    setShowPraticarSheet(false);
    setShowVideoaulasListSheet(false);
    setShowVideoaulaSheet(false);
    setShowTermosSheet(false);
    setShowSharePanel(false);
    setActiveActionMenu(null);
  }, [artigo?.numero, tabelaNome]);

  // Desktop text selection
  useEffect(() => {
    if (!isDesktop || !artigo) {
      setSelectionPill(null);
      return;
    }
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelectionPill(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const container = scrollContainerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSelectionPill(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        setSelectionPill(null);
        return;
      }
      setSelectionPill({ x: rect.left + rect.width / 2, y: rect.top });
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [isDesktop, artigo?.numero]);

  useEffect(() => {
    if (activeActionMenu === 'funcoes') {
      import('@/components/vademecum/sheets/LembretesArtigoSheet');
    }
  }, [activeActionMenu]);

  const { isPremium } = useSubscription();

  const openPremiumGate = (feature: PremiumFeatureKey, desc?: string) => {
    setPremiumGateFeature(feature);
    setPremiumGateDesc(desc);
    setShowPremiumGate(true);
  };

  const gateFeature = (
    _featureKey: string,
    gateKey: PremiumFeatureKey,
    _label: string,
    action: () => void
  ) => {
    if (isPremium) {
      action();
      return;
    }
    openPremiumGate(gateKey);
  };

  const [showGrifoFoto, setShowGrifoFoto] = useState(false);
  const [anotacoesCount, setAnotacoesCount] = useState<number>(0);
  const [anotacoesRefreshTick, setAnotacoesRefreshTick] = useState(0);

  // Realtime Presence
  const [onlineCount, setOnlineCount] = useState(0);
  useEffect(() => {
    if (!tabelaNome || !artigo?.numero) return;
    const channelName = `artigo:${tabelaNome}:${artigo.numero}`;
    const channel = supabase.channel(channelName);
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tabelaNome, artigo?.numero]);

  // Hook de narração
  const {
    narracaoUrl,
    narracaoWordTimings,
    narracaoLoading,
    narracaoStepIdx,
    narracaoPlaying,
    narracaoDuration,
    activeNarracaoWordIndex,
    narracaoAudioRef,
    narracaoProgressFillRef,
    narracaoRingRef,
    narracaoTimeRef,
    narracaoTotalTimeRef,
    narracaoTimingsRef,
    narracaoAdoptedRef,
    handleNarrarButtonPress,
    stopProgressTracking,
    adoptNarracao,
  } = useArtigoNarracao({
    artigo,
    tabelaNome,
    breadcrumb,
    isPremium,
    openPremiumGate,
  });

  const planaltoUrl = useMemo(() => {
    if (!tabelaNome || !artigo?.numero) return null;
    return buildPlanaltoArticleUrl(tabelaNome, artigo.numero);
  }, [tabelaNome, artigo?.numero]);

  // Hook de grifos
  const {
    highlights,
    highlightMode,
    selectedColor,
    containerRef,
    setSelectedColor,
    toggleMode,
    addHighlight,
    addHighlightAtOffsets,
    removeHighlight,
    removeHighlightsByColor,
    updateHighlightComment,
    updateHighlightTags,
    clearAll,
    getLineHighlights,
  } = useHighlights(artigo?.id || null);

  // Hook de grifo mágico
  const {
    magicMode,
    magicHighlights,
    magicLoading,
    magicTooltip,
    setMagicTooltip,
    grifoIaDefaultOn,
    setGrifoIaDefault,
    eraseSheetHighlights,
    handleRemoveGrifosByColor,
    handleClearAllGrifos,
    handleToggleMagic,
    handleRemoveSingleMagicHighlight,
  } = useArtigoGrifoMagico({
    artigo,
    tabelaNome,
    highlights,
    removeHighlightsByColor,
    clearAll,
    onAnotacoesCountChange: setAnotacoesCount,
    onAnotacoesRefresh: () => setAnotacoesRefreshTick((t) => t + 1),
  });

  const [showEraseSheet, setShowEraseSheet] = useState(false);
  const [showVoiceSheet, setShowVoiceSheet] = useState(false);
  const [voiceGrifoActive, setVoiceGrifoActive] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle');
  const voicePanelRef = useRef<GrifoVoicePanelHandle | null>(null);

  useEffect(() => {
    if (voiceGrifoActive && voicePhase === 'idle') {
      const t = setTimeout(() => {
        voicePanelRef.current?.start();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [voiceGrifoActive, voicePhase]);

  // Transfere para Activity nativa no Android
  useEffect(() => {
    if (!artigo?.numero) return;
    let cancel = false;

    import('@capacitor/core')
      .then(async ({ Capacitor }) => {
        if (cancel) return;
        if (Capacitor.isNativePlatform()) {
          try {
            const { NativeVadeMecumPlugin } = await import('@/plugins/NativeVadeMecumPlugin');
            await NativeVadeMecumPlugin.openArtigo({
              id: artigo.id,
              numero: String(artigo.numero),
              caput: artigo.caput || '',
              titulo: artigo.titulo || '',
              tabelaNome: tabelaNome || '',
              paragrafos: artigo.paragrafos || [],
              incisos: artigo.incisos || [],
              highlights: highlights.map((h) => ({
                id: h.id,
                text: h.text,
                color: h.color,
                startOffset: h.startOffset,
                endOffset: h.endOffset,
              })),
            });
            onClose();
          } catch (e) {
            console.warn('Executando leitor web de fallback:', e);
          }
        }
      })
      .catch(() => {});

    return () => {
      cancel = true;
    };
  }, [artigo?.id, artigo?.numero, tabelaNome, onClose, highlights]);

  useEffect(() => {
    setFocusedSegment(null);
    setIaFull(null);
  }, [artigo?.id]);

  // Contagem de anotações
  useEffect(() => {
    if (!artigo?.numero || !tabelaNome) {
      setAnotacoesCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setAnotacoesCount(0);
          return;
        }
        const [notesResult, highlightsResult] = await Promise.all([
          supabase
            .from('artigos_anotacoes')
            .select('anotacao, audio_url')
            .eq('user_id', user.id)
            .eq('tabela_codigo', tabelaNome)
            .eq('numero_artigo', artigo.numero),
          supabase
            .from('artigos_grifos')
            .select('highlights')
            .eq('user_id', user.id)
            .eq('tabela_codigo', tabelaNome)
            .eq('numero_artigo', artigo.numero)
            .maybeSingle(),
        ]);
        if (notesResult.error) throw notesResult.error;
        if (highlightsResult.error) throw highlightsResult.error;
        const uniqueNotes = new Set<string>();
        for (const note of notesResult.data || []) {
          const key = note.audio_url
            ? `audio:${note.audio_url}`
            : String(note.anotacao || '').trim().toLocaleLowerCase('pt-BR');
          if (key) uniqueNotes.add(key);
        }
        if (Array.isArray(highlightsResult.data?.highlights)) {
          for (const item of highlightsResult.data.highlights as any[]) {
            if (item?.origem !== 'ia') continue;
            const comment = String(item.comment || item.comentario || '')
              .trim()
              .toLocaleLowerCase('pt-BR');
            if (comment) uniqueNotes.add(comment);
          }
        }
        if (!cancelled) setAnotacoesCount(uniqueNotes.size);
      } catch {
        if (!cancelled) setAnotacoesCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [artigo?.id, tabelaNome, showAnotacoesSheet, magicHighlights.length, anotacoesRefreshTick]);

  const handleCopy = async () => {
    if (!artigo) return;
    const text = `Art. ${artigo.numero}${tabelaNome ? ` — ${tabelaNome}` : ''}\n\n${artigo.caput}`;
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Clipboard } = await import('@capacitor/clipboard');
        await Clipboard.write({ string: text });
      } else {
        await copiarTexto(text);
      }
      toast.success('Artigo copiado', { position: 'top-center' });
    } catch {
      try {
        await copiarTexto(text);
        toast.success('Artigo copiado', { position: 'top-center' });
      } catch {
        toast.error('Não foi possível copiar', { position: 'top-center' });
      }
    }
  };

  const openCreatePrompt = useCallback((newId: string) => {
    setCommentPrompt({ id: newId, show: true, mode: 'create' });
    setCommentText('');
    setCommentTags([]);
    setTagDraft('');
  }, []);

  const handleTextSelection = useCallback(() => {
    if (!highlightMode) return;
    if (isMobile) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
      const anchor = sel.anchorNode;
      if (!anchor || !containerRef.current?.contains(anchor)) return;
      const newId = addHighlight();
      sel.removeAllRanges();
      if (newId) {
        openCreatePrompt(newId);
      }
    }, 10);
  }, [highlightMode, addHighlight, isMobile, containerRef, openCreatePrompt]);

  // Mobile: Grifo instantâneo por toque e arraste
  useEffect(() => {
    if (!highlightMode || showEraseSheet) return;
    const container = containerRef.current;
    if (!container) return;

    let startCaret: { node: Node; offset: number; x: number; y: number } | null = null;
    let isDragging = false;

    const getCaret = (x: number, y: number): { node: Node; offset: number } | null => {
      if (typeof (document as any).caretRangeFromPoint === 'function') {
        const r = (document as any).caretRangeFromPoint(x, y);
        return r ? { node: r.startContainer, offset: r.startOffset } : null;
      }
      if (typeof (document as any).caretPositionFromPoint === 'function') {
        const pos = (document as any).caretPositionFromPoint(x, y);
        return pos ? { node: pos.offsetNode, offset: pos.offset } : null;
      }
      return null;
    };

    const commitHighlight = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      if (!text) return;
      const anchor = sel.anchorNode;
      if (!anchor || !container.contains(anchor)) return;
      const newId = addHighlight();
      sel.removeAllRanges();
      if (newId) {
        openCreatePrompt(newId);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const caret = getCaret(touch.clientX, touch.clientY);
      if (caret && container.contains(caret.node)) {
        startCaret = { node: caret.node, offset: caret.offset, x: touch.clientX, y: touch.clientY };
        isDragging = false;
      } else {
        startCaret = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!startCaret || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - startCaret.x, touch.clientY - startCaret.y);

      if (dist > 6) {
        isDragging = true;
        if (e.cancelable) e.preventDefault();

        const currentCaret = getCaret(touch.clientX, touch.clientY);
        if (currentCaret && container.contains(currentCaret.node)) {
          try {
            const liveRange = document.createRange();
            const comp = startCaret.node.compareDocumentPosition(currentCaret.node);
            if (
              comp & Node.DOCUMENT_POSITION_FOLLOWING ||
              (startCaret.node === currentCaret.node && startCaret.offset <= currentCaret.offset)
            ) {
              liveRange.setStart(startCaret.node, startCaret.offset);
              liveRange.setEnd(currentCaret.node, currentCaret.offset);
            } else {
              liveRange.setStart(currentCaret.node, currentCaret.offset);
              liveRange.setEnd(startCaret.node, startCaret.offset);
            }
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(liveRange);
            }
          } catch {}
        }
      }
    };

    const onTouchEnd = () => {
      if (isDragging) {
        isDragging = false;
        commitHighlight();
      }
      startCaret = null;
    };

    const onContextMenu = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('contextmenu', onContextMenu);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('contextmenu', onContextMenu);
    };
  }, [highlightMode, showEraseSheet, addHighlight, containerRef, openCreatePrompt]);

  // Hook isolado de comentários e IA
  const {
    isGeneratingAiNote,
    handleGerarAnotacaoIa,
    handleSaveComment,
    aiContent,
    aiLoading,
    aiGeneratingMode,
    aiGeneratingStep,
    splitSections,
  } = useArtigoCommentsAndAi({
    artigo,
    tabelaNome,
    isPremium,
    activeTab,
    setActiveTab,
    showTermosSheet,
    modificationInfo,
    highlights,
    updateHighlightComment,
    updateHighlightTags,
    setAnotacoesCount,
    setAnotacoesRefreshTick,
  });

  const handleDismissComment = useCallback(() => {
    setCommentPrompt(null);
    setCommentText('');
    setCommentTags([]);
    setTagDraft('');
  }, []);

  const addTagFromDraft = useCallback(() => {
    const t = tagDraft.trim().replace(/^#+/, '');
    if (!t) return;
    setCommentTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagDraft('');
  }, [tagDraft]);

  const handleHoverHighlight = useCallback((id: string | null, rect?: DOMRect) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    if (id && rect) {
      setTooltipData({ id, rect });
    } else {
      tooltipTimeoutRef.current = setTimeout(() => setTooltipData(null), 200);
    }
  }, []);

  const handleTapHighlight = useCallback(
    (id: string, _rect: DOMRect) => {
      const h = highlights.find((x) => x.id === id);
      if (!h) return;
      setCommentPrompt({ id, show: true, mode: 'view' });
      setCommentText(h.comment || '');
      setCommentTags(h.tags || []);
      setTagDraft('');
    },
    [highlights]
  );

  const tooltipHighlight = tooltipData ? highlights.find((h) => h.id === tooltipData.id) : null;

  useBodyScrollLock(!!artigo);

  // Auto-scroll to first modified line
  useEffect(() => {
    if (!artigo || !modificationInfo || modificationInfo.linhasModificadas.length === 0) return;
    const targetLine = modificationInfo.linhasModificadas[0];
    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const el = container.querySelector(`[data-line-index="${targetLine}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [artigo?.id, modificationInfo]);

  // Hook isolado de processamento do texto legal
  const {
    nomenJuris,
    isRevogado,
    displayLines,
    lineSegmentMap,
    lineWordStartIndexes,
    activeRenderedWordIndex,
    timingsAtivos,
  } = useArtigoTextProcessing({
    artigo,
    tabelaNome,
    showNomenJuris,
    showRedacao,
    modificationInfo,
    narracaoWordTimings,
    narracaoDuration,
    narracaoAudioRef,
    activeNarracaoWordIndex,
  });

  narracaoTimingsRef.current = timingsAtivos;

  const iaFullSections: AiSection[] = iaFull
    ? parseAiSections(
        aiContent[iaFull.mode] || '',
        iaFull.mode === 'exemplo' ? '---EXEMPLO---' : '---SECAO---'
      )
    : [];

  const handleSheetClose = () => {
    import('@/lib/nativeHaptics').then((m) => m.haptic.selection());
    const currentAudio = narracaoAudioRef.current;
    if (narracaoPlaying && currentAudio && artigo) {
      narracaoAdoptedRef.current = true;
      stopProgressTracking();
      adoptNarracao({
        audio: currentAudio,
        artigo,
        tabelaNome,
        leiNome: tabelaNome,
        returnPath: location.pathname + location.search,
      });
    }
    onClose();
  };

  const anyPanelOpen =
    showAnotacoesSheet ||
    showPerguntarSheet ||
    showPraticarSheet ||
    showQuestoesPanel ||
    showJurisPanel ||
    showVideoaulasListSheet ||
    showVideoaulaSheet ||
    showBaixarSheet ||
    showLembretesLocal ||
    showTermosSheet ||
    showGrafo ||
    showGrifoFoto;

  if (!artigo) return null;

  return (
    <>
      <Sheet
        open={Boolean(artigo)}
        onOpenChange={(open) => {
          if (!open) handleSheetClose();
        }}
      >
        <SheetContent
          ref={(node: HTMLDivElement | null) => {
            sheetContentRef.current = node;
            setSheetNode(node);
          }}
          side="bottom"
          className={
            isDesktop
              ? 'theme-vademecum-accent z-[9999] flex min-h-0 flex-col gap-0 overflow-hidden overscroll-contain rounded-2xl border border-white/5 bg-[#0f0f0f] p-0 shadow-2xl [&>button:last-child]:hidden top-[5%] bottom-[5%] inset-x-0 mx-auto max-w-[860px] h-[90dvh] max-h-[90dvh]'
              : 'theme-vademecum-accent z-[9999] flex min-h-0 flex-col gap-0 overflow-hidden overscroll-contain rounded-t-3xl border-t border-white/5 bg-[#0f0f0f] p-0 !pb-0 [&>button:last-child]:hidden top-auto bottom-0 h-[90dvh] max-h-[90dvh]'
          }
          onInteractOutside={(e) => {
            const t = e.target as HTMLElement | null;
            if (
              iaFull ||
              (t &&
                (t.closest('[data-artigo-rail]') ||
                  t.closest('[data-artigo-menu]') ||
                  t.closest('[data-artigo-ia-fullscreen]')))
            )
              e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            const t = e.target as HTMLElement | null;
            if (
              iaFull ||
              (t &&
                (t.closest('[data-artigo-rail]') ||
                  t.closest('[data-artigo-menu]') ||
                  t.closest('[data-artigo-ia-fullscreen]')))
            )
              e.preventDefault();
          }}
        >
          <div className="shrink-0 flex justify-center pt-3 pb-1 bg-[#0f0f0f]">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <div
            ref={scrollContainerRef as any}
            className="flex-1 overflow-y-auto min-h-0 relative overscroll-contain"
          >
            <ArtigoSheetHeader
              artigo={artigo}
              tabelaNome={tabelaNome}
              breadcrumb={breadcrumb}
              isFavorito={isFavorito}
              onToggleFavorito={onToggleFavorito}
              isPremium={isPremium}
              openPremiumGate={openPremiumGate}
              showRedacao={showRedacao}
              setShowRedacao={setShowRedacao}
              showFontControls={showFontControls}
              setShowFontControls={setShowFontControls}
              fontSize={fontSize}
              setFontSize={setFontSize}
              onlineCount={onlineCount}
              highlightMode={highlightMode}
              voiceGrifoActive={voiceGrifoActive}
              onClose={handleSheetClose}
              planaltoUrl={planaltoUrl}
              showSharePanel={showSharePanel}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              clearAll={clearAll}
              magicMode={magicMode}
              magicHighlights={magicHighlights}
            />

            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                if (showAnotacoesSheet || showPerguntarSheet || showPraticarSheet) return;
                const openIA = (mode: 'explicacao' | 'exemplo') => {
                  setActiveTab(mode);
                  setIaFull({ mode, sectionId: focusedSegment });
                };
                if (v === 'explicacao' || v === 'exemplo') {
                  if (!isPremium) {
                    openPremiumGate(v as PremiumFeatureKey);
                    return;
                  }
                  openIA(v);
                  return;
                }
                setActiveTab(v);
              }}
              className="flex flex-col"
            >
              <ArtigoTabsNavigation modificationInfo={modificationInfo} />

              <TabsContent
                value="artigo"
                className="px-5 pb-[calc(9rem+var(--sai-bottom,0px))] pt-4 relative"
              >
                <NarracaoProgressBar
                  narracaoPlaying={narracaoPlaying}
                  handleNarrarButtonPress={handleNarrarButtonPress}
                  narracaoAudioRef={narracaoAudioRef}
                  narracaoProgressFillRef={narracaoProgressFillRef}
                  narracaoTimeRef={narracaoTimeRef}
                  narracaoTotalTimeRef={narracaoTotalTimeRef}
                  narracaoActiveIdxRef={useRef(-1)}
                />

                <div
                  className="sticky top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-center pointer-events-none z-0"
                  style={{ height: 0 }}
                >
                  <img
                    src={brasaoImg}
                    alt=""
                    className="w-48 h-48 opacity-[0.06] object-contain"
                  />
                </div>

                <div>
                  {nomenJuris && (
                    <div className="mb-3">
                      <h4 className="text-primary font-bold text-base">
                        {showRedacao ? highlightTermos(nomenJuris, true) : stripRedacao(nomenJuris)}
                      </h4>
                    </div>
                  )}

                  {isRevogado && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-3 py-1 text-purple-300 text-xs font-semibold">
                      Dispositivo revogado
                    </div>
                  )}

                  {artigo.titulo &&
                    !/^(PARTE|LIVRO|T[IÍ]TULO|CAP[IÍ]TULO|SEÇ[AÃ]O|SUBSEÇ[AÃ]O)\b/i.test(
                      artigo.titulo
                    ) && (
                      <p className="mb-3 border-l-2 border-primary/70 pl-3 text-[13px] italic text-primary/90 font-body leading-snug">
                        {artigo.titulo}
                      </p>
                    )}

                  <div
                    ref={containerRef}
                    className={`space-y-4 font-legal text-base ${
                      highlightMode ? 'select-text cursor-text highlight-selectable' : ''
                    }`}
                    style={
                      highlightMode
                        ? ({
                            WebkitUserSelect: 'text',
                            userSelect: 'text',
                            WebkitTouchCallout: 'none',
                            WebkitTapHighlightColor: 'transparent',
                            '--hl-selection': selectedColor,
                          } as React.CSSProperties)
                        : undefined
                    }
                    onContextMenu={(e) => {
                      if (highlightMode) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    onMouseUp={handleTextSelection}
                  >
                    {displayLines.map((line, i) => (
                      <ArtigoLineRenderer
                        key={`line-${i}`}
                        line={line}
                        lineIndex={i}
                        isFirst={i === 0}
                        modificationInfo={modificationInfo}
                        showRedacao={showRedacao}
                        isRevogado={isRevogado}
                        fontSize={fontSize}
                        highlightMode={highlightMode}
                        focusedSegment={focusedSegment}
                        selectedColor={selectedColor}
                        lineSegmentMap={lineSegmentMap}
                        artigoNumero={artigo?.numero}
                        magicMode={magicMode}
                        magicHighlights={magicHighlights}
                        handleRemoveSingleMagicHighlight={handleRemoveSingleMagicHighlight}
                        setMagicTooltip={setMagicTooltip}
                        narracaoPlaying={narracaoPlaying}
                        activeRenderedWordIndex={activeRenderedWordIndex}
                        lineWordStartIndex={lineWordStartIndexes[i] || 0}
                        lineHighlights={getLineHighlights(i)}
                        removeHighlight={removeHighlight}
                        handleHoverHighlight={handleHoverHighlight}
                        handleTapHighlight={handleTapHighlight}
                        setFocusedSegment={setFocusedSegment}
                      />
                    ))}
                  </div>
                </div>

                <GrifoCommentPrompt
                  commentPrompt={commentPrompt}
                  highlights={highlights}
                  selectedColor={selectedColor}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  commentTags={commentTags}
                  setCommentTags={setCommentTags}
                  tagDraft={tagDraft}
                  setTagDraft={setTagDraft}
                  isGeneratingAiNote={isGeneratingAiNote}
                  handleGerarAnotacaoIa={() =>
                    handleGerarAnotacaoIa(commentPrompt, setCommentText)
                  }
                  handleDismissComment={handleDismissComment}
                  handleSaveComment={() =>
                    handleSaveComment(commentPrompt, commentText, commentTags, handleDismissComment)
                  }
                  removeHighlight={removeHighlight}
                  addTagFromDraft={addTagFromDraft}
                />

                <AnimatePresence>
                  {tooltipData && tooltipHighlight?.comment && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="fixed z-[80] w-[min(20rem,calc(100vw-2rem))] bg-popover border border-border rounded-xl shadow-xl px-4 py-3"
                      style={{
                        top: tooltipData.rect.top - 8,
                        left: Math.max(16, Math.min(tooltipData.rect.left, window.innerWidth - 336)),
                        transform: 'translateY(-100%)',
                      }}
                      onMouseEnter={() => {
                        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
                      }}
                      onMouseLeave={() => setTooltipData(null)}
                    >
                      <p className="text-[clamp(1rem,4.2vw,1.125rem)] text-foreground leading-[1.5]">
                        {tooltipHighlight.comment}
                      </p>
                      <div
                        className="absolute w-2 h-2 bg-popover border-r border-b border-border rotate-45"
                        style={{ bottom: -5, left: 16 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <ArtigoMagicTooltipModal
                  magicTooltip={magicTooltip}
                  onClose={() => setMagicTooltip(null)}
                  onRemoveSingleMagicHighlight={handleRemoveSingleMagicHighlight}
                />
              </TabsContent>

              <ArtigoTabExplicacao
                artigo={artigo}
                modificationInfo={modificationInfo}
                isPremium={isPremium}
                openPremiumGate={openPremiumGate}
                aiLoading={Boolean(aiLoading.explicacao)}
                aiContent={aiContent.explicacao}
                fontSize={fontSize}
                splitSections={splitSections}
              />

              <ArtigoTabExemplo
                isPremium={isPremium}
                openPremiumGate={openPremiumGate}
                aiLoading={Boolean(aiLoading.exemplo)}
                aiContent={aiContent.exemplo}
                fontSize={fontSize}
                splitSections={splitSections}
              />

              <ArtigoTabHistorico caput={artigo?.caput} />
            </Tabs>
          </div>

          {(activeTab ?? 'artigo') === 'artigo' && (
            <ArtigoActionMenuSheet
              activeActionMenu={activeActionMenu}
              setActiveActionMenu={setActiveActionMenu}
              tabelaNome={tabelaNome}
              artigoNumero={artigo?.numero}
              requireOnline={requireOnline}
              gateFeature={gateFeature}
              navigate={navigate}
              setShowVideoaulasListSheet={setShowVideoaulasListSheet}
              setShowTermosSheet={setShowTermosSheet}
              setShowPerguntarSheet={setShowPerguntarSheet}
              setShowGrafo={setShowGrafo}
              handleCopy={handleCopy}
              setShowLembretesLocal={setShowLembretesLocal}
              setShowBaixarSheet={setShowBaixarSheet}
              setShowSharePanel={setShowSharePanel}
              highlightMode={highlightMode}
              toggleMode={toggleMode}
              magicMode={magicMode}
              magicLoading={magicLoading}
              magicHighlightsCount={magicHighlights.length}
              handleToggleMagic={handleToggleMagic}
              setVoiceGrifoActive={setVoiceGrifoActive}
              setShowGrifoFoto={setShowGrifoFoto}
              eraseSheetHighlightsCount={eraseSheetHighlights.length}
              setShowEraseSheet={setShowEraseSheet}
              grifoIaDefaultOn={grifoIaDefaultOn}
              setGrifoIaDefault={setGrifoIaDefault}
            />
          )}

          {(activeTab ?? 'artigo') === 'artigo' && !isDesktop && (
            <ArtigoBottomBar
              highlightMode={highlightMode}
              voiceGrifoActive={voiceGrifoActive}
              setShowEraseSheet={setShowEraseSheet}
              activeActionMenu={activeActionMenu}
              setActiveActionMenu={setActiveActionMenu}
              isPremium={isPremium}
              openPremiumGate={openPremiumGate}
              setShowPraticarSheet={setShowPraticarSheet}
              voicePhase={voicePhase}
              voicePanelRef={voicePanelRef}
              setVoiceGrifoActive={setVoiceGrifoActive}
              toggleMode={toggleMode}
              handleNarrarButtonPress={handleNarrarButtonPress}
              narracaoLoading={narracaoLoading}
              narracaoPlaying={narracaoPlaying}
              narracaoUrl={narracaoUrl}
              narracaoRingRef={narracaoRingRef}
              setShowAnotacoesSheet={setShowAnotacoesSheet}
              setShowFontControls={setShowFontControls}
              anotacoesCount={anotacoesCount}
              magicMode={magicMode}
              magicLoading={magicLoading}
              highlightsCount={highlights.length + magicHighlights.length}
            />
          )}

          <GrifoMagicoLoader open={magicLoading} />

          <ArtigoGrifoTopBar
            isVisible={(highlightMode || voiceGrifoActive) && (activeTab ?? 'artigo') === 'artigo'}
            voiceGrifoActive={voiceGrifoActive}
            onCloseGrifo={() => {
              if (voiceGrifoActive) {
                try {
                  voicePanelRef.current?.stop();
                } catch {}
                setVoiceGrifoActive(false);
              } else {
                toggleMode();
              }
            }}
          />

          <GrifoVoicePanel
            ref={voicePanelRef}
            active={voiceGrifoActive}
            linhas={displayLines}
            onPhaseChange={setVoicePhase}
            onDeactivate={() => setVoiceGrifoActive(false)}
            onApplyPassages={(passages) => {
              for (const p of passages) {
                addHighlightAtOffsets(p.lineIndex, p.startOffset, p.endOffset, p.text, p.color);
              }
            }}
          />

          <ArtigoPraticarModal
            showPraticarSheet={showPraticarSheet}
            setShowPraticarSheet={setShowPraticarSheet}
            artigoNumero={artigo?.numero}
            tabelaNome={tabelaNome}
            isPremium={isPremium}
            openPremiumGate={openPremiumGate}
            isDesktop={isDesktop}
            setShowQuestoesPanel={setShowQuestoesPanel}
            navigate={navigate}
          />

          <ArtigoTermosSheet
            open={showTermosSheet}
            onOpenChange={setShowTermosSheet}
            loading={aiLoading.termos}
            content={aiContent.termos}
            fontSize={fontSize}
          />
        </SheetContent>
      </Sheet>

      <ArtigoOverlays
        showEraseSheet={showEraseSheet}
        setShowEraseSheet={setShowEraseSheet}
        eraseSheetHighlights={eraseSheetHighlights}
        handleRemoveGrifosByColor={handleRemoveGrifosByColor}
        handleClearAllGrifos={handleClearAllGrifos}
        showVoiceSheet={showVoiceSheet}
        setShowVoiceSheet={setShowVoiceSheet}
        displayLines={displayLines}
        addHighlightAtOffsets={addHighlightAtOffsets}
        narracaoLoading={narracaoLoading}
        narracaoStepIdx={narracaoStepIdx}
        aiGeneratingMode={aiGeneratingMode}
        aiGeneratingStep={aiGeneratingStep}
        showVideoaulaSheet={showVideoaulaSheet}
        setShowVideoaulaSheet={setShowVideoaulaSheet}
        videoaula={videoaula}
        setVideoaula={setVideoaula}
        showVideoaulasListSheet={showVideoaulasListSheet}
        setShowVideoaulasListSheet={setShowVideoaulasListSheet}
        tabelaNome={tabelaNome}
        artigo={artigo}
        showAnotacoesSheet={showAnotacoesSheet}
        setShowAnotacoesSheet={setShowAnotacoesSheet}
        setAnotacoesCount={setAnotacoesCount}
        showPerguntarSheet={showPerguntarSheet}
        setShowPerguntarSheet={setShowPerguntarSheet}
        showGrafo={showGrafo}
        setShowGrafo={setShowGrafo}
        showPremiumGate={showPremiumGate}
        setShowPremiumGate={setShowPremiumGate}
        premiumGateFeature={premiumGateFeature}
        premiumGateDesc={premiumGateDesc}
        showLembretesLocal={showLembretesLocal}
        setShowLembretesLocal={setShowLembretesLocal}
        showBaixarSheet={showBaixarSheet}
        setShowBaixarSheet={setShowBaixarSheet}
        showGrifoFoto={showGrifoFoto}
        setShowGrifoFoto={setShowGrifoFoto}
      />

      {isDesktop && artigo && (
        <>
          <ArtigoSidePanel
            open={showQuestoesPanel}
            onClose={() => setShowQuestoesPanel(false)}
            widthClass="w-[min(40rem,94vw)]"
          >
            <Suspense
              fallback={
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              }
            >
              {showQuestoesPanel && (
                <QuizView
                  tabelaNome={tabelaNome || ''}
                  artigoNumero={String(artigo.numero)}
                  leiNome={tabelaNome || ''}
                  onBack={() => setShowQuestoesPanel(false)}
                />
              )}
            </Suspense>
          </ArtigoSidePanel>

          <ArtigoSidePanel
            open={showJurisPanel}
            onClose={() => setShowJurisPanel(false)}
            widthClass="w-[min(40rem,94vw)]"
          >
            <Suspense
              fallback={
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              }
            >
              {showJurisPanel && (
                <JurisprudenciaArtigoView
                  embedded
                  slugLeiProp={tabelaNome || ''}
                  numeroArtigoProp={encodeURIComponent(String(artigo.numero))}
                  onBack={() => setShowJurisPanel(false)}
                />
              )}
            </Suspense>
          </ArtigoSidePanel>
        </>
      )}

      <ArtigoDesktopRails
        isDesktop={isDesktop}
        artigo={artigo}
        activeTab={activeTab}
        handleNarrarButtonPress={handleNarrarButtonPress}
        activeActionMenu={activeActionMenu}
        setActiveActionMenu={setActiveActionMenu}
        isPremium={isPremium}
        openPremiumGate={openPremiumGate}
        gateFeature={gateFeature}
        setShowAnotacoesSheet={setShowAnotacoesSheet}
        setShowPraticarSheet={setShowPraticarSheet}
        requireOnline={requireOnline}
        tabelaNome={tabelaNome}
        setShowJurisPanel={setShowJurisPanel}
        navigate={navigate}
        setShowVideoaulasListSheet={setShowVideoaulasListSheet}
        setShowTermosSheet={setShowTermosSheet}
        setShowPerguntarSheet={setShowPerguntarSheet}
        setShowGrafo={setShowGrafo}
        handleCopy={handleCopy}
        setShowLembretesLocal={setShowLembretesLocal}
        setShowBaixarSheet={setShowBaixarSheet}
        setShowSharePanel={setShowSharePanel}
        setShowFontControls={setShowFontControls}
        setShowCommentPanel={setShowCommentPanel}
        anyPanelOpen={anyPanelOpen}
        selectionPill={selectionPill}
      />

      <ArtigoIAFullscreen
        open={Boolean(iaFull && artigo)}
        mode={iaFull?.mode || 'explicacao'}
        artigoNumero={
          artigo
            ? /^\d/.test((artigo.numero || '').trim())
              ? `Art. ${artigo.numero}`
              : artigo.numero
            : ''
        }
        leiNome={LEIS_CATALOG.find((l) => l.tabela_nome === tabelaNome)?.nome || tabelaNome}
        sections={iaFullSections}
        loading={iaFull ? Boolean(aiLoading[iaFull.mode]) : false}
        initialSectionId={iaFull?.sectionId ?? null}
        fontSize={fontSize}
        portalContainer={sheetNode}
        onClose={() => {
          setIaFull(null);
          setActiveTab('artigo');
        }}
      />
    </>
  );
};

export default ArtigoBottomSheet;
