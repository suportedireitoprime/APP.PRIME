import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, Scale, BookOpen, Copy, Check } from "lucide-react";
import brasaoImg from "@/assets/brasao-republica.webp";
import { haptic } from "@/lib/nativeHaptics";
import { copiarTexto } from "@/lib/nativo/copiar";
import type { ArtigoLei } from "@/data/mockData";

interface AudioleiArtigoVadeMecumSheetProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: ArtigoLei | null;
  artigoNumero: string;
  leiNome: string;
  leiSigla: string;
  capituloNome?: string;
  fallbackText?: string;
}

const normalizeArtigoLabel = (value: string) =>
  value
    .replace(/°/g, "º")
    .replace(/^Art\.\s*(\d+)o\b/i, "Art. $1º")
    .replace(/^Art\.\s*(\d+)-([A-Z])\b/i, (_, numero, sufixo) => {
      const num = Number(numero);
      return num >= 1 && num <= 9
        ? `Art. ${num}º-${String(sufixo).toUpperCase()}`
        : `Art. ${num}-${String(sufixo).toUpperCase()}`;
    })
    .replace(/^Art\.\s*([1-9])$/i, "Art. $1º");

export const AudioleiArtigoVadeMecumSheet: React.FC<AudioleiArtigoVadeMecumSheetProps> = ({
  isOpen,
  onClose,
  artigo,
  artigoNumero,
  leiNome,
  leiSigla,
  capituloNome,
  fallbackText,
}) => {
  const [fontSize, setFontSize] = useState<number>(16);
  const [copiado, setCopiado] = useState(false);

  // Divide o texto completo do artigo em linhas estruturadas
  const rawText = useMemo(() => {
    if (artigo?.caput) return artigo.caput;
    return fallbackText || "Dispositivo legal não carregado.";
  }, [artigo, fallbackText]);

  const lines = useMemo(() => {
    return rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }, [rawText]);

  const numLabel = useMemo(() => {
    const raw = artigo?.numero || artigoNumero;
    const clean = raw.replace(/^Art(?:igo|\.)?\s*/i, "").trim();
    return normalizeArtigoLabel(clean ? `Art. ${clean}` : "Artigo");
  }, [artigo, artigoNumero]);

  const handleCopy = () => {
    haptic.selection();
    const textoCompleto = `${numLabel} — ${leiSigla} (${leiNome})\n\n${rawText}`;
    copiarTexto(textoCompleto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop com fade escurecido */}
      <div
        onClick={() => {
          haptic.selection();
          onClose();
        }}
        aria-hidden
        className="fixed inset-0 z-[240] bg-black/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Sheet deslizante de baixo para cima no design puro do Vade Mecum */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Leitura do ${numLabel}`}
        className="fixed inset-x-0 bottom-0 z-[250] h-[92vh] sm:h-[88vh] max-h-[920px] max-w-3xl mx-auto bg-[#0d0f12] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-3xl shadow-2xl shadow-black flex flex-col overflow-hidden outline-none animate-in slide-in-from-bottom duration-300 ease-out"
      >
        {/* Puxador tátil (Drag Indicator) */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Topo do Modal: Brasão da República, Identificação da Lei e Ações */}
        <div className="px-5 sm:px-7 pt-2 pb-3.5 border-b border-white/10 shrink-0 bg-zinc-950/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={brasaoImg}
              alt="Brasão da República"
              className="w-8 h-8 object-contain shrink-0 drop-shadow-sm opacity-90"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                  {leiSigla}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-md">
                  • {leiNome}
                </span>
              </div>
              {capituloNome && (
                <p className="text-[11px] text-zinc-500 font-medium truncate">
                  {capituloNome}
                </p>
              )}
            </div>
          </div>

          {/* Controles de Tamanho de Fonte, Copiar e Fechar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFontSize((prev) => Math.max(13, prev - 1));
              }}
              aria-label="Diminuir tamanho da fonte"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition"
              title="Diminuir fonte"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFontSize((prev) => Math.min(24, prev + 1));
              }}
              aria-label="Aumentar tamanho da fonte"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition"
              title="Aumentar fonte"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copiar texto do artigo"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition ml-0.5"
              title="Copiar artigo"
            >
              {copiado ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              aria-label="Fechar artigo"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Corpo do Artigo — Design Vade Mecum Autêntico e Puro */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 select-text space-y-4">
          {/* Badge Central do Artigo */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3.5 py-1 rounded-xl bg-gradient-to-r from-primary/25 via-primary/15 to-transparent border border-primary/40 text-primary font-heading font-black text-base sm:text-lg tracking-wide shadow-sm shadow-primary/10">
              {numLabel}
            </span>

            {artigo?.nomen_juris && (
              <span className="text-xs sm:text-sm font-semibold italic text-amber-300/90 truncate">
                ({artigo.nomen_juris})
              </span>
            )}
          </div>

          {/* Texto dos Dispositivos (Caput, Parágrafos, Incisos, Alíneas) */}
          <div
            className="space-y-3 leading-relaxed font-sans text-zinc-100 antialiased"
            style={{ fontSize: `${fontSize}px` }}
          >
            {lines.map((line, idx) => {
              // Verifica o tipo de dispositivo para aplicar recuo visual do Vade Mecum
              const isParagrafo = /^(§|Parágrafo\s+único)/i.test(line);
              const isInciso = /^([IVXLCDM]+)\s*[-–—.]/i.test(line);
              const isAlinea = /^([a-z])\)\s*/i.test(line);
              const isItem = /^[0-9]+\.\s*/i.test(line);

              // Identifica anotações de redação Planalto: "(Redação dada pela Lei...)"
              const hasPlanaltoAnnotation = /\((?:Redação|Incluído|Acrescido|Alterado|Revogado|Vide)[^)]*\)/i.test(line);

              return (
                <p
                  key={idx}
                  className={`transition-colors leading-relaxed ${
                    isAlinea || isItem
                      ? "pl-8 sm:pl-10 text-zinc-300"
                      : isInciso
                        ? "pl-5 sm:pl-7 text-zinc-200"
                        : isParagrafo
                          ? "pl-3 sm:pl-4 text-zinc-100 font-normal"
                          : "text-zinc-100 font-normal"
                  }`}
                >
                  {/* Destaque sutil para numeração dos incisos ou parágrafos */}
                  {isParagrafo ? (
                    <span className="font-semibold text-primary/90 mr-1.5">
                      {line.slice(0, line.indexOf(" ") > 0 ? line.indexOf(" ") + 1 : 4)}
                    </span>
                  ) : null}

                  {isParagrafo
                    ? line.slice(line.indexOf(" ") > 0 ? line.indexOf(" ") + 1 : 4)
                    : line}
                </p>
              );
            })}
          </div>

          {/* Rodapé Informativo da Legislação */}
          <div className="pt-8 pb-4 text-center border-t border-white/10 mt-8 space-y-1 text-zinc-500 text-[11px]">
            <p className="font-semibold text-zinc-400">
              {leiNome} — Texto Oficial Consolidado
            </p>
            <p>Fonte: Legislação Federal Brasileira / Planalto</p>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};
