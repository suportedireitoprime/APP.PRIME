import React, { useState, Suspense, lazy } from 'react';
import { X, Book, Wand2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useNavigate } from 'react-router-dom';
import AnimacaoExemplo from '@/components/laboratorio/AnimacaoExemplo';
import AnimacaoPixi from '@/components/laboratorio/AnimacaoPixi';
import AnimacaoThreeJs from '@/components/laboratorio/AnimacaoThreeJs';

const CenaArtigo121 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo121'));
const CenaArtigo155 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo155'));
const CenaArtigo171 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo171'));
const CenaArtigo312 = lazy(() => import('@/components/laboratorio/cenas/CenaArtigo312'));

const AdminLaboratorio = () => {
  const navigate = useNavigate();
  const [activeEngine, setActiveEngine] = useState('threejs');

  const engines = [
    { id: 'threejs', name: 'Three.js (3D)', desc: '100% Code 3D. O melhor para visualizações imersivas e cinematográficas com iluminação volumétrica nativa.' },
    { id: 'pixi', name: 'PixiJS (WebGL)', desc: 'Performance extrema em 2D com filtros nativos de GPU (Blur, Glow). Ideal para interatividade rápida.' },
    { id: 'css', name: 'CSS Puro', desc: 'Levíssimo e direto no DOM, sem bibliotecas externas. Ideal para UI e máquinas de estado simples.' },
  ];

  const [showPenalModal, setShowPenalModal] = useState(false);

  const artigosPenais = [
    { 
      artigo: 'Art. 121 - Homicídio', 
      desc: 'Matar alguém.',
    },
    { 
      artigo: 'Art. 155 - Furto', 
      desc: 'Subtrair, para si ou para outrem, coisa alheia móvel.',
    },
    { 
      artigo: 'Art. 157 - Roubo', 
      desc: 'Subtrair mediante grave ameaça ou violência.',
    },
    { 
      artigo: 'Art. 171 - Estelionato', 
      desc: 'Obter vantagem ilícita, induzindo ou mantendo alguém em erro.',
    },
    { 
      artigo: 'Art. 312 - Peculato', 
      desc: 'Apropriar-se o funcionário público de dinheiro, valor ou qualquer outro bem...',
    }
  ];

  return (
    <div className="min-h-dvh bg-background pb-8">
      <PageHeader title="Laboratório de Animações" onBack={() => navigate('/')} />
      
      <div className="px-0 sm:px-4 py-4 space-y-6 w-full max-w-full overflow-x-hidden">
        
        <div className="bg-secondary/20 border border-border/50 rounded-xl p-4 mx-2 sm:mx-0">
          <h2 className="text-xl font-display font-semibold mb-2">Motores Gráficos Oficiais</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Estes são os três motores selecionados para a produção em massa das animações legais.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-8 justify-between items-center">
            <div className="flex flex-wrap gap-3">
              {engines.map(engine => (
                <button
                  key={engine.id}
                  onClick={() => setActiveEngine(engine.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    activeEngine === engine.id 
                    ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.6)] scale-105' 
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
              Código Penal
            </button>
          </div>

          {/* Área de Visualização */}
          <div className="bg-background border-y sm:border sm:rounded-xl border-border/50 min-h-[500px] w-full shadow-inner relative flex items-center justify-center">
            {activeEngine === 'threejs' && <AnimacaoThreeJs />}
            {activeEngine === 'pixi' && <AnimacaoPixi />}
            {activeEngine === 'css' && <AnimacaoExemplo />}
            
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-muted-foreground">Carregando cena...</div>}>
              {activeEngine === 'art121' && <CenaArtigo121 />}
              {activeEngine === 'art155' && <CenaArtigo155 />}
              {activeEngine === 'art157' && <AnimacaoThreeJs />}
              {activeEngine === 'art171' && <CenaArtigo171 />}
              {activeEngine === 'art312' && <CenaArtigo312 />}
            </Suspense>
            
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none opacity-40">
              <span className="text-[10px] font-mono tracking-widest text-primary">RENDER_TARGET: {activeEngine.toUpperCase()}</span>
              <span className="text-[10px] font-mono tracking-widest text-primary">60 FPS</span>
            </div>
          </div>
          
          <div className="mt-6 bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-primary mb-1">Por que escolhemos este?</h3>
            <p className="text-sm text-foreground/80">
              {engines.find(e => e.id === activeEngine)?.desc}
            </p>
          </div>

        </div>
      </div>

      {/* Modal Código Penal */}
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <p className="text-muted-foreground text-sm">
                Selecione um artigo abaixo para visualizar instantaneamente a cena 3D correspondente gerada com Vanilla Three.js / R3F. A inteligência criará toda a cinematografia do crime em tempo real.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {artigosPenais.map((art, idx) => (
                  <div key={idx} className="bg-secondary/30 border border-border/50 rounded-xl p-5 flex flex-col justify-between hover:border-amber-500/50 transition-colors">
                    <div>
                      <h3 className="text-lg font-bold text-amber-400 mb-1">{art.artigo}</h3>
                      <p className="text-sm text-foreground/80 mb-4">{art.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        const match = art.artigo.match(/\d+/);
                        if (match) {
                          setActiveEngine(`art${match[0]}`);
                          setShowPenalModal(false);
                        }
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-colors"
                    >
                      <Wand2 size={16} />
                      Renderizar Cena 3D
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLaboratorio;
