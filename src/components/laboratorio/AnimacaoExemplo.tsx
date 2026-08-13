import React, { useState, useEffect } from 'react';

const AnimacaoExemplo = () => {
  const [step, setStep] = useState(0);

  // Simula o andamento da animação (tempo da explicação)
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < 2 ? prev + 1 : 0));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const stepsText = [
    "Subtrair coisa móvel alheia, para si ou para outrem...",
    "mediante grave ameaça ou violência a pessoa...",
    "Pena - reclusão, de quatro a dez anos, e multa."
  ];

  // Um sprite sheet SVG embutido como Base64 (Placeholder leve)
  // Contém 4 quadros de um bonequinho estilo "ladrão" genérico correndo.
  const spriteBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAyMDAgNTAiPgogIDwhLS0gRnJhbWUgMSAtLT4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLCAwKSI+PGNpcmNsZSBjeD0iMjUiIGN5PSIxNSIgcj0iNSIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0yNSAyMCB2MTUgTTI1IDI1IGwtNSA1IE0yNSAyNSBsNSA1IE0yNSAzNSBsLTUgMTAgTTI1IDM1IGw1IDEwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvZz4KICA8IS0tIEZyYW1lIDIgLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTAsIDApIj48Y2lyY2xlIGN4PSIyNSIgY3k9IjE1IiByPSI1IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTI1IDIwIHYxNSBNMjUgMjMgbC04IDIgTTI1IDIzIGw4IDIgTTI1IDM1IGwtOCA1IE0yNSAzNSBsOCA1IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvZz4KICA8IS0tIEZyYW1lIDMgLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLCAwKSI+PGNpcmNsZSBjeD0iMjUiIGN5PSIxNSIgcj0iNSIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0yNSAyMCB2MTUgTTI1IDI3IGwtNSAtNSBNMjUgMjcgbDUgLTUgTTI1IDM1IGwtNSAxMCBNMjUgMzUgbDUgMTAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PC9nPgogIDwhLS0gRnJhbWUgNCAtLT4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNTAsIDApIj48Y2lyY2xlIGN4PSIyNSIgY3k9IjE1IiByPSI1IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTI1IDIwIHYxNSBNMjUgMjUgbC01IDUgTTI1IDI1IGw1IDUgTTI1IDM1IGwtMiAxMCBNMjUgMzUgbDggMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L2c+Cjwvc3ZnPg==";

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Cena da Animação */}
      <div className="relative w-full max-w-sm h-48 bg-zinc-900 rounded-lg overflow-hidden border border-border flex items-end pb-4">
        
        {/* CSS para animar o Sprite */}
        <style>{`
          .sprite-animation {
            width: 50px;
            height: 50px;
            background-image: url('${spriteBase64}');
            animation: playSprite 0.6s steps(4) infinite, moveRight 6s linear infinite;
          }
          @keyframes playSprite {
            from { background-position: 0px; }
            to { background-position: -200px; }
          }
          @keyframes moveRight {
            from { transform: translateX(-50px); }
            to { transform: translateX(400px); }
          }
        `}</style>
        
        {/* O Bonequinho */}
        <div className="sprite-animation absolute bottom-8 left-0"></div>
        
        {/* Vítima estática (outro sprite placeholder) */}
        <div className="absolute bottom-8 right-12 w-[50px] h-[50px] flex items-center justify-center">
           <svg width="50" height="50" viewBox="0 0 50 50">
             <circle cx="25" cy="15" r="5" fill="#eab308"/>
             <path d="M25 20 v15 M25 25 l-5 10 M25 25 l5 10 M25 35 l-5 10 M25 35 l5 10" stroke="#eab308" strokeWidth="2" fill="none"/>
           </svg>
        </div>

        {/* Chão */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-zinc-800 border-t border-border/50"></div>
      </div>

      {/* Texto Explicativo (Sincronizado) */}
      <div className="mt-6 text-center h-16">
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
