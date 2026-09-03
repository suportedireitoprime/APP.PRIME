import { motion } from 'framer-motion';
import { Check, Flame, Lock, Play, Layers, Sparkles, Trophy, BookOpen, ArrowRight } from 'lucide-react';
import { DesafioDeckPronto } from '@/config/flashcardsDesafiosDecks';
import { haptic } from '@/lib/nativeHaptics';

interface DesafiosTimelineProps {
  decks: DesafioDeckPronto[];
  corArea: string;
  isDeckConcluido: (deckId: string) => boolean;
  isDeckDesbloqueado: (deck: DesafioDeckPronto, decks: DesafioDeckPronto[]) => boolean;
  onPraticarDeck: (deck: DesafioDeckPronto) => void;
}

export const DesafiosTimeline = ({
  decks,
  corArea,
  isDeckConcluido,
  isDeckDesbloqueado,
  onPraticarDeck,
}: DesafiosTimelineProps) => {
  return (
    <div className="relative pl-6 sm:pl-10 space-y-8 my-6">
      {/* Linha vertical mestra da linha do tempo */}
      <div
        className="absolute left-[17px] sm:left-[25px] top-6 bottom-6 w-[3px] rounded-full pointer-events-none transition-colors duration-500"
        style={{
          background: `linear-gradient(to bottom, ${corArea}, ${corArea}55, hsl(var(--border)))`,
        }}
      />

      {decks.map((deck, idx) => {
        const concluido = isDeckConcluido(deck.id);
        const desbloqueado = isDeckDesbloqueado(deck, decks);
        const isAtual = desbloqueado && !concluido;
        const isUltimo = idx === decks.length - 1;

        return (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className="relative"
          >
            {/* Nó marcador na linha do tempo */}
            <div
              className={`absolute -left-[27px] sm:-left-[35px] top-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                concluido
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : isAtual
                  ? 'border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse'
                  : 'bg-card border-border/70 text-muted-foreground/50'
              }`}
              style={{
                backgroundColor: isAtual ? corArea : undefined,
                borderColor: isAtual ? '#ffffff' : concluido ? undefined : undefined,
              }}
            >
              {concluido ? (
                <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.8]" />
              ) : isAtual ? (
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
              ) : (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/60" />
              )}
            </div>

            {/* Card do Deck */}
            <div
              className={`rounded-3xl border transition-all duration-300 relative overflow-hidden p-5 sm:p-6 ${
                isAtual
                  ? 'bg-card/95 border-border shadow-xl backdrop-blur-md'
                  : concluido
                  ? 'bg-card/80 border-emerald-500/20'
                  : 'bg-card/40 border-border/40 opacity-70'
              }`}
              style={
                isAtual
                  ? {
                      boxShadow: `0 8px 32px -4px ${corArea}25, 0 2px 10px rgba(0,0,0,0.5)`,
                      borderColor: `${corArea}66`,
                    }
                  : undefined
              }
            >
              {/* Brilho decorativo de fundo */}
              {isAtual && (
                <div
                  className="absolute -right-16 -top-16 w-44 h-44 rounded-full pointer-events-none opacity-20 blur-3xl"
                  style={{ background: corArea }}
                />
              )}

              {/* Cabeçalho do Card */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
                    style={{
                      background: `${corArea}20`,
                      color: corArea,
                    }}
                  >
                    Deck {String(deck.ordem).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                    {deck.nivel}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Layers className="w-3.5 h-3.5" />
                  <span>~{deck.cardsEstimados} cards</span>
                </div>
              </div>

              {/* Título e Subtítulo */}
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground leading-snug tracking-tight">
                {deck.titulo}
              </h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                {deck.subtitulo}
              </p>

              {/* Rodapé do Card com Ação */}
              <div className="mt-5 pt-3 border-t border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {concluido ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Concluído 🎉
                    </span>
                  ) : isAtual ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: corArea }}
                    >
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Desafio Atual
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
                      <Lock className="w-3.5 h-3.5" />
                      Bloqueado · Conclua o deck anterior
                    </span>
                  )}
                </div>

                {desbloqueado && (
                  <button
                    onClick={() => {
                      haptic.selection();
                      onPraticarDeck(deck);
                    }}
                    className={`h-11 sm:h-12 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      isAtual
                        ? 'text-white shadow-lg'
                        : 'bg-white/5 hover:bg-white/10 text-foreground border border-white/10'
                    }`}
                    style={
                      isAtual
                        ? {
                            background: corArea,
                            boxShadow: `0 4px 18px ${corArea}55`,
                          }
                        : undefined
                    }
                  >
                    {concluido ? (
                      <>
                        <span>Revisar deck</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Praticar agora</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
