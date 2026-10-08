import { ArtigoComentarioSlide } from "../ArtigoComentarioSlide";

interface ExercicioSlideFeedbackProps {
  resp: boolean | null;
  ex?: any;
  artigo?: string | number;
  artigoTexto: string;
  explicacao?: string;
  grifos?: string[];
  onContinuar: () => void;
}

export function ExercicioSlideFeedback({
  resp,
  ex,
  artigo,
  artigoTexto,
  explicacao,
  grifos,
  onContinuar,
}: ExercicioSlideFeedbackProps) {
  const finalArtigo = artigo ?? ex?.artigo ?? "";
  const finalExplicacao = explicacao ?? ex?.explicacao ?? ex?.frase_correta ?? ex?.texto_correto;
  return (
    <ArtigoComentarioSlide
      open={resp !== null}
      certo={!!resp}
      artigo={finalArtigo !== undefined ? String(finalArtigo) : ""}
      artigoTexto={artigoTexto}
      explicacao={finalExplicacao}
      grifos={grifos}
      onContinuar={onContinuar}
    />
  );
}
