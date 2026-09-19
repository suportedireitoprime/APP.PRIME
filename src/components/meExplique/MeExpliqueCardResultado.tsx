import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, BookOpen, HelpCircle, GraduationCap, ArrowRight, Lightbulb } from 'lucide-react';
import type { MeExpliqueResultado } from '@/hooks/useMeExpliqueTutor';

interface Props {
  resultado: MeExpliqueResultado;
  falando: boolean;
  onToggleAudio: () => void;
  onSelecionarPergunta?: (pergunta: string) => void;
}

export const MeExpliqueCardResultado: React.FC<Props> = ({
  resultado,
  falando,
  onToggleAudio,
  onSelecionarPergunta,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Card Principal de Explicação Didática */}
      <div className="rounded-3xl border border-border/80 bg-zinc-900/95 p-5 shadow-2xl backdrop-blur-md space-y-4">
        {/* Topo do Card */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Didática 6 Anos · Português Claro
              </span>
              <h4 className="font-sans text-base font-bold text-white truncate">
                {resultado.titulo}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleAudio}
            aria-label={falando ? 'Parar leitura por voz' : 'Ouvir explicação'}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-2xl px-3.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              falando
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 animate-pulse'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            {falando ? (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-amber-400" />
                <span>Ouvir</span>
              </>
            )}
          </button>
        </div>

        {/* 1. O que significa em português claro */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>O que isso quer dizer na prática</span>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4 border border-white/5">
            <p className="font-sans text-[14px] leading-relaxed text-zinc-200">
              {resultado.oQueSignifica}
            </p>
          </div>
        </div>

        {/* 2. Exemplo prático do dia a dia */}
        {resultado.exemploPratico && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span>Exemplo simples do cotidiano</span>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
              <p className="font-sans text-[13.5px] leading-relaxed text-amber-100/90">
                {resultado.exemploPratico}
              </p>
            </div>
          </div>
        )}

        {/* 3. Termos difíceis destrinchados */}
        {resultado.termosDestrinchados && resultado.termosDestrinchados.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-bold text-white/80">
              Palavras difíceis traduzidas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {resultado.termosDestrinchados.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 space-y-0.5"
                >
                  <span className="text-[11px] font-bold text-primary block">
                    {t.termo}
                  </span>
                  <span className="text-xs text-zinc-300 block leading-snug">
                    {t.emPortuguesClaro}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Dica de Prova / OAB */}
        {resultado.dicaOabConcurso && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Dica de Prova & OAB
              </span>
              <p className="text-xs text-emerald-200/90 leading-snug mt-0.5">
                {resultado.dicaOabConcurso}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Possíveis perguntas que o usuário pode fazer */}
      {resultado.perguntasSugeridas && resultado.perguntasSugeridas.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white/90">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span>Perguntas para aprofundar (toque para perguntar):</span>
          </div>

          <div className="flex flex-col gap-2">
            {resultado.perguntasSugeridas.map((pergunta, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelecionarPergunta?.(pergunta)}
                className="group flex w-full items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition-all hover:bg-white/10 hover:border-amber-500/30 active:scale-[0.99] cursor-pointer"
              >
                <span className="font-sans text-xs font-medium text-zinc-300 group-hover:text-white leading-snug">
                  "{pergunta}"
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
