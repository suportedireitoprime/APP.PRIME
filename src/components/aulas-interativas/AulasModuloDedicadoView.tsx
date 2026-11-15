import React, { useMemo } from 'react';
import { 
  ArrowLeft, BookOpen, BookMarked, Play, CheckCircle2, 
  Sparkles, Layers, ChevronRight
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { TrilhaModuloOficial, TrilhaModuloAula } from '@/data/aulasTrilhasModulosOficiais';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { haptic } from '@/lib/nativeHaptics';

interface AulasModuloDedicadoViewProps {
  modulo: TrilhaModuloOficial;
  onVoltar: () => void;
  onIniciarAula?: (aulaItem: TrilhaModuloAula | AulaItem) => void;
  onSelecionarNoCatalogo?: (moduloId: string) => void;
}

export const AulasModuloDedicadoView: React.FC<AulasModuloDedicadoViewProps> = ({
  modulo,
  onVoltar,
  onIniciarAula,
  onSelecionarNoCatalogo,
}) => {
  // Agrupar aulas do módulo por Tema (conforme grade oficial da planilha)
  const aulasPorTema = useMemo(() => {
    return modulo.aulas.reduce((acc, aula) => {
      const temaKey = aula.tema || 'Geral';
      if (!acc[temaKey]) acc[temaKey] = [];
      acc[temaKey].push(aula);
      return acc;
    }, {} as Record<string, TrilhaModuloAula[]>);
  }, [modulo]);

  const handlePlayAula = (aula: TrilhaModuloAula) => {
    try { haptic.impact('medium'); } catch {}
    if (onIniciarAula) {
      onIniciarAula(aula);
    }
  };

  return (
    <div className="fixed inset-0 z-[9995] bg-[#0D0D0D] flex flex-col text-white overflow-hidden animate-in fade-in duration-200">
      {/* ── HEADER NATIVO COM BOTÃO VOLTAR PREMIUM ── */}
      <PageHeader 
        title={`MÓDULO ${modulo.moduloNumero}`}
        subtitle={modulo.nome}
        onBack={onVoltar}
        variant="dark"
      />

      {/* ── CONTEÚDO SCROLLÁVEL ── */}
      <div 
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 max-w-4xl mx-auto w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBottom: 'calc(4rem + var(--sai-bottom, env(safe-area-inset-bottom, 24px)))' }}
      >
        {/* ── HERO DO MÓDULO (TÍTULO DO LADO DA CAPA 1:1 E MINIMALISTA) ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-900/70 border border-white/10 p-3.5 sm:p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3.5 sm:gap-5">
            {/* Capa em Proporção 1:1 Compacta */}
            <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 aspect-square border border-white/10 relative shadow-md bg-zinc-950">
              {modulo.capaUrl ? (
                <>
                  <img
                    src={modulo.capaUrl}
                    alt={modulo.nome}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                </>
              ) : (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                  style={{ background: modulo.gradientBg }}
                >
                  <BookOpen className="w-8 h-8 text-white/90" />
                </div>
              )}

              {/* Badge do Número do Módulo */}
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black bg-black/80 text-white border border-white/20 shadow">
                #{modulo.moduloNumero}
              </span>
            </div>

            {/* Título e Metadados do Lado da Capa (Minimalista) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-white/10 text-teal-300 border border-white/10">
                  Módulo {modulo.moduloNumero}
                </span>
                <span className="text-[10.5px] font-mono text-zinc-400">
                  • {modulo.totalAulas} aulas
                </span>
              </div>

              <h2 className="font-serif font-black text-base xs:text-lg sm:text-xl text-white leading-snug line-clamp-2">
                {modulo.nome}
              </h2>

              <p className="text-[11px] sm:text-xs text-zinc-400 font-sans truncate mt-0.5">
                {modulo.areas.join(' • ')}
              </p>

              {/* Ações Rápidas Minimalistas */}
              <div className="mt-2.5 flex items-center gap-2">
                {modulo.aulas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handlePlayAula(modulo.aulas[0])}
                    className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar Aula 01</span>
                  </button>
                )}

                {onSelecionarNoCatalogo && (
                  <button
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      onSelecionarNoCatalogo(modulo.id);
                      onVoltar();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 font-medium text-xs border border-white/10 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Filtrar</span>
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Breve Descrição Didática Minimalista */}
          {modulo.sobre && (
            <p className="text-xs text-zinc-400 font-sans leading-relaxed line-clamp-2 mt-3 pt-2.5 border-t border-white/5">
              {modulo.sobre}
            </p>
          )}
        </div>

        {/* ── LISTA DE AULAS DIVIDIDAS POR TEMA (IDENTICO À PLANILHA OFICIAL) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 px-1">
            <h3 className="font-serif font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <BookMarked className="w-4.5 h-4.5 text-[#2dd4bf]" />
              <span>Grade de Aulas ({modulo.totalAulas})</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Metodologia Ativa
            </span>
          </div>

          {Object.entries(aulasPorTema).map(([tema, aulasDoTema], tIdx) => (
            <div 
              key={tIdx} 
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-lg backdrop-blur-sm"
            >
              {/* Header do Tema */}
              <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                  <span className="font-mono text-xs sm:text-[13px] font-bold text-teal-300 uppercase tracking-wide">
                    {tema}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  {aulasDoTema.length} {aulasDoTema.length === 1 ? 'aula' : 'aulas'}
                </span>
              </div>

              {/* Lista Minimalista de Aulas do Tema */}
              <div className="divide-y divide-zinc-800/50">
                {aulasDoTema.map((aula, aIdx) => (
                  <div
                    key={aula.id || aIdx}
                    onClick={() => handlePlayAula(aula)}
                    className="p-3.5 sm:p-4 flex items-start gap-3.5 hover:bg-zinc-800/40 active:bg-zinc-800/60 transition-colors cursor-pointer group"
                  >
                    {/* Badge do Número da Aula */}
                    <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-teal-500/20 border border-white/10 group-hover:border-teal-500/40 flex items-center justify-center text-xs font-mono font-black text-zinc-300 group-hover:text-teal-300 shrink-0 mt-0.5 transition-colors">
                      {String(aIdx + 1).padStart(2, '0')}
                    </div>

                    {/* Conteúdo da Aula */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-sans font-bold text-white text-sm sm:text-[15px] group-hover:text-teal-300 transition-colors">
                          {aula.aulaNumeroOuTitulo}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400 bg-black/40 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
                          {aula.area}
                        </span>
                      </div>

                      <p className="text-xs sm:text-[12.5px] text-zinc-300/90 leading-relaxed font-sans">
                        {aula.sobre}
                      </p>
                    </div>

                    {/* Botão de Play da Aula */}
                    <div className="shrink-0 self-center">
                      <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-teal-500 flex items-center justify-center text-white group-hover:text-black transition-all shadow">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
