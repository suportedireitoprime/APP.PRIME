import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Scale, Sparkles, AlertTriangle, Minus, Plus, Type, X,
} from 'lucide-react';
import { useQuestaoAcao, type QuestaoInline } from '@/hooks/useQuestaoAcao';
import { Overlay, Md, Checklist, Erro } from './QuestaoAcaoOverlay';
import { cn } from '@/lib/utils';

export type Fonte = string | QuestaoInline;

const FS_KEY = 'questoes:comentario-fs';
const FS_MIN = 15;
const FS_MAX = 24;

/** Botão flutuante "T" que expande em - / + para ajustar o tamanho do texto. */
export function TamanhoTextoFab({ fs, setFs }: { fs: number; setFs: (n: number) => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-[90] flex items-center gap-2 sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, x: 16, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-xl backdrop-blur"
          >
            <button
              type="button"
              aria-label="Diminuir texto"
              onClick={() => setFs(Math.max(FS_MIN, fs - 1))}
              disabled={fs <= FS_MIN}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-[12px] font-semibold tabular-nums text-muted-foreground">{fs}</span>
            <button
              type="button"
              aria-label="Aumentar texto"
              onClick={() => setFs(Math.min(FS_MAX, fs + 1))}
              disabled={fs >= FS_MAX}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-label="Tamanho do texto"
        onClick={() => setAberto((v) => !v)}
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform active:scale-95"
      >
        {aberto ? <X className="h-5 w-5" /> : <Type className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function ComentarioInner({ source }: { source: Fonte }) {
  const [view, setView] = useState<'correta' | 'erradas'>('correta');
  const [fs, setFsState] = useState(17);
  const { data, isLoading, error, refetch } = useQuestaoAcao(source, 'comentario', true);
  const erradasQ = useQuestaoAcao(source, 'lei-erradas', view === 'erradas');
  const erradas: any[] = erradasQ.data?.erradas ?? [];

  useEffect(() => {
    const salvo = Number(localStorage.getItem(FS_KEY));
    if (salvo >= FS_MIN && salvo <= FS_MAX) setFsState(salvo);
  }, []);

  const setFs = (n: number) => {
    setFsState(n);
    localStorage.setItem(FS_KEY, String(n));
  };
  const mdClass = 'text-[1em] prose-headings:text-[1.02em]';

  return (
    <div className="space-y-3" style={{ fontSize: `${fs}px` }}>
      <TamanhoTextoFab fs={fs} setFs={setFs} />

      <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/40 p-1">
        {(['correta', 'erradas'] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              'h-9 rounded-full text-[12px] font-semibold transition-colors',
              view === v ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {v === 'correta' ? 'Resposta correta' : 'Outras alternativas'}
          </button>
        ))}
      </div>

      {view === 'correta' && (
        <>
          {isLoading && (
            <Checklist
              passos={[
                'Lendo o enunciado e o gabarito',
                'Localizando a base legal aplicável',
                'Montando a explicação didática',
                'Formatando o comentário',
              ]}
            />
          )}
          {error && !isLoading && <Erro onRetry={() => refetch()} />}
          {!isLoading && !error && data && (
            <div className="space-y-3">
              <Md texto={data.texto} className={mdClass} />
              {data.fundamento && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    <Scale className="h-3 w-3" /> Fundamento
                  </p>
                  <Md texto={data.fundamento} className={mdClass} />
                </div>
              )}
              {data.dica && (
                <div className="rounded-xl border-l-2 border-primary bg-muted/50 px-4 py-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" /> Dica de prova
                  </p>
                  <Md texto={data.dica} className={mdClass} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {view === 'erradas' && (
        <>
          {erradasQ.isLoading && (
            <Checklist
              passos={[
                'Separando as alternativas que não são o gabarito',
                'Confrontando cada uma com a lei e a jurisprudência',
                'Identificando o erro central de cada alternativa',
                'Escrevendo as explicações',
              ]}
            />
          )}
          {erradasQ.error && !erradasQ.isLoading && <Erro onRetry={() => erradasQ.refetch()} />}
          {!erradasQ.isLoading && !erradasQ.error && erradas.length === 0 && erradasQ.data && (
            <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
              Não foi possível identificar alternativas erradas para explicar.
            </p>
          )}

          {erradas.length > 0 && (
            <div className="space-y-2.5">
              {erradas.map((e, i) => (
                <motion.div
                  key={`${e.letra}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="overflow-hidden rounded-xl border border-destructive/25 bg-background/40"
                >
                  <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-destructive/40 bg-destructive/20 text-xs font-bold text-destructive">
                        {e.letra}
                      </span>
                      {e.dispositivo_chave && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {e.dispositivo_chave}
                        </span>
                      )}
                    </div>
                    {e.texto && <p className="text-[0.95em] italic leading-relaxed text-foreground/80">"{e.texto}"</p>}
                  </div>
                  <div className="bg-foreground/[0.03] px-4 py-3">
                    <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" /> Por que está errada
                    </p>
                    <Md texto={e.motivo} className={cn(mdClass, 'leading-relaxed')} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Sheet inferior do comentário, com abas "Resposta correta" e "Outras alternativas". */
export function ComentarioSheet({
  aberto,
  source,
  onClose,
}: {
  aberto: boolean;
  source: Fonte;
  onClose: () => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {aberto && (
        <Overlay onClose={onClose} titulo="Comentário" icone={MessageSquare}>
          <ComentarioInner source={source} />
        </Overlay>
      )}
    </AnimatePresence>,
    document.body,
  );
}
