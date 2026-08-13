import React, { useState, useEffect } from 'react';

const TIMELINE = [
  { step: 0, duration: 2500, text: "Cena: Rua deserta à meia-noite. A vítima caminha distraída...",
    viewBox: "0 0 800 400", zoom: "0 0 800 400" },
  { step: 1, duration: 2000, text: "O agente se aproxima de forma sorrateira e agressiva...",
    viewBox: "50 20 700 360", zoom: "50 20 700 360" },
  { step: 2, duration: 2500, text: "Grave ameaça: o agente saca a arma. A vítima se rende.",
    viewBox: "150 50 500 300", zoom: "150 50 500 300" },
  { step: 3, duration: 2000, text: "Subtração: o agente toma a coisa alheia móvel (bolsa).",
    viewBox: "120 80 550 280", zoom: "120 80 550 280" },
  { step: 4, duration: 2500, text: "Posse invertida: o agente empreende fuga em posse do bem.",
    viewBox: "100 0 700 400", zoom: "100 0 700 400" },
  { step: 5, duration: 1500, text: "O alarme soa! A justiça o alcança...",
    viewBox: "300 30 500 350", zoom: "300 30 500 350" },
  { step: 6, duration: 4000, text: "Art 157, CP. Pena: Reclusão de 4 a 10 anos, e multa.",
    viewBox: "200 0 600 400", zoom: "200 0 600 400" },
];

const AnimacaoExemplo = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
    }, TIMELINE[currentIdx].duration);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  const step = TIMELINE[currentIdx].step;

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="relative w-full h-[420px] overflow-hidden rounded-xl bg-[#050a15] border border-border/50 shadow-2xl select-none">

        {/* SVG SCENE — Animação via viewBox para simular câmera */}
        <svg
          width="100%"
          height="100%"
          viewBox={TIMELINE[currentIdx].zoom}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0"
          style={{ transition: 'viewBox 1s ease' }}
        >
          <defs>
            {/* Gradiente céu noturno */}
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#050a15" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            {/* Halo do poste */}
            <radialGradient id="lampHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fffbeb" stopOpacity="0" />
            </radialGradient>
            {/* Sombra do personagem */}
            <radialGradient id="charShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <filter id="blur2"><feGaussianBlur stdDeviation="2" /></filter>
            <filter id="blur4"><feGaussianBlur stdDeviation="4" /></filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Sky */}
          <rect x="-100" y="-100" width="1000" height="600" fill="url(#skyGrad)" />

          {/* Stars */}
          {[...Array(40)].map((_, i) => (
            <circle
              key={i}
              cx={20 + (i * 37) % 780}
              cy={10 + (i * 23) % 150}
              r={Math.random() > 0.7 ? 1.5 : 0.8}
              fill="white"
              opacity={0.3 + Math.random() * 0.4}
            >
              <animate attributeName="opacity" values={`${0.2};${0.8};${0.2}`} dur={`${2 + Math.random() * 3}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Moon */}
          <circle cx="680" cy="40" r="18" fill="#e2e8f0" filter="url(#glow)" />
          <circle cx="680" cy="40" r="30" fill="#93c5fd" opacity="0.06" />

          {/* Skyline (Background buildings with blur) */}
          <g filter="url(#blur2)" opacity="0.7">
            {[0,80,140,220,310,400,480,560,640,720].map((bx, i) => {
              const bh = 60 + (i * 37) % 160;
              return (
                <g key={i}>
                  <rect x={bx} y={330 - bh} width={50 + (i * 13) % 30} height={bh} fill="#1e293b" />
                  {/* Windows */}
                  {[...Array(Math.floor(bh / 25))].map((_, wi) => (
                    <rect key={wi} x={bx + 8 + (wi * 15) % 25} y={335 - bh + wi * 22 + 8} width="8" height="12"
                      fill={(i + wi) % 3 === 0 ? "#fef08a" : "#293548"} />
                  ))}
                </g>
              );
            })}
          </g>

          {/* Lamp Posts */}
          {[180, 420, 650].map((lx, i) => (
            <g key={i}>
              <circle cx={lx + 20} cy={205} r="30" fill="url(#lampHalo)" />
              <rect x={lx} y={210} width="4" height="120" fill="#111" />
              <rect x={lx - 8} y={208} width="28" height="3" fill="#111" />
              <circle cx={lx + 18} cy={206} r="4" fill="#fffbeb" filter="url(#glow)" />
              {/* Light cone */}
              <polygon points={`${lx + 18},210 ${lx - 15},330 ${lx + 50},330`} fill="#fffbeb" opacity="0.03" />
            </g>
          ))}

          {/* Floor */}
          <rect x="-100" y="330" width="1000" height="80" fill="#334155" />
          <rect x="-100" y="333" width="1000" height="2" fill="#475569" />
          {/* Crosswalk */}
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={100 + i * 18} y="328" width="12" height="6" fill="#f8fafc" opacity="0.7" />
          ))}

          {/* Hydrant */}
          <rect x="85" y="312" width="10" height="18" rx="3" fill="#ef4444" />
          <circle cx="90" cy="312" r="6" fill="#ef4444" />

          {/* Trash can */}
          <rect x="380" y="312" width="14" height="18" rx="2" fill="#475569" />
          <rect x="378" y="310" width="18" height="3" rx="1" fill="#334155" />

          {/* === LADRÃO === */}
          <g
            style={{
              transform: `translateX(${step === 0 ? -80 : step <= 3 ? 260 : 550}px) ${step >= 4 ? 'scaleX(-1)' : 'scaleX(1)'}`,
              transition: `transform ${step === 1 ? '1.5s' : step === 4 ? '2s' : '0.6s'} cubic-bezier(0.34,1.56,0.64,1)`,
              transformOrigin: 'center bottom',
              opacity: step === 0 ? 0 : 1,
            }}
          >
            {/* Shadow */}
            <ellipse cx="0" cy="332" rx="18" ry="4" fill="url(#charShadow)" />
            {/* Legs */}
            <rect x="-8" y="300" width="8" height="30" rx="2" fill="#18181b"
              style={{ transformOrigin: '-4px 300px', animation: (step === 1 || step === 4) ? 'cssLegSwing 0.25s infinite alternate' : 'none' }} />
            <rect x="2" y="300" width="8" height="30" rx="2" fill="#18181b"
              style={{ transformOrigin: '6px 300px', animation: (step === 1 || step === 4) ? 'cssLegSwing 0.25s infinite alternate-reverse' : 'none' }} />
            {/* Shoes */}
            <rect x="-10" y="328" width="12" height="4" rx="2" fill="#111" />
            <rect x="0" y="328" width="12" height="4" rx="2" fill="#111" />
            {/* Body */}
            <rect x="-12" y="252" width="26" height="50" rx="5" fill="#ef4444" />
            {/* Belt */}
            <rect x="-13" y="290" width="28" height="4" fill="#18181b" />
            {/* Head */}
            <circle cx="0" cy="240" r="16" fill="#ef4444" />
            <rect x="-12" y="234" width="24" height="6" fill="#18181b" />
            <circle cx="-5" cy="237" r="2" fill="white" />
            <circle cx="5" cy="237" r="2" fill="white" />

            {/* Gun Arm */}
            <g style={{
              transformOrigin: '10px 262px',
              transform: `rotate(${(step === 2 || step === 3) ? '-85deg' : '0deg'})`,
              transition: 'transform 0.3s'
            }}>
              <rect x="10" y="258" width="22" height="8" rx="4" fill="#ef4444" />
              {/* Gun */}
              <g style={{ opacity: (step === 2 || step === 3) ? 1 : 0, transition: 'opacity 0.2s' }}>
                <rect x="28" y="255" width="20" height="7" rx="2" fill="#9ca3af" />
                <rect x="28" y="262" width="8" height="14" fill="#18181b" />
                <rect x="45" y="252" width="3" height="5" fill="#666" />
              </g>
            </g>
            {/* Left arm */}
            <g style={{
              transformOrigin: '-10px 262px',
              transform: `rotate(${step === 3 ? '50deg' : '0deg'})`,
              transition: 'transform 0.4s'
            }}>
              <rect x="-28" y="258" width="20" height="8" rx="4" fill="#dc2626" />
            </g>

            {/* Bag stolen */}
            {step >= 4 && (
              <rect x="-30" y="270" width="18" height="22" rx="4" fill="#854d0e" stroke="#713f12" strokeWidth="1" />
            )}

            <text x="0" y="348" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold" letterSpacing="2">AGENTE</text>
          </g>

          {/* === VÍTIMA === */}
          <g
            style={{
              transform: `translateX(${step === 0 ? 480 : 400}px)`,
              transition: 'transform 1s',
              opacity: step >= 5 ? 0.3 : 1,
              filter: step >= 5 ? 'url(#blur2)' : 'none',
            }}
          >
            <ellipse cx="0" cy="332" rx="18" ry="4" fill="url(#charShadow)" />
            {/* Legs */}
            <rect x="-8" y="300" width="8" height="30" rx="2" fill="#1e3a8a"
              style={{ transformOrigin: '-4px 300px', animation: step === 0 ? 'cssLegWalk 0.6s infinite alternate' : 'none' }} />
            <rect x="2" y="300" width="8" height="30" rx="2" fill="#1e3a8a"
              style={{ transformOrigin: '6px 300px', animation: step === 0 ? 'cssLegWalk 0.6s infinite alternate-reverse' : 'none' }} />
            <rect x="-10" y="328" width="12" height="4" rx="2" fill="#111" />
            <rect x="0" y="328" width="12" height="4" rx="2" fill="#111" />
            {/* Body */}
            <rect x="-12" y="252" width="26" height="50" rx="5" fill="#eab308" />
            <rect x="-13" y="290" width="28" height="4" fill="#18181b" />
            {/* Head */}
            <circle cx="0" cy="240" r="16" fill="#eab308" />
            <rect x="-12" y="228" width="24" height="8" rx="2" fill="#3f3f46" />
            <circle cx="-6" cy="237" r="2" fill="#18181b" />
            <circle cx="6" cy="237" r="2" fill="#18181b" />
            {/* Mouth */}
            <ellipse cx="0" cy="248" rx={step >= 2 ? 5 : 3} ry={step >= 2 ? 6 : 2} fill="#18181b"
              style={{ transition: 'all 0.3s' }} />

            {/* Phone */}
            {step === 0 && (
              <g>
                <rect x="12" y="270" width="8" height="14" rx="2" fill="#18181b" />
                <rect x="13" y="271" width="6" height="10" fill="#38bdf8" />
              </g>
            )}

            {/* Arms */}
            <g style={{
              transformOrigin: '10px 262px',
              transform: `rotate(${step >= 2 ? '-150deg' : step === 0 ? '15deg' : '0deg'})`,
              transition: 'transform 0.4s'
            }}>
              <rect x="10" y="258" width="22" height="8" rx="4" fill="#eab308" />
            </g>
            <g style={{
              transformOrigin: '-10px 262px',
              transform: `rotate(${step >= 2 ? '150deg' : '0deg'})`,
              transition: 'transform 0.4s'
            }}>
              <rect x="-28" y="258" width="20" height="8" rx="4" fill="#ca8a04" />
            </g>

            {/* Bag on victim */}
            {step <= 3 && (
              <rect
                x={step >= 2 ? -40 : -28}
                y={step >= 2 ? 310 : 275}
                width="18" height="22" rx="4"
                fill="#854d0e" stroke="#713f12" strokeWidth="1"
                style={{
                  transition: 'all 0.5s',
                  opacity: step === 3 ? 0 : 1,
                  transform: step >= 2 ? 'rotate(80deg)' : 'rotate(0deg)',
                  transformOrigin: 'center'
                }}
              />
            )}

            <text x="0" y="348" textAnchor="middle" fill="#eab308" fontSize="9" fontWeight="bold" letterSpacing="2">VÍTIMA</text>
          </g>

          {/* === SIRENS + JAIL === */}
          {step >= 5 && (
            <g>
              <rect x="-100" y="-100" width="1000" height="600" fill="red" opacity="0.12">
                <animate attributeName="opacity" values="0;0.2;0" dur="0.5s" repeatCount="indefinite" />
              </rect>
              <rect x="-100" y="-100" width="1000" height="600" fill="blue" opacity="0">
                <animate attributeName="opacity" values="0.2;0;0.2" dur="0.5s" repeatCount="indefinite" />
              </rect>
              {/* Spotlight beam */}
              <polygon points="560,0 520,340 600,340" fill="white" opacity="0.06">
                <animate attributeName="opacity" values="0.04;0.1;0.04" dur="2s" repeatCount="indefinite" />
              </polygon>
            </g>
          )}

          {step === 6 && (
            <g style={{
              animation: 'cssPrisonDrop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards'
            }}>
              <rect x="500" y="200" width="100" height="8" fill="#64748b" />
              <rect x="500" y="335" width="100" height="8" fill="#64748b" />
              {[0,1,2,3,4,5].map(i => (
                <rect key={i} x={505 + i * 16} y="200" width="6" height="140" fill="#94a3b8" />
              ))}
            </g>
          )}
        </svg>

        {/* Badge */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full z-10 pointer-events-none">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            CSS + SVG Pure
          </span>
        </div>
      </div>

      <div className="mt-6 text-center h-24 w-full px-4 max-w-xl">
        <p className="text-lg font-body font-medium text-foreground transition-opacity duration-300">
          {TIMELINE[currentIdx].text}
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {TIMELINE.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-primary shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'w-2 bg-muted'}`} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes cssLegSwing {
          from { transform: rotate(-30deg); }
          to { transform: rotate(30deg); }
        }
        @keyframes cssLegWalk {
          from { transform: rotate(-10deg); }
          to { transform: rotate(10deg); }
        }
        @keyframes cssPrisonDrop {
          from { opacity: 0; transform: translateY(-200px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AnimacaoExemplo;
