import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

const TIMELINE = [
  { step: 0, duration: 8000, text: "Carlos tem 17 anos (menor de idade). Ele planeja atirar em João numa praça deserta.",
    zoom: 1.0, panX: 0, panY: 0 },
  { step: 1, duration: 6000, text: "A AÇÃO ocorre: Carlos atira em João e foge do local.",
    zoom: 1.2, panX: 10, panY: 20 },
  { step: 2, duration: 7000, text: "O tempo passa... João é levado ao hospital em estado grave.",
    zoom: 1.5, panX: -20, panY: -20 }, // Transição brusca (simulada via código)
  { step: 3, duration: 8000, text: "Semanas depois, Carlos faz 18 anos. No mesmo dia, João infelizmente falece (RESULTADO).",
    zoom: 1.3, panX: 0, panY: 0 },
  { step: 4, duration: 9000, text: "Art. 4º: O crime ocorre no momento da AÇÃO. Como Carlos tinha 17 anos no tiro, responde como menor (ECA).",
    zoom: 1.0, panX: 0, panY: 0 },
];

const damp = (current: number, target: number, speed: number, delta: number) => {
  return current + (target - current) * (1 - Math.exp(-speed * delta));
};

const PixiScene = ({ step }: { step: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const elementsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    if (appRef.current) return;

    let isMounted = true;

    const initPixi = async () => {
      const app = new PIXI.Application();

      await app.init({
        background: '#050a15',
        resizeTo: containerRef.current!,
        antialias: true
      });

      if (!isMounted) {
        app.destroy(true, { children: true });
        return;
      }

      containerRef.current!.appendChild(app.canvas);
      appRef.current = app;

      const w = app.screen.width;
      const h = app.screen.height;
      const ground = h - 60;

      // === CONTAINER PRINCIPAL ===
      const worldContainer = new PIXI.Container();
      worldContainer.pivot.set(w / 2, h / 2);
      worldContainer.position.set(w / 2, h / 2);
      app.stage.addChild(worldContainer);

      // --- CENÁRIO PRAÇA ---
      const parkContainer = new PIXI.Container();
      
      // Estrelas
      for (let i = 0; i < 40; i++) {
        const star = new PIXI.Graphics();
        star.circle(0, 0, Math.random() * 2).fill(0xffffff);
        star.alpha = Math.random() * 0.8;
        star.position.set(Math.random() * w, Math.random() * (h * 0.6));
        parkContainer.addChild(star);
      }

      // Grama
      const grass = new PIXI.Graphics();
      grass.rect(0, ground, w, h - ground).fill(0x166534);
      parkContainer.addChild(grass);

      // Árvores
      for(let i=0; i<4; i++) {
        const tree = new PIXI.Graphics();
        tree.rect(-10, -80, 20, 80).fill(0x78350f);
        tree.circle(0, -90, 40).fill(0x14532d);
        tree.circle(-20, -70, 35).fill(0x14532d);
        tree.circle(20, -70, 35).fill(0x14532d);
        tree.position.set(w * 0.15 + (i * w * 0.25), ground);
        parkContainer.addChild(tree);
      }
      worldContainer.addChild(parkContainer);

      // --- CENÁRIO HOSPITAL ---
      const hospitalContainer = new PIXI.Container();
      hospitalContainer.alpha = 0; // Oculto inicialmente
      
      // Parede branca
      const wall = new PIXI.Graphics();
      wall.rect(0, 0, w, ground).fill(0xe2e8f0);
      
      // Chão hospital
      const floorHosp = new PIXI.Graphics();
      floorHosp.rect(0, ground, w, h - ground).fill(0x94a3b8);
      
      // Janela de dia
      const window = new PIXI.Graphics();
      window.rect(w * 0.6, ground - 200, 150, 120).fill(0x7dd3fc); // Céu
      window.rect(w * 0.6 + 70, ground - 200, 10, 120).fill(0xffffff); // Grade
      window.rect(w * 0.6, ground - 145, 150, 10).fill(0xffffff);
      
      // Sol na janela
      const sunHosp = new PIXI.Graphics();
      sunHosp.circle(w * 0.65, ground - 180, 20).fill(0xfde047);
      
      // Cama
      const bed = new PIXI.Graphics();
      bed.roundRect(w * 0.2, ground - 40, 200, 40, 10).fill(0xffffff); // colchão
      bed.rect(w * 0.2 + 10, ground, 10, 20).fill(0x475569); // perna esquerda
      bed.rect(w * 0.2 + 180, ground, 10, 20).fill(0x475569); // perna direita
      
      // Monitor
      const monitor = new PIXI.Graphics();
      monitor.roundRect(w * 0.1, ground - 120, 60, 50, 5).fill(0x334155); // tela
      monitor.rect(w * 0.1 + 25, ground - 70, 10, 70).fill(0x94a3b8); // suporte
      
      // Linha do monitor (desenhada dinamicamente no ticker)
      const ekgLine = new PIXI.Graphics();
      monitor.addChild(ekgLine);

      hospitalContainer.addChild(wall, floorHosp, window, sunHosp, bed, monitor);
      worldContainer.addChild(hospitalContainer);

      // === AGENTE (Carlos - Vermelho) ===
      const agent = new PIXI.Container();
      agent.position.set(w * 0.3, ground);
      const aBody = new PIXI.Graphics().roundRect(-15, -60, 30, 60, 5).fill(0xef4444);
      const aHead = new PIXI.Graphics().circle(0, -75, 18).fill(0xef4444);
      // Olhos ninja
      aHead.rect(-12, -80, 24, 6).fill(0x18181b);
      aHead.circle(-5, -77, 2).fill(0xffffff);
      aHead.circle(5, -77, 2).fill(0xffffff);
      const aArm = new PIXI.Graphics().roundRect(0, -6, 25, 12, 6).fill(0xef4444);
      aArm.position.set(10, -45);
      // Arma
      const gun = new PIXI.Graphics();
      gun.roundRect(20, -5, 20, 8, 2).fill(0x9ca3af);
      gun.rect(20, 3, 8, 15).fill(0x18181b);
      gun.alpha = 0; // Sacada depois
      aArm.addChild(gun);
      // Fumaça do tiro
      const flash = new PIXI.Graphics().circle(45, -2, 12).fill(0xfef08a);
      flash.alpha = 0;
      aArm.addChild(flash);

      agent.addChild(aBody, aHead, aArm);
      worldContainer.addChild(agent);

      // === VÍTIMA (João - Azul) ===
      const victim = new PIXI.Container();
      victim.position.set(w * 0.7, ground);
      const vBody = new PIXI.Graphics().roundRect(-15, -60, 30, 60, 5).fill(0x3b82f6);
      const vHead = new PIXI.Graphics().circle(0, -75, 18).fill(0xfcbca0);
      const vEye1 = new PIXI.Graphics().circle(-5, -77, 2).fill(0x18181b);
      const vEye2 = new PIXI.Graphics().circle(5, -77, 2).fill(0x18181b);
      const vMouth = new PIXI.Graphics().rect(-4, -68, 8, 2).fill(0x18181b);
      const vArmR = new PIXI.Graphics().roundRect(-4, -6, 8, 30, 4).fill(0x3b82f6);
      vArmR.position.set(-15, -45);
      const vArmL = new PIXI.Graphics().roundRect(-4, -6, 8, 30, 4).fill(0x3b82f6);
      vArmL.position.set(15, -45);

      vHead.addChild(vEye1, vEye2, vMouth);
      victim.addChild(vBody, vHead, vArmR, vArmL);
      worldContainer.addChild(victim);

      elementsRef.current = { 
        worldContainer, parkContainer, hospitalContainer, 
        agent, aArm, gun, flash, 
        victim, vHead, vBody, vArmR, vArmL, 
        ekgLine,
        w, h, ground 
      };

      let time = 0;
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;
        time += dt * 0.05;
        const s = elementsRef.current.step ?? 0;
        const els = elementsRef.current;
        const tData = TIMELINE[els.stepIdx ?? 0] || TIMELINE[0];

        // Câmera Zoom & Pan
        els.worldContainer.scale.x = damp(els.worldContainer.scale.x, tData.zoom, 0.05, dt);
        els.worldContainer.scale.y = damp(els.worldContainer.scale.y, tData.zoom, 0.05, dt);
        
        const targetX = (w / 2) - tData.panX * tData.zoom;
        const targetY = (h / 2) - tData.panY * tData.zoom;
        els.worldContainer.x = damp(els.worldContainer.x, targetX, 0.05, dt);
        els.worldContainer.y = damp(els.worldContainer.y, targetY, 0.05, dt);

        // --- TRANSIÇÃO PRAÇA -> HOSPITAL ---
        if (s >= 2) {
          app.renderer.background.color = '#e2e8f0'; // Fundo claro
          els.parkContainer.alpha = damp(els.parkContainer.alpha, 0, 0.05, dt);
          els.hospitalContainer.alpha = damp(els.hospitalContainer.alpha, 1, 0.05, dt);
        } else {
          app.renderer.background.color = '#050a15'; // Fundo escuro
          els.parkContainer.alpha = damp(els.parkContainer.alpha, 1, 0.05, dt);
          els.hospitalContainer.alpha = damp(els.hospitalContainer.alpha, 0, 0.05, dt);
        }

        // --- ANIMAÇÕES POR STEP ---
        if (s === 0) {
          // Prepara arma
          els.aArm.rotation = damp(els.aArm.rotation, 0, 0.1, dt);
          els.gun.alpha = damp(els.gun.alpha, 1, 0.1, dt);
          els.flash.alpha = 0;
          
          els.victim.x = damp(els.victim.x, w * 0.7, 0.1, dt);
          els.victim.y = damp(els.victim.y, ground, 0.1, dt);
          els.victim.rotation = damp(els.victim.rotation, 0, 0.1, dt);
          els.vArmR.rotation = damp(els.vArmR.rotation, 0, 0.1, dt);
          els.vArmL.rotation = damp(els.vArmL.rotation, 0, 0.1, dt);
          els.vHead.y = -75; // Cabeça normal
        } 
        else if (s === 1) {
          // Atira e foge
          els.aArm.rotation = Math.sin(time * 2) * 0.2; // Tremendo a arma
          els.flash.alpha = Math.random() > 0.5 ? 1 : 0; // Tiro piscando
          els.agent.x = damp(els.agent.x, -100, 0.03, dt); // Foge pra esquerda

          // Vítima cai pra trás
          els.victim.rotation = damp(els.victim.rotation, Math.PI / 2, 0.08, dt);
          els.victim.y = damp(els.victim.y, ground + 10, 0.08, dt);
          els.vArmR.rotation = damp(els.vArmR.rotation, Math.PI, 0.05, dt);
          els.vArmL.rotation = damp(els.vArmL.rotation, Math.PI, 0.05, dt);
        }
        else if (s >= 2) {
          // Cena Hospital
          els.agent.alpha = 0; // Some
          
          // Vítima na cama
          els.victim.rotation = Math.PI / 2; // Deitada
          els.victim.x = damp(els.victim.x, w * 0.25, 0.1, dt);
          els.victim.y = damp(els.victim.y, ground - 45, 0.1, dt);
          els.vArmR.rotation = 0;
          els.vArmL.rotation = 0;

          // Animação do Monitor Cardíaco (EKG)
          els.ekgLine.clear();
          if (s >= 3) {
            // Flatline (Morto)
            els.ekgLine.moveTo(w * 0.1 + 5, ground - 95);
            els.ekgLine.lineTo(w * 0.1 + 55, ground - 95);
            els.ekgLine.stroke({ color: 0xef4444, width: 2 });
            els.vHead.y = -70; // Cabeça pende
          } else {
            // Batimento (Vivo)
            const beat = (time % 2) > 1.5;
            els.ekgLine.moveTo(w * 0.1 + 5, ground - 95);
            if (beat) {
              els.ekgLine.lineTo(w * 0.1 + 25, ground - 95);
              els.ekgLine.lineTo(w * 0.1 + 30, ground - 110);
              els.ekgLine.lineTo(w * 0.1 + 35, ground - 80);
              els.ekgLine.lineTo(w * 0.1 + 40, ground - 95);
            } else {
              els.ekgLine.lineTo(w * 0.1 + 20, ground - 95);
            }
            els.ekgLine.lineTo(w * 0.1 + 55, ground - 95);
            els.ekgLine.stroke({ color: 0x22c55e, width: 2 });
          }
        }
      });
    };

    initPixi().catch(console.error);

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    elementsRef.current.step = step;
    elementsRef.current.stepIdx = TIMELINE.findIndex(t => t.step === step);
  }, [step]);

  return <div ref={containerRef} className="w-full h-full cursor-pointer" />;
};

export default function CenaArtigo4Pixi() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  useEffect(() => {
    if (ttsEnabled) {
      window.speechSynthesis.cancel();
      const text = TIMELINE[currentIdx].text;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      
      utterance.onend = () => setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
      utterance.onerror = () => setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
      
      window.speechSynthesis.speak(utterance);
      return () => window.speechSynthesis.cancel();
    } else {
      const timeout = setTimeout(() => {
        setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
      }, TIMELINE[currentIdx].duration);
      return () => clearTimeout(timeout);
    }
  }, [currentIdx, ttsEnabled]);

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="w-full max-w-full flex justify-between items-center mb-4 px-2 sm:px-0">
        <Button 
          variant={ttsEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`gap-2 transition-all ${ttsEnabled ? 'bg-amber-600 hover:bg-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'border-white/10 text-muted-foreground'}`}
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4" />}
          {ttsEnabled ? 'Narração Ativa' : 'Áudio'}
        </Button>
      </div>

      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#050a15]">
        
        <PixiScene step={TIMELINE[currentIdx].step} />
        
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-30">
          <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-emerald-500">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
            <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
              {TIMELINE[currentIdx].text}
            </p>
          </div>
          <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
            {TIMELINE.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'w-2 bg-white/50'}`} />
            ))}
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full z-10 pointer-events-none hidden sm:flex">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            PixiJS (Art. 4º)
          </span>
        </div>
      </div>
    </div>
  );
}
