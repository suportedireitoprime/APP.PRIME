import { useNavigate, useSearchParams } from 'react-router-dom';
import ProposicoesPanel from '@/components/radar/ProposicoesPanel';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';

const RadarProposicoes = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchParams] = useSearchParams();
  const dataInicial = searchParams.get('data') || undefined;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md">
        <PageHeader
          title="Projetos de Lei"
          subtitle="Proposições legislativas da Câmara"
          onBack={() => goBack()}
        />
      </div>

      <div className="p-4 lg:mx-auto lg:w-full lg:max-w-[1500px] lg:px-12 lg:py-8 2xl:px-16">
        <ProposicoesPanel searchQuery="" dataInicial={dataInicial} />
      </div>
    </div>
  );
};

export default RadarProposicoes;
