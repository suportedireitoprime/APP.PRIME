import React, { useState, useEffect, useRef, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy-load heavy 3D deps so the page itself doesn't crash on import
const ThreeScene = React.lazy(() => import('./AnimacaoExemplo3DScene'));

// --- Componente Principal ---

const AnimacaoExemplo = () => {
  const [step, setStep] = useState(0);

  // Simula o andamento da animação
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < 2 ? prev + 1 : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const stepsText = [
    "Subtrair coisa móvel alheia, para si ou para outrem...",
    "mediante grave ameaça ou violência a pessoa...",
    "Pena - reclusão, de quatro a dez anos, e multa."
  ];

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Container 3D */}
      <div className="relative w-full h-[300px] overflow-hidden rounded-md bg-zinc-900 border border-border/50">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
              Carregando cena 3D…
            </div>
          }>
            <ThreeScene step={step} />
          </Suspense>
        </ErrorBoundary>

        {/* Efeito de sirene no step 2 */}
        {step === 2 && (
          <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay">
            <div className="w-full h-full animate-siren bg-red-500/20" style={{ animation: "siren 1s infinite alternate" }} />
            <style>{`
              @keyframes siren {
                0% { opacity: 0; background-color: rgba(239,68,68,0.2); }
                50% { opacity: 1; background-color: rgba(239,68,68,0.2); }
                51% { opacity: 0; background-color: rgba(59,130,246,0.2); }
                100% { opacity: 1; background-color: rgba(59,130,246,0.2); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Texto Explicativo */}
      <div className="mt-6 text-center h-20 w-full px-2">
        <p className="text-lg font-body font-medium text-foreground transition-opacity duration-300">
          {stepsText[step]}
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-primary' : 'w-2 bg-muted'}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimacaoExemplo;
