import React from 'react';
import { GameScores } from '@/lib/tribunal/courtGameData';

interface Props {
  scores: GameScores;
}

const scoreItems = [
  { key: 'credibilidadeDefesa', label: 'Defesa', color: 'bg-sky-400' },
  { key: 'forcaAcusacao', label: 'Acusação', color: 'bg-rose-500' },
  { key: 'pacienciaJuiz', label: 'Juiz', color: 'bg-amber-300' },
  { key: 'dominioTecnico', label: 'Técnica', color: 'bg-emerald-400' },
] as const;

export const ScoreMeter: React.FC<Props> = ({ scores }) => {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
      {scoreItems.map((item) => (
        <ScoreBar
          key={item.key}
          label={item.label}
          value={scores[item.key]}
          color={item.color}
        />
      ))}
    </div>
  );
};

const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-white/72">
        <span className="truncate">{label}</span>
        <span className="tabular-nums text-white/88">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/14">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};
