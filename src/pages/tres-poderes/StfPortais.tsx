import { useState, useMemo } from 'react';
import { Browser } from '@capacitor/browser';
import { ArrowLeft, Globe, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { useGoBack } from '@/hooks/useGoBack';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { STF_PORTAIS, StfPortal } from '@/data/stfPortais';

const StfPortais = () => {
  const goBack = useGoBack();
  const [selectedPortal, setSelectedPortal] = useState<StfPortal | null>(null);

  // Group by categories
  const categories = useMemo(() => {
    const groups: Record<string, StfPortal[]> = {};
    STF_PORTAIS.forEach(portal => {
      if (!groups[portal.category]) {
        groups[portal.category] = [];
      }
      groups[portal.category].push(portal);
    });
    return groups;
  }, []);

  const handleOpenWebView = async (url: string) => {
    haptic.selection();
    try {
      await Browser.open({ url, presentationStyle: 'fullscreen' });
    } catch (e) {
      console.error('Error opening browser:', e);
      // Fallback para web caso o plugin falhe
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Fundo animado */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <ShapeGrid active={true} hoverFillColor="#10B981" />
      </div>

      {/* Header Fixo */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => { haptic.selection(); goBack(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>

          <div className="flex flex-col items-center justify-center">
            <h1 className="font-display font-bold text-[17px] text-white tracking-widest uppercase">
              PORTAIS DO STF
            </h1>
            <span className="text-[11px] text-emerald-400 font-medium tracking-wide">
              Serviços Oficiais
            </span>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* Listagem em Categorias */}
      <main className="flex-1 relative z-10 p-4 md:p-6 lg:max-w-4xl lg:mx-auto lg:w-full space-y-8 pb-32">
        {Object.entries(categories).map(([category, portais], groupIdx) => (
          <div key={category} className="space-y-3">
            <h2 className="text-[13px] font-bold text-white/50 tracking-widest uppercase pl-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              {category}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {portais.map((portal, idx) => {
                const Icon = portal.icon;
                return (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (groupIdx * 0.1) + (idx * 0.05) }}
                    key={portal.id}
                    onClick={() => {
                      haptic.selection();
                      setSelectedPortal(portal);
                    }}
                    className="flex items-center p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:bg-zinc-800/80 active:scale-[0.98] transition-all text-left group overflow-hidden relative"
                  >
                    {/* Linha colorida indicativa */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 opacity-60 group-hover:opacity-100 transition-opacity" 
                      style={{ backgroundColor: portal.color }} 
                    />
                    
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 bg-white/5 border border-white/5"
                    >
                      <Icon className="w-6 h-6" style={{ color: portal.color }} strokeWidth={1.5} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-white text-[15px] truncate">
                        {portal.title}
                      </h3>
                      <p className="text-[12.5px] text-white/50 leading-snug mt-0.5 line-clamp-2">
                        {portal.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* Modal / BottomSheet de Detalhes (Blogger style) */}
      <AnimatePresence>
        {selectedPortal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPortal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-white/10 rounded-t-[32px] max-h-[85vh] flex flex-col md:max-w-2xl md:mx-auto md:relative md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:h-auto md:rounded-[32px] md:border shadow-2xl"
            >
              {/* Puxador Mobile */}
              <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Botão Fechar Modal Desktop/Geral */}
              <button
                onClick={() => setSelectedPortal(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                <div className="flex flex-col items-center text-center mb-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-black/50"
                    style={{ backgroundColor: `${selectedPortal.color}20`, border: `1px solid ${selectedPortal.color}40` }}
                  >
                    <selectedPortal.icon className="w-8 h-8" style={{ color: selectedPortal.color }} strokeWidth={1.5} />
                  </div>
                  
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
                    {selectedPortal.category}
                  </span>
                  
                  <h2 className="font-display font-bold text-2xl text-white mb-2">
                    {selectedPortal.title}
                  </h2>
                  <p className="text-[14px] text-emerald-400 font-medium">
                    Serviço Oficial do STF
                  </p>
                </div>

                <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-[15px] prose-p:text-white/70 max-w-none mb-8">
                  {selectedPortal.fullExplanation.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>

                <button
                  onClick={() => handleOpenWebView(selectedPortal.url)}
                  className="w-full h-[52px] rounded-xl flex items-center justify-center gap-2 font-bold text-[15px] text-white shadow-lg transition-transform active:scale-95"
                  style={{ backgroundColor: selectedPortal.color }}
                >
                  <Globe className="w-5 h-5" />
                  ACESSAR PORTAL
                  <ExternalLink className="w-4 h-4 opacity-70 ml-1" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StfPortais;
