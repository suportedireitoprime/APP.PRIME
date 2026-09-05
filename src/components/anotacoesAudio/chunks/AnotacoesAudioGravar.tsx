import React, { useState } from 'react';
import {
  Mic,
  Square,
  Loader2,
  Play,
  Radio,
  PauseCircle,
  Tag as TagIcon,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRecording, formatHms } from '@/contexts/RecordingContext';
import { motion } from 'framer-motion';
import { TAG_SUGESTOES } from './anotacoesAudioConstants';

interface AnotacoesAudioGravarProps {
  onDone: () => void;
}

export const AnotacoesAudioGravar: React.FC<AnotacoesAudioGravarProps> = ({ onDone }) => {
  const rec = useRecording();
  const isRec = rec.status === 'recording';
  const isPaused = rec.status === 'paused';
  const isSaving = rec.status === 'saving';

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleStopClick = () => {
    rec.pause();
    setTempTitle(`Aula — ${new Date().toLocaleDateString('pt-BR')}`);
    setShowSaveForm(true);
  };

  const confirmSave = async () => {
    if (tempTitle) rec.setTitle(tempTitle);
    await rec.stop();
    onDone();
  };

  const addTag = (t: string) => {
    const clean = t.trim();
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  if (showSaveForm) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6">
        <h3 className="font-display font-bold text-xl text-foreground mb-4">Salvar Gravação</h3>
        <div className="mb-4 text-center text-4xl font-mono text-primary tabular-nums">
          {formatHms(rec.elapsedMs)}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Título da Aula
            </label>
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TagIcon className="w-3 h-3" /> Etiquetas (Tags)
            </label>
            <div className="mt-1 flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ex: Constitucional, Dicas..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={() => addTag(tagInput)}>
                Adicionar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TAG_SUGESTOES.filter((t) => !tags.includes(t))
                .slice(0, 5)
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    + {t}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowSaveForm(false)}>
            Voltar à Gravação
          </Button>
          <Button onClick={confirmSave} disabled={isSaving} className="font-bold">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Confirmar e Salvar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card/50 p-8 flex flex-col items-center justify-center min-h-[400px]">
      {rec.status === 'idle' ? (
        <>
          <p className="mb-12 text-center text-sm text-muted-foreground">
            Toque para iniciar a captação do áudio da aula
          </p>
          <div className="relative flex justify-center items-center">
            <motion.div
              className="absolute w-36 h-36 bg-primary/20 rounded-full"
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Button
              size="lg"
              onClick={rec.start}
              className="h-32 w-32 rounded-full p-0 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 relative z-10 transition-transform active:scale-95"
            >
              <Mic className="h-12 w-12 text-white" strokeWidth={1.5} />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            <Radio className={`h-4 w-4 ${isRec ? 'text-red-500 animate-pulse' : ''}`} />
            {isRec ? <span className="text-red-500">Gravando</span> : isPaused ? 'Pausado' : 'Salvando…'}
          </div>

          <div className="mb-8 text-center text-6xl font-display font-bold text-primary tabular-nums drop-shadow-md">
            {formatHms(rec.elapsedMs)}
          </div>

          <div className="flex justify-center items-center gap-6">
            {isRec && (
              <Button
                size="lg"
                variant="secondary"
                onClick={rec.pause}
                className="h-16 rounded-2xl px-6 font-bold text-foreground"
              >
                <PauseCircle className="mr-2 h-6 w-6" /> Pausar
              </Button>
            )}
            {isPaused && (
              <Button
                size="lg"
                variant="secondary"
                onClick={rec.resume}
                className="h-16 rounded-2xl px-6 font-bold text-foreground"
              >
                <Play className="mr-2 h-6 w-6" /> Retomar
              </Button>
            )}
            <Button
              size="lg"
              variant="destructive"
              onClick={handleStopClick}
              disabled={isSaving}
              className="h-16 rounded-2xl px-6 font-bold shadow-lg shadow-destructive/20"
            >
              <Square className="mr-2 h-6 w-6" />
              Encerrar
            </Button>
          </div>

          {isRec && (
            <div className="flex flex-col w-full mt-8 gap-6">
              <div className="flex justify-center gap-1 items-end h-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-primary rounded-full"
                    animate={{ height: ['20%', `${Math.random() * 80 + 20}%`, '20%'] }}
                    transition={{
                      duration: Math.random() * 0.5 + 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {rec.liveText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-background/80 border border-border/50 rounded-2xl p-4 max-h-[150px] overflow-y-auto w-full mx-auto"
                >
                  <p className="text-sm italic text-muted-foreground leading-relaxed">
                    "{rec.liveText}"
                  </p>
                </motion.div>
              )}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground px-4">
            Você pode minimizar ou navegar pelo app. A gravação continuará em segundo plano (mas a
            transcrição ao vivo pode pausar caso a tela seja bloqueada).
          </p>
        </>
      )}
    </div>
  );
};
