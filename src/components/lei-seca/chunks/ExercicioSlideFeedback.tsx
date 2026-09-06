import { ArtigoComentarioSlide } from "../ArtigoComentarioSlide";

interface ExercicioSlideFeedbackProps {
  resp: boolean | null;
  artigo?: string | number;
  artigoTexto: string;
  explicacao?: string;
  grifos?: string[];
  onContinuar: () => void;
}

export function ExercicioSlideFeedback({
  resp,
  artigo,
  artigoTexto,
  explicacao,
  grifos,
  onContinuar,
}: ExercicioSlideFeedbackProps) {
  return (
    <ArtigoComentarioSlide
      open={resp !== null}
      certo={!!resp}
      artigo={artigo !== undefined ? String(artigo) : ""}
      artigoTexto={artigoTexto}
      explicacao={explicacao}
      grifos={grifos}
      onContinuar={onContinuar}
    />
  );
}
