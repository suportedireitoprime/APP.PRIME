import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, RotateCw, Award, LockOpen } from 'lucide-react';
import type { FlashcardAula } from '@/data/aulasInterativasConteudo';

interface ModalRevisarFlashcardsProps {
  tituloAula: string;
  flashcards: FlashcardAula[];
  onFechar: () => void;
  onConcluir: () => void;
}

export function ModalRevisarFlashcards({
  tituloAula,
  flashcards,
  onFechar,
  onConcluir
}: ModalRevisarFlashcardsProps) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [virado, setVirado] = useState(false);
  const [direcao, setDirecao] = useState(1);
  const [finalizado, setFinalizado] = useState(false);

  const total = flashcards.length;
  const card = flashcards[indexAtual];
  const progressoPct = Math.round(((indexAtual + 1) / total) * 100);

  const handleCompreendi = () => {
    setVirado(false);
    setDirecao(1);

    if (indexAtual + 1 < total) {
      setIndexAtual(prev => prev + 1);
    } else {
      setFinalizado(true);
      onConcluir();
    }
  };

  const reiniciar = () => {
    setIndexAtual(0);
    setVirado(false);
    setFinalizado(false);
  };

  if (finalizado) {
    return (
      <div className="fixed inset-0 z-[120] bg-[#0c0306] flex flex-col items-center justify-center p-4 text-white overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="max-w-md w-full rounded-3xl border border-[rgba(226,62,87,0.4)] p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #240811 0%, #140409 100%)' }}
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Award className="w-10 h-10 text-black stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#ff8296]">
              Fase 2 de 3 Concluída
            </span>
            <h2 className="text-2xl font-black text-white font-serif">
              Revisão Finalizada com Sucesso!
            </h2>
            <p className="text-xs sm:text-sm text-[#f8edef]/80 leading-relaxed">
              Você revisou todos os <span className="text-white font-bold">{total} flashcards</span> da aula <span className="text-[#ff8296] font-semibold">{tituloAula}</span>.
            </p>
          </div>

          {/* Mensagem de Desbloqueio da Próxima Fase */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 text-left">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
              <LockOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">Módulo de Questões Liberado!</p>
              <p className="text-[10px] text-emerald-100/70">O botão &quot;Praticar&quot; agora está desbloqueado para você treinar casos práticos.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-xl transition active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ff7a8a 0%, #c8102e 100%)',
                boxShadow: '0 4px 18px rgba(226,62,87,0.5)'
              }}
            >
              Voltar ao Catálogo
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-[#c9a7ad] hover:text-white transition"
            >
              Revisar Novamente
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] bg-[#120409] flex flex-col w-screen h-screen overflow-hidden text-white">
      {/* Cabeçalho Temático */}
      <header
        className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[rgba(226,62,87,0.35)] shrink-0 z-30 shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #280611 0%, #16040a 100%)',
          paddingTop: 'calc(0.6rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onFechar}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[rgba(46,15,24,0.85)] border border-[rgba(226,62,87,0.45)] flex items-center justify-center shrink-0 text-[#ff8296] hover:bg-[rgba(66,20,34,1)] hover:text-white transition active:scale-95 shadow-md"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
          </button>

          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff8296] block truncate">
              FASE 2 · REVISAR FLASHCARDS
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate font-serif">
              {tituloAula}
            </h2>
          </div>
        </div>

        {/* Indicador de Card Atual */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black text-[#ff8296] px-3.5 py-1 rounded-full bg-black/50 border border-[rgba(226,62,87,0.35)] shadow-md">
            {indexAtual + 1} / {total}
          </span>
        </div>
      </header>

      {/* Barra de Progresso Superior */}
      <div className="w-full h-1.5 bg-black/60 shrink-0">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#c8102e] to-[#ff8296]"
          initial={{ width: 0 }}
          animate={{ width: `${progressoPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Área Central: Flashcard Interativo com Flip 3D e Transição de Entrada/Saída */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-xl mx-auto w-full overflow-hidden perspective-[1200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 50 * direcao, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50 * direcao, scale: 0.95 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="w-full"
          >
            {/* Card com Flip 3D */}
            <div
              onClick={() => setVirado(!virado)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setVirado(!virado); }}
              className="w-full min-h-[350px] sm:min-h-[390px] rounded-3xl border border-[rgba(226,62,87,0.35)] hover:border-[rgba(226,62,87,0.6)] p-6 sm:p-8 flex flex-col justify-between cursor-pointer select-none transition-shadow duration-300 shadow-2xl relative transform-gpu"
              style={{
                perspective: '1200px',
                background: virado 
                  ? 'linear-gradient(180deg, #220712 0%, #300d19 100%)' 
                  : 'linear-gradient(180deg, #2c0c16 0%, #1e070f 100%)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.85), 0 0 24px rgba(226,62,87,0.2)'
              }}
            >
              <motion.div
                animate={{ rotateY: virado ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                className="w-full h-full flex flex-col justify-between flex-1"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {!virado ? (
                  // Face Frontal (Pergunta)
                  <div className="flex flex-col justify-between h-full flex-1">
                    {/* Topo do card: SEM ícone de brilho, apenas o badge estilizado */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff8296] px-3 py-1 rounded-full bg-black/40 border border-[rgba(226,62,87,0.25)]">
                        PERGUNTA DE FIXAÇÃO
                      </span>

                      <span className="text-[10px] font-semibold text-[#c9a7ad] flex items-center gap-1.5">
                        <RotateCw className="w-3 h-3 text-[#ff8296]" />
                        <span>Toque para virar</span>
                      </span>
                    </div>

                    <div className="my-auto py-6">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed font-serif">
                        {card.pergunta}
                      </p>
                      <p className="text-xs text-[#c9a7ad]/80 italic mt-3">
                        Pense na resposta antes de virar para checar a fundamentação jurídica.
                      </p>
                    </div>

                    <div className="pt-2 text-center border-t border-[rgba(226,62,87,0.15)]">
                      <span className="text-[11px] text-[#c9a7ad]/70 font-medium">
                        Toque no card para ver a resposta
                      </span>
                    </div>
                  </div>
                ) : (
                  // Face Traseira (Resposta) com compensação de rotação para leitura
                  <div 
                    className="flex flex-col justify-between h-full flex-1"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-black/40 border border-emerald-500/30">
                        RESPOSTA & FUNDAMENTAÇÃO
                      </span>

                      <span className="text-[10px] font-semibold text-[#c9a7ad] flex items-center gap-1.5">
                        <RotateCw className="w-3 h-3 text-emerald-400" />
                        <span>Toque para desvirar</span>
                      </span>
                    </div>

                    <div className="my-auto py-4 space-y-3 text-left">
                      <p className="text-sm sm:text-base font-medium text-[#f8edef] leading-relaxed">
                        {card.resposta}
                      </p>

                      {card.artigoLei && (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/25">
                          <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block mb-0.5">
                            Fundamento Legal
                          </span>
                          <p className="text-xs font-semibold text-amber-200">{card.artigoLei}</p>
                        </div>
                      )}

                      {card.dicaPratica && (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/25">
                          <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block mb-0.5">
                            Dica de Ouro / Pegadinha
                          </span>
                          <p className="text-xs text-emerald-200">{card.dicaPratica}</p>
                        </div>
                      )}

                      {card.exemplo && (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-rose-500/25">
                          <span className="text-[10px] font-extrabold text-[#ff8296] uppercase tracking-wider block mb-0.5">
                            Exemplo Prático
                          </span>
                          <p className="text-xs text-[#f8edef]/90">{card.exemplo}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 text-center border-t border-[rgba(226,62,87,0.15)]">
                      <span className="text-[11px] text-[#c9a7ad]/70 font-medium">
                        Clique em &quot;Compreendi&quot; abaixo para avançar
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Barra de Ações Inferior: APENAS O BOTÃO COMPREENDI */}
      <footer
        className="px-4 sm:px-8 py-3.5 border-t border-[rgba(226,62,87,0.25)] shrink-0 z-30"
        style={{
          background: 'linear-gradient(180deg, #1b050d 0%, #100307 100%)',
          paddingBottom: 'calc(0.75rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))'
        }}
      >
        <div className="max-w-xl mx-auto">
          <button
            type="button"
            onClick={handleCompreendi}
            className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition active:scale-[0.98] shadow-2xl shadow-emerald-950/60 border border-emerald-400/30"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Compreendi {indexAtual + 1 < total ? '(Próximo)' : '(Concluir)'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
