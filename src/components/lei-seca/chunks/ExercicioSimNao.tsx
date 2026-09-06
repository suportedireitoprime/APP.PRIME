import { useState } from "react";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/nativeHaptics";
import { ExercicioSlideFeedback } from "./ExercicioSlideFeedback";

interface ExercicioSimNaoProps {
  ex: {
    artigo: string | number;
    afirmacao: string;
    correta: boolean;
    explicacao?: string;
    frase_correta?: string;
    texto_correto?: string;
  };
  artigoTexto: string;
  onResultado: (certo: boolean) => void;
}

const ENUN =
  "text-[1.05rem] sm:text-xl md:text-2xl font-normal normal-case tracking-normal leading-[1.65] text-white/95 mb-6 [text-wrap:pretty]";
const ART_LABEL = "text-[11px] font-extrabold tracking-wider text-pink-300/90 uppercase mb-2";

export function ExercicioSimNao({
  ex,
  artigoTexto,
  onResultado,
}: ExercicioSimNaoProps) {
  const [resp, setResp] = useState<boolean | null>(null);

  const handleEscolha = (valorEscolhido: boolean) => {
    const certo = valorEscolhido === ex.correta;
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
      <h2 className={ENUN}>Segundo o art. {ex.artigo}, a afirmação abaixo é verdadeira?</h2>

      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm sm:text-base mb-6 leading-relaxed text-white/90 italic">
        "{ex.afirmacao}"
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => handleEscolha(true)}
          disabled={resp !== null}
          className="h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-base font-bold rounded-xl shadow-lg shadow-emerald-700/30 transition-all duration-[80ms] active:scale-[0.98]"
        >
          Verdadeiro
        </Button>
        <Button
          type="button"
          onClick={() => handleEscolha(false)}
          disabled={resp !== null}
          className="h-14 bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-base font-bold rounded-xl shadow-lg shadow-rose-700/30 transition-all duration-[80ms] active:scale-[0.98]"
        >
          Falso
        </Button>
      </div>

      <ExercicioSlideFeedback
        resp={resp}
        artigo={ex.artigo}
        artigoTexto={artigoTexto}
        explicacao={ex.explicacao ?? ex.frase_correta ?? ex.texto_correto}
        grifos={[ex.afirmacao]}
        onContinuar={() => onResultado(resp!)}
      />
    </div>
  );
}
