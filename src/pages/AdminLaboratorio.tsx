import React, { useState } from 'react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useNavigate } from 'react-router-dom';
import AnimacaoExemplo from '@/components/laboratorio/AnimacaoExemplo';
import AnimacaoPixi from '@/components/laboratorio/AnimacaoPixi';
import AnimacaoThreeJs from '@/components/laboratorio/AnimacaoThreeJs';

const AdminLaboratorio = () => {
  const navigate = useNavigate();
  const [activeEngine, setActiveEngine] = useState('threejs');

  const engines = [
    { id: 'threejs', name: 'Three.js (3D)', desc: '100% Code 3D. O melhor para visualizações imersivas e cinematográficas com iluminação volumétrica nativa.' },
    { id: 'pixi', name: 'PixiJS (WebGL)', desc: 'Performance extrema em 2D com filtros nativos de GPU (Blur, Glow). Ideal para interatividade rápida.' },
    { id: 'css', name: 'CSS Puro', desc: 'Levíssimo e direto no DOM, sem bibliotecas externas. Ideal para UI e máquinas de estado simples.' },
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
          
          <div className="flex flex-wrap gap-3 mb-8">
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

          {/* Área de Visualização */}
          <div className="bg-background border-y sm:border sm:rounded-xl border-border/50 min-h-[500px] w-full shadow-inner relative flex items-center justify-center">
            {activeEngine === 'threejs' && <AnimacaoThreeJs />}
            {activeEngine === 'pixi' && <AnimacaoPixi />}
            {activeEngine === 'css' && <AnimacaoExemplo />}
            
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
    </div>
  );
};

export default AdminLaboratorio;
