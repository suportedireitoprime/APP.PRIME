import React, { useState, Suspense, lazy } from 'react';
import { X, Book, Wand2, Cpu, ChevronRight, ArrowLeft, PlayCircle } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useNavigate } from 'react-router-dom';
import AnimacaoExemplo from '@/components/laboratorio/AnimacaoExemplo';
import AnimacaoPixi from '@/components/laboratorio/AnimacaoPixi';
import AnimacaoThreeJs from '@/components/laboratorio/AnimacaoThreeJs';
import DynamicSceneLoader from '@/components/laboratorio/DynamicSceneLoader';
import AIGeneratorPanel from '@/components/laboratorio/AIGeneratorPanel';
import { motion, AnimatePresence } from 'framer-motion';

const CenaArtigo2 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo2'));
const CenaArtigo3 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo3'));
const CenaArtigo4 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo4'));
const CenaArtigo4Pixi = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo4Pixi'));
const CenaArtigo37 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo37'));
const CenaArtigo121 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo121'));
const CenaArtigo155 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo155'));
const CenaArtigo171 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo171'));
const CenaArtigo312 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo312'));

const AdminLaboratorio = () => {
  const navigate = useNavigate();
  // Estado null significa que estamos na "lista/menu"
  const [activeTab, setActiveTab] = useState<'cenas' | 'generator' | null>(null);
  const [activeEngine, setActiveEngine] = useState('threejs');
  const [activeArtigoId, setActiveArtigoId] = useState<number | null>(null);
  const [showPenalModal, setShowPenalModal] = useState(false);

  const engines = [
    { id: 'threejs', name: 'Three.js (3D)', desc: '100% Code 3D. O melhor para visualizações imersivas e cinematográficas com iluminação volumétrica nativa.' },
    { id: 'pixi', name: 'PixiJS (WebGL)', desc: 'Performance extrema em 2D com filtros nativos de GPU (Blur, Glow). Ideal para interatividade rápida.' },
    { id: 'css', name: 'CSS Puro', desc: 'Levíssimo e direto no DOM, sem bibliotecas externas. Ideal para UI e máquinas de estado simples.' },
  ];

  const artigosCurados = [
    { artigo: 'Art. 2º - Abolitio Criminis', desc: 'Ninguém pode ser punido por fato que lei posterior deixa de considerar crime.', engineId: 'art2' },
    { artigo: 'Art. 3º - Lei Temporária', desc: 'Aplica-se ao fato praticado durante sua vigência, mesmo após revogada.', engineId: 'art3' },
    { artigo: 'Art. 4º - Tempo do Crime (3D)', desc: 'Considera-se praticado o crime no momento da ação ou omissão.', engineId: 'art4' },
    { artigo: 'Art. 4º - Tempo do Crime (PixiJS)', desc: 'Versão leve em 2D usando PixiJS.', engineId: 'art4pixi' },
    { artigo: 'Art. 37 - Mulheres na Prisão', desc: 'Estabelecimento próprio e respeito à condição pessoal.', engineId: 'art37' },
    { artigo: 'Art. 121 - Homicídio', desc: 'Matar alguém.', engineId: 'art121' },
    { artigo: 'Art. 155 - Furto', desc: 'Subtrair, para si ou para outrem, coisa alheia móvel.', engineId: 'art155' },
    { artigo: 'Art. 157 - Roubo (Cel-Shading)', desc: 'Subtrair coisa móvel alheia, mediante grave ameaça ou violência.', engineId: 'threejs' },
    { artigo: 'Art. 171 - Estelionato', desc: 'Obter vantagem ilícita, induzindo ou mantendo alguém em erro.', engineId: 'art171' },
    { artigo: 'Art. 312 - Peculato', desc: 'Apropriar-se o funcionário público de dinheiro, valor ou qualquer outro bem...', engineId: 'art312' }
  ];

  return (
    <div className="min-h-dvh bg-[#0D0D0D] pb-8 overflow-x-hidden">
      <PageHeader 
        title="Laboratório de Animações" 
        onBack={() => {
          if (activeTab) setActiveTab(null);
          else navigate('/');
        }} 
      />
      
      <div className="px-4 sm:px-6 py-6 w-full max-w-5xl mx-auto flex flex-col">
        <AnimatePresence mode="wait">
          {!activeTab ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 w-full"
            >
              <div className="mb-6">
                <h1 className="text-3xl font-display font-bold text-white mb-2">Escolha o Laboratório</h1>
                <p className="text-muted-foreground text-sm">Selecione o ambiente que deseja explorar ou construir novas experiências cinematográficas.</p>
              </div>

              {/* Lista Vertical de Opções */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('cenas')}
                className="group relative overflow-hidden bg-secondary/20 border border-border/50 hover:border-primary/50 rounded-2xl p-6 flex items-center justify-between transition-all w-full shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-5 relative z-10 text-left w-full">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                    <PlayCircle size={28} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">Cenários & Curadoria (Motores)</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">Explore animações oficiais e renderizações de alta performance em 3D, WebGL e CSS Puro.</p>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors relative z-10 flex-shrink-0" size={24} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('generator')}
                className="group relative overflow-hidden bg-secondary/20 border border-border/50 hover:border-indigo-500/50 rounded-2xl p-6 flex items-center justify-between transition-all w-full shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-5 relative z-10 text-left w-full">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                    <Cpu size={28} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">Gerador Automático (Agent IA)</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">Crie novas animações e interações dinâmicas orquestrando inteligência artificial em tempo real.</p>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-indigo-400 transition-colors relative z-10 flex-shrink-0" size={24} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-4 w-full"
            >
              {/* Tab 1: Cenas Curadas */}
              {activeTab === 'cenas' && (
                <div className="bg-secondary/20 border border-border/50 rounded-2xl p-4 sm:p-6 w-full shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-semibold mb-1 text-white">Visualizador de Cenas</h2>
                      <p className="text-sm text-muted-foreground">
                        Explore animações oficiais criadas pelos motores 3D e 2D.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPenalModal(true)}
                      className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    >
                      <Book size={18} />
                      Código Penal 3D (Cenas)
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {engines.map(engine => (
                      <button
                        key={engine.id}
                        onClick={() => { setActiveEngine(engine.id); setActiveArtigoId(null); }}
                        className={`flex-1 min-w-[120px] px-3 py-3 rounded-lg sm:rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                          activeEngine === engine.id 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/30 hover:text-white'
                        }`}
                      >
                        {engine.name}
                      </button>
                    ))}
                  </div>

                  {/* Área de Visualização */}
                  <div className="bg-[#050505] border border-border/50 rounded-2xl min-h-[500px] w-full shadow-2xl relative flex items-center justify-center overflow-hidden">
                    {activeEngine === 'threejs' && <AnimacaoThreeJs />}
                    {activeEngine === 'pixi' && <AnimacaoPixi />}
                    {activeEngine === 'css' && <AnimacaoExemplo />}
                    
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-muted-foreground">Carregando cena curada...</div>}>
                      {activeEngine === 'art2' && <CenaArtigo2 />}
                      {activeEngine === 'art3' && <CenaArtigo3 />}
                      {activeEngine === 'art4' && <CenaArtigo4 />}
                      {activeEngine === 'art4pixi' && <CenaArtigo4Pixi />}
                      {activeEngine === 'art37' && <CenaArtigo37 />}
                      {activeEngine === 'art121' && <CenaArtigo121 />}
                      {activeEngine === 'art155' && <CenaArtigo155 />}
                      {activeEngine === 'art171' && <CenaArtigo171 />}
                      {activeEngine === 'art312' && <CenaArtigo312 />}
                    </Suspense>

                    {activeEngine === 'dynamic' && activeArtigoId !== null && (
                      <DynamicSceneLoader codigo_nome="CP" artigo_numero={activeArtigoId} />
                    )}
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none opacity-40 z-10">
                      <span className="text-[10px] font-mono tracking-widest text-primary drop-shadow-md">RENDER_TARGET: {activeEngine.toUpperCase()}</span>
                      <span className="text-[10px] font-mono tracking-widest text-primary drop-shadow-md">60 FPS</span>
                    </div>
                  </div>
                  
                  {(activeEngine === 'threejs' || activeEngine === 'pixi' || activeEngine === 'css') && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 bg-primary/5 border border-primary/20 p-5 rounded-xl flex items-start gap-3"
                    >
                      <div className="mt-0.5 text-primary">
                        <Wand2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-primary mb-1">Por que escolhemos este?</h3>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {engines.find(e => e.id === activeEngine)?.desc}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Tab 2: Gerador de IA */}
              {activeTab === 'generator' && (
                <div className="w-full h-[85vh] min-h-[600px] bg-secondary/10 rounded-2xl overflow-hidden border border-border/50 shadow-2xl relative">
                  <AIGeneratorPanel />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Código Penal (Curados + Dinâmicos) */}
      <AnimatePresence>
        {showPenalModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowPenalModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f172a] border border-border/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border/30 bg-[#1e293b]/80 backdrop-blur-sm z-10 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Book className="text-amber-500" size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">Cenas do Código Penal</h2>
                </div>
                <button 
                  onClick={() => setShowPenalModal(false)} 
                  className="p-2 rounded-full text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                
                <div className="relative">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                    Cenas Curadas (Alta Qualidade)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {artigosCurados.map((art, idx) => (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        key={idx} 
                        className="bg-[#1e293b]/50 border border-border/30 rounded-xl p-5 flex flex-col justify-between hover:border-amber-500/50 hover:bg-[#1e293b] transition-all group"
                      >
                        <div>
                          <h4 className="text-md font-bold text-amber-400 mb-2 group-hover:text-amber-300">{art.artigo}</h4>
                          <p className="text-sm text-foreground/70 mb-4 line-clamp-3 leading-relaxed">{art.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveEngine(art.engineId);
                            setActiveArtigoId(null);
                            setShowPenalModal(false);
                          }}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black font-semibold transition-colors text-sm"
                        >
                          <Wand2 size={16} />
                          Visualizar Cena
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLaboratorio;
