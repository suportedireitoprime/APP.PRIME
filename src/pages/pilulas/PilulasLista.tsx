import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Search, Headphones } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { prefetchImages } from '@/lib/coverLoader';
import { CODIGOS_ITEMS, MINISTROS_ITEMS, type PillGalleryItem } from './data/galleryItems';
import { navigateToCodigoByItem, navigateToMinistros } from './utils/pilulasNavigation';

export default function PilulasLista() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'codigos';
  const [searchTerm, setSearchTerm] = useState('');

  const baseItems = useMemo(() => {
    return tipo === 'ministros' ? MINISTROS_ITEMS : CODIGOS_ITEMS;
  }, [tipo]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return baseItems;
    return baseItems.filter(item => 
      item.text.toLowerCase().includes(term) || 
      item.fullName.toLowerCase().includes(term)
    );
  }, [baseItems, searchTerm]);

  const title = tipo === 'ministros' ? 'Pílulas dos Ministros do STF' : 'Pílulas de Códigos';

  useEffect(() => {
    const urlsToPrefetch = baseItems.map(item => item.image);
    prefetchImages(urlsToPrefetch);
  }, [baseItems]);

  const handleItemClick = (item: PillGalleryItem) => {
    haptic.selection();
    if (tipo === 'ministros') {
      navigateToMinistros(navigate);
    } else {
      navigateToCodigoByItem(item, navigate);
    }
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
          onBack={() => navigate(-1)}
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
                {/* Imagem vertical */}
                <div className="w-[72px] h-[96px] rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 shadow-md">
                  <img 
                    src={item.image} 
                    alt={item.fullName} 
                    className="w-full h-full object-cover" 
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                
                {/* Conteúdo */}
                <div className="flex-1 min-w-0 flex flex-col justify-between pl-4 py-1">
                  <div>
                    <h3 className="text-white font-black text-[17px] uppercase tracking-wider truncate">{item.text}</h3>
                    <p className="text-zinc-400 text-[13px] mt-0.5 truncate">{item.fullName}</p>
                  </div>
                  
                  {/* Rodapé do card */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                      <Headphones className="w-3.5 h-3.5 text-primary ml-0.5" />
                    </div>
                    <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
                      Acessar
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
