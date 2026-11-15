import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Flame, BookOpen } from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { DISCIPLINAS_CATALOGO } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { haptic } from '@/lib/nativeHaptics';

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
      <div className="w-full max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 mb-4">
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClick}
          style={{
            background: 'linear-gradient(to right, rgba(13, 148, 136, 0.22), rgba(13, 148, 136, 0.05))',
            borderColor: 'rgba(45, 212, 191, 0.38)',
          }}
          className="w-full flex items-stretch rounded-2xl border text-left active:scale-[0.98] transition-all overflow-hidden relative shadow-lg group cursor-pointer min-h-[84px] sm:min-h-[92px]"
        >
          {/* Capa da Disciplina/Aula à esquerda — flush sem margens (idêntico a Continuar Leitura) */}
          <div className="w-[72px] sm:w-[84px] shrink-0 self-stretch relative overflow-hidden bg-black flex flex-col justify-end border-r border-white/10">
            {capaUrl ? (
              <img
                src={capaUrl}
                alt={aula.titulo}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#042f2e] to-[#0f766e] flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#2dd4bf]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
            <span className="relative z-10 w-full bg-[#0d9488] text-[8px] sm:text-[8.5px] font-black uppercase text-center text-white py-0.5 tracking-wider">
              AULA
            </span>
          </div>

          {/* Textos centrais, progresso e seta indicativa */}
          <div className="flex-1 min-w-0 z-10 py-3 pl-3 pr-3.5 sm:py-3.5 sm:pl-3.5 sm:pr-4 flex items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Flame className="w-3 h-3 fill-[#2dd4bf] text-[#2dd4bf]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf] font-mono">
                  CONTINUAR DE ONDE PAROU
                </p>
                <span className="text-[8.5px] sm:text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-[#0d9488]/25 text-[#5eead4] border border-[#2dd4bf]/30">
                  Etapa {prog.etapaAtual} de {prog.totalEtapas}
                </span>
              </div>

              <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug line-clamp-1">
                {aula.titulo}
              </p>

              <p className="text-[11px] sm:text-[11.5px] font-semibold truncate flex items-center gap-1.5 text-teal-200/90 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#2dd4bf] shrink-0" />
                <span className="truncate">{discNome} · Parou na Etapa {prog.etapaAtual}</span>
                <span className="text-white/40 hidden xs:inline">• Retomar aula</span>
              </p>

              {/* Barra de Progresso sutil */}
              <div className="w-full mt-2">
                <div className="flex items-center justify-between text-[9.5px] font-medium text-white/50 mb-0.5">
                  <span>Progresso da aula</span>
                  <span className="font-bold text-[#5eead4] font-mono">
                    {percent}% concluído
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0d9488] via-[#14b8a6] to-[#2dd4bf] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Seta indicativa à direita */}
            <div className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-500/15 border border-teal-500/30 text-[#2dd4bf] group-hover:bg-[#0d9488] group-hover:text-black group-hover:scale-105 transition-all shadow">
              <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
        </motion.button>
      </div>
    );
  }
);
