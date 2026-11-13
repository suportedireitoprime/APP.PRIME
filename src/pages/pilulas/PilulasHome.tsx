import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { usePilulasWarmup } from './hooks/usePilulasWarmup';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PilulasHero } from '@/components/pilulas/hero/PilulasHero';
import { type PilulasHeroTab } from '@/components/pilulas/hero/PilulasActionShortcuts';
import { PilulasAreasCatalog } from '@/components/pilulas/PilulasAreasCatalog';
import { PilulasDeck3D } from './components/PilulasDeck3D';
import { CODIGOS_ITEMS, CLASSICOS_ITEMS, type PillGalleryItem } from './data/galleryItems';
import { navigateToCodigoByItem } from './utils/pilulasNavigation';
import { AnimatedDivider } from '@/components/ui/AnimatedDivider';

const STORAGE_KEY = 'pilulas_audio_favoritos_v1';

export default function PilulasHome() {
  const navigate = useNavigate();
  const [heroTab, setHeroTab] = useState<PilulasHeroTab>('todos');
  const [favoritosIds, setFavoritosIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set(['c1', 'p1']);
    } catch {
      return new Set(['c1', 'p1']);
    }
  });

  usePilulasWarmup();

  const toggleFavorito = useCallback((id: string) => {
    setFavoritosIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  const handleSelectClassicos = useCallback(() => {
    haptic.selection();
    navigate('/pilulas/classicos');
  }, [navigate]);

  const handleItemClick = useCallback((item: PillGalleryItem) => {
    haptic.selection();
    navigateToCodigoByItem(item, navigate);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] overflow-x-hidden pb-24">
      {/* Fundo Padrão Oficial do Projeto (ShapeGrid) */}
      <div className="fixed inset-0 z-0">
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
        {/* Painel Hero Superior com a Capa do Pôr do Sol e Onda na Cor do Céu */}
        <PilulasHero
          activeTab={heroTab}
          onSelectTab={setHeroTab}
          favoritosCount={favoritosIds.size}
        />

        {/* Catálogo de Todas as Áreas do Direito e Resumos em Áudio */}
        <div className="pt-2">
          <PilulasAreasCatalog
            activeTab={heroTab}
            onSelectTab={setHeroTab}
            favoritosIds={favoritosIds}
            onToggleFavorito={toggleFavorito}
          />
        </div>

        {/* Seção Adicional: Pílulas de Códigos & Clássicos (Visível na aba 'todos') */}
        {heroTab === 'todos' && (
          <div className="max-w-[1400px] mx-auto px-4 space-y-8 pt-4 pb-8 border-t border-white/5">
            {/* Pílulas de Códigos */}
            <div className="space-y-4">
              <div className="flex items-start justify-between px-1 mb-2 gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[20px] font-black text-white uppercase tracking-widest mb-0.5">
                    Pílulas de Códigos
                  </h2>
                  <p className="text-[12.5px] text-zinc-400 truncate">
                    Áudios curtos e diretos sobre os artigos essenciais da lei seca.
                  </p>
                </div>
                
                <button
                  onClick={() => { haptic.selection(); navigate('/pilulas/lista?tipo=codigos'); }}
                  className="shrink-0 flex items-center justify-center h-[36px] px-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  Ver lista
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

            {/* Clássicos do Direito */}
            <div className="space-y-4 mb-4">
              <AnimatedDivider text="Clássicos do Direito" />

              <div className="flex items-start justify-between px-1 mb-2 gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[20px] font-black text-white uppercase tracking-widest mb-0.5">
                    Clássicos do Direito
                  </h2>
                  <p className="text-[12.5px] text-zinc-400 truncate">
                    As obras fundamentais do pensamento jurídico mundial.
                  </p>
                </div>

                <button
                  onClick={handleSelectClassicos}
                  className="shrink-0 flex items-center justify-center h-[36px] px-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  Ver lista
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
          </div>
        )}
      </div>
    </div>
  );
}
