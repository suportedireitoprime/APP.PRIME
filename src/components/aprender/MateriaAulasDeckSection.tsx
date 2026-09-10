import React, { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Play } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { CANONICAL_AREA_TOPICS } from '@/components/aprender/MateriaFlashcardsDeckSection';
import { useAprenderHomeLessonsMap, type AulaCarouselItem } from '@/hooks/useAprenderHomeLessonsMap';
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

interface DisplayTopicItem {
  id: string;
  titulo: string;
  ordem: number;
  aulaRef?: AulaCarouselItem;
  moduloRef?: ModuloItem;
  moduloId?: string;
}

export const MateriaAulasDeckSection: React.FC<MateriaAulasDeckSectionProps> = memo(({
  area,
  modulos,
  overrideTotal,
  overrideConcluidas,
  overridePct,
  onOpenArea,
  onOpenModulo,
}) => {
  const navigate = useNavigate();
  const { lessonsMap } = useAprenderHomeLessonsMap();
  const [isPaused, setIsPaused] = useState(false);

  const iconInfo = useMemo(() => areaIconFor(area.slug), [area.slug]);
  const AreaIcon = iconInfo?.Icon;
  const accentColor = iconInfo?.color || '#fb7185';
  const palette = useMemo(() => getAreaThemePalette(area.slug || area.nome), [area.slug, area.nome]);

  // Capa oficial ilustrada da matéria
  const coverInfo = useMemo(() => {
    return getAreaCover(area.nome) || getAreaCover(area.slug);
  }, [area.nome, area.slug]);
  const coverUrl = coverInfo?.cover || null;

  // Nome essencial da matéria para a tag do topo (ex: "ADMINISTRATIVO", "PENAL", "CIVIL")
  const nomeMateriaTag = useMemo(() => {
    if (!area?.nome) return '';
    return area.nome
      .replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '')
      .replace(/^Direitos\s+/i, '')
      .trim();
  }, [area?.nome]);

  // Aulas reais da matéria pelo mapeamento central
  const areaLessons = useMemo(() => {
    return lessonsMap.get(area.id) || [];
  }, [lessonsMap, area.id]);

  // Lista unificada e numerada de tópicos/aulas da matéria
  const displayTopics = useMemo<DisplayTopicItem[]>(() => {
    // 1. Aulas reais cadastradas para a área
    if (areaLessons.length > 0) {
      return areaLessons.map((l, idx) => ({
        id: l.id,
        titulo: l.titulo,
        ordem: idx + 1,
        aulaRef: l,
        moduloId: l.moduloId,
      }));
    }

    // 2. Módulos reais da área
    if (modulos.length > 0) {
      return modulos.map((m, idx) => ({
        id: m.id,
        titulo: m.titulo,
        ordem: idx + 1,
        moduloRef: m,
        moduloId: m.id,
      }));
    }

    // 3. Tópicos canônicos curriculares de fallback
    const canonical = CANONICAL_AREA_TOPICS[area.slug] || [
      `Fundamentos de ${area.nome}`,
      `Princípios & Regras Gerais`,
      `Legislação & Normas Aplicadas`,
      `Jurisprudência & Súmulas`,
      `Casos Práticos & OAB`,
      `Temas Avançados & Atualizações`,
    ];

    return canonical.map((title, idx) => ({
      id: `${area.id}-topic-${idx + 1}`,
      titulo: title,
      ordem: idx + 1,
    }));
  }, [areaLessons, modulos, area.slug, area.id, area.nome]);

  // Lista duplicada para scroll infinito contínuo e sem emendas
  const tickerItems = useMemo(() => {
    if (displayTopics.length === 0) return [];
    if (displayTopics.length < 5) {
      return [...displayTopics, ...displayTopics, ...displayTopics, ...displayTopics];
    }
    return [...displayTopics, ...displayTopics];
  }, [displayTopics]);

  // Duração proporcional para manter velocidade suave e lenta
  const tickerDuration = useMemo(() => {
    return Math.max(16, displayTopics.length * 3.2);
  }, [displayTopics.length]);

  const handleItemClick = useCallback((item: DisplayTopicItem) => {
    try { haptic.selection(); } catch {}
    if (item.aulaRef?.id) {
      navigate(`/aprender/aula/${item.aulaRef.id}`);
    } else if (item.moduloRef && onOpenModulo) {
      onOpenModulo(item.moduloRef);
    } else {
      onOpenArea();
    }
  }, [navigate, onOpenModulo, onOpenArea]);

  const handleCoverClick = useCallback(() => {
    try { haptic.impact(); } catch {}
    if (displayTopics[0]?.aulaRef?.id) {
      navigate(`/aprender/aula/${displayTopics[0].aulaRef.id}`);
    } else if (displayTopics[0]?.moduloRef && onOpenModulo) {
      onOpenModulo(displayTopics[0].moduloRef);
    } else {
      onOpenArea();
    }
  }, [displayTopics, navigate, onOpenModulo, onOpenArea]);

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

      {/* ── Painel Híbrido: Capa Única à Esquerda + Linha Reta Divisória + Tópicos/Aulas Subindo Lentamente à Direita ── */}
      <div className="relative w-full -mx-1 sm:mx-0 px-1 sm:px-0 pt-1 pb-1 flex items-center select-none overflow-hidden">
        <div 
          className="relative flex items-center w-full rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border border-white/[0.08] shadow-lg backdrop-blur-md overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => {
            setTimeout(() => setIsPaused(false), 2400);
          }}
        >
          {/* Brilho ambiente sutil no tom da matéria */}
          <div 
            className="absolute -left-10 -top-10 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-3xl"
            style={{ backgroundColor: accentColor }}
          />

          {/* 1. Capa Única à Esquerda */}
          <div
            onClick={handleCoverClick}
            className={cn(
              "w-[125px] h-[175px] sm:w-[145px] sm:h-[195px] rounded-[18px] sm:rounded-[20px] p-3 sm:p-3.5 flex flex-col justify-between select-none relative overflow-hidden shrink-0 cursor-pointer transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]",
              "border border-white/25 shadow-2xl"
            )}
            style={{
              background: palette.cardGradient,
              boxShadow: `${palette.shadow}, 0 16px 36px -8px rgba(0,0,0,0.85)`,
            }}
          >
            {/* Imagem de Capa Oficial Ilustrada em Alta Resolução */}
            {coverUrl && (
              <img
                src={coverUrl}
                alt={area.nome}
                loading="eager"
                decoding="async"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover select-none z-0 group-hover:scale-105 transition-transform duration-500"
              />
            )}

            {/* Degradê Escuro Cinematográfico */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20 pointer-events-none z-[1]" />

            {/* Moldura Interna Chanfrada */}
            <div className="absolute inset-1 rounded-[14px] sm:rounded-[16px] border border-white/15 pointer-events-none z-[2]" />

            {/* Acabamento Laminado */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] pointer-events-none z-[2]" />

            {/* Tag da Matéria no Topo */}
            <div className="flex items-center justify-center w-full relative z-10">
              <span className="text-[9px] sm:text-[9.5px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full backdrop-blur-md bg-black/65 text-white/95 border border-white/20 shadow-sm text-center leading-none">
                {nomeMateriaTag}
              </span>
            </div>

            {/* Botão de Player Centralizado */}
            <div className="my-auto flex items-center justify-center relative z-10 py-1">
              <div 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.6)] bg-black/50 backdrop-blur-md border border-white/50 text-white group-hover:scale-110 group-active:scale-95"
                style={{
                  boxShadow: `0 0 18px ${palette.accent}66, 0 4px 14px rgba(0,0,0,0.8)`
                }}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white ml-0.5 drop-shadow-md" />
              </div>
            </div>

            {/* Rodapé da Capa: Chamada de Início */}
            <div className="relative z-10 pt-1 pb-0.5 text-center w-full px-0.5">
              <span className="text-[10.5px] sm:text-[11.5px] font-bold text-white leading-tight block truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                Iniciar Trilha
              </span>
            </div>
          </div>

          {/* 2. Linha Reta Divisória Vertical com Ponto de Destaque */}
          <div className="relative flex flex-col items-center justify-center self-stretch shrink-0 mx-2.5 sm:mx-4.5 py-1">
            <div className="w-[1.5px] h-full rounded-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <div 
              className="absolute w-2 h-2 rounded-full border border-white/40 shadow-sm"
              style={{ 
                backgroundColor: accentColor,
                boxShadow: `0 0 8px ${accentColor}80`,
              }}
            />
          </div>

          {/* 3. Lista de Tópicos/Aulas Subindo Lentamente de Forma Automática com Fade Superior e Inferior */}
          <div 
            className="relative flex-1 min-w-0 h-[175px] sm:h-[195px] overflow-hidden flex flex-col justify-start"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 12%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.85) 88%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 12%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.85) 88%, transparent 100%)',
            }}
          >
            <style>{`
              @keyframes scrollAulasVertical_${area.id.replace(/[^a-zA-Z0-9_-]/g, '')} {
                0% {
                  transform: translateY(0);
                }
                100% {
                  transform: translateY(-50%);
                }
              }
            `}</style>

            <div 
              className="w-full flex flex-col gap-1.5 pt-1 pb-1 will-change-transform"
              style={{
                animation: `scrollAulasVertical_${area.id.replace(/[^a-zA-Z0-9_-]/g, '')} ${tickerDuration}s linear infinite`,
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {tickerItems.map((item, idx) => {
                const itemNumber = String((idx % displayTopics.length) + 1).padStart(2, '0');
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => handleItemClick(item)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer group/item shrink-0"
                  >
                    {/* Número da Aula */}
                    <div 
                      className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0 border transition-colors shadow-sm"
                      style={{
                        backgroundColor: `${accentColor}18`,
                        borderColor: `${accentColor}35`,
                      }}
                    >
                      <span 
                        className="font-mono text-[10.5px] font-bold"
                        style={{ color: accentColor }}
                      >
                        {itemNumber}
                      </span>
                    </div>

                    {/* Título da Aula */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] sm:text-[12.5px] font-medium text-white/90 group-hover/item:text-white truncate transition-colors leading-snug">
                        {item.titulo}
                      </p>
                    </div>

                    {/* Ícone Play Discreto */}
                    <div className="shrink-0 opacity-40 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all">
                      <Play className="w-3 h-3 fill-current text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra de Progresso Embaixo da Seção ── */}
      <div className="pt-2 pb-5 space-y-2 relative z-10 px-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-normal truncate max-w-[70%]">
            <strong className="text-white font-semibold">{area.nome}</strong>
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
