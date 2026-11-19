import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Flame, Play } from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { DISCIPLINAS_CATALOGO } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { haptic } from '@/lib/nativeHaptics';
import { AulasCardRubyBackground } from './AulasCardRubyBackground';

interface AulasContinuarAulaBannerProps {
  aula: AulaItem;
  onIniciarAula: (aula: AulaItem) => void;
  calcularProgressoCiclo?: (aula: AulaItem) => {
    etapaAtual: number;
    totalEtapas: number;
    aulaTerminada: boolean;
    porcentagemTotal: number;
  };
}

export const AulasContinuarAulaBanner: React.FC<AulasContinuarAulaBannerProps> = React.memo(
  function AulasContinuarAulaBanner({ aula, onIniciarAula, calcularProgressoCiclo }) {
    const disc = DISCIPLINAS_CATALOGO.find((d) => d.id === aula.disciplinaId);
    const discTheme = getDisciplinaVisualTheme(aula.disciplinaId);
    const capaUrl = discTheme?.fundoAssetUrl || disc?.capaHeroUrl;

    const prog = calcularProgressoCiclo
      ? calcularProgressoCiclo(aula)
      : { etapaAtual: 1, totalEtapas: 4, porcentagemTotal: 25, aulaTerminada: false };

    const percent = Math.min(100, Math.max(1, prog.porcentagemTotal || 25));
    const discNome = disc?.nome?.replace('DIREITO ', '') || 'DIREITO';

    const handleClick = () => {
      try { haptic.impact('medium'); } catch {}
      onIniciarAula(aula);
    };

    return (
      <div className="w-full select-none">
        {/* Cabeçalho Minimalista da Seção */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400/20 shrink-0" />
            <span className="text-[10.5px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Continuar de onde parou
            </span>
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-mono text-zinc-500">
            Etapa {prog.etapaAtual} de {prog.totalEtapas}
          </span>
        </div>

        {/* Card Minimalista e Responsivo com Fundo Rubi das Funções */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClick}
          className="relative overflow-hidden w-full flex items-center rounded-2xl border border-red-500/35 hover:border-red-400/60 shadow-[0_8px_24px_rgba(225,29,72,0.18)] hover:shadow-[0_12px_32px_rgba(225,29,72,0.30)] p-2.5 xs:p-3 sm:p-3.5 text-left active:scale-[0.99] transition-all cursor-pointer group gap-3 xs:gap-3.5"
        >
          {/* Fundo Rubi com Listras de Seda e Crista de Luz das Funções */}
          <AulasCardRubyBackground active />

          {/* Capa Compacta 1:1 com cantos arredondados limpos */}
          <div className="relative z-10 w-13 h-13 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-red-500/30 shadow-md">
            {capaUrl ? (
              <img
                src={capaUrl}
                alt={aula.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-zinc-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          </div>

          {/* Informações da Aula */}
          <div className="relative z-10 flex-1 min-w-0">
            <h3 className="font-sans font-bold text-[13.5px] xs:text-[14.5px] sm:text-base text-white tracking-tight line-clamp-1 group-hover:text-rose-200 transition-colors">
              {aula.titulo}
            </h3>

            <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 text-[11px] sm:text-xs text-zinc-300 truncate">
              <span className="font-semibold text-rose-400">{discNome}</span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-zinc-300">{percent}% concluído</span>
            </div>

            {/* Barra de Progresso Fina e Elegante */}
            <div className="w-full mt-2 bg-black/40 rounded-full h-1 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Botão de Ação Circular Limpo */}
          <div className="relative z-10 shrink-0 pl-1">
            <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-red-500/25 group-hover:bg-red-500 border border-red-500/40 text-rose-200 group-hover:text-white transition-all flex items-center justify-center shadow-[0_0_12px_rgba(225,29,72,0.25)] group-hover:shadow-[0_0_16px_rgba(225,29,72,0.6)]">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>
        </motion.button>
      </div>
    );
  }
);
export default AulasContinuarAulaBanner;
