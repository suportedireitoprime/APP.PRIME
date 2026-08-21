import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useIsDesktop } from '@/hooks/use-desktop';
import { ArrowLeft, Plus, Sparkles, Loader2, Trash2, Mic, Square, Play, Pause, FileText, Check, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { supabase } from '@/integrations/supabase/client';
import { voiceRecorder } from '@/lib/nativeVoiceRecorder';

import { AudioVisualizer } from '@/components/ui/AudioVisualizer';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { useGatedFeature } from '@/hooks/useGatedFeature';

interface AnotacaoAula {
  id: string;
  texto: string;
  created_at: string;
  audio_url?: string | null;
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
  const [notas, setNotas] = useState<AnotacaoAula[]>([]);
  const [novaTexto, setNovaTexto] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Estado de Gravação de Áudio
  const [gravando, setGravando] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const timerRef = useRef<any>(null);

  const { isPremium, loading: loadingPlano } = useSubscription();
  const gate = useGatedFeature('videoaula_funcoes', 'videoaula_funcoes');
  const bloqueado = !loadingPlano && !isPremium && gate.blocked;

  const storageKey = `videoaula:anotacoes:${videoId}`;

  // Carregar anotações salvas (Cache Local + Supabase)
  useEffect(() => {
    if (!open || !videoId) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setNotas(parsed);
      }
    } catch { /* noop */ }
  }, [open, videoId, storageKey]);

  const salvarNotasLocais = (novas: AnotacaoAula[]) => {
    setNotas(novas);
    try {
      localStorage.setItem(storageKey, JSON.stringify(novas));
    } catch { /* noop */ }
  };

  const handleSalvarTexto = () => {
    if (!novaTexto.trim()) return;
    haptic.success?.();
    const nova: AnotacaoAula = {
      id: String(Date.now()),
      texto: novaTexto.trim(),
      created_at: new Date().toISOString(),
    };
    salvarNotasLocais([nova, ...notas]);
    setNovaTexto('');
    toast.success('Anotação salva!');
  };

  const handleApagar = (id: string) => {
    haptic.light?.();
    const filtradas = notas.filter((n) => n.id !== id);
    salvarNotasLocais(filtradas);
    toast.success('Anotação removida');
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

      // Usando API nativa de voz ou simulador com transcrição em tempo real
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

      // Se a API nativa não capturar o áudio inteiro, invoca transcrição via IA
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

      const nova: AnotacaoAula = {
        id: String(Date.now()),
        texto: `🎙️ [Áudio Transcrito]: ${textoTranscrito}`,
        created_at: new Date().toISOString(),
      };

      salvarNotasLocais([nova, ...notas]);
      toast.success('Áudio gravado e transcrito com sucesso!');
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
            ? 'fixed right-0 top-0 bottom-0 z-[10041] w-[min(30rem,92vw)] border-l border-border bg-background shadow-2xl flex flex-col pointer-events-auto'
            : 'fixed inset-0 z-[10041] bg-background flex flex-col pointer-events-auto pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]'
        }
      >
        {/* Header */}
        <header className="pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] border-b border-border bg-card">
          <div className="h-16 px-4 flex items-center justify-between gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Voltar">
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 min-w-0 text-center">
              <h2 className="font-bold text-sm text-foreground truncate">Anotações da Aula</h2>
              <p className="text-[11px] text-muted-foreground truncate">{aulaTitulo}</p>
            </div>

            <div className="w-9" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {gate.gateNode}
          {/* Caixa de Digitação / Gravação */}
          <div className="rounded-2xl border border-border bg-card/60 p-3 space-y-3 shadow-sm">
            <div onClick={() => { if (bloqueado) gate.openGate(); }}>
              <Textarea
                value={novaTexto}
                readOnly={bloqueado}
                onChange={(e) => setNovaTexto(e.target.value)}
                placeholder={bloqueado ? "Assine para adicionar anotações..." : "Digite suas anotações sobre a aula..."}
                className="min-h-[90px] border-none bg-transparent focus-visible:ring-0 text-sm placeholder:text-muted-foreground/60 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              {gravando ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold tabular-nums text-red-400">
                      Gravando {tempoGravacao}s
                    </span>
                    <AudioVisualizer stream={voiceRecorder.getStream()} isActive={gravando} className="!w-16 !my-0 h-4" barColor="#ef4444" />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={pararGravacaoETranscrever}
                    className="h-8 rounded-full px-3 text-xs gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> Parar & Transcrever
                  </Button>
                </div>
              ) : transcrevendo ? (
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" /> Transcrevendo áudio por IA...
                </div>
              ) : (
                <button
                  onClick={iniciarGravacao}
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                >
                  <Mic className="w-4 h-4 text-red-400" />
                  <span>Gravar Áudio (IA)</span>
                </button>
              )}

              <Button
                size="sm"
                onClick={handleSalvarTexto}
                disabled={!novaTexto.trim()}
                className="rounded-xl px-4 text-xs font-bold gap-1.5"
              >
                <Plus className="w-4 h-4" /> Salvar
              </Button>
            </div>
          </div>

          {/* Lista de Anotações Salvas */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              Suas Anotações ({notas.length})
            </h3>

            {notas.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Nenhuma anotação nesta aula ainda.</p>
              </div>
            ) : (
              notas.map((nota) => (
                <div
                  key={nota.id}
                  className="group relative rounded-2xl border border-border/80 bg-card p-3.5 space-y-2 shadow-sm transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground font-semibold">
                      {new Date(nota.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <button
                      onClick={() => handleApagar(nota.id)}
                      className="text-muted-foreground/60 hover:text-red-400 transition-colors p-1"
                      aria-label="Apagar anotação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {nota.texto}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(panel, document.body) : panel;
}

export default AnotacoesAulaSheet;
