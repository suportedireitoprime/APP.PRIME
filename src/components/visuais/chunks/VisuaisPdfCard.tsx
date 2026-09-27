import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Download, Loader2 } from 'lucide-react';
import type { VisualRecord } from '@/lib/visuaisJuridicos/types';
import { extrairHierarquiaVisual } from '@/lib/visuaisJuridicos/hierarquia';

interface VisuaisPdfCardProps {
  arquivo: VisualRecord;
  index: number;
  materia?: string;
  onAbrir: (arquivo: VisualRecord) => void;
  onBaixar: (arquivo: VisualRecord) => void;
  baixando: boolean;
}

export function VisuaisPdfCard({
  arquivo,
  index,
  materia,
  onAbrir,
  onBaixar,
  baixando,
}: VisuaisPdfCardProps) {
  const numeroOrdem = index + 1;
  const hierarquia = useMemo(() => extrairHierarquiaVisual(arquivo), [arquivo]);
  const areaNome = materia || hierarquia.materia || 'DIREITO';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25) }}
      className="relative flex items-stretch rounded-2xl bg-gradient-to-b from-[#240a0d] to-[#120406] border border-red-500/30 hover:border-red-500/60 transition-all group shadow-lg shadow-black/50 overflow-hidden"
    >
      {/* ── Coluna Esquerda: Prévia Realista do PDF de Cima a Baixo com Linha do Tempo (1, 2, 3...) ── */}
      <div className="w-24 sm:w-28 shrink-0 relative bg-gradient-to-b from-[#380d12] via-[#20070a] to-[#120406] border-r border-red-500/20 flex flex-col items-center justify-center p-2.5 self-stretch select-none">
        {/* Marcador da Linha do Tempo / Ordem Cronológica */}
        <div className="absolute top-2 left-2 z-10 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-red-600 border border-white/20 shadow-md">
          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-[10px] text-white leading-none">
            {numeroOrdem}
          </span>
        </div>

        {/* Folha / Prévia em Miniatura do Documento PDF */}
        <div className="w-14 sm:w-16 h-20 sm:h-22 rounded-md bg-[#FAF8F5] shadow-lg border border-neutral-300/80 relative overflow-hidden flex flex-col p-1.5 transition-transform duration-300 group-hover:scale-105">
          {/* Header Superior do PDF em Miniatura */}
          <div className="w-full h-2 rounded-xs bg-[#7f1d1d] mb-1 flex items-center justify-between px-0.5">
            <div className="w-1 h-1 rounded-full bg-red-300" />
            <span className="text-[6px] font-black text-white leading-none">PDF</span>
          </div>

          {/* Miniatura do Mapa Mental / Esquema Interno */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-1">
            {/* Nó Central */}
            <div className="w-7 h-2 rounded-xs bg-[#8B1A24] flex items-center justify-center shadow-xs">
              <div className="w-4 h-0.5 bg-red-200 rounded-full" />
            </div>
            {/* Linha Conectora */}
            <div className="w-9 h-[1px] bg-neutral-400" />
            {/* Nós Filhos */}
            <div className="flex items-center justify-between w-full px-0.5">
              <div className="w-3 h-1.5 rounded-xs bg-amber-200/80" />
              <div className="w-3 h-1.5 rounded-xs bg-red-200/80" />
              <div className="w-3 h-1.5 rounded-xs bg-zinc-300" />
            </div>
            {/* Linhas de Texto Simuladas */}
            <div className="w-full space-y-0.5 pt-0.5 opacity-40">
              <div className="w-full h-0.5 bg-neutral-400 rounded-full" />
              <div className="w-3/4 h-0.5 bg-neutral-400 rounded-full" />
            </div>
          </div>

          {/* Brilho sutil do papel */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
        </div>

        {/* Legenda de Ordem Cronológica abaixo da prévia */}
        <span className="text-[9px] font-bold text-red-300/90 uppercase tracking-wider mt-1.5 font-['Plus_Jakarta_Sans',sans-serif] text-center truncate max-w-full">
          ORDEM #{numeroOrdem}
        </span>
      </div>

      {/* ── Lado Direito: Informações e Botões de Ação ── */}
      <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between gap-3 min-w-0">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif] truncate max-w-[200px]">
              {areaNome}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[9px] font-bold text-red-300 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif] shrink-0">
              {arquivo.tipo.replace('_', ' ')}
            </span>
          </div>

          {/* TÍTULO NÃO EM NEGRITO (conforme solicitado explicitamente pelo usuário) */}
          <p className="font-normal text-sm sm:text-base text-zinc-100 leading-snug font-['Plus_Jakarta_Sans',sans-serif] tracking-normal break-words">
            {arquivo.titulo}
          </p>
        </div>

        {/* Botões Ver PDF e Baixar */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => onAbrir(arquivo)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold active:scale-95 transition-all shadow-md"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver PDF</span>
          </button>

          <button
            type="button"
            onClick={() => onBaixar(arquivo)}
            disabled={baixando}
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-white active:scale-95 transition-transform shrink-0"
            aria-label="Baixar PDF"
          >
            {baixando ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
