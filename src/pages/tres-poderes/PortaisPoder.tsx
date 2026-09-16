import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import { ArrowLeft, Globe, ExternalLink, X, Lightbulb, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { useGoBack } from '@/hooks/useGoBack';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PORTAIS_PODERES, PortalPoder } from '@/data/portaisPoderes';

const PortaisPoder = () => {
  const { poderId } = useParams<{ poderId: string }>();
  const goBack = useGoBack();
  const navigate = useNavigate();
  const [selectedPortal, setSelectedPortal] = useState<PortalPoder | null>(null);

  const poderData = poderId && PORTAIS_PODERES[poderId] ? PORTAIS_PODERES[poderId] : null;

  // Group by categories
  const categories = useMemo(() => {
    if (!poderData) return {};
    const groups: Record<string, PortalPoder[]> = {};
    poderData.portais.forEach(portal => {
      if (!groups[portal.category]) {
        groups[portal.category] = [];
      }
      groups[portal.category].push(portal);
    });
    return groups;
  }, [poderData]);

  if (!poderData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background text-white">
        <p className="text-muted-foreground mb-4">Poder não encontrado ou sem portais mapeados.</p>
        <button onClick={() => goBack()} className="px-4 py-2 bg-primary rounded-lg text-sm">
          Voltar
        </button>
      </div>
    );
  }

  const handleOpenWebView = async (url: string) => {
    haptic.selection();
    try {
      await Browser.open({ url, presentationStyle: 'fullscreen' });
    } catch (e) {
      console.error('Error opening browser:', e);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Fundo animado */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <ShapeGrid active={true} hoverFillColor={poderId === 'stf' ? '#10B981' : poderId === 'senado' ? '#3B82F6' : '#F59E0B'} />
      </div>

      {/* Header Fixo - Ajustado top margin */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            onClick={() => { haptic.selection(); goBack(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>

          <div className="flex flex-col items-center justify-center">
            <h1 className="font-display font-bold text-[17px] text-white tracking-widest uppercase">
              {poderData.title}
            </h1>
            <span className="text-[11px] text-emerald-400 font-medium tracking-wide uppercase">
              {poderData.subtitle}
            </span>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* Listagem em Categorias - Ajustado bottom padding */}
      <main className="flex-1 relative z-10 p-4 md:p-6 lg:max-w-4xl lg:mx-auto lg:w-full space-y-6 pb-[calc(5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
        
        {/* Descrição dos Portais */}
        <div className="mb-2 bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-[13.5px] text-white/80 leading-relaxed text-center sm:text-left">
            Explore os portais institucionais e ferramentas interativas. Aqui você tem acesso direto aos serviços, transparência e meios de participação cidadã do <strong className="text-white">{poderData.title}</strong>.
          </p>
        </div>

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
                className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 md:p-8 overflow-y-auto flex-1 pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
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
                  
                  <h2 className="font-display font-bold text-2xl text-white mb-2 leading-tight">
                    {selectedPortal.title}
                  </h2>
                  <p className="text-[14px] font-medium" style={{ color: selectedPortal.color }}>
                    {poderData.subtitle}
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  {/* Descrição Geral */}
                  <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-[15px] prose-p:text-white/70 max-w-none">
                    {selectedPortal.fullExplanation.split('\n\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Exemplo Prático */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: selectedPortal.color }} />
                    <h4 className="flex items-center gap-2 text-white font-bold text-[14px] mb-2 uppercase tracking-wide">
                      <Lightbulb className="w-4 h-4" style={{ color: selectedPortal.color }} />
                      Na Prática (Dia a Dia)
                    </h4>
                    <p className="text-[14px] text-white/70 leading-relaxed">
                      {selectedPortal.practicalExample}
                    </p>
                  </div>

                  {/* Tópicos / Principais Recursos */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h4 className="text-white font-bold text-[14px] mb-3 uppercase tracking-widest text-center opacity-80">
                      Principais Recursos
                    </h4>
                    <ul className="space-y-2.5">
                      {selectedPortal.topics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[14px] text-white/70">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: selectedPortal.color }} />
                          <span className="leading-snug">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenWebView(selectedPortal.url)}
                  className="w-full h-[52px] rounded-xl flex items-center justify-center gap-2 font-bold text-[15px] text-white shadow-lg transition-transform active:scale-95 mt-4"
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

export default PortaisPoder;
