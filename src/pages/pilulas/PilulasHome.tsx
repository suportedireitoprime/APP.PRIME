import { useNavigate } from 'react-router-dom';
import { useRef, useState, useCallback } from 'react';
import { usePilulasWarmup } from './hooks/usePilulasWarmup';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { AnimatedDivider } from '@/components/ui/AnimatedDivider';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PilulasDeck3D } from './components/PilulasDeck3D';
import { CODIGOS_ITEMS, MINISTROS_ITEMS, CLASSICOS_ITEMS, type PillGalleryItem } from './data/galleryItems';
import { navigateToCodigoByItem, navigateToMinistros } from './utils/pilulasNavigation';

type TabType = 'Todos' | 'Pílulas Rápidas' | 'Só Pílulas' | 'Códigos' | 'Ministros';

export default function PilulasHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('Todos');
  const tabs: TabType[] = ['Todos', 'Pílulas Rápidas', 'Só Pílulas', 'Códigos', 'Ministros'];
  
  usePilulasWarmup();

  const handleSelectClassicos = useCallback(() => {
    haptic.selection();
    navigate('/pilulas/classicos');
  }, [navigate]);

  const handleTabClick = useCallback((tab: TabType) => {
    haptic.selection();
    setActiveTab(tab);
  }, []);

  const handleItemClick = useCallback((item: PillGalleryItem) => {
    haptic.selection();
    navigateToCodigoByItem(item, navigate);
  }, [navigate]);

  const handleMinistroClick = useCallback(() => {
    haptic.selection();
    navigateToMinistros(navigate);
  }, [navigate]);

  const showRapidas = activeTab === 'Todos' || activeTab === 'Pílulas Rápidas';
  const showSoPilulas = activeTab === 'Todos' || activeTab === 'Só Pílulas';
  const showCodigos = activeTab === 'Todos' || activeTab === 'Pílulas Rápidas' || activeTab === 'Códigos';
  const showMinistros = activeTab === 'Todos' || activeTab === 'Só Pílulas' || activeTab === 'Ministros';

  return (
    <div className="min-h-screen bg-[#0D0D0D] overflow-x-hidden pb-20">
      <div className="absolute inset-0 z-0">
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

      <div className="relative z-10">
        <PageHeader
          title="Pílulas Jurídicas"
          onBack={() => navigate('/')}
          rightAction={<div className="w-8" />}
        />

        {/* Menu de Alternância (Tabs) */}
        <div className="flex px-4 py-3 gap-2 overflow-x-auto no-scrollbar snap-x sticky top-[60px] z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`flex-shrink-0 snap-start px-5 min-h-[44px] rounded-2xl text-sm font-semibold transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 border border-primary/50'
                    : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="px-4 pt-6 space-y-6">
          {showRapidas && (
            <div className="flex items-center w-full mb-6">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="mx-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Pílulas Rápidas</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>
          )}

          {/* Pílulas de Códigos */}
          {showCodigos && (
            <div className="space-y-4">
              <div className="flex items-start justify-between px-1 mb-4 gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Pílulas de Códigos</h2>
                  <p className="text-[13px] text-zinc-400 truncate">
                    Áudios curtos e diretos sobre os artigos essenciais da lei seca.
                  </p>
                </div>
                
                <button
                  onClick={() => { haptic.selection(); navigate('/pilulas/lista?tipo=codigos'); }}
                  className="shrink-0 flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  Ver em lista
                </button>
              </div>

              <div className="-mx-4">
                <PilulasDeck3D
                  items={CODIGOS_ITEMS}
                  onItemClick={handleItemClick}
                  defaultBorderColor="#EF4444"
                />
              </div>
            </div>
          )}

          {/* Divider com texto */}
          {(showSoPilulas || showMinistros) && (
            <AnimatedDivider text="Pílulas de Análise" />
          )}

          {/* Pílulas dos Ministros */}
          {showMinistros && (
            <div className="space-y-4 mb-8">
              <div className="flex items-start justify-between px-1 mb-4 gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Pílulas dos Ministros do STF</h2>
                  <p className="text-[13px] text-zinc-400 truncate">
                    Principais posicionamentos e histórico dos Ministros do STF.
                  </p>
                </div>

                <button
                  onClick={() => { haptic.selection(); navigate('/pilulas/lista?tipo=ministros'); }}
                  className="shrink-0 flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  Ver em lista
                </button>
              </div>

              <div className="-mx-4">
                <PilulasDeck3D
                  items={MINISTROS_ITEMS}
                  onItemClick={handleMinistroClick}
                  defaultBorderColor="#D4AF37"
                />
              </div>
            </div>
          )}

          {showSoPilulas && (
            <div className="space-y-4 mb-8">
              <AnimatedDivider text="Clássicos do Direito" />

              <div className="flex items-start justify-between px-1 mb-4 gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Clássicos do Direito</h2>
                  <p className="text-[13px] text-zinc-400 truncate">
                    As obras fundamentais do pensamento jurídico mundial.
                  </p>
                </div>

                <button
                  onClick={handleSelectClassicos}
                  className="shrink-0 flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  Ver em lista
                </button>
              </div>

              <div className="-mx-4">
                <PilulasDeck3D
                  items={CLASSICOS_ITEMS}
                  onItemClick={handleSelectClassicos}
                  defaultBorderColor="#E11D48"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
