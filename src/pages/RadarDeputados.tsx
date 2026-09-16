import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeputadosPanel from '@/components/radar/DeputadosPanel';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import ShapeGrid from '@/components/ui/ShapeGrid';

const RadarDeputados = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [selected, setSelected] = useState<any>(null);

  const handleBack = () => {
    if (selected) {
      setSelected(null);
    } else {
      goBack();
    }
  };

  return (
    <div className="relative min-h-dvh bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <ShapeGrid />
      </div>
      
      <div className="z-10 sticky top-0 bg-background/80 backdrop-blur-md border-b border-white/5">
        <PageHeader
          title="Deputados Federais"
          subtitle="513 deputados em exercício"
          onBack={handleBack}
        />
      </div>
      <div className="relative z-10 p-4 lg:mx-auto lg:w-full lg:max-w-[1500px] lg:px-12 lg:py-8 2xl:px-16">
        <DeputadosPanel searchQuery="" selected={selected} setSelected={setSelected} />
      </div>
    </div>
  );
};

export default RadarDeputados;
