import React, { useState, useEffect } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

const AnimacaoExemplo = () => {
  const [step, setStep] = useState(0);

  // Carrega uma animação Rive de demonstração
  // Neste caso, um mascote genérico, pronto para ser substituído pelo `.riv` final do assalto.
  const { rive, RiveComponent } = useRive({
    src: 'https://cdn.rive.app/animations/vehicles.riv',
    stateMachines: 'bumpy', // Máquina de estado genérica do arquivo de demo
    autoplay: true,
    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
  });

  // Simula o andamento da animação (tempo da explicação)
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
      {/* Container Rive */}
      <div className="relative w-full max-w-sm h-48 overflow-hidden rounded-md bg-zinc-900 border border-border/50">
        <RiveComponent className="w-full h-full" />
      </div>

      {/* Texto Explicativo (Sincronizado) */}
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
