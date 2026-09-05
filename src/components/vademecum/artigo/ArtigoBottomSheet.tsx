import { cloneElement, isValidElement, useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Star, Heart, Highlighter, Copy, Plus, Minus, Type, MessageSquare, ChevronUp, ChevronDown, ChevronRight, ExternalLink, Volume2, Pause, Target, StickyNote, MessageCircle, Loader2, Share2, Network, BookOpen, Layers, Sparkles, GraduationCap, Play, Camera, Feather, History, LayoutGrid, Mic, Square, Bell, Scale, Download, Trash2, Box } from 'lucide-react';
const LembretesArtigoSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/LembretesArtigoSheet'));
const QuizView = lazyWithRetry(() => import('@/components/estudar/QuizView'));
const JurisprudenciaArtigoView = lazyWithRetry(() => import('@/pages/JurisprudenciaArtigo'));
const BaixarArtigoSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/BaixarArtigoSheet'));
// Sheets/overlays pesados são carregados sob demanda: o chunk só desce
// quando o usuário abre o painel. Reduz o bundle inicial que o
// ArtigoBottomSheet arrasta para toda navegação do app.
const GrifoFotoSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/GrifoFotoSheet'));
const AnotacoesSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/AnotacoesSheet'));
import ArtigoSidePanel from '@/components/vademecum/artigo/ArtigoSidePanel';
const PerguntarSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/PerguntarSheet'));
const GrafoOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/GrafoOverlay'));
const GrifoEraseSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/GrifoEraseSheet'));
const GrifoVoiceSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/GrifoVoiceSheet'));
import type { VoicePassage } from '@/components/vademecum/sheets/GrifoVoiceSheet';
import GrifoVoicePanel, { type GrifoVoicePanelHandle, type VoicePhase } from '@/components/vademecum/grifos_ocr/GrifoVoicePanel';
const KaraokeOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/KaraokeOverlay'));
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import HighlightColorBar from '@/components/vademecum/grifos_ocr/HighlightColorBar';
const GeracaoAnimacaoOverlay = lazyWithRetry(() =>
  import('@/components/vademecum/overlays/GeracaoAnimacaoOverlay').then((m) => ({ default: m.GeracaoAnimacaoOverlay })),
);
import { supabase } from '@/integrations/supabase/client';
import { buildPlanaltoArticleUrl } from '@/services/legislacaoService';
import ShareButtons from '@/components/vademecum/navigation/ShareButtons';
const VideoaulaSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/VideoaulaSheet'));
const VideoaulasListSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/VideoaulasListSheet'));
import type { VideoaulaItem } from '@/components/vademecum/sheets/VideoaulasListSheet';
import { LEIS_CATALOG } from '@/data/leisCatalog';

import { useSubscription } from '@/hooks/useSubscription';
import PremiumGate, { type PremiumFeatureKey } from '@/components/PremiumGate';
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

  const renderLine = (line: string, lineIndex: number, isFirst: boolean) => {
    const classified = classifyLine(line);
    const lineHighlights = getLineHighlights(lineIndex);
    const lineIsRevogado = isLineRevogado(line);

    // When opened from novidades, only show the specific modification reference on modified lines
    // and strip ALL references from non-modified lines
    const isModifiedLine = modificationInfo && modificationInfo.linhasModificadas.includes(lineIndex);
    const displayText = modificationInfo
      ? (isModifiedLine && showRedacao ? line : stripRedacao(line))
      : (showRedacao ? line : stripRedacao(line));

    // If this specific line is revoked (inciso/paragraph with only "(Revogado...)"), show it styled
    if (lineIsRevogado && !isRevogado) {
      const revogadoDisplay = showRedacao ? line : line;
      return (
        <p key={lineIndex} data-line-index={lineIndex} className={`italic leading-[1.8] ${classified.type === 'inciso' ? 'pl-4 border-l-2 border-purple-400/30' : classified.type === 'alinea' ? 'pl-8' : classified.type === 'paragrafo' ? 'mt-2' : ''}`} style={{ fontSize: `${Math.max(fontSize - 1, 10)}px` }}>
          <span className="bg-purple-500/20 text-purple-300 rounded px-1 py-0.5">{revogadoDisplay}</span>
        </p>
      );
    }

    let baseNodes: React.ReactNode[];
    let offsetShift = 0;
    if (isFirst && !isRevogado) {
      // Remove the article number prefix from the first line since the header already shows it
      const cleanedText = displayText.replace(/^Art\s*\.\s*\d+[ºº]?(?:-[A-Z])?\s*[–-]?\s*/i, '');
      offsetShift = displayText.length - cleanedText.length;
      baseNodes = highlightTermos(cleanedText, modificationInfo ? isModifiedLine && showRedacao : showRedacao);
    } else {
      baseNodes = highlightTermos(displayText, modificationInfo ? isModifiedLine && showRedacao : showRedacao);
    }

    // Adjust highlight offsets to match rendered (prefix-stripped) text.
    // Discard any highlight that falls entirely inside the stripped prefix.
    const adjustedHighlights = offsetShift > 0
      ? lineHighlights
          .map(h => ({
            ...h,
            startOffset: Math.max(0, h.startOffset - offsetShift),
            endOffset: h.endOffset - offsetShift,
          }))
          .filter(h => h.endOffset > 0 && h.endOffset > h.startOffset)
      : lineHighlights;

    let finalNodes = applyHighlightsToText(baseNodes, adjustedHighlights, removeHighlight, highlightMode, handleHoverHighlight, handleTapHighlight);


    // Apply magic highlights on top — works on the full line text, not individual nodes
    if (magicMode && magicHighlights.length > 0) {
      // Extract all text content from finalNodes to build a flat string
      const extractText = (nodes: React.ReactNode[]): string => {
        return nodes.map(n => {
          if (typeof n === 'string') return n;
          if (n && typeof n === 'object' && 'props' in (n as any)) {
            const props = (n as any).props;
            if (typeof props?.children === 'string') return props.children;
            if (Array.isArray(props?.children)) return extractText(props.children);
          }
          return '';
        }).join('');
      };
      
      const fullLineText = extractText(finalNodes);
      
      // Find magic grifo matches in the full line text
      const magicMatches: { start: number; end: number; grifo: typeof magicHighlights[0] }[] = [];
      for (const grifo of magicHighlights) {
        const idx = fullLineText.indexOf(grifo.trechoExato);
        if (idx !== -1) {
          magicMatches.push({ start: idx, end: idx + grifo.trechoExato.length, grifo });
        }
      }
      
      if (magicMatches.length > 0) {
        magicMatches.sort((a, b) => a.start - b.start);
        // Remove overlaps
        const filtered: typeof magicMatches = [];
        for (const m of magicMatches) {
          if (filtered.length === 0 || m.start >= filtered[filtered.length - 1].end) {
            filtered.push(m);
          }
        }
        
        // Rebuild nodes: walk through finalNodes tracking character position
        const newNodes: React.ReactNode[] = [];
        let charPos = 0;
        
        const wrapWithMagic = (text: string, offsetInLine: number, nodeKey: string): React.ReactNode[] => {
          const parts: React.ReactNode[] = [];
          let localPos = 0;
          for (const m of filtered) {
            const relStart = m.start - offsetInLine;
            const relEnd = m.end - offsetInLine;
            if (relEnd <= 0 || relStart >= text.length) continue;
            const clampStart = Math.max(0, relStart);
            const clampEnd = Math.min(text.length, relEnd);
            if (clampStart > localPos) parts.push(text.slice(localPos, clampStart));
            parts.push(
              <mark
                key={`magic-${nodeKey}-${m.start}`}
                style={{ backgroundColor: MAGIC_COLORS[m.grifo.cor] || MAGIC_COLORS.amarelo, color: 'white', borderRadius: '3px', padding: '1px 3px', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (highlightMode) {
                    handleRemoveSingleMagicHighlight(m.grifo);
                  } else {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setMagicTooltip(prev => prev?.grifo.trechoExato === m.grifo.trechoExato ? null : { grifo: m.grifo, rect });
                  }
                }}
              >
                {text.slice(clampStart, clampEnd)}
              </mark>
            );
            localPos = clampEnd;
          }
          if (localPos < text.length) parts.push(text.slice(localPos));
          return parts.length > 0 ? parts : [text];
        };
        
        const processNode = (node: React.ReactNode, idx: number): React.ReactNode => {
          if (typeof node === 'string') {
            const result = wrapWithMagic(node, charPos, `s${idx}`);
            charPos += node.length;
            return result.length === 1 ? result[0] : result;
          }
          if (node && typeof node === 'object' && 'props' in (node as any)) {
            const el = node as React.ReactElement;
            const children = el.props?.children;
            if (typeof children === 'string') {
              const result = wrapWithMagic(children, charPos, `e${idx}`);
              charPos += children.length;
              if (result.length === 1 && typeof result[0] === 'string') return node; // unchanged
              const { children: _, ...restProps } = el.props;
              return <el.type {...restProps} key={el.key || `mn${idx}`}>{result}</el.type>;
            }
            if (Array.isArray(children)) {
              const newChildren = children.map((c: React.ReactNode, ci: number) => processNode(c, idx * 100 + ci));
              const { children: _, ...restProps } = el.props;
              return <el.type {...restProps} key={el.key || `mn${idx}`}>{newChildren}</el.type>;
            }
          }
          return node;
        };
        
        finalNodes = finalNodes.map((n, i) => processNode(n, i)).flat();
      }
    }

    if (narracaoPlaying && activeRenderedWordIndex >= 0) {
      let wordIndex = lineWordStartIndexes[lineIndex] || 0;
      const highlightTextNode = (text: string, keyPrefix: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        const matches = Array.from(text.matchAll(/[\p{L}\p{N}]+(?:[-–][\p{L}\p{N}]+)*/gu));

        matches.forEach((match, matchIndex) => {
          const start = match.index ?? 0;
          const end = start + match[0].length;
          const currentWordIndex = wordIndex++;
          if (currentWordIndex !== activeRenderedWordIndex) return;

          if (start > lastIndex) parts.push(text.slice(lastIndex, start));
          parts.push(
            <motion.mark
              key={`narracao-${keyPrefix}-${matchIndex}`}
              initial={{ backgroundSize: '0% 108%' }}
              animate={{ backgroundSize: '100% 108%' }}
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              className="rounded-[4px] bg-transparent text-inherit"
              style={{
                backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.62), hsl(var(--primary) / 0.62))',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left 50%',
                padding: '0 1px',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              }}
            >
              {match[0]}
            </motion.mark>
          );
          lastIndex = end;
        });

        if (lastIndex < text.length) parts.push(text.slice(lastIndex));
        return parts.length ? parts : [text];
      };

      const processNarracaoNode = (node: React.ReactNode, keyPrefix: string): React.ReactNode => {
        if (typeof node === 'string') {
          const parts = highlightTextNode(node, keyPrefix);
          return parts.length === 1 ? parts[0] : parts;
        }
        if (isValidElement(node)) {
          const children = (node.props as any)?.children;
          if (typeof children === 'string') {
            const parts = highlightTextNode(children, keyPrefix);
            return cloneElement(node as React.ReactElement<any>, { key: node.key || keyPrefix }, parts.length === 1 ? parts[0] : parts);
          }
          if (Array.isArray(children)) {
            return cloneElement(
              node as React.ReactElement<any>,
              { key: node.key || keyPrefix },
              children.map((child, index) => processNarracaoNode(child, `${keyPrefix}-${index}`)),
            );
          }
        }
        return node;
      };

      finalNodes = finalNodes.map((node, index) => processNarracaoNode(node, `l${lineIndex}-${index}`)).flat();
    }

    if (isRevogado) {
      return (
        <p key={lineIndex} data-line-index={lineIndex} className="leading-[1.8]" style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
          <span className="bg-purple-500/20 text-purple-300 rounded px-1 py-0.5">{line}</span>
        </p>
      );
    }

    const extra =
      classified.type === 'inciso' ? 'pl-4 border-l-2 border-primary/30' :
      classified.type === 'alinea' ? 'pl-8' :
      classified.type === 'paragrafo' ? 'mt-2' : '';

    const highlightBg = isModifiedLine
      ? 'bg-violet-500/20 border-l-3 border-violet-400 pl-3 rounded-r-lg'
      : !modificationInfo && showRedacao && /\((?:Redação|Incluído|Acrescido|Alterado|Revogado|Vetado|Vigência)[^)]*\)/i.test(line)
        ? 'bg-primary/5 border-l-2 border-primary/40 pl-2 rounded-r'
        : '';

    const artLabel = (() => {
      const num = (artigo?.numero || '').trim();
      if (/^\d/.test(num)) return `Art. ${num}`;
      return num;
    })();

    return (
      <p
        key={lineIndex}
        data-line-index={lineIndex}
        data-segment-id={lineSegmentMap[lineIndex] || 'caput'}
        onClick={() => {
          // Memoriza o trecho tocado para abrir Explicação/Exemplo já nele.
          if (!highlightMode) setFocusedSegment(lineSegmentMap[lineIndex] || 'caput');
        }}
        className={`text-foreground leading-[1.8] ${extra} ${highlightBg} ${!highlightMode && focusedSegment && focusedSegment === (lineSegmentMap[lineIndex] || 'caput') ? 'rounded-md ring-1 ring-primary/25' : ''}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {isFirst && !isRevogado && artLabel && (
          <>
            <span className="font-bold text-primary">{artLabel}</span>
            <span className="text-foreground/60"> — </span>
          </>
        )}
        {finalNodes}
      </p>
    );
  };


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

        {/* Top bar: heart/eye (left) + online count + close (right) */}
        <div className="px-4 pt-1 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!highlightMode && (
              <>
                <motion.button
                  onClick={() => {
                    if (!isPremium) {
                      openPremiumGate('favorito');
                      return;
                    }
                    import('@/lib/appEvents').then(({ appEvents }) =>
                      appEvents.favoritarArtigo({ tabela: tabelaNome, numero: artigo.numero, on: !isFavorito })
                    ).catch(() => {});
                    onToggleFavorito?.();
                  }}
                  whileTap={{ scale: 0.85 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isFavorito ? 'bg-rose-500/15' : 'hover:bg-secondary active:bg-secondary'}`}
                  title={isFavorito ? 'Remover favorito' : 'Favoritar'}
                  aria-label={isFavorito ? 'Remover favorito' : 'Favoritar'}
                >
                  <motion.span
                    key={isFavorito ? 'on' : 'off'}
                    initial={{ scale: isFavorito ? 0.6 : 1 }}
                    animate={{ scale: isFavorito ? [0.6, 1.35, 1] : 1 }}
                    transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                    className="inline-flex"
                  >
                    <Heart
                      className={`w-6 h-6 transition-colors ${isFavorito ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.55)]' : 'text-muted-foreground'}`}
                      strokeWidth={2}
                    />
                  </motion.span>
                </motion.button>
                <motion.button
                  onClick={() => setShowRedacao(!showRedacao)}
                  whileTap={{ scale: 0.9 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${showRedacao ? 'bg-primary/20' : 'hover:bg-secondary active:bg-secondary'}`}
                  title={showRedacao ? 'Ocultar redações' : 'Mostrar redações'}
                  aria-label={showRedacao ? 'Ocultar redações' : 'Mostrar redações'}
                >
                  {showRedacao
                    ? <Eye className="w-6 h-6 text-primary" />
                    : <EyeOff className="w-6 h-6 text-muted-foreground" />
                  }
                </motion.button>
                <motion.button
                  onClick={() => setShowFontControls(v => !v)}
                  whileTap={{ scale: 0.9 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${showFontControls ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-secondary active:bg-secondary text-muted-foreground'}`}
                  title="Tamanho da fonte"
                  aria-label="Tamanho da fonte"
                >
                  <Type className="w-5 h-5" />
                </motion.button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onlineCount > 1 && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount}
              </span>
            )}
            {!highlightMode && (
              <button onClick={handleSheetClose} className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center" aria-label="Fechar">
                <X className="w-5 h-5 text-primary-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Painel expansível de ajuste de tamanho de fonte */}
        <AnimatePresence>
          {showFontControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-4 pb-2"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-secondary/80 border border-border backdrop-blur-md">
                <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-primary" /> Tamanho do texto
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize(prev => Math.max(prev - 1, 12))}
                    className="w-8 h-8 rounded-full bg-card hover:bg-card/80 border border-border flex items-center justify-center text-foreground active:scale-95 transition"
                    aria-label="Diminuir fonte"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-foreground min-w-[36px] text-center">
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => setFontSize(prev => Math.min(prev + 1, 26))}
                    className="w-8 h-8 rounded-full bg-card hover:bg-card/80 border border-border flex items-center justify-center text-foreground active:scale-95 transition"
                    aria-label="Aumentar fonte"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breadcrumb: PARTE > TÍTULO / descrição */}
        {(breadcrumb?.parte || breadcrumb?.titulo) && (
          <div className="px-5 pb-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {breadcrumb?.parte && <span>{breadcrumb.parte}</span>}
              {breadcrumb?.parte && breadcrumb?.titulo && <ChevronRight className="w-3 h-3" />}
              {breadcrumb?.titulo && <span>{breadcrumb.titulo}</span>}
            </div>
            {breadcrumb?.tituloDesc && (
              <p className="text-[11px] uppercase tracking-wide text-foreground/70 font-body leading-snug mt-0.5">
                {breadcrumb.tituloDesc}
              </p>
            )}
          </div>
        )}

        {/* Big Art. Nº + Ver no Planalto */}
        <div className="px-5 pt-1 pb-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-3xl font-bold text-foreground">
            {/^\d/.test(artigo.numero) ? `Art. ${artigo.numero}` : artigo.numero}
          </h3>
          {planaltoUrl && !highlightMode && (
            <a
              href={planaltoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full bg-neutral-900/85 border border-white/10 shadow-lg shadow-black/40 text-white/90 hover:text-white hover:bg-neutral-800 active:scale-95 transition shrink-0"
              aria-label="Ver no Planalto"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-[13px] font-medium whitespace-nowrap">Ver no Planalto</span>
            </a>
          )}
        </div>

        {/* Share panel */}
        <AnimatePresence>
          {showSharePanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-2 overflow-hidden"
            >
              <ShareButtons
                artigoNumero={artigo.numero}
                artigoTexto={artigo.caput}
                leiNome={tabelaNome}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Título (fallback if no breadcrumb prop) */}
        {!breadcrumb && artigo.titulo && (() => {
          const parts = artigo.titulo.match(/^(T[IÍ]TULO\s+[IVXLC\d]+)\s*[-–]?\s*(.*)/i);
          if (parts) {
            return (
              <div className="px-5 pb-1">
                <p className="text-[11px] text-foreground/70 font-body uppercase tracking-wide">{parts[1]}</p>
                <p className="text-[11px] text-foreground font-body leading-snug">{parts[2]}</p>
              </div>
            );
          }
          return (
            <div className="px-5 pb-1">
              <p className="text-[11px] text-foreground font-body leading-snug">{artigo.titulo}</p>
            </div>
          );
        })()}

        {/* Capítulo (fallback if no breadcrumb prop) */}
        {!breadcrumb && artigo.capitulo && (() => {
          const parts = artigo.capitulo.match(/^(CAP[IÍ]TULO\s+[IVXLC\d]+)\s*[-–]?\s*(.*)/i);
          if (parts) {
            return (
              <div className="px-5 pb-2">
                <p className="text-[11px] text-foreground/70 font-body uppercase tracking-wide">{parts[1]}</p>
                <p className="text-[11px] text-foreground font-body leading-snug">{parts[2]}</p>
              </div>
            );
          }
          return (
            <div className="px-5 pb-2">
              <p className="text-[11px] text-foreground font-body leading-snug">{artigo.capitulo}</p>
            </div>
          );
        })()}

        <AnimatePresence>
          {(highlightMode || voiceGrifoActive) && (
            <HighlightColorBar
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              onClearAll={clearAll}
            />
          )}
        </AnimatePresence>

        {/* Magic Highlights Legend */}
        <AnimatePresence>
          {magicMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-2 overflow-hidden"
            >
              <div className="flex items-center gap-3 flex-wrap py-1.5">
                {(() => {
                  const LABELS: Record<string, string> = {
                    amarelo: 'Chave',
                    verde: 'Exceção',
                    azul: 'Efeito',
                    rosa: 'Termo',
                    laranja: 'Pegadinha',
                  };
                  const ORDER = ['amarelo', 'verde', 'azul', 'rosa', 'laranja'];
                  const present = new Set(magicHighlights.map((g) => g.cor));
                  return ORDER.filter((c) => present.has(c as any)).map((cor) => (
                    <span key={cor} className="flex items-center gap-1 text-[10px] text-foreground/70">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: MAGIC_COLORS[cor], boxShadow: `0 0 0 1px ${MAGIC_COLORS[cor]}` }}
                      />
                      {LABELS[cor]}
                    </span>
                  ));
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

          {modificationInfo ? (
            <TabsList className="mx-5 bg-secondary/60 rounded-2xl h-11 grid grid-cols-2 w-auto p-1">
              <TabsTrigger value="artigo" className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Artigo</TabsTrigger>
              <TabsTrigger value="explicacao" className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Explicação</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="mx-5 bg-secondary/60 rounded-2xl h-11 grid grid-cols-4 w-auto p-1">
              <TabsTrigger value="artigo" className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Artigo</TabsTrigger>
              <TabsTrigger value="explicacao" className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Explicação</TabsTrigger>
              <TabsTrigger value="exemplo" className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Exemplo</TabsTrigger>
              <TabsTrigger value="historico" className="rounded-xl text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">Histórico</TabsTrigger>
            </TabsList>

          )}


          <TabsContent value="artigo" className="px-5 pb-[calc(9rem+var(--sai-bottom))] pt-4 relative">
            {/* Barra de progresso da narração (sticky no topo) */}
            {narracaoPlaying && (
              <div className="sticky top-0 z-30 -mx-5 -mt-4 mb-3 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/5 px-5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleNarrarButtonPress}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-colors"
                    aria-label="Pausar narração"
                  >
                    <Pause className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div
                      className="h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const audio = narracaoAudioRef.current;
                        if (!audio || !audio.duration) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        audio.currentTime = pct * audio.duration;
                        narracaoActiveIdxRef.current = -1;
                      }}
                    >
                      <div
                        ref={narracaoProgressFillRef}
                        className="h-full bg-gradient-to-r from-primary to-primary-light transition-[width] duration-100 ease-out"
                        style={{ width: '0%' }}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-[10.5px] font-mono text-foreground/70 tabular-nums">
                    <span ref={narracaoTimeRef}>0:00</span>
                    <span className="text-foreground/40"> / </span>
                    <span ref={narracaoTotalTimeRef}>0:00</span>
                  </div>
                </div>
              </div>
            )}
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
                {displayLines.map((line, i) => renderLine(line, i, i === 0))}
              </div>

            </div>




            {/* Floating card: create or view highlight note + tags */}
            {createPortal(
              <AnimatePresence>
              {commentPrompt?.show && (() => {
                const currentHl = highlights.find(h => h.id === commentPrompt.id);
                const isView = commentPrompt.mode === 'view';
                return (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[10050] bg-black/65 backdrop-blur-sm"
                      onClick={handleDismissComment}
                    />
                    <motion.div
                      initial={{ y: '100%', opacity: 0.8 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '100%', opacity: 0 }}
                      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                      className="fixed inset-x-0 bottom-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto z-[10051] w-full sm:w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl h-[95dvh] sm:h-auto sm:max-h-[90vh] flex flex-col bg-card border-t sm:border border-border rounded-t-[28px] sm:rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden"
                    >
                      {/* Drag handle visual para mobile */}
                      <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-3 shrink-0 sm:hidden" />

                      <div className="flex items-center gap-2.5 mb-3 shrink-0">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: currentHl?.color || selectedColor }}
                        />
                        <p className="text-foreground text-base sm:text-lg font-bold flex-1">
                          {isView ? 'Sua anotação' : 'Nova anotação'}
                        </p>
                        {isView && (
                          <button
                            onClick={() => { if (currentHl) { removeHighlight(currentHl.id); handleDismissComment(); } }}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-md"
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                        {currentHl?.text && (
                          <div
                            className="text-sm italic text-foreground/80 border-l-2 pl-3 line-clamp-4 bg-muted/20 p-2.5 rounded-r-xl"
                            style={{ borderColor: currentHl.color }}
                          >
                            "{currentHl.text}"
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs font-semibold text-muted-foreground">Anotação</span>
                          <button
                            type="button"
                            disabled={isGeneratingAiNote}
                            onClick={handleGerarAnotacaoIa}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary hover:bg-primary/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isGeneratingAiNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            <span>{isGeneratingAiNote ? 'Gerando...' : 'Gerar com IA'}</span>
                          </button>
                        </div>

                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Escreva sua anotação ou clique em 'Gerar com IA'..."
                          className="w-full flex-1 min-h-[160px] sm:min-h-[120px] bg-secondary/60 border border-border rounded-2xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={6}
                        />

                        <div>
                          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2 mb-2.5">
                            {commentTags.map(t => (
                              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-xs font-semibold px-2.5 py-1.5">
                                #{t}
                                <button
                                  onClick={() => setCommentTags(prev => prev.filter(x => x !== t))}
                                  className="opacity-70 hover:opacity-100"
                                  aria-label={`Remover tag ${t}`}
                                >Ã—</button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={tagDraft}
                              onChange={(e) => setTagDraft(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTagFromDraft(); } }}
                              placeholder="Adicionar tag (ex: prova, importante)"
                              className="flex-1 bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                              onClick={addTagFromDraft}
                              className="px-4 rounded-xl text-sm font-semibold bg-secondary hover:bg-secondary/80 text-foreground"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-4 mt-auto border-t border-border/50 shrink-0 pb-[calc(env(safe-area-inset-bottom,0px))]">
                        <button
                          onClick={handleDismissComment}
                          className="flex-1 h-12 min-h-[48px] rounded-2xl text-sm font-bold text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          {isView ? 'Fechar' : 'Pular'}
                        </button>
                        <button
                          onClick={handleSaveComment}
                          className="flex-1 h-12 min-h-[48px] rounded-2xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    </motion.div>
                  </>
                );
              })()}
              </AnimatePresence>,
              document.body
            )}


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

          <TabsContent value="historico" className="px-5 pb-[calc(8rem+var(--sai-bottom))] pt-4">
            {(() => {
              const modRegex = /\(((?:Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Renumerado|Transformado|Suprimido|Restabelecido|Produção de efeito)[^)]*)\)/gi;
              const found: { texto: string; ano: number }[] = [];
              const seen = new Set<string>();
              let m: RegExpExecArray | null;
              const src = artigo?.caput || '';
              while ((m = modRegex.exec(src)) !== null) {
                const t = m[1].trim();
                if (seen.has(t)) continue;
                seen.add(t);
                const y = t.match(/\b(1\d{3}|20\d{2})\b/);
                found.push({ texto: t, ano: y ? Number(y[1]) : 0 });
              }
              found.sort((a, b) => b.ano - a.ano);

              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <History className="w-4 h-4" />
                    <p className="text-sm font-semibold uppercase tracking-wider">Histórico de alterações</p>
                  </div>
                  {found.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-8 text-center">
                      Este artigo não possui alterações registradas em seu texto oficial.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {found.map((item, i) => (
                        <li key={i} className="rounded-xl bg-secondary/40 border border-border/60 border-l-4 border-l-primary/70 px-4 py-3">
                          {item.ano > 0 && (
                            <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                              {item.ano}
                            </p>
                          )}
                          <p className="text-[14px] text-foreground/90 leading-relaxed">{item.texto}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-muted-foreground/70 text-center pt-2">
                    Fonte: metadados oficiais do dispositivo.
                  </p>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>


        </div>

        {/* Bottom-up action sheet for Funções / Grifar.
            IMPORTANTE: o createPortal fica FORA do AnimatePresence — um portal não é
            um elemento React válido, então o AnimatePresence o descartaria e o menu
            nunca apareceria (bug do menu de rodapé no mobile). */}
        {(activeTab ?? 'artigo') === 'artigo' && createPortal(
          <AnimatePresence>
            {activeActionMenu && (() => {
              let funcoesItems = [
                { id: 'juris', icon: Scale, label: 'Jurisprudência', desc: 'Súmulas, temas e acórdãos do STF/STJ', color: '#D4AF37', onClick: () => {
                  setActiveActionMenu(null);
                  if (!requireOnline('Jurisprudência')) return;
                  if (!tabelaNome || !artigo?.numero) { toast.error('Artigo não identificado'); return; }
                  gateFeature('jurisprudencia', 'jurisprudencia', 'Jurisprudência', () =>
                    navigate(`/jurisprudencia/${tabelaNome}/${encodeURIComponent(String(artigo.numero))}`),
                  );
                } },
                { icon: Play, label: 'Videoaulas', desc: 'Aulas em vídeo sobre este artigo', color: 'hsl(348 78% 38%)', onClick: () => {
                  setActiveActionMenu(null);
                  if (!requireOnline('Videoaulas')) return;
                  gateFeature('videoaula', 'videoaula', 'Videoaulas', () => setShowVideoaulasListSheet(true));
                } },
                
                { icon: BookOpen, label: 'Termos jurídicos', desc: 'Vocabulário do artigo explicado', color: '#F97316', onClick: () => { setActiveActionMenu(null); if (!requireOnline('Termos jurídicos')) return; gateFeature('termos', 'termos', 'Termos jurídicos', () => setShowTermosSheet(true)); } },
                { icon: MessageCircle, label: 'Perguntar', desc: 'Tire dúvidas com a IA', color: '#A855F7', onClick: () => { setActiveActionMenu(null); if (!requireOnline('Perguntar à IA')) return; gateFeature('perguntar', 'perguntar', 'Perguntar à IA', () => setShowPerguntarSheet(true)); } },
                ...(tabelaNome ? [{ icon: Network, label: 'Grafo de conexões', desc: 'Ver relações do artigo', color: '#10B981', onClick: () => { setActiveActionMenu(null); gateFeature('grafo', 'grafo', 'Grafo de conexões', () => setShowGrafo(true)); } }] : []),
                { icon: Copy, label: 'Copiar artigo', desc: 'Texto para a área de transferência', color: '#8B5CF6', onClick: () => { setActiveActionMenu(null); handleCopy(); } },
                { icon: Bell, label: 'Lembretes', desc: 'Avisar ao chegar em um local', color: '#DC2626', onClick: () => { setActiveActionMenu(null); import('@/components/vademecum/sheets/LembretesArtigoSheet'); gateFeature('lembretes', 'lembretes', 'Lembretes', () => setShowLembretesLocal(true)); } },
                { icon: Download, label: 'Baixar artigo', desc: 'PDF ou imagem, lei seca ou comentado', color: '#0EA5E9', onClick: () => { setActiveActionMenu(null); gateFeature('baixar', 'baixar', 'Baixar artigo', () => setShowBaixarSheet(true)); } },
                { icon: Share2, label: 'Compartilhar', desc: 'Enviar para outro app', color: '#06B6D4', onClick: () => { setActiveActionMenu(null); gateFeature('default', 'default', 'Compartilhar', () => setShowSharePanel(p => !p)); } },
              ];

              if (tabelaNome === 'LEIS_CF') {
                funcoesItems = funcoesItems.filter(item => item.id !== 'juris');
              }

              const gateGrifo = (label: string, action: () => void) =>
                gateFeature('grifo', 'grifo', label, action);
              const grifarItems = [
                { icon: Highlighter, label: highlightMode ? 'Desativar grifo manual' : 'Grifo manual', desc: 'Marcar com o dedo', color: '#EC4899', active: highlightMode, onClick: () => { setActiveActionMenu(null); if (highlightMode) { toggleMode(); return; } gateGrifo('Grifar', () => toggleMode()); } },
                { icon: Sparkles, label: 'Grifo mágico (IA)', desc: 'Destaques automáticos', color: '#DC2626', active: magicMode, spin: magicLoading, badge: magicHighlights.length, onClick: () => { setActiveActionMenu(null); gateGrifo('Grifar', () => handleToggleMagic()); } },
                { icon: Mic, label: 'Grifar por voz', desc: 'Dite o trecho a destacar', color: '#DC2626', onClick: () => { setActiveActionMenu(null); gateGrifo('Grifar', () => setVoiceGrifoActive(true)); } },
                { icon: Camera, label: 'Grifar de foto', desc: 'OCR de imagem', color: '#3B82F6', onClick: () => { setActiveActionMenu(null); gateGrifo('Grifar', () => setShowGrifoFoto(true)); } },
                { icon: Trash2, label: 'Apagar grifos', desc: 'Escolha por cor ou apague todos', color: 'hsl(348 78% 38%)', badge: eraseSheetHighlights.length, onClick: () => { setActiveActionMenu(null); setShowEraseSheet(true); } },
              ];
              const isGrifar = activeActionMenu === 'grifar';
              const items = isGrifar ? grifarItems : funcoesItems;
              const title = isGrifar ? 'Grifar' : 'Funções';
              const HeaderIcon = isGrifar ? Feather : LayoutGrid;
              return (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    data-artigo-menu=""
                    onClick={() => setActiveActionMenu(null)}
                    style={{ pointerEvents: 'auto' }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10005]"
                  />
                  <motion.aside
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    data-artigo-menu=""
                    style={{ pointerEvents: 'auto' }}
                    transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                    className="fixed bottom-0 left-0 right-0 z-[10006] bg-card border-t border-border rounded-t-3xl shadow-2xl flex flex-col pb-safe min-h-[74vh] max-h-[92vh] mx-auto max-w-lg md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-6 md:top-auto md:w-[92vw] md:max-w-2xl md:rounded-3xl md:border md:border-border md:shadow-2xl md:min-h-0"
                  >
                    <div className="pt-3 pb-2 flex justify-center">
                      <span className="w-10 h-1 rounded-full bg-border" />
                    </div>
                    <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <HeaderIcon className={`w-5 h-5 ${isGrifar ? 'text-primary' : 'text-primary'}`} />
                        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
                      </div>
                      <button
                        onClick={() => setActiveActionMenu(null)}
                        className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
                        aria-label="Fechar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto py-2">
                      {items.map((item, i, arr) => {
                        const Icon = item.icon;
                        return (
                          <div key={i}>
                            <button
                              onClick={item.onClick}
                              className={`w-full min-h-[68px] flex items-center gap-3 px-5 py-3.5 transition-colors text-left ${(item as any).active ? 'bg-primary/10' : 'hover:bg-secondary/60'}`}
                            >
                              <span
                                className="w-9 h-9 flex items-center justify-center shrink-0"
                                style={{ color: item.color }}
                              >
                                <Icon className={`w-[22px] h-[22px] ${(item as any).spin ? 'animate-spin' : ''}`} strokeWidth={2} />
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-[14.5px] font-medium text-foreground truncate">{item.label}</span>
                                <span className="block text-[12px] text-foreground/60 truncate mt-0.5">{item.desc}</span>
                              </span>
                              {(item as any).badge > 0 && (
                                <span className="ml-2 inline-flex min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold items-center justify-center">
                                  {(item as any).badge}
                                </span>
                              )}
                            </button>
                            {i < arr.length - 1 && (
                              <div className="mx-5 h-px bg-border/60" />
                            )}
                          </div>
                        );
                      })}
                      {isGrifar && (
                        <div className="mt-2 mx-5 p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium text-foreground">Mostrar grifo por padrão</p>
                            <p className="text-[11.5px] text-foreground/60 mt-0.5">Ao abrir o artigo, exibe os grifos da IA automaticamente.</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={grifoIaDefaultOn}
                            onClick={() => setGrifoIaDefault(!grifoIaDefaultOn)}
                            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${grifoIaDefaultOn ? 'bg-primary' : 'bg-muted'}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${grifoIaDefaultOn ? 'translate-x-5' : ''}`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.aside>
                </>
              );
            })()}
          </AnimatePresence>,
          document.body
        )}


        {/* Bottom nav bar — only visible on "artigo" tab; fixed as a flex item below the scrollable area */}
        {(activeTab ?? 'artigo') === 'artigo' && !isDesktop && (
        <div className="shrink-0 relative z-[55] bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/80 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.6)] pb-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
          <div className="relative grid grid-cols-5 items-end px-2 py-1 max-w-lg mx-auto">
            {(highlightMode || voiceGrifoActive) ? (
              <button
                onClick={() => setShowEraseSheet(true)}
                className="flex flex-col items-center justify-end gap-1.5 py-1.5 text-zinc-300 hover:text-red-400 transition-colors"
              >
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">Apagar</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveActionMenu('funcoes')}
                className={`flex flex-col items-center justify-end gap-1 py-2 transition-colors ${activeActionMenu === 'funcoes' ? 'text-primary' : 'text-zinc-300 hover:text-white'}`}
              >
                <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">Funções</span>
              </button>
            )}
            {(highlightMode || voiceGrifoActive) ? (
              <div aria-hidden="true" />
            ) : (
              <button
                onClick={() => {
                  if (!isPremium) {
                    openPremiumGate('praticar');
                    return;
                  }
                  setShowPraticarSheet(true);
                }}
                className="flex flex-col items-center justify-end gap-1 py-2 text-zinc-300 hover:text-white transition-colors"
              >
                <Target className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">Praticar</span>
              </button>
            )}

            {/* FAB central: Narrar por padrão; vira gravador quando Grifar por voz está ativo */}
            {voiceGrifoActive ? (
              <button
                onClick={() => {
                  if (voicePhase === 'recording') voicePanelRef.current?.stop();
                  else if (voicePhase === 'idle') voicePanelRef.current?.start();
                }}
                disabled={voicePhase === 'processing'}
                className="relative z-[80] flex flex-col items-center justify-end gap-1 py-2 touch-manipulation select-none"
                aria-label={voicePhase === 'recording' ? 'Parar gravação' : 'Gravar voz'}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 invisible" aria-hidden="true" />
                <div className="absolute bottom-[28px] sm:bottom-[32px] pointer-events-none">
                  <span className={`relative w-[4rem] h-[4rem] sm:w-[4.5rem] sm:h-[4.5rem] rounded-full flex items-center justify-center shadow-lg ring-4 ring-zinc-900 transition-all duration-300 pointer-events-auto ${voicePhase === 'recording' ? 'bg-red-500 shadow-red-500/40 scale-105' : voicePhase === 'processing' ? 'bg-secondary' : 'bg-primary shadow-primary/40'}`}>
                    {voicePhase === 'recording' && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" style={{ animationDuration: '1.2s' }} />
                        <span className="absolute -inset-1 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.2s' }} />
                      </>
                    )}
                    {voicePhase === 'processing' ? (
                      <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-foreground animate-spin relative z-20" />
                    ) : voicePhase === 'recording' ? (
                      <Square className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white relative z-20" />
                    ) : (
                      <Mic className="w-8 h-8 sm:w-9 sm:h-9 text-black relative z-20" />
                    )}
                  </span>
                </div>
                <span className="font-body text-[11px] sm:text-[12px] font-semibold text-primary leading-tight">
                  {voicePhase === 'recording' ? 'Parar' : voicePhase === 'processing' ? 'Analisando' : 'Gravar'}
                </span>
              </button>
            ) : (
              <button
                onPointerDown={handleNarrarButtonPress}
                onTouchStart={handleNarrarButtonPress}
                onClick={handleNarrarButtonPress}
                disabled={narracaoLoading}
                className="relative z-[80] flex flex-col items-center justify-end gap-1 py-2 touch-manipulation select-none"
                aria-label="Narrar"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 invisible" aria-hidden="true" />
                <div className="absolute bottom-[28px] sm:bottom-[32px] pointer-events-none">
                  <span className={`relative w-[4rem] h-[4rem] sm:w-[4.5rem] sm:h-[4.5rem] rounded-full flex items-center justify-center shadow-lg ring-4 ring-zinc-900 transition-all duration-300 pointer-events-auto ${narracaoPlaying ? 'bg-primary shadow-primary/40 scale-105' : 'bg-primary shadow-primary/30 hover:bg-primary/90'}`}>
                    {narracaoPlaying && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <span className="absolute -inset-1 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                      </>
                    )}
                    {narracaoPlaying && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90 z-10 pointer-events-none" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="26" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeOpacity="0.2" />
                        <circle
                          ref={narracaoRingRef}
                          cx="28" cy="28" r="26" fill="none"
                          stroke="hsl(var(--primary-foreground))"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${RING_CIRCUMFERENCE}`}
                          strokeDashoffset={`${RING_CIRCUMFERENCE}`}
                        />
                      </svg>
                    )}
                    {narracaoLoading ? (
                      <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground animate-spin relative z-20" />
                    ) : narracaoPlaying ? (
                      <Pause className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground relative z-20" />
                    ) : (
                      <Volume2 className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground relative z-20" />
                    )}
                  </span>
                </div>
                <span className="font-body text-[11px] sm:text-[12px] font-semibold text-primary leading-tight">
                  {narracaoPlaying ? 'Pausar' : narracaoUrl ? 'Ouvir' : 'Narrar'}
                </span>
              </button>
            )}
            {(highlightMode || voiceGrifoActive) ? (
              <div aria-hidden="true" />
            ) : (
              <button
                onClick={() => {
                  if (!isPremium) {
                    openPremiumGate('anotacoes');
                    return;
                  }
                  setShowAnotacoesSheet(true);
                  setShowFontControls(false);
                }}
                className="relative flex flex-col items-center justify-end gap-1 py-2 text-zinc-300 hover:text-white transition-colors"
              >
                <span className="relative">
                  <StickyNote className="w-7 h-7 sm:w-8 sm:h-8" />
                  {anotacoesCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center leading-none shadow-md ring-2 ring-zinc-900">
                      {anotacoesCount > 99 ? '99+' : anotacoesCount}
                    </span>
                  )}
                </span>
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">Anotações</span>
              </button>
            )}
            {(highlightMode || voiceGrifoActive) ? (
              <button
                onClick={() => {
                  if (voiceGrifoActive) {
                    try { voicePanelRef.current?.stop(); } catch {}
                    setVoiceGrifoActive(false);
                  } else {
                    toggleMode();
                  }
                }}
                className="flex flex-col items-center justify-end gap-1.5 py-1.5 text-primary hover:text-primary-light transition-colors"
              >
                <X className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-body text-[11px] sm:text-[12px] font-semibold leading-tight">Fechar</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!isPremium) {
                    openPremiumGate('grifo');
                    return;
                  }
                  setActiveActionMenu('grifar');
                }}
                className={`relative flex flex-col items-center justify-end gap-1 py-2 transition-colors ${activeActionMenu === 'grifar' || magicMode || highlightMode ? 'text-primary' : 'text-zinc-300 hover:text-white'}`}
              >
                <span className="relative">
                  <Feather className={`w-7 h-7 sm:w-8 sm:h-8 ${magicLoading ? 'animate-spin' : ''}`} />
                  {(highlights.length + magicHighlights.length) > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center leading-none shadow-md ring-2 ring-card">
                      {(highlights.length + magicHighlights.length) > 99 ? '99+' : (highlights.length + magicHighlights.length)}
                    </span>
                  )}
                </span>
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">Grifar</span>
              </button>
            )}

          </div>
        </div>
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

        <Suspense fallback={null}>
          {showEraseSheet && (
            <GrifoEraseSheet
              open={showEraseSheet}
              onClose={() => setShowEraseSheet(false)}
              highlights={eraseSheetHighlights}
              onRemoveByColor={handleRemoveGrifosByColor}
              onClearAll={handleClearAllGrifos}
              portalContainer={typeof document !== 'undefined' ? document.body : undefined}
            />
          )}

          {showVoiceSheet && (
            <GrifoVoiceSheet
              open={showVoiceSheet}
              onClose={() => setShowVoiceSheet(false)}
              linhas={displayLines}
              onApplyPassages={(passages: VoicePassage[]) => {
                for (const p of passages) {
                  addHighlightAtOffsets(p.lineIndex, p.startOffset, p.endOffset, p.text, p.color);
                }
              }}
            />
          )}

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

          {/* Overlay do gatinho + checklist enquanto gera a narração */}
          {narracaoLoading && (
            <GeracaoAnimacaoOverlay
              open={narracaoLoading}
              titulo="Gerando sua narração"
              steps={[
                'Preparando o texto do artigo',
                'Gerando narração realista em HD',
                'Salvando narração',
                'Pronto para ouvir',
              ]}
              stepIdx={narracaoStepIdx}
              stepRanges={[[0, 15], [15, 92], [92, 98], [100, 100]]}
              estTotalSec={22}
            />
          )}

          {/* Overlay animado ao gerar Explicação / Exemplo / Termos com IA */}
          {aiGeneratingMode !== null && (
            <GeracaoAnimacaoOverlay
              open={aiGeneratingMode !== null}
              titulo={
                aiGeneratingMode === 'explicacao' ? 'Gerando explicação com IA' :
                aiGeneratingMode === 'exemplo' ? 'Gerando exemplos práticos' :
                aiGeneratingMode === 'termos' ? 'Analisando termos jurídicos' :
                'Gerando conteúdo'
              }
              steps={[
                'Preparando o texto do artigo',
                'Consultando a IA',
                'Formatando conteúdo',
                'Pronto para ler',
              ]}
              stepIdx={aiGeneratingStep}
              stepRanges={[[0, 20], [20, 85], [85, 98], [100, 100]]}
              estTotalSec={12}
            />
          )}
        </Suspense>





        {/* Praticar Sheet */}
        <AnimatePresence>
          {showPraticarSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[10040]"
                onClick={() => setShowPraticarSheet(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[10041] bg-card rounded-t-3xl border-t border-border pb-safe h-[85vh] max-h-[85vh] overflow-y-auto mx-auto max-w-lg flex flex-col md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-none md:w-[min(30rem,92vw)] md:max-w-none md:rounded-none md:rounded-l-3xl md:border-l md:border-t-0 md:shadow-2xl md:mx-0"
              >
                <div className="pt-3 pb-2 flex justify-center">
                  <span className="w-10 h-1 rounded-full bg-border" />
                </div>
                <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-heading text-base font-semibold text-foreground">Praticar</h3>
                  </div>
                  <button
                    onClick={() => setShowPraticarSheet(false)}
                    className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="px-5 pt-3 text-[12.5px] text-foreground/60">Art. {artigo?.numero} — Escolha o modo de estudo</p>
                <div className="flex-1 py-2">
                  {[
                    {
                      icon: Target,
                      label: 'Questões',
                      desc: 'Múltipla escolha com comentários e exemplos',
                      color: '#DC2626',
                      onClick: () => {
                        setShowPraticarSheet(false);
                        if (!isPremium) {
                          openPremiumGate('questoes');
                          return;
                        }
                        if (isDesktop) {
                          setShowQuestoesPanel(true);
                        } else {
                          navigate(`/estudos?mode=questoes&tabela=${tabelaNome}&artigo=${artigo?.numero}`);
                        }
                      },
                    },
                    {
                      icon: Layers,
                      label: 'Flashcards',
                      desc: 'Cards com flip animado e exemplos práticos',
                      color: '#DC2626',
                      onClick: () => {
                        setShowPraticarSheet(false);
                        if (!isPremium) {
                          openPremiumGate('flashcards');
                          return;
                        }
                        navigate(`/estudos?mode=flashcards&tabela=${tabelaNome}&artigo=${artigo?.numero}`);
                      },
                    },
                  ].map((item, i, arr) => {
                    const Icon = item.icon;
                    return (
                      <div key={i}>
                        <button
                          onClick={item.onClick}
                          className="w-full flex items-center gap-4 px-5 py-5 transition-colors text-left hover:bg-secondary/60"
                        >
                          <span className="w-11 h-11 flex items-center justify-center shrink-0" style={{ color: item.color }}>
                            <Icon className="w-[26px] h-[26px]" strokeWidth={2} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[15.5px] font-medium text-foreground truncate">{item.label}</span>
                            <span className="block text-[12.5px] text-foreground/60 truncate mt-0.5">{item.desc}</span>
                          </span>
                          <ChevronRight className="w-5 h-5 text-foreground/40 shrink-0" />
                        </button>
                        {i < arr.length - 1 && <div className="mx-5 h-px bg-border/60" />}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Estudar Sheet removido */}


        <Suspense fallback={null}>
          {/* Videoaula full-screen sheet */}
          {showVideoaulaSheet && (
            <VideoaulaSheet
              open={showVideoaulaSheet}
              onClose={() => setShowVideoaulaSheet(false)}
              video={videoaula}
              tabelaNome={tabelaNome || ''}
              artigoNumero={artigo?.numero || ''}
              artigoTexto={artigo?.caput || ''}
            />
          )}

          {showVideoaulasListSheet && (
            <VideoaulasListSheet
              open={showVideoaulasListSheet}
              onClose={() => setShowVideoaulasListSheet(false)}
              tabelaNome={tabelaNome || ''}
              artigoNumero={artigo?.numero || ''}
              leiNome={tabelaNome}
              onSelectVideo={(v) => {
                setVideoaula({ titulo: v.titulo, url: v.url, canal: v.canal, videoId: v.videoId });
                setShowVideoaulasListSheet(false);
                setShowVideoaulaSheet(true);
              }}
            />
          )}

          {showAnotacoesSheet && (
            <AnotacoesSheet
              open={showAnotacoesSheet}
              onClose={() => setShowAnotacoesSheet(false)}
              tabelaNome={tabelaNome || 'unknown'}
              artigoNumero={artigo.numero}
              artigoTexto={artigo.caput}
              onCountChange={setAnotacoesCount}
            />
          )}

          {showPerguntarSheet && (
            <PerguntarSheet
              open={showPerguntarSheet}
              onClose={() => setShowPerguntarSheet(false)}
              tabelaNome={tabelaNome || 'unknown'}
              artigoNumero={artigo.numero}
              artigoTexto={artigo.caput}
            />
          )}
        </Suspense>

        {/* Termos jurídicos Sheet (aberto pelo menu Grifar) */}
        <Sheet open={showTermosSheet} onOpenChange={(open) => setShowTermosSheet(open)}>
          <SheetContent side="bottom" className="z-[10041] h-[90vh] max-w-lg mx-auto rounded-t-3xl p-0 flex flex-col md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[min(30rem,92vw)] md:max-w-none md:rounded-none md:rounded-l-3xl md:border-l md:mx-0">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <BookOpen className="w-5 h-5 text-orange-400" />
              <h3 className="font-heading text-base font-semibold text-foreground flex-1">Termos jurídicos</h3>
              <button onClick={() => setShowTermosSheet(false)} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70" aria-label="Fechar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {aiLoading.termos ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-body">Analisando termos jurídicos com IA...</p>
                </div>
              ) : aiContent.termos ? (
                (() => {
                  const sections = splitSections(aiContent.termos, '---TERMO---');
                  if (sections.length <= 1) {
                    return (
                      <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_strong]:text-foreground" style={{ fontSize: `${fontSize}px` }}>
                        <ReactMarkdown>{aiContent.termos}</ReactMarkdown>
                      </div>
                    );
                  }
                  return (
                    <Accordion type="single" collapsible className="space-y-2">
                      {sections.map((sec, i) => {
                        const borderColors = ['border-l-pink-500/70', 'border-l-orange-500/70', 'border-l-cyan-500/70', 'border-l-red-500/70', 'border-l-indigo-500/70', 'border-l-lime-500/70'];
                        const strongColors = ['[&_strong]:text-pink-400', '[&_strong]:text-orange-400', '[&_strong]:text-cyan-400', '[&_strong]:text-red-400', '[&_strong]:text-indigo-400', '[&_strong]:text-lime-400'];
                        return (
                          <AccordionItem key={i} value={`term-${i}`} className={`border border-border rounded-xl overflow-hidden bg-secondary/30 border-l-4 ${borderColors[i % borderColors.length]}`}>
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
                <p className="text-muted-foreground text-sm text-center py-8">Carregando termos...</p>
              )}
            </div>
          </SheetContent>
        </Sheet>
        </SheetContent>
      </Sheet>


      <Suspense fallback={null}>
        {tabelaNome && artigo && showGrafo && (
          <GrafoOverlay
            open={showGrafo}
            onClose={() => setShowGrafo(false)}
            tabelaNome={tabelaNome}
            leiNome={tabelaNome}
            artigoNumero={artigo.numero}
            artigoTexto={[artigo.caput, ...(artigo.incisos?.map((x: any) => typeof x === 'string' ? x : x?.texto) || []), ...(artigo.paragrafos?.map((x: any) => typeof x === 'string' ? x : x?.texto) || [])].filter(Boolean).join('\n\n')}
          />
        )}
        <PremiumGate open={showPremiumGate} onClose={() => setShowPremiumGate(false)} feature={premiumGateFeature} description={premiumGateDesc} />
        {showLembretesLocal && (
          <LembretesArtigoSheet
            open={showLembretesLocal}
            onClose={() => setShowLembretesLocal(false)}
            artigoRef={`${tabelaNome || 'artigo'}::${artigo?.numero ?? 'x'}`}
            artigoTitulo={artigo ? `Art. ${artigo.numero}${tabelaNome ? ' — ' + tabelaNome : ''}` : 'Artigo'}
          />
        )}
        {showBaixarSheet && (
          <BaixarArtigoSheet
            open={showBaixarSheet}
            onClose={() => setShowBaixarSheet(false)}
            artigo={artigo ? { numero: String(artigo.numero), caput: artigo.caput || '', incisos: (artigo as any).incisos, paragrafos: (artigo as any).paragrafos } : null}
            tabelaNome={tabelaNome}
          />
        )}
        {showGrifoFoto && (
          <GrifoFotoSheet open={showGrifoFoto} onClose={() => setShowGrifoFoto(false)} />
        )}

      </Suspense>

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
