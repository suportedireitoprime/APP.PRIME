import React, { useState, useEffect } from 'react';
import { 
  Trophy, Target, Zap, BarChart3, TrendingUp, 
  Layers, HelpCircle, AlertCircle, Award, CheckCircle2,
  Sparkles, ArrowUpRight
} from 'lucide-react';
import { AulaItem, MateriaItem } from '@/data/aulasInterativasCatalogoCompleto';
import type { DisciplinaItem } from './AulasHeroPanel';

interface AulasTabEstatisticasProps {
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
  acertosMap?: Record<string, { acertos: number; total: number }>;
  corDestaque?: string;
  onSelecionarMateria: (materiaId: string) => void;
}

export const AulasTabEstatisticas: React.FC<AulasTabEstatisticasProps> = ({
  disciplinaAtual,
  materias,
  aulas,
  calcularProgressoCiclo,
  acertosMap = {},
  corDestaque = '#fbbf24',
  onSelecionarMateria
}) => {
  // Cálculo de desempenho matéria por matéria
  const estatisticasMaterias = materias.map(mat => {
    const aulasMat = aulas.filter(a => a.materiaId === mat.id);
    const totalAulas = aulasMat.length;
    const aulasTerminadas = aulasMat.filter(a => calcularProgressoCiclo(a).aulaTerminada).length;
    const flashcardsFeitos = aulasMat.filter(a => calcularProgressoCiclo(a).fcOk).length;
    const questoesFeitas = aulasMat.filter(a => calcularProgressoCiclo(a).questoesOk).length;
    const somaProg = aulasMat.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
    const pctConclusao = totalAulas > 0 ? Math.round(somaProg / totalAulas) : 0;

    // Acertos em questões
    let totalAcertos = 0;
    let totalPerguntas = 0;
    aulasMat.forEach(a => {
      const q = acertosMap[a.id];
      if (q && q.total > 0) {
        totalAcertos += q.acertos;
        totalPerguntas += q.total;
      } else if (calcularProgressoCiclo(a).questoesOk) {
        // Estimativa positiva baseada no ciclo completo
        totalAcertos += 8;
        totalPerguntas += 10;
      }
    });

    const taxaAcerto = totalPerguntas > 0 ? Math.round((totalAcertos / totalPerguntas) * 100) : (pctConclusao > 0 ? 80 : 0);

    // Score composto (aproveitamento geral)
    const scoreComposto = Math.round((pctConclusao * 0.5) + (taxaAcerto * 0.5));

    return {
      materia: mat,
      totalAulas,
      aulasTerminadas,
      flashcardsFeitos,
      questoesFeitas,
      pctConclusao,
      taxaAcerto,
      scoreComposto
    };
  });

  // Ordenar por onde está indo melhor (maior score)
  const materiasOrdenadas = [...estatisticasMaterias].sort((a, b) => b.scoreComposto - a.scoreComposto);

  // Top matéria (onde está indo melhor)
  const materiaTop = materiasOrdenadas.find(m => m.scoreComposto > 0) || materiasOrdenadas[0];

  // Matéria mais revisada (com mais flashcards)
  const materiaMaisRevisada = [...estatisticasMaterias].sort((a, b) => b.flashcardsFeitos - a.flashcardsFeitos)[0];

  // Matéria com maior acerto
  const materiaMaisAcertos = [...estatisticasMaterias].sort((a, b) => b.taxaAcerto - a.taxaAcerto)[0];

  // Matéria que precisa de reforço
  const materiaParaReforcar = [...estatisticasMaterias]
    .filter(m => m.pctConclusao > 0 && m.pctConclusao < 100)
    .sort((a, b) => a.scoreComposto - b.scoreComposto)[0] || materiasOrdenadas[materiasOrdenadas.length - 1];

  // Totais globais
  const totalAulasFeitas = aulas.filter(a => calcularProgressoCiclo(a).aulaTerminada).length;
  const totalFlashcardsFeitos = aulas.filter(a => calcularProgressoCiclo(a).fcOk).length;
  const totalQuestoesFeitas = aulas.filter(a => calcularProgressoCiclo(a).questoesOk).length;

  // Ticker de Insights rotativos dinâmicos
  const [insightIdx, setInsightIdx] = useState(0);
  const insights = [
    `🏆 Melhor Desempenho: Você está se destacando em "${materiaTop?.materia.titulo || 'Geral'}".`,
    `⚡ ${totalFlashcardsFeitos} flashcards revisados até o momento com alto índice de retenção.`,
    `🎯 Média de acertos nas questões estimada em ${materiaTop?.taxaAcerto || 85}%.`,
    `📚 Próximo passo sugerido: Avançar nos módulos de "${materiaParaReforcar?.materia.titulo || 'sua trilha'}".`
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIdx(prev => (prev + 1) % insights.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [insights.length]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Ticker Dinâmico de Destaques e Insights */}
      <div 
        className="p-3.5 rounded-2xl bg-white/[0.04] border flex items-center gap-3 backdrop-blur-md shadow-lg transition-all"
        style={{ borderColor: `${corDestaque}40` }}
      >
        <div 
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow"
          style={{ backgroundColor: `${corDestaque}25` }}
        >
          <Sparkles className="w-4 h-4" style={{ color: corDestaque }} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
            ANÁLISE INTELIGENTE DE DESEMPENHO
          </span>
          <p className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5 transition-opacity duration-300">
            {insights[insightIdx]}
          </p>
        </div>
      </div>

      {/* 2. Destaques Principais: Onde está indo melhor e onde revisar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card 1: Onde está indo melhor */}
        <div 
          onClick={() => materiaTop && onSelecionarMateria(materiaTop.materia.id)}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white/[0.03] to-transparent border border-amber-500/30 shadow-xl cursor-pointer hover:border-amber-400/50 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              ONDE VOCÊ ESTÁ INDO MELHOR
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Top Domínio
            </span>
          </div>

          <div className="my-3">
            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-200 transition-colors line-clamp-2">
              {materiaTop?.materia.titulo || 'Nenhum módulo iniciado'}
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              {materiaTop?.aulasTerminadas || 0} de {materiaTop?.totalAulas || 0} aulas finalizadas
            </p>
          </div>

          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Taxa de Acertos estimada:</span>
            <span className="font-black text-amber-300 text-sm">
              {materiaTop?.taxaAcerto || 0}%
            </span>
          </div>
        </div>

        {/* Card 2: Matéria com Mais Revisões / Práticas */}
        <div 
          onClick={() => materiaMaisRevisada && onSelecionarMateria(materiaMaisRevisada.materia.id)}
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white/[0.03] to-transparent border border-purple-500/30 shadow-xl cursor-pointer hover:border-purple-400/50 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              MATÉRIA MAIS REVISADA
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/30">
              Retenção Ativa
            </span>
          </div>

          <div className="my-3">
            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-200 transition-colors line-clamp-2">
              {materiaMaisRevisada?.materia.titulo || 'Nenhum módulo revisado'}
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              {materiaMaisRevisada?.flashcardsFeitos || 0} aulas revisadas com flashcards
            </p>
          </div>

          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Aproveitamento:</span>
            <span className="font-black text-purple-300 text-sm">
              {materiaMaisRevisada?.pctConclusao || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Gráfico 1: Barras Dinâmicas de Domínio por Matéria (onde ela tá indo mais bem) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: corDestaque }} />
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white">
              GRÁFICO DE DOMÍNIO POR MATÉRIA
            </h4>
          </div>
          <span className="text-[10px] sm:text-[11px] text-zinc-400">Ordenado por melhor aproveitamento</span>
        </div>

        <div className="space-y-3.5 pt-2">
          {materiasOrdenadas.map((item, index) => {
            const isTop = index === 0 && item.scoreComposto > 0;
            return (
              <div 
                key={item.materia.id}
                onClick={() => onSelecionarMateria(item.materia.id)}
                className="space-y-1.5 cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-zinc-500 w-4">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-zinc-200 group-hover:text-amber-200 transition-colors truncate">
                      {item.materia.titulo}
                    </span>
                    {isTop && (
                      <span className="hidden xs:inline-block text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                        1º Lugar
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-zinc-400">
                      {item.aulasTerminadas}/{item.totalAulas} aulas
                    </span>
                    <span 
                      className="font-black text-xs w-10 text-right"
                      style={{ color: item.pctConclusao > 0 ? corDestaque : '#71717a' }}
                    >
                      {item.pctConclusao}%
                    </span>
                  </div>
                </div>

                {/* Barra com Gradiente Dinâmico */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${Math.max(item.pctConclusao, 2)}%`,
                      backgroundColor: item.pctConclusao > 0 ? corDestaque : 'rgba(255,255,255,0.15)'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Gráfico 2: Equilíbrio dos 3 Atos de Estudo */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>EQUILÍBRIO DOS 3 ATOS (CICLO COMPLETO)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Ato 1 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-red-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                1. Aulas
              </span>
              <span className="font-black text-white">{totalAulasFeitas}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full bg-red-500"
                style={{ width: `${aulas.length > 0 ? (totalAulasFeitas / aulas.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400">Slides narrados assistidos</p>
          </div>

          {/* Ato 2 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                2. Flashcards
              </span>
              <span className="font-black text-white">{totalFlashcardsFeitos}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${aulas.length > 0 ? (totalFlashcardsFeitos / aulas.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400">Ciclos de fixação concluídos</p>
          </div>

          {/* Ato 3 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                3. Questões
              </span>
              <span className="font-black text-white">{totalQuestoesFeitas}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${aulas.length > 0 ? (totalQuestoesFeitas / aulas.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400">Questões práticas gabaritadas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

