import React from 'react';
import { 
  Play, CheckCircle2, Layers, HelpCircle, 
  ChevronRight, Award, Flame, BookOpen 
} from 'lucide-react';
import { AulaItem, MateriaItem, DisciplinaItem } from '@/data/aulasInterativasCatalogoCompleto';

interface AulasTabProgressoProps {
  disciplinaAtual?: DisciplinaItem | null;
  materias: MateriaItem[];
  aulas: AulaItem[];
  calcularProgressoCiclo: (aula: AulaItem) => {
    etapaAtual: number;
    totalEtapas: number;
    aulaTerminada: boolean;
    fcOk: boolean;
    questoesOk: boolean;
    cicloCompleto: boolean;
    porcentagemTotal: number;
  };
  onIniciarAula: (aula: AulaItem) => void;
  onSelecionarMateria: (materiaId: string) => void;
  corDestaque?: string;
}

export const AulasTabProgresso: React.FC<AulasTabProgressoProps> = ({
  disciplinaAtual,
  materias,
  aulas,
  calcularProgressoCiclo,
  onIniciarAula,
  onSelecionarMateria,
  corDestaque = '#fbbf24'
}) => {
  // Aulas concluídas e em andamento
  const aulasEmAndamento = aulas.filter(a => {
    const prog = calcularProgressoCiclo(a);
    return prog.porcentagemTotal > 0 && prog.porcentagemTotal < 100;
  });

  const aulasConcluidas = aulas.filter(a => {
    return calcularProgressoCiclo(a).cicloCompleto;
  });

  const flashcardsRevisados = aulas.filter(a => calcularProgressoCiclo(a).fcOk);
  const questoesRespondidas = aulas.filter(a => calcularProgressoCiclo(a).questoesOk);

  // Última aula em andamento para card "Continuar de Onde Parou"
  const ultimaAulaAndamento = aulasEmAndamento[0] || (aulasConcluidas.length === 0 ? aulas[0] : null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Cards de Resumo dos 3 Atos */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Pilar 1: Aulas */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg">
          <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 mb-2">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Aulas</span>
          <span className="text-base sm:text-xl font-black text-white mt-0.5">
            {aulas.filter(a => calcularProgressoCiclo(a).aulaTerminada).length}
            <span className="text-xs text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>

        {/* Pilar 2: Flashcards */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Flashcards</span>
          <span className="text-base sm:text-xl font-black text-white mt-0.5">
            {flashcardsRevisados.length}
            <span className="text-xs text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>

        {/* Pilar 3: Questões */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Questões</span>
          <span className="text-base sm:text-xl font-black text-white mt-0.5">
            {questoesRespondidas.length}
            <span className="text-xs text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>
      </div>

      {/* 2. Card Continuar de Onde Parou */}
      {ultimaAulaAndamento && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-white/[0.06] to-white/[0.02] border border-white/15 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="min-w-0 flex-1">
              <span 
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5"
                style={{ color: corDestaque }}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                CONTINUAR DE ONDE PAROU
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
                {ultimaAulaAndamento.titulo}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                Etapa {calcularProgressoCiclo(ultimaAulaAndamento).etapaAtual} de {ultimaAulaAndamento.etapas}
              </p>

              {/* Barra de Progresso da Aula */}
              <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${calcularProgressoCiclo(ultimaAulaAndamento).porcentagemTotal}%`,
                    backgroundColor: corDestaque
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onIniciarAula(ultimaAulaAndamento)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 text-black transition-all active:scale-95 shadow-lg shrink-0"
              style={{ backgroundColor: corDestaque }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Continuar Aula</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Progresso por Matérias */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" style={{ color: corDestaque }} />
          <span>PROGRESSO POR MATÉRIA ({materias.length})</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {materias.map((mat) => {
            const aulasDaMat = aulas.filter(a => a.materiaId === mat.id);
            const total = aulasDaMat.length;
            const concluidas = aulasDaMat.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;
            const somaPct = aulasDaMat.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
            const pct = total > 0 ? Math.round(somaPct / total) : 0;

            return (
              <div
                key={mat.id}
                onClick={() => onSelecionarMateria(mat.id)}
                className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-white transition-colors truncate">
                      {mat.titulo}
                    </h5>
                    <span className="text-[10px] text-zinc-400">
                      {concluidas} de {total} aulas finalizadas
                    </span>
                  </div>

                  <span 
                    className="text-xs font-black shrink-0 px-2 py-0.5 rounded-md bg-white/5 border border-white/10"
                    style={{ color: pct > 0 ? corDestaque : '#71717a' }}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${pct}%`,
                      backgroundColor: corDestaque
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
