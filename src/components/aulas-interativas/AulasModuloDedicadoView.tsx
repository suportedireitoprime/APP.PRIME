import React from 'react';
import { 
  ArrowLeft, BookOpen, Play, CheckCircle2, 
  Sparkles, Layers, ChevronRight, ListOrdered
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { TrilhaModuloOficial, TrilhaModuloAula } from '@/data/aulasTrilhasModulosOficiais';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { haptic } from '@/lib/nativeHaptics';
import { AulasCardRubyBackground } from './AulasCardRubyBackground';

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
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 max-w-4xl mx-auto w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBottom: 'calc(4rem + var(--sai-bottom, env(safe-area-inset-bottom, 24px)))' }}
      >
        {/* ── HERO DO MÓDULO COM FUNDO RUBI DAS FUNÇÕES ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-red-500/35 p-3.5 sm:p-5 shadow-[0_8px_24px_rgba(225,29,72,0.18)]">
          <AulasCardRubyBackground active />

          <div className="relative z-10 flex items-center gap-3.5 sm:gap-5">
            {/* Capa em Proporção 1:1 Compacta */}
            <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 aspect-square border border-red-500/30 relative shadow-md bg-zinc-950">
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
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black bg-black/80 text-rose-200 border border-red-500/35 shadow">
                #{modulo.moduloNumero}
              </span>
            </div>

            {/* Título e Metadados do Lado da Capa (Minimalista) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-black/70 text-rose-300 border border-red-500/35">
                  Módulo {modulo.moduloNumero}
                </span>
                <span className="text-[10.5px] font-mono text-rose-200/70">
                  • {modulo.totalAulas} aulas
                </span>
              </div>

              <h2 className="font-serif font-black text-base xs:text-lg sm:text-xl text-white leading-snug line-clamp-2">
                {modulo.nome}
              </h2>

              <p className="text-[11px] sm:text-xs text-rose-200/70 font-sans truncate mt-0.5">
                {modulo.areas.join(' • ')}
              </p>

              {/* Ações Rápidas Minimalistas */}
              <div className="mt-2.5 flex items-center gap-2">
                {modulo.aulas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handlePlayAula(modulo.aulas[0])}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(225,29,72,0.4)] active:scale-95 cursor-pointer border border-rose-400/40"
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
                    className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 text-rose-200 font-medium text-xs border border-red-500/30 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Filtrar</span>
                    <ChevronRight className="w-3 h-3 text-rose-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Breve Descrição Didática Minimalista */}
          {modulo.sobre && (
            <p className="relative z-10 text-xs text-zinc-300 font-sans leading-relaxed line-clamp-2 mt-3 pt-2.5 border-t border-red-500/20">
              {modulo.sobre}
            </p>
          )}
        </div>

        {/* ── LISTA CONTÍNUA DE TODAS AS AULAS EM LISTA COM FUNDO RUBI DAS FUNÇÕES ── */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between pb-1 px-1">
            <span className="font-mono text-xs sm:text-[13px] text-zinc-400 uppercase tracking-wider font-semibold">
              {modulo.totalAulas} aulas em sequência
            </span>
            <span className="text-xs font-mono text-rose-400 font-bold">
              Toque para iniciar
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-red-500/35 divide-y divide-red-950/40 shadow-2xl">
            <AulasCardRubyBackground />

            {modulo.aulas.map((aula, aIdx) => (
              <div
                key={aula.id || aIdx}
                onClick={() => handlePlayAula(aula)}
                className="relative z-10 p-4 sm:p-5 min-h-[72px] sm:min-h-[80px] flex items-center gap-3.5 sm:gap-4.5 hover:bg-white/5 active:bg-white/10 transition-all cursor-pointer group"
              >
                {/* Número da Aula Sequencial: 01, 02, 03... */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-black/60 group-hover:bg-red-500/20 border border-red-500/30 group-hover:border-red-400/50 flex items-center justify-center text-sm sm:text-base font-mono font-black text-rose-200 group-hover:text-white shrink-0 transition-colors shadow-inner">
                  {String(aIdx + 1).padStart(2, '0')}
                </div>

                {/* Conteúdo da Aula */}
                <div className="flex-1 min-w-0 py-0.5">
                  <h4 className="font-sans font-bold text-white text-sm sm:text-[16px] group-hover:text-rose-200 transition-colors line-clamp-1 leading-snug">
                    {aula.titulo || aula.aulaNumeroOuTitulo}
                  </h4>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-xs text-rose-200/70 font-sans flex-wrap">
                    <span className="font-mono text-rose-300">
                      {aula.numeroAula || `Aula ${String(aIdx + 1).padStart(2, '0')}`}
                    </span>
                    {aula.tema && (
                      <>
                        <span className="text-red-900">•</span>
                        <span className="text-zinc-300 truncate max-w-[180px] sm:max-w-xs">{aula.tema}</span>
                      </>
                    )}
                    {aula.etapas > 0 && (
                      <>
                        <span className="text-red-900">•</span>
                        <span className="font-mono text-rose-400 font-medium">{aula.etapas} etapas</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Botão de Play da Aula */}
                <div className="shrink-0 pl-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-500/20 group-hover:bg-red-500 border border-red-500/35 flex items-center justify-center text-rose-300 group-hover:text-white transition-all shadow-[0_0_14px_rgba(225,29,72,0.25)] group-hover:shadow-[0_0_18px_rgba(225,29,72,0.6)]">
                    <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AulasModuloDedicadoView;
