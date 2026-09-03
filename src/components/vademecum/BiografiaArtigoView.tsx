import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, Play, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { haptic } from '@/lib/nativeHaptics';
import { getBiografiaById } from '@/data/biografias';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useBodyScrollLock, resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsDesktop } from '@/hooks/use-desktop';

interface Props {
  personagemId: string;
  onBack: () => void;
}

export const BiografiaArtigoView = ({ personagemId, onBack }: Props) => {
  const bio = getBiografiaById(personagemId);
  const [activeTab, setActiveTab] = useState(bio?.tabs[0]?.id || '');
  const isDesktop = useIsDesktop();
  useBodyScrollLock(true);
  useEscapeKey(true, () => {
    resetBodyScrollLock();
    onBack();
  });

  useEffect(() => {
    return () => { resetBodyScrollLock(); };
  }, []);

  if (!bio) {
    return (
      <div className="p-8 text-center text-muted-foreground">Biografia não encontrada.</div>
    );
  }

  const currentTab = bio.tabs.find((t) => t.id === activeTab);

  const handleClose = () => {
    haptic.selection();
    resetBodyScrollLock();
    onBack();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Overlay Escuro */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Sheet Modal */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        className={`relative bg-background flex flex-col overflow-hidden shadow-2xl mx-auto w-full max-w-3xl pb-[var(--sai-bottom,0px)] rounded-t-[32px] h-[95dvh] mt-auto`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative pb-10">
          
          {/* Botão de Fechar fixo flutuante (Estilo BlogPostSheet) */}
          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="absolute top-4 left-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/60 text-white shadow-xl hover:bg-white/30 active:scale-95 transition-all z-30 mt-[var(--sai-top,0px)]"
          >
            <ChevronDown className="w-6 h-6 text-white" strokeWidth={3} />
          </button>

          {/* Hero Header */}
          <div className="relative w-full h-[400px] md:h-[500px]">
            {bio.imagemUrl ? (
              <>
                <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${bio.imagemUrl})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-background to-secondary" />
            )}

            {/* Info */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-10">
              <div className="max-w-3xl mx-auto">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-display font-bold text-white mb-2"
                >
                  {bio.nome}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg md:text-xl font-body text-zinc-300 max-w-2xl"
                >
                  {bio.subtitulo}
                </motion.p>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Tabs / Menu de Alternância */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 md:px-6 pt-4 pb-0 mb-8 overflow-x-auto no-scrollbar">
              <div className="flex gap-6 pb-2 min-w-max">
                {bio.tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { haptic.selection(); setActiveTab(tab.id); }}
                      className={`relative pb-3 text-sm font-display font-bold tracking-wide uppercase transition-colors ${
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <motion.div 
                          layoutId="bioTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Markdown Render */}
                  {currentTab?.conteudo_md && (
                    <div className="prose prose-invert prose-p:text-zinc-300 prose-h2:text-white prose-h2:font-display prose-h2:text-2xl prose-h3:text-zinc-200 prose-strong:text-white max-w-none">
                      <ReactMarkdown>{currentTab.conteudo_md}</ReactMarkdown>
                    </div>
                  )}

                  {/* Tabela Render */}
                  {currentTab?.tabela && (
                    <div className="space-y-6">
                      {currentTab.tabela.items.map((item, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="bg-card rounded-2xl border border-border/40 overflow-hidden flex flex-col md:flex-row"
                        >
                          <div className="p-4 md:p-6 md:w-1/3 bg-secondary/30 flex items-center justify-center text-center">
                            <span className="font-display font-bold text-lg text-primary">{item.topico}</span>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
                            <div className="p-4 md:p-6 space-y-2">
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{bio.nome}</span>
                              <p className="text-sm text-zinc-300 leading-relaxed">{item.personagem}</p>
                            </div>
                            <div className="p-4 md:p-6 space-y-2 bg-red-500/5">
                              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{currentTab.tabela!.oponenteNome}</span>
                              <p className="text-sm text-zinc-300 leading-relaxed">{item.oponente}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Timeline Render */}
                  {currentTab?.timeline && (
                    <div className="relative border-l-2 border-primary/30 ml-4 md:ml-6 space-y-8 pb-4">
                      {currentTab.timeline.map((item, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="relative pl-6 md:pl-8"
                        >
                          <motion.div 
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", delay: (i * 0.1) + 0.2 }}
                            className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary" 
                          />
                          <div className="flex flex-col gap-1">
                            <span className="font-display font-bold text-primary text-sm tracking-widest">{item.ano}</span>
                            <h3 className="text-xl font-bold text-white mb-1">{item.evento}</h3>
                            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">{item.detalhe}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

      </motion.div>
    </div>,
    document.body
  );
};

export default BiografiaArtigoView;
