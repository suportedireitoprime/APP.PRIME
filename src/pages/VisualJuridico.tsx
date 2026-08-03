import { useNavigate, useParams } from 'react-router-dom';
import VisuaisJuridicosSheet from '@/components/visuais/VisuaisJuridicosSheet';
import { SLUG_TIPO } from '@/lib/visuaisJuridicos/rotas';


export default function VisualJuridico() {
  const { formato } = useParams<{ formato: string }>();
  const navigate = useNavigate();
  const tipo = formato ? SLUG_TIPO[formato] : undefined;

  const sair = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/', { replace: true });
  };

  if (!tipo) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="font-body text-sm text-muted-foreground">Formato de visual não encontrado.</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="rounded-full bg-secondary/70 px-5 py-2 font-display text-sm font-bold uppercase tracking-wider text-foreground"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return <VisuaisJuridicosSheet open modo="page" tipoInicial={tipo} onClose={sair} />;
}
