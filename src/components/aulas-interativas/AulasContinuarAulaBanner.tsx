import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Flame } from 'lucide-react';
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
      <div className="w-full max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 mt-3 sm:mt-4 mb-5 select-none">
        {/* Título fora do botão com a mesma tipografia e cor */}
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Flame className="w-3.5 h-3.5 text-[#2dd4bf] fill-[#2dd4bf] drop-shadow-[0_0_6px_rgba(45,212,191,0.5)] shrink-0" />
          <h2 className="text-[11px] sm:text-[11.5px] font-mono font-black uppercase tracking-widest text-[#2dd4bf] drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]">
            CONTINUAR DE ONDE PAROU
          </h2>
        </div>

        {/* Card Interativo Minimalista */}
        <div className="relative group">
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
            className="w-full flex items-stretch rounded-2xl border text-left active:scale-[0.98] transition-all overflow-hidden relative shadow-lg cursor-pointer min-h-[82px] sm:min-h-[88px]"
          >
            {/* Capa da Disciplina à esquerda — flush sem margens */}
            <div className="w-[68px] sm:w-[78px] shrink-0 self-stretch relative overflow-hidden bg-black flex flex-col justify-end border-r border-white/10">
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
              <span className="relative z-10 w-full bg-[#0d9488] text-[8px] sm:text-[8.5px] font-black uppercase text-center text-white py-0.5 tracking-wider font-mono">
                AULA
              </span>
            </div>

            {/* Conteúdo Central Minimalista e SEM ABREVIAÇÃO */}
            <div className="flex-1 min-w-0 z-10 py-3 pl-3 pr-2 sm:py-3.5 sm:pl-3.5 sm:pr-3 flex flex-col justify-center">
              {/* Título Completo sem abreviação */}
              <h3 className="font-serif italic text-[15px] sm:text-[16.5px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug">
                {aula.titulo}
              </h3>

              {/* Subtítulo Minimalista */}
              <p className="text-[11.5px] sm:text-[12px] font-sans text-teal-200/90 mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#2dd4bf] shrink-0" />
                <span className="font-semibold text-white/90">{discNome}</span>
                <span className="text-white/40">•</span>
                <span>Etapa {prog.etapaAtual} de {prog.totalEtapas}</span>
                <span className="text-white/40">•</span>
                <span className="font-mono text-[#5eead4] font-bold">{percent}%</span>
              </p>

              {/* Barra de Progresso Fina e Minimalista */}
              <div className="w-full mt-2 bg-white/10 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0d9488] via-[#14b8a6] to-[#2dd4bf] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Seta indicativa à direita */}
            <div className="shrink-0 flex items-center justify-center pr-3 sm:pr-4">
              <div className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 text-[#2dd4bf] group-hover:bg-[#0d9488] group-hover:text-black group-hover:scale-105 transition-all flex items-center justify-center shadow">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }
);
