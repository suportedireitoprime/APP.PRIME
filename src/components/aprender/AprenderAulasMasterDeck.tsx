import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor, getAreaThemePalette, hexToRgb } from '@/lib/areasDireitoIcons';
import { getAreaCover, prefetchAreaCovers } from '@/lib/areasDireitoCovers';
import { prefetchAprenderArea } from '@/lib/aprenderAreaLoader';
import { cn } from '@/lib/utils';
import type { AprenderArea } from '@/types/aprender';
import type { AprenderHomeAula } from '@/lib/aprenderHomeSnapshot';

const STORAGE_KEY = 'aprender:aulas:master_deck_last_slug';

interface AprenderAulasMasterDeckProps {
  areas: AprenderArea[];
  onOpenArea: (area: AprenderArea) => void;
  emAndamento?: AprenderHomeAula[];
  proxima?: AprenderHomeAula | null;
}

/** Posição visual em leque 3D para as matérias com limites estritos (não-circular no início) */
const getSlot = (diff: number, isMobile: boolean) => {
  const stepX = isMobile ? 66 : 98;
  const stepY = isMobile ? 8 : 12;
  const stepRot = 7.5;

  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, z: 50 };
    case 1:
      return { x: stepX, y: stepY, rotate: stepRot, scale: 0.88, opacity: 0.92, z: 40 };
    case -1:
      return { x: -stepX, y: stepY, rotate: -stepRot, scale: 0.88, opacity: 0.92, z: 40 };
    case 2:
      return { x: stepX * 1.8, y: stepY * 2.1, rotate: stepRot * 2, scale: 0.76, opacity: 0.68, z: 30 };
    case -2:
      return { x: -stepX * 1.8, y: stepY * 2.1, rotate: -stepRot * 2, scale: 0.76, opacity: 0.68, z: 30 };
    case 3:
      return { x: stepX * 2.45, y: stepY * 3.1, rotate: stepRot * 2.8, scale: 0.64, opacity: 0.40, z: 20 };
    case -3:
      return { x: -stepX * 2.45, y: stepY * 3.1, rotate: -stepRot * 2.8, scale: 0.64, opacity: 0.40, z: 20 };
    default:
      return {
        x: diff > 0 ? stepX * 2.8 : -stepX * 2.8,
        y: stepY * 3.8,
        rotate: diff > 0 ? 25 : -25,
        scale: 0.5,
        opacity: 0,
        z: 10,
      };
  }
};

export const AprenderAulasMasterDeck: React.FC<AprenderAulasMasterDeckProps> = memo(({
  areas,
  onOpenArea,
  emAndamento = [],
  proxima = null,
}) => {
  const navigate = useNavigate();

  // Detectar mobile para calibração do leque 3D
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 640;
    return false;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Índice inicial restaurado do localStorage ou da aula em andamento mais recente
  const [ativo, setAtivo] = useState<number>(() => {
    try {
      const savedSlug = localStorage.getItem(STORAGE_KEY);
      if (savedSlug && areas.length > 0) {
        const found = areas.findIndex((a) => a.slug === savedSlug);
        if (found >= 0) return found;
      }
      if (emAndamento.length > 0 && areas.length > 0) {
        const recentSlug = emAndamento[0]?.areaSlug;
        if (recentSlug) {
          const found = areas.findIndex((a) => a.slug === recentSlug);
          if (found >= 0) return found;
        }
      }
    } catch {}
    return 0;
  });

  // Atualizar quando as áreas chegarem do Supabase se ainda estiver no padrão 0
  useEffect(() => {
    if (!areas || areas.length === 0) return;
    try {
      const savedSlug = localStorage.getItem(STORAGE_KEY);
      if (savedSlug) {
        const found = areas.findIndex((a) => a.slug === savedSlug);
        if (found >= 0) {
          setAtivo(found);
          return;
        }
      }
      if (emAndamento.length > 0) {
        const recentSlug = emAndamento[0]?.areaSlug;
        if (recentSlug) {
          const found = areas.findIndex((a) => a.slug === recentSlug);
          if (found >= 0) {
            setAtivo(found);
          }
        }
      }
    } catch {}
  }, [areas, emAndamento]);

  // Salvar sempre a matéria selecionada por último no localStorage
  useEffect(() => {
    if (areas[ativo]?.slug) {
      try {
        localStorage.setItem(STORAGE_KEY, areas[ativo].slug);
      } catch {}
    }
  }, [ativo, areas]);

  // Pré-aquecer capas em cache de memória
  useEffect(() => {
    if (areas.length > 0) {
      prefetchAreaCovers(areas);
    }
  }, [areas]);

  const total = areas.length;
  const activeArea = areas[ativo] || areas[0];

  // Dados da matéria ativa
  const iconInfo = useMemo(() => areaIconFor(activeArea?.slug), [activeArea?.slug]);
  const AreaIcon = iconInfo?.Icon;
  const activeAccentColor = iconInfo?.color || '#fb7185';
  const activePalette = useMemo(
    () => getAreaThemePalette(activeArea?.slug || activeArea?.nome),
    [activeArea?.slug, activeArea?.nome],
  );

  const totalAulas = activeArea?.totalAulas || 0;
  const concluidas = activeArea?.concluidas || 0;
  const pctArea = activeArea?.pct ?? (totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0);

  // Lista de aulas recentes para a Linha do Tempo
  const timelineRecentes = useMemo(() => {
    const list = [...emAndamento];
    if (proxima && !list.some((a) => a.aulaId === proxima.aulaId)) {
      list.push(proxima);
    }
    return list.slice(0, 5);
  }, [emAndamento, proxima]);

  // Navegação estrita por clique nas setas
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
    onOpenArea(activeArea);
  }, [activeArea, onOpenArea]);

  if (!areas || areas.length === 0) return null;

  return (
    <div className="w-full space-y-6 select-none">
      {/* ── 1. Hero Master Deck 3D de Matérias ───────────────────────── */}
      <div className="relative w-full -mx-2 sm:mx-0 px-2 sm:px-0 pt-2 pb-2 flex flex-col items-center select-none overflow-visible">
        {/* Ambiência luminosa sutil adaptada à matéria ativa */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[460px] h-[300px] sm:h-[460px] rounded-full pointer-events-none opacity-25 blur-[90px] transition-colors duration-700"
          style={{ backgroundColor: activeAccentColor }}
        />

        {/* Arena de rotação do deck 3D */}
        <div className="relative flex items-center justify-center w-full max-w-full h-[330px] sm:h-[390px] md:h-[420px] overflow-visible">
          {/* Botão Anterior (Esquerda) — Oculto/desativado se estiver no primeiro card (início à esquerda) */}
          {ativo > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Matéria anterior"
              className="absolute left-2 sm:left-6 md:left-10 bottom-4 sm:bottom-8 z-[60] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/65 hover:bg-black/90 active:scale-95 border border-white/20 text-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <ChevronLeft className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.4]" />
            </button>
          )}

          {/* Botão Próximo (Direita) — Desativado se estiver no último card */}
          {ativo < total - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Próxima matéria"
              className="absolute right-2 sm:right-6 md:right-10 bottom-4 sm:bottom-8 z-[60] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/65 hover:bg-black/90 active:scale-95 border border-white/20 text-white shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <ChevronRight className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.4]" />
            </button>
          )}

          {/* Deck de Cards com suporte a teclado */}
          <div
            tabIndex={0}
            role="region"
            aria-label={`Deck de Matérias. Matéria atual: ${activeArea.nome}. Use as setas para navegar e Enter para abrir.`}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenActive();
              }
            }}
            className="relative flex items-center justify-center w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 rounded-3xl"
          >
            {areas.map((area, i) => {
              // Diferença limitada (linear) em relação ao card ativo
              const diff = i - ativo;

              // Renderiza apenas cartas próximas para fluidez máxima de 120fps
              if (Math.abs(diff) > 3) return null;

              const slot = getSlot(diff, isMobile);
              const frente = diff === 0;

              // Capa oficial ilustrada
              const coverInfo = getAreaCover(area.nome) || getAreaCover(area.slug);
              const coverUrl = coverInfo?.cover || null;
              const palette = getAreaThemePalette(area.slug || area.nome);

              // Nome essencial da matéria para a tag do topo (ex: "ADMINISTRATIVO", "PENAL", "CIVIL")
              const nomeMateriaTag = area.nome
                .replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '')
                .replace(/^Direitos\s+/i, '')
                .trim();

              return (
                <motion.div
                  key={area.id}
                  animate={{
                    x: slot.x,
                    y: slot.y,
                    rotate: slot.rotate,
                    scale: slot.scale,
                    opacity: slot.opacity,
                  }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  style={{ zIndex: slot.z }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (frente) {
                      handleOpenActive();
                    } else {
                      try { haptic.selection(); } catch {}
                      setAtivo(i);
                    }
                  }}
                  onMouseEnter={() => {
                    if (frente) {
                      prefetchAprenderArea(area.slug, null);
                    }
                  }}
                  className="absolute cursor-pointer will-change-transform"
                >
                  {/* Card em Formato Imponente (tamanho maior de capa) */}
                  <div
                    className={cn(
                      "w-[205px] h-[295px] sm:w-[250px] sm:h-[355px] md:w-[265px] md:h-[375px] rounded-[24px] p-4 sm:p-5 flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300",
                      frente
                        ? "border-2 border-white/40 shadow-2xl"
                        : "border border-white/20 shadow-black/80"
                    )}
                    style={{
                      backgroundColor: '#111',
                      boxShadow: frente
                        ? `${palette.shadow}, 0 24px 50px -10px rgba(0,0,0,0.85)`
                        : '0 12px 28px -5px rgba(0,0,0,0.70)',
                      filter: frente ? 'none' : 'brightness(0.65)',
                    }}
                  >
                    {/* Imagem de Capa Oficial Ilustrada em Alta Resolução (Cores Reais) */}
                    {coverUrl && (
                      <img
                        src={coverUrl}
                        alt={area.nome}
                        loading={frente ? "eager" : "lazy"}
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
                      />
                    )}

                    {/* Escurecimento superior e inferior para garantir leitura do texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none z-0" />

                    {/* Moldura Interna Chanfrada de Luxo */}
                    <div className="absolute inset-1.5 rounded-[18px] border border-white/20 pointer-events-none z-10" />

                    {/* Efeito de Brilho e Acabamento Laminado */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.14] pointer-events-none z-10" />

                    {/* Topo do Card: Badge da Matéria */}
                    <div className="flex items-center justify-center w-full relative z-10">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full backdrop-blur-md bg-black/60 text-white border border-white/25 shadow-md text-center leading-none">
                        {nomeMateriaTag}
                      </span>
                    </div>

                    {/* Centro do Card: Botão de Reprodução + Título e Subtítulo */}
                    <div className="mt-auto mb-5 py-2 text-center relative z-10 px-1 flex flex-col items-center">
                      {frente ? (
                        <div className="mb-3 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 border border-white/30 backdrop-blur-md text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white translate-x-0.5" />
                        </div>
                      ) : null}

                      <h3
                        className="text-sm sm:text-base md:text-lg font-bold leading-snug text-white drop-shadow-lg line-clamp-2"
                        style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}
                      >
                        {area.nome}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-white/80 mt-1 drop-shadow-sm font-medium">
                        {area.totalAulas > 0 ? `${area.totalAulas} aulas` : 'Trilha disponível'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Barra de Progresso da Matéria Selecionada ─────────────── */}
      <div className="w-full max-w-xl mx-auto px-4 py-3.5 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 shadow-xl backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
              style={{ backgroundColor: `${activeAccentColor}22` }}
            >
              {AreaIcon ? (
                <AreaIcon className="w-4 h-4" style={{ color: activeAccentColor }} strokeWidth={2.2} />
              ) : (
                <BookOpen className="w-4 h-4" style={{ color: activeAccentColor }} />
              )}
            </div>
            <span className="font-semibold text-white truncate text-sm">
              {activeArea.nome}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-muted-foreground text-xs">
              {totalAulas > 0 ? `${concluidas}/${totalAulas} aulas` : '0 aulas'}
            </span>
            <span
              className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: activeAccentColor }}
            >
              {pctArea}%
            </span>
          </div>
        </div>

        {/* Barra de Progresso Estilizada com Glow */}
        <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/10 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, pctArea))}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full relative"
            style={{
              background: `linear-gradient(90deg, ${activePalette.primary}aa, ${activePalette.primary})`,
              boxShadow: `0 0 10px ${activePalette.primary}`,
            }}
          />
        </div>
      </div>

      {/* ── 3. Linha do Tempo de Recentes ("O que a pessoa fez por último") ─ */}
      <div className="w-full max-w-xl mx-auto space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-400 stroke-[2.2]" />
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white/90">
              Linha do Tempo Recente
            </h4>
          </div>
          {timelineRecentes.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {timelineRecentes.length} aula(s) recente(s)
            </span>
          )}
        </div>

        {timelineRecentes.length > 0 ? (
          <div className="relative border-l-2 border-white/10 ml-5 sm:ml-6 pl-6 sm:pl-7 space-y-4">
            {timelineRecentes.map((aula, idx) => {
              const pal = getAreaThemePalette(aula.areaSlug || aula.areaNome);
              const isFirst = idx === 0;

              return (
                <div key={aula.aulaId} className="relative group">
                  {/* Ponto / Nó da Linha do Tempo */}
                  <div
                    className={cn(
                      "absolute -left-[39px] sm:-left-[45px] top-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                      isFirst ? "bg-rose-500 border-white text-white" : "bg-zinc-900 border-white/30 text-white/70"
                    )}
                    style={{
                      borderColor: isFirst ? '#ffffff' : pal.primary,
                      boxShadow: isFirst ? `0 0 12px ${pal.primary}80` : undefined,
                    }}
                  >
                    {aula.pct === 100 ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.5]" />
                    ) : (
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />
                    )}
                  </div>

                  {/* Card da Aula Recente */}
                  <div
                    onClick={() => {
                      try { haptic.impact(); } catch {}
                      navigate(`/aprender/aula/${aula.aulaId}`);
                    }}
                    className="p-4 sm:p-5 rounded-2xl bg-[#111]/80 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-xl flex flex-col gap-3 relative overflow-hidden group-hover:bg-[#161616]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md text-white border"
                        style={{
                          backgroundColor: `${pal.primary}15`,
                          borderColor: `${pal.primary}40`,
                          color: pal.primary,
                        }}
                      >
                        {aula.areaNome}
                      </span>
                      <span className="text-xs font-semibold text-white/70">
                        {aula.pct}% concluído
                      </span>
                    </div>

                    <h5 className="text-sm sm:text-base font-medium text-white group-hover:text-rose-400 transition-colors line-clamp-2 leading-relaxed tracking-normal font-sans">
                      {aula.titulo}
                    </h5>

                    {/* Mini progresso */}
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, aula.pct))}%`,
                            backgroundColor: pal.primary,
                            boxShadow: `0 0 8px ${pal.primary}80`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 shrink-0 group-hover:translate-x-1 transition-transform">
                        <span>Continuar</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio de Linha do Tempo (Incentivo Acolhedor) */
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] text-center space-y-2 backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-rose-400 mx-auto opacity-80" />
            <p className="text-xs text-white/80 font-medium">
              Sua linha do tempo aparecerá aqui assim que você iniciar suas aulas.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Escolha uma matéria no deck acima e dê o play para começar seus estudos!
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

AprenderAulasMasterDeck.displayName = 'AprenderAulasMasterDeck';
export default AprenderAulasMasterDeck;
