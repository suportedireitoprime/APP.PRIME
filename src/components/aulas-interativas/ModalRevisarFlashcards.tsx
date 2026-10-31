import React, { useState } from 'react';
import { 
  ArrowLeft, RotateCcw, CheckCircle2, RotateCw, 
  Sparkles, BookOpen, Layers, Award, ChevronRight, LockOpen 
} from 'lucide-react';
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
  const [compreendidos, setCompreendidos] = useState<number[]>([]);
  const [paraRevisar, setParaRevisar] = useState<number[]>([]);
  const [finalizado, setFinalizado] = useState(false);

  const card = flashcards[indexAtual];
  const total = flashcards.length;
  const progressoPct = Math.round(((indexAtual + 1) / total) * 100);

  const handleProximo = (tipo: 'compreendi' | 'revisar') => {
    if (tipo === 'compreendi') {
      setCompreendidos(prev => [...prev, indexAtual]);
    } else {
      setParaRevisar(prev => [...prev, indexAtual]);
    }

    setVirado(false);

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
    setCompreendidos([]);
    setParaRevisar([]);
    setFinalizado(false);
  };

  if (finalizado) {
    return (
      <div className="fixed inset-0 z-[120] bg-[#0c0306] flex flex-col items-center justify-center p-4 text-white overflow-y-auto">
        <div 
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

          {/* Placar de desempenho */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-black/40 border border-[rgba(226,62,87,0.25)]">
            <div className="text-center p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xl font-black text-emerald-400">{compreendidos.length}</span>
              <p className="text-[10px] font-bold uppercase text-emerald-300">Compreendidos</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xl font-black text-amber-400">{paraRevisar.length}</span>
              <p className="text-[10px] font-bold uppercase text-amber-300">A Reforçar</p>
            </div>
          </div>

          {/* Mensagem de Desbloqueio */}
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
        </div>
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
          <span className="text-xs font-black text-[#ff8296] px-3 py-1 rounded-full bg-black/50 border border-[rgba(226,62,87,0.3)]">
            {indexAtual + 1} / {total}
          </span>
        </div>
      </header>

      {/* Barra de Progresso Superior */}
      <div className="w-full h-1.5 bg-black/60 shrink-0">
        <div 
          className="h-full bg-gradient-to-r from-[#c8102e] to-[#ff8296] transition-all duration-300"
          style={{ width: `${progressoPct}%` }}
        />
      </div>

      {/* Área Central: Flashcard Interativo com Flip */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-xl mx-auto w-full overflow-y-auto">
        <div 
          onClick={() => setVirado(!virado)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setVirado(!virado); }}
          className="w-full min-h-[340px] sm:min-h-[380px] rounded-3xl border border-[rgba(226,62,87,0.35)] hover:border-[rgba(226,62,87,0.6)] p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-2xl relative select-none transform-gpu"
          style={{
            background: virado 
              ? 'linear-gradient(180deg, #1f070f 0%, #2f0d18 100%)' 
              : 'linear-gradient(180deg, #2b0c15 0%, #1e070e 100%)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 20px rgba(226,62,87,0.15)'
          }}
        >
          {/* Topo do card: Tag indicadora */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#ff8296] px-2.5 py-1 rounded-full bg-black/40 border border-[rgba(226,62,87,0.25)]">
              <Sparkles className="w-3 h-3 fill-current" />
              <span>{virado ? 'Resposta & Fundamentação' : 'Pergunta de Fixação'}</span>
            </span>

            <span className="text-[10px] font-semibold text-[#c9a7ad] flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              <span>Toque para virar</span>
            </span>
          </div>

          {/* Conteúdo: Frente vs Verso */}
          <div className="my-auto py-4">
            {!virado ? (
              <div className="space-y-4">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed font-serif">
                  {card.pergunta}
                </p>
                <p className="text-xs text-[#c9a7ad] italic">
                  Pense na resposta antes de virar para checar a fundamentação doutrinária.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 text-left">
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
            )}
          </div>

          {/* Rodapé do card: instrução sutil */}
          <div className="pt-2 text-center border-t border-[rgba(226,62,87,0.15)]">
            <span className="text-[11px] text-[#c9a7ad]/70 font-medium">
              {virado ? 'Avalie seu conhecimento nos botões abaixo' : 'Clique ou toque em qualquer lugar do card para ver a resposta'}
            </span>
          </div>
        </div>
      </main>

      {/* Barra de Ações Inferior: Preciso Revisar vs Compreendi */}
      <footer
        className="px-4 sm:px-8 py-3.5 border-t border-[rgba(226,62,87,0.25)] shrink-0 z-30"
        style={{
          background: 'linear-gradient(180deg, #1b050d 0%, #100307 100%)',
          paddingBottom: 'calc(0.75rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))'
        }}
      >
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleProximo('revisar')}
            className="flex-1 py-3 sm:py-3.5 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Preciso Revisar</span>
          </button>

          <button
            type="button"
            onClick={() => handleProximo('compreendi')}
            className="flex-1 py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-xl shadow-emerald-950/40 border border-emerald-400/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Compreendi</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
