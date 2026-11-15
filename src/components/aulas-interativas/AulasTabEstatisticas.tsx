import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Trophy, BarChart3, TrendingUp, Layers, HelpCircle, 
  CheckCircle2, Sparkles, Flame, Award, Target, BookOpen, 
  ChevronRight, Activity, ShieldCheck, PieChart as PieIcon,
  Bot, Compass, AlertTriangle, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { AulaItem, MateriaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { DISCIPLINAS_CATALOGO } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
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
  onIniciarAula?: (aula: AulaItem) => void;
  onVoltar?: () => void;
}

const CORES_DONUT = {
  concluidas: '#10b981',
  emAndamento: '#f59e0b',
  pendentes: '#3f3f46',
};

/** Formatação nobre de títulos em Title Case para leitura clássica confortável */
function formatarTituloElegante(titulo: string): string {
  if (!titulo) return '';
  const limpo = titulo
    .replace(/^DIREITO\s+/i, '')
    .replace(/^DA\s+/i, '')
    .replace(/^DO\s+/i, '')
    .replace(/^DE\s+/i, '')
    .trim();

  // Converte ALL CAPS agressivo em Title Case polido
  if (limpo === limpo.toUpperCase()) {
    return limpo
      .toLowerCase()
      .split(' ')
      .map((w, idx) => {
        if (idx > 0 && ['de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'e', 'a', 'o'].includes(w)) {
          return w;
        }
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }
  return limpo;
}

export const AulasTabEstatisticas: React.FC<AulasTabEstatisticasProps> = ({
  disciplinaAtual,
  materias,
  aulas,
  calcularProgressoCiclo,
  acertosMap = {},
  corDestaque = '#fbbf24',
  onSelecionarMateria,
  onIniciarAula,
  onVoltar,
}) => {
  const [subAba, setSubAba] = useState<'graficos' | 'progresso'>('graficos');
  const [insightIdx, setInsightIdx] = useState(0);

  // 1. Estatísticas individuais matéria por matéria
  const estatisticasMaterias = useMemo(() => {
    return materias.map(mat => {
      const aulasMat = aulas.filter(a => a.materiaId === mat.id);
      const totalAulas = aulasMat.length;
      const aulasTerminadas = aulasMat.filter(a => calcularProgressoCiclo(a).aulaTerminada).length;
      const flashcardsFeitos = aulasMat.filter(a => calcularProgressoCiclo(a).fcOk).length;
      const questoesFeitas = aulasMat.filter(a => calcularProgressoCiclo(a).questoesOk).length;
      const somaProg = aulasMat.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
      const pctConclusao = totalAulas > 0 ? Math.round(somaProg / totalAulas) : 0;

      let totalAcertos = 0;
      let totalPerguntas = 0;
      aulasMat.forEach(a => {
        const q = acertosMap[a.id];
        if (q && q.total > 0) {
          totalAcertos += q.acertos;
          totalPerguntas += q.total;
        } else if (calcularProgressoCiclo(a).questoesOk) {
          totalAcertos += 8;
          totalPerguntas += 10;
        }
      });

      const taxaAcerto = totalPerguntas > 0 
        ? Math.round((totalAcertos / totalPerguntas) * 100) 
        : (aulasTerminadas > 0 ? 80 : 0);

      const scoreComposto = Math.round((pctConclusao * 0.5) + (taxaAcerto * 0.5));

      return {
        materia: mat,
        totalAulas,
        aulasTerminadas,
        flashcardsFeitos,
        questoesFeitas,
        pctConclusao,
        taxaAcerto,
        totalAcertos,
        totalPerguntas,
        scoreComposto
      };
    });
  }, [aulas, materias, calcularProgressoCiclo, acertosMap]);

  // Totais Globais
  const totalAulasFeitas = useMemo(() => aulas.filter(a => calcularProgressoCiclo(a).aulaTerminada).length, [aulas, calcularProgressoCiclo]);
  const totalFlashcardsFeitos = useMemo(() => aulas.filter(a => calcularProgressoCiclo(a).fcOk).length, [aulas, calcularProgressoCiclo]);
  const totalQuestoesFeitas = useMemo(() => aulas.filter(a => calcularProgressoCiclo(a).questoesOk).length, [aulas, calcularProgressoCiclo]);
  const aulasEmAndamento = useMemo(() => {
    return aulas.filter(a => {
      const p = calcularProgressoCiclo(a);
      return p.porcentagemTotal > 0 && p.porcentagemTotal < 100;
    });
  }, [aulas, calcularProgressoCiclo]);

  const aulasConcluidasCiclo = useMemo(() => {
    return aulas.filter(a => calcularProgressoCiclo(a).cicloCompleto);
  }, [aulas, calcularProgressoCiclo]);

  const ultimaAulaAndamento = aulasEmAndamento[0] || (totalAulasFeitas === 0 ? aulas[0] : null);

  // Ordenações e Destaques
  const materiasOrdenadas = useMemo(() => {
    return [...estatisticasMaterias].sort((a, b) => b.scoreComposto - a.scoreComposto);
  }, [estatisticasMaterias]);

  const materiaTopAcertos = useMemo(() => {
    const comQuestoes = estatisticasMaterias.filter(m => m.questoesFeitas > 0 || m.pctConclusao > 0);
    if (comQuestoes.length > 0) {
      return [...comQuestoes].sort((a, b) => b.taxaAcerto - a.taxaAcerto)[0];
    }
    return estatisticasMaterias[0] || null;
  }, [estatisticasMaterias]);

  const materiaMenosErros = useMemo(() => {
    const comAulas = estatisticasMaterias.filter(m => m.aulasTerminadas > 0);
    if (comAulas.length > 0) {
      return [...comAulas].sort((a, b) => (b.taxaAcerto + b.pctConclusao) - (a.taxaAcerto + a.pctConclusao))[0];
    }
    return estatisticasMaterias[1] || estatisticasMaterias[0] || null;
  }, [estatisticasMaterias]);

  const materiaParaReforcar = useMemo(() => {
    const iniciadas = estatisticasMaterias.filter(m => m.pctConclusao > 0 && m.pctConclusao < 100);
    if (iniciadas.length > 0) {
      return [...iniciadas].sort((a, b) => a.scoreComposto - b.scoreComposto)[0];
    }
    const diferente = estatisticasMaterias.find(m => m.materia.id !== materiaTopAcertos?.materia.id);
    return diferente || estatisticasMaterias[1] || estatisticasMaterias[0] || null;
  }, [estatisticasMaterias, materiaTopAcertos]);

  const taxaPrecisaoGeral = useMemo(() => {
    const comDados = estatisticasMaterias.filter(m => m.totalPerguntas > 0);
    if (comDados.length > 0) {
      const soma = comDados.reduce((acc, m) => acc + m.taxaAcerto, 0);
      return Math.round(soma / comDados.length);
    }
    return totalAulasFeitas > 0 ? 82 : 0;
  }, [estatisticasMaterias, totalAulasFeitas]);

  // 2. Gráfico de Radar
  const radarData = useMemo(() => {
    return DISCIPLINAS_CATALOGO.slice(0, 8).map(disc => {
      const aulasDisc = aulas.filter(a => a.disciplinaId === disc.id);
      const totalDisc = aulasDisc.length;
      const concluídasDisc = aulasDisc.filter(a => calcularProgressoCiclo(a).aulaTerminada).length;
      const pct = totalDisc > 0 ? Math.round((concluídasDisc / totalDisc) * 100) : 0;

      const nomeCurto = disc.nome
        .replace(/^DIREITO\s+/i, '')
        .replace(/^PROCESSUAL\s+/i, 'PROC. ')
        .trim();

      return {
        area: nomeCurto,
        dominio: pct,
        max: 100,
        totalAulas: totalDisc,
        concluidas: concluídasDisc,
      };
    });
  }, [aulas, calcularProgressoCiclo]);

  // 3. Gráfico de Pizza / Donut
  const pieData = useMemo(() => {
    const concluidas = aulasConcluidasCiclo.length;
    const emAndamento = aulasEmAndamento.length;
    const pendentes = Math.max(0, aulas.length - concluidas - emAndamento);

    if (concluidas === 0 && emAndamento === 0) {
      return [
        { name: 'A Iniciar', value: aulas.length || 1, color: CORES_DONUT.pendentes },
      ];
    }

    return [
      { name: 'Ciclo Concluído', value: concluidas, color: CORES_DONUT.concluidas },
      { name: 'Em Andamento', value: emAndamento, color: CORES_DONUT.emAndamento },
      { name: 'Pendentes', value: pendentes, color: CORES_DONUT.pendentes },
    ].filter(item => item.value > 0);
  }, [aulas.length, aulasConcluidasCiclo.length, aulasEmAndamento.length]);

  // 4. Gráfico de Colunas
  const barData = useMemo(() => {
    return DISCIPLINAS_CATALOGO.slice(0, 7).map(disc => {
      const aulasDisc = aulas.filter(a => a.disciplinaId === disc.id);
      const concluidas = aulasDisc.filter(a => calcularProgressoCiclo(a).aulaTerminada).length;
      const total = aulasDisc.length;
      const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
      
      const nomeCurto = disc.nome
        .replace(/^DIREITO\s+/i, '')
        .replace(/^PROCESSUAL\s+/i, 'PROC. ')
        .trim();

      return {
        name: nomeCurto,
        acerto: pct,
        aulas: concluidas,
        total: total,
      };
    });
  }, [aulas, calcularProgressoCiclo]);

  // Insights Rotativos Dinâmicos
  const insights = useMemo(() => [
    `🏆 Maior Êxito: ${materiaTopAcertos?.materia.titulo ? `"${formatarTituloElegante(materiaTopAcertos.materia.titulo)}"` : 'Inicie as aulas para calcular seu maior êxito.'}`,
    `🛡️ Menor Índice de Erros: ${materiaMenosErros?.materia.titulo ? `"${formatarTituloElegante(materiaMenosErros.materia.titulo)}"` : 'Pratique questões para mapear retenção.'}`,
    `🎯 Precisão Global estimada em ${taxaPrecisaoGeral}% com base no ciclo de estudos.`,
    `⚡ ${totalFlashcardsFeitos} flashcards revisados de ${aulas.length} aulas ativas.`,
    `📚 Sugestão: Avançar nos módulos de "${formatarTituloElegante(materiaParaReforcar?.materia.titulo || 'sua trilha')}".`
  ], [materiaTopAcertos, materiaMenosErros, taxaPrecisaoGeral, totalFlashcardsFeitos, aulas.length, materiaParaReforcar]);

  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIdx(prev => (prev + 1) % insights.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [insights.length]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 pb-24 animate-in fade-in duration-300 select-none">
      {/* ── TOP BAR 100% RESPONSIVA (SEM QUEBRAS DE LINHA AWKWARD) ── */}
      <div className="w-full pt-1 pb-2.5 border-b border-white/10">
        <div className="w-full flex items-center justify-between gap-2">
          {/* Lado Esquerdo: Botão Voltar Circular + Título Nobre em Linha Única */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {onVoltar && (
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  onVoltar();
                }}
                className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/60 border border-white/20 text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-lg shrink-0"
                aria-label="Voltar para trilhas"
              >
                <ArrowLeft className="w-5 h-5 xs:w-5.5 xs:h-5.5 stroke-[2.4]" />
              </button>
            )}

            <div className="min-w-0 flex-1 pr-1">
              <div className="flex items-center gap-1.5 truncate">
                <BarChart3 className="w-4 h-4 text-amber-400 shrink-0 hidden xs:inline-block" />
                <h1 className="text-sm xs:text-base sm:text-lg font-serif font-black uppercase tracking-wider text-white truncate drop-shadow-sm">
                  Estatísticas & Desempenho
                </h1>
              </div>
              <p className="text-[10px] xs:text-[11px] text-zinc-400 font-sans truncate">
                Diagnóstico de retenção e acertos em aulas
              </p>
            </div>
          </div>

          {/* Lado Direito: Seletor Segmentado */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/15 shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setSubAba('graficos');
              }}
              className={cn(
                "px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-lg text-[11px] xs:text-xs font-bold transition-all cursor-pointer",
                subAba === 'graficos'
                  ? "bg-amber-400 text-zinc-950 shadow-md font-black"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Gráficos
            </button>
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setSubAba('progresso');
              }}
              className={cn(
                "px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-lg text-[11px] xs:text-xs font-bold transition-all cursor-pointer",
                subAba === 'progresso'
                  ? "bg-amber-400 text-zinc-950 shadow-md font-black"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Módulos
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 CARDS DE RESUMO EM NÚMEROS (LAYOUT PREMIUM REFINADO) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#141416]/85 border border-white/10 backdrop-blur-xl flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg hover:border-red-500/30 transition-all">
          <div className="p-1.5 xs:p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 mb-1.5 shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] xs:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Aulas Feitas</span>
          <span className="text-base sm:text-xl font-black font-mono text-white mt-0.5">
            {totalAulasFeitas}
            <span className="text-[11px] text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#141416]/85 border border-white/10 backdrop-blur-xl flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg hover:border-amber-500/30 transition-all">
          <div className="p-1.5 xs:p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-1.5 shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] xs:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Flashcards</span>
          <span className="text-base sm:text-xl font-black font-mono text-white mt-0.5">
            {totalFlashcardsFeitos}
            <span className="text-[11px] text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#141416]/85 border border-white/10 backdrop-blur-xl flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg hover:border-emerald-500/30 transition-all">
          <div className="p-1.5 xs:p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-1.5 shadow-sm">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] xs:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Questões</span>
          <span className="text-base sm:text-xl font-black font-mono text-white mt-0.5">
            {totalQuestoesFeitas}
            <span className="text-[11px] text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#141416]/85 border border-white/10 backdrop-blur-xl flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg hover:border-cyan-500/30 transition-all">
          <div className="p-1.5 xs:p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 mb-1.5 shadow-sm">
            <Target className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] xs:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Precisão Global</span>
          <span className="text-base sm:text-xl font-black font-mono text-cyan-300 mt-0.5">
            {taxaPrecisaoGeral}%
          </span>
        </div>
      </div>

      {/* ── MELHOR vs PIOR (ONDE É MELHOR VS ONDE PRECISA REFORÇAR) NA MESMA LINHA COM "VS" NO MEIO ELEGANTE ── */}
      <div className="relative w-full my-2">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 items-stretch">
          {/* LADO ESQUERDO: MAIS FACILIDADE / MELHOR DESEMPENHO */}
          <div 
            onClick={() => {
              try { haptic.selection(); } catch {}
              if (materiaTopAcertos) onSelecionarMateria(materiaTopAcertos.materia.id);
            }}
            className="p-3 xs:p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-black/85 to-black/95 border border-amber-500/40 shadow-xl cursor-pointer hover:border-amber-400/70 active:scale-[0.98] transition-all group flex flex-col justify-between backdrop-blur-xl relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 truncate">
                  <Trophy className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Mais Facilidade</span>
                </span>
                <span className="text-[8px] xs:text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                  Maior Êxito
                </span>
              </div>

              <div className="my-1.5 xs:my-2 min-h-[40px] xs:min-h-[46px] flex flex-col justify-center">
                <h4 className="text-xs xs:text-sm sm:text-base font-serif font-black text-white group-hover:text-amber-200 transition-colors line-clamp-2 leading-snug">
                  {formatarTituloElegante(materiaTopAcertos?.materia.titulo || 'Noções Gerais de Direito')}
                </h4>
                <p className="text-[10px] xs:text-[11px] text-zinc-400 mt-1 truncate">
                  {materiaTopAcertos?.aulasTerminadas || 0} de {materiaTopAcertos?.totalAulas || 10} aulas
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] xs:text-xs">
              <span className="text-zinc-400">Taxa de Acertos:</span>
              <span className="font-mono font-black text-amber-300 text-xs xs:text-sm">
                {materiaTopAcertos?.taxaAcerto || 0}%
              </span>
            </div>
          </div>

          {/* LADO DIREITO: ONDE PRECISA REFORÇAR / PIOR DESEMPENHO */}
          <div 
            onClick={() => {
              try { haptic.selection(); } catch {}
              if (materiaParaReforcar) onSelecionarMateria(materiaParaReforcar.materia.id);
            }}
            className="p-3 xs:p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-500/15 via-black/85 to-black/95 border border-rose-500/40 shadow-xl cursor-pointer hover:border-rose-400/70 active:scale-[0.98] transition-all group flex flex-col justify-between backdrop-blur-xl relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1 truncate">
                  <AlertTriangle className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Mais Desafio</span>
                </span>
                <span className="text-[8px] xs:text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-400/20 text-rose-300 border border-rose-400/30 shrink-0">
                  Reforçar
                </span>
              </div>

              <div className="my-1.5 xs:my-2 min-h-[40px] xs:min-h-[46px] flex flex-col justify-center">
                <h4 className="text-xs xs:text-sm sm:text-base font-serif font-black text-white group-hover:text-rose-200 transition-colors line-clamp-2 leading-snug">
                  {formatarTituloElegante(materiaParaReforcar?.materia.titulo || 'Princípios Penais')}
                </h4>
                <p className="text-[10px] xs:text-[11px] text-zinc-400 mt-1 truncate">
                  {materiaParaReforcar?.aulasTerminadas || 0} de {materiaParaReforcar?.totalAulas || 10} aulas
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] xs:text-xs">
              <span className="text-zinc-400">Aproveitamento:</span>
              <span className="font-mono font-black text-rose-300 text-xs xs:text-sm">
                {materiaParaReforcar?.taxaAcerto || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* BADGE "VS" CENTRALIZADO ELEGANTE */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-[#121214] border-2 border-amber-400/80 shadow-[0_0_16px_rgba(251,191,36,0.65),0_4px_12px_rgba(0,0,0,0.9)] flex items-center justify-center">
            <span className="text-[10px] xs:text-[11px] font-serif font-black italic tracking-tighter text-amber-400 select-none">
              vs
            </span>
          </div>
        </div>
      </div>

      {subAba === 'graficos' && (
        <div className="space-y-5">
          {/* ══════════════════════════════════════════════════════════════════════════
              GRÁFICO 1: RADAR DE DOMÍNIO POR ÁREA
             ══════════════════════════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5 rounded-3xl bg-black/70 border border-white/15 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-white">
                    Radar de Competências por Área
                  </h3>
                  <p className="text-[10.5px] text-zinc-400">
                    Domínio comparativo em 8 áreas jurídicas
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                0 - 100%
              </span>
            </div>

            <div className="w-full h-[270px] xs:h-[300px] sm:h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="rgba(255, 255, 255, 0.14)" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="area" 
                    tick={{ fill: '#e4e4e7', fontSize: 10, fontWeight: 700, fontFamily: 'serif' }} 
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#71717a', fontSize: 9 }}
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      borderColor: 'rgba(245, 158, 11, 0.4)',
                      borderRadius: '16px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.95)',
                      padding: '8px 12px',
                      color: '#ffffff'
                    }}
                    itemStyle={{ color: '#fbbf24', fontWeight: 800, fontSize: '13px' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}
                    formatter={(val: any) => [`${val}% concluído`, 'Domínio']}
                  />
                  <Radar 
                    name="Domínio" 
                    dataKey="dominio" 
                    stroke="#fbbf24" 
                    strokeWidth={2.5}
                    fill="#f59e0b" 
                    fillOpacity={0.35} 
                    activeDot={{ r: 5, fill: '#fff', stroke: '#fbbf24', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[10px] text-center text-zinc-400 mt-1 italic font-serif">
              * A teia se expande conforme você avança pelas aulas interativas e fixa os flashcards.
            </p>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════
              GRÁFICO 2: PIZZA / DONUT DE APROVEITAMENTO DO CICLO
             ══════════════════════════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5 rounded-3xl bg-black/70 border border-white/15 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
                  <PieIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-white">
                    Distribuição do Ciclo de Estudo
                  </h3>
                  <p className="text-[10.5px] text-zinc-400">
                    Aulas completas, em andamento e pendentes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
              <div className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={600}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.6)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        padding: '6px 10px',
                        color: '#fff'
                      }}
                      formatter={(val: any, name: any) => [`${val} aulas`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {totalAulasFeitas}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                    Concluídas
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-xs font-bold text-zinc-200">Ciclo Concluído (3 Atos)</span>
                  </div>
                  <span className="font-mono font-black text-xs text-emerald-400">
                    {aulasConcluidasCiclo.length}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-xs font-bold text-zinc-200">Em Andamento</span>
                  </div>
                  <span className="font-mono font-black text-xs text-amber-400">
                    {aulasEmAndamento.length}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-zinc-600" />
                    <span className="text-xs font-bold text-zinc-400">A Iniciar</span>
                  </div>
                  <span className="font-mono font-black text-xs text-zinc-400">
                    {Math.max(0, aulas.length - totalAulasFeitas)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════
              GRÁFICO 3: COLUNAS DE TAXA DE APROVEITAMENTO POR ÁREA
             ══════════════════════════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5 rounded-3xl bg-black/70 border border-white/15 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-white">
                    Aproveitamento por Disciplina
                  </h3>
                  <p className="text-[10.5px] text-zinc-400">
                    Progresso percentual de conclusão por área
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full h-[220px] xs:h-[240px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#71717a', fontSize: 9 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      borderColor: 'rgba(245, 158, 11, 0.4)',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      color: '#fff'
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (${item.payload.aulas}/${item.payload.total} aulas)`,
                      'Conclusão'
                    ]}
                  />
                  <Bar 
                    dataKey="acerto" 
                    fill="#f59e0b" 
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-ABA DE MÓDULOS COM TIPOGRAFIA NOBRE E CLÁSSICA (TITLE CASE SERIF) ── */}
      {subAba === 'progresso' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-white">
              Todos os Módulos do Curso
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">
              {materias.length} módulos disponíveis
            </span>
          </div>

          <div className="space-y-2.5">
            {materiasOrdenadas.map((item, index) => {
              const isTop = index === 0 && item.scoreComposto > 0;
              const tituloElegante = formatarTituloElegante(item.materia.titulo);

              return (
                <div 
                  key={item.materia.id}
                  onClick={() => onSelecionarMateria(item.materia.id)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer group shadow-lg flex items-center justify-between gap-3.5 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Medalhão Numérico Dourado */}
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0 shadow">
                      <span className="font-mono font-black text-xs text-amber-300">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-black text-sm xs:text-[14.5px] sm:text-base text-white tracking-wide group-hover:text-amber-300 transition-colors truncate drop-shadow-sm">
                          {tituloElegante}
                        </h4>
                        {isTop && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 shrink-0 border border-amber-400/30">
                            Top Êxito
                          </span>
                        )}
                      </div>

                      {/* Barra de Progresso Suave */}
                      <div className="w-full h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 bg-amber-400"
                          style={{ width: `${Math.max(item.pctConclusao, 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-black text-xs sm:text-sm text-amber-300 block">
                        {item.pctConclusao}%
                      </span>
                      <span className="text-[9px] text-zinc-500 block font-mono">
                        {item.aulasTerminadas}/{item.totalAulas} aulas
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-300 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
