import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useFerramentasNavigation } from '@/components/ferramentas/useFerramentasNavigation';
import { FerramentasMobileList } from '@/components/ferramentas/FerramentasMobileList';
import { FerramentasDesktopGrid } from '@/components/ferramentas/FerramentasDesktopGrid';
import { FerramentasModals } from '@/components/ferramentas/FerramentasModals';

const Ferramentas = () => {
  useTrackArea("ferramentas_aberta");
  const {
    navigate,
    dicionarioOpen,
    setDicionarioOpen,
    rankingOpen,
    setRankingOpen,
    boletinsSheetOpen,
    setBoletinsSheetOpen,
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
      <div className="px-4 sm:px-6 py-4 pb-[calc(7rem+var(--sai-bottom))] lg:hidden">
        <FerramentasMobileList onToolClick={handleToolClick} />
      </div>
      <div className="hidden lg:block">
        <FerramentasDesktopGrid onToolClick={handleToolClick} />
      </div>

      <FerramentasModals
        dicionarioOpen={dicionarioOpen}
        onCloseDicionario={() => setDicionarioOpen(false)}
        rankingOpen={rankingOpen}
        onCloseRanking={() => setRankingOpen(false)}
        boletinsSheetOpen={boletinsSheetOpen}
        onCloseBoletins={() => setBoletinsSheetOpen(false)}
      />
    </DesktopPageLayout>
  );
};

export default Ferramentas;
