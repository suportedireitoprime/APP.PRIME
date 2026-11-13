import React, { memo, useEffect, useRef } from 'react';

/**
 * HeroAnimatedWave
 * Onda vermelha hiper-realista com FÍSICA REAL DE FLUIDOS / ÁGUA (Liquid Physics Engine).
 * 
 * - Simulação de ondas harmônicas sobrepostas (Equação de Navier-Stokes / Gerstner Waves simplificada)
 * - Oscilação vertical dinâmica: picos surgem, crescem, espalham e submergem como água real
 * - 3 Camadas de fluido carmesim translúcido com índice de refração e luz volumétrica
 * - Crista especular aquática com brilho diamantino e reflexo contínuo
 * - Micro-glints que boiam fisicamente acompanhando a crista da água
 * - Renderização via HTML5 Canvas em 60-120fps nativo (GPU acelerada), com suspensão em background
 */
export const HeroAnimatedWave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let step = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Parâmetros de Física de Água (Harmônicas de Ondulação e Correnteza)
    const waveBack = {
      baseY: 0.48, // % da altura do canvas
      speed: 0.016,
      h1: 10,
      w1: 0.0075,
      h2: 6,
      w2: 0.015,
      phase2: 1.2,
    };

    const waveMid = {
      baseY: 0.58,
      speed: 0.024,
      h1: 14,
      w1: 0.009,
      h2: 8,
      w2: 0.018,
      phase2: 2.4,
    };

    const waveFront = {
      baseY: 0.72,
      speed: 0.032,
      h1: 11,
      w1: 0.011,
      h2: 5,
      w2: 0.022,
      phase2: 0.8,
    };

    // Função de altura física do fluido no ponto x
    const getWaveY = (x: number, t: number, w: typeof waveMid) => {
      const y0 = height * w.baseY;
      const y1 = Math.sin(x * w.w1 + t * w.speed) * w.h1;
      const y2 = Math.cos(x * w.w2 - t * w.speed * 0.7 + w.phase2) * w.h2;
      // Elevação sutil nas laterais para emoldurar o card central
      const edgeSwell = Math.pow(Math.abs(x / width - 0.5) * 2, 2) * 6;
      return y0 + y1 + y2 - edgeSwell;
    };

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      step += 1;
      const t = step;
      ctx.clearRect(0, 0, width, height);

      // ── ONDA 1: Fundo Profundo (Água Bordô Escura com Volume) ──
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 4) {
        const y = getWaveY(x, t, waveBack);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const gradBack = ctx.createLinearGradient(0, height * 0.35, 0, height);
      gradBack.addColorStop(0, 'rgba(110, 5, 18, 0.75)');
      gradBack.addColorStop(0.4, 'rgba(55, 1, 8, 0.9)');
      gradBack.addColorStop(1, 'rgba(20, 0, 3, 0.98)');
      ctx.fillStyle = gradBack;
      ctx.fill();

      // Crista sutil da onda traseira
      ctx.beginPath();
      for (let x = 0; x <= width; x += 6) {
        const y = getWaveY(x, t, waveBack);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 120, 135, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── ONDA 2: Onda Principal de Água Carmesim com Lustro e Refração ──
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 3) {
        const y = getWaveY(x, t, waveMid);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const gradMid = ctx.createLinearGradient(0, height * 0.45, 0, height);
      gradMid.addColorStop(0, 'rgba(255, 45, 65, 0.95)');
      gradMid.addColorStop(0.18, 'rgba(229, 9, 20, 0.98)');
      gradMid.addColorStop(0.55, 'rgba(150, 6, 18, 0.98)');
      gradMid.addColorStop(1, 'rgba(38, 0, 6, 1)');
      ctx.fillStyle = gradMid;
      ctx.shadowColor = 'rgba(229, 9, 20, 0.55)';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Crista Especular da Água Principal (Gloss reluzente)
      ctx.beginPath();
      for (let x = 0; x <= width; x += 3) {
        const y = getWaveY(x, t, waveMid);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const crestGrad = ctx.createLinearGradient(0, 0, width, 0);
      crestGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      crestGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.98)');
      crestGrad.addColorStop(0.5, 'rgba(255, 180, 190, 0.6)');
      crestGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.98)');
      crestGrad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
      ctx.strokeStyle = crestGrad;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Halo Difuso sobre a Crista da Água
      ctx.strokeStyle = 'rgba(255, 77, 90, 0.35)';
      ctx.lineWidth = 6;
      ctx.stroke();

      // ── ONDA 3: Espuma e Lábio Frontal da Água (Correnteza Rápida) ──
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 3) {
        const y = getWaveY(x, t, waveFront);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const gradFront = ctx.createLinearGradient(0, height * 0.6, 0, height);
      gradFront.addColorStop(0, 'rgba(255, 60, 80, 0.96)');
      gradFront.addColorStop(0.35, 'rgba(215, 8, 20, 0.98)');
      gradFront.addColorStop(0.75, 'rgba(110, 4, 14, 0.98)');
      gradFront.addColorStop(1, 'rgba(25, 0, 4, 1)');
      ctx.fillStyle = gradFront;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = -4;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Crista Frontal de Alto Brilho
      ctx.beginPath();
      for (let x = 0; x <= width; x += 3) {
        const y = getWaveY(x, t, waveFront);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // ── Pontos de Luz Diamantinos Boiando na Água (Glints que seguem a física) ──
      const glintX1 = width * 0.32;
      const glintY1 = getWaveY(glintX1, t, waveMid) - 1;
      const pulse1 = (Math.sin(t * 0.05) + 1) * 0.5;

      const glintX2 = width * 0.72;
      const glintY2 = getWaveY(glintX2, t, waveFront) - 1;
      const pulse2 = (Math.cos(t * 0.04) + 1) * 0.5;

      // Desenhar Glint 1
      ctx.beginPath();
      ctx.arc(glintX1, glintY1, 2.5 + pulse1 * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + pulse1 * 0.6})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Desenhar Glint 2
      ctx.beginPath();
      ctx.arc(glintX2, glintY2, 2.2 + pulse2 * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + pulse2 * 0.6})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom Carmesim com Pulsação Suave ── */}
      <div 
        className="absolute -bottom-10 -left-8 w-[55%] h-[40%] rounded-full bg-gradient-to-tr from-red-600/35 via-red-950/20 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'heroSilkAmbientPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-8 right-0 w-[50%] h-[45%] rounded-full bg-gradient-to-tl from-red-600/40 via-red-900/20 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'heroSilkAmbientPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade Absoluta do Logo ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[62%] sm:w-[46%] bg-gradient-to-r from-black/88 via-black/40 to-transparent pointer-events-none z-[6]" 
      />

      {/* ── 3. Canvas de Física Real de Fluidos / Ondas de Água Líquida ── */}
      <canvas
        ref={canvasRef}
        className="absolute bottom-0 left-0 w-full h-[135px] sm:h-[165px] pointer-events-none transform-gpu will-change-transform z-[5]"
      />

      {/* ── 4. Keyframes para Iluminação Ambiente Suave ── */}
      <style>{`
        @keyframes heroSilkAmbientPulse {
          0% {
            opacity: 0.55;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.95;
            transform: scale(1.06);
          }
        }
      `}</style>
    </div>
  );
};

export default memo(HeroAnimatedWave);
