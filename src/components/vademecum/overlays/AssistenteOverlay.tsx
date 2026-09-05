import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { pdf, Document, Page, Text as PdfText } from '@react-pdf/renderer';
import { track } from '@/lib/analyticsEvents';

import ShapeGrid from '@/components/ui/ShapeGrid';
import { useIsDesktop } from '@/hooks/use-desktop';
import {
  extractStatuteSources,
  type ChatSource,
} from '@/components/chat/ChatSources';
import { type PremiumFeatureKey } from '@/components/PremiumGate';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { baixarBlob } from '@/lib/nativo';
import { haptic } from '@/lib/nativeHaptics';
import { Capacitor } from '@capacitor/core';
import { takePhoto } from '@/lib/nativeCamera';

import {
  ArtifactKind,
  Artifact,
  Attachment,
  Message,
  Session,
  ANALYZE_STEPS,
  pickSuggestions,
  pdfStyles,
  stripMd,
  loadSessions,
  saveSessions,
} from './assistente/assistenteTypes';
import { AssistenteEmptyState } from './assistente/AssistenteEmptyState';
import { AssistenteMessageItem } from './assistente/AssistenteMessageItem';
import { AssistenteInputBar } from './assistente/AssistenteInputBar';
import { AssistenteSidebarDesktop } from './assistente/AssistenteSidebarDesktop';
import { AssistenteMobileHeader } from './assistente/AssistenteMobileHeader';
import { AssistentePowersSheet } from './assistente/AssistentePowersSheet';
import { AssistenteHistoryDrawer } from './assistente/AssistenteHistoryDrawer';
import { AssistenteArtifactModals } from './assistente/AssistenteArtifactModals';

interface Props {
  open: boolean;
  onClose: () => void;
}

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
  const [genOverlay, setGenOverlay] = useState<null | {
    kind: 'pdf' | 'flashcards' | 'questoes' | 'mapa' | 'termos';
    label: string;
  }>(null);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [shareText, setShareText] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [gateFeature, setGateFeature] = useState<PremiumFeatureKey | null>(null);
  const chatLimit = useFeatureLimit('ia_juridica');
  const podeUsarPremium = chatLimit.isPremium || chatLimit.isAdmin;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSessions(loadSessions());
    }
  }, [open]);

  // Sugestões variam cada vez que o chat abre
  const [suggestions, setSuggestions] = useState<string[]>(() => pickSuggestions(15));
  useEffect(() => {
    if (open) setSuggestions(pickSuggestions(15));
  }, [open]);

  // Ditado por voz
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

  // Persistir sessão atual
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
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      const next = [session, ...filtered];
      saveSessions(next);
      return next;
    });
  }, [messages, sessionId, artifacts]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Passos de análise
  useEffect(() => {
    if (!loading) {
      setAnalyzeStep(0);
      return;
    }
    const int = setInterval(
      () => setAnalyzeStep((s) => Math.min(s + 1, ANALYZE_STEPS.length - 1)),
      900
    );
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
    const next = sessions.filter((s) => s.id !== id);
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
  };

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Arquivo maior que 8MB');
      return;
    }
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
    if (!podeUsarPremium) {
      setGateFeature('chat_anexo');
      return;
    }
    setAttachOpen((v) => !v);
  };

  const toggleWebSearch = () => {
    if (!podeUsarPremium) {
      setGateFeature('chat_web');
      return;
    }
    setWebSearch((w) => !w);
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
      id: crypto.randomUUID(),
      role: 'user',
      content: text || (attachment ? `📎 ${attachment.name}` : ''),
      attachment: attachment || undefined,
      createdAt: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setAttachment(null);
    setLoading(true);
    const startTime = Date.now();
    const asMsgId = crypto.randomUUID();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const SUPABASE_URL =
        import.meta.env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co';
      const SUPABASE_ANON_KEY =
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

      const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/assistente-juridica`;
      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.attachment ? { attachment: { mime: m.attachment.mime, data: m.attachment.data } } : {}),
      }));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
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
          }),
        });
        if (res.ok) {
          streamOk = true;
        }
      } catch (streamErr) {
        console.warn('[Chat] Fetch stream error, will fallback to invoke:', streamErr);
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (!streamOk || !res || !res.ok) {
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
        const rawReply: string =
          data?.reply || 'Não consegui gerar uma resposta agora. Tente reformular.';
        const { text: enrichedReply, sources: statuteSources } = extractStatuteSources(
          rawReply,
          startN
        );
        const asMsg: Message = {
          id: asMsgId,
          role: 'assistant',
          content: enrichedReply,
          createdAt: Date.now(),
          sources: [...webSources, ...statuteSources],
          webSearch,
          thoughtTime: Math.max(1, elapsed),
        };
        setMessages((prev) => [...prev, asMsg]);
        return;
      }

      const contentType = res.headers.get('Content-Type') || '';

      if (!contentType.includes('text/event-stream') || !res.body) {
        const data = await res.json();
        const webSources: ChatSource[] = Array.isArray(data?.sources) ? data.sources : [];
        const startN = (webSources.length ? Math.max(...webSources.map((s) => s.n)) : 0) + 1;
        const rawReply: string =
          data?.reply || 'Não consegui gerar uma resposta agora. Tente reformular.';
        const { text: enrichedReply, sources: statuteSources } = extractStatuteSources(
          rawReply,
          startN
        );
        const asMsg: Message = {
          id: asMsgId,
          role: 'assistant',
          content: enrichedReply,
          createdAt: Date.now(),
          sources: [...webSources, ...statuteSources],
          webSearch,
          thoughtTime: Math.max(1, elapsed),
        };
        setMessages((prev) => [...prev, asMsg]);
        return;
      }

      // Streaming SSE
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: asMsgId,
          role: 'assistant',
          content: '',
          createdAt: Date.now(),
          webSearch,
          thoughtTime: Math.max(1, elapsed),
        },
      ]);

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
                setMessages((prev) =>
                  prev.map((m) => (m.id === asMsgId ? { ...m, content: fullText } : m))
                );
              }
              const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;
              if (chunks && !webSources.length) {
                webSources = chunks
                  .map((c: any, i: number) => {
                    const w = c?.web;
                    if (!w?.uri) return null;
                    let domain = '';
                    try {
                      domain = new URL(w.uri).hostname.replace(/^www\./, '');
                    } catch {}
                    return { n: i + 1, title: w.title || domain || w.uri, url: w.uri, domain };
                  })
                  .filter(Boolean) as ChatSource[];
              }
            } catch (e) {
              /* partial chunk */
            }
          }
        }
      }

      // Post-process para estatutos
      const startN = (webSources.length ? Math.max(...webSources.map((s) => s.n)) : 0) + 1;
      const { text: enrichedReply, sources: statuteSources } = extractStatuteSources(
        fullText,
        startN
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asMsgId
            ? { ...m, content: enrichedReply, sources: [...webSources, ...statuteSources] }
            : m
        )
      );
    } catch (err) {
      console.error('[Chat] Erro ao processar:', err);
      try {
        const { data: fallbackData } = await supabase.functions.invoke('assistente-juridica', {
          body: {
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            webSearch: false,
          },
        });
        if (fallbackData?.reply) {
          const { text: enrichedReply } = extractStatuteSources(fallbackData.reply, 1);
          setMessages((prev) => {
            const hasTemp = prev.some((m) => m.id === asMsgId);
            if (hasTemp) {
              return prev.map((m) => (m.id === asMsgId ? { ...m, content: enrichedReply } : m));
            }
            return [
              ...prev,
              { id: asMsgId, role: 'assistant', content: enrichedReply, createdAt: Date.now() },
            ];
          });
          return;
        }
      } catch (fallbackErr) {
        console.error('[Chat] Fallback secundario falhou:', fallbackErr);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '⚠️ Erro ao processar. Tente novamente.',
          createdAt: Date.now(),
        },
      ]);
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
            {stripMd(msg.content)
              .split('\n')
              .map((p, i) => (
                <PdfText key={i} style={pdfStyles.p}>
                  {p}
                </PdfText>
              ))}
          </Page>
        </Document>
      );
      const blob = await pdf(doc).toBlob();
      await baixarBlob(blob, 'chat-juridico.pdf', {
        titulo: 'Chat jurídico',
        toastSucesso: false,
      });
      toast.success('PDF exportado');
    } catch (e) {
      toast.error('Erro no PDF');
    } finally {
      setGenOverlay(null);
    }
  };

  const persistArtifact = (art: Artifact) => {
    setArtifacts((prev) => [art, ...prev]);
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
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
      kind === 'flashcards'
        ? 'Gerando flashcards'
        : kind === 'questoes'
        ? 'Gerando questões'
        : kind === 'termos'
        ? 'Extraindo termos jurídicos'
        : 'Gerando mapa mental';
    setGenOverlay({ kind, label });
    try {
      const mode =
        kind === 'flashcards'
          ? 'flashcards_conteudo'
          : kind === 'questoes'
          ? 'questoes_conteudo'
          : kind === 'termos'
          ? 'termos_conteudo'
          : 'mapa_conteudo';
      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: { mode, conteudo: msg.content },
      });
      if (error) throw error;
      const parsed = JSON.parse(data?.reply || '{}');
      const title =
        kind === 'mapa' ? parsed?.titulo || 'Mapa mental' : msg.content.slice(0, 60);
      const art: Artifact = {
        id: crypto.randomUUID(),
        kind,
        data: parsed,
        sourceId: msg.id,
        createdAt: Date.now(),
        title,
      };
      persistArtifact(art);
      setActiveArtifact(art);
    } catch (e) {
      console.error(e);
      toast.error('Falhou. Tente novamente.');
    } finally {
      setGenOverlay(null);
    }
  };

  const openShare = (msg: Message) => {
    const body = `📚 *Chat Jurídico*\n\n${msg.content.slice(0, 3800)}`;
    setShareText(body);
  };

  const groupedSessions = useMemo(() => {
    const g: Record<string, Session[]> = {};
    for (const s of sessions) {
      (g[s.date] ||= []).push(s);
    }
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%', pointerEvents: 'none' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={
            isDesktop
              ? 'fixed inset-0 z-[60] bg-[#07080b] flex flex-row'
              : 'fixed inset-0 z-[60] bg-[#07080b] flex flex-col'
          }
        >
          {/* Fundo com Aspecto de Profundo, Elegante e Imersivo com ShapeGrid Oficial */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-[#07080b]">
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
            <div className="absolute top-[-25%] left-[-15%] w-[130%] h-[60%] bg-[radial-gradient(ellipse_at_top,rgba(190,140,75,0.15),transparent_65%)] blur-[95px] mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[120%] h-[55%] bg-[radial-gradient(ellipse_at_bottom,rgba(140,30,45,0.14),transparent_70%)] blur-[100px] mix-blend-screen" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_40%,transparent_25%,rgba(4,5,7,0.88)_100%)]" />
          </div>

          {/* Desktop sidebar */}
          {isDesktop && (
            <AssistenteSidebarDesktop
              onClose={onClose}
              newSession={newSession}
              webSearch={webSearch}
              toggleWebSearch={toggleWebSearch}
              groupedSessions={groupedSessions}
              sessionId={sessionId}
              openSession={openSession}
              deleteSession={deleteSession}
            />
          )}

          {/* Main column */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {!isDesktop && (
              <AssistenteMobileHeader
                onClose={onClose}
                newSession={newSession}
                podeUsarPremium={podeUsarPremium}
                setGateFeature={setGateFeature}
                toggleWebSearch={toggleWebSearch}
                webSearch={webSearch}
                setHistoryOpen={setHistoryOpen}
              />
            )}

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
              <div className={isDesktop ? 'max-w-3xl mx-auto w-full' : 'contents'}>
                {messages.length === 0 && !loading && (
                  <AssistenteEmptyState
                    suggestions={suggestions}
                    onSelectSuggestion={(q) => setInput(q)}
                  />
                )}

                {(messages.length > 0 || loading) && (
                  <div className="w-full flex flex-col space-y-4 pb-6">
                    {messages.map((msg) => (
                      <AssistenteMessageItem
                        key={msg.id}
                        msg={msg}
                        isDesktop={isDesktop}
                        sessionId={sessionId}
                        allMessages={messages}
                        onExportPdf={exportPdf}
                        onGenerateArtifact={generateFromMsg}
                        onOpenShare={openShare}
                      />
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
                                  <span
                                    className={
                                      done
                                        ? 'text-muted-foreground/80'
                                        : 'text-foreground font-medium animate-pulse'
                                    }
                                  >
                                    {step}
                                  </span>
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

            {/* Input area */}
            <AssistenteInputBar
              input={input}
              setInput={setInput}
              loading={loading}
              onSendMessage={sendMessage}
              attachment={attachment}
              setAttachment={setAttachment}
              attachOpen={attachOpen}
              setAttachOpen={setAttachOpen}
              onAbrirAnexos={abrirAnexos}
              onTirarFoto={handleTirarFoto}
              onFileSelected={handleFile}
              isDesktop={isDesktop}
              voice={voice}
              onToggleMic={toggleMic}
            />
          </div>

          <AssistentePowersSheet
            powersOpen={powersOpen}
            setPowersOpen={setPowersOpen}
            webSearch={webSearch}
            toggleWebSearch={toggleWebSearch}
          />

          <AssistenteHistoryDrawer
            historyOpen={historyOpen}
            setHistoryOpen={setHistoryOpen}
            newSession={newSession}
            groupedSessions={groupedSessions}
            openSession={openSession}
            deleteSession={deleteSession}
            sessionId={sessionId}
            setActiveArtifact={setActiveArtifact}
          />

          <AssistenteArtifactModals
            genOverlay={genOverlay}
            activeArtifact={activeArtifact}
            setActiveArtifact={setActiveArtifact}
            shareText={shareText}
            setShareText={setShareText}
            gateFeature={gateFeature}
            setGateFeature={setGateFeature}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssistenteOverlay;
