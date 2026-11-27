import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Home, Layers, Play, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { MateriaItem, AulaItem } from '@/data/aulasInterativasCatalogoCompleto';

interface AulasTrilhaMateriaViewProps {
  disciplinaAtual: DisciplinaItem;
  materiasDaDisc: MateriaItem[];
  aulasCatalogo: AulaItem[];
  buscaTermo: string;
  setBuscaTermo: (val: string) => void;
  handleVoltar: () => void;
  onSelecionarMateria: (materiaId: string) => void;
  onIniciarAula?: (aula: AulaItem) => void;
  onAbrirDetalheAula?: (aula: AulaItem) => void;
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
}

type FiltroStatus = 'todas' | 'andamento' | 'concluidas';

function formatarTituloMateriaCurto(titulo: string): string {
  if (!titulo) return '';
  return titulo
    .replace(/^DIREITO\s+/i, '')
    .replace(/^DA\s+/i, '')
    .replace(/^DO\s+/i, '')
    .replace(/^DE\s+/i, '')
    .trim();
}

export const AulasTrilhaMateriaView: React.FC<AulasTrilhaMateriaViewProps> = ({
  disciplinaAtual,
  materiasDaDisc,
  aulasCatalogo,
  buscaTermo,
  setBuscaTermo,
  handleVoltar,
  onSelecionarMateria,
  onIniciarAula,
  onAbrirDetalheAula,
  calcularProgressoCiclo,
}) => {
  const navigate = useNavigate();
  const [expandedMateriaId, setExpandedMateriaId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroStatus>('todas');

  const { totalAulasDisc, pctDisc, materiasComStats, materiaContinuar } = useMemo(() => {
    const aulasPorMateria = new Map<string, AulaItem[]>();
    let totalAulas = 0;
    let somaPct = 0;

    for (const a of aulasCatalogo) {
      if (a.disciplinaId !== disciplinaAtual.id) continue;
      totalAulas++;
      somaPct += calcularProgressoCiclo(a).porcentagemTotal;
      const list = aulasPorMateria.get(a.materiaId);
      if (list) list.push(a);
      else aulasPorMateria.set(a.materiaId, [a]);
    }

    const comStats = materiasDaDisc.map((mat, idx) => {
      const aulasDaMat = aulasPorMateria.get(mat.id) || [];
      const total = aulasDaMat.length;
      const somaMat = aulasDaMat.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
      const pct = total > 0 ? Math.round(somaMat / total) : 0;
      const concluidas = aulasDaMat.filter((a) => calcularProgressoCiclo(a).cicloCompleto).length;
      return {
        mat,
        idx,
        tituloCurto: formatarTituloMateriaCurto(mat.titulo) || mat.titulo,
        aulasDaMat,
        total,
        pct,
        concluidas,
      };
    });

    const emAndamento = comStats.find((m) => m.pct > 0 && m.pct < 100);
    const primeiraNaoConcluida = comStats.find((m) => m.pct < 100);
    const continuar = emAndamento || primeiraNaoConcluida || comStats[0] || null;

    return {
      totalAulasDisc: totalAulas,
      pctDisc: totalAulas > 0 ? Math.round(somaPct / totalAulas) : 0,
      materiasComStats: comStats,
      materiaContinuar: continuar,
    };
  }, [aulasCatalogo, calcularProgressoCiclo, disciplinaAtual.id, materiasDaDisc]);

  const termoBuscaNorm = buscaTermo.toLowerCase().trim();
  const materiasFiltradas = useMemo(() => {
    return materiasComStats.filter((item) => {
      if (filtro === 'andamento' && (item.pct <= 0 || item.pct >= 100)) return false;
      if (filtro === 'concluidas' && item.pct < 100) return false;
      if (!termoBuscaNorm) return true;
      const matchNome =
        item.mat.titulo.toLowerCase().includes(termoBuscaNorm) ||
        item.tituloCurto.toLowerCase().includes(termoBuscaNorm);
      const matchAula = item.aulasDaMat.some((a) =>
        a.titulo.toLowerCase().includes(termoBuscaNorm)
      );
      return matchNome || matchAula;
    });
  }, [filtro, materiasComStats, termoBuscaNorm]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#09090B] text-white relative">
      {/* Header fixo minimalista */}
      <header className="sticky top-0 z-30 w-full bg-[#09090B]/90 backdrop-blur-md border-b border-white/[0.06] px-3.5 sm:px-6 lg:px-10 pb-3 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        <div className="max-w-5xl lg:max-w-[1380px] mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              handleVoltar();
            }}
            aria-label="Voltar para áreas"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
              {disciplinaAtual.nome}
            </h1>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              <span className="truncate">
                {materiasDaDisc.length} matérias • {totalAulasDisc} aulas
              </span>
              <span className="text-zinc-600">•</span>
              <span className="font-semibold text-amber-400 tabular-nums shrink-0">
                {pctDisc}% concluído
              </span>
            </div>
            <div className="w-full max-w-xs h-1 rounded-full bg-white/10 overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${pctDisc}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              navigate('/');
            }}
            aria-label="Voltar para o Início"
            className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-200 active:scale-95 transition-colors shrink-0 cursor-pointer"
          >
            <Home className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 pt-3 pb-[calc(6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] space-y-3.5">
        {/* Busca + Filtros */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={buscaTermo}
              onChange={(e) => setBuscaTermo(e.target.value)}
              placeholder={`Buscar matéria ou aula em ${disciplinaAtual.nome}...`}
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            {buscaTermo && (
              <button
                type="button"
                onClick={() => setBuscaTermo('')}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {[
              { id: 'todas', label: `Todas (${materiasComStats.length})` },
              { id: 'andamento', label: 'Em andamento' },
              { id: 'concluidas', label: 'Concluídas' },
            ].map((chip) => {
              const ativo = filtro === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFiltro(chip.id as FiltroStatus);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                    ativo
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Atalho rápido: Continuar / Próxima matéria */}
        {!termoBuscaNorm && filtro === 'todas' && materiaContinuar && (
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onSelecionarMateria(materiaContinuar.mat.id);
            }}
            className="w-full p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                {materiaContinuar.pct > 0 && materiaContinuar.pct < 100 ? 'Continuar de onde parou' : 'Começar rápido'}
              </span>
              <p className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {materiaContinuar.tituloCurto}
              </p>
              <span className="text-xs text-zinc-400">
                {materiaContinuar.total} {materiaContinuar.total === 1 ? 'aula' : 'aulas'} • {materiaContinuar.pct}% concluído
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </button>
        )}

        {/* Lista prática / Grid responsivo de matérias */}
        {materiasFiltradas.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-2">
            <p className="text-sm text-zinc-300">
              Nenhuma matéria encontrada.
            </p>
            {(buscaTermo || filtro !== 'todas') && (
              <button
                type="button"
                onClick={() => {
                  setBuscaTermo('');
                  setFiltro('todas');
                }}
                className="text-xs font-semibold text-amber-400 underline cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {materiasFiltradas.map((item) => {
              const concluida = item.pct >= 100;
              const isExpanded = expandedMateriaId === item.mat.id;
              return (
                <div
                  key={item.mat.id}
                  id={`materia-section-${item.mat.id}`}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'col-span-full bg-white/[0.05] border-amber-500/40'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      if (onIniciarAula || onAbrirDetalheAula) {
                        setExpandedMateriaId((prev) => (prev === item.mat.id ? null : item.mat.id));
                      } else {
                        onSelecionarMateria(item.mat.id);
                      }
                    }}
                    className="group w-full p-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums shrink-0 border ${
                        concluida
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : item.pct > 0
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-white/5 border-white/10 text-zinc-400'
                      }`}
                    >
                      {concluida ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        String(item.idx + 1).padStart(2, '0')
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                        {item.tituloCurto}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-zinc-400 shrink-0">
                          {item.total} {item.total === 1 ? 'aula' : 'aulas'}
                        </span>
                        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden max-w-[90px]">
                          <div
                            className={`h-full rounded-full ${
                              concluida ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-zinc-400 tabular-nums shrink-0">
                          {item.pct}%
                        </span>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-amber-400 shrink-0 transition-transform" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0 transition-colors" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/10 px-3.5 py-3 space-y-2 bg-black/25">
                      {item.aulasDaMat.map((aula, aIdx) => {
                        const prog = calcularProgressoCiclo(aula);
                        const aulaConcluida = prog.cicloCompleto || prog.porcentagemTotal >= 100;
                        return (
                          <div
                            key={aula.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                try { haptic.selection(); } catch {}
                                if (onIniciarAula) {
                                  onIniciarAula(aula);
                                } else {
                                  onSelecionarMateria(item.mat.id);
                                }
                              }}
                              className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold tabular-nums shrink-0 border ${
                                  aulaConcluida
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : prog.porcentagemTotal > 0
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                    : 'bg-white/5 border-white/10 text-zinc-400'
                                }`}
                              >
                                {aulaConcluida ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  String(aIdx + 1).padStart(2, '0')
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-white truncate">
                                  {aula.titulo}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-20 h-1 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        aulaConcluida ? 'bg-emerald-400' : 'bg-amber-400'
                                      }`}
                                      style={{ width: `${prog.porcentagemTotal}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] text-zinc-400 tabular-nums">
                                    {prog.porcentagemTotal}%
                                  </span>
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {onAbrirDetalheAula && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    try { haptic.selection(); } catch {}
                                    onAbrirDetalheAula(aula);
                                  }}
                                  title="Etapas, flashcards e questões"
                                  aria-label="Etapas da aula"
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  try { haptic.selection(); } catch {}
                                  if (onIniciarAula) {
                                    onIniciarAula(aula);
                                  } else {
                                    onSelecionarMateria(item.mat.id);
                                  }
                                }}
                                aria-label={`Iniciar ${aula.titulo}`}
                                className="h-8 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span className="hidden sm:inline">
                                  {prog.porcentagemTotal > 0 && !aulaConcluida ? 'Continuar' : 'Iniciar'}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
