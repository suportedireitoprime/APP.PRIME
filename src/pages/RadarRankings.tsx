import { useNavigate } from 'react-router-dom';
import RankingPanel from '@/components/radar/RankingPanel';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';

const RadarRankings = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md">
        <PageHeader
          title="Rankings"
          subtitle="Desempenho dos deputados federais"
          onBack={() => goBack()}
        />
      </div>
      <div className="p-4 lg:mx-auto lg:w-full lg:max-w-[1500px] lg:px-12 lg:py-8 2xl:px-16">
        <RankingPanel />
      </div>
    </div>
  );
};

export default RadarRankings;
