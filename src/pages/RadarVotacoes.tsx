import { useNavigate } from 'react-router-dom';
import VotacoesPanel from '@/components/radar/VotacoesPanel';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';

const RadarVotacoes = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md">
        <PageHeader
          title="Votações"
          subtitle="Votações recentes do plenário"
          onBack={() => goBack()}
        />
      </div>
      <div className="p-4 lg:mx-auto lg:w-full lg:max-w-[1500px] lg:px-12 lg:py-8 2xl:px-16">
        <VotacoesPanel />
      </div>
    </div>
  );
};

export default RadarVotacoes;
