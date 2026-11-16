import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, BookOpen } from 'lucide-react';
import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { PrimeImage } from '@/components/ui/PrimeImage';
import type { LivroBadgeInfo } from '@/hooks/useLivroBadges';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

interface BibliotecaCategoriaLivroCardProps {
  livro: LivroNormalizado;
  onClick: () => void;
  priority?: boolean;
  badge?: LivroBadgeInfo;
  index?: number;
  onPrefetch?: () => void;
}

export const BibliotecaCategoriaLivroCard = memo(function BibliotecaCategoriaLivroCard({
  livro,
  onClick,
  priority,
  badge,
  index = 0,
  onPrefetch,
}: BibliotecaCategoriaLivroCardProps) {
  const capaUrl = useBibliotecaCapa(livro.capa, 300);

  // Cálculo preciso do progresso de leitura (Supabase + localStorage)
  const pct = useMemo(() => {
    if (typeof badge?.progresso === 'number' && badge.progresso > 0) {
      return Math.min(100, Math.max(1, Math.round(badge.progresso * 100)));
    }
    if (typeof window === 'undefined') return 0;
    try {
      const keys = [
        `leitura-nativa:${livro.colecaoId}:${livro.id}`,
        `leitura-nativa:biblioteca_${livro.colecaoId}:${livro.id}`,
        `leitura-nativa:${livro.id}`,
      ];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const p = JSON.parse(raw);
          if (typeof p?.percent === 'number' && p.percent > 0) {
            return Math.min(100, Math.max(1, Math.round(p.percent)));
          }
          if (typeof p?.index === 'number' && typeof p?.total === 'number' && p.total > 0) {
            return Math.min(100, Math.max(1, Math.round(((p.index + 1) / p.total) * 100)));
          }
        }
      }
      if (livro.download) {
        const saved = Number(localStorage.getItem(`pdf-reader:page:${livro.download}`) || '0');
        if (saved > 0) return Math.min(100, Math.max(1, saved));
      }
    } catch {}
    return 0;
  }, [badge?.progresso, livro.colecaoId, livro.id, livro.download]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.05, 0.4),
        type: 'spring',
        stiffness: 300,
        damping: 24,
      }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onPointerEnter={onPrefetch}
      onTouchStart={onPrefetch}
      aria-label={`Abrir livro ${livro.titulo}${livro.autor ? ` de ${livro.autor}` : ''}`}
      className="group flex items-stretch gap-3 p-2.5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/40 transition-colors text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 relative overflow-hidden"
    >
      <div className="w-[72px] h-[100px] shrink-0 rounded-lg overflow-hidden bg-muted shadow-sm relative">
        <PrimeImage
          src={capaUrl}
          alt={`Capa do livro: ${livro.titulo}`}
          aspectRatio="auto"
          targetWidth={200}
          priority={priority}
          fallbackText={livro.titulo}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover"
        />
        {pct > 0 && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/85 border border-purple-400/30 text-[9px] font-mono font-black text-purple-300 shadow">
            {pct}%
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <p className="text-[14px] sm:text-[15px] font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors break-words">
          {livro.titulo}
        </p>
        {livro.autor && (
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
            {livro.autor}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {livro.area && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
              {livro.area}
            </span>
          )}
          {pct > 0 && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              {pct}% lido
            </span>
          )}
          {badge?.favorito && (
            <span
              title="Favorito"
              className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500"
            >
              <Bookmark className="w-2.5 h-2.5 fill-current" />
              Favorito
            </span>
          )}
        </div>

        {/* Barra de porcentagem visível para livros em leitura */}
        {pct > 0 && (
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.7)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center pl-2 pr-1 shrink-0">
        {pct > 0 ? (
          <span className="text-[11px] uppercase tracking-wide font-bold px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 group-hover:bg-purple-500/30 transition-colors shrink-0">
            Retomar
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-wide font-bold text-primary px-3 py-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
            Ler
          </span>
        )}
      </div>

      {/* Barra de progresso na base do card */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border/40">
        {pct > 0 && (
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </motion.button>
  );
});
