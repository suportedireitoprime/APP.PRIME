import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useFerramentasNavigation } from '@/components/ferramentas/useFerramentasNavigation';
import { FerramentasMobileList } from '@/components/ferramentas/FerramentasMobileList';
import { FerramentasDesktopGrid } from '@/components/ferramentas/FerramentasDesktopGrid';
import { FerramentasModals } from '@/components/ferramentas/FerramentasModals';
import ShapeGrid from '@/components/ui/ShapeGrid';

const Ferramentas = () => {
  useTrackArea("ferramentas_aberta");
  const {
    navigate,
    dicionarioOpen,
    setDicionarioOpen,
    rankingOpen,
    setRankingOpen,
    handleToolClick,
  } = useFerramentasNavigation();

  const mobileHeader = (
    <PageHeader
      title="Ferramentas"
      subtitle="Recursos para potencializar seus estudos"
      onBack={() => navigate('/')}
    />
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title="Ferramentas"
      subtitle="Todos os recursos do Direito Prime em um só lugar"
      mobileHeader={mobileHeader}
      wide
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>
      <div className="px-4 sm:px-6 py-4 pb-[calc(7rem+var(--sai-bottom))] lg:hidden relative z-10">
        <FerramentasMobileList onToolClick={handleToolClick} />
      </div>
      <div className="hidden lg:block relative z-10">
        <FerramentasDesktopGrid onToolClick={handleToolClick} />
      </div>

      <FerramentasModals
        dicionarioOpen={dicionarioOpen}
        onCloseDicionario={() => setDicionarioOpen(false)}
        rankingOpen={rankingOpen}
        onCloseRanking={() => setRankingOpen(false)}
      />
    </DesktopPageLayout>
  );
};

export default Ferramentas;
