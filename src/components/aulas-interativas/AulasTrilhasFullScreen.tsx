import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Layers, ChevronRight, CheckCircle2, Sparkles, BookOpen, Search, 
  ArrowLeft, Filter, BookMarked, Award, Check
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { 
  TRILHAS_MODULOS_OFICIAIS, 
  TrilhaModuloOficial, 
  TrilhaModuloAula 
} from '@/data/aulasTrilhasModulosOficiais';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { AulasModuloDedicadoView } from './AulasModuloDedicadoView';
import { haptic } from '@/lib/nativeHaptics';

interface AulasTrilhasFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  disciplinas?: DisciplinaItem[];
  aulas?: AulaItem[];
  faseSelecionadaId?: string | null;
  onSelectFase?: (faseId: string | null) => void;
  onIniciarAula?: (aulaItem: TrilhaModuloAula | AulaItem) => void;
  moduloInicialId?: string | null;
  calcularProgressoCiclo?: (aula: AulaItem) => {
    aulaTerminada: boolean;
    porcentagemTotal: number;
  };
}

export const AulasTrilhasFullScreen: React.FC<AulasTrilhasFullScreenProps> = ({
  isOpen,
  onClose,
  disciplinas = [],
  aulas = [],
  faseSelecionadaId,
  onSelectFase,
  onIniciarAula,
  moduloInicialId = null,
  calcularProgressoCiclo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<string>('todos');
  const [moduloDedicado, setModuloDedicado] = useState<TrilhaModuloOficial | null>(() => {
    if (moduloInicialId) {
      return TRILHAS_MODULOS_OFICIAIS.find(m => m.id === moduloInicialId) || null;
    }
    return null;
  });

  useEffect(() => {
    if (moduloInicialId && isOpen) {
      const found = TRILHAS_MODULOS_OFICIAIS.find(m => m.id === moduloInicialId) || null;
      setModuloDedicado(found);
    } else if (!isOpen) {
      setModuloDedicado(null);
    }
  }, [moduloInicialId, isOpen]);

  // Cálculo de Progresso Geral da Trilha
  const { totalConcluidasGeral, totalAulasGeral, pctGeral } = useMemo(() => {
    const total = 3192;
    if (!calcularProgressoCiclo || aulas.length === 0) {
      return { totalConcluidasGeral: 0, totalAulasGeral: total, pctGeral: 0 };
    }
    const concluidas = aulas.filter(a => {
      const p = calcularProgressoCiclo(a);
      return p.aulaTerminada || p.porcentagemTotal >= 100;
    }).length;
    const pct = Math.round((concluidas / total) * 100);
    return { totalConcluidasGeral: concluidas, totalAulasGeral: total, pctGeral: pct };
  }, [aulas, calcularProgressoCiclo]);

  // Função para calcular progresso individual do módulo
  const getModuloProgress = (mod: TrilhaModuloOficial) => {
    if (!calcularProgressoCiclo || aulas.length === 0) {
      return { concluidas: 0, total: mod.totalAulas, pct: 0 };
    }
    const aulasDoMod = aulas.filter(a => mod.disciplinasIds.includes(a.disciplinaId));
    const concluidas = aulasDoMod.filter(a => {
      const p = calcularProgressoCiclo(a);
      return p.aulaTerminada || p.porcentagemTotal >= 100;
    }).length;
    const pct = mod.totalAulas > 0 ? Math.round((concluidas / mod.totalAulas) * 100) : 0;
    return { concluidas, total: mod.totalAulas, pct };
  };

  // ── MENU DE ALTERNÂNCIA SUPERIOR ORGANIZADO POR MÓDULOS (NÃO POR ÁREAS) ──
  const categoriasAlternancia = [
    { id: 'todos', label: 'Todos os Módulos (106)' },
    { id: '1-20', label: 'Módulos 1–20' },
    { id: '21-40', label: 'Módulos 21–40' },
    { id: '41-60', label: 'Módulos 41–60' },
    { id: '61-80', label: 'Módulos 61–80' },
    { id: '81-106', label: 'Módulos 81–106' },
    { id: 'em-andamento', label: 'Em Andamento' },
    { id: 'concluidos', label: 'Concluídos' },
  ];

  // Filtro de Módulos focado estritamente na identidade dos módulos
  const modulosExibidos = useMemo(() => {
    return TRILHAS_MODULOS_OFICIAIS.filter((mod) => {
      // 1. Busca textual (nome do módulo, número ou tema)
      const matchesSearch = 
        !searchTerm ||
        mod.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mod.moduloNumero.toString() === searchTerm.trim() ||
        mod.temas.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        mod.sobre.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Menu de alternância por Módulo / Etapa
      let matchesCategoria = true;
      if (abaAtiva === '1-20') matchesCategoria = mod.moduloNumero >= 1 && mod.moduloNumero <= 20;
      else if (abaAtiva === '21-40') matchesCategoria = mod.moduloNumero >= 21 && mod.moduloNumero <= 40;
      else if (abaAtiva === '41-60') matchesCategoria = mod.moduloNumero >= 41 && mod.moduloNumero <= 60;
      else if (abaAtiva === '61-80') matchesCategoria = mod.moduloNumero >= 61 && mod.moduloNumero <= 80;
      else if (abaAtiva === '81-106') matchesCategoria = mod.moduloNumero >= 81 && mod.moduloNumero <= 106;
      else if (abaAtiva === 'em-andamento') {
        const prog = getModuloProgress(mod);
        matchesCategoria = prog.pct > 0 && prog.pct < 100;
      } else if (abaAtiva === 'concluidos') {
        const prog = getModuloProgress(mod);
        matchesCategoria = prog.pct >= 100;
      }

      return matchesSearch && matchesCategoria;
    });
  }, [searchTerm, abaAtiva, aulas, calcularProgressoCiclo]);

  if (!isOpen) return null;

  // Se o usuário selecionou um módulo para abrir sua página dedicada
  if (moduloDedicado) {
    return (
      <AulasModuloDedicadoView 
        modulo={moduloDedicado}
        onVoltar={() => setModuloDedicado(null)}
        onIniciarAula={onIniciarAula}
        onSelecionarNoCatalogo={(modId) => {
          if (onSelectFase) onSelectFase(modId);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[9990] bg-[#0D0D0D] flex flex-col text-white overflow-hidden animate-in fade-in duration-200">
      {/* ── HEADER NATIVO FULL SCREEN COM BOTÃO VOLTAR PREMIUM ── */}
      <PageHeader 
        title="TRILHAS DE ESTUDO"
        subtitle="106 Módulos Oficiais • 3.192 Aulas"
        onBack={onClose}
        variant="dark"
      />

      {/* ── SEÇÃO SUPERIOR: PROGRESSO GERAL DA TRILHA COM BARRA ── */}
      <div className="shrink-0 bg-zinc-950/95 border-b border-zinc-800/80 px-4 sm:px-6 py-3.5 backdrop-blur-md space-y-3">
        {/* Card do Progresso Geral */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-white/10 p-3.5 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.4)]">
                <Award className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">
                Progresso Geral da Trilha
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-400">
                <strong className="text-white">{totalConcluidasGeral}</strong> de {totalAulasGeral.toLocaleString('pt-BR')} aulas
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-[#2dd4bf] border border-teal-500/30 font-bold">
                {pctGeral}%
              </span>
            </div>
          </div>

          {/* Barra de Progresso Geral */}
          <div className="w-full h-2 rounded-full bg-zinc-800/90 overflow-hidden shadow-inner">
            <div 
              style={{ width: `${Math.max(pctGeral > 0 ? 2 : 0, pctGeral)}%` }}
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-[#2dd4bf] rounded-full shadow-[0_0_10px_rgba(45,212,191,0.6)] transition-all duration-500 ease-out"
            />
          </div>
        </div>

        {/* Campo de Busca Rápida de Módulos */}
        <div className="relative w-full max-w-xl mx-auto">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar módulo pelo nome, número ou tema..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 transition-colors shadow-inner"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── MENU DE ALTERNÂNCIA EM CIMA POR MÓDULOS (NÃO POR ÁREAS) ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5 max-w-4xl mx-auto">
          {categoriasAlternancia.map((cat) => {
            const isCatActive = abaAtiva === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setAbaAtiva(cat.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isCatActive
                    ? 'bg-teal-500 text-black font-black shadow-[0_0_12px_rgba(45,212,191,0.5)] scale-102'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LISTA MINIMALISTA DE MÓDULOS COM BARRA DE PROGRESSO EM CADA ITEM ── */}
      <div 
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2.5 max-w-4xl mx-auto w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBottom: 'calc(4rem + var(--sai-bottom, env(safe-area-inset-bottom, 24px)))' }}
      >
        {modulosExibidos.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            Nenhum módulo encontrado para o filtro selecionado.
          </div>
        ) : (
          modulosExibidos.map((mod) => {
            const isSelected = faseSelecionadaId === mod.id;
            const prog = getModuloProgress(mod);

            return (
              <div
                key={mod.id}
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setModuloDedicado(mod);
                }}
                className={`rounded-2xl border transition-all duration-200 p-3.5 sm:p-4.5 flex items-center gap-3.5 sm:gap-4.5 cursor-pointer group hover:scale-[1.01] active:scale-[0.99] ${
                  isSelected
                    ? 'border-teal-500/60 bg-gradient-to-r from-teal-950/40 via-zinc-900 to-zinc-900 ring-1 ring-teal-500/40 shadow-lg'
                    : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900'
                }`}
              >
                {/* Thumbnail 1:1 Quadrado Limpo e Mais Amplo */}
                <div className="w-[72px] h-[72px] sm:w-[86px] sm:h-[86px] rounded-xl sm:rounded-2xl overflow-hidden shrink-0 aspect-square border border-white/10 relative shadow-md bg-zinc-950">
                  {mod.capaUrl ? (
                    <>
                      <img
                        src={mod.capaUrl}
                        alt={mod.nome}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                      style={{ background: mod.gradientBg }}
                    >
                      <BookOpen className="w-7 h-7 text-white/90" />
                    </div>
                  )}

                  {/* Número do Módulo */}
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black bg-black/85 text-white border border-white/20 shadow">
                    #{mod.moduloNumero}
                  </span>
                </div>

                {/* Conteúdo Textual Minimalista Focado no Módulo */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 leading-none">
                      Módulo {mod.moduloNumero}
                    </span>

                    <span className="text-[11.5px] font-mono text-zinc-400">
                      {mod.totalAulas} aulas • {mod.temas.length} temas
                    </span>
                  </div>

                  <h3 className="font-serif font-black text-white text-sm sm:text-base leading-snug group-hover:text-teal-300 transition-colors line-clamp-1">
                    {mod.nome}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-zinc-400 font-sans line-clamp-1 leading-relaxed">
                    {mod.sobre}
                  </p>

                  {/* ── BARRA DE PROGRESSO DO MÓDULO NA LISTA ── */}
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>{prog.concluidas} de {mod.totalAulas} aulas concluídas</span>
                      <strong className={prog.pct > 0 ? "text-teal-400" : "text-zinc-500"}>{prog.pct}%</strong>
                    </div>

                    <div className="w-full h-2 rounded-full bg-zinc-800/90 overflow-hidden shadow-inner">
                      <div 
                        style={{ width: `${Math.max(prog.pct > 0 ? 3 : 0, prog.pct)}%` }}
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Ação: Chevron Minimalista */}
                <div className="shrink-0 flex items-center gap-1.5 pl-1">
                  <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-teal-500/20 border border-white/10 group-hover:border-teal-500/40 flex items-center justify-center text-zinc-400 group-hover:text-teal-300 transition-all shadow">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AulasTrilhasFullScreen;
