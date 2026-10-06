import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";
import { ExercicioSlideFeedback } from "./ExercicioSlideFeedback";

interface ExercicioForcaProps {
  ex: {
    artigo: string | number;
    enunciado: string;
    palavra_oculta: string;
    dica?: string;
    explicacao?: string;
  };
  artigoTexto: string;
  onResultado: (certo: boolean) => void;
}

const ROSE_BTN =
  "bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-600/25";
const ENUN =
  "text-[1.05rem] sm:text-xl md:text-2xl font-normal normal-case tracking-normal leading-[1.65] text-white/95 mb-6 [text-wrap:pretty]";
const ART_LABEL = "text-[11px] font-extrabold tracking-wider text-pink-300/90 uppercase mb-2";
const MAX_ERRORS = 5;

const QWERTY = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function ExercicioForca({ ex, artigoTexto, onResultado }: ExercicioForcaProps) {
  const [letrasUsadas, setLetrasUsadas] = useState<Set<string>>(new Set());
  const [resp, setResp] = useState<boolean | null>(null);

  const palavra = useMemo(() => (ex.palavra_oculta || "").toUpperCase(), [ex.palavra_oculta]);
  const palavraSemAcento = useMemo(() => removeAccents(palavra), [palavra]);

  const letrasCorretas = useMemo(() => {
    return new Set(palavraSemAcento.split("").filter((l) => /[A-Z]/.test(l)));
  }, [palavraSemAcento]);

  const erros = useMemo(() => {
    let count = 0;
    letrasUsadas.forEach((l) => {
      if (!letrasCorretas.has(l)) count++;
    });
    return count;
  }, [letrasUsadas, letrasCorretas]);

  const acertouTudo = useMemo(() => {
    for (const l of letrasCorretas) {
      if (!letrasUsadas.has(l)) return false;
    }
    return true;
  }, [letrasCorretas, letrasUsadas]);

  useEffect(() => {
    if (resp !== null) return;
    if (erros >= MAX_ERRORS) {
      haptic.error();
      setResp(false);
    } else if (acertouTudo && letrasCorretas.size > 0) {
      haptic.success();
      setResp(true);
    }
  }, [erros, acertouTudo, resp, letrasCorretas]);

  const handleLetra = (letra: string) => {
    if (resp !== null || letrasUsadas.has(letra)) return;
    haptic.selection();
    setLetrasUsadas((prev) => new Set(prev).add(letra));
  };

  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo} - JOGO DA FORCA</div>
      <h2 className={ENUN}>{ex.enunciado}</h2>
      
      {ex.dica && (
        <div className="text-sm font-medium text-pink-300 mb-6 bg-pink-500/10 p-3 rounded-xl border border-pink-500/20">
          💡 Dica: {ex.dica}
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Tentativas</span>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_ERRORS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  i < erros ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 py-6 bg-black/20 rounded-2xl border border-white/5">
          {palavra.split("").map((letra, i) => {
            const isLetter = /[A-ZÀ-Ú]/.test(letra);
            const lSemAcento = removeAccents(letra);
            const revelada = resp !== null || letrasUsadas.has(lSemAcento);
            
            if (!isLetter) {
              return (
                <span key={i} className="text-2xl font-bold text-white/40 self-end pb-1 mx-1">
                  {letra}
                </span>
              );
            }

            return (
              <div
                key={i}
                className={cn(
                  "w-8 h-10 sm:w-10 sm:h-12 border-b-2 flex items-center justify-center text-2xl sm:text-3xl font-bold transition-all",
                  revelada ? "border-emerald-400 text-white" : "border-white/20 text-transparent",
                  resp === false && !letrasUsadas.has(lSemAcento) ? "border-rose-400 text-rose-400" : ""
                )}
              >
                {revelada || resp === false ? letra : ""}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 max-w-[400px] mx-auto">
        {QWERTY.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5 sm:gap-2">
            {row.map((letra) => {
              const usada = letrasUsadas.has(letra);
              const correta = usada && letrasCorretas.has(letra);
              const errada = usada && !letrasCorretas.has(letra);

              return (
                <button
                  key={letra}
                  onClick={() => handleLetra(letra)}
                  disabled={usada || resp !== null}
                  className={cn(
                    "h-10 w-8 sm:h-12 sm:w-10 rounded-lg font-bold text-sm sm:text-base transition-all active:scale-95 touch-manipulation",
                    !usada && "bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-sm",
                    correta && "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
                    errada && "bg-rose-500/10 text-rose-500/50 border-rose-500/20 opacity-50"
                  )}
                >
                  {letra}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <ExercicioSlideFeedback
        resp={resp}
        artigo={ex.artigo}
        artigoTexto={artigoTexto}
        explicacao={ex.explicacao}
        grifos={[palavra]}
        onContinuar={() => onResultado(resp!)}
      />
    </div>
  );
}
