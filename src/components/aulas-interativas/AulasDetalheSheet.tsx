import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Play, Unlock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { CONTEUDO_AULAS } from '@/data/aulasInterativasConteudo';
import { assetUrl } from '@/lib/assetUrl';

interface AulasDetalheSheetProps {
  aula: AulaItem;
  disciplinaAtual: DisciplinaItem;
  onFechar: () => void;
  onIniciarAula: (aula: AulaItem) => void;
  onAbrirFlashcards: (aula: AulaItem) => void;
  onAbrirQuestoes: (aula: AulaItem) => void;
  onBloqueio: (aula: AulaItem, motivo: 'revisar' | 'praticar') => void;
  calcularProgressoCiclo: (aula: AulaItem) => {
    etapaAtual: number;
    totalEtapas: number;
    aulaTerminada: boolean;
    fcOk: boolean;
    questoesOk: boolean;
    fasesConcluidasCount: number;
    porcentagemTotal: number;
    cicloCompleto: boolean;
  };
  modoLivreTeste?: boolean;
}

function formatDescricaoExata(desc?: string, titulo?: string): string {
  if (!desc) return '';
  let text = desc.trim();
  text = text.replace(/^Aula\s*\d+\s*[-–:]\s*/i, '');
  if (titulo && text.toLowerCase().startsWith(titulo.toLowerCase())) {
    text = text.slice(titulo.length).replace(/^[-–:\s]+/, '');
  }
  return text;
}

export const AulasDetalheSheet: React.FC<AulasDetalheSheetProps> = ({
  aula,
  disciplinaAtual,
  onFechar,
  onIniciarAula,
  onAbrirFlashcards,
  onAbrirQuestoes,
  onBloqueio,
  calcularProgressoCiclo,
  modoLivreTeste = false,
}) => {
  const prog = calcularProgressoCiclo(aula);
  const flashcardsLiberados = prog.aulaTerminada || modoLivreTeste;
  const questoesLiberadas = (prog.aulaTerminada && prog.fcOk) || modoLivreTeste;
  const conteudo = CONTEUDO_AULAS[aula.id];
  const totalCards = conteudo?.flashcards.length || 18;
  const totalQuestoes = conteudo?.questoes.length || 12;
  const descFormatada = formatDescricaoExata(aula.descricao, aula.titulo);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop-sheet-aula-detalhe"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onFechar}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        style={{ touchAction: 'none' }}
      />

      {/* Gaveta de Detalhe da Aula */}
      <motion.div
        key="sheet-aula-detalhe"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[70] h-[95dvh] sm:h-[94dvh] max-h-[calc(100dvh-var(--sai-top,env(safe-area-inset-top,0px))-8px)] max-w-4xl mx-auto rounded-t-[28px] sm:rounded-t-[32px] border-t border-x flex flex-col shadow-[0_-28px_80px_rgba(0,0,0,0.98)] overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${disciplinaAtual.corFundoCard || '#181920'} 0%, #0d0e12 100%)`,
          borderColor: `${disciplinaAtual.corDestaque}35`,
          paddingBottom: 'calc(2.5rem + var(--sai-bottom, env(safe-area-inset-bottom, 24px)))'
        }}
      >
        {/* Top Bar: Botão de FECHAR */}
        <div 
          className="px-4 sm:px-6 shrink-0 flex items-center justify-between border-b border-white/10 bg-transparent transition-all"
          style={{
            paddingTop: 'calc(0.75rem + var(--sai-top, env(safe-area-inset-top, 0px)))',
            paddingBottom: '0.65rem'
          }}
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 opacity-0 pointer-events-none shrink-0" />
          <div className="w-12 h-1.5 rounded-full bg-white/20 -mr-2 shrink-0" />
          <button
            type="button"
            onClick={onFechar}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-zinc-100 hover:text-white transition active:scale-90 shadow-md shadow-black/40 touch-manipulation shrink-0 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pt-3 pb-32 sm:pb-28 space-y-4 sm:space-y-5 overscroll-contain">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-6">
            {/* LADO ESQUERDO: Capa com Bola de Porcentagem */}
            <div className="relative shrink-0 w-36 xs:w-40 sm:w-48 md:w-52 h-48 xs:h-52 sm:h-64 md:h-68 rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl self-center sm:self-auto group">
              <img
                src={assetUrl(aula.capaUrl) || assetUrl(disciplinaAtual.capaHeroUrl)}
                alt={aula.titulo}
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = assetUrl(disciplinaAtual.capaHeroUrl);
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/45 pointer-events-none" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div 
                  className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-full backdrop-blur-md border-2 shadow-[0_0_28px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center transition-all",
                    prog.cicloCompleto 
                      ? "bg-emerald-950/85 border-emerald-400"
                      : prog.porcentagemTotal > 0
                        ? "bg-black/85 border-amber-400"
                        : "bg-black/80 border-white/30"
                  )}
                  style={{
                    borderColor: prog.cicloCompleto ? '#34d399' : prog.porcentagemTotal > 0 ? disciplinaAtual.corDestaque : 'rgba(255,255,255,0.35)',
                    boxShadow: `0 0 24px ${prog.cicloCompleto ? '#10b98160' : prog.porcentagemTotal > 0 ? disciplinaAtual.corDestaque + '50' : 'rgba(0,0,0,0.6)'}`
                  }}
                >
                  {prog.cicloCompleto ? (
                    <>
                      <Check className="w-6 h-6 text-emerald-300 stroke-[3] mb-0.5" />
                      <span className="text-xs font-black text-emerald-200 uppercase tracking-tight">100%</span>
                    </>
                  ) : (
                    <>
                      <span 
                        className="text-xl sm:text-2xl font-black font-sans tracking-tight"
                        style={{ color: prog.porcentagemTotal > 0 ? disciplinaAtual.corDestaque : '#e4e4e7' }}
                      >
                        {prog.porcentagemTotal}%
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                        {prog.porcentagemTotal > 0 ? 'Concluído' : 'Início'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* LADO DIREITO: Título e Descrição */}
            <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5 text-left">
              <span 
                className="text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                style={{ color: disciplinaAtual.corDestaque }}
              >
                AULA {aula.numeroAula} · {disciplinaAtual.nome.toUpperCase()}
              </span>

              <h2 className="font-sans font-extrabold text-xl sm:text-2xl md:text-3xl text-white leading-tight break-words mt-1">
                {aula.titulo}
              </h2>

              {descFormatada && (
                <p className="text-xs sm:text-sm text-zinc-300/85 leading-relaxed break-words mt-2.5">
                  {descFormatada}
                </p>
              )}
            </div>
          </div>

          {/* OS BOTÕES EM ETAPAS: 1. INICIAR -> 2. REVISAR -> 3. PRATICAR */}
          <div className="space-y-2.5 pt-3">
            {/* ETAPA 1: INICIAR (ou REASSISTIR) */}
            <button
              type="button"
              onClick={() => onIniciarAula(aula)}
              className={cn(
                "w-full h-13 sm:h-14 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-between px-5 active:scale-[0.98] shadow-xl cursor-pointer",
                prog.aulaTerminada
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-950/40"
                  : "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border border-red-400/50 shadow-red-950/50"
              )}
            >
              <div className="flex items-center gap-2.5">
                {prog.aulaTerminada ? (
                  <Check className="w-5 h-5 text-white stroke-[3]" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
                <span>1. {prog.aulaTerminada ? 'REASSISTIR' : 'INICIAR'}</span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-sm border border-white/20">
                {prog.aulaTerminada ? 'Concluído' : 'Etapa 1'}
              </span>
            </button>

            {/* ETAPA 2: REVISAR */}
            <button
              type="button"
              onClick={() => {
                if (!flashcardsLiberados) {
                  onBloqueio(aula, 'revisar');
                  return;
                }
                onAbrirFlashcards(aula);
              }}
              className={cn(
                "w-full h-12 sm:h-13 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-between px-5 active:scale-[0.98] border shadow-md cursor-pointer",
                prog.fcOk
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : flashcardsLiberados
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-amber-400/50 shadow-amber-950/40"
                    : "bg-white/[0.04] text-zinc-400 border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-2.5">
                {flashcardsLiberados ? (
                  <Unlock className="w-4.5 h-4.5 text-amber-300 shrink-0" />
                ) : (
                  <Lock className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                )}
                <span>2. REVISAR ({totalCards} Cards)</span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-sm border border-white/15">
                {prog.fcOk ? '✓ Revisado' : 'Etapa 2'}
              </span>
            </button>

            {/* ETAPA 3: PRATICAR */}
            <button
              type="button"
              onClick={() => {
                if (!questoesLiberadas) {
                  onBloqueio(aula, 'praticar');
                  return;
                }
                onAbrirQuestoes(aula);
              }}
              className={cn(
                "w-full h-12 sm:h-13 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-between px-5 active:scale-[0.98] border shadow-md cursor-pointer",
                prog.questoesOk
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : questoesLiberadas
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400/50 shadow-emerald-950/40"
                    : "bg-white/[0.04] text-zinc-400 border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-2.5">
                {questoesLiberadas ? (
                  <Unlock className="w-4.5 h-4.5 text-emerald-300 shrink-0" />
                ) : (
                  <Lock className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                )}
                <span>3. PRATICAR ({totalQuestoes} Questões)</span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-sm border border-white/15">
                {prog.questoesOk ? '✓ Praticado' : 'Etapa 3'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

