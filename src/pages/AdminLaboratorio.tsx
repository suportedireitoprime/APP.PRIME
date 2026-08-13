import React, { useState, Suspense, lazy } from 'react';
import { X, Book, Wand2, Cpu } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useNavigate } from 'react-router-dom';
import AnimacaoExemplo from '@/components/laboratorio/AnimacaoExemplo';
import AnimacaoPixi from '@/components/laboratorio/AnimacaoPixi';
import AnimacaoThreeJs from '@/components/laboratorio/AnimacaoThreeJs';
import DynamicSceneLoader from '@/components/laboratorio/DynamicSceneLoader';
import AIGeneratorPanel from '@/components/laboratorio/AIGeneratorPanel';

const CenaArtigo2 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo2'));
const CenaArtigo3 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo3'));
const CenaArtigo121 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo121'));
const CenaArtigo155 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo155'));
const CenaArtigo171 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo171'));
const CenaArtigo312 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo312'));

const AdminLaboratorio = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cenas' | 'generator'>('cenas');
  const [activeEngine, setActiveEngine] = useState('threejs');
  const [activeArtigoId, setActiveArtigoId] = useState<number | null>(null);

  const engines = [
    { id: 'threejs', name: 'Three.js (3D)', desc: '100% Code 3D. O melhor para visualizações imersivas e cinematográficas com iluminação volumétrica nativa.' },
    { id: 'pixi', name: 'PixiJS (WebGL)', desc: 'Performance extrema em 2D com filtros nativos de GPU (Blur, Glow). Ideal para interatividade rápida.' },
    { id: 'css', name: 'CSS Puro', desc: 'Levíssimo e direto no DOM, sem bibliotecas externas. Ideal para UI e máquinas de estado simples.' },
  ];

  const [showPenalModal, setShowPenalModal] = useState(false);

  const artigosCurados = [
    { artigo: 'Art. 2º - Abolitio Criminis', desc: 'Ninguém pode ser punido por fato que lei posterior deixa de considerar crime.', engineId: 'art2' },
    { artigo: 'Art. 3º - Lei Temporária', desc: 'Aplica-se ao fato praticado durante sua vigência, mesmo após revogada.', engineId: 'art3' },
    { artigo: 'Art. 121 - Homicídio', desc: 'Matar alguém.', engineId: 'art121' },
    { artigo: 'Art. 155 - Furto', desc: 'Subtrair, para si ou para outrem, coisa alheia móvel.', engineId: 'art155' },
    { artigo: 'Art. 157 - Roubo (Cel-Shading)', desc: 'Subtrair coisa móvel alheia, mediante grave ameaça ou violência.', engineId: 'threejs' },
    { artigo: 'Art. 171 - Estelionato', desc: 'Obter vantagem ilícita, induzindo ou mantendo alguém em erro.', engineId: 'art171' },
    { artigo: 'Art. 312 - Peculato', desc: 'Apropriar-se o funcionário público de dinheiro, valor ou qualquer outro bem...', engineId: 'art312' }
  ];

  // Gera lista de artigos de 1 a 359 para o grid dinâmico
  const artigosGerais = Array.from({ length: 359 }, (_, i) => i + 1);

  return (
    <div className="min-h-dvh bg-background pb-8">
      <PageHeader title="Laboratório de Animações" onBack={() => navigate('/')} />
      
      <div className="px-2 sm:px-4 py-4 space-y-4 w-full max-w-full overflow-x-hidden flex flex-col items-center">
        
        {/* Navegação Principal do Laboratório (Abas Responsivas) */}
        <div className="w-full max-w-5xl bg-secondary/30 p-1.5 rounded-xl sm:rounded-full border border-border/50 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveTab('cenas')}
            className={`flex-1 py-3 px-4 rounded-lg sm:rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'cenas' 
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' 
              : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
            }`}
          >
            <Book size={18} />
            Cenas Curadas & Motores
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-3 px-4 rounded-lg sm:rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'generator' 
              ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-[1.02]' 
              : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
            }`}
          >
            <Cpu size={18} />
            Gerador Automático (Agent IA)
          </button>
        </div>

        {/* Tab 1: Cenas Curadas */}
        {activeTab === 'cenas' && (
          <div className="bg-secondary/20 border border-border/50 rounded-xl p-3 sm:p-4 w-full max-w-5xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-display font-semibold mb-1">Visualizador de Cenas</h2>
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
            
            <div className="flex flex-wrap gap-2 mb-4">
              {engines.map(engine => (
                <button
                  key={engine.id}
                  onClick={() => { setActiveEngine(engine.id); setActiveArtigoId(null); }}
                  className={`flex-1 min-w-[120px] px-3 py-2.5 rounded-lg sm:rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                    activeEngine === engine.id 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/30'
                  }`}
                >
                  {engine.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPenalModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
              <Book size={18} />
              Código Penal 3D
            </button>

          {/* Área de Visualização */}
          <div className="bg-background border-y sm:border sm:rounded-xl border-border/50 min-h-[500px] w-full shadow-inner relative flex items-center justify-center">
            {activeEngine === 'threejs' && <AnimacaoThreeJs />}
            {activeEngine === 'pixi' && <AnimacaoPixi />}
            {activeEngine === 'css' && <AnimacaoExemplo />}
            
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-muted-foreground">Carregando cena curada...</div>}>
              {activeEngine === 'art2' && <CenaArtigo2 />}
              {activeEngine === 'art3' && <CenaArtigo3 />}
              {activeEngine === 'art121' && <CenaArtigo121 />}
              {activeEngine === 'art155' && <CenaArtigo155 />}
              {activeEngine === 'art171' && <CenaArtigo171 />}
              {activeEngine === 'art312' && <CenaArtigo312 />}
            </Suspense>

            {activeEngine === 'dynamic' && activeArtigoId !== null && (
              <DynamicSceneLoader codigo_nome="CP" artigo_numero={activeArtigoId} />
            )}
            
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none opacity-40">
              <span className="text-[10px] font-mono tracking-widest text-primary">RENDER_TARGET: {activeEngine.toUpperCase()}</span>
              <span className="text-[10px] font-mono tracking-widest text-primary">60 FPS</span>
            </div>
          </div>
          
          {(activeEngine === 'threejs' || activeEngine === 'pixi' || activeEngine === 'css') && (
            <div className="mt-6 bg-primary/10 border border-primary/20 p-4 rounded-lg">
              <h3 className="text-sm font-bold text-primary mb-1">Por que escolhemos este?</h3>
              <p className="text-sm text-foreground/80">
                {engines.find(e => e.id === activeEngine)?.desc}
              </p>
            </div>
          )}

          </div>
        )}

        {/* Tab 2: Gerador de IA */}
        {activeTab === 'generator' && (
          <div className="w-full max-w-5xl h-[80vh] min-h-[600px]">
            <AIGeneratorPanel />
          </div>
        )}

      </div>

      {/* Modal Código Penal (Curados + Dinâmicos) */}
      {showPenalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowPenalModal(false)}>
          <div 
            className="bg-[#0f172a] border border-border/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-[#1e293b]/50">
              <div className="flex items-center gap-3">
                <Book className="text-amber-500" size={24} />
                <h2 className="text-2xl font-display font-bold text-white">Cenas do Código Penal</h2>
              </div>
              <button onClick={() => setShowPenalModal(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Seção 1: Curados (Hardcoded) */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  Cenas Curadas (Alta Qualidade)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {artigosCurados.map((art, idx) => (
                    <div key={idx} className="bg-secondary/30 border border-border/50 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition-colors">
                      <div>
                        <h4 className="text-md font-bold text-amber-400 mb-1">{art.artigo}</h4>
                        <p className="text-xs text-foreground/80 mb-3">{art.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveEngine(art.engineId);
                          setActiveArtigoId(null);
                          setShowPenalModal(false);
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-colors text-sm"
                      >
                        <Wand2 size={14} />
                        Ver Cena Cinematográfica
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-border/30" />

              {/* Seção 2: Gerador Antigo (Link para aba nova) */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Cpu className="text-indigo-400" size={20} />
                  Deseja gerar uma cena inédita?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  O antigo gerador dinâmico foi substituído. Acesse o novo Laboratório de Agentes (Aba Gerador Automático).
                </p>
                <button
                  onClick={() => {
                    setShowPenalModal(false);
                    setActiveTab('generator');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg w-full transition-colors flex items-center justify-center gap-2"
                >
                  <Wand2 size={18} />
                  Ir para Gerador de IA Avançado
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLaboratorio;
