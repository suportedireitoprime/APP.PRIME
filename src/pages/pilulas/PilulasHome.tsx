import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { ChevronRight, Bookmark, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePilulasWarmup } from './hooks/usePilulasWarmup';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PilulasHero } from '@/components/pilulas/hero/PilulasHero';
import { type PilulasHeroTab } from '@/components/pilulas/hero/PilulasActionShortcuts';
import { PilulasDeck3D } from './components/PilulasDeck3D';
import { CODIGOS_ITEMS, CLASSICOS_ITEMS, type PillGalleryItem } from './data/galleryItems';
import { navigateToCodigoByItem } from './utils/pilulasNavigation';
import { AnimatedDivider } from '@/components/ui/AnimatedDivider';
import { PrimeImage } from '@/components/ui/PrimeImage';

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
          {/* Pílulas de Matérias (Em Lista) */}
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

              <span className="shrink-0 inline-flex items-center gap-1.5 h-[30px] px-3 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-mono font-bold">
                {(codigosExibidos.length > 0 ? codigosExibidos : CODIGOS_ITEMS).length} matérias
              </span>
            </div>

            {/* Lista responsiva de matérias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(codigosExibidos.length > 0 ? codigosExibidos : CODIGOS_ITEMS).map((item, index) => {
                const isFavorito = favoritosIds.has(item.id || '');
                return (
                  <motion.div
                    key={item.text}
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.25) }}
                    onClick={() => handleItemClick(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(item);
                      }
                    }}
                    className="group flex items-stretch p-3 rounded-2xl bg-[#141416]/90 border border-white/10 hover:border-amber-400/40 active:scale-[0.98] transition-all text-left relative overflow-hidden backdrop-blur-md shadow-lg shadow-black/40 hover:shadow-amber-500/10 cursor-pointer select-none"
                  >
                    {/* Imagem vertical 2:3 */}
                    <div className="w-[72px] sm:w-[80px] h-[106px] sm:h-[116px] rounded-xl overflow-hidden shrink-0 shadow-md relative border border-white/10">
                      <PrimeImage 
                        src={item.image} 
                        alt={item.fullName} 
                        aspectRatio="2/3"
                        targetWidth={180}
                        priority={index < 4}
                        containerClassName="w-full h-full rounded-xl"
                        fallbackText={item.text}
                      />
                      {/* Borda inferior colorida da matéria */}
                      <div 
                        className="absolute inset-x-0 bottom-0 h-1"
                        style={{ backgroundColor: item.borderColor || '#EF4444' }}
                      />
                    </div>
                    
                    {/* Conteúdo textual */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between pl-3.5 py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider"
                            style={{
                              backgroundColor: `${item.borderColor || '#EF4444'}20`,
                              color: item.borderColor || '#EF4444',
                              border: `1px solid ${item.borderColor || '#EF4444'}40`,
                            }}
                          >
                            {item.text}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.light();
                              if (item.id) toggleFavorito(item.id);
                            }}
                            aria-label={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            className="p-1 -mr-1 text-white/40 hover:text-amber-400 transition-colors"
                          >
                            <Bookmark
                              className={`w-4 h-4 ${isFavorito ? 'text-amber-400 fill-amber-400' : ''}`}
                            />
                          </button>
                        </div>

                        <h3 className="text-white font-black text-[16px] sm:text-[17px] tracking-wide truncate mt-1">
                          {item.fullName}
                        </h3>
                        <p className="text-zinc-400 text-[12px] sm:text-[12.5px] leading-snug line-clamp-2 mt-0.5">
                          {item.descricao}
                        </p>
                      </div>

                      {/* Rodapé da matéria */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                          <Headphones className="w-3.5 h-3.5" />
                          <span>Ouvir Pílulas</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-amber-400/20 flex items-center justify-center transition-colors">
                          <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:text-amber-300 transition-colors stroke-[2.4]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
