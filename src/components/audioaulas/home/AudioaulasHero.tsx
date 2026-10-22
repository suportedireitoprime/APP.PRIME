import React from "react";
import { ArrowLeft, Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CAPA_HUB, capaDaArea } from "@/lib/audioaulasHelper";
import { CapaOtimizada } from "./CapaOtimizada";
import CassetteAnimation from "./CassetteAnimation";

interface AudioaulasHeroProps {
  areaAtual: string | null;
  loading: boolean;
  totalAulas: number;
  onVoltar?: () => void;
  subtituloCustom?: string;
  tituloCustom?: string;
  unidadeCustom?: string;
}

export const AudioaulasHero = React.memo(function AudioaulasHero({
  areaAtual,
  loading,
  totalAulas,
  onVoltar,
  subtituloCustom,
  tituloCustom,
  unidadeCustom,
}: AudioaulasHeroProps) {
  const navigate = useNavigate();
  const isEca = areaAtual && /eca|criança|adolescente/i.test(areaAtual);
  const heroTitulo =
    tituloCustom ||
    (isEca
      ? "ECA"
      : areaAtual
        ? areaAtual.replace(/^Direitos?\s+(do\s+)?/i, "").trim()
        : "Audioaulas");

  const heroSub =
    subtituloCustom ||
    (isEca
      ? "Estatuto da Criança e do Adolescente • Lei nº 8.069/1990"
      : areaAtual
        ? "Aulas em áudio para ouvir e revisar."
        : "Aprenda ouvindo, por área do Direito.");

  const capaImg = areaAtual ? capaDaArea(areaAtual) : CAPA_HUB;

  const handleVoltar = () => {
    if (onVoltar) {
      onVoltar();
    } else if (areaAtual) {
      navigate("/audioaulas");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="relative px-4 pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-5 overflow-visible sm:px-6 lg:px-10 lg:pt-[calc(2.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pb-8">
      <div className="mx-auto w-full max-w-350 2xl:max-w-[1600px] relative z-10">
        <button
          onClick={handleVoltar}
          aria-label="Voltar"
          className="mb-5 w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition shrink-0 active:scale-95 z-10 relative"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>

        <div className="flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
          <div className="flex items-center gap-3.5 sm:gap-5 lg:gap-8 min-w-0 flex-1">
            <span className="relative h-20 w-20 sm:h-28 sm:w-28 lg:h-36 lg:w-36 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10 bg-[#1c1c1c]">
              {!areaAtual ? (
                <CassetteAnimation />
              ) : (
                <CapaOtimizada src={capaImg} alt="" animacaoEntrada />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-3xl lg:text-5xl font-black tracking-wide sm:tracking-widest uppercase leading-tight text-white drop-shadow-md wrap-break-word">
                {heroTitulo}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 sm:mt-2 font-medium wrap-break-word">
                {heroSub}
              </p>
            </div>
          </div>

          {/* Gráfico Redondo Interativo com Total de Aulas (ampliado para máxima visibilidade) */}
          {!loading && totalAulas > 0 && (
            <div className="shrink-0 flex flex-col items-center justify-center pl-1 sm:pl-3">
              <div
                className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 flex items-center justify-center rounded-full bg-black/50 border border-white/15 shadow-2xl shadow-black/80 group hover:border-primary/60 hover:scale-105 transition-all duration-300 ring-1 ring-white/10"
                title={`${totalAulas.toLocaleString("pt-BR")} ${unidadeCustom || "aulas"} disponíveis no total`}
              >
                {/* SVG Donut Ring com gradiente neon */}
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                  viewBox="0 0 100 100"
                >
                  <defs>
                    <linearGradient id="heroGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                  </defs>
                  {/* Trilha de fundo */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Arco com gradiente e glow */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#heroGaugeGrad)"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="45"
                    strokeLinecap="round"
                    fill="none"
                    style={{
                      filter: "drop-shadow(0 0 8px rgba(239, 68, 68, 0.65))",
                    }}
                  />
                </svg>

                {/* Conteúdo Central */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-1">
                  <span className="text-base sm:text-xl lg:text-2xl font-black text-white leading-none tracking-tight drop-shadow-sm font-sans">
                    {totalAulas.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-[10px] sm:text-[11px] lg:text-xs font-extrabold text-zinc-300 uppercase tracking-widest leading-none mt-1">
                    {unidadeCustom || (totalAulas === 1 ? "aula" : "aulas")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
