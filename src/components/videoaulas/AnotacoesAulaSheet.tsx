import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useIsDesktop } from '@/hooks/use-desktop';
import { ArrowLeft, Loader2, Mic, Square, Edit3, BookOpen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { voiceRecorder } from '@/lib/nativeVoiceRecorder';
import { AudioVisualizer } from '@/components/ui/AudioVisualizer';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { getAprenderCacheEntry, setAprenderCache } from '@/services/offlineDb';
import ReactMarkdown from 'react-markdown';

export interface CadernoDocument {
  videoId: string;
  texto: string;
  updated_at: string;
}

interface AnotacoesAulaSheetProps {
  open: boolean;
  onClose: () => void;
  videoId: string;
  aulaTitulo: string;
  areaSlug?: string;
}

export function AnotacoesAulaSheet({
  open,
  onClose,
  videoId,
  aulaTitulo,
}: AnotacoesAulaSheetProps) {
  const isDesktop = useIsDesktop();
  const [texto, setTexto] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Estado de Gravação de Áudio
  const [gravando, setGravando] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const timerRef = useRef<any>(null);

  const { isPremium, loading: loadingPlano } = useSubscription();
  const gate = useGatedFeature('videoaula_funcoes', 'videoaula_funcoes');
  const bloqueado = !loadingPlano && !isPremium && gate.blocked;

  const storageKey = `videoaula:anotacoes:${videoId}`;

  // Carregar anotações salvas (IndexedDB + Migração LocalStorage)
  useEffect(() => {
    if (!open || !videoId) return;
    
    let isMounted = true;
    
    const carregar = async () => {
      setCarregando(true);
      try {
        const cache = await getAprenderCacheEntry<CadernoDocument>(storageKey);
        if (cache && cache.payload && typeof cache.payload.texto === 'string') {
          if (isMounted) {
            setTexto(cache.payload.texto);
            setIsEditing(cache.payload.texto.trim() === '');
          }
        } else {
          // Migração do localStorage antigo se existir
          const raw = localStorage.getItem(storageKey);
          let migratedText = '';
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                migratedText = parsed
                  .map(n => n.texto)
                  .reverse()
                  .join('\n\n---\n\n');
                localStorage.removeItem(storageKey); // Limpa o velho
              }
            } catch { /* noop */ }
          }
          if (isMounted) {
            setTexto(migratedText);
            setIsEditing(migratedText.trim() === '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setCarregando(false);
      }
    };
    carregar();
    
    return () => { isMounted = false; };
  }, [open, videoId, storageKey]);

  // Auto-Save com Debounce
  const debounceRef = useRef<any>(null);
  const salvarNoBanco = useCallback((novoTexto: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const doc: CadernoDocument = {
        videoId,
        texto: novoTexto,
        updated_at: new Date().toISOString(),
      };
      setAprenderCache(storageKey, 'aula', doc).catch(console.error);
    }, 1000);
  }, [videoId, storageKey]);

  const handleTextoChange = (val: string) => {
    setTexto(val);
    salvarNoBanco(val);
  };

  // Gravador de Voz com Transcrição Automática por IA
  const iniciarGravacao = async () => {
    if (bloqueado) {
      gate.openGate();
      return;
    }
    try {
      haptic.medium?.();
      setTempoGravacao(0);
      setGravando(true);
      timerRef.current = setInterval(() => {
        setTempoGravacao((prev) => prev + 1);
      }, 1000);

      if (voiceRecorder.isAvailable()) {
        await voiceRecorder.start();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao iniciar gravador de áudio');
      setGravando(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const pararGravacaoETranscrever = async () => {
    try {
      haptic.success?.();
      setGravando(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setTranscrevendo(true);

      let textoTranscrito = '';
      if (voiceRecorder.isAvailable()) {
        const res = await voiceRecorder.stop();
        textoTranscrito = (res as { transcript?: string }).transcript || '';
      }

      if (!textoTranscrito) {
        const { data } = await supabase.functions.invoke('assistente-juridica', {
          body: {
            mode: 'transcrever-audio',
            aulaTitulo,
            duracaoSegundos: tempoGravacao,
          },
        });
        if (data?.reply) textoTranscrito = data.reply;
      }

      if (!textoTranscrito) {
        textoTranscrito = `Anotação em áudio gravada em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${tempoGravacao}s).`;
      }

      const append = `\n\n🎙️ **Áudio Transcrito**:\n> ${textoTranscrito}\n\n`;
      const novoTexto = texto + append;
      setTexto(novoTexto);
      salvarNoBanco(novoTexto);
      toast.success('Áudio transcrito e adicionado!');
      
      // Força modo edição
      setIsEditing(true);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao transcrever áudio');
    } finally {
      setTranscrevendo(false);
      setTempoGravacao(0);
    }
  };

  if (!open) return null;

  const panel = (
    <AnimatePresence>
      <motion.div
        key="anotacoes-aula-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, pointerEvents: 'none' }}
        onClick={onClose}
        className="fixed inset-0 z-[10040] bg-black/60 backdrop-blur-sm pointer-events-auto touch-none"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%', pointerEvents: 'none' }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className={
          isDesktop
            ? 'fixed right-0 top-0 bottom-0 z-[10041] w-[min(40rem,95vw)] border-l border-border bg-background shadow-2xl flex flex-col pointer-events-auto'
            : 'fixed inset-0 z-[10041] bg-background flex flex-col pointer-events-auto pb-[calc(1.25rem+var(--sai-bottom))]'
        }
      >
        {/* Header */}
        <header className="pt-[calc(1rem+var(--sai-top))] border-b border-border bg-card shrink-0">
          <div className="h-16 px-4 flex items-center justify-between gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Voltar">
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 min-w-0 text-center">
              <h2 className="font-bold text-sm text-foreground truncate">Caderno do Aluno</h2>
              <p className="text-[11px] text-muted-foreground truncate">{aulaTitulo}</p>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                haptic.selection?.();
                setIsEditing(!isEditing);
              }}
              className={isEditing ? 'text-primary' : 'text-muted-foreground'}
            >
              {isEditing ? <BookOpen className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Action Bar (Audio / AI) */}
        <div className="px-4 py-2 border-b border-border/50 bg-card/40 flex items-center shrink-0">
           {gravando ? (
              <div className="flex items-center gap-3 flex-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-bold tabular-nums text-red-400">
                    Gravando {tempoGravacao}s
                  </span>
                  <AudioVisualizer stream={voiceRecorder.getStream()} isActive={gravando} className="!w-24 !my-0 h-4" barColor="#ef4444" />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={pararGravacaoETranscrever}
                  className="h-8 rounded-full px-3 text-xs gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current" /> Transcrever
                </Button>
              </div>
            ) : transcrevendo ? (
              <div className="flex items-center gap-2 text-xs text-primary font-medium w-full justify-center py-1">
                <Loader2 className="w-4 h-4 animate-spin" /> Transcrevendo áudio por IA...
              </div>
            ) : (
              <button
                onClick={iniciarGravacao}
                type="button"
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 mx-auto"
              >
                <Mic className="w-4 h-4 text-red-400" />
                <span>Gravar Áudio (Transcrição IA)</span>
              </button>
            )}
        </div>

        {/* Content (Editor / Viewer) */}
        <div className="flex-1 overflow-y-auto bg-background/50 relative">
          {gate.gateNode}
          {carregando ? (
             <div className="flex items-center justify-center h-full">
               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
             </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full min-h-full flex flex-col p-5 sm:p-6 lg:p-8" onClick={() => { if (bloqueado) gate.openGate(); }}>
              {isEditing || bloqueado ? (
                <Textarea
                  value={texto}
                  readOnly={bloqueado}
                  onChange={(e) => handleTextoChange(e.target.value)}
                  placeholder={bloqueado ? "Assine para usar o caderno..." : "Escreva suas anotações aqui...\n\nVocê pode usar formatação Markdown (ex: **negrito**, *itálico*, - lista). O salvamento é automático!"}
                  className="flex-1 min-h-[50vh] border-none bg-transparent focus-visible:ring-0 text-[15px] leading-relaxed resize-none p-0 placeholder:text-muted-foreground/40 font-mono shadow-none"
                  autoFocus={!bloqueado && isEditing}
                />
              ) : (
                <div 
                  className="prose prose-invert prose-p:leading-relaxed prose-sm sm:prose-base max-w-none pb-20 cursor-text"
                  onClick={() => setIsEditing(true)}
                >
                  {texto.trim() ? (
                    <ReactMarkdown>{texto}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground/50 italic text-center mt-10">
                      Nenhuma anotação. Clique para começar a escrever.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(panel, document.body) : panel;
}

export default AnotacoesAulaSheet;
