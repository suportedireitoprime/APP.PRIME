import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor, getAreaThemePalette, hexToRgb } from '@/lib/areasDireitoIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { CANONICAL_AREA_TOPICS } from '@/components/aprender/MateriaFlashcardsDeckSection';
import type { ModuloItem } from '@/hooks/useAprenderAreaModulesMap';
import type { AprenderArea } from '@/types/aprender';
import { cn } from '@/lib/utils';

interface MateriaAulasDeckSectionProps {
  area: AprenderArea;
  modulos: ModuloItem[];
  overrideTotal: number;
  overrideConcluidas: number;
  overridePct: number;
  onOpenArea: () => void;
  onOpenModulo?: (modulo: ModuloItem | { id: string; titulo: string }) => void;
  triggerAdvance?: number;
}

/** Configurações dos slots do leque 3D para thumbnails horizontais 16:9 (estilo YouTube) */
const getSlot = (diff: number) => {
  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, z: 50 };
    case 1:
      return { x: 70, y: 8, rotate: 5, scale: 0.90, opacity: 0.88, z: 40 };
    case -1:
      return { x: -70, y: 8, rotate: -5, scale: 0.90, opacity: 0.88, z: 40 };
    case 2:
      return { x: 130, y: 16, rotate: 10, scale: 0.78, opacity: 0.65, z: 30 };
    case -2:
      return { x: -130, y: 16, rotate: -10, scale: 0.78, opacity: 0.65, z: 30 };
    case 3:
      return { x: 180, y: 24, rotate: 14, scale: 0.66, opacity: 0.38, z: 20 };
    case -3:
      return { x: -180, y: 24, rotate: -14, scale: 0.66, opacity: 0.38, z: 20 };
    default:
      if (diff > 0) return { x: 210, y: 30, rotate: 18, scale: 0.55, opacity: 0, z: 10 };
      return { x: -210, y: 30, rotate: -18, scale: 0.55, opacity: 0, z: 10 };
  }
};

export const MateriaAulasDeckSection: React.FC<MateriaAulasDeckSectionProps> = memo(({
  area,
  modulos,
  overrideTotal,
  overrideConcluidas,
  overridePct,
  onOpenArea,
  onOpenModulo,
  triggerAdvance,
}) => {
  const [ativo, setAtivo] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);

  const iconInfo = useMemo(() => areaIconFor(area.slug), [area.slug]);
  const AreaIcon = iconInfo?.Icon;
  const accentColor = iconInfo?.color || '#fb7185';
  const palette = useMemo(() => getAreaThemePalette(area.slug || area.nome), [area.slug, area.nome]);

  // Capa oficial ilustrada da matéria
  const coverInfo = useMemo(() => getAreaCover(area.slug || area.nome), [area.slug, area.nome]);
  const coverUrl = coverInfo?.cover || null;

  // Nome essencial da matéria para a tag do topo (ex: "Administrativo", "Penal", "Civil")
  const nomeMateriaTag = useMemo(() => {
    if (!area?.nome) return '';
    return area.nome
      .replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '')
      .replace(/^Direitos\s+/i, '')
      .trim();
  }, [area?.nome]);

  const { r, g, b } = useMemo(() => hexToRgb(palette.primary), [palette.primary]);

  // Botão estilizado para "Assistir Aula" integrado à paleta da matéria
  const enterButtonBg = useMemo(() => {
    const topR = Math.round(r * 0.38);
    const topG = Math.round(g * 0.38);
    const topB = Math.round(b * 0.38);
    const btmR = Math.round(r * 0.16);
    const btmG = Math.round(g * 0.16);
    const btmB = Math.round(b * 0.16);
    return `linear-gradient(180deg, rgba(${Math.max(topR, 45)}, ${Math.max(topG, 20)}, ${Math.max(topB, 25)}, 0.95) 0%, rgba(${Math.max(btmR, 20)}, ${Math.max(btmG, 10)}, ${Math.max(btmB, 15)}, 0.98) 100%)`;
  }, [r, g, b]);

  // Lista de cards/módulos para o deck de aulas em formato 16:9
  const deckCards = useMemo(() => {
    const list: Array<{
      id: string;
      titulo: string;
      resumo?: string | null;
      ordem: number;
      totalAulas?: number;
      moduloRef?: ModuloItem;
    }> = [];

    // 1. Módulos reais cadastrados
    if (modulos && modulos.length > 0) {
      modulos.forEach((m, idx) => {
        list.push({
          id: m.id,
          titulo: m.titulo,
          resumo: m.resumo,
          ordem: idx + 1,
          totalAulas: m.totalAulas || 1,
          moduloRef: m,
        });
      });
    }

    // 2. Se tiver menos de 6 cards, complementa com tópicos canônicos para garantir o deck em leque
    if (list.length < 6) {
      const canonical = CANONICAL_AREA_TOPICS[area.slug] || [
        `Fundamentos de ${area.nome}`,
        `Princípios & Regras Gerais`,
        `Legislação & Normas Aplicadas`,
        `Jurisprudência & Súmulas`,
        `Casos Práticos & OAB`,
        `Temas Avançados & Atualizações`,
      ];

      const existingTitles = new Set(list.map((c) => c.titulo.toLowerCase().trim()));
      canonical.forEach((title) => {
        if (list.length < 7 && !existingTitles.has(title.toLowerCase().trim())) {
          list.push({
            id: `${area.id}-aula-topic-${list.length + 1}`,
            titulo: title,
            resumo: `Trilha de Aulas de ${area.nome}`,
            ordem: list.length + 1,
            totalAulas: Math.max(1, Math.round(overrideTotal / 6) || 1),
          });
        }
      });
    }

    return list;
  }, [modulos, area, overrideTotal]);

  const total = deckCards.length;

  // Animação e navegação ocorrem exclusivamente por interação manual do usuário (clique ou swipe)

  const handlePrev = useCallback(() => {
    try { haptic.selection(); } catch {}
    setAtivo((i) => (i - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    try { haptic.selection(); } catch {}
    setAtivo((i) => (i + 1) % total);
  }, [total]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      isSwipingRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = (e.changedTouches[0]?.clientX || 0) - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (isSwipingRef.current || Math.abs(deltaX) > 24) {
      const velocityX = deltaX / Math.max(deltaTime, 1);
      if (deltaX < -22 || velocityX < -0.28) {
        handleNext();
      } else if (deltaX > 22 || velocityX > 0.28) {
        handlePrev();
      }
      setIsDragging(true);
      setTimeout(() => setIsDragging(false), 120);
    } else {
      setIsDragging(false);
    }
  }, [handleNext, handlePrev]);

  const activeCard = deckCards[ativo] || deckCards[0];

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full space-y-2.5 sm:space-y-3 relative py-2 border-b border-white/[0.08] last:border-b-0"
    >
      {/* Cabeçalho da Matéria (clicar vai direto para a área) */}
      <div 
        onClick={() => {
          try { haptic.selection(); } catch {}
          onOpenArea();
        }}
        className="flex items-center justify-between gap-3 relative z-10 cursor-pointer group px-1"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            {AreaIcon ? (
              <AreaIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: accentColor }} strokeWidth={2} />
            ) : (
              <Video className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: accentColor }} />
            )}
          </div>
          <div className="min-w-0">
            <h3 
              className="text-base sm:text-[17px] font-bold text-white truncate transition-colors group-hover:text-rose-400"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                letterSpacing: '0.025em',
              }}
            >
              {area.nome}
            </h3>
            <p className="text-xs text-muted-foreground">
              {overrideTotal > 0 ? `${overrideTotal.toLocaleString('pt-BR')} aulas` : 'Trilha disponível'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3D Fanned Deck de Aulas em formato 16:9 Widescreen (sem corte nas laterais) ── */}
      <div className="relative w-full -mx-2 sm:mx-0 px-2 sm:px-0 pt-1 pb-1 flex flex-col items-center select-none overflow-visible">
        <div className="relative flex items-center justify-center w-full max-w-full h-[200px] sm:h-[225px] overflow-visible">
          {/* Deck de cards interativo */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, info) => {
              setTimeout(() => setIsDragging(false), 120);
              const isFar = Math.abs(info.offset.x) > 90;
              const isFast = Math.abs(info.velocity.x) > 450;
              const step = isFar && isFast ? 2 : 1;

              if (info.offset.x < -20 || info.velocity.x < -150) {
                setAtivo((i) => (i + step) % total);
              } else if (info.offset.x > 20 || info.velocity.x > 150) {
                setAtivo((i) => (i - step + total) % total);
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {deckCards.map((card, i) => {
              let diff = (i - ativo) % total;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff += total;

              const slot = getSlot(diff);
              const frente = diff === 0;

              if (Math.abs(diff) > 3) return null;

              return (
                <motion.div
                  key={card.id + i}
                  animate={{
                    x: slot.x,
                    y: slot.y,
                    rotate: slot.rotate,
                    scale: slot.scale,
                    opacity: slot.opacity,
                  }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{ zIndex: slot.z }}
                  onClick={(e) => {
                    if (isDragging || isSwipingRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    try { haptic.impact(); } catch {}
                    if (card.moduloRef && onOpenModulo) {
                      onOpenModulo(card.moduloRef);
                    } else {
                      onOpenArea();
                    }
                  }}
                  className="absolute cursor-pointer will-change-transform"
                >
                  {/* Card em Proporção 16:9 Widescreen (Thumbnail de YouTube) com Capa Real */}
                  <div
                    className={cn(
                      "w-[250px] sm:w-[290px] aspect-video rounded-[18px] sm:rounded-[20px] p-3 sm:p-3.5 flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300",
                      frente
                        ? "border-2 border-white/40 shadow-2xl"
                        : "border border-white/20 shadow-black/70"
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: frente
                        ? `${palette.shadow}, 0 20px 45px -10px rgba(0,0,0,0.85)`
                        : '0 10px 24px -5px rgba(0,0,0,0.65)',
                      filter: frente ? 'none' : 'brightness(0.72)',
                    }}
                  >
                    {/* Imagem de Capa Oficial Ilustrada em Alta Resolução */}
                    {coverUrl && (
                      <img
                        src={coverUrl}
                        alt={area.nome}
                        loading={frente ? 'eager' : 'lazy'}
                        decoding="async"
                        className="pointer-events-none absolute inset-0 w-full h-full object-cover select-none z-0"
                      />
                    )}

                    {/* Degradê Escuro Cinematográfico para Legibilidade Absoluta */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/95 via-[#09090b]/60 to-black/35 pointer-events-none z-[1]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/35 pointer-events-none z-[1]" />

                    {/* Moldura Interna Chanfrada de Thumbnail Premium */}
                    <div className="absolute inset-1 rounded-[14px] sm:rounded-[16px] border border-white/15 pointer-events-none z-[2]" />

                    {/* Acabamento Laminado / Brilho */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-[2]" />

                    {/* Topo do Card 16:9: Tag da Matéria + Badge de Aulas estilo YouTube */}
                    <div className="flex items-center justify-between w-full relative z-[5]">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-md bg-black/65 text-white/95 border border-white/20 shadow-sm leading-none">
                        {nomeMateriaTag}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md bg-black/65 text-rose-300 border border-rose-500/30 shadow-sm leading-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {card.totalAulas ? `${card.totalAulas} ${card.totalAulas === 1 ? 'aula' : 'aulas'}` : 'Aula'}
                      </span>
                    </div>

                    {/* Centro do Card 16:9: Título do Tópico/Módulo sem negrito com tipografia nítida */}
                    <div className="my-auto py-1 text-left relative z-[5] px-1">
                      <h4 
                        className="text-[12.5px] sm:text-[13.5px] font-normal leading-snug text-white break-words line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}
                      >
                        {card.titulo}
                      </h4>
                    </div>

                    {/* Rodapé do Card 16:9: Botão Assistir Aula no Card Frontal */}
                    <div className="relative z-[5] pt-1 border-t border-white/15 flex items-center justify-between w-full">
                      {frente ? (
                        <div
                          style={{
                            background: enterButtonBg,
                            borderColor: 'rgba(255, 255, 255, 0.22)',
                            boxShadow: `0 6px 16px -2px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.18)`,
                          }}
                          className="w-full py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider border hover:brightness-125 active:scale-95 transition-all cursor-pointer select-none"
                        >
                          <Play className="w-3 h-3 fill-current text-white/95" />
                          <span className="drop-shadow-sm">Assistir Aula</span>
                        </div>
                      ) : (
                        <div className="h-5 w-full" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Barra de Progresso Embaixo do Deck ── */}
      <div className="pt-2 pb-5 space-y-2 relative z-10 px-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-normal truncate max-w-[70%]">
            <strong className="text-white font-semibold">{activeCard?.titulo || area.nome}</strong>
            {overrideTotal > 0 && ` · ${overrideConcluidas}/${overrideTotal} aulas concluídas`}
          </span>
          <span className="font-bold text-white shrink-0">
            {overridePct}%
          </span>
        </div>

        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ 
              width: `${Math.max(overridePct, overrideConcluidas > 0 ? 5 : 0)}%`,
              backgroundColor: accentColor,
              boxShadow: `0 0 10px ${accentColor}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
});

MateriaAulasDeckSection.displayName = 'MateriaAulasDeckSection';
export default MateriaAulasDeckSection;
