import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, BookOpen } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { getAreaCover, prefetchAreaCovers } from '@/lib/areasDireitoCovers';
import { cn } from '@/lib/utils';
import type { Cargo } from '@/hooks/useQuestoes';

const STORAGE_KEY = 'questoes:master_deck_last_slug';

interface QuestoesMasterDeckProps {
  cargos: Cargo[];
}

const getSlot = (diff: number, isMobile: boolean) => {
  const stepX = isMobile ? 66 : 98;
  const stepY = isMobile ? 8 : 12;
  const stepRot = 7.5;

  switch (diff) {
    case 0: return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, z: 50 };
    case 1: return { x: stepX, y: stepY, rotate: stepRot, scale: 0.88, opacity: 0.92, z: 40 };
    case -1: return { x: -stepX, y: stepY, rotate: -stepRot, scale: 0.88, opacity: 0.92, z: 40 };
    case 2: return { x: stepX * 1.8, y: stepY * 2.1, rotate: stepRot * 2, scale: 0.76, opacity: 0.68, z: 30 };
    case -2: return { x: -stepX * 1.8, y: stepY * 2.1, rotate: -stepRot * 2, scale: 0.76, opacity: 0.68, z: 30 };
    case 3: return { x: stepX * 2.45, y: stepY * 3.1, rotate: stepRot * 2.8, scale: 0.64, opacity: 0.40, z: 20 };
    case -3: return { x: -stepX * 2.45, y: stepY * 3.1, rotate: -stepRot * 2.8, scale: 0.64, opacity: 0.40, z: 20 };
    default:
      return { x: diff > 0 ? stepX * 2.8 : -stepX * 2.8, y: stepY * 3.8, rotate: diff > 0 ? 25 : -25, scale: 0.5, opacity: 0, z: 10 };
  }
};

export const QuestoesMasterDeck: React.FC<QuestoesMasterDeckProps> = memo(({ cargos }) => {
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 640;
    return false;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [ativo, setAtivo] = useState<number>(() => {
    try {
      const savedSlug = localStorage.getItem(STORAGE_KEY);
      if (savedSlug && cargos.length > 0) {
        const found = cargos.findIndex((a) => a.slug === savedSlug);
        if (found >= 0) return found;
      }
    } catch {}
    return 0;
  });

  useEffect(() => {
    if (!cargos || cargos.length === 0) return;
    try {
      const savedSlug = localStorage.getItem(STORAGE_KEY);
      if (savedSlug) {
        const found = cargos.findIndex((a) => a.slug === savedSlug);
        if (found >= 0) {
          setAtivo(found);
          return;
        }
      }
    } catch {}
  }, [cargos]);

  useEffect(() => {
    if (cargos[ativo]?.slug) {
      try {
        localStorage.setItem(STORAGE_KEY, cargos[ativo].slug);
      } catch {}
    }
  }, [ativo, cargos]);

  useEffect(() => {
    if (cargos.length > 0) {
      prefetchAreaCovers(cargos.map(a => ({ nome: a.nome, slug: a.slug })));
    }
  }, [cargos]);

  const total = cargos.length;
  const activeArea = cargos[ativo] || cargos[0];

  const iconInfo = useMemo(() => areaIconFor(activeArea?.slug || activeArea?.nome), [activeArea?.slug, activeArea?.nome]);
  const AreaIcon = iconInfo?.Icon;
  const activeAccentColor = iconInfo?.color || '#E11D48';
  const activePalette = useMemo(
    () => getAreaThemePalette(activeArea?.slug || activeArea?.nome),
    [activeArea?.slug, activeArea?.nome]
  );

  const totalQuestoes = activeArea?.total_questoes || 0;

  const handlePrev = useCallback(() => {
    if (ativo <= 0) return;
    try { haptic.selection(); } catch {}
    setAtivo((prev) => Math.max(0, prev - 1));
  }, [ativo]);

  const handleNext = useCallback(() => {
    if (ativo >= total - 1) return;
    try { haptic.selection(); } catch {}
    setAtivo((prev) => Math.min(total - 1, prev + 1));
  }, [ativo, total]);

  const handleOpenActive = useCallback(() => {
    if (!activeArea) return;
    try { haptic.impact(); } catch {}
    const p = new URLSearchParams();
    p.set('cargo', activeArea.nome);
    p.set('filtro', '1');
    navigate(`/questoes/praticar?${p.toString()}`);
  }, [activeArea, navigate]);

  if (!cargos || cargos.length === 0) return null;

  return (
    <div className="w-full space-y-6 select-none mt-2">
      <div className="relative w-full -mx-2 sm:mx-0 px-2 sm:px-0 pt-2 pb-2 flex flex-col items-center select-none overflow-visible">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[460px] h-[300px] sm:h-[460px] rounded-full pointer-events-none opacity-20 blur-[90px] transition-colors duration-700"
          style={{ backgroundColor: activeAccentColor }}
        />

        <div className="relative flex items-center justify-center w-full max-w-full h-[330px] sm:h-[390px] md:h-[420px] overflow-visible">
          {ativo > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              aria-label="Caderno anterior"
              className="absolute left-2 sm:left-6 md:left-10 bottom-4 sm:bottom-8 z-[60] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/65 hover:bg-black/90 active:scale-95 border border-white/20 text-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.4]" />
            </button>
          )}

          {ativo < total - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              aria-label="Próximo caderno"
              className="absolute right-2 sm:right-6 md:right-10 bottom-4 sm:bottom-8 z-[60] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/65 hover:bg-black/90 active:scale-95 border border-white/20 text-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronRight className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.4]" />
            </button>
          )}

          <div
            tabIndex={0}
            role="region"
            aria-label={`Deck de Questões. Caderno atual: ${activeArea.nome}. Use as setas para navegar e Enter para abrir.`}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
              else if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
              else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenActive(); }
            }}
            className="relative flex items-center justify-center w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-3xl"
          >
            {cargos.map((area, i) => {
              const diff = i - ativo;
              if (Math.abs(diff) > 3) return null;

              const slot = getSlot(diff, isMobile);
              const frente = diff === 0;
              const coverInfo = getAreaCover(area.nome) || getAreaCover(area.slug);
              const coverUrl = coverInfo?.cover || null;
              const palette = getAreaThemePalette(area.slug || area.nome);

              const nomeMateriaTag = area.nome.replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '').replace(/^Direitos\s+/i, '').trim();

              return (
                <motion.div
                  key={area.slug || area.nome}
                  animate={{ x: slot.x, y: slot.y, rotate: slot.rotate, scale: slot.scale, opacity: slot.opacity }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  style={{ zIndex: slot.z }}
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (frente) { handleOpenActive(); }
                    else { try { haptic.selection(); } catch {} setAtivo(i); }
                  }}
                  className="absolute cursor-pointer will-change-transform group"
                >
                  <div
                    className={cn(
                      "w-[160px] h-[230px] sm:w-[190px] sm:h-[275px] md:w-[210px] md:h-[305px] rounded-[20px] p-3 sm:p-4 flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300",
                      frente ? "border-2 border-white/40 shadow-2xl" : "border border-white/20 shadow-black/80"
                    )}
                    style={{
                      background: `linear-gradient(145deg, ${palette.primary} 0%, #1a1a1a 100%)`,
                      filter: frente ? 'none' : 'brightness(0.65)',
                    }}
                  >
                    {/* Watermark Icon */}
                    <div className="absolute right-[-15%] bottom-[-10%] opacity-[0.07] pointer-events-none z-0 mix-blend-overlay">
                      {iconInfo?.Icon && <iconInfo.Icon className="w-48 h-48 sm:w-64 sm:h-64" />}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none z-0" />
                    <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] transition-transform duration-1000 ease-in-out pointer-events-none z-10" />
                    <div className="absolute inset-1.5 rounded-[16px] border border-white/20 pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.14] pointer-events-none z-10" />

                    <div className="flex items-center justify-center w-full relative z-10 mt-1">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md bg-black/40 text-white border border-white/25 shadow-md text-center leading-none">
                        {nomeMateriaTag}
                      </span>
                    </div>

                    <div className="mt-auto mb-3 py-2 text-center relative z-10 px-1 flex flex-col items-center">
                      {frente && (
                        <div className="mb-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/90 hover:bg-primary border border-white/30 backdrop-blur-md text-white flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.5)] group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current translate-x-0.5" />
                        </div>
                      )}

                      <h3 className="text-sm sm:text-base font-bold leading-snug text-white drop-shadow-lg line-clamp-2" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                        {area.nome}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-white/80 mt-1 drop-shadow-sm font-medium">
                        {area.total_questoes > 0 ? `${area.total_questoes} questões` : 'Em breve'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

QuestoesMasterDeck.displayName = 'QuestoesMasterDeck';
export default QuestoesMasterDeck;
