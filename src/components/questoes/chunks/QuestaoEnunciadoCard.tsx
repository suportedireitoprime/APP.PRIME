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
              className="relative overflow-hidden flex h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-[14px] font-semibold text-primary transition-colors hover:bg-primary/20 active:opacity-70"
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

        <div className="flex flex-col gap-2.5 pt-4 pb-6 text-[13px]">
          <div className="flex flex-wrap gap-2">
            {atual.ano && <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-medium">Ano: <span className="text-white font-semibold">{atual.ano}</span></span>}
            {atual.banca && <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-medium">Banca: <span className="text-white font-semibold">{atual.banca}</span></span>}
          </div>
          {atual.assunto && (
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 leading-relaxed">
              <span className="font-semibold text-white/70 mr-1">Assunto:</span> {atual.assunto}
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
              <p className="text-[16.5px] font-normal leading-[1.75] text-zinc-100 sm:text-[17.5px] whitespace-pre-wrap">
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
                      'group relative flex min-h-[64px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all select-none overflow-hidden',
                      revela
                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]'
                        : errou
                        ? 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]'
                        : riscada
                        ? 'border-white/5 bg-white/5 opacity-40'
                        : escolhida
                        ? 'border-[rgb(var(--tema-rgb))] bg-[rgba(var(--tema-rgb),0.12)] shadow-[0_0_20px_-5px_rgba(var(--tema-rgb),0.3)]'
                        : 'border-white/10 bg-zinc-900/40 hover:border-white/20 hover:bg-zinc-900/80',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold transition-all shadow-sm',
                        revela
                          ? 'bg-emerald-500 text-white'
                          : errou
                          ? 'bg-rose-500 text-white'
                          : riscada
                          ? 'bg-white/10 text-white/30'
                          : escolhida
                          ? 'bg-[rgb(var(--tema-rgb))] text-white shadow-md'
                          : 'bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white',
                      )}
                    >
                      {op.letra}
                    </span>
                    <span
                      className={cn(
                        'flex-1 text-[15.5px] leading-[1.6] text-zinc-300 transition-colors',
                        (escolhida || revela || errou) && 'text-zinc-100',
                        riscada && 'line-through text-white/30',
                      )}
                    >
                      {op.texto}
                    </span>
                    {/* Linha diagonal de eliminação */}
                    {riscada && !resp && (
                      <div className="absolute inset-y-0 left-4 right-4 flex items-center pointer-events-none">
                        <div className="h-[2px] w-full bg-rose-500/40 rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
              {!resp && (
                <p className="text-center text-[13px] text-zinc-500/80 pt-2 font-medium">
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
