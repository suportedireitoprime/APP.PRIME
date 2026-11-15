import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { usePilulasWarmup } from './hooks/usePilulasWarmup';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PilulasHero } from '@/components/pilulas/hero/PilulasHero';
import { type PilulasHeroTab } from '@/components/pilulas/hero/PilulasActionShortcuts';
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
      return saved ? new Set(JSON.parse(saved)) : new Set(['cp', 'cf88']);
    } catch {
      return new Set(['cp', 'cf88']);
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

  const handleOpenSearch = useCallback(() => {
    haptic.light();
    navigate('/pilulas/lista?tipo=codigos');
  }, [navigate]);

  // Filtragem dos itens para a aba de favoritos se selecionada
  const codigosExibidos = heroTab === 'favoritos' 
    ? CODIGOS_ITEMS.filter((item) => favoritosIds.has(item.id || ''))
    : CODIGOS_ITEMS;

  const classicosExibidos = heroTab === 'favoritos'
    ? CLASSICOS_ITEMS.filter((item) => favoritosIds.has(item.id || ''))
    : CLASSICOS_ITEMS;

  return (
    <div className="theme-vademecum min-h-dvh bg-zinc-950 pb-24 relative overflow-x-hidden">
      {/* Fundo Padrão Oficial do Projeto com tonalidade idêntica ao Vade Mecum */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.08)"
          hoverFillColor="rgba(255, 255, 255, 0.12)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        {/* Painel Hero Superior com a Capa do Pôr do Sol e Onda Dourada */}
        <PilulasHero
          activeTab={heroTab}
          onSelectTab={setHeroTab}
          onOpenSearch={handleOpenSearch}
          favoritosCount={favoritosIds.size}
        />

        {/* Decks 3D Principais (Pílulas de Códigos & Clássicos do Direito) */}
        <div className="max-w-[1400px] mx-auto px-4 space-y-8 pt-6 pb-8">
          {/* Pílulas de Códigos */}
          <div className="space-y-4">
            <div className="flex items-start justify-between px-1 mb-2 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-[20px] font-black text-white uppercase tracking-widest mb-0.5">
                  Pílulas de Matérias
                </h2>
                <p className="text-[12.5px] text-zinc-400 truncate">
                  Áudios esquematizados, legendas em tempo real e resumos Cornell.
                </p>
              </div>
              
              <button
                onClick={() => { haptic.selection(); navigate('/pilulas/lista?tipo=codigos'); }}
                className="shrink-0 flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-bold whitespace-nowrap shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <span>Ver lista</span>
                <ChevronRight className="w-4 h-4 stroke-[2.6]" />
              </button>
            </div>

            <div className="-mx-4">
              <PilulasDeck3D
                items={codigosExibidos.length > 0 ? codigosExibidos : CODIGOS_ITEMS}
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
                className="shrink-0 flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-bold whitespace-nowrap shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <span>Ver lista</span>
                <ChevronRight className="w-4 h-4 stroke-[2.6]" />
              </button>
            </div>

            <div className="-mx-4">
              <PilulasDeck3D
                items={classicosExibidos.length > 0 ? classicosExibidos : CLASSICOS_ITEMS}
                onItemClick={handleSelectClassicos}
                defaultBorderColor="#E11D48"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
