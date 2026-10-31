import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, XCircle, Award, 
  HelpCircle, ChevronRight, RotateCcw, BookOpen, AlertCircle
} from 'lucide-react';
import type { QuestaoAula } from '@/data/aulasInterativasConteudo';

interface ModalPraticarQuestoesProps {
  tituloAula: string;
  questoes: QuestaoAula[];
  onFechar: () => void;
  onConcluir: () => void;
}

export function ModalPraticarQuestoes({
  tituloAula,
  questoes,
  onFechar,
  onConcluir
}: ModalPraticarQuestoesProps) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [acertos, setAcertos] = useState<number[]>([]);
  const [erros, setErros] = useState<number[]>([]);
  const [finalizado, setFinalizado] = useState(false);

  const questao = questoes[indexAtual];
  const total = questoes.length;
  const progressoPct = Math.round(((indexAtual + 1) / total) * 100);

  const handleSelectAlternativa = (letra: 'A' | 'B' | 'C' | 'D') => {
    if (respostaSelecionada !== null) return; // Já respondeu esta questão

    setRespostaSelecionada(letra);
    if (letra === questao.respostaCorreta) {
      setAcertos(prev => [...prev, indexAtual]);
    } else {
      setErros(prev => [...prev, indexAtual]);
    }
  };

  const handleProxima = () => {
    setRespostaSelecionada(null);
    if (indexAtual + 1 < total) {
      setIndexAtual(prev => prev + 1);
    } else {
      setFinalizado(true);
      onConcluir();
    }
  };

  const reiniciar = () => {
    setIndexAtual(0);
    setRespostaSelecionada(null);
    setAcertos([]);
    setErros([]);
    setFinalizado(false);
  };

  const getTipoBadge = (tipo: QuestaoAula['tipo']) => {
    switch (tipo) {
      case 'caso_pratico':
        return { label: 'Caso Prático', color: 'bg-rose-500/20 text-[#ff8296] border-rose-500/30' };
      case 'pegadinha':
        return { label: 'Pegadinha de Prova', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'definicao':
        return { label: 'Definição & Conceito', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { label: 'Questão Introdutória', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
  };

  if (finalizado) {
    const totalAcertos = acertos.length;
    const taxaAcerto = Math.round((totalAcertos / total) * 100);

    return (
      <div className="fixed inset-0 z-[120] bg-[#0c0306] flex flex-col items-center justify-center p-4 text-white overflow-y-auto">
        <div 
          className="max-w-md w-full rounded-3xl border border-[rgba(226,62,87,0.4)] p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #240811 0%, #140409 100%)' }}
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award className="w-10 h-10 text-white stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
              Ciclo Completo Concluído! (3 de 3)
            </span>
            <h2 className="text-2xl font-black text-white font-serif">
              Treinamento de Questões Finalizado!
            </h2>
            <p className="text-xs sm:text-sm text-[#f8edef]/80 leading-relaxed">
              Você completou todas as questões de fixação da aula <span className="text-[#ff8296] font-semibold">{tituloAula}</span>.
            </p>
          </div>

          {/* Placar de desempenho */}
          <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-black/40 border border-[rgba(226,62,87,0.25)]">
            <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xl font-black text-white">{total}</span>
              <p className="text-[9px] font-bold uppercase text-[#c9a7ad]">Questões</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xl font-black text-emerald-400">{totalAcertos}</span>
              <p className="text-[9px] font-bold uppercase text-emerald-300">Acertos</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#c8102e]/20 border border-[#c8102e]/40">
              <span className="text-xl font-black text-[#ff8296]">{taxaAcerto}%</span>
              <p className="text-[9px] font-bold uppercase text-[#ff8296]">Aproveitamento</p>
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
              Concluir e Voltar ao Catálogo
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-[#c9a7ad] hover:text-white transition"
            >
              Refazer Questões
            </button>
          </div>
        </div>
      </div>
    );
  }

  const badge = getTipoBadge(questao.tipo);
  const respondido = respostaSelecionada !== null;

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
              FASE 3 · PRATICAR QUESTÕES
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate font-serif">
              {tituloAula}
            </h2>
          </div>
        </div>

        {/* Indicador de Questão Atual e Acertos */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            {acertos.length} acertos
          </span>
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

      {/* Conteúdo da Questão */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-4">
        {/* Card do Enunciado */}
        <div 
          className="rounded-3xl border border-[rgba(226,62,87,0.35)] p-5 sm:p-7 shadow-xl space-y-3.5"
          style={{ background: 'linear-gradient(180deg, #2b0c15 0%, #1e070e 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
            <span className="text-[10px] text-[#c9a7ad] font-semibold">
              {questao.tema}
            </span>
          </div>

          <p className="text-sm sm:text-base font-medium text-white leading-relaxed font-serif pt-1">
            {questao.enunciado}
          </p>
        </div>

        {/* Lista de Alternativas (A, B, C, D) */}
        <div className="space-y-2.5">
          {questao.alternativas.map((alt) => {
            const isSelected = respostaSelecionada === alt.letra;
            const isCorreta = alt.letra === questao.respostaCorreta;
            
            let btnStyle = 'bg-[#250d14] border-[rgba(226,62,87,0.25)] text-white hover:border-[rgba(226,62,87,0.6)]';
            let circleStyle = 'bg-black/40 text-[#ff8296] border-[rgba(226,62,87,0.3)]';

            if (respondido) {
              if (isCorreta) {
                btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-md shadow-emerald-950/50';
                circleStyle = 'bg-emerald-500 text-black border-emerald-400 font-black';
              } else if (isSelected) {
                btnStyle = 'bg-red-950/80 border-red-500 text-red-100 shadow-md shadow-red-950/50';
                circleStyle = 'bg-red-500 text-white border-red-400 font-black';
              } else {
                btnStyle = 'bg-[#1b080f]/60 border-white/5 text-white/40 opacity-50';
                circleStyle = 'bg-black/30 text-white/30 border-white/5';
              }
            }

            return (
              <button
                key={alt.letra}
                type="button"
                disabled={respondido}
                onClick={() => handleSelectAlternativa(alt.letra)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${btnStyle} active:scale-[0.99]`}
              >
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${circleStyle}`}>
                  {respondido && isCorreta ? '✓' : respondido && isSelected ? '✕' : alt.letra}
                </span>
                <span className="text-xs sm:text-sm font-medium leading-relaxed pt-1 flex-1">
                  {alt.texto}
                </span>
              </button>
            );
          })}
        </div>

        {/* Comentário e Gabarito (Aberto após responder) */}
        {respondido && (
          <div 
            className="rounded-3xl border border-[rgba(226,62,87,0.35)] p-5 sm:p-6 space-y-3.5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300"
            style={{ background: 'linear-gradient(180deg, #200810 0%, #16040a 100%)' }}
          >
            <div className="flex items-center gap-2">
              {respostaSelecionada === questao.respostaCorreta ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Você Acertou! (Gabarito: Letra {questao.respostaCorreta})
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                    Você Errou! (Gabarito Correto: Letra {questao.respostaCorreta})
                  </span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#f8edef]/90 leading-relaxed font-sans">
              {questao.comentario}
            </p>

            <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block">
                  Fundamentação Legal
                </span>
                <p className="text-xs text-amber-200/90 font-medium">
                  {questao.fundamentoLegal}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProxima}
              className="w-full mt-2 py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-white shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ff7a8a 0%, #c8102e 100%)',
                boxShadow: '0 4px 18px rgba(226,62,87,0.5)'
              }}
            >
              <span>{indexAtual + 1 < total ? 'Próxima Questão' : 'Ver Resultado Final'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
