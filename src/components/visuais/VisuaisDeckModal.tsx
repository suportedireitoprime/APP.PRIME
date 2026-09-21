import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ArrowRight, Brain, Layers, GitBranch, Network, Sparkles, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PrimeImage } from '@/components/ui/PrimeImage';
import type { VisualTipo } from '@/lib/visuaisJuridicos/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export interface VisuaisDeckModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTipo: (tipo: VisualTipo) => void;
  onEscolherTipo?: (tipo: VisualTipo) => void;
  title?: string;
  subtitle?: string;
  initialTipo?: VisualTipo;
}

export interface VisualDeckItem {
  tipo: VisualTipo;
  nome: string;
  tag: string;
  subtitulo: string;
  descricao: string;
  para: string;
  cor: string;
  imagem: string;
  icone: LucideIcon;
}

const VISUAIS_ITEMS: VisualDeckItem[] = [
  {
    tipo: 'mapa_mental',
    nome: 'Mapa Mental',
    tag: 'ESTRUTURA RADIAL',
    subtitulo: 'Conceito Central & Ramificações',
    descricao: 'Visão geral ramificada de um tema, com os pontos-chave em torno do conceito central.',
    para: 'Revisar um tema inteiro em poucos minutos e fixar conceitos.',
    cor: '#EF4444',
    imagem: '/visuais/mapa_mental.webp',
    icone: Brain,
  },
  {
    tipo: 'infografico',
    nome: 'Infográfico',
    tag: 'CARDS ESTRUTURADOS',
    subtitulo: 'Requisitos & Elementos',
    descricao: 'Requisitos, elementos ou classificações em cartões numerados e comentados.',
    para: 'Memorizar requisitos e elementos essenciais de um instituto.',
    cor: '#F59E0B',
    imagem: '/visuais/infografico.webp',
    icone: Layers,
  },
  {
    tipo: 'fluxograma',
    nome: 'Fluxograma',
    tag: 'PASSO A PASSO LÓGICO',
    subtitulo: 'Decisões Sim / Não',
    descricao: 'Passo a passo de decisões (sim/não) até a consequência jurídica.',
    para: 'Aplicar a norma a um caso concreto sem pular etapas.',
    cor: '#10B981',
    imagem: '/visuais/fluxograma.webp',
    icone: GitBranch,
  },
  {
    tipo: 'diagrama',
    nome: 'Diagrama',
    tag: 'HIERARQUIA NORMATIVA',
    subtitulo: 'Gênero às Espécies',
    descricao: 'Hierarquia e relação entre conceitos, do gênero às espécies.',
    para: 'Compreender a organização sistemática e relações normativas.',
    cor: '#8B5CF6',
    imagem: '/visuais/diagrama.webp',
    icone: Network,
  },
];

/** Posições visuais em leque para o deck (inspirado no padrão Pílulas) */
const getSlot = (diff: number) => {
  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1.05, opacity: 1, z: 70 };
    case 1:
      return { x: 74, y: 9, rotate: 8.5, scale: 0.9, opacity: 0.92, z: 60 };
    case 2:
      return { x: 124, y: 19, rotate: 16, scale: 0.78, opacity: 0.65, z: 50 };
    case -1:
      return { x: -74, y: 9, rotate: -8.5, scale: 0.9, opacity: 0.92, z: 60 };
    case -2:
      return { x: -124, y: 19, rotate: -16, scale: 0.78, opacity: 0.65, z: 50 };
    default:
      if (diff > 0) return { x: 150, y: 30, rotate: 22, scale: 0.65, opacity: 0, z: 10 };
      return { x: -150, y: 30, rotate: -22, scale: 0.65, opacity: 0, z: 10 };
  }
};

/** Gera o path SVG exato do contorno com cantos arredondados */
const getCardPath = (w: number, h: number, r = 16) => {
  const pad = 1;
  const x = pad;
  const y = pad;
  const width = w - pad * 2;
  const height = h - pad * 2;
  return `M ${x + r} ${y}
    H ${x + width - r}
    A ${r} ${r} 0 0 1 ${x + width} ${y + r}
    V ${y + height - r}
    A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}
    H ${x + r}
    A ${r} ${r} 0 0 1 ${x} ${y + height - r}
    V ${y + r}
    A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
};

export const VisuaisDeckModal = memo(({
  open,
  onClose,
  onSelectTipo,
  onEscolherTipo,
  title,
  subtitle,
  initialTipo,
}: VisuaisDeckModalProps) => {
  useBodyScrollLock(open);

  // Mapa Mental é o índice 0 (padrão solicitado)
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    if (open) {
      if (initialTipo) {
        const idx = VISUAIS_ITEMS.findIndex((item) => item.tipo === initialTipo);
        if (idx !== -1) setAtivo(idx);
      } else {
        setAtivo(0);
      }
    }
  }, [open, initialTipo]);

  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const lastWheelTime = useRef(0);
  const total = VISUAIS_ITEMS.length;

  // Dimensões dos cards idênticas ao Aprender / Pílulas
  const [cardDims, setCardDims] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      return { w: 152, h: 224 };
    }
    return { w: 140, h: 208 };
  });

  useEffect(() => {
    const handleResize = () => {
      setCardDims(window.innerWidth >= 640 ? { w: 152, h: 224 } : { w: 140, h: 208 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pathD = useMemo(() => getCardPath(cardDims.w, cardDims.h, 16), [cardDims]);

  const handlePrev = useCallback(() => {
    haptic.selection();
    setPaused(true);
    setAtivo((i) => (i - 1 + total) % total);
    setTimeout(() => setPaused(false), 300);
  }, [total]);

  const handleNext = useCallback(() => {
    haptic.selection();
    setPaused(true);
    setAtivo((i) => (i + 1) % total);
    setTimeout(() => setPaused(false), 300);
  }, [total]);

  const handleSelect = useCallback((tipo: VisualTipo) => {
    haptic.impact();
    if (onEscolherTipo) {
      onEscolherTipo(tipo);
    } else {
      onSelectTipo(tipo);
    }
  }, [onEscolherTipo, onSelectTipo]);

  // Teclado: Navegação por setas e Esc para fechar
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const item = VISUAIS_ITEMS[ativo];
        if (item) handleSelect(item.tipo);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, ativo, onClose, handleNext, handlePrev, handleSelect]);

  // Touch handlers nativos e suaves
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      isSwipingRef.current = false;
      setPaused(true);
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
    const deltaY = (e.changedTouches[0]?.clientY || 0) - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (isSwipingRef.current || (Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY))) {
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
    setTimeout(() => setPaused(false), 300);
  }, [handleNext, handlePrev]);

  // Suporte a wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 20) {
      const now = Date.now();
      if (now - lastWheelTime.current > 280) {
        lastWheelTime.current = now;
        if (e.deltaX > 0) handleNext();
        else handlePrev();
      }
    }
  }, [handleNext, handlePrev]);

  const activeItem = VISUAIS_ITEMS[ativo] || VISUAIS_ITEMS[0];

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-5 select-none overflow-hidden">
          {/* ── Fundo Animado com Quadradinhos (ShapeGrid Oficial) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl z-0"
            onClick={onClose}
          >
            <div className="absolute inset-0 pointer-events-none opacity-60">
              <ShapeGrid
                speed={0.5}
                squareSize={38}
                direction="diagonal"
                borderColor="rgba(255, 255, 255, 0.05)"
                hoverFillColor="rgba(255, 255, 255, 0.12)"
                shape="square"
                hoverTrailAmount={5}
              />
            </div>
          </motion.div>

          {/* ── Card Flutuante com o Deck dentro ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[390px] sm:max-w-[430px] rounded-[32px] bg-[#111114]/95 border border-white/10 shadow-[0_28px_80px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl flex flex-col items-center pt-4 pb-5 px-3.5 sm:px-5 overflow-hidden"
            style={{
              maxHeight: 'calc(100dvh - 32px)',
            }}
          >
            {/* Brilho superior de iluminação sutil */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.07] via-white/[0.01] to-transparent pointer-events-none" />

            {/* Botão Fechar (X) no topo direito */}
            <button
              type="button"
              onClick={() => {
                haptic.light();
                onClose();
              }}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" strokeWidth={2.2} />
            </button>

            {/* Cabeçalho do Card Flutuante */}
            <div className="w-full text-center pr-8 pl-8 pt-1 mb-2">
              <h2 className="font-display text-[20px] sm:text-[22px] font-black uppercase tracking-widest text-white leading-tight line-clamp-1">
                {title || 'Visuais Jurídicos'}
              </h2>
              <p className="text-[12px] sm:text-[13px] text-zinc-400 font-medium leading-snug mt-1 line-clamp-1 px-4">
                {subtitle || 'Escolha o formato que combina com o seu estudo'}
              </p>
            </div>

            {/* ── O DECK DE CARDS 3D FLUTUANTE ── */}
            <div
              className="relative w-full flex flex-col items-center select-none overflow-visible pt-1 pb-1"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Container de visualização 3D */}
              <div className="relative flex items-center justify-center w-full h-[230px] sm:h-[246px]">
                {/* Botão anterior */}
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Formato anterior"
                  className="absolute left-0 sm:left-1 z-[75] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Botão próximo */}
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Próximo formato"
                  className="absolute right-0 sm:right-1 z-[75] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Deck interativo */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragStart={() => {
                    setIsDragging(true);
                    setPaused(true);
                  }}
                  onDragEnd={(_, info) => {
                    setTimeout(() => setIsDragging(false), 120);
                    if (info.offset.x < -24 || info.velocity.x < -180) {
                      handleNext();
                    } else if (info.offset.x > 24 || info.velocity.x > 180) {
                      handlePrev();
                    }
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                  className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
                >
                  {VISUAIS_ITEMS.map((item, i) => {
                    let diff = (i - ativo) % total;
                    if (diff > total / 2) diff -= total;
                    if (diff < -total / 2) diff += total;

                    const slot = getSlot(diff);
                    const frente = diff === 0;
                    const Icon = item.icone;

                    if (Math.abs(diff) > 2) return null;

                    return (
                      <motion.div
                        key={item.tipo}
                        animate={{
                          x: slot.x,
                          y: slot.y,
                          rotate: slot.rotate,
                          scale: slot.scale,
                          opacity: slot.opacity,
                        }}
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        style={{ zIndex: slot.z }}
                        onClick={(e) => {
                          if (isDragging || isSwipingRef.current) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          if (frente) {
                            handleSelect(item.tipo);
                          } else {
                            haptic.selection();
                            setAtivo(i);
                          }
                        }}
                        className="absolute w-[140px] sm:w-[152px] h-[208px] sm:h-[224px] shrink-0 cursor-pointer will-change-transform"
                      >
                        {/* Corpo do card */}
                        <div
                          className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 transition-all duration-300 ${
                            frente
                              ? 'border border-white/20 shadow-[0_20px_45px_rgba(0,0,0,0.9)]'
                              : 'border border-white/10 shadow-black/80'
                          }`}
                          style={{
                            clipPath: 'inset(0 round 16px)',
                            WebkitClipPath: 'inset(0 round 16px)',
                          }}
                        >
                          {/* Capa com PrimeImage */}
                          <PrimeImage
                            src={item.imagem}
                            alt={item.nome}
                            priority={frente}
                            aspectRatio="2/3"
                            targetWidth={400}
                            fallbackText={item.nome}
                            containerClassName="w-full h-full"
                            className="pointer-events-none select-none object-cover"
                          />

                          {/* Escurecimento suave nos cards laterais */}
                          {!frente && (
                            <div className="absolute inset-0 bg-black/45 pointer-events-none" />
                          )}

                          {/* Reflexo vítreo (sheen sweep) ao entrar na frente */}
                          {frente && (
                            <motion.div
                              key={`sheen-${item.tipo}`}
                              initial={{ x: '-160%', opacity: 0 }}
                              animate={{ x: '180%', opacity: [0, 0.7, 0.7, 0] }}
                              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                              className="absolute inset-y-0 w-3/4 -skew-x-12 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                            />
                          )}

                          {/* Tag / Badge no topo do card */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
                            <span
                              className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-md border"
                              style={{
                                backgroundColor: `${item.cor}25`,
                                borderColor: `${item.cor}50`,
                                color: item.cor,
                              }}
                            >
                              {item.tag}
                            </span>
                          </div>

                          {/* Ícone central flutuante no card frontal */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-xl transition-all duration-300 ${
                                frente ? 'opacity-95 scale-100' : 'opacity-0 scale-75'
                              }`}
                              style={{
                                boxShadow: `0 8px 24px -4px ${item.cor}60`,
                              }}
                            >
                              <Icon
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                style={{ color: item.cor }}
                                strokeWidth={2.2}
                              />
                            </div>
                          </div>

                          {/* Informações na base do card com gradiente escuro */}
                          <div
                            className={`absolute bottom-0 left-0 right-0 z-10 pointer-events-none transition-all duration-300 ${
                              frente
                                ? 'px-2.5 pb-2.5 pt-12 bg-gradient-to-t from-black/95 via-black/80 to-transparent'
                                : 'px-2 pb-2 pt-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent'
                            }`}
                          >
                            <span
                              className={`font-display font-black leading-tight block text-center uppercase tracking-wider transition-all duration-300 ${
                                frente
                                  ? 'text-[13px] sm:text-[14px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                                  : 'text-[11px] sm:text-[12px] text-zinc-300 drop-shadow-md'
                              }`}
                            >
                              {item.nome}
                            </span>
                            {frente && (
                              <span className="text-[10px] text-zinc-400 block text-center truncate mt-0.5">
                                {item.subtitulo}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Linha com luzinha contornando o card frontal */}
                        {frente && (
                          <svg
                            key={`beam-visuais-${ativo}`}
                            className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
                            style={{ width: cardDims.w, height: cardDims.h }}
                          >
                            <style>{`
                              @keyframes visuaisBorderProgress {
                                0% { stroke-dashoffset: 1000; }
                                100% { stroke-dashoffset: 0; }
                              }
                              @keyframes visuaisBorderGlow {
                                0% { stroke-dashoffset: 0; }
                                100% { stroke-dashoffset: -1000; }
                              }
                            `}</style>

                            {/* Linha base fina com cor do formato */}
                            <path
                              d={pathD}
                              pathLength="1000"
                              fill="none"
                              stroke={item.cor}
                              strokeWidth="1.5"
                              strokeOpacity="0.32"
                            />

                            {/* Progresso de contorno suave */}
                            <path
                              d={pathD}
                              pathLength="1000"
                              fill="none"
                              stroke={item.cor}
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              style={{
                                strokeDasharray: '1000 1000',
                                animation: 'visuaisBorderProgress 5.5s linear forwards',
                                animationPlayState: paused ? 'paused' : 'running',
                                filter: `drop-shadow(0 0 4px ${item.cor})`,
                              }}
                            />

                            {/* Luzinha cintilante correndo pelo topo */}
                            <path
                              d={pathD}
                              pathLength="1000"
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              style={{
                                strokeDasharray: '70 930',
                                animation: 'visuaisBorderGlow 5.5s linear forwards',
                                animationPlayState: paused ? 'paused' : 'running',
                                filter: `drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 8px ${item.cor})`,
                              }}
                            />
                          </svg>
                        )}

                        {/* Reflexo espelhado no chão sob a capa principal */}
                        {frente && (
                          <motion.div
                            key={`reflexo-${item.tipo}`}
                            initial={{ opacity: 0, y: -2 }}
                            animate={{ opacity: 0.38, y: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="absolute top-[calc(100%+3px)] left-0 right-0 h-[38px] sm:h-[44px] rounded-b-xl overflow-hidden pointer-events-none select-none"
                            style={{
                              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 88%)',
                              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 88%)',
                            }}
                          >
                            <img
                              src={item.imagem}
                              alt=""
                              aria-hidden="true"
                              className="w-full h-[208px] sm:h-[224px] object-cover block origin-top"
                              style={{ transform: 'scaleY(-1)' }}
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </div>

            {/* ── Indicador de Paginação por Dots ── */}
            <div className="flex items-center justify-center gap-1.5 mt-2 mb-2">
              {VISUAIS_ITEMS.map((item, idx) => {
                const isSelected = idx === ativo;
                return (
                  <button
                    key={`dot-${item.tipo}`}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setAtivo(idx);
                    }}
                    aria-label={`Ir para ${item.nome}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isSelected
                        ? 'w-6 shadow-sm'
                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                    style={{
                      backgroundColor: isSelected ? item.cor : undefined,
                      boxShadow: isSelected ? `0 0 8px ${item.cor}80` : undefined,
                    }}
                  />
                );
              })}
            </div>

            {/* ── Descrição e Finalidade do Formato Ativo ── */}
            <div className="w-full text-center px-2 min-h-[64px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem.tipo}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  <p className="text-[12px] sm:text-[12.5px] text-zinc-300 font-medium leading-snug">
                    {activeItem.descricao}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/5 text-[11px] text-zinc-400">
                    <Sparkles className="w-3 h-3 shrink-0" style={{ color: activeItem.cor }} />
                    <span className="truncate">{activeItem.para}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Botão de Ação Primária (Selecionar Formato) ── */}
            <div className="w-full mt-3">
              <button
                type="button"
                onClick={() => handleSelect(activeItem.tipo)}
                className="w-full h-12 rounded-2xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 text-white shadow-lg active:scale-[0.98] transition-all hover:brightness-110"
                style={{
                  background: `linear-gradient(135deg, ${activeItem.cor}, ${activeItem.cor}dd)`,
                  boxShadow: `0 8px 24px -4px ${activeItem.cor}45`,
                }}
              >
                <span>Acessar {activeItem.nome}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

VisuaisDeckModal.displayName = 'VisuaisDeckModal';
export default VisuaisDeckModal;
