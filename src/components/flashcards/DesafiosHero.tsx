import { useEffect, useState } from 'react';
import { Play, Trophy, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DesafioDeckPronto } from '@/config/flashcardsDesafiosDecks';
import { haptic } from '@/lib/nativeHaptics';
import q1 from '@/assets/questoes-hero/q-1.png';
import q2 from '@/assets/questoes-hero/q-2.png';
import q3 from '@/assets/questoes-hero/q-3.png';

const FIGURAS = [q1, q2, q3];

interface DesafiosHeroProps {
  porcentagemGlobal: number;
  totalConcluidos: number;
  totalDecks: number;
  desafioAtual: DesafioDeckPronto | null;
  onContinuar: (deck: DesafioDeckPronto) => void;
}

export const DesafiosHero = ({
  porcentagemGlobal = 0,
  totalConcluidos = 0,
  totalDecks = 0,
  desafioAtual,
  onContinuar,
}: DesafiosHeroProps) => {
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setHeroIdx((i) => (i + 1) % FIGURAS.length), 4500);
    return () => clearInterval(id);
  }, []);

  const size = 80;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c - (porcentagemGlobal / 100) * c;

  const isTudoConcluido = totalDecks > 0 && totalConcluidos >= totalDecks;

  return (
    <section
      className="relative isolate overflow-hidden rounded-3xl border border-white/20 shadow-2xl transition-all"
      style={{
        background:
          'linear-gradient(135deg, hsl(160 84% 20%) 0%, hsl(160 84% 28%) 50%, hsl(160 84% 36%) 100%)',
      }}
      aria-label="Painel de progresso dos desafios"
    >
      {/* Luzes radiais e ambientais */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.35),transparent_65%)]" />

      {/* Silhuetas decorativas intercaladas no padrão Flashcards */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[42%] overflow-hidden sm:w-[32%] opacity-60 mix-blend-soft-light"
        aria-hidden="true"
      >
        {FIGURAS.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-y-0 right-0 h-full w-auto object-contain object-right transition-opacity duration-[1400ms] ease-in-out"
            style={{
              opacity: i === heroIdx ? 1 : 0,
              filter: 'brightness(0) invert(1)',
            }}
          />
        ))}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#064e3b] via-[#064e3b]/60 to-transparent" />
      </div>

      <div className="relative p-5 sm:p-7 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Lado Esquerdo: Gauge Circular com Porcentagem e Contadores */}
          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke="rgba(0,0,0,0.28)"
                  strokeWidth={stroke}
                  fill="none"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke="#ffffff"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={c}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg sm:text-xl font-black leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                  {porcentagemGlobal}%
                </span>
                <span className="mt-0.5 text-[8px] font-extrabold uppercase tracking-widest text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  Progresso
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white">
                  <Trophy className="w-3 h-3 text-emerald-200" />
                  Desafios Gerais
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                {totalConcluidos} de {totalDecks} concluídos
              </h2>
              <p className="text-xs text-emerald-100/80 font-medium">
                {isTudoConcluido
                  ? 'Sensacional! Você dominou todas as matérias!'
                  : 'Complete os decks em linha do tempo para dominar cada matéria.'}
              </p>
            </div>
          </div>

          {/* Lado Direito: Card Integrado "Seu Desafio Atual" e Botão "Continuar desafio" */}
          {desafioAtual && !isTudoConcluido ? (
            <div className="flex-1 max-w-xl bg-black/25 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                      Seu Desafio Atual
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-white/90">
                      {desafioAtual.area} · Deck {String(desafioAtual.ordem).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="font-display text-base sm:text-lg font-black text-white truncate drop-shadow-sm">
                    {desafioAtual.titulo}
                  </h3>
                  <p className="text-xs text-white/75 line-clamp-1 mt-0.5">
                    {desafioAtual.subtitulo} · ~{desafioAtual.cardsEstimados} cards
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-white">
                  <Flame className="w-5 h-5 fill-current text-orange-300" />
                </div>
              </div>

              {/* Botão Primário "Continuar desafio" */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptic.impact();
                  onContinuar(desafioAtual);
                }}
                className="btn-attention-shine w-full h-12 sm:h-13 rounded-xl bg-white text-[#064e3b] font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl hover:bg-emerald-50 transition-all active:scale-[0.98] select-none"
              >
                <Play className="w-4 h-4 fill-[#064e3b] text-[#064e3b]" />
                <span className="tracking-wide uppercase font-extrabold text-[13px] sm:text-[14px]">
                  Continuar desafio
                </span>
              </motion.button>
            </div>
          ) : isTudoConcluido ? (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white">
              <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
              <div>
                <p className="text-sm font-bold">Todos os desafios foram concluídos!</p>
                <p className="text-xs text-white/70">Você pode revisar qualquer matéria na lista abaixo.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
