import React, { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, Volume2, ChevronRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import ShapeGrid from '@/components/ui/ShapeGrid';

export interface AudioleiLawItem {
  id: string;
  sigla: string;
  nome: string;
  tabela_nome: string;
  descricao: string;
  tipo: string;
}

interface AudioleisCategoriaSheetProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo?: string;
  laws: AudioleiLawItem[];
  lawCounts?: Record<string, number> | null;
  onSelectLaw: (law: AudioleiLawItem) => void;
  getLawVisuals: (law: AudioleiLawItem) => { IconComponent: LucideIcon; iconColor: string };
}

const norm = (v: string) =>
  v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const AudioleisCategoriaSheet = memo(function AudioleisCategoriaSheet({
  open,
  onClose,
  titulo,
  subtitulo,
  laws,
  lawCounts,
  onSelectLaw,
  getLawVisuals,
}: AudioleisCategoriaSheetProps) {
  useBodyScrollLock(open);
  useEscapeKey(open, onClose);

  const [busca, setBusca] = useState('');

  const leisFiltradas = useMemo(() => {
    const q = norm(busca.trim());
    if (!q) return laws;
    return laws.filter((l) =>
      norm(`${l.nome} ${l.sigla} ${l.descricao}`).includes(q)
    );
  }, [laws, busca]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Painel Fullscreen que sobe de baixo para cima */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
        >
          {/* Background ShapeGrid oficial */}
          <div className="absolute inset-0 pointer-events-none opacity-50">
            <ShapeGrid />
          </div>

          {/* Header Padrão Ouro com Botão de Voltar no canto esquerdo */}
          <header className="relative z-10 shrink-0 flex items-center justify-between px-4 py-3 sm:py-3.5 border-b border-border/40 bg-background/95 backdrop-blur-md pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  try {
                    haptic.selection();
                  } catch {}
                  onClose();
                }}
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-secondary/80 hover:bg-secondary active:scale-95 transition-all text-foreground shrink-0 shadow-sm border border-border/30 cursor-pointer"
                aria-label="Voltar para Audioleis"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              </button>

              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold font-display uppercase tracking-widest text-foreground truncate">
                  {titulo}
                </h1>
                <p className="text-xs text-muted-foreground font-body truncate">
                  {subtitulo || `${laws.length} leis disponíveis para escuta`}
                </p>
              </div>
            </div>

            {/* Badge de Total de Leis */}
            <div className="shrink-0 pl-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {laws.length} {laws.length === 1 ? 'Lei' : 'Leis'}
              </span>
            </div>
          </header>

          {/* Campo de Busca Rápida */}
          <div className="relative z-10 px-4 pt-3 pb-2 max-w-3xl w-full mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar nesta categoria (ex: Penal, 8.069, Civil)..."
                className="w-full bg-card/90 border border-border rounded-2xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Conteúdo com a Lista de Leis (Design igual ao Vade Mecum) */}
          <main className="relative z-10 flex-1 overflow-y-auto px-4 py-2 max-w-3xl w-full mx-auto space-y-2.5 pb-[calc(4rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
            {leisFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 text-muted-foreground">
                <Search className="w-8 h-8 text-zinc-600" />
                <p className="text-sm">Nenhuma lei encontrada para "{busca}".</p>
                <p className="text-xs">Tente buscar por sigla ou termo diferente.</p>
              </div>
            ) : (
              leisFiltradas.map((l) => {
                const { IconComponent: LawIcon, iconColor } = getLawVisuals(l as any);
                const count = lawCounts ? lawCounts[l.tabela_nome] || 0 : 0;

                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      try {
                        haptic.selection();
                      } catch {}
                      onSelectLaw(l);
                      onClose();
                    }}
                    className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-border/80 hover:border-primary/40 flex items-center justify-between gap-3.5 group transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-xs"
                  >
                    {/* Ícone Temático da Lei com sua cor própria */}
                    <div className="shrink-0 flex items-center justify-center">
                      <LawIcon
                        className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: iconColor }}
                        strokeWidth={1.8}
                      />
                    </div>

                    {/* Informações da Lei */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-black/40 text-zinc-300 border border-white/10 shrink-0">
                          {l.sigla}
                        </span>
                        <p className="font-display font-bold text-foreground text-[14.5px] sm:text-[15.5px] group-hover:text-primary transition-colors truncate">
                          {l.nome}
                        </p>
                      </div>

                      <p className="font-body text-xs text-muted-foreground line-clamp-1 mb-1">
                        {l.descricao}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 font-medium">
                        <Volume2 className="w-3 h-3 text-primary shrink-0" />
                        <span>
                          {count > 0 ? `${count.toLocaleString('pt-BR')} artigos narrados` : 'Ver artigos'}
                        </span>
                      </div>
                    </div>

                    {/* Chevron Right com animação */}
                    <div className="shrink-0 flex items-center text-muted-foreground group-hover:text-primary transition-colors">
                      <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })
            )}
          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});
