import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { MateriaItem, AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { assetUrl } from '@/lib/assetUrl';

interface AulasMateriaSheetProps {
  disciplinaAtual: DisciplinaItem;
  materiaAtual: MateriaItem;
  matsDaDisc: MateriaItem[];
  aulasDaMateria: AulaItem[];
  buscaTermoAulas: string;
  setBuscaTermoAulas: (val: string) => void;
  onFechar: () => void;
  onSelecionarAula: (aula: AulaItem) => void;
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

export const AulasMateriaSheet: React.FC<AulasMateriaSheetProps> = ({
  disciplinaAtual,
  materiaAtual,
  matsDaDisc,
  aulasDaMateria,
  buscaTermoAulas,
  setBuscaTermoAulas,
  onFechar,
  onSelecionarAula,
  calcularProgressoCiclo,
}) => {
  const totalAulasMat = aulasDaMateria.length;
  const somaPctMat = aulasDaMateria.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
  const pctMat = totalAulasMat > 0 ? Math.round(somaPctMat / totalAulasMat) : 0;
  const ciclosCompletosMat = aulasDaMateria.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;
  const numMateria = matsDaDisc.findIndex(m => m.id === materiaAtual.id) + 1;
  const termoFiltroAulas = buscaTermoAulas.toLowerCase().trim();
  const aulasFiltradas = aulasDaMateria.filter(aula => {
    if (!termoFiltroAulas) return true;
    const desc = ((aula as any).descricaoBreve || aula.descricao || '').toLowerCase();
    return aula.titulo.toLowerCase().includes(termoFiltroAulas) || desc.includes(termoFiltroAulas);
  });

  return (
    <>
      {/* Backdrop Escuro com Blur da Gaveta de Matérias */}
      <motion.div
        key="backdrop-sheet-materia"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onFechar}
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
        style={{ touchAction: 'none' }}
      />

      {/* SHEET 1: LISTA DE AULAS DA MATÉRIA (DESLIZA DE BAIXO PARA CIMA ATÉ O TETO) */}
      <motion.div
        key="sheet-materia-aulas"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 h-[95dvh] sm:h-[94dvh] max-h-[calc(100dvh-var(--sai-top,env(safe-area-inset-top,0px))-8px)] max-w-4xl mx-auto rounded-t-[28px] sm:rounded-t-[32px] border-t border-x flex flex-col shadow-[0_-24px_70px_rgba(0,0,0,0.95)] overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${disciplinaAtual.corFundoCard || '#181920'} 0%, #0d0e12 100%)`,
          borderColor: `${disciplinaAtual.corDestaque}35`,
          paddingBottom: 'calc(2.5rem + var(--sai-bottom, env(safe-area-inset-bottom, 24px)))'
        }}
      >
        {/* Drag Handle Topo */}
        <div 
          className="pt-2 pb-1 flex justify-center shrink-0"
          style={{
            paddingTop: 'calc(0.5rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
          }}
        >
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Cabeçalho */}
        <div className="px-4 sm:px-6 pt-1 pb-3 border-b border-white/10 shrink-0 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span 
                className="text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                style={{ color: disciplinaAtual.corDestaque }}
              >
                {disciplinaAtual.nome} · MATÉRIA {numMateria > 0 ? numMateria : 1}
              </span>
              <span className="text-zinc-500 text-xs">·</span>
              <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                {totalAulasMat} {totalAulasMat === 1 ? 'aula' : 'aulas'}
              </span>
              {ciclosCompletosMat > 0 && (
                <>
                  <span className="text-zinc-500 text-xs">·</span>
                  <span className="text-[11px] sm:text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    {ciclosCompletosMat} concluída{ciclosCompletosMat > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
            <h3 className="font-sans font-extrabold text-xl sm:text-2xl text-white leading-tight break-words">
              {materiaAtual.titulo}
            </h3>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
              <span className="text-[11px] font-bold" style={{ color: pctMat === 100 ? '#10b981' : disciplinaAtual.corDestaque }}>
                {pctMat}%
              </span>
            </div>

            <button
              type="button"
              onClick={onFechar}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 flex items-center justify-center text-zinc-100 hover:text-white transition shadow-lg shrink-0 touch-manipulation cursor-pointer"
              aria-label="Fechar lista de aulas"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Campo de Busca Rápida Opcional */}
        {totalAulasMat > 4 && (
          <div className="px-4 sm:px-6 pt-3 shrink-0">
            <div className="relative flex items-center w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 transition-all">
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-2" />
              <input
                type="text"
                value={buscaTermoAulas}
                onChange={(e) => setBuscaTermoAulas(e.target.value)}
                placeholder={`Filtrar nas ${totalAulasMat} aulas...`}
                className="bg-transparent text-xs text-white placeholder-zinc-500 outline-none w-full font-medium"
              />
              {buscaTermoAulas && (
                <button
                  type="button"
                  onClick={() => setBuscaTermoAulas('')}
                  className="p-0.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* LISTA VERTICAL DE AULAS */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 xs:px-4 sm:px-6 pt-3 pb-32 sm:pb-28 space-y-2.5 overscroll-contain">
          {aulasFiltradas.map((aula, idx) => {
            const prog = calcularProgressoCiclo(aula);
            const numeroExibicao = idx + 1;

            return (
              <div
                key={aula.id}
                onClick={() => onSelecionarAula(aula)}
                className={cn(
                  "w-full rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer select-none group",
                  "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/25 active:scale-[0.99]",
                  "flex items-center gap-3 xs:gap-3.5 sm:gap-4 shadow-md"
                )}
              >
                {/* Capa ao lado */}
                <div className="relative shrink-0 w-24 sm:w-28 h-28 sm:h-34 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 bg-black/70 shadow-md group-hover:border-white/35 transition-all">
                  <img
                    src={assetUrl(aula.capaUrl) || assetUrl(disciplinaAtual.capaHeroUrl)}
                    alt={aula.titulo}
                    loading={idx < 8 ? "eager" : "lazy"}
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = assetUrl(disciplinaAtual.capaHeroUrl);
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span 
                        className="text-[11px] sm:text-xs font-mono font-black tracking-wider uppercase"
                        style={{ color: disciplinaAtual.corDestaque }}
                      >
                        AULA {numeroExibicao < 10 ? `0${numeroExibicao}` : numeroExibicao}
                      </span>

                      {prog.cicloCompleto ? (
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>100% Concluída</span>
                        </span>
                      ) : prog.porcentagemTotal > 0 ? (
                        <span className="text-[11px] sm:text-xs font-bold text-amber-400">
                          {prog.porcentagemTotal}% Em andamento
                        </span>
                      ) : (
                        <span className="text-[11px] sm:text-xs font-medium text-zinc-400">
                          Não iniciada
                        </span>
                      )}
                    </div>

                    <h4 className="font-sans font-bold text-sm sm:text-base text-white group-hover:text-amber-200 transition-colors leading-snug break-words mt-0.5">
                      {aula.titulo}
                    </h4>

                    {/* Barra de progresso */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10 mt-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          prog.cicloCompleto ? "bg-emerald-500" : "bg-gradient-to-r from-red-500 to-amber-500"
                        )}
                        style={{
                          width: `${Math.max(prog.porcentagemTotal, prog.cicloCompleto ? 100 : 0)}%`,
                          backgroundColor: prog.cicloCompleto ? '#10b981' : disciplinaAtual.corDestaque
                        }}
                      />
                    </div>
                  </div>

                  {/* Rodapé do Item */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-white/5 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <span>{prog.fasesConcluidasCount} de 3 fases concluídas</span>
                    </span>

                    <span className="flex items-center gap-1 text-xs font-semibold group-hover:translate-x-0.5 transition-transform" style={{ color: disciplinaAtual.corDestaque }}>
                      <span>Ver aula</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {aulasFiltradas.length === 0 && (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <Search className="w-8 h-8 text-zinc-600" />
              <p className="text-zinc-400 text-xs">Nenhuma aula encontrada para "{buscaTermoAulas}"</p>
              <button
                type="button"
                onClick={() => setBuscaTermoAulas('')}
                className="text-xs font-semibold underline text-amber-400"
              >
                Limpar pesquisa
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

