import React, { useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const TIMELINE = [
  { step: 0, duration: 2000, text: "Cena: Rua deserta. A vítima está distraída..." },
  { step: 1, duration: 1500, text: "O agente se aproxima de forma sorrateira e agressiva..." },
  { step: 2, duration: 2000, text: "Grave ameaça: o agente saca a arma. A vítima se rende." },
  { step: 3, duration: 1500, text: "Subtração: o agente toma a coisa alheia móvel (bolsa)." },
  { step: 4, duration: 2000, text: "Posse invertida: o agente empreende fuga em posse do bem." },
  { step: 5, duration: 1000, text: "O alarme soa! A justiça o alcança..." },
  { step: 6, duration: 3500, text: "Art 157. Pena: Reclusão de quatro a dez anos, e multa." },
];

const GSAPScene = ({ step }: { step: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const robberRef = useRef<SVGGElement>(null);
  const victimRef = useRef<SVGGElement>(null);
  const bagRef = useRef<SVGGElement>(null);
  const gunRef = useRef<SVGGElement>(null);
  const jailRef = useRef<SVGGElement>(null);
  const sirenRedRef = useRef<SVGRectElement>(null);
  const sirenBlueRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    // Load GSAP dynamically
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";
    script.async = true;
    script.onload = () => {
      // Setup initial state once GSAP loads
      const gsap = (window as any).gsap;
      if (!gsap) return;
      
      gsap.set(robberRef.current, { x: -100 });
      gsap.set(bagRef.current, { x: 340, y: 150 });
      gsap.set(jailRef.current, { y: -200 });
      gsap.set(gunRef.current, { opacity: 0, rotation: 90 });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const gsap = (window as any).gsap;
    if (!gsap || !robberRef.current) return;

    // Reset everything for strict sync
    gsap.killTweensOf("*");
    
    switch (step) {
      case 0:
        gsap.to(robberRef.current, { x: -100, duration: 0.5 });
        gsap.to(gunRef.current, { opacity: 0, rotation: 90, duration: 0.2 });
        gsap.to(victimRef.current, { x: 0, rotation: 0, opacity: 1, duration: 0.5 });
        gsap.to(bagRef.current, { x: 340, y: 150, duration: 0.5 });
        gsap.to(jailRef.current, { y: -200, duration: 0.5 });
        gsap.to([sirenRedRef.current, sirenBlueRef.current], { opacity: 0, duration: 0.2 });
        break;

      case 1:
        gsap.to(robberRef.current, { x: 150, duration: 1, ease: "power2.out" });
        // Walking bounce effect
        gsap.to(robberRef.current, { y: -10, duration: 0.2, yoyo: true, repeat: 4 });
        break;

      case 2: // Threat
        gsap.to(gunRef.current, { opacity: 1, rotation: 0, duration: 0.3 });
        // Victim hands up and tremble
        gsap.to(victimRef.current, { x: "+=5", yoyo: true, repeat: 20, duration: 0.05 });
        // Bag falls
        gsap.to(bagRef.current, { x: 300, y: 220, rotation: 90, duration: 0.4, ease: "bounce.out" });
        break;

      case 3: // Steal
        gsap.to(bagRef.current, { x: 180, y: 160, rotation: -20, duration: 0.5, ease: "power2.inOut" });
        gsap.to(gunRef.current, { rotation: 45, duration: 0.3 });
        break;

      case 4: // Run
        // Flip robber (scaleX) via GSAP
        gsap.to(robberRef.current, { scaleX: -1, transformOrigin: "center center", duration: 0.2 });
        gsap.to(robberRef.current, { x: 450, duration: 1.5, ease: "power1.in" });
        gsap.to(robberRef.current, { y: -10, duration: 0.2, yoyo: true, repeat: 7 });
        // Bag follows
        gsap.to(bagRef.current, { x: 420, duration: 1.5, ease: "power1.in" });
        break;

      case 5: // Sirens
        gsap.to(sirenRedRef.current, { opacity: 0.3, duration: 0.5, yoyo: true, repeat: -1 });
        gsap.to(sirenBlueRef.current, { opacity: 0.3, duration: 0.5, delay: 0.25, yoyo: true, repeat: -1 });
        break;

      case 6: // Jail
        gsap.to(jailRef.current, { y: 100, duration: 0.4, ease: "bounce.out" });
        break;
    }
  }, [step]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#070c17] rounded-xl overflow-hidden relative">
      <svg width="100%" height="100%" viewBox="0 0 600 350" preserveAspectRatio="xMidYMid slice">
        {/* Background Skyline */}
        <g opacity="0.5">
          <rect x="0" y="100" width="80" height="200" fill="#1e293b" />
          <rect x="100" y="50" width="120" height="250" fill="#0f172a" />
          <rect x="250" y="120" width="90" height="180" fill="#1e293b" />
          <rect x="380" y="80" width="150" height="220" fill="#0f172a" />
          {/* Windows */}
          <rect x="120" y="80" width="20" height="30" fill="#fef08a" />
          <rect x="160" y="140" width="20" height="30" fill="#fef08a" />
          <rect x="420" y="100" width="20" height="30" fill="#fef08a" />
        </g>

        {/* Floor */}
        <rect x="0" y="250" width="600" height="100" fill="#334155" />
        
        {/* Sirens */}
        <rect ref={sirenRedRef} x="0" y="0" width="600" height="350" fill="red" opacity="0" style={{ mixBlendMode: 'screen' }} />
        <rect ref={sirenBlueRef} x="0" y="0" width="600" height="350" fill="blue" opacity="0" style={{ mixBlendMode: 'screen' }} />

        {/* Victim */}
        <g ref={victimRef} transform="translate(350, 150)">
          <rect x="0" y="0" width="40" height="100" rx="5" fill="#eab308" />
          <circle cx="20" cy="-20" r="25" fill="#eab308" />
          <circle cx="12" cy="-25" r="4" fill="#18181b" />
          <circle cx="28" cy="-25" r="4" fill="#18181b" />
          <rect x="15" y="-10" width="10" height="3" fill="#18181b" />
          {/* Arms */}
          <rect x="-10" y="10" width="15" height="40" rx="5" fill="#eab308" />
          <rect x="35" y="10" width="15" height="40" rx="5" fill="#eab308" />
        </g>

        {/* Robber */}
        <g ref={robberRef} transform="translate(-100, 150)">
          <rect x="0" y="0" width="40" height="100" rx="5" fill="#ef4444" />
          <circle cx="20" cy="-20" r="25" fill="#ef4444" />
          <rect x="0" y="-30" width="40" height="10" fill="#18181b" />
          {/* Gun Arm */}
          <g transform="translate(30, 20)">
            <rect x="0" y="0" width="35" height="12" rx="4" fill="#ef4444" />
            <g ref={gunRef} transform="translate(35, -5)">
              <rect x="0" y="0" width="20" height="8" rx="2" fill="#9ca3af" />
              <rect x="0" y="8" width="8" height="15" fill="#18181b" />
            </g>
          </g>
        </g>

        {/* Bag */}
        <g ref={bagRef} transform="translate(340, 150)">
          <rect x="0" y="0" width="30" height="40" rx="5" fill="#854d0e" />
          <path d="M 5 0 Q 15 -15 25 0" fill="none" stroke="#000" strokeWidth="4" />
        </g>

        {/* Jail */}
        <g ref={jailRef} transform="translate(430, -200)">
          <rect x="-20" y="0" width="120" height="15" fill="#64748b" />
          <rect x="-20" y="140" width="120" height="15" fill="#64748b" />
          <rect x="0" y="0" width="10" height="150" fill="#94a3b8" />
          <rect x="30" y="0" width="10" height="150" fill="#94a3b8" />
          <rect x="60" y="0" width="10" height="150" fill="#94a3b8" />
          <rect x="90" y="0" width="10" height="150" fill="#94a3b8" />
        </g>
      </svg>
    </div>
  );
};

const AnimacaoGSAP = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

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
          <GSAPScene step={TIMELINE[currentIdx].step} />
        </ErrorBoundary>
        
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full z-10 pointer-events-none">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            GSAP (GreenSock) SVG Engine
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

export default AnimacaoGSAP;
