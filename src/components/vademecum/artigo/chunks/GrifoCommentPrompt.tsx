import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Mic, Square, Play, Pause, Trash2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Highlight } from '@/hooks/useHighlights';

interface GrifoCommentPromptProps {
  commentPrompt: { id: string; show: boolean; mode: 'create' | 'view' } | null;
  highlights: Highlight[];
  selectedColor: string;
  commentText: string;
  setCommentText: (text: string) => void;
  commentTags: string[];
  setCommentTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagDraft: string;
  setTagDraft: (text: string) => void;
  isGeneratingAiNote: boolean;
  handleGerarAnotacaoIa: () => void;
  handleDismissComment: () => void;
  handleSaveComment: () => void;
  removeHighlight: (id: string) => void;
  addTagFromDraft: () => void;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: Array<Array<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const GrifoCommentPrompt = ({
  commentPrompt,
  highlights,
  selectedColor,
  commentText,
  setCommentText,
  commentTags,
  setCommentTags,
  tagDraft,
  setTagDraft,
  isGeneratingAiNote,
  handleGerarAnotacaoIa,
  handleDismissComment,
  handleSaveComment,
  removeHighlight,
  addTagFromDraft,
}: GrifoCommentPromptProps) => {
  // Item 10: Gravação de Notas por Voz com Transcrição Local e Mini Audio Player
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activePromptIdRef = useRef<string | null>(null);

  // Limpeza de recursos e gravação quando fecha o modal ou troca o grifo ativo
  const stopVoiceRecording = (discard = false) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (discard) {
          audioChunksRef.current = [];
        }
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecordingVoice(false);
  };

  useEffect(() => {
    if (!commentPrompt?.show || (commentPrompt && commentPrompt.id !== activePromptIdRef.current)) {
      stopVoiceRecording(true);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setIsPlayingAudio(false);
      setRecordingSeconds(0);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      activePromptIdRef.current = commentPrompt?.id ?? null;
    }
  }, [commentPrompt, audioUrl]);

  useEffect(() => {
    return () => {
      stopVoiceRecording(true);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startVoiceRecording = async () => {
    if (isRecordingVoice) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 1. Gravação local de áudio para reprodução
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      // 2. Reconhecimento de fala no dispositivo via Web Speech API
      const winWithSpeech = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      };
      const SR = winWithSpeech.SpeechRecognition || winWithSpeech.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.lang = 'pt-BR';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event: { resultIndex: number; results: Array<Array<{ transcript: string }> & { isFinal?: boolean }> }) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const r = event.results[i];
            if (r.isFinal) {
              finalTranscript += r[0].transcript + ' ';
            }
          }
          if (finalTranscript.trim()) {
            setCommentText(
              commentText.trim()
                ? `${commentText.trim()} ${finalTranscript.trim()}`
                : finalTranscript.trim()
            );
          }
        };

        rec.onerror = (e: unknown) => {
          console.warn('SpeechRecognition error:', e);
        };

        rec.onend = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
              rec.start();
            } catch {}
          }
        };

        speechRecRef.current = rec;
        try {
          rec.start();
        } catch {}
      }

      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Adiciona automaticamente a tag #voz
      setCommentTags((prev) => (prev.includes('voz') ? prev : [...prev, 'voz']));
      import('@/lib/nativeHaptics').then(({ haptic }) => haptic.selection()).catch(() => {});
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error('Não foi possível acessar o microfone para gravação de voz');
    }
  };

  const togglePlayAudio = () => {
    if (!audioElementRef.current || !audioUrl) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioElementRef.current) {
      setAudioCurrentTime(audioElementRef.current.currentTime);
      setAudioDuration(audioElementRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
  };

  const removeRecordedAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return createPortal(
    <AnimatePresence>
      {commentPrompt?.show && (() => {
        const currentHl = highlights.find((h) => h.id === commentPrompt.id);
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
                    onClick={() => {
                      if (currentHl) {
                        removeHighlight(currentHl.id);
                        handleDismissComment();
                      }
                    }}
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

                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground">Anotação</span>
                  <div className="flex items-center gap-2">
                    {/* Botão de Gravação de Voz */}
                    <button
                      type="button"
                      onClick={isRecordingVoice ? () => stopVoiceRecording(false) : startVoiceRecording}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        isRecordingVoice
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                          : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                      }`}
                    >
                      {isRecordingVoice ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                          <span>Parar ({formatTimer(recordingSeconds)})</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Gravar por voz</span>
                        </>
                      )}
                    </button>

                    {/* Botão de Gerar com IA */}
                    <button
                      type="button"
                      disabled={isGeneratingAiNote || isRecordingVoice}
                      onClick={handleGerarAnotacaoIa}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/15 text-primary hover:bg-primary/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAiNote ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{isGeneratingAiNote ? 'Gerando...' : 'Gerar com IA'}</span>
                    </button>
                  </div>
                </div>

                {/* Player de Prévia do Áudio Gravado */}
                {audioUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/80">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-transform shrink-0"
                      aria-label={isPlayingAudio ? 'Pausar áudio gravado' : 'Ouvir áudio gravado'}
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-primary" />
                          Áudio da Nota
                        </span>
                        <span className="font-mono text-[11px]">
                          {formatTimer(audioCurrentTime)} / {formatTimer(audioDuration || recordingSeconds)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-100"
                          style={{
                            width: `${audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeRecordedAudio}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir áudio gravado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <audio
                      ref={audioElementRef}
                      src={audioUrl}
                      onTimeUpdate={handleAudioTimeUpdate}
                      onLoadedMetadata={handleAudioTimeUpdate}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />
                  </div>
                )}

                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva sua anotação, dite por voz ou gere com IA..."
                  className="w-full flex-1 min-h-[160px] sm:min-h-[120px] bg-secondary/60 border border-border rounded-2xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={6}
                />

                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {commentTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-xs font-semibold px-2.5 py-1.5"
                      >
                        {t === 'voz' && <Mic className="w-3 h-3 text-emerald-400" />}
                        #{t}
                        <button
                          onClick={() => setCommentTags((prev) => prev.filter((x) => x !== t))}
                          className="opacity-70 hover:opacity-100 ml-0.5"
                          aria-label={`Remover tag ${t}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addTagFromDraft();
                        }
                      }}
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

              <div className="flex gap-2.5 pt-4 mt-auto border-t border-border/50 shrink-0 pb-[max(1.5rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))]">
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
  );
};
