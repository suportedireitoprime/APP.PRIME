import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, Layers } from 'lucide-react';
import ArtigoCard from '@/components/vademecum/artigo/ArtigoCard';
import type { ArtigoLei } from '@/data/mockData';
import type { LeiCapituloItem } from '@/lib/leiStructure';
import { haptic } from '@/lib/nativeHaptics';

interface LeiCapitulosGridProps {
  capitulos: LeiCapituloItem[];
  expandedCapituloId: string | null;
  setExpandedCapituloId: (id: string | null) => void;
  setOpenArtigo: (artigo: ArtigoLei) => void;
  leiAccent: string;
  isArtigoFav: (a: { id: string; numero: string | number }) => boolean;
  grifadoNumeros: Set<string>;
  anotadoNumeros: Set<string>;
  searchQuery?: string;
}

const LeiCapitulosGrid: React.FC<LeiCapitulosGridProps> = ({
  capitulos,
  expandedCapituloId,
  setExpandedCapituloId,
  setOpenArtigo,
  leiAccent,
  isArtigoFav,
  grifadoNumeros,
  anotadoNumeros,
  searchQuery,
}) => {
  if (!capitulos || capitulos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <Layers className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm font-medium">Nenhum capítulo identificado nesta lei.</p>
      </div>
    );
  }

  const formatRange = (first: string, last: string) => {
    if (!first && !last) return '';
    if (first === last) return `(Art. ${first})`;
    return `(Arts. ${first} a ${last})`;
  };

  return (
    <div className="space-y-3.5 pb-10 select-none">
      {capitulos.map((cap, idx) => {
        const isExpanded = expandedCapituloId === cap.id;
        const totalArts = cap.artigos.length;
        const rangeText = formatRange(cap.primeiroArtigo, cap.ultimoArtigo);

        return (
          <div
            key={cap.id || idx}
            className="rounded-2xl bg-[#121316] border border-white/[0.05] hover:border-white/[0.1] transition-all overflow-hidden shadow-lg shadow-black/40"
          >
            {/* Botão Principal do Card do Capítulo */}
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.25) }}
              onClick={() => {
                haptic.selection();
                setExpandedCapituloId(isExpanded ? null : cap.id);
              }}
              className="w-full text-left flex items-stretch min-h-[96px] sm:min-h-[104px] p-0 active:scale-[0.99] transition-transform cursor-pointer relative group"
            >
              {/* Barra lateral colorida de destaque com a cor da lei */}
              <div
                className="w-2 sm:w-2.5 rounded-l-2xl shrink-0 transition-opacity"
                style={{ background: isExpanded ? leiAccent || '#c2274a' : `${leiAccent || '#c2274a'}bb` }}
              />

              {/* Informações do Capítulo */}
              <div className="p-3.5 sm:p-5 flex-1 min-w-0 flex flex-col justify-center">
                {/* Linha Superior: Tag do Capítulo e Contexto Pai */}
                <div className="flex items-center gap-2 mb-1 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-amber-400 shrink-0">
                    {cap.capituloHead || 'CAPÍTULO'}
                  </span>
                  {cap.parentContext && (
                    <span className="text-[11px] text-zinc-500 font-medium truncate hidden sm:inline">
                      • {cap.parentContext}
                    </span>
                  )}
                </div>

                {/* Nome do Capítulo em destaque */}
                <h4 className="font-serif text-sm sm:text-base md:text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {cap.capituloNome}
                </h4>

                {/* Linha Inferior: Contagem e Intervalo dos Artigos */}
                <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm text-zinc-400">
                  <span className="font-semibold text-zinc-300">
                    {totalArts} {totalArts === 1 ? 'artigo' : 'artigos'}
                  </span>
                  {rangeText && (
                    <span className="text-zinc-500 text-[11px] sm:text-xs">
                      {rangeText}
                    </span>
                  )}
                </div>
              </div>

              {/* Ícone de Expansão (Chevron) */}
              <div className="flex items-center pr-4 sm:pr-5 shrink-0">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    isExpanded
                      ? 'bg-primary/20 text-primary rotate-90 shadow-md shadow-primary/20'
                      : 'bg-white/[0.04] text-zinc-400 group-hover:bg-white/[0.08] group-hover:text-white'
                  }`}
                >
                  <ChevronRight className="w-5 h-5 transition-transform" strokeWidth={2.4} />
                </div>
              </div>
            </motion.button>

            {/* Conteúdo Expandido (Accordion com os Artigos deste Capítulo) */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden border-t border-white/[0.06] bg-black/40"
                >
                  <div className="p-3 sm:p-4 space-y-2.5">
                    {/* Barra de atalho interno do capítulo */}
                    <div className="flex items-center justify-between px-1 py-1 text-xs text-zinc-400 border-b border-white/[0.04] mb-2">
                      <span className="font-semibold flex items-center gap-1.5 text-zinc-300">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        Artigos de {cap.capituloNome}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Toque no artigo para ler
                      </span>
                    </div>

                    {/* Lista dos ArtigoCards */}
                    {cap.artigos.map((artigo, aIdx) => (
                      <ArtigoCard
                        key={artigo.id || aIdx}
                        artigo={artigo}
                        index={aIdx}
                        onClick={() => {
                          haptic.selection();
                          setOpenArtigo(artigo);
                        }}
                        accentColor={leiAccent}
                        tags={{
                          favorito: isArtigoFav(artigo),
                          grifado: grifadoNumeros.has(artigo.numero),
                          anotado: anotadoNumeros.has(artigo.numero),
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(LeiCapitulosGrid);
