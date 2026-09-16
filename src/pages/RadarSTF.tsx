import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StfMinistrosPanel from '@/components/radar/stf/StfMinistrosPanel';
import StfPautasPanel from '@/components/radar/stf/StfPautasPanel';

const RadarSTF = () => {
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
          title="Supremo Tribunal Federal"
          subtitle="Pautas e Ministros do STF"
          onBack={handleBack}
        />
      </div>
      
      <div className="relative z-10 p-4 lg:mx-auto lg:w-full lg:max-w-[1500px] lg:px-12 lg:py-8 2xl:px-16">
        <Tabs defaultValue="pautas" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 bg-zinc-900/50">
            <TabsTrigger value="pautas">PAUTAS</TabsTrigger>
            <TabsTrigger value="ministros">MINISTROS</TabsTrigger>
          </TabsList>

          <TabsContent value="pautas" className="mt-0">
            <StfPautasPanel />
          </TabsContent>
          
          <TabsContent value="ministros" className="mt-0">
            <StfMinistrosPanel selected={selected} setSelected={setSelected} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RadarSTF;
