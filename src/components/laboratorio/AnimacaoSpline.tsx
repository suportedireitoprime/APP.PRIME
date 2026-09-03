import React, { useEffect, useState } from 'react';
import Spline from '@splinetool/react-spline';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const TIMELINE = [
  { step: 0, duration: 3000, text: "Aguardando carregamento da cena Spline 3D da nuvem..." },
  { step: 1, duration: 4000, text: "Spline: Ferramenta de Design 3D no navegador." },
  { step: 2, duration: 4000, text: "Gera um componente React que carrega o modelo exportado." },
];

const AnimacaoSpline = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const nextStep = () => {
      setCurrentIdx((prev) => {
        const next = prev + 1;
        if (next >= TIMELINE.length) return 0;
        return next;
      });
    };
    timeout = setTimeout(nextStep, TIMELINE[currentIdx].duration);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="relative w-full h-[350px] overflow-hidden rounded-xl border border-border/50 shadow-2xl bg-[#070c17]">
        <ErrorBoundary>
          {/* Using a public Spline scene URL for demonstration */}
          <Spline 
            scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" 
            onLoad={() => setIsLoading(false)}
          />
        </ErrorBoundary>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#070c17]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-white/70">Carregando Cena da Nuvem (Spline)...</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full z-10 pointer-events-none">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            Spline 3D Cloud
          </span>
        </div>
      </div>
      
      <div className="mt-6 text-center h-24 w-full px-4 max-w-xl">
        <p className="text-lg font-body font-medium text-foreground transition-opacity duration-300">
          {TIMELINE[currentIdx].text}
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {TIMELINE.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-primary shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'w-2 bg-muted'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimacaoSpline;
