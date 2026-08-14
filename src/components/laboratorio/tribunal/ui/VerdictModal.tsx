import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Scale } from 'lucide-react';
import { Verdict } from '@/lib/tribunal/useCourtGame';

interface Props {
  verdict: Verdict;
  feedbacks: string[];
  onRestart: () => void;
}

export const VerdictModal: React.FC<Props> = ({ verdict, feedbacks, onRestart }) => {
  if (!verdict) return null;

  const details = getVerdictDetails(verdict);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.94, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl rounded-2xl border border-white/12 bg-[#11100d] p-5 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-slate-950">
            <Scale className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/80">Resultado</p>
            <h2 className={`text-2xl font-black sm:text-3xl ${details.color}`}>{details.title}</h2>
          </div>
        </div>

        <p className="mb-6 text-base leading-7 text-slate-200 sm:text-lg">{details.desc}</p>

        <div className="mb-6 max-h-[42vh] overflow-y-auto rounded-xl border border-white/10 bg-black/35 p-4">
          <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/80">
            Feedback pedagógico
          </h3>
          <ul className="space-y-3">
            {feedbacks.map((feedback, index) => (
              <li key={`${feedback}-${index}`} className="rounded-lg bg-white/[0.06] p-3 text-sm leading-6 text-slate-200">
                {feedback}
              </li>
            ))}
            {feedbacks.length === 0 && (
              <li className="text-sm italic text-slate-500">Nenhum feedback específico registrado.</li>
            )}
          </ul>
        </div>

        <button
          onClick={onRestart}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-200 px-4 py-3 font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-amber-100"
        >
          <RotateCcw className="h-4 w-4" />
          Jogar novamente
        </button>
      </motion.div>
    </motion.div>
  );
};

function getVerdictDetails(verdict: Exclude<Verdict, null>) {
  switch (verdict) {
    case 'absolvicao':
      return {
        title: 'Absolvição',
        color: 'text-emerald-300',
        desc: 'Excelente atuação. A defesa conseguiu enfraquecer o ponto central da acusação e preservar a credibilidade técnica.',
      };
    case 'condenacao':
      return {
        title: 'Condenação',
        color: 'text-rose-300',
        desc: 'A acusação permaneceu mais forte. Faltou atacar melhor a prova da grave ameaça ou sustentar uma tese compatível com os autos.',
      };
    case 'acordo':
      return {
        title: 'Desclassificação parcial',
        color: 'text-amber-200',
        desc: 'Resultado intermediário. A defesa reduziu o dano, mas ainda não construiu força suficiente para uma vitória plena.',
      };
    case 'nulidade':
      return {
        title: 'Nulidade reconhecida',
        color: 'text-violet-300',
        desc: 'Você demonstrou domínio técnico, mas conduziu a audiência com atrito excessivo. O processo foi anulado.',
      };
    default:
      return {
        title: 'Fim do julgamento',
        color: 'text-white',
        desc: 'A sessão foi encerrada.',
      };
  }
}
