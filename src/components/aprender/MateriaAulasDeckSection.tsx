import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
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
}

/** Configurações dos slots do leque 3D para cards verticais no formato 4:3 */
const getSlot = (diff: number) => {
  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, z: 50 };
    case 1:
      return { x: 58, y: 7, rotate: 7, scale: 0.9, opacity: 0.9, z: 40 };
    case -1:
      return { x: -58, y: 7, rotate: -7, scale: 0.9, opacity: 0.9, z: 40 };
    case 2:
      return { x: 108, y: 16, rotate: 14, scale: 0.78, opacity: 0.68, z: 30 };
    case -2:
      return { x: -108, y: 16, rotate: -14, scale: 0.78, opacity: 0.68, z: 30 };
    case 3:
      return { x: 148, y: 24, rotate: 20, scale: 0.66, opacity: 0.40, z: 20 };
    case -3:
      return { x: -148, y: 24, rotate: -20, scale: 0.66, opacity: 0.40, z: 20 };
    default:
      if (diff > 0) return { x: 170, y: 30, rotate: 24, scale: 0.55, opacity: 0, z: 10 };
      return { x: -170, y: 30, rotate: -24, scale: 0.55, opacity: 0, z: 10 };
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
}) => {
  const [ativo, setAtivo] = useState(0);

  const iconInfo = useMemo(() => areaIconFor(area.slug), [area.slug]);
  const AreaIcon = iconInfo?.Icon;
  const accentColor = iconInfo?.color || '#fb7185';
  const palette = useMemo(() => getAreaThemePalette(area.slug || area.nome), [area.slug, area.nome]);

  // Capa oficial ilustrada da matéria (busca por nome e slug para garantir o asset)
  const coverInfo = useMemo(() => {
    return getAreaCover(area.nome) || getAreaCover(area.slug);
  }, [area.nome, area.slug]);
  const coverUrl = coverInfo?.cover || null;

  // Nome essencial da matéria para a tag do topo (ex: "Administrativo", "Penal", "Civil")
  const nomeMateriaTag = useMemo(() => {
    if (!area?.nome) return '';
    return area.nome
      .replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '')
      .replace(/^Direitos\s+/i, '')
      .trim();
  }, [area?.nome]);


  // Lista de cards/módulos para o deck de aulas no formato 4:3
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

    // 2. Se tiver menos de 6 cards, complementa com tópicos canônicos para garantir o leque completo
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

  const handlePrev = useCallback(() => {
    try { haptic.selection(); } catch {}
    setAtivo((i) => (i - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    try { haptic.selection(); } catch {}
    setAtivo((i) => (i + 1) % total);
  }, [total]);

  const activeCard = deckCards[ativo] || deckCards[0];

  return (
    <div className="w-full space-y-2.5 sm:space-y-3 relative py-2 border-b border-white/[0.08] last:border-b-0">
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

      {/* ── 3D Fanned Deck de Aulas no Formato 4:3 com Capas Ilustradas Reais ── */}
      <div className="relative w-full -mx-2 sm:mx-0 px-2 sm:px-0 pt-1 pb-1 flex flex-col items-center select-none overflow-visible">
        <div className="relative flex items-center justify-center w-full max-w-full h-[225px] sm:h-[245px] overflow-visible">
          {/* Botão Anterior (Clique para passar para a esquerda) */}
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label={`Aula anterior de ${area.nome}`}
              className="absolute left-1 sm:left-4 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 border border-white/25 text-white shadow-xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
            </button>
          )}

          {/* Botão Próximo (Clique para passar para a direita) */}
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label={`Próxima aula de ${area.nome}`}
              className="absolute right-1 sm:right-4 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 border border-white/25 text-white shadow-xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
            </button>
          )}

          {/* Deck de cards interativo */}
          <div
            tabIndex={0}
            role="region"
            aria-label={`Deck de aulas de ${area.nome}. Pressione as setas esquerda e direita para navegar e Enter para abrir.`}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const card = deckCards[ativo];
                if (card) {
                  const isSynthetic = !card.moduloRef?.id || String(card.id).includes('topic') || String(card.id).includes('canonical');
                  if (!isSynthetic && card.moduloRef && onOpenModulo) {
                    onOpenModulo(card.moduloRef);
                  } else {
                    onOpenArea();
                  }
                }
              }
            }}
            className="relative flex items-center justify-center w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 rounded-2xl"
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
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ zIndex: slot.z }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (frente) {
                      try { haptic.impact(); } catch {}
                      const isSynthetic = !card.moduloRef?.id || String(card.id).includes('topic') || String(card.id).includes('canonical');
                      if (!isSynthetic && card.moduloRef && onOpenModulo) {
                        onOpenModulo(card.moduloRef);
                      } else {
                        onOpenArea();
                      }
                    } else {
                      // Passa para o card clicado ao tocar em qualquer card lateral
                      try { haptic.selection(); } catch {}
                      setAtivo(i);
                    }
                  }}
                  className="absolute cursor-pointer will-change-transform"
                >
                  {/* Card no formato 4:3 com Capa Ilustrada e Lógica Idêntica a Flashcards */}
                  <div
                    className={cn(
                      "w-[140px] h-[190px] sm:w-[155px] sm:h-[210px] rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300",
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
                    {/* Imagem de Capa Oficial Ilustrada em Alta Resolução (idêntica ao carrossel inicial) */}
                    {coverUrl && (
                      <img
                        src={coverUrl}
                        alt={area.nome}
                        loading={frente ? 'eager' : 'lazy'}
                        decoding="async"
                        className="pointer-events-none absolute inset-0 w-full h-full object-cover select-none z-0"
                      />
                    )}

                    {/* Degradê Escuro Cinematográfico: Garante contraste perfeito da tipografia sobre a ilustração */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20 pointer-events-none z-[1]" />

                    {/* Moldura Interna Chanfrada de Carta/Livro */}
                    <div className="absolute inset-1 rounded-[16px] border border-white/15 pointer-events-none z-[2]" />

                    {/* Acabamento Laminado com Brilho Sutil */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-[2]" />

                    {/* Topo do Card: Tag da Matéria Centralizada sem 'Direito' (ex: 'ADMINISTRATIVO', 'PENAL') */}
                    <div className="flex items-center justify-center w-full relative z-10">
                      <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md bg-black/60 text-white/95 border border-white/20 shadow-sm text-center leading-none">
                        {nomeMateriaTag}
                      </span>
                    </div>

                    {/* Centro do Card: Botão de Player Centralizado */}
                    <div className="my-auto flex items-center justify-center relative z-10 py-1">
                      <div 
                        className={cn(
                          "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.6)]",
                          frente
                            ? "bg-black/50 backdrop-blur-md border border-white/50 text-white hover:scale-110 active:scale-95"
                            : "bg-black/35 backdrop-blur-sm border border-white/25 text-white/80"
                        )}
                        style={frente ? {
                          boxShadow: `0 0 20px ${palette.accent}66, 0 4px 14px rgba(0,0,0,0.8)`
                        } : undefined}
                      >
                        <Play className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-white text-white ml-0.5 drop-shadow-md" />
                      </div>
                    </div>

                    {/* Parte Inferior da Capa: Título da Aula/Módulo sem negrito */}
                    <div className="relative z-10 pt-1 pb-0.5 text-center w-full px-0.5">
                      <h4 
                        className="text-[11.5px] sm:text-[12.5px] font-normal leading-snug text-white break-words line-clamp-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
                      >
                        {card.titulo}
                      </h4>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
