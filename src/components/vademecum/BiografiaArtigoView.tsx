import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { haptic } from '@/lib/nativeHaptics';
import { getBiografiaById } from '@/data/biografias';

interface Props {
  personagemId: string;
  onBack: () => void;
}

export const BiografiaArtigoView = ({ personagemId, onBack }: Props) => {
  const bio = getBiografiaById(personagemId);
  const [activeTab, setActiveTab] = useState(bio?.tabs[0]?.id || '');

  if (!bio) {
    return (
      <div className="p-8 text-center text-muted-foreground">Biografia não encontrada.</div>
    );
  }

  const currentTab = bio.tabs.find((t) => t.id === activeTab);

  return (
    <div className="w-full bg-background min-h-screen pb-32">
      {/* Hero Header */}
      <div className="relative w-full h-[300px] md:h-[400px]">
        {bio.imagemUrl ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bio.imagemUrl})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-background to-secondary" />
        )}
        
        {/* Navbar */}
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex items-center justify-between z-10">
          <button 
            onClick={() => { haptic.selection(); onBack(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

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
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 md:px-0 pt-4 pb-0 mb-8 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 pb-2 min-w-max px-2">
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
        <div className="px-6 md:px-0">
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
                    <div key={i} className="bg-card rounded-2xl border border-border/40 overflow-hidden flex flex-col md:flex-row">
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
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline Render */}
              {currentTab?.timeline && (
                <div className="relative border-l-2 border-primary/30 ml-4 md:ml-6 space-y-8 pb-4">
                  {currentTab.timeline.map((item, i) => (
                    <div key={i} className="relative pl-6 md:pl-8">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                      <div className="flex flex-col gap-1">
                        <span className="font-display font-bold text-primary text-sm tracking-widest">{item.ano}</span>
                        <h3 className="text-xl font-bold text-white mb-1">{item.evento}</h3>
                        <p className="text-zinc-400 text-sm md:text-base leading-relaxed">{item.detalhe}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BiografiaArtigoView;
