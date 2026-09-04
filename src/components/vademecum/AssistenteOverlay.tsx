import { useState, useRef, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Plus, Globe, History as HistoryIcon,
  FileDown, Layers, HelpCircle, GitBranch, Paperclip, X, Check, Loader2, Zap, Image as ImageIcon,
  BookOpen, Share2, Scale, Mic, Camera, Brain, ChevronRight,
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { pdf, Document, Page, Text as PdfText, StyleSheet } from '@react-pdf/renderer';
import { track } from '@/lib/analyticsEvents';

import ShapeGrid from '@/components/ui/ShapeGrid';
import { SphereCloud } from './SphereCloud';
import {
  FlipFlashcards, QuestoesRunner, MapaMentalCanvas, TermosViewer, ShareSheet,
  type Flashcard, type Questao, type MapaNode, type Termo,
} from '@/components/chat/ChatArtifacts';
import { useIsDesktop } from '@/hooks/use-desktop';
import {
  CitationChip,
  SourcesFooter,
  injectCitationLinks,
  extractStatuteSources,
  type ChatSource,
} from '@/components/chat/ChatSources';
import { ChatFeedback } from '@/components/chat/ChatFeedback';
import { stripCitations } from '@/components/chat/ChatSources';
import PremiumGate, { type PremiumFeatureKey } from '@/components/PremiumGate';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { baixarBlob } from '@/lib/nativo';
import { haptic } from '@/lib/nativeHaptics';
import { Capacitor } from '@capacitor/core';
import { takePhoto } from '@/lib/nativeCamera';


type ArtifactKind = 'flashcards' | 'questoes' | 'mapa' | 'termos';
interface Artifact { id: string; kind: ArtifactKind; data: any; sourceId: string; createdAt: number; title: string }
interface Attachment { mime: string; data: string; name: string; }
interface Message { id: string; role: 'user' | 'assistant'; content: string; attachment?: Attachment; createdAt: number; sources?: ChatSource[]; webSearch?: boolean; thoughtTime?: number; }
interface Session { id: string; date: string; title: string; messages: Message[]; artifacts?: Artifact[]; updatedAt: number; }

const HIST_KEY = 'chat_juridico_hist_v2';
const ANALYZE_STEPS = [
  'Interpretando sua pergunta',
  'Consultando fontes jurídicas',
  'Analisando artigos e súmulas',
  'Estruturando resposta',
];

const SUGGESTIONS_POOL = [
  'O que é habeas corpus?',
  'Explique o Art. 5º da CF',
  'Diferença entre dolo e culpa',
  'O que é usucapião?',
  'Como funciona a legítima defesa?',
  'Princípios do direito administrativo',
  'O que é súmula vinculante?',
  'Prescrição no direito penal',
  'Diferença entre furto e roubo',
  'Responsabilidade civil objetiva',
  'Como funciona o mandado de segurança?',
  'O que são cláusulas pétreas?',
  'Princípio da anterioridade tributária',
  'O que é boa-fé objetiva?',
  'Diferença entre STF e STJ',
  'O que é improbidade administrativa?',
  'Explique o devido processo legal',
  'O que é coisa julgada?',
];

function pickSuggestions(n = 4): string[] {
  const arr = [...SUGGESTIONS_POOL];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  h: { fontSize: 14, marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  p: { fontSize: 11, lineHeight: 1.55, marginBottom: 8 },
});

function stripMd(t: string) { return t.replace(/[*_`#>[\]()]/g, '').replace(/\n{3,}/g, '\n\n'); }

function loadSessions(): Session[] {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
}
function saveSessions(s: Session[]) { localStorage.setItem(HIST_KEY, JSON.stringify(s.slice(0, 100))); }

interface Props { open: boolean; onClose: () => void; }

const AssistenteOverlay = ({ open, onClose }: Props) => {
  useBodyScrollLock(open);
  const isDesktop = useIsDesktop();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [webSearch, setWebSearch] = useState(true);
  const [powersOpen, setPowersOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [genOverlay, setGenOverlay] = useState<null | { kind: 'pdf' | 'flashcards' | 'questoes' | 'mapa' | 'termos'; label: string }>(null);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [shareText, setShareText] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [gateFeature, setGateFeature] = useState<PremiumFeatureKey | null>(null);
  const chatLimit = useFeatureLimit('ia_juridica');
  const podeUsarPremium = chatLimit.isPremium || chatLimit.isAdmin;


  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (open) { setSessions(loadSessions()); } }, [open]);

  // Sugestões variam cada vez que o chat abre
  const [suggestions, setSuggestions] = useState<string[]>(() => pickSuggestions(15));
  useEffect(() => {
    if (open) setSuggestions(pickSuggestions(15));
  }, [open]);

  // Ditado por voz — mostra transcrição em tempo real dentro do input
  const baseInputRef = useRef('');
  const voice = useVoiceInput((finalText) => {
    const base = baseInputRef.current;
    setInput((base ? base + ' ' : '') + finalText);
  });
  useEffect(() => {
    if (voice.listening) {
      const base = baseInputRef.current;
      setInput((base ? base + ' ' : '') + (voice.partial || ''));
    }
     
  }, [voice.partial, voice.listening]);
  const toggleMic = () => {
    if (!voice.listening) baseInputRef.current = input;
    voice.toggle();
  };

  // Persist current session
  useEffect(() => {
    if (!messages.length) return;
    const first = messages[0];
    const title = first.content.slice(0, 60) || 'Nova conversa';
    const now = Date.now();
    const session: Session = {
      id: sessionId,
      date: new Date(now).toISOString().slice(0, 10),
      title,
      messages,
      artifacts,
      updatedAt: now,
    };
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      const next = [session, ...filtered];
      saveSessions(next);
      return next;
    });
  }, [messages, sessionId]);

  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
    }
  }, [messages, loading]);

  // Analyze cycling
  useEffect(() => {
    if (!loading) { setAnalyzeStep(0); return; }
    const int = setInterval(() => setAnalyzeStep(s => Math.min(s + 1, ANALYZE_STEPS.length - 1)), 900);
    return () => clearInterval(int);
  }, [loading]);

  const newSession = () => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setInput('');
    setAttachment(null);
    setArtifacts([]);
    setHistoryOpen(false);
  };

  const openSession = (s: Session) => {
    setSessionId(s.id);
    setMessages(s.messages);
    setArtifacts(s.artifacts || []);
    setHistoryOpen(false);
  };

  const deleteSession = (id: string) => {
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    saveSessions(next);
    if (id === sessionId) newSession();
  };

  const handleTirarFoto = async () => {
    if (!podeUsarPremium) {
      setGateFeature('chat_anexo');
      return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        const res = await takePhoto({ source: 'camera', quality: 80 });
        if (res.ok && res.base64) {
          const mime = `image/${res.format || 'jpeg'}`;
          setAttachment({
            mime,
            data: res.base64,
            name: `foto-${Date.now()}.${res.format || 'jpg'}`,
          });
          setAttachOpen(false);
          haptic.notification();
          toast.success('Foto anexada com sucesso');
          return;
        } else if (res.reason && !/cancel/i.test(res.reason)) {
          console.warn('[Camera] Erro na câmera nativa:', res.reason);
        }
      } catch (e) {
        console.warn('[Camera] Falha ao acionar câmera nativa:', e);
      }
    }

    // Fallback Web / Desktop
    const el = fileInputRef.current;
    if (el) {
      el.setAttribute('accept', 'image/*');
      el.setAttribute('capture', 'environment');
      el.click();
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) { toast.error('Arquivo maior que 8MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setAttachment({ mime: file.type || 'image/jpeg', data: base64String, name: file.name });
      setAttachOpen(false);
      toast.success('Foto anexada com sucesso');
    };
    reader.onerror = () => toast.error('Erro ao processar arquivo');
    reader.readAsDataURL(file);
  };

  const abrirAnexos = () => {
    if (!podeUsarPremium) { setGateFeature('chat_anexo'); return; }
    setAttachOpen(v => !v);
  };

  const toggleWebSearch = () => {
    if (!podeUsarPremium) { setGateFeature('chat_web'); return; }
    setWebSearch(w => !w);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !attachment) || loading) return;
    
    if (!chatLimit.canUse) {
      setGateFeature('chat_juridico');
      return;
    }
    void chatLimit.register();

    track('chat_juridico_mensagem_enviada', {
      has_attachment: !!attachment,
      attachment_mime: attachment?.mime?.split(';')[0] || undefined,
      web_search: webSearch,
      message_length: text.length,
    });
    const userMsg: Message = {
      id: crypto.randomUUID(), role: 'user',
      content: text || (attachment ? `📎 ${attachment.name}` : ''),
      attachment: attachment || undefined,
      createdAt: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const sentAttachment = attachment;
    setAttachment(null);
    setLoading(true);
    const startTime = Date.now();
    const asMsgId = crypto.randomUUID();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dnjrgpldcwcpoywamorr.supabase.co";
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

      const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/assistente-juridica`;
      const payloadMessages = newMessages.map(m => ({
        role: m.role, content: m.content,
        ...(m.attachment ? { attachment: { mime: m.attachment.mime, data: m.attachment.data } } : {}),
      }));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
      };

      let res: Response | null = null;
      let streamOk = false;

      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: payloadMessages,
            webSearch,
            stream: true,
          })
        });
        if (res.ok) {
          streamOk = true;
        }
      } catch (streamErr) {
        console.warn('[Chat] Fetch stream error, will fallback to invoke:', streamErr);
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (!streamOk || !res || !res.ok) {
        // Robust fallback: Supabase SDK invoke
        const { data, error: invokeErr } = await supabase.functions.invoke('assistente-juridica', {
          body: {
            messages: payloadMessages,
            webSearch,
            stream: false,
          },
        });

        if (invokeErr || !data) {
          throw invokeErr || new Error('Falha ao conectar');
        }

        const webSources: ChatSource[] = Array.isArray(data?.sources) ? data.sources : [];
        const startN = (webSources.length ? Math.max(...webSources.map((s: any) => s.n)) : 0) + 1;
        const rawReply: string = data?.reply || 'Não consegui gerar uma resposta agora. Tente reformular.';
        const { text: enrichedReply, sources: statuteSources } = extractStatuteSources(rawReply, startN);
        const asMsg: Message = {
          id: asMsgId, role: 'assistant',
          content: enrichedReply,
          createdAt: Date.now(),
          sources: [...webSources, ...statuteSources],
          webSearch,
          thoughtTime: Math.max(1, elapsed),
        };
        setMessages(prev => [...prev, asMsg]);
        return;
      }
      
      const contentType = res.headers.get('Content-Type') || '';
      
      if (!contentType.includes('text/event-stream') || !res.body) {
        // Fallback for JSON response
        const data = await res.json();
        const webSources: ChatSource[] = Array.isArray(data?.sources) ? data.sources : [];
        const startN = (webSources.length ? Math.max(...webSources.map((s) => s.n)) : 0) + 1;
        const rawReply: string = data?.reply || 'Não consegui gerar uma resposta agora. Tente reformular.';
        const { text: enrichedReply, sources: statuteSources } = extractStatuteSources(rawReply, startN);
        const asMsg: Message = {
          id: asMsgId, role: 'assistant',
          content: enrichedReply,
          createdAt: Date.now(),
          sources: [...webSources, ...statuteSources],
          webSearch,
          thoughtTime: Math.max(1, elapsed),
        };
        setMessages(prev => [...prev, asMsg]);
        return;
      }
      
      // Streaming SSE
      setLoading(false); // Stop 'analyzing'
      setMessages(prev => [...prev, {
        id: asMsgId, role: 'assistant', content: '', createdAt: Date.now(), webSearch, thoughtTime: Math.max(1, elapsed)
      }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      let webSources: ChatSource[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                setMessages(prev => prev.map(m => m.id === asMsgId ? { ...m, content: fullText } : m));
              }
              const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;
              if (chunks && !webSources.length) {
                webSources = chunks.map((c: any, i: number) => {
                  const w = c?.web;
                  if (!w?.uri) return null;
                  let domain = '';
                  try { domain = new URL(w.uri).hostname.replace(/^www\./, ''); } catch {}
                  return { n: i + 1, title: w.title || domain || w.uri, url: w.uri, domain };
                }).filter(Boolean) as ChatSource[];
              }
            } catch (e) { /* partial chunk */ }
          }
        }
      }
      
      // Post-process for statutes
      const startN = (webSources.length ? Math.max(...webSources.map(s => s.n)) : 0) + 1;
      const { text: enrichedReply, sources: statuteSources } = extractStatuteSources(fullText, startN);
      setMessages(prev => prev.map(m => m.id === asMsgId ? { ...m, content: enrichedReply, sources: [...webSources, ...statuteSources] } : m));

    } catch (err) {
      console.error('[Chat] Erro ao processar:', err);
      // Fallback final caso o stream tenha falhado no meio
      try {
        const { data: fallbackData } = await supabase.functions.invoke('assistente-juridica', {
          body: {
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            webSearch: false,
          },
        });
        if (fallbackData?.reply) {
          const { text: enrichedReply } = extractStatuteSources(fallbackData.reply, 1);
          setMessages(prev => {
            const hasTemp = prev.some(m => m.id === asMsgId);
            if (hasTemp) {
              return prev.map(m => m.id === asMsgId ? { ...m, content: enrichedReply } : m);
            }
            return [...prev, { id: asMsgId, role: 'assistant', content: enrichedReply, createdAt: Date.now() }];
          });
          return;
        }
      } catch (fallbackErr) {
        console.error('[Chat] Fallback secundario falhou:', fallbackErr);
      }
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: '⚠️ Erro ao processar. Tente novamente.', createdAt: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async (msg: Message) => {
    track('chat_juridico_export_pdf', { message_length: msg.content.length });
    setGenOverlay({ kind: 'pdf', label: 'Gerando PDF' });
    try {
      const doc = (
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <PdfText style={pdfStyles.h}>Resposta do Chat Jurídico</PdfText>
            {stripMd(msg.content).split('\n').map((p, i) => (
              <PdfText key={i} style={pdfStyles.p}>{p}</PdfText>
            ))}
          </Page>
        </Document>
      );
      const blob = await pdf(doc).toBlob();
      await baixarBlob(blob, 'chat-juridico.pdf', { titulo: 'Chat jurídico', toastSucesso: false });
      toast.success('PDF exportado');
    } catch (e) { toast.error('Erro no PDF'); }
    finally { setGenOverlay(null); }
  };

  const persistArtifact = (art: Artifact) => {
    setArtifacts(prev => [art, ...prev]);
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === sessionId);
      if (idx < 0) return prev;
      const next = [...prev];
      const s = next[idx];
      next[idx] = { ...s, artifacts: [art, ...(s.artifacts || [])], updatedAt: Date.now() };
      saveSessions(next);
      return next;
    });
  };

  const generateFromMsg = async (msg: Message, kind: ArtifactKind) => {
    track('chat_juridico_artifact_gerado', { kind, message_length: msg.content.length });
    const label =
      kind === 'flashcards' ? 'Gerando flashcards'
      : kind === 'questoes' ? 'Gerando questões'
      : kind === 'termos' ? 'Extraindo termos jurídicos'
      : 'Gerando mapa mental';
    setGenOverlay({ kind, label });
    try {
      const mode =
        kind === 'flashcards' ? 'flashcards_conteudo'
        : kind === 'questoes' ? 'questoes_conteudo'
        : kind === 'termos' ? 'termos_conteudo'
        : 'mapa_conteudo';
      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: { mode, conteudo: msg.content },
      });
      if (error) throw error;
      const parsed = JSON.parse(data?.reply || '{}');
      const title = kind === 'mapa' ? (parsed?.titulo || 'Mapa mental') : msg.content.slice(0, 60);
      const art: Artifact = { id: crypto.randomUUID(), kind, data: parsed, sourceId: msg.id, createdAt: Date.now(), title };
      persistArtifact(art);
      setActiveArtifact(art);
    } catch (e) { console.error(e); toast.error('Falhou. Tente novamente.'); }
    finally { setGenOverlay(null); }
  };

  const openShare = (msg: Message) => {
    const body = `📚 *Chat Jurídico*\n\n${msg.content.slice(0, 3800)}`;
    setShareText(body);
  };

  const groupedSessions = useMemo(() => {
    const g: Record<string, Session[]> = {};
    for (const s of sessions) { (g[s.date] ||= []).push(s); }
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%', pointerEvents: 'none' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={
            isDesktop
              ? 'fixed inset-0 z-[60] bg-[#07080b] flex flex-row'
              : 'fixed inset-0 z-[60] bg-[#07080b] flex flex-col'
          }
        >
          {/* Fundo com Aspecto de Profundo, Elegante e Imersivo com ShapeGrid Oficial */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-[#07080b]">
            {/* ShapeGrid com profundidade geométrica sutil */}
            <div className="absolute inset-0 opacity-40 mix-blend-screen">
              <ShapeGrid
                speed={0.4}
                squareSize={42}
                direction="diagonal"
                borderColor="rgba(255, 255, 255, 0.04)"
                hoverFillColor="rgba(255, 255, 255, 0.08)"
                shape="square"
                hoverTrailAmount={4}
              />
            </div>

            {/* Halos volumétricos de luz e profundidade atmosférica */}
            <div className="absolute top-[-25%] left-[-15%] w-[130%] h-[60%] bg-[radial-gradient(ellipse_at_top,rgba(190,140,75,0.15),transparent_65%)] blur-[95px] mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[120%] h-[55%] bg-[radial-gradient(ellipse_at_bottom,rgba(140,30,45,0.14),transparent_70%)] blur-[100px] mix-blend-screen" />
            
            {/* Vinheta profunda circular para criar perspectiva tridimensional */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_40%,transparent_25%,rgba(4,5,7,0.88)_100%)]" />
          </div>

          {/* Desktop sidebar (ChatGPT-style) */}
          {isDesktop && (
            <aside className="w-[280px] shrink-0 h-full border-r border-border bg-card/40 flex flex-col">
              <div className="px-4 py-4 flex items-center gap-2 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-foreground leading-tight">Chat Jurídico</p>
                  <p className="text-[10px] text-muted-foreground">Assistente Jurídico • IA</p>
                </div>
                <button
                  onClick={() => { haptic.light(); onClose(); }}
                  aria-label="Fechar"
                  className="w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => { haptic.selection(); newSession(); }}
                className="mx-3 mt-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent/10 text-sm font-body font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nova conversa
              </button>

              <div className="px-3 mt-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Ferramentas</p>
                <button
                  onClick={() => { haptic.selection(); toggleWebSearch(); }}
                  aria-pressed={webSearch}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-body transition-colors ${
                    webSearch
                      ? 'bg-accent/15 border-accent text-foreground'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Globe className={`w-4 h-4 ${webSearch ? 'text-accent' : ''}`} />
                  <span className="flex-1 text-left">Pesquisar na internet</span>
                  <span className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${webSearch ? 'bg-accent justify-end' : 'bg-muted justify-start'}`}>
                    <span className="w-3 h-3 rounded-full bg-background" />
                  </span>
                </button>
              </div>

              <div className="px-3 mt-4 flex-1 overflow-y-auto pb-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">Histórico</p>
                {groupedSessions.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 py-4">Sem conversas ainda.</p>
                )}
                {groupedSessions.map(([date, list]) => (
                  <div key={date} className="mb-3">
                    <p className="text-[10px] text-muted-foreground/70 mb-1 px-2">
                      {new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                    <div className="space-y-0.5">
                      {list.map(s => (
                        <div key={s.id} className="group flex items-center rounded-lg hover:bg-accent/10">
                          <button
                            onClick={() => { haptic.selection(); openSession(s); }}
                            className={`flex-1 min-w-0 text-left px-2.5 py-2 text-xs font-body truncate ${s.id === sessionId ? 'text-accent font-semibold' : 'text-foreground'}`}
                          >
                            {s.title || 'Conversa'}
                          </button>
                          <button
                            onClick={() => { haptic.warning(); deleteSession(s.id); }}
                            aria-label="Excluir"
                            className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded hover:bg-muted transition-opacity"
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* Main column */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile header (ChatGPT-style minimalist) */}
          {!isDesktop && (
            <header className="flex items-center justify-between px-3.5 py-2.5 shrink-0 bg-zinc-950/40 backdrop-blur-xl border-b border-white/5" style={{ paddingTop: 'calc(var(--sai-top,env(safe-area-inset-top,0px)) + 0.5rem)' }}>
              <button
                onClick={() => { haptic.light(); onClose(); setTimeout(newSession, 300); }}
                aria-label="Fechar"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-zinc-900/80 hover:bg-zinc-800 active:scale-90 transition-all shadow-md z-10 border border-white/10"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" strokeWidth={2.2} />
              </button>

              <div className="flex flex-col items-center z-10">
                <span className="text-[14px] sm:text-[15px] font-semibold text-foreground tracking-wide">Chat Jurídico</span>
                <button
                  onClick={() => { 
                    haptic.selection(); 
                    if (!podeUsarPremium) {
                      setGateFeature('chat_juridico');
                    } else {
                      toggleWebSearch(); 
                    }
                  }}
                  className="flex items-center gap-1.5 mt-0.5 px-3 py-1 rounded-full transition-all active:scale-95 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 shadow-sm"
                >
                  <Globe className={`w-3.5 h-3.5 ${webSearch && podeUsarPremium ? 'text-accent' : 'text-muted-foreground'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${webSearch && podeUsarPremium ? 'text-accent' : 'text-muted-foreground'}`}>
                    Internet
                  </span>
                  <div className={`relative w-7 h-4 rounded-full flex items-center transition-colors shadow-inner ${webSearch && podeUsarPremium ? 'bg-accent' : 'bg-muted'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform shadow-sm ${webSearch && podeUsarPremium ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                  </div>
                </button>
              </div>

              <button
                onClick={() => { haptic.selection(); setHistoryOpen(true); }}
                aria-label="Histórico"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-zinc-900/80 hover:bg-zinc-800 active:scale-90 transition-all shadow-md z-10 border border-white/10"
              >
                <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" strokeWidth={2} />
              </button>
            </header>
          )}


          {/* Messages */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
            <div className={isDesktop ? 'max-w-3xl mx-auto w-full' : 'contents'}>
            {messages.length === 0 && !loading && (
              <div className="flex flex-col h-full pb-2">
                <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-4">
                  <div className="relative w-full max-w-[320px] h-48 flex items-center justify-center mt-4">
                    {/* Cérebro central animado */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1], 
                        boxShadow: [
                          '0 0 20px -5px rgba(var(--accent-rgb), 0.2)', 
                          '0 0 40px -5px rgba(var(--accent-rgb), 0.5)', 
                          '0 0 20px -5px rgba(var(--accent-rgb), 0.2)'
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-20 h-20 rounded-full bg-gradient-to-b from-accent/20 to-accent/5 flex items-center justify-center z-10 border border-accent/20 backdrop-blur-sm shadow-lg"
                    >
                      <Brain className="w-9 h-9 text-accent/90" strokeWidth={1.5} />
                    </motion.div>
                    
                    {/* Palavras flutuantes (Badges) alimentando o cérebro */}
                    {[
                      { text: 'Jurisprudência', delay: 0, x: -100, y: -55 },
                      { text: 'Leis Secas', delay: 1.5, x: 90, y: -45 },
                      { text: 'Tempo real', delay: 0.7, x: -90, y: 65 },
                      { text: 'Resumos', delay: 2.2, x: 100, y: 50 },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: item.x * 1.5, y: item.y * 1.5, scale: 0.5 }}
                        animate={{ 
                          opacity: [0, 1, 1, 0], 
                          x: [item.x * 1.5, item.x, item.x * 0.4, 0], 
                          y: [item.y * 1.5, item.y, item.y * 0.4, 0], 
                          scale: [0.5, 1, 1, 0.3] 
                        }}
                        transition={{ 
                          duration: 4.5, 
                          repeat: Infinity, 
                          delay: item.delay, 
                          times: [0, 0.2, 0.7, 1],
                          ease: 'easeInOut' 
                        }}
                        className="absolute px-3 py-1.5 rounded-full bg-card/90 border border-white/10 text-[11px] font-medium text-foreground/80 backdrop-blur-md shadow-xl whitespace-nowrap z-20"
                      >
                        {item.text}
                      </motion.div>
                    ))}

                    {/* Pulsos conectores sutis */}
                    <motion.div
                      animate={{ opacity: [0, 0.5, 0], scale: [0.8, 2, 2.5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute w-20 h-20 rounded-full border border-accent/30 z-0"
                    />
                    <motion.div
                      animate={{ opacity: [0, 0.3, 0], scale: [0.8, 3, 4] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1.5 }}
                      className="absolute w-20 h-20 rounded-full border border-accent/20 z-0"
                    />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-foreground text-center tracking-tight">
                    Como posso ajudar?
                  </h2>
                </div>

                {/* Sugestões no final da área de scroll */}
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center mt-auto px-4 pb-2">
                  <SphereCloud 
                    tags={suggestions} 
                    onSelect={(q) => { setInput(q); }} 
                    radius={120} 
                  />
                </div>
              </div>
            )}

            {(messages.length > 0 || loading) && (
              <div className="w-full flex flex-col space-y-4 pb-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                    <div className={`${
                      msg.role === 'user'
                        ? (isDesktop ? 'max-w-[92%]' : 'max-w-[88%]') + ' rounded-2xl px-4 py-2.5 bg-primary/15 text-foreground border border-primary/40 rounded-br-md'
                        : 'w-full text-foreground py-1'
                    }`}>
                      {msg.attachment && msg.role === 'user' && (
                        <div className="mb-2 flex items-center gap-2 text-xs opacity-90">
                          <Paperclip className="w-3 h-3" /> {msg.attachment.name}
                        </div>
                      )}
                      {msg.role === 'assistant' ? (
                        <>
                          {msg.thoughtTime && (
                            <div className="mb-4">
                              <details className="group [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors w-fit">
                                  Pensou por {msg.thoughtTime}s <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                                </summary>
                                <div className="mt-3 pl-3 border-l-2 border-border/50 text-xs text-muted-foreground/80 space-y-2.5 font-body">
                                  {ANALYZE_STEPS.map((step) => (
                                    <div key={step} className="flex items-center gap-2">
                                      <Check className="w-3 h-3 text-muted-foreground/60" />
                                      <span>{step}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}
                            className="prose prose-base dark:prose-invert max-w-none font-body text-[15px] leading-relaxed [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-1 text-foreground"
                            onCopy={(e) => {
                              const sel = window.getSelection()?.toString() ?? '';
                              if (!sel) return;
                              e.preventDefault();
                              e.clipboardData.setData('text/plain', stripCitations(sel));
                            }}
                          >
                            <ReactMarkdown
                              components={{
                                a: ({ href, children, ...rest }) => {
                                  if (href?.startsWith('cite://')) {
                                    const n = parseInt(href.replace('cite://', ''), 10);
                                    const source = msg.sources?.find((s) => s.n === n);
                                    return <CitationChip n={n} source={source} />;
                                  }
                                  return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
                                },
                              }}
                            >
                              {(msg.sources?.length ?? 0) > 0
                                ? injectCitationLinks(msg.content, msg.sources?.length ?? 0)
                                : msg.content}
                            </ReactMarkdown>
                          </motion.div>
                          {msg.sources && msg.sources.length > 0 && (
                            <SourcesFooter sources={msg.sources} />
                          )}
                          {msg.content && msg.content.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                              className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-1.5"
                            >
                              <ActionBtn
                                icon={FileDown}
                                label="PDF"
                                colorClass="text-rose-500 group-hover:text-rose-400"
                                hoverClass="hover:border-rose-500/40 hover:bg-rose-500/10"
                                onClick={() => exportPdf(msg)}
                              />
                              <ActionBtn
                                icon={Layers}
                                label="Flashcards"
                                colorClass="text-emerald-400 group-hover:text-emerald-300"
                                hoverClass="hover:border-emerald-500/40 hover:bg-emerald-500/10"
                                onClick={() => generateFromMsg(msg, 'flashcards')}
                              />
                              <ActionBtn
                                icon={HelpCircle}
                                label="Questões"
                                colorClass="text-amber-400 group-hover:text-amber-300"
                                hoverClass="hover:border-amber-500/40 hover:bg-amber-500/10"
                                onClick={() => generateFromMsg(msg, 'questoes')}
                              />
                              <ActionBtn
                                icon={GitBranch}
                                label="Mapa"
                                colorClass="text-purple-400 group-hover:text-purple-300"
                                hoverClass="hover:border-purple-500/40 hover:bg-purple-500/10"
                                onClick={() => generateFromMsg(msg, 'mapa')}
                              />
                              <ActionBtn
                                icon={BookOpen}
                                label="Termos"
                                colorClass="text-sky-400 group-hover:text-sky-300"
                                hoverClass="hover:border-sky-500/40 hover:bg-sky-500/10"
                                onClick={() => generateFromMsg(msg, 'termos')}
                              />
                              <ActionBtn
                                icon={Share2}
                                label="Enviar"
                                colorClass="text-pink-400 group-hover:text-pink-300"
                                hoverClass="hover:border-pink-500/40 hover:bg-pink-500/10"
                                onClick={() => openShare(msg)}
                              />
                              <span className="ml-auto">
                                <ChatFeedback
                                  messageId={msg.id}
                                  sessionId={sessionId}
                                  pergunta={
                                    [...messages].reverse().find((m, i, arr) => {
                                      const idx = arr.length - 1 - i;
                                      return m.role === 'user' && idx < messages.findIndex((x) => x.id === msg.id);
                                    })?.content || ''
                                  }
                                  resposta={msg.content}
                                  webSearch={!!msg.webSearch}
                                  sources={msg.sources}
                                />
                              </span>
                            </motion.div>
                          )}
                        </>
                      ) : (
                        <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start w-full mt-2">
                    <div className="px-1 py-1 w-full">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground mb-4">
                        <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                        Pensando...
                      </div>
                      <ul className="space-y-3 pl-3 border-l-2 border-border/50">
                        {ANALYZE_STEPS.map((step, i) => {
                          const done = i < analyzeStep;
                          const active = i === analyzeStep;
                          if (!done && !active) return null;
                          return (
                            <li key={step} className="flex items-center gap-2 text-xs font-body">
                              {done ? (
                                <Check className="w-3.5 h-3.5 text-muted-foreground/60" />
                              ) : (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground" />
                              )}
                              <span className={done ? 'text-muted-foreground/80' : 'text-foreground font-medium animate-pulse'}>{step}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Input area (ChatGPT Pill Style) */}
          <div className={
            isDesktop
              ? 'relative px-6 pb-6 pt-3 bg-gradient-to-t from-[#07080b] via-[#07080b]/95 to-transparent'
              : 'relative px-3.5 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-3 bg-gradient-to-t from-[#07080b] via-[#07080b]/95 to-transparent'
          }>
            <div className="mx-auto w-full max-w-3xl rounded-[28px] bg-zinc-900/90 sm:bg-zinc-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.65)] flex flex-col p-2 transition-all focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/25">
              {attachment && (
                <div className="mb-2 flex items-center gap-2 px-3.5 py-2 mx-1 rounded-2xl bg-white/10 border border-white/10">
                  <Paperclip className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-xs font-body text-foreground truncate flex-1 font-medium">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                </div>
              )}
              
              <div className="flex items-end gap-1.5 relative">
                <button
                  onClick={() => { haptic.selection(); abrirAnexos(); }}
                  aria-label="Anexar"
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all active:scale-90 touch-manipulation cursor-pointer"
                >
                  <Plus className="w-6 h-6" strokeWidth={2.2} />
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  rows={1}
                  placeholder={voice.listening ? 'Ouvindo…' : 'Mensagem...'}
                  className="flex-1 min-h-[48px] max-h-36 bg-transparent px-2 py-3 text-[16px] font-body text-foreground placeholder:text-muted-foreground/70 focus:outline-none resize-none leading-relaxed"
                />

                {(input.trim() || attachment) ? (
                  <button
                    onClick={() => { haptic.light(); sendMessage(); }}
                    disabled={loading}
                    aria-label="Enviar mensagem"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 flex items-center justify-center shrink-0 shadow-[0_4px_18px_rgba(255,255,255,0.35)] transition-all active:scale-90 disabled:opacity-50 touch-manipulation cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
                    ) : (
                      <Send className="w-5 h-5 text-zinc-950 ml-0.5" strokeWidth={2.4} />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => { haptic.selection(); toggleMic(); }}
                    aria-label="Gravar áudio"
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 touch-manipulation cursor-pointer ${
                      voice.listening ? 'bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.5)]' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                    }`}
                  >
                    <Mic className="w-5 h-5" strokeWidth={2.2} />
                    {voice.listening && <span className="absolute inset-1 rounded-full ring-2 ring-red-400 animate-ping" />}
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
            </div>
            
            {!isDesktop && (
              <div className="text-center mt-2.5 px-4">
                <p className="text-[10px] text-muted-foreground/60 font-body tracking-wider">
                  O Chat Jurídico pode cometer erros. Considere verificar as fontes.
                </p>
              </div>
            )}
          </div>

          {voice.listening && (
            <div
              className="fixed left-4 right-4 z-[64] pointer-events-none flex justify-center"
              style={{ bottom: 'calc(11rem + var(--sai-bottom))' }}
            >
              <div className="px-3 py-1.5 rounded-full bg-red-500/95 text-white text-[11px] font-body shadow-lg">
                🎙️ Ouvindo… fale agora
              </div>
            </div>
          )}

          {/* Menu flutuante do + (Apenas Câmera / Tirar Foto) */}
          <AnimatePresence>
            {attachOpen && (
              <>
                <div
                  className="fixed inset-0 z-[68]"
                  onClick={() => setAttachOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                  className="fixed left-3 z-[69] bg-card border border-border rounded-2xl shadow-2xl p-2 flex flex-col gap-1 min-w-[200px]"
                  style={{ bottom: 'calc(9.5rem + var(--sai-bottom))' }}
                >
                  <button
                    onClick={() => {
                      haptic.light();
                      setAttachOpen(false);
                      void handleTirarFoto();
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors text-left"
                  >
                    <Camera className="w-[26px] h-[26px] text-sky-400" strokeWidth={1.5} />
                    <span className="flex-1">
                      <span className="block text-[15px] font-body font-semibold text-foreground tracking-tight">Câmera</span>
                      <span className="block text-[11px] text-muted-foreground/70">Tirar foto</span>
                    </span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Powers sheet */}
          <AnimatePresence>
            {powersOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/50 flex items-end" onClick={() => setPowersOpen(false)}>
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  className="w-full bg-card rounded-t-3xl p-5 pb-8" onClick={e => e.stopPropagation()}>
                  <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">Poderes</h3>
                  <p className="text-xs font-body text-muted-foreground mb-4">Ative superpoderes para respostas ainda melhores.</p>
                  <button
                    onClick={() => { toggleWebSearch(); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors ${webSearch ? 'bg-accent/20 border-accent' : 'bg-secondary border-border'}`}
                  >
                    <Globe className={`w-6 h-6 ${webSearch ? 'text-accent' : 'text-foreground'}`} />
                    <div className="flex-1 text-left">
                      <p className="font-body text-sm font-bold text-foreground">Pesquisar na internet</p>
                      <p className="text-xs text-muted-foreground">Busca em tempo real via Google.</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${webSearch ? 'bg-accent justify-end' : 'bg-muted justify-start'}`}>
                      <div className="w-5 h-5 rounded-full bg-background" />
                    </div>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History drawer (right → left) */}
          <AnimatePresence>
            {historyOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/50" onClick={() => setHistoryOpen(false)}>
                <motion.div
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-card border-l border-border flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-display text-base font-bold text-foreground">Histórico</h3>
                    <button onClick={() => setHistoryOpen(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={newSession} className="mx-4 mt-3 mb-2 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-body font-semibold flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Nova conversa
                  </button>
                  <div className="flex-1 overflow-y-auto px-4 pb-6">
                    {groupedSessions.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">Sem histórico ainda.</p>
                    )}
                    {groupedSessions.map(([date, list]) => (
                      <div key={date} className="mt-3">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 font-body">
                          {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
                        </p>
                        <div className="space-y-1.5">
                          {list.map(s => (
                            <div key={s.id} className="rounded-xl bg-secondary/60 border border-border p-2 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <button onClick={() => openSession(s)}
                                  className={`flex-1 text-left px-2 py-1.5 rounded-lg text-sm font-body truncate ${s.id === sessionId ? 'text-accent font-semibold' : 'text-foreground'}`}>
                                  {s.title || 'Conversa'}
                                </button>
                                <button onClick={() => deleteSession(s.id)} className="p-2 rounded-lg hover:bg-muted">
                                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                              </div>
                              {(s.artifacts?.length ?? 0) > 0 && (
                                <div className="flex flex-wrap gap-1 pl-2">
                                  {s.artifacts!.slice(0, 6).map(a => {
                                    const Icon = a.kind === 'flashcards' ? Layers
                                      : a.kind === 'questoes' ? HelpCircle
                                      : a.kind === 'mapa' ? GitBranch
                                      : BookOpen;
                                    const lbl = a.kind === 'flashcards' ? 'Flashcards'
                                      : a.kind === 'questoes' ? 'Questões'
                                      : a.kind === 'mapa' ? 'Mapa'
                                      : 'Termos';
                                    const colorClass = a.kind === 'flashcards' ? 'text-emerald-400'
                                      : a.kind === 'questoes' ? 'text-amber-400'
                                      : a.kind === 'mapa' ? 'text-purple-400'
                                      : 'text-sky-400';
                                    const borderClass = a.kind === 'flashcards' ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50'
                                      : a.kind === 'questoes' ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50'
                                      : a.kind === 'mapa' ? 'border-purple-500/30 bg-purple-500/10 hover:border-purple-500/50'
                                      : 'border-sky-500/30 bg-sky-500/10 hover:border-sky-500/50';
                                    return (
                                      <button key={a.id}
                                        onClick={() => { openSession(s); setTimeout(() => setActiveArtifact(a), 60); }}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full ${borderClass} border text-[10px] font-body text-foreground transition-colors`}>
                                        <Icon className={`w-3 h-3 ${colorClass}`} /> {lbl}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generation card overlay */}
          <AnimatePresence>
            {genOverlay && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center">
                <motion.div
                  initial={{ rotateY: 0, scale: 0.85, opacity: 0 }}
                  animate={{ rotateY: 360, scale: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity }}
                  className="w-40 h-56 rounded-3xl bg-gradient-to-br from-accent via-primary to-accent shadow-2xl flex items-center justify-center"
                >
                  <Sparkles className="w-12 h-12 text-accent-foreground" />
                </motion.div>
                <p className="absolute bottom-[35%] font-display text-lg font-bold text-white">{genOverlay.label}…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Artifact viewers */}
          <AnimatePresence>
            {activeArtifact?.kind === 'flashcards' && (
              <FlipFlashcards
                cards={(activeArtifact.data.cards || []) as Flashcard[]}
                onClose={() => setActiveArtifact(null)}
              />
            )}
            {activeArtifact?.kind === 'questoes' && (
              <QuestoesRunner
                questoes={(activeArtifact.data.questoes || []) as Questao[]}
                onClose={() => setActiveArtifact(null)}
              />
            )}
            {activeArtifact?.kind === 'mapa' && (
              <MapaMentalCanvas
                data={activeArtifact.data as MapaNode}
                onClose={() => setActiveArtifact(null)}
              />
            )}
            {activeArtifact?.kind === 'termos' && (
              <TermosViewer
                termos={(activeArtifact.data.termos || []) as Termo[]}
                onClose={() => setActiveArtifact(null)}
              />
            )}
            {shareText && <ShareSheet text={shareText} onClose={() => setShareText(null)} />}
          </AnimatePresence>

          <PremiumGate
            open={!!gateFeature}
            onClose={() => setGateFeature(null)}
            feature={gateFeature ?? 'chat_juridico'}
            usageLabel={gateFeature === 'chat_juridico' ? 'Você já usou sua interação gratuita de hoje' : undefined}
          />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ActionBtn = ({
  icon: Icon,
  label,
  onClick,
  colorClass = 'text-accent',
  hoverClass = 'hover:border-white/20 hover:bg-white/5',
}: {
  icon: any;
  label: string;
  onClick: () => void;
  colorClass?: string;
  hoverClass?: string;
}) => (
  <button
    onClick={() => {
      haptic.light();
      onClick();
    }}
    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 ${hoverClass} border border-white/10 text-xs font-body text-zinc-200 hover:text-white transition-all active:scale-95 touch-manipulation shadow-sm`}
  >
    <Icon className={`w-3.5 h-3.5 ${colorClass} transition-transform group-hover:scale-110 shrink-0`} strokeWidth={2.2} />
    <span className="font-medium text-[12px]">{label}</span>
  </button>
);

export default AssistenteOverlay;
