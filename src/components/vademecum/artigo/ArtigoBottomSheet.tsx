import { cloneElement, isValidElement, useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Star, Heart, Highlighter, Copy, Plus, Minus, Type, MessageSquare, ChevronUp, ChevronDown, ChevronRight, ExternalLink, Volume2, Pause, Target, StickyNote, MessageCircle, Loader2, Share2, Network, BookOpen, Layers, Sparkles, GraduationCap, Play, Camera, Feather, History, LayoutGrid, Mic, Square, Bell, Scale, Download, Trash2, Box } from 'lucide-react';
const QuizView = lazyWithRetry(() => import('@/components/estudar/QuizView'));
const JurisprudenciaArtigoView = lazyWithRetry(() => import('@/pages/JurisprudenciaArtigo'));
import ArtigoSidePanel from '@/components/vademecum/artigo/ArtigoSidePanel';
import GrifoVoicePanel, { type GrifoVoicePanelHandle, type VoicePhase } from '@/components/vademecum/grifos_ocr/GrifoVoicePanel';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';
import type { ArtigoLei } from '@/data/mockData';
import brasaoImgAsset from '@/assets/brasao-republica.webp';
const brasaoImg = brasaoImgAsset;

import { useIsDesktop } from '@/hooks/use-desktop';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHighlights, type Highlight } from '@/hooks/useHighlights';
import { supabase } from '@/integrations/supabase/client';
import { buildPlanaltoArticleUrl } from '@/services/legislacaoService';
import { LEIS_CATALOG } from '@/data/leisCatalog';

import { useSubscription } from '@/hooks/useSubscription';
import { type PremiumFeatureKey } from '@/components/PremiumGate';

import { toast } from 'sonner';
import { requireOnline } from '@/lib/offlineFeatures';
import { useArtigoGrifoMagico } from './useArtigoGrifoMagico';
import { parseAiSections, buildLineSegmentMap, type AiSection } from '@/lib/artigoSegments';
import ArtigoIAFullscreen from '@/components/vademecum/artigo/ArtigoIAFullscreen';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import horusOwlAsset from '@/assets/horus/horus-owl.png.asset.json';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

import GrifoMagicoLoader from '@/components/vademecum/grifos_ocr/GrifoMagicoLoader';
import {
  prefetchArtigoFuncoesChunks,
  prefetchArtigoFuncoesDados,
  getCachedData,
  invalidateCache,
  anotacoesKey,
  loadTermosExistentes,
  termosKey,
} from '@/lib/artigoFuncoesPrefetch';
import { stopNativeSpeech } from '@/lib/nativeTts';

import { LEIS_SUPABASE_URL, LEIS_SUPABASE_ANON_KEY, LEIS_SUPABASE_PROJECT_ID } from "@/lib/legislacaoBackend";
import { copiarTexto } from '@/lib/nativo/copiar';
const SB_URL = LEIS_SUPABASE_URL;
const SB_KEY = LEIS_SUPABASE_ANON_KEY;
const SB_PROJECT_ID = LEIS_SUPABASE_PROJECT_ID;
import { useArtigoNarracao, RING_CIRCUMFERENCE } from './useArtigoNarracao';

import {
  type ModificationInfo,
  type ArtigoBottomSheetProps,
  type MagicGrifo,
  MAGIC_COLORS,
  NARRACAO_CACHE_VERSION,
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
} from './chunks';

import {
  stripRedacao,
  normalizeNarracaoToken,
  getWordTokens,
  alinharTimingsComTexto,
  formatArtigoNumeroExtenso,
  formatTextoArtigoParaNarracao,
  isLineRevogado,
  LEGAL_LINE_START_RE,
  LEGAL_NOTE_ONLY_RE,
  normalizeLegalLineBreaks,
  highlightTermos,
  highlightTermosOnly,
  classifyLine,
  applyHighlightsToText,
  formatNarracaoTime,
} from './artigoTextUtils';
import { fixMojibake, sanitizeArtigo } from '@/lib/mojibake';

// highlightTermos, highlightTermosOnly, classifyLine, applyHighlightsToText
// → moved to artigoTextUtils.tsx

const ArtigoBottomSheet = ({ artigo: rawArtigo, onClose, isFavorito, onToggleFavorito, showNomenJuris = false, tabelaNome, forceShowRedacao, modificationInfo, breadcrumb: rawBreadcrumb }: ArtigoBottomSheetProps) => {
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

  // Reset showRedacao when forceShowRedacao changes (e.g. opening from novidades)
  useEffect(() => {
    if (forceShowRedacao !== undefined) setShowRedacao(forceShowRedacao);
  }, [forceShowRedacao, artigo?.id]);

  // GA4: view_artigo ao abrir/trocar de artigo
  useEffect(() => {
    if (!artigo?.numero) return;
    import('@/lib/appEvents').then(({ appEvents }) =>
      appEvents.viewArtigo({ tabela: tabelaNome, numero: artigo.numero })
    ).catch(() => {});
  }, [artigo?.id, artigo?.numero, tabelaNome]);

  // Prefetch de jurisprudência: começa em background assim que o artigo abre,
  // para a tela abrir instantaneamente quando o usuário clicar em "Jurisprudência".
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

  // Prefetch das demais funções (chunks + dados) assim que o artigo abre,
  // para que cada item do menu "Funções" abra instantaneamente.
  useEffect(() => {
    if (!artigo?.numero) return;
    prefetchArtigoFuncoesChunks();
    let cancelado = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelado) return;
      prefetchArtigoFuncoesDados({
        tabela: tabelaNome,
        numero: String(artigo.numero),
        userId: data.user?.id ?? null,
      });
    }).catch(() => {});
    return () => { cancelado = true; };
  }, [artigo?.id, artigo?.numero, tabelaNome]);
  const [fontSize, setFontSize] = useState(18);
  const [showFontControls, setShowFontControls] = useState(false);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [showPraticarSheet, setShowPraticarSheet] = useState(false);
  
  const [videoaula, setVideoaula] = useState<{ titulo: string; url: string; canal: string; videoId: string; transcricao?: string } | null>(null);
  const [videoaulasLoading, setVideoaulasLoading] = useState(false);
  const [showVideoaulaSheet, setShowVideoaulaSheet] = useState(false);
  const [showVideoaulasListSheet, setShowVideoaulasListSheet] = useState(false);
  
  const [showAnotacoesSheet, setShowAnotacoesSheet] = useState(false);
  const [showPerguntarSheet, setShowPerguntarSheet] = useState(false);
  const [activeTab, setActiveTab] = useState('artigo');
  // Leitor em tela cheia da Explicação/Exemplo + trecho do artigo em foco.
  const [iaFull, setIaFull] = useState<{ mode: 'explicacao' | 'exemplo'; sectionId: string | null } | null>(null);
  const [focusedSegment, setFocusedSegment] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiGeneratingMode, setAiGeneratingMode] = useState<null | 'explicacao' | 'exemplo' | 'termos'>(null);
  const [aiGeneratingStep, setAiGeneratingStep] = useState(0);
  const [commentPrompt, setCommentPrompt] = useState<{ id: string; show: boolean; mode: 'create' | 'view' } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentTags, setCommentTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [tooltipData, setTooltipData] = useState<{ id: string; rect: DOMRect } | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Container do Sheet: os menus (Funções / Grifar) são portados para dentro
  // dele, senão o Radix Dialog os marca como inertes no mobile e o toque
  // simplesmente não abre nada.
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
  // Desktop: pílula flutuante Narrar/Grifar quando há seleção de texto no artigo
  useEffect(() => {
    if (!isDesktop || !artigo) { setSelectionPill(null); return; }
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setSelectionPill(null); return; }
      const range = sel.getRangeAt(0);
      const container = scrollContainerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) { setSelectionPill(null); return; }
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) { setSelectionPill(null); return; }
      setSelectionPill({ x: rect.left + rect.width / 2, y: rect.top });
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [isDesktop, artigo?.numero]);
  // Prefetch do sheet de Lembretes assim que o menu Funções abre,
  // para que o clique em "Lembretes" seja instantâneo.
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

  /**
   * Gate padrão das funções do artigo: 100% exclusivo para assinantes Prime.
   * A única função gratuita é 'Copiar artigo'.
   */
  const gateFeature = (
    _featureKey: string,
    gateKey: PremiumFeatureKey,
    _label: string,
    action: () => void,
  ) => {
    if (isPremium) { action(); return; }
    openPremiumGate(gateKey);
  };


  const [showGrifoFoto, setShowGrifoFoto] = useState(false);
  // Contador de anotações persistidas para o badge do rodapé.
  const [anotacoesCount, setAnotacoesCount] = useState<number>(0);
  // Bump manual para forçar releitura da contagem depois de gravar anotações
  // (o efeito abaixo roda antes das inserções do grifo mágico terminarem).
  const [anotacoesRefreshTick, setAnotacoesRefreshTick] = useState(0);

  // Realtime Presence: show how many users are reading this article
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
    return () => { supabase.removeChannel(channel); };
  }, [tabelaNome, artigo?.numero]);
  // ─── Narration engine (extracted to useArtigoNarracao) ───
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
    setNarracaoUrl,
    setNarracaoWordTimings,
    setNarracaoPlaying,
    setNarracaoActiveWordIndex,
    handleNarrarButtonPress,
    gerarNarracao,
    playNarracao,
    stopProgressTracking,
    startProgressTracking,
    adoptNarracao,
    closeFlutuante,
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

  const {
    magicMode,
    setMagicMode,
    magicHighlights,
    setMagicHighlights,
    magicLoading,
    magicTooltip,
    setMagicTooltip,
    grifoIaDefaultOn,
    setGrifoIaDefault,
    eraseSheetHighlights,
    persistMagicRemoval,
    persistMagicHighlights,
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
  const lastCreatedHlRef = useRef<string | null>(null);

  // Auto-inicia gravação ao ativar Grifar por voz
  useEffect(() => {
    if (voiceGrifoActive && voicePhase === 'idle') {
      const t = setTimeout(() => { voicePanelRef.current?.start(); }, 150);
      return () => clearTimeout(t);
    }
  }, [voiceGrifoActive]);

  // No Android nativo, transfere a abertura para a Activity 100% nativa em Kotlin/Compose
  useEffect(() => {
    if (!artigo?.numero) return;
    let cancel = false;

    import('@capacitor/core').then(async ({ Capacitor }) => {
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
            highlights: highlights.map(h => ({
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
    }).catch(() => {});

    return () => { cancel = true; };
  }, [artigo?.id, artigo?.numero, tabelaNome, onClose]);

  useEffect(() => {
    setFocusedSegment(null);
    setIaFull(null);
  }, [artigo?.id]);



  // Carrega a mesma contagem única exibida na tela de anotações. As explicações
  // do Grifo Mágico existem no snapshot de grifos e podem também ter uma linha
  // persistida; ambas representam uma única anotação para o usuário.
  useEffect(() => {
    if (!artigo?.numero || !tabelaNome) { setAnotacoesCount(0); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (!cancelled) setAnotacoesCount(0); return; }
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
            const comment = String(item.comment || item.comentario || '').trim().toLocaleLowerCase('pt-BR');
            if (comment) uniqueNotes.add(comment);
          }
        }
        if (!cancelled) setAnotacoesCount(uniqueNotes.size);
      } catch { if (!cancelled) setAnotacoesCount(0); }
    })();
    return () => { cancelled = true; };
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
    } catch (e) {
      try { await copiarTexto(text); toast.success('Artigo copiado', { position: 'top-center' }); }
      catch { toast.error('Não foi possível copiar', { position: 'top-center' }); }
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
    // Desktop: mouseup fires this. Mobile uses the selectionchange effect below.
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

  // Mobile: Grifo instantâneo ao passar o dedo (sem precisar ficar pressionando/segurando).
  // O usuário apenas toca e arrasta o dedo pelo texto, e o grifo se forma imediatamente.
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

      // Quando o dedo se move mais de 6px, ativa imediatamente o arrasto de grifo
      if (dist > 6) {
        isDragging = true;
        if (e.cancelable) e.preventDefault();

        const currentCaret = getCaret(touch.clientX, touch.clientY);
        if (currentCaret && container.contains(currentCaret.node)) {
          try {
            const liveRange = document.createRange();
            const comp = startCaret.node.compareDocumentPosition(currentCaret.node);
            if (comp & Node.DOCUMENT_POSITION_FOLLOWING || (startCaret.node === currentCaret.node && startCaret.offset <= currentCaret.offset)) {
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
  }, [highlightMode, addHighlight, containerRef]);


  const handleScrollUp = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ top: -150, behavior: 'smooth' });
  }, []);

  const handleScrollDown = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ top: 150, behavior: 'smooth' });
  }, []);

  const [isGeneratingAiNote, setIsGeneratingAiNote] = useState(false);

  const handleGerarAnotacaoIa = useCallback(async () => {
    if (!commentPrompt) return;
    const currentHl = highlights.find(h => h.id === commentPrompt.id);
    const trecho = currentHl?.text || artigo?.caput;
    if (!trecho) return;
    setIsGeneratingAiNote(true);
    try {
      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: {
          mode: 'perguntar',
          artigoTexto: `Trecho da lei: "${trecho}"\nArtigo ${artigo?.numero || ''} da norma ${tabelaNome || ''}`,
          artigoNumero: artigo?.numero,
          leiNome: tabelaNome || '',
          messages: [
            {
              role: 'user',
              content: `Aja como um professor de direito para OAB/concursos. Escreva uma anotação de estudo rápida, didática e direta (máximo 2 a 3 frases) explicando o significado prático ou pegadinha desse trecho da lei: "${trecho}". Sem cumprimentos, vá direto à anotação.`,
            },
          ],
        },
      });
      if (error) throw error;
      const reply = data?.reply || data?.text || data?.content;
      if (reply) {
        setCommentText(reply.trim());
        toast.success('Anotação gerada pela IA!');
      } else {
        toast.error('Não foi possível gerar a anotação.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao conectar com a IA');
    } finally {
      setIsGeneratingAiNote(false);
    }
  }, [commentPrompt, highlights, artigo?.caput, artigo?.numero, tabelaNome]);

  const handleSaveComment = useCallback(async () => {
    if (commentPrompt) {
      const text = commentText.trim();
      if (text) {
        updateHighlightComment(commentPrompt.id, text);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && tabelaNome && artigo?.numero) {
            const currentHl = highlights.find(h => h.id === commentPrompt.id);
            const anotacaoText = currentHl?.text ? `[Grifo]: "${currentHl.text}"\n${text}` : text;
            await supabase.from('artigos_anotacoes').insert({
              user_id: user.id,
              tabela_codigo: tabelaNome,
              numero_artigo: String(artigo.numero),
              artigo_id: `${tabelaNome}::${artigo.numero}`,
              anotacao: anotacaoText,
            });
            invalidateCache(anotacoesKey(tabelaNome, String(artigo.numero), user.id));
            setAnotacoesRefreshTick(t => t + 1);
            setAnotacoesCount(c => c + 1);
            toast.success('Anotação salva');
          } else {
            toast.success('Anotação salva localmente');
          }
        } catch (e) {
          console.warn('Erro ao sincronizar anotação com Supabase:', e);
          toast.success('Anotação salva localmente');
        }
      }
      updateHighlightTags(commentPrompt.id, commentTags);
    }
    setCommentPrompt(null);
    setCommentText('');
    setCommentTags([]);
    setTagDraft('');
  }, [commentPrompt, commentText, commentTags, updateHighlightComment, updateHighlightTags, highlights, tabelaNome, artigo?.numero]);

  const handleDismissComment = useCallback(() => {
    setCommentPrompt(null);
    setCommentText('');
    setCommentTags([]);
    setTagDraft('');
  }, []);

  const addTagFromDraft = useCallback(() => {
    const t = tagDraft.trim().replace(/^#+/, '');
    if (!t) return;
    setCommentTags(prev => prev.includes(t) ? prev : [...prev, t]);
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

  const handleTapHighlight = useCallback((id: string, _rect: DOMRect) => {
    // Abre o card flutuante em modo visualização/edição
    const h = highlights.find(x => x.id === id);
    if (!h) return;
    setCommentPrompt({ id, show: true, mode: 'view' });
    setCommentText(h.comment || '');
    setCommentTags(h.tags || []);
    setTagDraft('');
  }, [highlights]);

  const handleScrollToHighlight = useCallback((highlightId: string) => {
    const mark = containerRef.current?.querySelector(`[data-highlight-id="${highlightId}"]`) ||
      containerRef.current?.querySelector(`mark`);
    // Find the mark with matching key
    const marks = containerRef.current?.querySelectorAll('mark');
    marks?.forEach(m => {
      if (m.getAttribute('data-hl-id') === highlightId) {
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
        m.classList.add('ring-2', 'ring-primary');
        setTimeout(() => m.classList.remove('ring-2', 'ring-primary'), 2000);
      }
    });
    setShowCommentPanel(false);
  }, [containerRef]);

  const tooltipHighlight = tooltipData ? highlights.find(h => h.id === tooltipData.id) : null;

  // Lock body scroll when sheet is open
  useBodyScrollLock(!!artigo);

  // Auto-scroll to first modified line when opening from novidades
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
    }, 400); // wait for animation
    return () => clearTimeout(timer);
  }, [artigo?.id, modificationInfo]);

  // Pre-load all cached AI content when artigo changes
  useEffect(() => {
    setAiContent({});
    setAiLoading({});
    setActiveTab('artigo');

    if (!artigo || !tabelaNome) return;

    // Pre-fetch all cached modes from DB at once
    const modes = ['explicacao', 'exemplo', 'termos'];
    // Hidrata do mirror local primeiro (funciona offline)
    (async () => {
      const { getLocalAiCache } = await import('@/lib/aiCacheLocal');
      const local: Record<string, string> = {};
      for (const m of modes) {
        const v = getLocalAiCache(tabelaNome, artigo.numero, m);
        if (v) local[m] = v;
      }
      if (Object.keys(local).length) setAiContent(prev => ({ ...local, ...prev }));
    })();
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    supabase
      .from('artigo_ai_cache')
      .select('tipo, conteudo')
      .eq('tabela_codigo', tabelaNome)
      .eq('numero_artigo', artigo.numero)
      .in('tipo', modes)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const cached: Record<string, string> = {};
          import('@/lib/aiCacheLocal').then(({ setLocalAiCache }) => {
            data.forEach((row: any) => {
              cached[row.tipo] = row.conteudo;
              setLocalAiCache(tabelaNome, artigo.numero, row.tipo, row.conteudo);
            });
            setAiContent(prev => ({ ...prev, ...cached }));
          });
        }
      });
  }, [artigo?.id]);

  // Helper to split AI content into accordion sections
  const splitSections = useCallback((text: string, marker: string) => {
    const parts = text.split(marker).filter(s => s.trim());
    return parts.map((part, i) => {
      const lines = part.trim().split('\n');
      const titleLine = lines.find(l => l.startsWith('## ') || l.startsWith('**'));
      const title = titleLine 
        ? titleLine.replace(/^##\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim()
        : `Seção ${i + 1}`;
      const body = lines.filter(l => l !== titleLine).join('\n').trim();
      return { title, body: body || part.trim() };
    });
  }, []);

  // Fetch AI content: check DB cache first, then generate
  useEffect(() => {
    if (activeTab === 'artigo' || !artigo) return;
    if (!isPremium) return;
    if (aiContent[activeTab] || aiLoading[activeTab]) return;
    if (modificationInfo && activeTab !== 'explicacao') return;

    const cacheKey = { tabela: tabelaNome || 'unknown', numero: artigo.numero, modo: activeTab };

    setAiLoading(prev => ({ ...prev, [activeTab]: true }));

    // Local mirror primeiro
    import('@/lib/aiCacheLocal').then(({ getLocalAiCache, setLocalAiCache }) => {
      const localVal = getLocalAiCache(cacheKey.tabela, cacheKey.numero, cacheKey.modo);
      if (localVal) {
        setAiContent(prev => ({ ...prev, [activeTab]: localVal }));
        setAiLoading(prev => ({ ...prev, [activeTab]: false }));
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setAiContent(prev => ({ ...prev, [activeTab]: 'Sem internet — este conteúdo ainda não foi gerado. Conecte-se para gerar.' }));
        setAiLoading(prev => ({ ...prev, [activeTab]: false }));
        return;
      }
      // Check DB cache first
      supabase
      .from('artigo_ai_cache')
      .select('conteudo')
      .eq('tabela_codigo', cacheKey.tabela)
      .eq('numero_artigo', cacheKey.numero)
      .eq('tipo', cacheKey.modo)
      .maybeSingle()
      .then(({ data: cached }) => {
        if (cached?.conteudo) {
          setLocalAiCache(cacheKey.tabela, cacheKey.numero, cacheKey.modo, cached.conteudo as string);
          setAiContent(prev => ({ ...prev, [activeTab]: cached.conteudo as string }));
          setAiLoading(prev => ({ ...prev, [activeTab]: false }));
          return;
        }

        // Generate with AI — mostra overlay animado
        const mode = activeTab as 'explicacao' | 'exemplo';
        setAiGeneratingMode(mode);
        setAiGeneratingStep(0);
        const stepInterval = setInterval(() => {
          setAiGeneratingStep(prev => (prev < 2 ? prev + 1 : prev));
        }, 1800);

        supabase.functions.invoke('assistente-juridica', {
          body: {
            mode: activeTab,
            artigoTexto: artigo.caput,
            artigoNumero: artigo.numero,
            leiNome: tabelaNome || '',
          },
        }).then(({ data, error }) => {
          clearInterval(stepInterval);
          if (!error && data?.reply) {
            setAiGeneratingStep(3);
            setAiContent(prev => ({ ...prev, [activeTab]: data.reply }));
            setLocalAiCache(cacheKey.tabela, cacheKey.numero, cacheKey.modo, data.reply);
            // Save to DB cache
            supabase.from('artigo_ai_cache').upsert({
              tabela_codigo: cacheKey.tabela,
              numero_artigo: cacheKey.numero,
              tipo: cacheKey.modo,
              conteudo: data.reply,
            }, { onConflict: 'tabela_codigo,numero_artigo,tipo' }).then(() => {});
          } else {
            setAiContent(prev => ({ ...prev, [activeTab]: 'Não foi possível gerar o conteúdo. Tente novamente.' }));
          }
          setAiLoading(prev => ({ ...prev, [activeTab]: false }));
          // Pequeno delay para o usuário ver o passo "Pronto"
          setTimeout(() => setAiGeneratingMode(null), 500);
        });
      });
    });
  }, [activeTab, artigo?.id]);

  // Fetch termos when the Termos sheet is opened (independent of tab selection)
  useEffect(() => {
    if (!showTermosSheet || !artigo) return;
    if (aiContent.termos || aiLoading.termos) return;
    const cacheKey = { tabela: tabelaNome || 'unknown', numero: artigo.numero };
    setAiLoading(prev => ({ ...prev, termos: true }));
    import('@/lib/aiCacheLocal').then(({ getLocalAiCache, setLocalAiCache }) => {
      const localVal = getLocalAiCache(cacheKey.tabela, cacheKey.numero, 'termos');
      if (localVal) {
        setAiContent(prev => ({ ...prev, termos: localVal }));
        setAiLoading(prev => ({ ...prev, termos: false }));
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setAiContent(prev => ({ ...prev, termos: 'Sem internet — termos ainda não gerados.' }));
        setAiLoading(prev => ({ ...prev, termos: false }));
        return;
      }
      supabase
      .from('artigo_ai_cache')
      .select('conteudo')
      .eq('tabela_codigo', cacheKey.tabela)
      .eq('numero_artigo', cacheKey.numero)
      .eq('tipo', 'termos')
      .maybeSingle()
      .then(({ data: cached }) => {
        if (cached?.conteudo) {
          setLocalAiCache(cacheKey.tabela, cacheKey.numero, 'termos', cached.conteudo as string);
          setAiContent(prev => ({ ...prev, termos: cached.conteudo as string }));
          setAiLoading(prev => ({ ...prev, termos: false }));
          return;
        }
        setAiGeneratingMode('termos');
        setAiGeneratingStep(0);
        const stepInterval = setInterval(() => {
          setAiGeneratingStep(prev => (prev < 2 ? prev + 1 : prev));
        }, 1800);
        supabase.functions.invoke('assistente-juridica', {
          body: { mode: 'termos', artigoTexto: artigo.caput, artigoNumero: artigo.numero, leiNome: tabelaNome || '' },
        }).then(({ data, error }) => {
          clearInterval(stepInterval);
          if (!error && data?.reply) {
            setAiGeneratingStep(3);
            setAiContent(prev => ({ ...prev, termos: data.reply }));
            setLocalAiCache(cacheKey.tabela, cacheKey.numero, 'termos', data.reply);
            supabase.from('artigo_ai_cache').upsert({
              tabela_codigo: cacheKey.tabela,
              numero_artigo: cacheKey.numero,
              tipo: 'termos',
              conteudo: data.reply,
            }, { onConflict: 'tabela_codigo,numero_artigo,tipo' }).then(() => {});
          } else {
            setAiContent(prev => ({ ...prev, termos: 'Não foi possível gerar os termos. Tente novamente.' }));
          }
          setAiLoading(prev => ({ ...prev, termos: false }));
          setTimeout(() => setAiGeneratingMode(null), 500);
        });
      });
    });
  }, [showTermosSheet, artigo?.id]);


  if (!artigo) return null;

  const fullText = normalizeLegalLineBreaks(artigo.caput || '');
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  let nomenJuris: string | null = null;
  let contentLines = lines;
  const structuralPattern = /^(LIVRO|PARTE|TÍTULO)\s+/i;
  contentLines = contentLines.filter(l => !structuralPattern.test(l.trim()));

  // Nomen juris only for CP (Código Penal) and CPM (Código Penal Militar)
  const isCodigoPenal = tabelaNome && /^(CP_|CPM_)/i.test(tabelaNome);
  if (isCodigoPenal && showNomenJuris && contentLines.length > 1) {
    const firstLine = contentLines[0].trim();
    const firstLineClean = firstLine.replace(/\s*\([^)]*\)\s*/g, '').trim();
    const isNomen =
      firstLineClean.length > 0 &&
      firstLineClean.length <= 50 &&
      /^[A-ZÁÀÂÃÉÃˆÊÍÃÓÔÕÚÇ]/.test(firstLineClean) &&
      !/^(Art\.|§|Parágrafo|[IVXLC]+\s*[-–.]|[a-z]\))/i.test(firstLineClean) &&
      !/[.;:!?]/.test(firstLineClean) &&
      !/\b(não|será|é|foi|são|tem|houver|aplica|considera)\b/i.test(firstLineClean);

    if (isNomen) {
      nomenJuris = firstLine;
      contentLines = contentLines.slice(1);
    }
  }

  const rawContent = contentLines.join('\n');
  const rawLines = rawContent.split('\n').filter(l => l.trim() !== '');
  // Keep revoked lines in the display even when redação is stripped
  const processedLines = rawLines.map(l => {
    if (isLineRevogado(l)) return l; // always keep revoked lines as-is
    return showRedacao ? l : stripRedacao(l);
  }).filter(l => l.trim() !== '');
  const isRevogado = processedLines.length === 0 && rawLines.length > 0;
  const displayLines = isRevogado ? rawLines : processedLines;

  const getRenderedLineText = (line: string, lineIndex: number, isFirst: boolean) => {
    const isModifiedLine = modificationInfo && modificationInfo.linhasModificadas.includes(lineIndex);
    const displayText = modificationInfo
      ? (isModifiedLine && showRedacao ? line : stripRedacao(line))
      : (showRedacao ? line : stripRedacao(line));

    if (isFirst && !isRevogado) {
      return displayText.replace(/^Art\s*\.\s*\d+[ºº]?(?:-[A-Z])?\s*[–-]?\s*/i, '');
    }
    return displayText;
  };

  const renderedLineTexts = displayLines.map((line, index) => getRenderedLineText(line, index, index === 0));
  // Mapa linha → seção (caput / inciso / parágrafo) para abrir a IA no ponto certo.
  const lineSegmentMap = buildLineSegmentMap(displayLines);
  // Seções navegáveis do conteúdo de IA em exibição no leitor de tela cheia.
  const iaFullSections: AiSection[] = iaFull
    ? parseAiSections(
        aiContent[iaFull.mode] || '',
        iaFull.mode === 'exemplo' ? '---EXEMPLO---' : '---SECAO---',
      )
    : [];
  const lineWordStartIndexes: number[] = [];
  let renderedWordCursor = 0;
  for (const text of renderedLineTexts) {
    lineWordStartIndexes.push(renderedWordCursor);
    renderedWordCursor += getWordTokens(text).length;
  }

  const renderedArticleTokens = renderedLineTexts
    .flatMap(getWordTokens)
    .map(normalizeNarracaoToken)
    .filter(Boolean);

  const duracaoAtual = narracaoDuration || narracaoAudioRef.current?.duration || 0;

  // Alinha os timings reais da narração com as palavras exibidas (1 timing por palavra).
  const alignedTimings = (() => {
    if (!narracaoWordTimings?.length || !renderedArticleTokens.length) return null;
    return alinharTimingsComTexto(renderedArticleTokens, narracaoWordTimings as any[], duracaoAtual);
  })();

  // Fallback de karaokê: sem timings utilizáveis, distribui as palavras proporcionalmente.
  const syntheticTimings = (() => {
    if (alignedTimings?.length) return null;
    const dur = duracaoAtual;
    if (!renderedArticleTokens.length || !Number.isFinite(dur) || dur <= 0) return null;

    const pesos = renderedArticleTokens.map(tok => tok.length + 1);
    const total = pesos.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    return renderedArticleTokens.map((word, i) => {
      const start = (acc / total) * dur;
      acc += pesos[i];
      const end = (acc / total) * dur;
      return { word, start, end };
    });
  })();

  const timingsAtivos = alignedTimings ?? syntheticTimings ?? null;
  const startIndexAtivo = timingsAtivos ? 0 : -1;


  // Atualiza o ref usado pelo RAF direto no render (seguro — ref não dispara re-render)
  narracaoTimingsRef.current = timingsAtivos;


  const activeRenderedWordIndex = startIndexAtivo >= 0 && activeNarracaoWordIndex >= startIndexAtivo
    ? activeNarracaoWordIndex - startIndexAtivo
    : -1;

  const commentsWithText = highlights.filter(h => h.comment && h.comment.trim().length > 0);

  const handleSheetClose = () => {
    import('@/lib/nativeHaptics').then((m) => m.haptic.selection());
    // Se a narração está tocando, transfere o áudio para o player flutuante
    // em vez de destruí-lo. Assim a pessoa continua ouvindo mesmo após fechar.
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

  return (
    <>
      <Sheet open={Boolean(artigo)} onOpenChange={(open) => { if (!open) handleSheetClose(); }}>
        <SheetContent
          ref={(node: HTMLDivElement | null) => { sheetContentRef.current = node; setSheetNode(node); }}
          side="bottom"
          className={
            isDesktop
              ? "theme-vademecum-accent z-[9999] flex min-h-0 flex-col gap-0 overflow-hidden overscroll-contain rounded-2xl border border-white/5 bg-[#0f0f0f] p-0 shadow-2xl [&>button:last-child]:hidden top-[5%] bottom-[5%] inset-x-0 mx-auto max-w-[860px] h-[90dvh] max-h-[90dvh]"
              : "theme-vademecum-accent z-[9999] flex min-h-0 flex-col gap-0 overflow-hidden overscroll-contain rounded-t-3xl border-t border-white/5 bg-[#0f0f0f] p-0 !pb-0 [&>button:last-child]:hidden top-auto bottom-0 h-[90dvh] max-h-[90dvh]"
          }
          onInteractOutside={(e) => {
            const t = e.target as HTMLElement | null;
            if (iaFull || (t && (t.closest('[data-artigo-rail]') || t.closest('[data-artigo-menu]') || t.closest('[data-artigo-ia-fullscreen]')))) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            const t = e.target as HTMLElement | null;
            if (iaFull || (t && (t.closest('[data-artigo-rail]') || t.closest('[data-artigo-menu]') || t.closest('[data-artigo-ia-fullscreen]')))) e.preventDefault();
          }}
        >

        <div className="shrink-0 flex justify-center pt-3 pb-1 bg-[#0f0f0f]">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Scrollable content area: header, tabs and article content scroll up; bottom nav stays fixed */}
        <div ref={scrollContainerRef as any} className="flex-1 overflow-y-auto min-h-0 relative overscroll-contain">

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

        <Tabs value={activeTab} onValueChange={(v) => {
          if (showAnotacoesSheet || showPerguntarSheet || showPraticarSheet) return;
          const openIA = (mode: 'explicacao' | 'exemplo') => {
            setActiveTab(mode);           // dispara a busca/cache já existente
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
        }} className="flex flex-col">

          <ArtigoTabsNavigation modificationInfo={modificationInfo} />



          <TabsContent value="artigo" className="px-5 pb-[calc(9rem+var(--sai-bottom))] pt-4 relative">
            {/* Barra de progresso da narração (sticky no topo) */}
            <NarracaoProgressBar
              narracaoPlaying={narracaoPlaying}
              handleNarrarButtonPress={handleNarrarButtonPress}
              narracaoAudioRef={narracaoAudioRef}
              narracaoProgressFillRef={narracaoProgressFillRef}
              narracaoTimeRef={narracaoTimeRef}
              narracaoTotalTimeRef={narracaoTotalTimeRef}
              narracaoActiveIdxRef={narracaoActiveIdxRef}
            />
            {/* Brasão watermark fixo */}
            <div className="sticky top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-center pointer-events-none z-0" style={{ height: 0 }}>
              <img src={brasaoImg} alt="" className="w-48 h-48 opacity-[0.06] object-contain" />
            </div>

            <div
              ref={scrollContainerRef as any}
              className=""
            >
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

              {/* Epígrafe do artigo (ex: "Anterioridade da Lei") */}
              {artigo.titulo && !/^(PARTE|LIVRO|T[IÍ]TULO|CAP[IÍ]TULO|SEÇ[AÃ]O|SUBSEÇ[AÃ]O)\b/i.test(artigo.titulo) && (
                <p className="mb-3 border-l-2 border-primary/70 pl-3 text-[13px] italic text-primary/90 font-body leading-snug">
                  {artigo.titulo}
                </p>
              )}


              <div
                ref={containerRef}
                className={`space-y-4 font-legal text-base ${highlightMode ? 'select-text cursor-text highlight-selectable' : ''}`}
                style={highlightMode ? ({
                  WebkitUserSelect: 'text',
                  userSelect: 'text',
                  WebkitTouchCallout: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  '--hl-selection': selectedColor,
                } as React.CSSProperties) : undefined}
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




            {/* Floating card: create or view highlight note + tags */}
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
              handleGerarAnotacaoIa={handleGerarAnotacaoIa}
              handleDismissComment={handleDismissComment}
              handleSaveComment={handleSaveComment}
              removeHighlight={removeHighlight}
              addTagFromDraft={addTagFromDraft}
            />


            {/* Tooltip for highlighted text with comment */}
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
                  onMouseEnter={() => { if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current); }}
                  onMouseLeave={() => setTooltipData(null)}
                >
                  <p className="text-[clamp(1rem,4.2vw,1.125rem)] text-foreground leading-[1.5]">{tooltipHighlight.comment}</p>
                  <div
                    className="absolute w-2 h-2 bg-popover border-r border-b border-border rotate-45"
                    style={{ bottom: -5, left: 16 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Magic grifo tooltip — blurred overlay + centered card */}
            <AnimatePresence>
              {magicTooltip && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[79] bg-black/60 backdrop-blur-sm"
                    onClick={() => setMagicTooltip(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className="fixed z-[80] left-4 right-4 top-1/2 -translate-y-1/2 max-w-md mx-auto max-h-[80dvh] overflow-y-auto overscroll-contain bg-popover border border-border rounded-2xl shadow-2xl px-5 py-5 sm:px-6 sm:py-6"
                  >
                    <button
                      onClick={() => setMagicTooltip(null)}
                      aria-label="Fechar comentário"
                      className="absolute top-2.5 right-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2.5 mb-3 pr-11">
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: MAGIC_COLORS[magicTooltip.grifo.cor] }}
                      />
                      <span className="text-[clamp(0.8125rem,3.4vw,0.9375rem)] font-bold text-foreground/80 uppercase tracking-wider">
                        {magicTooltip.grifo.hierarquia}
                      </span>
                    </div>
                    <p className="text-[clamp(1.0625rem,4.4vw,1.25rem)] text-foreground leading-[1.55] mb-4">
                      {magicTooltip.grifo.explicacao}
                    </p>
                    <div className="text-[clamp(0.9375rem,3.9vw,1.0625rem)] text-muted-foreground italic leading-[1.5] border-t border-border/40 pt-3">
                      "{magicTooltip.grifo.trechoExato}"
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
                      <button
                        onClick={() => {
                          handleRemoveSingleMagicHighlight(magicTooltip.grifo);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Apagar este grifo</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

          </TabsContent>


          <TabsContent value="explicacao" className="px-5 pb-[calc(8rem+var(--sai-bottom))] pt-4">
            {modificationInfo ? (
              <div className="space-y-5">
                <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4">
                  <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">O que mudou</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {(() => {
                      const parte = modificationInfo.parteModificada;
                      const tipo = modificationInfo.tipo.toLowerCase();
                      const lei = modificationInfo.leiNome;
                      if (/incluíd|acrescid/i.test(modificationInfo.tipo)) {
                        return parte === 'Artigo inteiro'
                          ? `O ${artigo.numero} foi inteiramente incluído no ordenamento jurídico pela ${lei}.`
                          : `O ${parte} do ${artigo.numero} foi incluído pela ${lei}. Na aba "Artigo", ele está destacado em roxo.`;
                      }
                      if (/alterad|redaç/i.test(modificationInfo.tipo)) {
                        return parte === 'Artigo inteiro'
                          ? `Todo o ${artigo.numero} teve sua redação alterada pela ${lei}.`
                          : `O ${parte} do ${artigo.numero} teve sua redação modificada pela ${lei}. Na aba "Artigo", o trecho está destacado em roxo.`;
                      }
                      if (/revogad/i.test(modificationInfo.tipo)) {
                        return `Este dispositivo foi revogado pela ${lei} e não produz mais efeitos jurídicos.`;
                      }
                      return `O ${parte} do ${artigo.numero} foi ${tipo} pela ${lei}.`;
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400">{modificationInfo.tipo}</span>
                  <span className="text-xs text-foreground/60 font-medium">{modificationInfo.parteModificada}</span>
                </div>
                <div className="rounded-2xl bg-card border border-border p-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Lei modificadora</h4>
                  <p className="text-sm font-semibold text-foreground mb-1">{modificationInfo.leiNome}</p>
                  <p className="text-xs text-muted-foreground italic mb-3">{modificationInfo.referencia}</p>
                  {(() => {
                    const leiMatch = modificationInfo.leiNome.match(/(?:Lei(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional)\s+n[ºº]?\s*([\d.]+)/i);
                    if (leiMatch) {
                      const num = leiMatch[1].replace(/\./g, '');
                      const isLC = /complementar/i.test(modificationInfo.leiNome);
                      const searchUrl = isLC
                        ? `https://www.planalto.gov.br/ccivil_03/leis/lcp/Lcp${num}.htm`
                        : `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L${num}.htm`;
                      return (
                        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver texto oficial no Planalto
                        </a>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ) : !isPremium ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-500/20 to-primary/20 p-2 border border-amber-500/30 flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
                  <img src={horusOwl} alt="Horus" className="w-12 h-12 object-contain" />
                </div>
                <h4 className="font-display text-lg font-bold text-foreground mb-1.5">
                  Explicação com IA é Exclusivo Prime
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mb-4 leading-relaxed">
                  Destrinche dispositivos complexos com explicações didáticas, linguagem clara e doutrina aplicada geradas pela nossa IA jurídica.
                </p>
                <button
                  onClick={() => openPremiumGate('explicacao')}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Crown className="w-4 h-4 fill-current" /> Começar 3 dias grátis
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {aiLoading.explicacao ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-body">Gerando explicação com IA...</p>
                  </div>
                ) : aiContent.explicacao ? (
                  (() => {
                    const sections = splitSections(aiContent.explicacao, '---SECAO---');
                    if (sections.length <= 1) {
                      return (
                        <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_strong]:text-foreground" style={{ fontSize: `${fontSize}px` }}>
                          <ReactMarkdown>{aiContent.explicacao}</ReactMarkdown>
                        </div>
                      );
                    }
                    return (
                      <Accordion type="multiple" className="space-y-2">
                        {sections.map((sec, i) => {
                          const borderColors = ['border-l-red-500/70', 'border-l-amber-500/70', 'border-l-emerald-500/70', 'border-l-sky-500/70', 'border-l-violet-500/70', 'border-l-pink-500/70', 'border-l-orange-500/70'];
                          const strongColors = ['[&_strong]:text-red-400', '[&_strong]:text-amber-400', '[&_strong]:text-emerald-400', '[&_strong]:text-sky-400', '[&_strong]:text-violet-400', '[&_strong]:text-pink-400', '[&_strong]:text-orange-400'];
                          return (
                          <AccordionItem key={i} value={`exp-${i}`} className={`border border-border rounded-xl overflow-hidden bg-secondary/30 border-l-4 ${borderColors[i % borderColors.length]}`}>
                            <AccordionTrigger className="px-4 py-4 text-base font-semibold text-foreground text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                              {sec.title}
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className={`prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 ${strongColors[i % strongColors.length]}`} style={{ fontSize: `${fontSize}px` }}>
                                <ReactMarkdown>{sec.body}</ReactMarkdown>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          );
                        })}
                      </Accordion>
                    );
                  })()
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">Clique para gerar a explicação.</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exemplo" className="px-5 pb-[calc(8rem+var(--sai-bottom))] pt-4">
            {!isPremium ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-500/20 to-primary/20 p-2 border border-amber-500/30 flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
                  <img src={horusOwl} alt="Horus" className="w-12 h-12 object-contain" />
                </div>
                <h4 className="font-display text-lg font-bold text-foreground mb-1.5">
                  Exemplos Práticos são Exclusivos Prime
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mb-4 leading-relaxed">
                  Veja a norma aplicada em casos concretos do dia a dia e situações reais cobradas nas provas da OAB e concursos públicos.
                </p>
                <button
                  onClick={() => openPremiumGate('exemplo')}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Crown className="w-4 h-4 fill-current" /> Começar 3 dias grátis
                </button>
              </div>
            ) : aiLoading.exemplo ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-body">Gerando exemplos práticos com IA...</p>
              </div>
            ) : aiContent.exemplo ? (
              (() => {
                const sections = splitSections(aiContent.exemplo, '---EXEMPLO---');
                if (sections.length <= 1) {
                  return (
                    <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_strong]:text-foreground" style={{ fontSize: `${fontSize}px` }}>
                      <ReactMarkdown>{aiContent.exemplo}</ReactMarkdown>
                    </div>
                  );
                }
                return (
                  <Accordion type="single" collapsible className="space-y-2">
                    {sections.map((sec, i) => {
                      const borderColors = ['border-l-emerald-500/70', 'border-l-sky-500/70', 'border-l-amber-500/70', 'border-l-violet-500/70'];
                      const strongColors = ['[&_strong]:text-emerald-400', '[&_strong]:text-sky-400', '[&_strong]:text-amber-400', '[&_strong]:text-violet-400'];
                      return (
                      <AccordionItem key={i} value={`ex-${i}`} className={`border border-border rounded-xl overflow-hidden bg-secondary/30 border-l-4 ${borderColors[i % borderColors.length]}`}>
                        <AccordionTrigger className="px-4 py-4 text-base font-semibold text-foreground text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                          {sec.title}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className={`prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 ${strongColors[i % strongColors.length]}`} style={{ fontSize: `${fontSize}px` }}>
                            <ReactMarkdown>{sec.body}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      );
                    })}
                  </Accordion>
                );
              })()
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Clique para gerar exemplos.</p>
            )}
          </TabsContent>

          <ArtigoTabHistorico caput={artigo?.caput} />
        </Tabs>


        </div>

        {/* Bottom-up action sheet for Funções / Grifar.
            IMPORTANTE: o createPortal fica FORA do AnimatePresence — um portal não é
            um elemento React válido, então o AnimatePresence o descartaria e o menu
            nunca apareceria (bug do menu de rodapé no mobile). */}
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

        {/* Bottom nav bar — only visible on "artigo" tab; fixed as a flex item below the scrollable area */}
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

        {/* Floating "Fechar grifo" button + rodapé de ações when highlight mode is active */}
        <AnimatePresence>
          {(highlightMode || voiceGrifoActive) && (activeTab ?? 'artigo') === 'artigo' && (
            <>
              {createPortal(
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-0 left-0 right-0 h-20 z-[10000] bg-gradient-to-b from-black/40 to-transparent backdrop-blur-[1px] pointer-events-none"
                  aria-hidden="true"
                />,
                document.body
              )}
              {createPortal(
                <div className="fixed top-[calc(0.75rem+var(--sai-top))] left-0 right-0 z-[10001] flex justify-center pointer-events-none">
                  <motion.button
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                    onClick={() => {
                      if (voiceGrifoActive) {
                        try { voicePanelRef.current?.stop(); } catch {}
                        setVoiceGrifoActive(false);
                      } else {
                        toggleMode();
                      }
                    }}
                    className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 font-semibold text-sm hover:bg-primary/90 transition-colors"
                    aria-label="Fechar grifo"
                  >
                    <X className="w-4 h-4" />
                    Fechar grifo
                  </motion.button>
                </div>,
                document.body
              )}
              {null}

            </>
          )}

        </AnimatePresence>

        {/* GrifoVoicePanel usa ref imperativo — mantido eager */}
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

        {/* Praticar Modal */}
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

        {/* Termos jurídicos Sheet */}
        <ArtigoTermosSheet
          open={showTermosSheet}
          onOpenChange={setShowTermosSheet}
          loading={aiLoading.termos}
          content={aiContent.termos}
          fontSize={fontSize}
        />
        </SheetContent>
      </Sheet>

      {/* Overlays e sheets secundários lazy-loaded */}
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

      {/* Desktop: Questões e Jurisprudência como painel lateral */}
      {isDesktop && artigo && (
        <>
          <ArtigoSidePanel open={showQuestoesPanel} onClose={() => setShowQuestoesPanel(false)} widthClass="w-[min(40rem,94vw)]">
            <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}>
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

          <ArtigoSidePanel open={showJurisPanel} onClose={() => setShowJurisPanel(false)} widthClass="w-[min(40rem,94vw)]">
            <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}>
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

      {/* Desktop: barras laterais com as funções (principais à esquerda) */}
      {isDesktop && artigo && (activeTab ?? 'artigo') === 'artigo' && createPortal(
        (() => {
          type RailItem = { id?: string; icon: any; label: string; color?: string; active?: boolean; onClick: (e: any) => void };
          const principais: RailItem[] = [
            { icon: Volume2, label: 'Narração', color: '#22C55E', onClick: (e) => handleNarrarButtonPress(e) },
            { icon: Feather, label: 'Grifar', color: '#DC2626', active: activeActionMenu === 'grifar', onClick: () => {
              if (!isPremium) {
                openPremiumGate('grifo');
                return;
              }
              setActiveActionMenu(activeActionMenu === 'grifar' ? null : 'grifar');
            } },
            { icon: StickyNote, label: 'Anotações', color: '#38BDF8', onClick: () => gateFeature('anotacoes', 'anotacoes', 'Anotações', () => setShowAnotacoesSheet(true)) },
            { icon: Target, label: 'Praticar', color: '#A855F7', onClick: () => gateFeature('praticar', 'praticar', 'Praticar', () => setShowPraticarSheet(true)) },
          ];
          let secundarias: RailItem[] = [
            { icon: LayoutGrid, label: 'Funções', active: activeActionMenu === 'funcoes', onClick: () => setActiveActionMenu(activeActionMenu === 'funcoes' ? null : 'funcoes') },
            { id: 'juris', icon: Scale, label: 'Jurisprudência', color: '#D4AF37', onClick: () => {
              if (!requireOnline('Jurisprudência')) return;
              if (!tabelaNome || !artigo?.numero) { toast.error('Artigo não identificado'); return; }
              gateFeature('jurisprudencia', 'jurisprudencia', 'Jurisprudência', () => {
                if (isDesktop) setShowJurisPanel(true);
                else navigate(`/jurisprudencia/${tabelaNome}/${encodeURIComponent(String(artigo.numero))}`);
              });
            } },
            { icon: Play, label: 'Videoaulas', color: 'hsl(348 78% 38%)', onClick: () => { if (!requireOnline('Videoaulas')) return; gateFeature('videoaula', 'videoaula', 'Videoaulas', () => setShowVideoaulasListSheet(true)); } },
            { icon: BookOpen, label: 'Termos', color: '#F97316', onClick: () => { if (!requireOnline('Termos jurídicos')) return; gateFeature('termos', 'termos', 'Termos jurídicos', () => setShowTermosSheet(true)); } },
            { icon: MessageCircle, label: 'Perguntar à IA', color: '#A855F7', onClick: () => { if (!requireOnline('Perguntar à IA')) return; gateFeature('perguntar', 'perguntar', 'Perguntar à IA', () => setShowPerguntarSheet(true)); } },
            ...(tabelaNome ? [{ icon: Network, label: 'Grafo', color: '#10B981', onClick: () => gateFeature('grafo', 'grafo', 'Grafo de conexões', () => setShowGrafo(true)) }] : []),
            { icon: Copy, label: 'Copiar', color: '#8B5CF6', onClick: () => handleCopy() },
            { icon: Bell, label: 'Lembretes', color: '#DC2626', onClick: () => { import('@/components/vademecum/sheets/LembretesArtigoSheet'); gateFeature('lembretes', 'lembretes', 'Lembretes', () => setShowLembretesLocal(true)); } },
            { icon: Download, label: 'Baixar', color: '#0EA5E9', onClick: () => gateFeature('baixar', 'baixar', 'Baixar artigo', () => setShowBaixarSheet(true)) },
            { icon: Share2, label: 'Compartilhar', color: '#06B6D4', onClick: () => gateFeature('default', 'default', 'Compartilhar', () => setShowSharePanel(p => !p)) },
            { icon: Type, label: 'Fonte', onClick: () => { setShowFontControls(v => !v); setShowCommentPanel(false); } },
          ];

          if (tabelaNome === 'LEIS_CF') {
            secundarias = secundarias.filter(item => item.id !== 'juris');
          }

          const anyPanelOpen = showAnotacoesSheet || showPerguntarSheet || showPraticarSheet || showQuestoesPanel
            || showJurisPanel || showVideoaulasListSheet || showVideoaulaSheet || showBaixarSheet
            || showLembretesLocal || showTermosSheet || showGrafo || showGrifoFoto;
          const Rail = ({ items, side, title }: { items: RailItem[]; side: 'left' | 'right'; title: string }) => (
            <div
              data-artigo-rail
              aria-hidden={false}
              style={{ pointerEvents: anyPanelOpen ? 'none' : 'auto' }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`fixed ${side === 'left' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 z-[10000] w-[188px] ${anyPanelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity flex flex-col gap-0.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border p-2 shadow-xl shadow-black/40 max-h-[88vh] overflow-y-auto`}
            >
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={item.onClick}
                    aria-label={item.label}
                    style={{ pointerEvents: 'auto' }}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left cursor-pointer transition-colors ${item.active ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary'}`}
                  >

                    <Icon className="w-[18px] h-[18px] shrink-0" style={!item.active && item.color ? { color: item.color } : undefined} />
                    <span className="font-body text-[13px] font-medium truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
          return (
            <>
              <Rail items={principais} side="left" title="Principais" />
              <Rail items={secundarias} side="right" title="Mais funções" />
            </>
          );
        })(),
        document.body
      )}

      {/* Desktop: pílula flutuante Narrar / Grifar ao selecionar trecho */}
      {isDesktop && artigo && selectionPill && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[10002] -translate-x-1/2 -translate-y-full"
          style={{ left: selectionPill.x, top: selectionPill.y - 8 }}
        >
          <div className="flex items-center gap-1 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl shadow-black/40 px-1.5 py-1">
            <button
              onClick={(e) => { handleNarrarButtonPress(e as any); }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Narrar</span>
            </button>
            <span className="w-px h-5 bg-border" />
            <button
              onClick={() => setActiveActionMenu('grifar')}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Feather className="w-4 h-4" />
              <span>Grifar</span>
            </button>
          </div>
        </motion.div>,
        document.body
      )}

      {/* Leitor em tela cheia da Explicação / Exemplo */}
      <ArtigoIAFullscreen
        open={Boolean(iaFull && artigo)}
        mode={iaFull?.mode || 'explicacao'}
        artigoNumero={artigo ? (/^\d/.test((artigo.numero || '').trim()) ? `Art. ${artigo.numero}` : artigo.numero) : ''}
        leiNome={LEIS_CATALOG.find(l => l.tabela_nome === tabelaNome)?.nome || tabelaNome}
        sections={iaFullSections}
        loading={iaFull ? Boolean(aiLoading[iaFull.mode]) : false}
        initialSectionId={iaFull?.sectionId ?? null}
        fontSize={fontSize}
        portalContainer={sheetNode}
        onClose={() => { setIaFull(null); setActiveTab('artigo'); }}
      />
      
      <Suspense fallback={null}>
      </Suspense>

      </>

  );
};

export default ArtigoBottomSheet;
