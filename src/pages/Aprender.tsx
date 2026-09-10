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
  AprenderTabSwitcher,
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
  const [activeTab, setActiveTab] = useState<'aulas' | 'flashcards' | 'questoes'>('aulas');
  const [flashcardsViewMode, setFlashcardsViewMode] = useState<'decks' | 'lista'>('decks');
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

  const isAulas = activeTab === 'aulas';
  const isFlashcards = activeTab === 'flashcards';

  const accentColor = isFlashcards ? '#34D399' : activeTab === 'questoes' ? '#38BDF8' : '#fb7185';

  const metricLabel1 = 'Matérias';
  const metricVal1 = isFlashcards && flashAreas?.length ? flashAreas.length : data.areas.length;
  const metricLabel2 = isAulas ? 'Aulas' : isFlashcards ? 'Flashcards' : 'Questões';
  const metricVal2Display = isAulas 
    ? data.totalAulas 
    : isFlashcards 
    ? totalFlashcards.toLocaleString('pt-BR') 
    : 'Em breve';
  const metricLabel3 = 'Concluídas';
  const metricVal3 = isAulas 
    ? data.totalConcluidas 
    : isFlashcards 
    ? totalConcluidasFlashcards.toLocaleString('pt-BR') 
    : 0;
  const metricVal3Total = isAulas 
    ? data.totalAulas 
    : isFlashcards 
    ? totalFlashcards.toLocaleString('pt-BR') 
    : 0;

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

            {/* Menu de Alternância Global (Aulas, Flashcards, Questões) */}
            <AprenderTabSwitcher
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Lista e Decks de Matérias */}
            <div className="space-y-4">
              <AprenderHeaderToolbar
                totalAreas={areasOrdenadas.length}
                isAulas={isAulas}
                isFlashcards={isFlashcards}
                aulasViewMode={aulasViewMode}
                flashcardsViewMode={flashcardsViewMode}
                onAulasViewModeChange={setAulasViewMode}
                onFlashcardsViewModeChange={setFlashcardsViewMode}
                filtro={filtro}
                onFiltroChange={setFiltro}
                emAndamentoCount={emAndamentoCount}
              />

              <AprenderMateriasContent
                loading={loading}
                areas={data.areas}
                areasOrdenadas={areasOrdenadas}
                filtro={filtro}
                isAulas={isAulas}
                isFlashcards={isFlashcards}
                aulasViewMode={aulasViewMode}
                flashcardsViewMode={flashcardsViewMode}
                flashAreas={flashAreas}
                modulesMap={modulesMap}
                uid={uid}
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
