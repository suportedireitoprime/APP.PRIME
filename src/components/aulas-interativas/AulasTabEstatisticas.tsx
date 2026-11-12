import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Trophy, BarChart3, TrendingUp, Layers, HelpCircle, 
  CheckCircle2, Sparkles, Flame, Award, Target, BookOpen, 
  ChevronRight, Activity, ShieldCheck, PieChart as PieIcon
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

// Cores refinadas do design imperial
const CORES_DONUT = {
  concluidas: '#10b981', // Verde Esmeralda Vitória
  emAndamento: '#f59e0b', // Âmbar Dourado
  pendentes: '#3f3f46', // Zinc nobre escuro
};

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

  // 1. Estatísticas por Matéria
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

  // Ordenações e Destaques (Onde mais acertou, onde teve mais facilidade, onde menos errou)
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
    return estatisticasMaterias[estatisticasMaterias.length - 1] || null;
  }, [estatisticasMaterias]);

  // Taxa de Precisão Geral Média
  const taxaPrecisaoGeral = useMemo(() => {
    const comDados = estatisticasMaterias.filter(m => m.totalPerguntas > 0);
    if (comDados.length > 0) {
      const soma = comDados.reduce((acc, m) => acc + m.taxaAcerto, 0);
      return Math.round(soma / comDados.length);
    }
    return totalAulasFeitas > 0 ? 82 : 0;
  }, [estatisticasMaterias, totalAulasFeitas]);

  // 2. Dados do Gráfico de Radar (Domínio por Área do Conhecimento)
  const radarData = useMemo(() => {
    return DISCIPLINAS_CATALOGO.slice(0, 8).map(disc => {
      const aulasDisc = aulas.filter(a => a.disciplinaId === disc.id);
      const totalDisc = aulasDisc.length;
      const concluídasDisc = aulasDisc.filter(a => calcularProgressoCiclo(a).aulaTerminada).length;
      const pct = totalDisc > 0 ? Math.round((concluídasDisc / totalDisc) * 100) : 0;

      // Nome curto para o vértice
      const nomeCurto = disc.nome
        .replace(/^DIREITO\s+/i, '')
        .replace(/^PROCESSUAL\s+/i, 'PROC. ')
        .trim();

      return {
        area: nomeCurto,
        dominio: pct, // Mesmo zerado, 0 é garantido
        max: 100,
        totalAulas: totalDisc,
        concluidas: concluídasDisc,
      };
    });
  }, [aulas, calcularProgressoCiclo]);

  // 3. Dados do Gráfico de Pizza / Donut (Ciclo de Aprendizado)
  const pieData = useMemo(() => {
    const concluidas = aulasConcluidasCiclo.length;
    const emAndamento = aulasEmAndamento.length;
    const pendentes = Math.max(0, aulas.length - concluidas - emAndamento);

    // Se tudo estiver zerado, exibe fatia pendente elegante para o gráfico não quebrar
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

  // 4. Dados do Gráfico de Colunas / Barras (Taxa de Acertos por Disciplina)
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

  // Ticker dinâmico de insights
  const insights = useMemo(() => [
    `🏆 Maior Êxito: ${materiaTopAcertos?.materia.titulo ? `"${materiaTopAcertos.materia.titulo}"` : 'Inicie as aulas para calcular seu maior êxito.'}`,
    `🛡️ Menor Índice de Erros: ${materiaMenosErros?.materia.titulo ? `"${materiaMenosErros.materia.titulo}"` : 'Pratique questões para mapear retenção.'}`,
    `🎯 Precisão Global estimada em ${taxaPrecisaoGeral}% com base no seu ciclo de estudos.`,
    `⚡ ${totalFlashcardsFeitos} flashcards revisados de ${aulas.length} aulas ativas.`,
    `📚 Sugestão: Avançar nos módulos de "${materiaParaReforcar?.materia.titulo || 'sua trilha'}".`
  ], [materiaTopAcertos, materiaMenosErros, taxaPrecisaoGeral, totalFlashcardsFeitos, aulas.length, materiaParaReforcar]);

  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIdx(prev => (prev + 1) % insights.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [insights.length]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300 select-none">
      {/* ── TOP BAR FIXA COM BOTÃO VOLTAR E TÍTULO IMPERIAL ── */}
      <div className="flex items-center justify-between gap-3 pt-2 pb-1 border-b border-white/10">
        <div className="flex items-center gap-3">
          {onVoltar && (
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onVoltar();
              }}
              className="w-11 h-11 xs:w-12 xs:h-12 rounded-full flex items-center justify-center bg-black/60 border border-white/20 text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-lg shrink-0"
              aria-label="Voltar para trilhas"
            >
              <ArrowLeft className="w-5.5 h-5.5 xs:w-6 xs:h-6 stroke-[2.4]" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h1 className="text-base sm:text-lg font-serif font-black uppercase tracking-wider text-white">
                Estatísticas & Desempenho
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-sans">
              Diagnóstico de retenção, precisão e progresso em aulas
            </p>
          </div>
        </div>

        {/* Seletor Segmentado: Gráficos vs Progresso */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              setSubAba('graficos');
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              subAba === 'graficos'
                ? "bg-amber-400 text-black shadow-md"
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
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              subAba === 'progresso'
                ? "bg-amber-400 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Módulos
          </button>
        </div>
      </div>

      {/* ── CARD CONTINUAR DE ONDE PAROU (SEMPRE DISPONÍVEL NO TOPO) ── */}
      {ultimaAulaAndamento && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-black/80 to-black/90 border border-amber-500/35 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="min-w-0 flex-1">
              <span 
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 text-amber-400"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                Continuar de Onde Parou
              </span>
              <h3 className="text-base sm:text-lg font-serif font-black text-white mt-1 truncate">
                {ultimaAulaAndamento.titulo}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Etapa {calcularProgressoCiclo(ultimaAulaAndamento).etapaAtual || 1} de {ultimaAulaAndamento.etapas || 30}
              </p>
              {/* Barra de Progresso da Aula */}
              <div className="w-full max-w-xs h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.max(calcularProgressoCiclo(ultimaAulaAndamento).porcentagemTotal, 4)}%` }}
                />
              </div>
            </div>

            {onIniciarAula && (
              <button
                type="button"
                onClick={() => {
                  try { haptic.impact('medium'); } catch {}
                  onIniciarAula(ultimaAulaAndamento);
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span>Continuar Aula</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TICKER DE ANÁLISE INTELIGENTE ── */}
      <div 
        className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 flex items-center gap-3 backdrop-blur-xl shadow-lg"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-zinc-400 block">
            DIAGNÓSTICO AUTOMÁTICO DE DESEMPENHO
          </span>
          <p className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">
            {insights[insightIdx]}
          </p>
        </div>
      </div>

      {/* ── 4 CARDS DE RESUMO EM NÚMEROS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg">
          <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Aulas Concluídas</span>
          <span className="text-lg sm:text-xl font-black text-white mt-0.5">
            {totalAulasFeitas}
            <span className="text-xs text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Flashcards</span>
          <span className="text-lg sm:text-xl font-black text-white mt-0.5">
            {totalFlashcardsFeitos}
            <span className="text-xs text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Questões</span>
          <span className="text-lg sm:text-xl font-black text-white mt-0.5">
            {totalQuestoesFeitas}
            <span className="text-xs text-zinc-500 font-normal">/{aulas.length}</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md flex flex-col items-center sm:items-start text-center sm:text-left shadow-lg">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 mb-2">
            <Target className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Precisão Global</span>
          <span className="text-lg sm:text-xl font-black text-white mt-0.5">
            {taxaPrecisaoGeral}%
          </span>
        </div>
      </div>

      {/* ── CARDS DE DIAGNÓSTICO: MAIOR ÊXITO / MENOR ÍNDICE DE ERRO ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card 1: Maior Facilidade e Mais Acertou */}
        <div 
          onClick={() => materiaTopAcertos && onSelecionarMateria(materiaTopAcertos.materia.id)}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-black/80 to-black/90 border border-amber-500/35 shadow-xl cursor-pointer hover:border-amber-400/60 transition-all group flex flex-col justify-between backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              ONDE VOCÊ TEM MAIS FACILIDADE
            </span>
            <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Maior Êxito
            </span>
          </div>

          <div className="my-3">
            <h4 className="text-base sm:text-lg font-serif font-black text-white group-hover:text-amber-200 transition-colors line-clamp-2">
              {materiaTopAcertos?.materia.titulo || 'Módulo Geral'}
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              {materiaTopAcertos?.aulasTerminadas || 0} de {materiaTopAcertos?.totalAulas || 10} aulas concluídas
            </p>
          </div>

          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Taxa de Acertos:</span>
            <span className="font-mono font-black text-amber-300 text-sm">
              {materiaTopAcertos?.taxaAcerto || 0}%
            </span>
          </div>
        </div>

        {/* Card 2: Menor Índice de Erros */}
        <div 
          onClick={() => materiaMenosErros && onSelecionarMateria(materiaMenosErros.materia.id)}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-black/80 to-black/90 border border-emerald-500/35 shadow-xl cursor-pointer hover:border-emerald-400/60 transition-all group flex flex-col justify-between backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              MENOR ÍNDICE DE ERROS
            </span>
            <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              Retenção Forte
            </span>
          </div>

          <div className="my-3">
            <h4 className="text-base sm:text-lg font-serif font-black text-white group-hover:text-emerald-200 transition-colors line-clamp-2">
              {materiaMenosErros?.materia.titulo || 'Fundamentos do Direito'}
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              {materiaMenosErros?.flashcardsFeitos || 0} fixações consolidadas
            </p>
          </div>

          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Consistência:</span>
            <span className="font-mono font-black text-emerald-300 text-sm">
              {materiaMenosErros?.taxaAcerto ? `${materiaMenosErros.taxaAcerto}%` : '100%'}
            </span>
          </div>
        </div>
      </div>

      {subAba === 'graficos' && (
        <div className="space-y-6">
          {/* ══════════════════════════════════════════════════════════════════════════
              GRÁFICO 1: RADAR DE DOMÍNIO POR ÁREA (TEIA DE ARANHA A 120FPS)
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

                {/* Centro do Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {totalAulasFeitas}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                    Concluídas
                  </span>
                </div>
              </div>

              {/* Legenda Informativa */}
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

      {/* ── SUB-ABA DE PROGRESSO DETALHADO POR MÓDULOS ── */}
      {subAba === 'progresso' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-white">
              Todos os Módulos do Curso
            </h3>
            <span className="text-[11px] text-zinc-400">
              {materias.length} módulos disponíveis
            </span>
          </div>

          <div className="space-y-3">
            {materiasOrdenadas.map((item, index) => {
              const isTop = index === 0 && item.scoreComposto > 0;
              return (
                <div 
                  key={item.materia.id}
                  onClick={() => onSelecionarMateria(item.materia.id)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer group shadow-lg flex items-center justify-between gap-3 backdrop-blur-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 w-5">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      <h4 className="font-bold text-sm text-zinc-200 group-hover:text-amber-200 transition-colors truncate">
                        {item.materia.titulo}
                      </h4>
                      {isTop && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 shrink-0">
                          Top Êxito
                        </span>
                      )}
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-white/10 mt-2.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 bg-amber-400"
                        style={{ width: `${Math.max(item.pctConclusao, 2)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-amber-300 block">
                        {item.pctConclusao}%
                      </span>
                      <span className="text-[9px] text-zinc-500 block">
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
