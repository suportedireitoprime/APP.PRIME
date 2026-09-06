import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";
import { ExercicioSlideFeedback } from "./ExercicioSlideFeedback";

interface ExercicioMultiplaEscolhaProps {
  ex: {
    artigo: string | number;
    enunciado: string;
    alternativas: string[];
    correta: number;
    explicacao?: string;
    frase_correta?: string;
    texto_correto?: string;
  };
  artigoTexto: string;
  onResultado: (certo: boolean) => void;
}

const ROSE_BTN =
  "bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-600/25";
const ENUN =
  "text-[1.05rem] sm:text-xl md:text-2xl font-normal normal-case tracking-normal leading-[1.65] text-white/95 mb-6 [text-wrap:pretty]";
const ART_LABEL = "text-[11px] font-extrabold tracking-wider text-pink-300/90 uppercase mb-2";

function enunciadoComArtigo(enun: string, artigo: string | number): string {
  const s = String(enun ?? "").trim();
  if (!s) return `Segundo o art. ${artigo}, complete corretamente:`;
  if (/\bart(?:igo|\.)\s*\d/i.test(s)) return s;
  if (/^(segundo|de acordo|conforme)\b/i.test(s)) return s;
  const head = `Segundo o art. ${artigo}, `;
  return head + s.charAt(0).toLowerCase() + s.slice(1);
}

export function ExercicioMultiplaEscolha({
  ex,
  artigoTexto,
  onResultado,
}: ExercicioMultiplaEscolhaProps) {
  const [sel, setSel] = useState<number | null>(null);
  const [resp, setResp] = useState<boolean | null>(null);

  const enun = enunciadoComArtigo(ex.enunciado, ex.artigo);
  const grifos = [String(ex.alternativas?.[ex.correta] ?? "")];

  const handleVerificar = () => {
    if (sel === null) return;
    const certo = sel === ex.correta;
    if (certo) {
      haptic.success();
    } else {
      haptic.error();
    }
    setResp(certo);
  };

  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo}</div>
      <h2 className={ENUN}>{enun}</h2>

      <div className="space-y-2.5">
        {ex.alternativas.map((alt: string, i: number) => {
          const isCorrect = i === ex.correta;
          const isSel = sel === i;
          let cls = "border-white/10 bg-white/[0.04] hover:bg-white/[0.07] text-white/90";

          if (resp !== null) {
            if (isCorrect) cls = "border-emerald-400/70 bg-emerald-500/15 text-emerald-100";
            else if (isSel) cls = "border-rose-400/70 bg-rose-500/15 text-rose-100";
          } else if (isSel) {
            cls = "border-pink-400 bg-pink-500/15 text-white";
          }

          return (
            <button
              key={i}
              type="button"
              disabled={resp !== null}
              onClick={() => {
                haptic.selection();
                setSel(i);
              }}
              className={cn(
                "w-full text-left p-4 rounded-2xl border-2 transition-all duration-[80ms] font-medium flex items-center gap-3 touch-manipulation active:scale-[0.99]",
                cls
              )}
            >
              <span className="inline-grid place-items-center h-7 w-7 rounded-full bg-pink-500/20 text-pink-200 text-xs font-bold shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{alt}</span>
            </button>
          );
        })}
      </div>

      {resp === null && (
        <Button
          type="button"
          disabled={sel === null}
          onClick={handleVerificar}
          className={cn("w-full mt-6 h-12 font-bold text-base rounded-xl transition-all duration-[80ms] active:scale-[0.98]", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}

      <ExercicioSlideFeedback
        resp={resp}
        artigo={ex.artigo}
        artigoTexto={artigoTexto}
        explicacao={ex.explicacao ?? ex.frase_correta ?? ex.texto_correto}
        grifos={grifos}
        onContinuar={() => onResultado(resp!)}
      />
    </div>
  );
}
