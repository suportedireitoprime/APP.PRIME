import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Search, Headphones } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { prefetchImages } from '@/lib/coverLoader';
import { CODIGOS_ITEMS, type PillGalleryItem } from './data/galleryItems';
import { navigateToCodigoByItem } from './utils/pilulasNavigation';
import { PrimeImage } from '@/components/ui/PrimeImage';

export default function PilulasLista() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const baseItems = CODIGOS_ITEMS;

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return baseItems;
    return baseItems.filter(item => 
      item.text.toLowerCase().includes(term) || 
      item.fullName.toLowerCase().includes(term)
    );
  }, [baseItems, searchTerm]);

  const title = 'Pílulas de Códigos';

  useEffect(() => {
    const urlsToPrefetch = baseItems.map(item => item.image);
    prefetchImages(urlsToPrefetch);
  }, [baseItems]);

  const handleItemClick = (item: PillGalleryItem) => {
    haptic.selection();
    navigateToCodigoByItem(item, navigate);
  };

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20 relative overflow-x-hidden">
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
        <PageHeader
          title={title}
          onBack={() => navigate('/pilulas')}
          rightAction={<div className="w-8" />}
        />
        
        <div className="px-4 pt-6 space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pílula..."
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-3">
            {filteredItems.map((item, index) => (
              <motion.button
                key={item.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
                onClick={() => handleItemClick(item)}
                className="group flex items-stretch p-3.5 rounded-2xl bg-[#1A1A1A] border border-white/5 active:scale-[0.98] transition-all text-left relative overflow-hidden hover:border-white/15"
              >
                {/* Imagem vertical 2:3 */}
                <div className="w-[72px] h-[108px] rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  <PrimeImage 
                    src={item.image} 
                    alt={item.fullName} 
                    aspectRatio="2/3"
                    targetWidth={180}
                    priority={index < 4}
                    containerClassName="w-full h-full rounded-xl"
                    fallbackText={item.text}
                  />
                </div>
                
                {/* Conteúdo */}
                <div className="flex-1 min-w-0 flex flex-col justify-between pl-4 py-1">
                  <div>
                    {item.sigla && (
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-mono font-black uppercase tracking-wider mb-1"
                        style={{
                          backgroundColor: `${item.borderColor || '#EF4444'}20`,
                          color: item.borderColor || '#EF4444',
                          border: `1px solid ${item.borderColor || '#EF4444'}40`,
                        }}
                      >
                        {item.sigla}
                      </span>
                    )}

                    <h3 className="font-sans font-bold text-[15.5px] sm:text-base text-zinc-100 group-hover:text-amber-300 transition-colors tracking-normal leading-snug truncate">
                      {item.text}
                    </h3>

                    {item.totalTopicos ? (
                      <p className="text-[11.5px] text-zinc-400 mt-0.5 font-sans flex items-center gap-1.5 truncate">
                        <span className="text-amber-400 font-medium">{item.totalTopicos} aulas em áudio</span>
                        {item.totalModulos ? (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">{item.totalModulos} matérias</span>
                          </>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-zinc-400 text-[12px] mt-0.5 truncate font-sans">{item.fullName}</p>
                    )}
                  </div>
                  
                  {/* Rodapé do card */}
                  <div className="flex items-center gap-2 mt-3 pt-1 border-t border-white/5">
                    <div className="w-6 h-6 rounded-full bg-amber-400/15 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-400/25 transition-colors">
                      <Headphones className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
                    </div>
                    <span className="text-amber-400 text-[10px] font-bold tracking-widest uppercase font-sans">
                      Acessar Aulas
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500">Nenhum item encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
