import { useState, useCallback } from 'react';
import { usePilulasWarmup } from './hooks/usePilulasWarmup';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PilulasHero } from '@/components/pilulas/hero/PilulasHero';
import { type PilulasHeroTab } from '@/components/pilulas/hero/PilulasActionShortcuts';
import { PilulasAreasCatalog } from '@/components/pilulas/PilulasAreasCatalog';

const STORAGE_KEY = 'pilulas_audio_favoritos_v1';

export default function PilulasHome() {
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
      </div>
    </div>
  );
}
