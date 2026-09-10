import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { useTrackArea } from "@/hooks/useTrackArea";
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import AprenderLembretesSheet from '@/components/aprender/AprenderLembretesSheet';
import { useAprenderAreaModulesMap } from '@/hooks/useAprenderAreaModulesMap';

import {
  useAprenderHome,
  AprenderHeroProgress,
  AprenderHeaderToolbar,
  AprenderMateriasContent,
  AprenderLeftSidebar,
  AprenderRightSidebar,
  AprenderNonAdminOverlay,
} from '@/components/aprender/chunks';

const Aprender = () => {
  useTrackArea("aprender_aberto");
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const isAdmin = isAdminEmail(user?.email);

  const { modulesMap } = useAprenderAreaModulesMap();
  const activeTab = 'aulas';
  const [aulasViewMode, setAulasViewMode] = useState<'decks' | 'lista'>('decks');
  const [lembretesOpen, setLembretesOpen] = useState(false);

  // Hook isolado que gerencia dados, cache em memória/local e métricas
  const {
    data,
    loading,
    filtro,
    setFiltro,
    areasOrdenadas,
    emAndamentoCount,
    flashAreas,
    totalFlashcards,
    totalConcluidasFlashcards,
    pct,
  } = useAprenderHome(uid, activeTab);

  const isAulas = true;
  const isFlashcards = false;

  const accentColor = '#fb7185';

  const metricLabel1 = 'Matérias';
  const metricVal1 = data.areas.length;
  const metricLabel2 = 'Aulas';
  const metricVal2Display = data.totalAulas;
  const metricLabel3 = 'Concluídas';
  const metricVal3 = data.totalConcluidas;
  const metricVal3Total = data.totalAulas;

  const mobileHeader = (
    <PageHeader
      title={<span className="font-display font-black text-[22px] sm:text-[24px] uppercase tracking-wide">APRENDER</span>}
      onBack={() => navigate('/')}
    />
  );

  return (
    <DesktopPageLayout
      activeId="aprender"
      title="Aprender"
      subtitle="Seu hub de estudos"
      mobileHeader={mobileHeader}
      wide
    >
      {/* Fundo ShapeGrid (padrão oficial do app) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 w-full 2xl:max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 lg:pt-4 pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,16px)))] overflow-x-hidden">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* ── Sidebar Esquerda Desktop: Filtros & Lembretes ───────────── */}
          <AprenderLeftSidebar
            totalAreas={data.areas.length}
            emAndamentoCount={emAndamentoCount}
            filtro={filtro}
            onFiltroChange={setFiltro}
            onOpenLembretes={() => setLembretesOpen(true)}
          />

          {/* ── Coluna Central Widescreen: Trilha Hero & Matérias ─────── */}
          <div className="lg:col-span-6 space-y-5">
            {/* Hero Progress Bar e Ilustração */}
            <AprenderHeroProgress
              activeTab={activeTab}
              pct={pct}
              metricLabel1={metricLabel1}
              metricVal1={metricVal1}
              metricLabel2={metricLabel2}
              metricVal2Display={metricVal2Display}
              metricLabel3={metricLabel3}
              metricVal3={metricVal3}
              metricVal3Total={metricVal3Total}
            />

            {/* Lista e Decks de Matérias */}
            <div className="space-y-4">
              <AprenderHeaderToolbar
                totalAreas={areasOrdenadas.length}
                isAulas={true}
                isFlashcards={false}
                aulasViewMode={aulasViewMode}
                flashcardsViewMode="decks"
                onAulasViewModeChange={setAulasViewMode}
                onFlashcardsViewModeChange={() => {}}
                filtro={filtro}
                onFiltroChange={setFiltro}
                emAndamentoCount={emAndamentoCount}
              />

              <AprenderMateriasContent
                loading={loading}
                areas={data.areas}
                areasOrdenadas={areasOrdenadas}
                filtro={filtro}
                isAulas={true}
                isFlashcards={false}
                aulasViewMode={aulasViewMode}
                flashcardsViewMode="decks"
                flashAreas={flashAreas}
                modulesMap={modulesMap}
                uid={uid}
                emAndamento={data.emAndamento}
                proxima={data.proxima}
              />
            </div>
          </div>

          {/* ── Sidebar Direita Desktop: Estatísticas & Desempenho ────── */}
          <AprenderRightSidebar
            pct={pct}
            accentColor={accentColor}
          />
        </div>

        {/* Overlay de Bloqueio para Não-Admins */}
        {!isAdmin && <AprenderNonAdminOverlay />}
      </div>

      <AprenderLembretesSheet open={lembretesOpen} onOpenChange={setLembretesOpen} />
    </DesktopPageLayout>
  );
};

export default Aprender;
