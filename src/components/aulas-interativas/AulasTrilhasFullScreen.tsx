import React, { useState, useMemo } from 'react';
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
import { FallingLotusPetals } from '@/components/flashcards/FallingLotusPetals';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

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

  // ── MENU DE ALTERNÂNCIA SUPERIOR ORGANIZADO POR MÓDULOS ──
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
    <div className="fixed inset-0 z-[9990] bg-[#0A0708] flex flex-col text-white overflow-hidden animate-in fade-in duration-200">
      {/* ── FUNDO OFICIAL CLÁSSICO FIXO DA TRILHA (ESTILO ÁREAS DO DIREITO) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#0a0705]">
        <img
          src={greciaFilosofosFundo}
          alt="Trilha Oficial de Estudos"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[0.6px] brightness-[0.4] contrast-[1.05] transition-opacity duration-500 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D]/95 via-[#0D0D0D]/85 to-[#0D0D0D] pointer-events-none" />
      </div>

      {/* Símbolos da Justiça Dourados Flutuando (120fps GPU) */}
      <FallingLotusPetals />

      {/* ── HEADER NATIVO FULL SCREEN COM BOTÃO VOLTAR PREMIUM ── */}
      <div className="relative z-30 shrink-0">
        <PageHeader 
          title="TRILHAS DE ESTUDO"
          subtitle="106 Módulos Oficiais • 3.192 Aulas"
          onBack={onClose}
          variant="dark"
        />
      </div>

      {/* ── SEÇÃO SUPERIOR: PROGRESSO GERAL DA TRILHA COM BARRA & BUSCA ── */}
      <div className="relative z-30 shrink-0 bg-zinc-950/90 border-b border-zinc-800/80 px-3.5 sm:px-6 py-3 backdrop-blur-xl space-y-2.5 shadow-2xl">
        {/* Card do Progresso Geral */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-950/95 to-zinc-900/90 border border-white/10 p-3 sm:p-3.5 shadow-xl">
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
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 transition-colors shadow-inner"
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

        {/* ── MENU DE ALTERNÂNCIA EM CIMA POR MÓDULOS ── */}
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

      {/* ── CORPO DA TRILHA EM ZIGZAG SERPENTEANTE COM CAPAS 1:1 ── */}
      <div 
        className="flex-1 overflow-y-auto w-full relative z-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2 sm:px-6 py-4"
        style={{ paddingBottom: 'calc(5rem + var(--sai-bottom, env(safe-area-inset-bottom, 24px)))' }}
      >
        <div className="w-full min-w-0 max-w-3xl mx-auto flex flex-col items-center">
          
          {/* ── CUME DA TRILHA DE MÓDULOS ── */}
          <div className="w-full flex flex-col items-center justify-center pt-2 pb-4">
            <div className="relative flex flex-col items-center">
              {/* Ícone Monumental */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 via-zinc-900 to-zinc-950 border border-teal-500/40 flex items-center justify-center shadow-[0_0_24px_rgba(45,212,191,0.35)] mb-2">
                <Sparkles className="w-7 h-7 text-teal-400 drop-shadow-[0_2px_8px_rgba(45,212,191,0.6)]" />
              </div>

              {/* Placa com Nome da Trilha */}
              <div className="px-4 py-1.5 rounded-full bg-zinc-900/90 border border-teal-500/30 flex items-center gap-2 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.85)]">
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf] animate-pulse" />
                <span className="text-[11px] sm:text-xs font-serif font-black tracking-widest uppercase text-white">
                  Trilha Oficial de Estudos
                </span>
              </div>

              {/* Descrição: 106 Módulos → 3.192 Aulas */}
              <div className="flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-mono font-semibold mt-2 px-3 py-1 rounded-full bg-zinc-950/80 border border-white/10 text-zinc-300">
                <span>106 módulos</span>
                <span className="text-teal-400 font-bold">→</span>
                <span>3.192 aulas</span>
                <span className="text-teal-400 font-bold">→</span>
                <span className="text-teal-300 font-bold">{pctGeral}% concluído</span>
              </div>

              {/* Linha vertical conectora saindo do cume para a primeira curva */}
              <div className="w-1 h-6 my-2 rounded-full bg-gradient-to-b from-teal-400 to-teal-600 shadow-[0_0_10px_rgba(45,212,191,0.6)]" />
            </div>
          </div>

          {/* ── NÓS SERPENTEANTES EM ZIGZAG: CADA NÓ É UM MÓDULO COM CAPA 1:1 ── */}
          {modulosExibidos.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              Nenhum módulo encontrado para o filtro selecionado.
            </div>
          ) : (
            modulosExibidos.map((mod, i) => {
              const isLast = i === modulosExibidos.length - 1;
              const isSelected = faseSelecionadaId === mod.id;
              const prog = getModuloProgress(mod);
              const isCompleted = prog.pct >= 100;

              // Alternância orgânica em curva zigzag (0 = esquerda, 1 = direita)
              const shiftIndex = i % 2;
              const alignmentClass = shiftIndex === 0
                ? "justify-start pl-1 xs:pl-2.5 sm:pl-6"
                : "justify-end pr-1 xs:pr-2.5 sm:pr-6";
              const isNextShiftRight = shiftIndex === 0;

              return (
                <div
                  key={mod.id}
                  id={`trilha-modulo-${mod.id}`}
                  className="w-full flex flex-col items-center select-none"
                >
                  {/* Card do Módulo em Zigzag */}
                  <div className={cn("w-full flex z-10 my-1 sm:my-1.5", alignmentClass)}>
                    <div
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        setModuloDedicado(mod);
                      }}
                      className={cn(
                        "w-[90vw] xs:w-[88vw] sm:w-[470px] max-w-[94vw] sm:max-w-[490px] rounded-2xl border transition-all duration-300 cursor-pointer p-2.5 sm:p-3 flex items-center gap-3 sm:gap-3.5 group select-none backdrop-blur-md",
                        isSelected 
                          ? "border-teal-500/70 bg-gradient-to-r from-teal-950/60 via-zinc-900 to-zinc-900 ring-1 ring-teal-500/50 shadow-[0_12px_28px_rgba(0,0,0,0.9),0_0_18px_rgba(45,212,191,0.25)] scale-[1.02]" 
                          : isCompleted
                          ? "border-emerald-500/40 bg-zinc-900/80 hover:border-emerald-500/60 shadow-[0_12px_24px_rgba(0,0,0,0.85)] hover:scale-[1.01]"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/75 hover:bg-zinc-900 shadow-[0_12px_24px_rgba(0,0,0,0.85)] hover:scale-[1.01] active:scale-[0.98]"
                      )}
                    >
                      {/* Capa 1:1 Quadrada Oficial do Módulo com Badge */}
                      <div className="w-[72px] h-[72px] xs:w-[80px] xs:h-[80px] sm:w-[88px] sm:h-[88px] rounded-xl sm:rounded-2xl overflow-hidden aspect-square border border-white/15 relative shrink-0 bg-zinc-950 shadow-md">
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
                            <BookOpen className="w-6 h-6 text-white/90" />
                          </div>
                        )}

                        {/* Badge com Número do Módulo */}
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-black bg-black/85 text-white border border-white/25 shadow">
                          #{mod.moduloNumero}
                        </span>

                        {/* Selo de Concluído se 100% */}
                        {isCompleted && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_8px_#10b981]">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Informações Textuais e Progresso */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] xs:text-[9.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 leading-none">
                            Módulo {mod.moduloNumero}
                          </span>
                          <span className="text-[10.5px] xs:text-[11px] font-mono text-zinc-400">
                            {mod.totalAulas} aulas
                          </span>
                        </div>

                        <h3 className="font-serif font-black text-white text-xs xs:text-[13px] sm:text-[14.5px] leading-snug group-hover:text-teal-300 transition-colors line-clamp-2">
                          {mod.nome}
                        </h3>

                        <p className="text-[10px] xs:text-[11px] text-zinc-400 font-sans line-clamp-1">
                          {mod.sobre}
                        </p>

                        {/* Mini Barra de Progresso do Módulo */}
                        <div className="pt-1 space-y-0.5">
                          <div className="flex items-center justify-between text-[9.5px] xs:text-[10px] font-mono text-zinc-400">
                            <span>{prog.concluidas}/{mod.totalAulas} concluídas</span>
                            <strong className={prog.pct > 0 ? "text-teal-400" : "text-zinc-500"}>
                              {prog.pct}%
                            </strong>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-800/90 overflow-hidden shadow-inner">
                            <div 
                              style={{ width: `${Math.max(prog.pct > 0 ? 3 : 0, prog.pct)}%` }}
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(45,212,191,0.4)]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Seta Chevron Circular */}
                      <div className="shrink-0 pl-1">
                        <div className="w-7 h-7 xs:w-8 xs:h-8 rounded-full bg-white/5 group-hover:bg-teal-500/20 border border-white/10 group-hover:border-teal-500/40 flex items-center justify-center text-zinc-400 group-hover:text-teal-300 transition-all shadow">
                          <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── CAMINHO SERPENTEANTE EM CURVA (ESTILO ÁREAS DO DIREITO) ── */}
                  {!isLast && (
                    <div className="relative w-full max-w-[540px] h-14 sm:h-16 pointer-events-none z-0 overflow-visible my-0.5">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id={`trail-path-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2dd4bf" />
                            <stop offset="50%" stopColor="#14b8a6" />
                            <stop offset="100%" stopColor="#0d9488" />
                          </linearGradient>
                          <filter id={`trail-path-glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Base escura da estrada de montanha */}
                        <path
                          d={isNextShiftRight ? "M 32 0 C 32 60, 68 40, 68 100" : "M 68 0 C 68 60, 32 40, 32 100"}
                          fill="none"
                          stroke="#111114"
                          strokeWidth="9"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />

                        {/* Borda esculpida com contraste */}
                        <path
                          d={isNextShiftRight ? "M 32 0 C 32 60, 68 40, 68 100" : "M 68 0 C 68 60, 32 40, 32 100"}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.12)"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />

                        {/* Linha luminosa pontilhada estilo trilha de aprendizagem */}
                        <path
                          d={isNextShiftRight ? "M 32 0 C 32 60, 68 40, 68 100" : "M 68 0 C 68 60, 32 40, 32 100"}
                          fill="none"
                          stroke={`url(#trail-path-grad-${i})`}
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeDasharray="6 4"
                          vectorEffect="non-scaling-stroke"
                          filter={`url(#trail-path-glow-${i})`}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* ── LOUROS DA VITÓRIA CLÁSSICOS NO RODAPÉ DA TRILHA ── */}
          <div className="w-full max-w-md mx-auto flex items-center justify-between px-6 pt-10 pb-6 text-teal-400/80">
            <svg className="w-9 h-9 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
              <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
              <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
            </svg>
            <span className="text-[11px] font-serif font-black tracking-widest uppercase text-center text-teal-300">
              Trilha do Saber • 106 Módulos • 3.192 Aulas
            </span>
            <svg className="w-9 h-9 rotate-12 scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
              <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
              <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
            </svg>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AulasTrilhasFullScreen;
