import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Heart,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Headphones,
  Sparkles,
  Crown,
  FileText,
  Route,
  List,
  Layers,
  CheckCircle2,
  Clock,
  Check,
  Zap,
  Search,
  Mic,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { PageHeader } from "@/components/vademecum/navigation/PageHeader";
import { Input } from "@/components/ui/input";
import { BotaoDownloadAudio } from "./BotaoDownloadAudio";
import { capaDaArea, decomporTituloCapitulo } from "@/lib/audioaulasHelper";
import { type AulaAudio, audioIdOf, useAudioaulasPlayer } from "@/contexts/AudioaulasPlayerContext";
import { useAudioaulasProgresso, type ProgressoAulaItem } from "@/lib/audioaulaProgresso";
import { CapaOtimizada } from "./CapaOtimizada";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import PremiumGate from "@/components/PremiumGate";
import { haptic } from "@/lib/nativeHaptics";
import { cn } from "@/lib/utils";
import { getAreaThemePalette } from "@/lib/areasDireitoIcons";

function EqualizadorAnimado({ cor = "currentColor" }: { cor?: string }) {
  return (
    <span className="inline-flex items-end gap-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <motion.span
        className="w-0.5 sm:w-[2.5px] rounded-full"
        style={{ backgroundColor: cor }}
        animate={{ height: ["25%", "95%", "40%", "80%", "30%"] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="w-0.5 sm:w-[2.5px] rounded-full"
        style={{ backgroundColor: cor }}
        animate={{ height: ["60%", "30%", "100%", "45%", "70%"] }}
        transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
      />
      <motion.span
        className="w-0.5 sm:w-[2.5px] rounded-full"
        style={{ backgroundColor: cor }}
        animate={{ height: ["35%", "85%", "25%", "90%", "40%"] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
    </span>
  );
}

function dispararConfete() {
  try {
    void confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.75 },
      colors: ["#10b981", "#3b82f6", "#eab308", "#ec4899", "#8b5cf6"],
    });
  } catch {
    // fallback seguro
  }
}

function formatarTempoSegundos(segundos: number): string {
  if (!segundos || isNaN(segundos) || segundos <= 0) return "00:00";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatarTituloAula(rawTitulo: string): string {
  if (!rawTitulo) return "";

  // 1. Remover número sequencial no início, ex: "1. ", "2. ", "01 - "
  let texto = rawTitulo
    .trim()
    .replace(/^[0-9]+[. \t\-–—]+/i, "")
    .trim();

  // 2. Remover prefixo de sigla ou código, ex: "ECA — ", "ECA - ", "CF/88 — "
  texto = texto
    .replace(/^(?:ECA|CF\/?88|CP|CPP|CC|CPC|CLT|CTN|CDC|CTB|OAB|EOAB)\s*[-–—:]\s*/i, "")
    .trim();
  texto = texto.replace(/^(?:ECA\s*[-–—:]\s*)+/i, "").trim();

  // 3. Formatar para iniciar direto no Art. <número>: <tema>
  const matchArtigo = texto.match(
    /^art(?:igo|\.)?\s*([0-9]+(?:\s*[-–—]\s*[A-Za-z]+|[A-Za-z]+)?)[º°ª]?(?:\s*[-–—:]\s*(.*))?$/i,
  );
  if (matchArtigo) {
    const num = matchArtigo[1].replace(/\s+/g, "").trim();
    const resto = (matchArtigo[2] || "").trim();
    if (resto) {
      return `Art. ${num}: ${resto.charAt(0).toUpperCase() + resto.slice(1)}`;
    }
    return `Art. ${num}`;
  }

  return texto;
}

interface LinhaAulaProps {
  a: AulaAudio;
  atualId: number | null;
  tocando: boolean;
  favoritos: Set<string>;
  alternarFavorito: (a: AulaAudio) => void;
  handleTocarAula: (a: AulaAudio) => void;
  isLocked?: boolean;
  onOpenGate?: () => void;
  concluida?: boolean;
  pct?: number;
}

const LinhaAula = React.memo(function LinhaAula({
  a,
  atualId,
  tocando,
  favoritos,
  alternarFavorito,
  handleTocarAula,
  isLocked = false,
  onOpenGate,
  concluida = false,
  pct = 0,
}: LinhaAulaProps) {
  const ativo = a.id === atualId;
  const fav = favoritos.has(audioIdOf(a));

  const handleClick = () => {
    if (isLocked) {
      haptic.impact("medium");
      onOpenGate?.();
      return;
    }
    void handleTocarAula(a);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
      }}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
        ativo
          ? "bg-primary/15 border border-primary/30 shadow-sm"
          : isLocked
            ? "hover:bg-amber-500/4"
            : "hover:bg-white/5"
      }`}
    >
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        disabled={!a.url_audio && !isLocked}
        className="flex items-center gap-3 min-w-0 flex-1 text-left disabled:opacity-50 group focus-visible:outline-none"
      >
        <span className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-md border border-white/5">
          <CapaOtimizada
            src={capaDaArea(a.area || "")}
            alt=""
            className="transition-transform group-hover:scale-105"
          />
          <span
            className={`absolute inset-0 grid place-items-center transition-opacity ${isLocked ? "bg-black/60 text-amber-400" : "bg-black/40 text-white"}`}
          >
            {isLocked ? (
              <Crown className="h-5 w-5 text-amber-400 fill-amber-400/20" />
            ) : ativo && tocando ? (
              <Pause className="h-5 w-5 text-primary fill-primary" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </span>
        </span>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-sm sm:text-[14.5px] font-sans! font-normal break-words text-left leading-snug tracking-normal normal-case ${ativo ? "text-primary" : "text-foreground"}`}
            >
              {formatarTituloAula(a.titulo)}
            </p>
            {concluida && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5" />
                OUVIDA
              </span>
            )}
            {!concluida && pct > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 shrink-0">
                {pct}%
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase text-amber-300 bg-amber-500/20 border border-amber-400/40 shrink-0">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                PREMIUM
              </span>
            )}
          </div>
        </div>
      </motion.button>

      {!isLocked && <BotaoDownloadAudio aula={a} />}

      <button
        onClick={() => alternarFavorito(a)}
        aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
        className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0 transition active:opacity-70"
      >
        <Heart
          className={`h-4 w-4 ${fav ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`}
        />
      </button>
    </motion.div>
  );
});

/* ══════════════════════════════════════════════════════════════════
   TRILHA EM ZIGUE-ZAGUE DE CAPÍTULOS (ESTILO APRENDER)
   ══════════════════════════════════════════════════════════════════ */
interface TrilhaZigueZagueCapitulosProps {
  capitulos: [string, AulaAudio[]][];
  atualId: number | null;
  coverUrl: string;
  palette: ReturnType<typeof getAreaThemePalette>;
  subAbaEfetiva: "materias" | "pecas";
  onSelectCapitulo: (tema: string) => void;
  mapaProgresso: Record<number, ProgressoAulaItem>;
}

const TrilhaZigueZagueCapitulos = React.memo(function TrilhaZigueZagueCapitulos({
  capitulos,
  atualId,
  coverUrl,
  palette,
  subAbaEfetiva,
  onSelectCapitulo,
  mapaProgresso,
}: TrilhaZigueZagueCapitulosProps) {
  return (
    <div className="relative py-4 sm:py-8 w-full min-w-0 max-w-full overflow-hidden">
      <div className="w-full min-w-0 relative z-[2] flex flex-col">
        {capitulos.map(([tema, lista], i) => {
          const isLeft = i % 2 === 0;
          const contemAulaTocando = lista.some((a) => a.id === atualId);
          const { tituloLimpo, faixaArtigos } = decomporTituloCapitulo(tema);
          const badgePrefix = subAbaEfetiva === "pecas" ? "PEÇA" : "CAPÍTULO";
          const numStr = (i + 1).toString().padStart(2, "0");
          const aulasConcluidas = lista.filter((a) => mapaProgresso[a.id]?.concluida).length;
          const totalCapAulas = lista.length;
          const pctCapitulo =
            totalCapAulas > 0 ? Math.round((aulasConcluidas / totalCapAulas) * 100) : 0;

          return (
            <div key={tema} className="w-full flex flex-col">
              {/* Linha do Card em Zigue-Zague */}
              <div
                className={cn(
                  "relative z-10 flex w-full items-center justify-between gap-2 xs:gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group",
                  isLeft ? "flex-row" : "flex-row-reverse",
                )}
              >
                {/* ── CONJUNTO DE 3 CARTAS EM DECK ABERTO EM LEQUE ── */}
                <div
                  onClick={() => {
                    haptic.selection();
                    onSelectCapitulo(tema);
                  }}
                  className="relative shrink-0 w-[140px] xs:w-[155px] sm:w-[185px] md:w-[210px] h-[195px] xs:h-[215px] sm:h-[240px] md:h-[265px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                >
                  {/* CARTA 1 (Traseira/Fundo) */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                      isLeft
                        ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3"
                        : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3",
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
                    <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
                      <div
                        className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                        style={{ borderColor: palette.primary }}
                      >
                        <Layers className="w-4 h-4 text-white/60" />
                      </div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                    </div>
                  </div>

                  {/* CARTA 2 (Meio) */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                      isLeft
                        ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                        : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2",
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />
                    <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
                      <div
                        className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                        style={{ borderColor: palette.primary }}
                      >
                        <Layers className="w-4 h-4 text-white/60" />
                      </div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                    </div>
                  </div>

                  {/* CARTA 3 (Principal Frontal) */}
                  <div
                    className={cn(
                      "relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border transition-all duration-300 origin-bottom",
                      isLeft
                        ? "group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
                        : "group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]",
                      contemAulaTocando
                        ? "border-primary ring-2 ring-primary/40 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                        : "border-white/30 hover:border-primary/60",
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: contemAulaTocando ? `0 0 25px ${palette.primary}` : palette.shadow,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />
                    <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-10" />

                    <img
                      src={coverUrl}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/95 via-black/25 to-[#0d0f12]/60 pointer-events-none z-0" />

                    {/* Centro: Play Icon */}
                    <div className="my-auto py-2 z-[1] w-full flex items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <div
                          className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125 pointer-events-none"
                          style={{ backgroundColor: `${palette.primary}50` }}
                        />
                        <div className="relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_22px_rgba(239,68,68,0.6)]">
                          <Play className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 fill-current translate-x-0.5 transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Barra fina de progresso no rodapé da capa (apenas se houver aulas ouvidas) */}
                    {aulasConcluidas > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40 overflow-hidden z-[2]">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${pctCapitulo}%`,
                            backgroundColor: pctCapitulo === 100 ? "#10b981" : palette.primary,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── LINHA FINA CONECTORA E TÍTULO NO LADO OPOSTO ── */}
                <div
                  onClick={() => {
                    haptic.selection();
                    onSelectCapitulo(tema);
                  }}
                  className={cn(
                    "flex-1 min-w-0 flex items-center cursor-pointer select-none py-2 transition-all",
                    isLeft
                      ? "flex-row pl-1.5 xs:pl-2 sm:pl-3"
                      : "flex-row-reverse pr-1.5 xs:pr-2 sm:pr-3",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center shrink-0 w-6 xs:w-8 sm:w-12 md:w-16",
                      isLeft ? "flex-row" : "flex-row-reverse",
                    )}
                  >
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
                      style={{
                        backgroundColor: palette.primary,
                        boxShadow: `0 0 8px ${palette.primary}`,
                      }}
                    />
                    <div
                      className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
                      style={{
                        background: isLeft
                          ? `linear-gradient(to right, ${palette.primary}, rgba(255,255,255,0.3), transparent)`
                          : `linear-gradient(to left, ${palette.primary}, rgba(255,255,255,0.3), transparent)`,
                      }}
                    />
                  </div>

                  <div
                    className={cn(
                      "flex-1 min-w-0 flex flex-col justify-center px-1.5 xs:px-2.5 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5",
                      isLeft ? "items-start text-left" : "items-end text-right",
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-1.5 mb-1 opacity-90",
                        isLeft ? "justify-start" : "justify-end",
                      )}
                    >
                      <span
                        className="text-[12px] sm:text-[14px] font-bold uppercase tracking-wider"
                        style={{ color: palette.primary }}
                      >
                        {badgePrefix} {numStr}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/25" />
                      <span className="text-[10px] sm:text-[12px] font-light text-zinc-400">
                        {totalCapAulas} {totalCapAulas === 1 ? "aula" : "aulas"}
                      </span>
                      {faixaArtigos && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/25" />
                          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400">
                            {faixaArtigos}
                          </span>
                        </>
                      )}
                      {pctCapitulo === 100 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Concluído
                        </span>
                      )}
                    </div>

                    <h3 className="font-sans font-normal text-[16px] xs:text-[18px] sm:text-[20px] md:text-[22px] lg:text-[23px] leading-[1.3] break-words text-zinc-100 group-hover:text-amber-200 transition-colors drop-shadow-md mt-1">
                      {tituloLimpo}
                    </h3>

                    {/* Barra de progresso do capítulo (apenas se o aluno já tiver começado a ouvir e não estiver 100% concluído) */}
                    {aulasConcluidas > 0 && pctCapitulo < 100 && (
                      <div
                        className={cn(
                          "mt-2 flex items-center gap-2 w-full max-w-55",
                          isLeft ? "justify-start" : "justify-end",
                        )}
                      >
                        <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pctCapitulo}%`,
                              backgroundColor: palette.primary,
                            }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 shrink-0">
                          {aulasConcluidas}/{totalCapAulas} ouvidas
                        </span>
                      </div>
                    )}

                    {contemAulaTocando && (
                      <div
                        className={cn(
                          "mt-2 flex items-center",
                          isLeft ? "justify-start" : "justify-end",
                        )}
                      >
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-primary bg-primary/20 border border-primary/30 animate-pulse">
                          <Sparkles className="w-3 h-3" /> Tocando agora
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Conector Serpenteante de Deck a Deck */}
              {i < capitulos.length - 1 && (
                <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-[5] overflow-visible">
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <filter
                        id={`trail-glow-cap-${i}`}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <path
                      d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />

                    <path
                      d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                      fill="none"
                      stroke={palette.primary}
                      strokeWidth="2.5"
                      strokeDasharray="5 7"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      filter={`url(#trail-glow-cap-${i})`}
                    />
                  </svg>

                  <div
                    className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                    style={{
                      left: "50%",
                      top: "50%",
                      boxShadow: `0 0 10px ${palette.primary}`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════════
   TRILHA EM ZIGUE-ZAGUE DE AULAS (ESTILO APRENDER)
   ══════════════════════════════════════════════════════════════════ */
interface TrilhaZigueZagueAulasProps {
  aulas: AulaAudio[];
  atualId: number | null;
  tocando: boolean;
  tempoAtual: number;
  duracaoAtual: number;
  velocidade: number;
  setVelocidade: (rate: number) => void;
  coverUrl: string;
  palette: ReturnType<typeof getAreaThemePalette>;
  favoritos: Set<string>;
  mapaProgresso: Record<number, ProgressoAulaItem>;
  alternarFavorito: (a: AulaAudio) => void;
  handleTocarAula: (a: AulaAudio) => void;
  alternarConcluida: (id: number) => void;
}

const TrilhaZigueZagueAulas = React.memo(function TrilhaZigueZagueAulas({
  aulas,
  atualId,
  tocando,
  tempoAtual,
  duracaoAtual,
  velocidade,
  setVelocidade,
  coverUrl,
  palette,
  favoritos,
  mapaProgresso,
  alternarFavorito,
  handleTocarAula,
  alternarConcluida,
}: TrilhaZigueZagueAulasProps) {
  return (
    <div className="relative py-4 sm:py-8 w-full min-w-0 max-w-full overflow-hidden">
      <div className="w-full min-w-0 relative z-[2] flex flex-col">
        {aulas.map((a, i) => {
          const isLeft = i % 2 === 0;
          const ativo = a.id === atualId;
          const estaTocando = ativo && tocando;
          const fav = favoritos.has(audioIdOf(a));
          const numStr = (i + 1).toString().padStart(2, "0");
          const tituloFormatado = formatarTituloAula(a.titulo);

          const prog = mapaProgresso[a.id];
          const concluida = prog?.concluida ?? false;
          const duracaoTotal =
            estaTocando && duracaoAtual > 0 ? duracaoAtual : (prog?.duracao ?? 0);
          const tempoOuvido = estaTocando ? tempoAtual : (prog?.tempo ?? 0);
          const pct =
            estaTocando && duracaoTotal > 0
              ? Math.min(100, Math.round((tempoOuvido / duracaoTotal) * 100))
              : (prog?.pct ?? 0);
          const duracaoEstimadaMin = Math.max(5, Math.round((duracaoTotal || 600) / 60));

          return (
            <div key={a.id} className="w-full flex flex-col">
              {/* Linha do Card em Zigue-Zague */}
              <div
                className={cn(
                  "relative z-10 flex w-full items-center justify-between gap-2 xs:gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group",
                  isLeft ? "flex-row" : "flex-row-reverse",
                )}
              >
                {/* ── CONJUNTO DE 3 CARTAS EM DECK ABERTO EM LEQUE ── */}
                <div
                  onClick={() => {
                    haptic.selection();
                    handleTocarAula(a);
                  }}
                  className="relative shrink-0 w-[140px] xs:w-[155px] sm:w-[185px] md:w-[210px] h-[195px] xs:h-[215px] sm:h-[240px] md:h-[265px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                >
                  {/* CARTA 1 (Traseira/Fundo) */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                      isLeft
                        ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3"
                        : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3",
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
                    <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
                      <div
                        className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                        style={{ borderColor: palette.primary }}
                      >
                        <Headphones className="w-4 h-4 text-white/60" />
                      </div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                    </div>
                  </div>

                  {/* CARTA 2 (Meio) */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                      isLeft
                        ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                        : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2",
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />
                    <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
                      <div
                        className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                        style={{ borderColor: palette.primary }}
                      >
                        <Headphones className="w-4 h-4 text-white/60" />
                      </div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                    </div>
                  </div>

                  {/* CARTA 3 (Principal Frontal) */}
                  <div
                    className={cn(
                      "relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border transition-all duration-300 origin-bottom",
                      isLeft
                        ? "group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
                        : "group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]",
                      ativo
                        ? "border-primary ring-2 ring-primary/40 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                        : "border-white/30 hover:border-primary/60",
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: ativo ? `0 0 25px ${palette.primary}` : palette.shadow,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />
                    <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-10" />

                    <img
                      src={coverUrl}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/95 via-black/25 to-[#0d0f12]/60 pointer-events-none z-0" />

                    {/* Centro: Play / Pause Button */}
                    <div className="my-auto py-2 z-[1] w-full flex items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <div
                          className={cn(
                            "absolute inset-0 rounded-full blur-md transition-opacity duration-300 scale-125 pointer-events-none",
                            estaTocando
                              ? "opacity-100 animate-pulse"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                          style={{ backgroundColor: `${palette.primary}60` }}
                        />
                        <div
                          className={cn(
                            "relative w-11 h-11 sm:w-13 sm:h-13 rounded-full backdrop-blur-md border flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110",
                            estaTocando
                              ? "bg-primary border-primary text-primary-foreground shadow-[0_0_24px_rgba(239,68,68,0.7)]"
                              : "bg-black/60 border-white/30 text-white group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_22px_rgba(239,68,68,0.6)]",
                          )}
                        >
                          {estaTocando ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current translate-x-0.5 transition-colors" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rodapé: Métricas de Progresso da Aula (Estilo Aprender) */}
                    <div className="z-[1] pt-1.5 sm:pt-2 border-t border-white/20 w-full px-0.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-normal text-white/95 mb-1 sm:mb-1.5">
                        <span className="truncate flex items-center gap-1.5">
                          {estaTocando ? (
                            <EqualizadorAnimado cor={concluida ? "#10b981" : palette.primary} />
                          ) : (
                            <Headphones className="w-3 h-3 text-primary" />
                          )}
                          <span>
                            {concluida
                              ? "Concluída"
                              : estaTocando
                                ? "Em reprodução"
                                : pct > 0
                                  ? `Ouvido ${pct}%`
                                  : "Áudio aula"}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "font-semibold font-sans ml-1",
                            concluida ? "text-emerald-400" : "text-white",
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-black/50 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/20">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500 shadow-sm",
                            concluida ? "bg-emerald-400" : "",
                          )}
                          style={{
                            width: `${Math.max(pct, estaTocando || pct > 0 ? 8 : 0)}%`,
                            backgroundColor: concluida ? undefined : palette.primary,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── LINHA FINA CONECTORA E TÍTULO / MÉTRICAS NO LADO OPOSTO ── */}
                <div
                  className={cn(
                    "flex-1 min-w-0 flex items-center select-none py-2 transition-all",
                    isLeft
                      ? "flex-row pl-1.5 xs:pl-2 sm:pl-3"
                      : "flex-row-reverse pr-1.5 xs:pr-2 sm:pr-3",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center shrink-0 w-6 xs:w-8 sm:w-12 md:w-16",
                      isLeft ? "flex-row" : "flex-row-reverse",
                    )}
                  >
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
                      style={{
                        backgroundColor: palette.primary,
                        boxShadow: `0 0 8px ${palette.primary}`,
                      }}
                    />
                    <div
                      className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
                      style={{
                        background: isLeft
                          ? `linear-gradient(to right, ${palette.primary}, rgba(255,255,255,0.3), transparent)`
                          : `linear-gradient(to left, ${palette.primary}, rgba(255,255,255,0.3), transparent)`,
                      }}
                    />
                  </div>

                  <div
                    className={cn(
                      "flex-1 min-w-0 flex flex-col justify-center px-1.5 xs:px-2.5 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5",
                      isLeft ? "items-start text-left" : "items-end text-right",
                    )}
                  >
                    {/* Linha 1: Badges de Métricas e Status */}
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-1.5 mb-1 opacity-95",
                        isLeft ? "justify-start" : "justify-end",
                      )}
                    >
                      <span
                        className="text-[11px] sm:text-[13px] font-extrabold uppercase tracking-wider"
                        style={{ color: palette.primary }}
                      >
                        AULA {numStr}
                      </span>

                      <span className="w-1 h-1 rounded-full bg-white/25" />

                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                        <Clock className="w-2.5 h-2.5 text-zinc-400" />
                        <span>~{duracaoEstimadaMin} min</span>
                      </span>

                      {concluida ? (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Ouvida</span>
                        </span>
                      ) : estaTocando ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-primary bg-primary/20 border border-primary/30 px-2.5 py-0.5 rounded-full shadow-sm">
                          <EqualizadorAnimado cor={palette.primary} />
                          <span>Tocando agora</span>
                        </span>
                      ) : pct > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{pct}% ouvido</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          <span>Pendente</span>
                        </span>
                      )}
                    </div>

                    {/* Linha 2: Título da Aula */}
                    <h3
                      onClick={() => {
                        haptic.selection();
                        handleTocarAula(a);
                      }}
                      className={cn(
                        "font-sans font-normal text-[16px] xs:text-[18px] sm:text-[20px] md:text-[22px] lg:text-[23px] leading-[1.3] break-words transition-colors drop-shadow-md cursor-pointer",
                        ativo ? "text-primary" : "text-zinc-100 group-hover:text-amber-200",
                      )}
                    >
                      {tituloFormatado}
                    </h3>

                    {/* Linha 3: Barra de Progresso e Métricas de Tempo da Aula */}
                    <div
                      className={cn(
                        "w-full max-w-65 mt-2 space-y-1",
                        isLeft ? "text-left" : "text-right ml-auto",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2 text-[11px] text-zinc-400",
                          isLeft ? "justify-start" : "justify-end",
                        )}
                      >
                        {estaTocando && duracaoTotal > 0 ? (
                          <span className="text-primary font-mono font-medium">
                            {formatarTempoSegundos(tempoOuvido)} /{" "}
                            {formatarTempoSegundos(duracaoTotal)} ({pct}%)
                          </span>
                        ) : concluida ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Áudio 100% concluído
                          </span>
                        ) : pct > 0 ? (
                          <span className="text-amber-300 font-medium">
                            {formatarTempoSegundos(tempoOuvido)} ouvido ({pct}%)
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-light">
                            Não iniciada • Toque para reproduzir
                          </span>
                        )}
                      </div>

                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            concluida ? "bg-emerald-400" : "",
                          )}
                          style={{
                            width: `${Math.max(pct, estaTocando || pct > 0 ? 5 : 0)}%`,
                            backgroundColor: concluida ? undefined : palette.primary,
                          }}
                        />
                      </div>
                    </div>

                    {/* Linha 4: Ações com Botão de Ouvir Rápido, Marcar Concluída, Download e Favoritar */}
                    <div
                      className={cn(
                        "flex items-center gap-2 mt-3 pt-1 flex-wrap",
                        isLeft ? "justify-start" : "justify-end",
                      )}
                    >
                      <button
                        onClick={() => {
                          haptic.impact("light");
                          handleTocarAula(a);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm",
                          estaTocando
                            ? "bg-primary text-primary-foreground shadow-primary/30"
                            : "bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20",
                        )}
                      >
                        {estaTocando ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pausar</span>
                          </>
                        ) : pct > 0 && !concluida ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Continuar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Ouvir</span>
                          </>
                        )}
                      </button>

                      {/* Seletor Rápido de Velocidade */}
                      {ativo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic.impact("light");
                            const next =
                              velocidade === 1
                                ? 1.25
                                : velocidade === 1.25
                                  ? 1.5
                                  : velocidade === 1.5
                                    ? 2
                                    : 1;
                            setVelocidade(next);
                          }}
                          className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold transition active:scale-95 bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10"
                          title="Alterar velocidade de reprodução (1x, 1.25x, 1.5x, 2x)"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>{velocidade}x</span>
                        </button>
                      )}

                      {/* Botão de Marcar / Desmarcar como Concluída */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.selection();
                          alternarConcluida(a.id);
                        }}
                        title={concluida ? "Marcar como não ouvida" : "Marcar como ouvida"}
                        className={cn(
                          "h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 border",
                          concluida
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10",
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "w-3.5 h-3.5",
                            concluida ? "text-emerald-400" : "text-zinc-500",
                          )}
                        />
                        <span className="hidden xs:inline">
                          {concluida ? "Concluída" : "Concluir"}
                        </span>
                      </button>

                      <BotaoDownloadAudio aula={a} />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alternarFavorito(a);
                        }}
                        aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
                        className="h-8 w-8 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition text-zinc-400 hover:text-white border border-white/10"
                      >
                        <Heart className={`h-4 w-4 ${fav ? "fill-rose-400 text-rose-400" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conector Serpenteante de Aula a Aula */}
              {i < aulas.length - 1 && (
                <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-5 overflow-visible">
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <filter
                        id={`trail-glow-aula-${i}`}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <path
                      d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />

                    <path
                      d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                      fill="none"
                      stroke={palette.primary}
                      strokeWidth="2.5"
                      strokeDasharray="5 7"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      filter={`url(#trail-glow-aula-${i})`}
                    />
                  </svg>

                  <div
                    className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                    style={{
                      left: "50%",
                      top: "50%",
                      boxShadow: `0 0 10px ${palette.primary}`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

interface AudioaulasListaAulasProps {
  areaAtual: string | null;
  aba: string;
  temasDaArea: [string, AulaAudio[]][];
  listaAba: AulaAudio[];
  busca: string;
  atualId: number | null;
  tocando: boolean;
  favoritos: Set<string>;
  alternarFavorito: (a: AulaAudio) => void;
  handleTocarAula: (a: AulaAudio) => void;
  capituloSelecionado?: string | null;
  setCapituloSelecionado?: (cap: string | null) => void;
}

export const AudioaulasListaAulas = React.memo(function AudioaulasListaAulas({
  areaAtual,
  aba,
  temasDaArea,
  listaAba,
  busca,
  atualId,
  tocando,
  favoritos,
  alternarFavorito,
  handleTocarAula,
  capituloSelecionado: capituloExterno,
  setCapituloSelecionado: setCapituloExterno,
}: AudioaulasListaAulasProps) {
  const { isPremium } = useSubscription();
  const { mapa: mapaProgresso, alternarConcluida } = useAudioaulasProgresso();
  const {
    tempo: tempoPlayer,
    dur: durPlayer,
    velocidade: velocidadePlayer,
    setVelocidade: setVelocidadePlayer,
  } = useAudioaulasPlayer();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [capituloLocal, setCapituloLocal] = useState<string | null>(null);
  const [isShimmering, setIsShimmering] = useState(false);
  const [isAbaShimmering, setIsAbaShimmering] = useState(false);
  const [modoVisualizacao, setModoVisualizacao] = useState<"trilha" | "lista" | "recentes">(
    "trilha",
  );
  const [filtroStatus, setFiltroStatus] = useState<
    "todas" | "pendentes" | "andamento" | "concluidas"
  >("todas");
  const [buscaAula, setBuscaAula] = useState("");
  const [ordemAulas, setOrdemAulas] = useState<"crono" | "alpha" | "fav">("crono");

  const handleAlternarConcluidaComFeedback = useCallback(
    (id: number) => {
      const jaEstavaConcluida = !!mapaProgresso[id]?.concluida;
      alternarConcluida(id);
      if (!jaEstavaConcluida) {
        haptic.success();
        dispararConfete();
        toast.success("Aula concluída! Parabéns pelo progresso! 🎉");
      } else {
        haptic.impact("light");
        toast.info("Aula reaberta para novos estudos.");
      }
    },
    [mapaProgresso, alternarConcluida],
  );

  const palette = useMemo(() => getAreaThemePalette(areaAtual || "geral"), [areaAtual]);
  const coverUrl = useMemo(() => capaDaArea(areaAtual || ""), [areaAtual]);

  const capituloSelecionado = capituloExterno !== undefined ? capituloExterno : capituloLocal;
  const setCapituloSelecionado = setCapituloExterno || setCapituloLocal;

  useEffect(() => {
    setFiltroStatus("todas");
    setBuscaAula("");
    setOrdemAulas("crono");
  }, [capituloSelecionado]);

  const prevCapituloRef = useRef<string | null>(capituloSelecionado);
  const prevAbaRef = useRef(aba);

  const handleSelecionarCapitulo = useCallback(
    (tema: string | null) => {
      setIsShimmering(true);
      setCapituloSelecionado(tema);
      if (modoVisualizacao === "recentes") {
        setModoVisualizacao("trilha");
      }
      const timer = setTimeout(() => {
        setIsShimmering(false);
      }, 120);
      return () => clearTimeout(timer);
    },
    [setCapituloSelecionado, modoVisualizacao],
  );

  useEffect(() => {
    if (capituloSelecionado !== prevCapituloRef.current) {
      prevCapituloRef.current = capituloSelecionado;
      if (capituloSelecionado !== null) {
        setIsShimmering(true);
        const timer = setTimeout(() => {
          setIsShimmering(false);
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [capituloSelecionado]);

  useEffect(() => {
    if (aba !== prevAbaRef.current) {
      prevAbaRef.current = aba;
      if (aba !== "aulas") {
        setIsAbaShimmering(true);
        const timer = setTimeout(() => {
          setIsAbaShimmering(false);
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [aba]);

  // Estado da sub-aba de transição: 'materias' vs 'pecas'
  const [subAba, setSubAba] = useState<"materias" | "pecas">("materias");

  // Reset da sub-aba ao mudar de área
  useEffect(() => {
    setSubAba("materias");
  }, [areaAtual]);

  // Separar capítulos de Matérias Teóricas vs Peças Práticas
  const { materias, pecasPraticas } = useMemo(() => {
    const isPeca = (tema: string, lista: AulaAudio[]) => {
      if (/\bpe[çc]as?\s+pr[aá]ticas?\b/i.test(tema)) return true;
      return lista.some(
        (a) =>
          /\bpe[çc]as?\s+pr[aá]ticas?\b/i.test(a.titulo || "") ||
          /\bpe[çc]as?\s+pr[aá]ticas?\b/i.test(a.tema || ""),
      );
    };

    const mats: [string, AulaAudio[]][] = [];
    const pecas: [string, AulaAudio[]][] = [];

    for (const item of temasDaArea) {
      if (isPeca(item[0], item[1])) {
        pecas.push(item);
      } else {
        mats.push(item);
      }
    }
    return { materias: mats, pecasPraticas: pecas };
  }, [temasDaArea]);

  const temPecasPraticas = pecasPraticas.length > 0;
  const subAbaEfetiva = temPecasPraticas ? subAba : "materias";

  // Sincronizar sub-aba se capítulo selecionado for peça prática
  useEffect(() => {
    if (capituloSelecionado && temPecasPraticas) {
      const estaEmPecas = pecasPraticas.some(([t]) => t === capituloSelecionado);
      if (estaEmPecas && subAba !== "pecas") {
        setSubAba("pecas");
      } else if (!estaEmPecas && subAba === "pecas") {
        setSubAba("materias");
      }
    }
  }, [capituloSelecionado, temPecasPraticas, pecasPraticas, subAba]);

  // Lista de capítulos ativa conforme a sub-aba selecionada
  const listaCapitulosAtiva = useMemo(() => {
    if (subAbaEfetiva === "pecas") return pecasPraticas;
    return materias;
  }, [subAbaEfetiva, pecasPraticas, materias]);

  // Totais de aulas por categoria
  const totalAulasMaterias = useMemo(() => {
    return materias.reduce((acc, [, lista]) => acc + lista.length, 0);
  }, [materias]);

  const totalAulasPecas = useMemo(() => {
    return pecasPraticas.reduce((acc, [, lista]) => acc + lista.length, 0);
  }, [pecasPraticas]);

  // Encontrar índice do capítulo selecionado para navegação anterior/próximo
  const capituloIdx = useMemo(() => {
    if (!capituloSelecionado) return -1;
    const idxNaAtiva = listaCapitulosAtiva.findIndex(([tema]) => tema === capituloSelecionado);
    if (idxNaAtiva >= 0) return idxNaAtiva;
    return temasDaArea.findIndex(([tema]) => tema === capituloSelecionado);
  }, [capituloSelecionado, listaCapitulosAtiva, temasDaArea]);

  const aulasDoCapitulo = useMemo(() => {
    if (!capituloSelecionado) return [];
    const item = temasDaArea.find(([tema]) => tema === capituloSelecionado);
    return item ? item[1] : [];
  }, [capituloSelecionado, temasDaArea]);

  const placeholderAula = useMemo(() => {
    if (aulasDoCapitulo.length > 0) {
      const primeiro = aulasDoCapitulo[0].titulo || "aula";
      const formatado = formatarTituloAula(primeiro);
      return `Pesquisar ${formatado.slice(0, 22).toLowerCase()}...`;
    }
    return "Pesquisar aula...";
  }, [aulasDoCapitulo]);

  const aulasProcessadas = useMemo(() => {
    let lista = [...aulasDoCapitulo];

    if (buscaAula.trim()) {
      const termo = buscaAula.toLowerCase().trim();
      lista = lista.filter((a) => {
        const tit = (a.titulo || "").toLowerCase();
        const num = formatarTituloAula(a.titulo || "").toLowerCase();
        return tit.includes(termo) || num.includes(termo);
      });
    }

    if (ordemAulas === "alpha") {
      lista.sort((a, b) => {
        const titA = formatarTituloAula(a.titulo || a.tema || "");
        const titB = formatarTituloAula(b.titulo || b.tema || "");
        return titA.localeCompare(titB, "pt-BR");
      });
    } else if (ordemAulas === "fav") {
      lista = lista.filter((a) => favoritos.has(audioIdOf(a)));
    }

    return lista;
  }, [aulasDoCapitulo, buscaAula, ordemAulas, favoritos]);

  const todasAulasDaArea = useMemo(() => {
    return temasDaArea.flatMap(([, lista]) => lista);
  }, [temasDaArea]);

  const aulasRecentes = useMemo(() => {
    return todasAulasDaArea
      .filter((a) => {
        const prog = mapaProgresso[a.id];
        return (
          prog &&
          ((prog.tempo && prog.tempo > 3) ||
            prog.concluida ||
            (prog.pct && prog.pct > 0) ||
            (prog.timestamp && prog.timestamp > 0))
        );
      })
      .sort((a, b) => {
        const tA = mapaProgresso[a.id]?.timestamp ?? 0;
        const tB = mapaProgresso[b.id]?.timestamp ?? 0;
        return tB - tA;
      });
  }, [todasAulasDaArea, mapaProgresso]);

  const metricasArea = useMemo(() => {
    const total = todasAulasDaArea.length;
    let concluidas = 0;
    let tempoTotalOuvidoSegundos = 0;
    let ultimaAulaOuvida: { aula: AulaAudio; prog: ProgressoAulaItem } | null = null;
    let maiorTimestamp = 0;

    for (const aula of todasAulasDaArea) {
      const prog = mapaProgresso[aula.id];
      if (prog) {
        if (prog.concluida) concluidas++;
        tempoTotalOuvidoSegundos += prog.tempo || 0;
        if (
          prog.timestamp &&
          prog.timestamp > maiorTimestamp &&
          !prog.concluida &&
          (prog.pct || 0) > 0
        ) {
          maiorTimestamp = prog.timestamp;
          ultimaAulaOuvida = { aula, prog };
        }
      }
    }

    const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    const tempoMinutos = Math.round(tempoTotalOuvidoSegundos / 60);

    return {
      total,
      concluidas,
      pct,
      tempoMinutos,
      ultimaAulaOuvida,
    };
  }, [todasAulasDaArea, mapaProgresso]);

  const contagemStatus = useMemo(() => {
    let concluidas = 0;
    let andamento = 0;
    let pendentes = 0;
    for (const a of aulasDoCapitulo) {
      const prog = mapaProgresso[a.id];
      if (prog?.concluida) concluidas++;
      else if ((prog?.pct ?? 0) > 0) andamento++;
      else pendentes++;
    }
    return { todas: aulasDoCapitulo.length, concluidas, andamento, pendentes };
  }, [aulasDoCapitulo, mapaProgresso]);

  const aulasFiltradas = useMemo(() => {
    if (filtroStatus === "todas") return aulasDoCapitulo;
    return aulasDoCapitulo.filter((a) => {
      const prog = mapaProgresso[a.id];
      const concluida = prog?.concluida ?? false;
      const pct = prog?.pct ?? 0;
      if (filtroStatus === "concluidas") return concluida;
      if (filtroStatus === "andamento") return !concluida && pct > 0;
      if (filtroStatus === "pendentes") return !concluida && pct === 0;
      return true;
    });
  }, [aulasDoCapitulo, filtroStatus, mapaProgresso]);

  const navegarCapitulo = useCallback(
    (dir: -1 | 1) => {
      if (capituloIdx < 0) return;
      const novoIdx = capituloIdx + dir;
      if (novoIdx >= 0 && novoIdx < listaCapitulosAtiva.length) {
        handleSelecionarCapitulo(listaCapitulosAtiva[novoIdx][0]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [capituloIdx, handleSelecionarCapitulo, listaCapitulosAtiva],
  );

  // Se estiver visualizando a área específica (ex: ECA ou Direito Constitucional)
  if (areaAtual) {
    if (temasDaArea.length === 0) {
      return (
        <div className="mx-auto w-full max-w-350 px-4 space-y-6 mt-4 lg:px-10 2xl:max-w-[1600px]">
          <p className="py-16 text-center text-sm text-muted-foreground bg-white/2 border border-white/5 rounded-2xl">
            Aulas em breve nesta área.
          </p>
        </div>
      );
    }

    return (
      <div className="relative mx-auto w-full max-w-350 px-4 space-y-3.5 sm:space-y-4 mt-1 sm:mt-2 lg:px-10 2xl:max-w-[1600px] pb-24">
        {/* Imagem Majestosa da Deusa Têmis Vazada no Fundo Central da Trilha */}
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden z-0 select-none">
          <img
            src="/images/gamificacao/deusa_temis_vazada.webp"
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-[320px] sm:w-[440px] md:w-[500px] max-w-[88vw] h-auto object-contain opacity-20 filter drop-shadow-[0_0_55px_rgba(234,179,8,0.28)] pointer-events-none"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            }}
          />
        </div>

        <div className="relative z-10 space-y-3 sm:space-y-4">
          {/* Painel Compacto de Produtividade da Disciplina (exibido apenas na lista de capítulos) */}
          {capituloSelecionado === null && metricasArea.total > 0 && (
            <div className="rounded-xl bg-white/4 border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-md shadow-md">
              <div className="flex items-center justify-between gap-2.5">
                {/* Indicador de progresso com ponto neon e contagem */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <span className="font-bold text-white text-[11px] sm:text-xs font-sans truncate">
                    {metricasArea.concluidas} de {metricasArea.total} aulas ouvidas
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium shrink-0">
                    • {metricasArea.tempoMinutos > 0 ? `${metricasArea.tempoMinutos} min` : "0 min"}
                  </span>
                </div>

                {/* Badge de porcentagem + Botão Continuar se houver */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span
                    className="text-[10px] sm:text-[11px] font-extrabold px-1.5 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: `${palette.primary}15`,
                      borderColor: `${palette.primary}30`,
                      color: palette.primary,
                    }}
                  >
                    {metricasArea.pct}%
                  </span>

                  {metricasArea.ultimaAulaOuvida && (
                    <button
                      onClick={() => {
                        haptic.impact("medium");
                        handleTocarAula(metricasArea.ultimaAulaOuvida!.aula);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[10px] sm:text-[11px] shadow-sm hover:scale-105 active:scale-95 transition-all"
                      title="Continuar última aula ouvida nesta disciplina"
                    >
                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current ml-0.5" />
                      <span>Continuar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Barra de progresso fina */}
              <div className="w-full bg-black/40 h-1 sm:h-1.5 rounded-full overflow-hidden border border-white/10 mt-1.5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${metricasArea.pct}%`,
                    background: `linear-gradient(90deg, ${palette.primary}, #10b981)`,
                    boxShadow: `0 0 6px ${palette.primary}60`,
                  }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {capituloSelecionado === null ? (
              /* ════════════ VISTA 1: LISTA DE CAPÍTULOS ════════════ */
              <motion.div
                key="vista-capitulos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Menu de Transição: Matérias e Peças Práticas */}
                {temPecasPraticas && (
                  <div className="flex items-center justify-start pb-1">
                    <div className="inline-flex p-1.5 rounded-2xl bg-white/4 border border-white/10 backdrop-blur-md shadow-xl shadow-black/40 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setSubAba("materias");
                        }}
                        className={`relative px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 select-none active:scale-95 ${
                          subAbaEfetiva === "materias"
                            ? "text-white shadow-md"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/3"
                        }`}
                      >
                        {subAbaEfetiva === "materias" && (
                          <motion.div
                            layoutId="audioaulas-subaba-indicator"
                            className="absolute inset-0 rounded-xl bg-linear-to-r from-red-600 to-rose-600 shadow-lg shadow-rose-900/40"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 shrink-0" />
                          <span>Matérias</span>
                          <span
                            className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-black ${
                              subAbaEfetiva === "materias"
                                ? "bg-black/30 text-white"
                                : "bg-white/10 text-zinc-400"
                            }`}
                          >
                            {materias.length}
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setSubAba("pecas");
                        }}
                        className={`relative px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 select-none active:scale-95 ${
                          subAbaEfetiva === "pecas"
                            ? "text-white shadow-md"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/3"
                        }`}
                      >
                        {subAbaEfetiva === "pecas" && (
                          <motion.div
                            layoutId="audioaulas-subaba-indicator"
                            className="absolute inset-0 rounded-xl bg-linear-to-r from-red-600 to-rose-600 shadow-lg shadow-rose-900/40"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span>Peças Práticas</span>
                          <span
                            className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-black ${
                              subAbaEfetiva === "pecas"
                                ? "bg-black/30 text-white"
                                : "bg-white/10 text-zinc-400"
                            }`}
                          >
                            {pecasPraticas.length}
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-display text-foreground text-[17px] sm:text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
                      <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
                      <span className="break-words">
                        {modoVisualizacao === "recentes"
                          ? "Aulas Recentes"
                          : subAbaEfetiva === "pecas"
                            ? "Peças Práticas"
                            : "Capítulos & Títulos"}
                      </span>
                    </h3>
                    <p className="font-body text-muted-foreground text-[12px] sm:text-[12.5px] leading-snug ml-3 break-words">
                      {modoVisualizacao === "recentes"
                        ? `Aulas que você ouviu recentemente em ${areaAtual || "nesta disciplina"}`
                        : subAbaEfetiva === "pecas"
                          ? `${pecasPraticas.length} ${pecasPraticas.length === 1 ? "peça prática catalogada com aulas narradas" : "peças práticas catalogadas com aulas narradas"} (${totalAulasPecas} aulas)`
                          : `${materias.length} ${materias.length === 1 ? "capítulo catalogado com aulas narradas" : "capítulos catalogados com aulas narradas"} (${totalAulasMaterias} aulas)`}
                    </p>
                  </div>

                  {/* Alternador de Modo de Visualização: Trilha vs Grade vs Recentes */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setModoVisualizacao("trilha");
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition",
                        modoVisualizacao === "trilha"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-zinc-400 hover:text-white",
                      )}
                      title="Visualizar em Trilha Serpenteante"
                    >
                      <Route className="w-3.5 h-3.5" />
                      <span>Trilha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setModoVisualizacao("lista");
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition",
                        modoVisualizacao === "lista"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-zinc-400 hover:text-white",
                      )}
                      title="Visualizar em Grade Tradicional"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Grade</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setModoVisualizacao("recentes");
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition",
                        modoVisualizacao === "recentes"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-zinc-400 hover:text-white",
                      )}
                      title="Visualizar Aulas Ouvidas Recentemente"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Recentes</span>
                    </button>
                  </div>
                </div>

                {/* Conteúdo: Trilha em Zigue-Zague, Grade de Capítulos ou Recentes */}
                {modoVisualizacao === "trilha" ? (
                  <TrilhaZigueZagueCapitulos
                    capitulos={listaCapitulosAtiva}
                    atualId={atualId}
                    coverUrl={coverUrl}
                    palette={palette}
                    subAbaEfetiva={subAbaEfetiva}
                    onSelectCapitulo={handleSelecionarCapitulo}
                    mapaProgresso={mapaProgresso}
                  />
                ) : modoVisualizacao === "lista" ? (
                  /* Grid de Capítulos Tradicional */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {listaCapitulosAtiva.map(([tema, lista], i) => {
                      const contemAulaTocando = lista.some((a) => a.id === atualId);
                      const { tituloLimpo, faixaArtigos } = decomporTituloCapitulo(tema);
                      return (
                        <motion.button
                          key={tema}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => handleSelecionarCapitulo(tema)}
                          className={`group relative flex items-center justify-between gap-3 p-4 rounded-2xl text-left border transition-all duration-200 ${
                            contemAulaTocando
                              ? "bg-primary/15 border-primary/40 shadow-lg shadow-primary/15"
                              : "bg-white/3 hover:bg-white/6 border-white/10 hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <span
                              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold shadow-md ${
                                contemAulaTocando
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-white/5 text-zinc-300 border border-white/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                              }`}
                            >
                              {i + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm sm:text-[15px] font-sans! font-normal text-white leading-snug break-words group-hover:text-primary transition-colors tracking-normal normal-case">
                                {tituloLimpo}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {subAbaEfetiva === "pecas" && (
                                  <span className="inline-flex items-center text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md">
                                    Peça Prática
                                  </span>
                                )}
                                {faixaArtigos && (
                                  <span className="inline-flex items-center text-[11px] font-semibold text-zinc-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                                    {faixaArtigos}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                                  <Headphones className="w-3 h-3 text-primary" />
                                  {lista.length} {lista.length === 1 ? "aula" : "aulas"}
                                </span>

                                {contemAulaTocando && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 animate-pulse">
                                    <Sparkles className="w-2.5 h-2.5" /> Tocando agora
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="w-8 h-8 shrink-0 rounded-full bg-white/5 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-zinc-400 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  /* ── VISTA DE AULAS RECENTES ── */
                  <div className="space-y-3">
                    {aulasRecentes.length === 0 ? (
                      <div className="py-14 px-6 text-center rounded-2xl bg-white/3 border border-white/10 flex flex-col items-center justify-center space-y-3 shadow-lg">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shadow-inner">
                          <Clock className="w-7 h-7 text-primary/80" />
                        </div>
                        <h4 className="text-zinc-100 font-sans font-normal text-base">
                          Nenhuma aula ouvida recentemente nesta disciplina
                        </h4>
                        <p className="text-zinc-400 text-xs sm:text-sm max-w-md leading-relaxed">
                          Conforme você reproduzir ou concluir aulas em {areaAtual}, elas serão
                          salvas automaticamente aqui para você retomar rapidamente de onde parou.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setModoVisualizacao("trilha");
                          }}
                          className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-110 transition shadow-md shadow-primary/20"
                        >
                          Explorar Aulas na Trilha
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs text-zinc-400 font-medium">
                            {aulasRecentes.length}{" "}
                            {aulasRecentes.length === 1
                              ? "aula ouvida recentemente"
                              : "aulas ouvidas recentemente"}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Ordenadas pelas mais recentes
                          </span>
                        </div>
                        <div className="bg-white/2 border border-white/5 rounded-2xl p-2 sm:p-3 divide-y divide-white/6">
                          {aulasRecentes.map((a) => {
                            const prog = mapaProgresso[a.id];
                            return (
                              <LinhaAula
                                key={a.id}
                                a={a}
                                atualId={atualId}
                                tocando={tocando}
                                favoritos={favoritos}
                                concluida={prog?.concluida}
                                pct={prog?.pct}
                                alternarFavorito={alternarFavorito}
                                handleTocarAula={handleTocarAula}
                                isLocked={false}
                                onOpenGate={() => setShowPremiumGate(true)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* ════════════ VISTA 2: AULAS DO CAPÍTULO SELECIONADO (ESTILO RESUMOS JURÍDICOS) ════════════ */
              <motion.div
                key="vista-aulas-resumos"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Header Sticky idêntico aos Resumos Jurídicos */}
                <div className="sticky top-0 z-20 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10 shadow-sm pb-3 -mx-4 px-4 sm:-mx-10 sm:px-10">
                  <PageHeader
                    title={
                      capituloSelecionado
                        ? decomporTituloCapitulo(capituloSelecionado).tituloLimpo || capituloSelecionado
                        : ""
                    }
                    subtitle={areaAtual?.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "") || "Audioaulas"}
                    onBack={() => {
                      haptic.light();
                      setCapituloSelecionado(null);
                    }}
                    className="border-b-0 pb-1"
                  />

                  <div className="max-w-5xl mx-auto px-1 sm:px-4 mt-2 space-y-3">
                    {/* Barra de Pesquisa */}
                    <div className="relative flex items-center group">
                      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        value={buscaAula}
                        onChange={(e) => setBuscaAula(e.target.value)}
                        placeholder={placeholderAula}
                        className="pl-12 pr-12 h-14 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 focus:border-primary/50 text-[15px] font-medium text-white placeholder:text-zinc-400 shadow-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          toast.info("Em breve: Pesquisa por Voz");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:opacity-70 transition-all text-white/70 hover:text-white"
                        title="Pesquisar por voz"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Abas 3D de Pastas: CRONOLÓGICA | ALFABÉTICA | FAVORITOS */}
                    <div className="flex w-full relative px-1 sm:px-2 h-11 sm:h-12 mt-3 items-end">
                      {([
                        { id: "crono", label: "Cronológica" },
                        { id: "alpha", label: "Alfabética" },
                        { id: "fav", label: "Favoritos" },
                      ] as const).map((o, index) => {
                        const ativo = ordemAulas === o.id;
                        const zIndex = ativo ? 30 : 20 - index;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              haptic.selection();
                              setOrdemAulas(o.id);
                            }}
                            className={cn(
                              "relative flex-1 flex justify-center items-center rounded-t-2xl transition-all duration-300 ease-out border-x border-t border-white/5 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider",
                              ativo
                                ? "h-full bg-[#1A1A1A] text-white shadow-[0_-8px_20px_rgba(0,0,0,0.5)]"
                                : "h-[75%] bg-[#0A0A0A] text-muted-foreground hover:bg-[#121212] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.8)] hover:text-white",
                            )}
                            style={{
                              zIndex,
                              marginLeft: index > 0 ? "-12px" : "0",
                            }}
                          >
                            <div className="absolute inset-0 rounded-t-2xl overflow-hidden pointer-events-none">
                              {ativo && (
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-50" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "relative z-10 transition-transform duration-300",
                                ativo ? "scale-105" : "scale-100",
                              )}
                              style={{ color: ativo ? palette.primary : undefined }}
                            >
                              {o.label}
                            </span>
                            {ativo && (
                              <motion.div
                                layoutId="activeFolderTabAudioaulas"
                                className="absolute inset-0 rounded-t-2xl border-x border-t pointer-events-none"
                                style={{
                                  borderColor: `${palette.primary}80`,
                                  boxShadow: `inset 0 2px 10px ${palette.primary}26`,
                                }}
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div
                      className="w-full h-px bg-[#1A1A1A] relative z-20"
                      style={{ boxShadow: `0 -1px 0 ${palette.primary}4D` }}
                    />
                  </div>
                </div>

                {/* Conteúdo: Lista de Aulas estilo Resumos com Nós Numerados */}
                <div className="max-w-5xl mx-auto px-1 sm:px-4 pt-2">
                  {isShimmering ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/2 border border-white/5 animate-pulse"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                          <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/4">
                            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="h-4 bg-white/10 rounded w-3/4" />
                              <div className="h-3 bg-white/5 rounded w-1/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : aulasProcessadas.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                      <Headphones className="w-10 h-10 opacity-20 mb-3" />
                      <p className="font-semibold text-lg mb-2">
                        {ordemAulas === "fav" ? "Nenhuma aula favoritada neste tema" : "Nenhuma aula encontrada"}
                      </p>
                      {buscaAula && (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setBuscaAula("");
                          }}
                          className="mt-3 px-6 py-2.5 rounded-xl text-white font-bold text-sm active:opacity-70 transition-all shadow-md"
                          style={{
                            backgroundColor: palette.primary,
                            boxShadow: `0 4px 14px ${palette.primary}4D`,
                          }}
                        >
                          Limpar Pesquisa
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative py-4 sm:py-6 w-full min-w-0 max-w-full overflow-hidden">
                      <div className="relative space-y-4 ml-1 sm:ml-4 pb-12 z-[2]">
                        <AnimatePresence mode="popLayout">
                          {aulasProcessadas.map((a, i) => {
                            const numero = String(
                              ordemAulas === "crono"
                                ? i + 1
                                : aulasDoCapitulo.findIndex((item) => item.id === a.id) + 1,
                            ).padStart(2, "0");
                            const isFav = favoritos.has(audioIdOf(a));
                            const isTocando = atualId === a.id && tocando;
                            const prog = mapaProgresso[a.id];
                            const concluida = prog?.concluida ?? false;
                            const pct = prog?.pct ?? 0;

                            return (
                              <motion.div
                                layout
                                key={a.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2.5 sm:gap-4"
                              >
                                {/* Nó da Linha do Tempo */}
                                <div
                                  className={cn(
                                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all shadow-md",
                                    isTocando
                                      ? "bg-primary/20 text-primary border-primary shadow-primary/20"
                                      : isFav
                                      ? "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]"
                                      : concluida
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/60"
                                      : "bg-card text-muted-foreground border-border/80",
                                  )}
                                >
                                  {isTocando ? (
                                    <EqualizadorAnimado cor={palette.primary} />
                                  ) : (
                                    <span>{numero}</span>
                                  )}
                                </div>

                                {/* Card da Aula — Altura padronizada única para todos os itens */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    haptic.selection();
                                    handleTocarAula(a);
                                  }}
                                  className={cn(
                                    "relative h-[82px] sm:h-[88px] overflow-hidden flex-1 min-w-0 flex items-center gap-3 sm:gap-4 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border transition-all text-left group shadow-sm active:scale-[0.99] cursor-pointer select-none",
                                    isTocando
                                      ? "border-primary/60 bg-primary/[0.08] shadow-md shadow-primary/10"
                                      : isFav
                                      ? "bg-card shadow-sm border-rose-500/30"
                                      : "border-border/50 bg-card/40 hover:bg-card/60",
                                  )}
                                  style={{
                                    borderColor: isTocando
                                      ? palette.primary
                                      : isFav
                                      ? `${palette.primary}99`
                                      : undefined,
                                  }}
                                >
                                  <div
                                    className="absolute inset-y-0 left-0 w-1 opacity-20 group-hover:opacity-100 transition-opacity"
                                    style={{
                                      background: `linear-gradient(to bottom, ${palette.primary}, transparent)`,
                                    }}
                                  />

                                  {/* Círculo do Ícone */}
                                  <div className="flex flex-col items-center justify-center gap-2 shrink-0 w-[48px] sm:w-[56px] pl-0.5">
                                    <div
                                      className={cn(
                                        "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border overflow-hidden shadow-inner shrink-0 transition-colors",
                                        isTocando
                                          ? "bg-primary/20 border-primary text-primary"
                                          : "bg-white/5 border-white/10 text-white/80 group-hover:text-white",
                                      )}
                                    >
                                      {isTocando ? (
                                        <Headphones className="w-5 h-5 text-primary animate-pulse" />
                                      ) : (
                                        <FileText
                                          className="w-5 h-5 transition-colors select-none"
                                          strokeWidth={1.8}
                                          aria-hidden="true"
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Informações da Aula */}
                                  <div className="min-w-0 flex-1 flex flex-col justify-center h-full pr-1 sm:pr-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3
                                        className={cn(
                                          "text-sm sm:text-base font-medium font-sans break-words leading-snug line-clamp-2 transition-colors",
                                          isTocando ? "text-primary font-semibold" : "text-foreground",
                                        )}
                                      >
                                        {formatarTituloAula(a.titulo) || a.titulo}
                                      </h3>

                                      {/* Badge Concluída / Em Andamento */}
                                      {concluida && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                                          <Check className="w-2.5 h-2.5" />
                                          OUVIDA
                                        </span>
                                      )}
                                      {!concluida && pct > 0 && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 shrink-0">
                                          {pct}%
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Ações: Favorito + Chevron */}
                                  <div className="flex flex-col items-end gap-2 shrink-0 pr-1">
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        haptic.selection();
                                        alternarFavorito(a);
                                      }}
                                      className="p-1 -mr-1 rounded-full hover:bg-secondary/50 active:opacity-70 transition-transform"
                                      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                    >
                                      {isFav ? (
                                        <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                                      ) : (
                                        <Heart className="w-5 h-5 text-muted-foreground/50 hover:text-white" />
                                      )}
                                    </div>

                                    <ChevronRight
                                      className="w-4 h-4 text-muted-foreground/40 transition-transform duration-300 group-hover:translate-x-0.5"
                                      style={{ color: palette.primary }}
                                    />
                                  </div>
                                </button>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>

                      {/* Navegação entre Capítulos no Rodapé */}
                      <div className="flex items-center justify-between gap-3 pt-6 max-w-3xl lg:max-w-4xl mx-auto">
                        <button
                          disabled={capituloIdx <= 0}
                          onClick={() => navegarCapitulo(-1)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>{subAbaEfetiva === "pecas" ? "Peça Anterior" : "Capítulo Anterior"}</span>
                        </button>

                        <button
                          disabled={capituloIdx >= listaCapitulosAtiva.length - 1}
                          onClick={() => navegarCapitulo(1)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                        >
                          <span>{subAbaEfetiva === "pecas" ? "Próxima Peça" : "Próximo Capítulo"}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <PremiumGate
          open={showPremiumGate}
          onClose={() => setShowPremiumGate(false)}
          feature="audioaula"
          usageLabel="As 2 primeiras audioaulas desta lei são gratuitas. Assine o Prime para ouvir todos os episódios!"
        />
      </div>
    );
  }

  // Se for abas extras (favoritas, baixadas, buscar)
  return (
    <div className="mx-auto w-full max-w-350 px-4 space-y-4 mt-4 lg:px-10 2xl:max-w-[1600px] pb-24">
      <h2 className="text-lg font-bold text-white">
        {aba === "favoritas"
          ? "Favoritas"
          : aba === "baixadas"
            ? "Baixadas"
            : "Resultados da Busca"}
      </h2>

      {isAbaShimmering ? (
        <div className="rounded-2xl bg-white/2 border border-white/5 p-3 space-y-2">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="flex items-center gap-3.5 p-3 rounded-xl bg-white/2 border border-white/4 animate-pulse"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
            </div>
          ))}
        </div>
      ) : listaAba.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground bg-white/2 border border-white/5 rounded-2xl">
          {aba === "favoritas"
            ? "Nenhuma favorita ainda. Toque no coração de uma aula para adicionar."
            : aba === "baixadas"
              ? "Nenhuma aula baixada. Toque no ícone de download para ouvir offline."
              : busca.trim()
                ? "Nada encontrado para sua busca."
                : "Digite o nome de uma aula, tema ou área."}
        </p>
      ) : (
        <motion.div
          className="rounded-2xl bg-white/2 border border-white/5 p-2 divide-y divide-white/6 lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-2 2xl:grid-cols-3"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
          }}
          initial="hidden"
          animate="show"
        >
          {listaAba.map((a, index) => {
            const isLocked = false;
            const prog = mapaProgresso[a.id];
            return (
              <LinhaAula
                key={a.id}
                a={a}
                atualId={atualId}
                tocando={tocando}
                favoritos={favoritos}
                concluida={prog?.concluida}
                pct={prog?.pct}
                alternarFavorito={alternarFavorito}
                handleTocarAula={handleTocarAula}
                isLocked={isLocked}
                onOpenGate={() => setShowPremiumGate(true)}
              />
            );
          })}
        </motion.div>
      )}

      <PremiumGate
        open={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="audioaula"
        usageLabel="As 2 primeiras audioaulas desta lei são gratuitas. Assine o Prime para ouvir todos os episódios!"
      />
    </div>
  );
});
