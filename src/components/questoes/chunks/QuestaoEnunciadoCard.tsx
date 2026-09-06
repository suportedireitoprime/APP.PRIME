import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import type { Questao } from '@/hooks/useQuestoes';
import { QuestaoAcoesBar } from '@/components/questoes/QuestaoAcoesBar';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';

interface QuestaoEnunciadoCardProps {
  atual: Questao;
  idx: number;
  totalQuestoes: number;
  swipeDir: number;
  resp?: { escolha: string; acertou: boolean };
  correta: string;
  selecao: string | null;
  eliminadasAtuais: Set<string>;
  recursosAberto: boolean;
  abaAtiva: 'texto' | 'questao';
  alternativas: Array<{ letra: string; texto: string }>;
  onSwipe: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  onToggleRecursos: () => void;
  onSetAbaAtiva: (aba: 'texto' | 'questao') => void;
  onSelectAlternativa: (letra: string) => void;
  onLongPressStart: (letra: string) => void;
  onLongPressEnd: () => void;
}

export function QuestaoEnunciadoCard({
  atual,
  idx,
  totalQuestoes,
  swipeDir,
  resp,
  correta,
  selecao,
  eliminadasAtuais,
  recursosAberto,
  abaAtiva,
  alternativas,
  onSwipe,
  onToggleRecursos,
  onSetAbaAtiva,
  onSelectAlternativa,
  onLongPressStart,
  onLongPressEnd,
}: QuestaoEnunciadoCardProps) {
  return (
    <AnimatePresence mode="wait" custom={swipeDir}>
      <motion.div
        key={atual.id}
        custom={swipeDir}
        initial={{ opacity: 0, x: swipeDir * 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: swipeDir * -40 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        drag={resp ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={onSwipe}
        className="flex flex-col touch-pan-y"
      >
        <div className="flex items-end justify-between border-b border-border/50 pb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[36px] font-extrabold leading-none text-foreground tracking-tight">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="text-[16px] font-medium text-muted-foreground">de {totalQuestoes}</span>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onToggleRecursos}
              className="relative overflow-hidden flex h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-[14px] font-semibold text-primary transition-colors hover:bg-primary/20 active:scale-95"
            >
              <Plus className="h-4 w-4 z-10" />
              <span className="z-10">Recursos</span>
              <motion.div
                key={atual.id}
                initial={{ x: '-150%' }}
                animate={{ x: '150%' }}
                transition={{ duration: 0.7, ease: 'easeInOut', delay: 0.3 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent skew-x-12 z-0"
              />
            </button>
          </div>
        </div>

        {/* Questões Ações Bar - Slide Down when Recursos is open */}
        <AnimatePresence>
          {recursosAberto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border/50"
            >
              <div className="py-4">
                <QuestaoAcoesBar source={atual.id} chaveRevisao={atual.id} layout="horizontal" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-1.5 pt-4 pb-5 text-[14px] text-muted-foreground/90">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {atual.ano && <span><strong className="font-semibold text-foreground/80">Ano:</strong> {atual.ano}</span>}
            {atual.banca && <span><strong className="font-semibold text-foreground/80">Banca:</strong> {atual.banca}</span>}
          </div>
          {atual.assunto && (
            <div>
              <strong className="font-semibold text-foreground/80">Assunto:</strong> {atual.assunto}
            </div>
          )}
        </div>

        {atual.texto_associado && (
          <div className="mb-6 flex w-full max-w-[400px] items-center gap-1 rounded-xl bg-muted/50 p-1">
            <button
              onClick={() => onSetAbaAtiva('texto')}
              className={cn(
                'flex-1 rounded-lg py-2 text-[14px] font-bold transition-all',
                abaAtiva === 'texto' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Texto
            </button>
            <button
              onClick={() => onSetAbaAtiva('questao')}
              className={cn(
                'flex-1 rounded-lg py-2 text-[14px] font-bold transition-all',
                abaAtiva === 'questao' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Questão
            </button>
          </div>
        )}

        {abaAtiva === 'texto' && atual.texto_associado ? (
          <motion.div
            key="texto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col pb-6"
          >
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 text-[16px] leading-[1.75] text-muted-foreground whitespace-pre-wrap shadow-sm">
              {atual.texto_associado}
            </div>
            <button
              onClick={() => onSetAbaAtiva('questao')}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            >
              Ir para Questão <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="questao"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-4 pb-6">
              <p className="text-[16.5px] font-normal leading-[1.75] text-foreground sm:text-[17.5px] whitespace-pre-wrap">
                {atual.enunciado}
              </p>
            </div>

            <div className="space-y-3">
              {alternativas.map((op) => {
                const escolhida = selecao === op.letra;
                const revela = !!resp && op.letra === correta;
                const errou = !!resp && resp.escolha === op.letra && !resp.acertou;
                const riscada = eliminadasAtuais.has(op.letra);
                return (
                  <button
                    key={op.letra}
                    disabled={!!resp || riscada}
                    onClick={() => onSelectAlternativa(op.letra)}
                    onPointerDown={() => onLongPressStart(op.letra)}
                    onPointerUp={onLongPressEnd}
                    onPointerLeave={onLongPressEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    className={cn(
                      'relative flex min-h-[60px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all select-none',
                      revela
                        ? 'border-green-500 bg-green-500/10'
                        : errou
                        ? 'border-red-500 bg-red-500/10'
                        : riscada
                        ? 'border-border/30 bg-muted/20 opacity-40'
                        : escolhida
                        ? 'border-primary bg-primary/5'
                        : 'border-border/60 bg-muted/40 hover:border-border hover:bg-accent/50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold',
                        revela
                          ? 'bg-green-500 text-white'
                          : errou
                          ? 'bg-red-500 text-white'
                          : escolhida
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-foreground/5 text-foreground/60',
                      )}
                    >
                      {op.letra}
                    </span>
                    <span
                      className={cn(
                        'flex-1 text-[16px] leading-[1.5] text-foreground/90',
                        riscada && 'line-through text-muted-foreground/50',
                      )}
                    >
                      {op.texto}
                    </span>
                    {/* Linha diagonal de eliminação */}
                    {riscada && !resp && (
                      <div className="absolute inset-y-0 left-4 right-4 flex items-center pointer-events-none">
                        <div className="h-[2px] w-full bg-red-500/40 rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
              {!resp && (
                <p className="text-center text-[12px] text-muted-foreground/50 pt-1">
                  Segure para eliminar uma alternativa
                </p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
