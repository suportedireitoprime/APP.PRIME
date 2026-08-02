import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import VadeMecumBottomNav from './VadeMecumBottomNav';

interface Props {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

/** Layout padrão das subpáginas do Vade Mecum (voltar + título + rodapé próprio). */
const VadeMecumSubpage = ({ titulo, descricao, children }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="theme-vademecum min-h-dvh bg-background pb-28">
      <header className="bg-hero-panel-green px-4 pt-[calc(var(--sai-top,env(safe-area-inset-top,0px))+14px)] pb-6 rounded-b-3xl">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/vade-mecum')}
            className="w-10 h-10 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-white mb-3"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-white text-[22px] sm:text-2xl font-bold uppercase tracking-wide">
            {titulo}
          </h1>
          {descricao && <p className="text-white/80 text-sm mt-1">{descricao}</p>}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5">{children}</main>

      <VadeMecumBottomNav />
    </div>
  );
};

export default VadeMecumSubpage;
