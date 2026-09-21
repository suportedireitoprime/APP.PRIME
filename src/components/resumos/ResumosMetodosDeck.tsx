import React, { useState, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, NotebookText, Brain, ChevronLeft, ChevronRight, CheckCircle2, Play } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";
import { Metodo } from "@/components/resumos-juridicos/metodologias";

export interface MetodoDeckItem {
  id: Metodo;
  title: string;
  badge: string;
  desc: string;
  color: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

const METODOS_ITEMS: MetodoDeckItem[] = [
  {
    id: "conceitos",
    title: "Conceitos",
    badge: "Tradicional",
    desc: "Visão aprofundada e completa da matéria, com fundamentação jurídica, exemplos práticos e termos-chave.",
    color: "#ef4444",
    gradient: "from-[#ef4444]/40 via-black/60 to-black/90",
    icon: FileText,
  },
  {
    id: "cornell",
    title: "Método Cornell",
    badge: "Fixação Ativa",
    desc: "Organização em tópicos, palavras-chave e perguntas de revisão para autoavaliação e retenção acelerada.",
    color: "#38bdf8",
    gradient: "from-[#38bdf8]/40 via-black/60 to-black/90",
    icon: NotebookText,
  },
  {
    id: "feynman",
    title: "Método Feynman",
    badge: "Simplificação",
    desc: "Explicação em 4 passos com linguagem simples do dia a dia e analogias para eliminar lacunas de entendimento.",
    color: "#fbbf24",
    gradient: "from-[#fbbf24]/40 via-black/60 to-black/90",
    icon: Brain,
  },
];

interface ResumosMetodosDeckProps {
  coverUrl?: string;
  onSelectMetodo: (metodo: Metodo, isGerado: boolean) => void;
  initialMetodo?: Metodo;
  metodosGerados?: Metodo[];
}

const getSlot = (diff: number) => {
  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1.05, opacity: 1, z: 40 };
    case 1:
      return { x: 82, y: 10, rotate: 8, scale: 0.86, opacity: 0.85, z: 20 };
    case -1:
      return { x: -82, y: 10, rotate: -8, scale: 0.86, opacity: 0.85, z: 20 };
    default:
      return { x: diff > 0 ? 120 : -120, y: 16, rotate: diff > 0 ? 12 : -12, scale: 0.7, opacity: 0, z: 5 };
  }
};

export const ResumosMetodosDeck: React.FC<ResumosMetodosDeckProps> = ({
  coverUrl,
  onSelectMetodo,
  initialMetodo = "conceitos",
  metodosGerados = [],
}) => {
  const [ativo, setAtivo] = useState(() => {
    const idx = METODOS_ITEMS.findIndex((m) => m.id === initialMetodo);
    return idx >= 0 ? idx : 0;
  });

  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const total = METODOS_ITEMS.length;

  const handlePrev = useCallback(() => {
    haptic.selection();
    setAtivo((i) => (i - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    haptic.selection();
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

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  const activeItem = useMemo(() => METODOS_ITEMS[ativo], [ativo]);
  const ActiveIcon = activeItem.icon;

  const handleConfirm = useCallback(() => {
    haptic.impact();
    const isGerado = metodosGerados.includes(activeItem.id);
    onSelectMetodo(activeItem.id, isGerado);
  }, [activeItem.id, onSelectMetodo, metodosGerados]);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* ── Carrossel em Leque 3D (Estilo Deck de Pílulas) ── */}
      <div className="relative flex items-center justify-center w-full max-w-[340px] sm:max-w-[380px] h-[210px] sm:h-[230px]">
        {/* Seta esquerda */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Método anterior"
          className="absolute left-1 sm:left-2 z-[45] w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95 shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Seta direita */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Próximo método"
          className="absolute right-1 sm:right-2 z-[45] w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95 shadow-md"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Deck com Drag Horizontal */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
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
          className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {METODOS_ITEMS.map((item, i) => {
            let diff = (i - ativo) % total;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            const slot = getSlot(diff);
            const isFront = diff === 0;
            const ItemIcon = item.icon;

            return (
              <motion.div
                key={item.id}
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
                  if (isDragging || isSwipingRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (isFront) {
                    handleConfirm();
                  } else {
                    haptic.selection();
                    setAtivo(i);
                  }
                }}
                className="absolute w-[136px] sm:w-[150px] h-[190px] sm:h-[210px] shrink-0 cursor-pointer will-change-transform"
              >
                {/* Card com sombra e borda temática */}
                <div
                  className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 transition-all duration-300 ${
                    isFront
                      ? "border-2 shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
                      : "border border-white/15 opacity-80"
                  }`}
                  style={{
                    borderColor: isFront ? item.color : "rgba(255,255,255,0.15)",
                    boxShadow: isFront ? `0 12px 30px -4px ${item.color}40` : undefined,
                  }}
                >
                  {/* Imagem de Fundo (Capa da Área) */}
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#1a1a20]" />
                  )}

                  {/* Gradient Overlay Temático */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${item.gradient} transition-opacity`}
                  />

                  {/* Tint de cor para distinguir cada método */}
                  <div
                    className="absolute inset-0 mix-blend-color opacity-50 pointer-events-none"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Sheen reflexo na entrada do card frontal */}
                  {isFront && (
                    <motion.div
                      key={`sheen-${item.id}`}
                      initial={{ x: "-150%", opacity: 0 }}
                      animate={{ x: "180%", opacity: [0, 0.5, 0.5, 0] }}
                      transition={{ duration: 0.75, ease: "easeInOut" }}
                      className="absolute inset-y-0 w-3/4 -skew-x-12 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  )}

                  {/* Badge superior */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <span
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md bg-black/60 shadow-sm"
                      style={{ borderColor: `${item.color}66`, color: item.color }}
                    >
                      {item.badge}
                    </span>
                  </div>

                  {/* Play / Enter central no card frontal */}
                  {isFront && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-md"
                        style={{ backgroundColor: `${item.color}cc` }}
                      >
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Informações na base do card */}
                  <div className="absolute bottom-0 inset-x-0 p-2.5 sm:p-3 z-10 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center text-center">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center mb-1 shadow-sm"
                      style={{ backgroundColor: `${item.color}33`, color: item.color }}
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] sm:text-[14px] font-black uppercase tracking-wide text-white drop-shadow-md">
                      {item.title}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Indicador de Paginação por Dots ── */}
      <div className="flex items-center justify-center gap-2 mt-3 mb-3">
        {METODOS_ITEMS.map((item, idx) => {
          const isActive = idx === ativo;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptic.selection();
                setAtivo(idx);
              }}
              aria-label={`Ir para ${item.title}`}
              className="transition-all duration-300"
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? "w-6" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
                style={{ backgroundColor: isActive ? item.color : undefined }}
              />
            </button>
          );
        })}
      </div>

      {/* ── Painel de Detalhes do Método Ativo ── */}
      <div className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 sm:p-4 text-left transition-all">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${activeItem.color}25`, color: activeItem.color }}
            >
              <ActiveIcon className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-[15px] font-black uppercase tracking-wider text-white">
              {activeItem.title}
            </h3>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-black/40"
            style={{ borderColor: `${activeItem.color}44`, color: activeItem.color }}
          >
            {activeItem.badge}
          </span>
        </div>

        <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-normal">
          {activeItem.desc}
        </p>
      </div>

      {/* ── Botão Principal de Confirmação ── */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full mt-3.5 h-12 rounded-2xl font-bold text-sm tracking-wide text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
        style={{
          backgroundColor: activeItem.color,
          boxShadow: `0 8px 25px -4px ${activeItem.color}66`,
        }}
      >
        {activeItem.id === "conceitos"
          ? "ESTUDAR CONCEITOS APROFUNDADOS"
          : metodosGerados.includes(activeItem.id) 
          ? `ESTUDAR COM ${activeItem.title.toUpperCase()}`
          : `GERAR ${activeItem.title.toUpperCase()} COM IA`}
      </button>
    </div>
  );
};
