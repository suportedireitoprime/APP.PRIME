import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const TIMELINE = [
  { step: 0, duration: 2500, text: "Cena: Rua deserta à meia-noite. A vítima caminha distraída...",
    zoom: 1.0, panX: 0, panY: 0 },
  { step: 1, duration: 2000, text: "O agente se aproxima de forma sorrateira e agressiva...",
    zoom: 1.1, panX: -20, panY: 10 },
  { step: 2, duration: 2500, text: "Grave ameaça: o agente saca a arma. A vítima se rende.",
    zoom: 1.4, panX: 10, panY: 20 },
  { step: 3, duration: 2000, text: "Subtração: o agente toma a coisa alheia móvel (bolsa).",
    zoom: 1.3, panX: -10, panY: 30 },
  { step: 4, duration: 2500, text: "Posse invertida: o agente empreende fuga em posse do bem.",
    zoom: 0.9, panX: 30, panY: -10 },
  { step: 5, duration: 1500, text: "O alarme soa! A justiça o alcança...",
    zoom: 1.2, panX: 50, panY: 5 },
  { step: 6, duration: 4000, text: "Art 157, CP. Pena: Reclusão de 4 a 10 anos, e multa.",
    zoom: 1.0, panX: 40, panY: 0 },
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
      const ground = h - 40;

      // === CONTAINER PRINCIPAL (Para zoom/pan da câmera) ===
      const worldContainer = new PIXI.Container();
      worldContainer.pivot.set(w / 2, h / 2);
      worldContainer.position.set(w / 2, h / 2);
      app.stage.addChild(worldContainer);

      // === STARS ===
      const starsContainer = new PIXI.Container();
      for (let i = 0; i < 60; i++) {
        const star = new PIXI.Graphics();
        const size = Math.random() * 2 + 0.5;
        star.circle(0, 0, size).fill(0xffffff);
        star.alpha = Math.random() * 0.6 + 0.2;
        star.position.set(Math.random() * w, Math.random() * (h * 0.5));
        starsContainer.addChild(star);
      }
      worldContainer.addChild(starsContainer);

      // === MOON ===
      const moonG = new PIXI.Graphics();
      moonG.circle(0, 0, 20).fill(0xe2e8f0);
      moonG.circle(0, 0, 35).fill({ color: 0x93c5fd, alpha: 0.08 });
      moonG.position.set(w * 0.85, 40);
      worldContainer.addChild(moonG);

      // === CITY BACKGROUND (Parallax Deep) ===
      const bgLayer = new PIXI.Container();
      const blurFilter = new PIXI.BlurFilter();
      blurFilter.blur = 4;
      bgLayer.filters = [blurFilter];
      for (let i = 0; i < 25; i++) {
        const bh = 60 + Math.random() * 180;
        const bw = 25 + Math.random() * 55;
        const bldg = new PIXI.Graphics();
        bldg.rect(0, 0, bw, bh).fill(0x1e293b);
        // Windows
        for (let wy = 10; wy < bh - 10; wy += 18) {
          for (let wx = 5; wx < bw - 8; wx += 12) {
            if (Math.random() > 0.5) {
              bldg.rect(wx, wy, 6, 10).fill(Math.random() > 0.6 ? 0xfef08a : 0x293548);
            }
          }
        }
        bldg.position.set(i * 38, ground - bh);
        bgLayer.addChild(bldg);
      }
      worldContainer.addChild(bgLayer);

      // === FLOOR ===
      const floor = new PIXI.Graphics();
      floor.rect(0, ground, w, 60).fill(0x334155);
      floor.rect(0, ground + 3, w, 2).fill(0x475569);
      // Crosswalk stripes
      for (let i = 0; i < 5; i++) {
        floor.rect(w * 0.15 + i * 18, ground - 2, 12, 6).fill(0xf8fafc);
      }
      worldContainer.addChild(floor);

      // === LAMP POST ===
      const createLamp = (px: number) => {
        const lp = new PIXI.Container();
        lp.position.set(px, 0);
        const poleG = new PIXI.Graphics();
        poleG.rect(-2, ground - 120, 4, 120).fill(0x111111);
        poleG.rect(-15, ground - 122, 30, 3).fill(0x111111);
        const bulbG = new PIXI.Graphics();
        bulbG.circle(12, ground - 124, 4).fill(0xfffbeb);
        // Cone de luz
        const cone = new PIXI.Graphics();
        cone.poly([12, ground - 120, -20, ground, 44, ground]).fill({ color: 0xfffbeb, alpha: 0.05 });
        lp.addChild(cone, poleG, bulbG);
        worldContainer.addChild(lp);
        return lp;
      };
      createLamp(w * 0.2);
      createLamp(w * 0.55);
      createLamp(w * 0.85);

      // === TRASH CAN & HYDRANT ===
      const trashG = new PIXI.Graphics();
      trashG.roundRect(0, 0, 16, 22, 2).fill(0x475569);
      trashG.rect(-1, -2, 18, 3).fill(0x334155);
      trashG.position.set(w * 0.48, ground - 22);
      worldContainer.addChild(trashG);

      const hydrantG = new PIXI.Graphics();
      hydrantG.roundRect(0, 0, 10, 20, 3).fill(0xef4444);
      hydrantG.circle(5, 0, 6).fill(0xef4444);
      hydrantG.position.set(w * 0.12, ground - 20);
      worldContainer.addChild(hydrantG);

      const L_POS = w * 0.38;
      const V_POS = w * 0.58;
      const R_POS = w * 0.78;

      // === ROBBER ===
      const robber = new PIXI.Container();
      robber.x = -50;
      robber.y = ground;

      // Shadow
      const rShadow = new PIXI.Graphics();
      rShadow.ellipse(0, 0, 18, 5).fill({ color: 0x000000, alpha: 0.5 });
      robber.addChild(rShadow);

      const rBody = new PIXI.Graphics();
      rBody.roundRect(-14, -45, 28, 50, 5).fill(0xef4444);
      // Belt
      rBody.rect(-15, -10, 30, 4).fill(0x18181b);
      const rHead = new PIXI.Graphics();
      rHead.circle(0, -58, 16).fill(0xef4444);
      rHead.rect(-12, -62, 24, 6).fill(0x18181b);
      rHead.circle(-5, -59, 2).fill(0xffffff);
      rHead.circle(5, -59, 2).fill(0xffffff);

      // Arm with gun
      const rArm = new PIXI.Container();
      rArm.position.set(10, -32);
      const armShape = new PIXI.Graphics();
      armShape.roundRect(0, -4, 22, 8, 4).fill(0xef4444);
      rArm.addChild(armShape);
      const gun = new PIXI.Graphics();
      gun.roundRect(18, -5, 18, 7, 2).fill(0x9ca3af);
      gun.rect(18, 2, 7, 12).fill(0x18181b);
      gun.rect(33, -8, 3, 5).fill(0x666666); // sight
      gun.alpha = 0;
      rArm.addChild(gun);

      // Legs (separate for animation)
      const rLegR = new PIXI.Graphics();
      rLegR.roundRect(-3, 0, 10, 28, 2).fill(0x18181b);
      rLegR.roundRect(-4, 25, 12, 5, 2).fill(0x111111); // shoe
      rLegR.position.set(4, -2);
      const rLegL = new PIXI.Graphics();
      rLegL.roundRect(-3, 0, 10, 28, 2).fill(0x18181b);
      rLegL.roundRect(-4, 25, 12, 5, 2).fill(0x111111);
      rLegL.position.set(-8, -2);

      robber.addChild(rLegL, rLegR, rBody, rHead, rArm);
      worldContainer.addChild(robber);

      // === VICTIM ===
      const victim = new PIXI.Container();
      victim.x = V_POS;
      victim.y = ground;

      const vShadow = new PIXI.Graphics();
      vShadow.ellipse(0, 0, 18, 5).fill({ color: 0x000000, alpha: 0.5 });
      victim.addChild(vShadow);

      const vBody = new PIXI.Graphics();
      vBody.roundRect(-14, -45, 28, 50, 5).fill(0xeab308);
      vBody.rect(-15, -10, 30, 4).fill(0x18181b);
      const vHead = new PIXI.Graphics();
      vHead.circle(0, -58, 16).fill(0xeab308);
      vHead.rect(-12, -68, 24, 8).fill(0x3f3f46); // hair
      vHead.circle(-6, -60, 2).fill(0x18181b);
      vHead.circle(6, -60, 2).fill(0x18181b);
      const vMouth = new PIXI.Graphics();
      vMouth.circle(0, -50, 2).fill(0x18181b);
      vHead.addChild(vMouth);

      // Phone
      const phone = new PIXI.Graphics();
      phone.roundRect(0, 0, 8, 14, 2).fill(0x18181b);
      phone.rect(1, 1, 6, 10).fill(0x38bdf8);
      phone.position.set(12, -35);
      victim.addChild(phone);

      const vArmR = new PIXI.Container();
      vArmR.position.set(10, -32);
      const vArmRShape = new PIXI.Graphics();
      vArmRShape.roundRect(0, -4, 20, 8, 4).fill(0xeab308);
      vArmR.addChild(vArmRShape);

      const vArmL = new PIXI.Container();
      vArmL.position.set(-10, -32);
      const vArmLShape = new PIXI.Graphics();
      vArmLShape.roundRect(-20, -4, 20, 8, 4).fill(0xeab308);
      vArmL.addChild(vArmLShape);

      const vLegR = new PIXI.Graphics();
      vLegR.roundRect(-3, 0, 10, 28, 2).fill(0x1e3a8a);
      vLegR.roundRect(-4, 25, 12, 5, 2).fill(0x111111);
      vLegR.position.set(4, -2);
      const vLegL = new PIXI.Graphics();
      vLegL.roundRect(-3, 0, 10, 28, 2).fill(0x1e3a8a);
      vLegL.roundRect(-4, 25, 12, 5, 2).fill(0x111111);
      vLegL.position.set(-8, -2);

      victim.addChild(vLegL, vLegR, vBody, vHead, vArmL, vArmR);
      worldContainer.addChild(victim);

      // === BAG ===
      const bag = new PIXI.Graphics();
      bag.roundRect(-10, -12, 22, 28, 4).fill(0x854d0e);
      bag.rect(-3, -18, 8, 6).fill(0x000000);
      bag.rect(-1, -8, 4, 3).fill(0xd4a017); // clasp
      bag.x = V_POS - 25;
      bag.y = ground - 20;
      worldContainer.addChild(bag);

      // === JAIL ===
      const jail = new PIXI.Container();
      jail.x = R_POS;
      jail.y = -200;
      const jTop = new PIXI.Graphics().rect(-55, -80, 110, 10).fill(0x64748b);
      const jBot = new PIXI.Graphics().rect(-55, 75, 110, 10).fill(0x64748b);
      jail.addChild(jTop, jBot);
      for (let i = 0; i < 7; i++) {
        jail.addChild(new PIXI.Graphics().rect(-50 + i * 15, -80, 6, 165).fill(0x94a3b8));
      }
      worldContainer.addChild(jail);

      // === OVERLAYS ===
      const sirenRed = new PIXI.Graphics().rect(0, 0, w, h).fill(0xff0000);
      sirenRed.alpha = 0;
      sirenRed.blendMode = 'add';
      const sirenBlue = new PIXI.Graphics().rect(0, 0, w, h).fill(0x0000ff);
      sirenBlue.alpha = 0;
      sirenBlue.blendMode = 'add';

      const spotlightG = new PIXI.Graphics();
      spotlightG.poly([R_POS - 50, h, R_POS + 50, h, R_POS, -50]).fill(0xffffff);
      spotlightG.alpha = 0;
      spotlightG.blendMode = 'add';

      app.stage.addChild(sirenRed, sirenBlue, spotlightG);

      elementsRef.current = {
        worldContainer, robber, rArm, gun, rLegL, rLegR,
        victim, vArmL, vArmR, vMouth, phone,
        vLegL, vLegR,
        bag, jail, sirenRed, sirenBlue, spotlightG,
        bgLayer, starsContainer,
        L_POS, V_POS, R_POS, ground, w, h
      };

      // === TICKER ===
      let time = 0;
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime * 0.016;
        time += dt;

        const {
          worldContainer, robber, rArm, gun, rLegL, rLegR,
          victim, vArmL, vArmR, vMouth, phone,
          vLegL, vLegR,
          bag, jail, sirenRed, sirenBlue, spotlightG,
          starsContainer,
          L_POS, V_POS, R_POS, ground
        } = elementsRef.current;
        const s = elementsRef.current.step ?? 0;
        const camData = TIMELINE[elementsRef.current.stepIdx ?? 0] ?? TIMELINE[0];

        // === CAMERA (Zoom + Pan via worldContainer) ===
        worldContainer.scale.x = damp(worldContainer.scale.x, camData.zoom, 2, dt);
        worldContainer.scale.y = damp(worldContainer.scale.y, camData.zoom, 2, dt);
        worldContainer.pivot.x = damp(worldContainer.pivot.x, w / 2 + camData.panX, 2, dt);
        worldContainer.pivot.y = damp(worldContainer.pivot.y, h / 2 + camData.panY, 2, dt);

        // Star twinkle
        starsContainer.children.forEach((star: PIXI.Graphics, i: number) => {
          star.alpha = 0.2 + Math.sin(time * 2 + i) * 0.3;
        });

        // === ROBBER ===
        const rTargetX = s === 0 ? -50 : (s >= 1 && s <= 3) ? L_POS : R_POS;
        robber.x = damp(robber.x, rTargetX, 5, dt);

        if (s === 1 || s === 4) {
          robber.y = ground + Math.abs(Math.sin(time * 18)) * -10;
          rLegR.rotation = Math.sin(time * 18) * 0.8;
          rLegL.rotation = -Math.sin(time * 18) * 0.8;
          rArm.rotation = Math.sin(time * 18) * 0.5;
        } else {
          robber.y = damp(robber.y, ground, 6, dt);
          rLegR.rotation = damp(rLegR.rotation, 0, 8, dt);
          rLegL.rotation = damp(rLegL.rotation, 0, 8, dt);
          const armTarget = (s === 2 || s === 3) ? -1.2 : 0;
          rArm.rotation = damp(rArm.rotation, armTarget, 8, dt);
        }

        robber.scale.x = damp(robber.scale.x, s >= 4 ? -1 : 1, 8, dt);
        gun.alpha = damp(gun.alpha, (s === 2 || s === 3) ? 1 : 0, 12, dt);

        // === VICTIM ===
        phone.visible = s === 0;
        if (s >= 2 && s <= 4) {
          victim.x = V_POS + Math.sin(time * 35) * 3;
          vArmL.rotation = damp(vArmL.rotation, -2.8, 7, dt);
          vArmR.rotation = damp(vArmR.rotation, -2.8, 7, dt);
          vMouth.scale.set(1, damp(vMouth.scale.y, 5, 10, dt));
        } else if (s === 0) {
          victim.x = damp(victim.x, V_POS, 5, dt);
          vLegR.rotation = Math.sin(time * 4) * 0.15;
          vLegL.rotation = -Math.sin(time * 4) * 0.15;
          vArmR.rotation = damp(vArmR.rotation, 0.3, 5, dt);
          vArmL.rotation = damp(vArmL.rotation, 0, 5, dt);
          vMouth.scale.set(1, 1);
        } else {
          victim.x = damp(victim.x, V_POS, 5, dt);
          vArmL.rotation = damp(vArmL.rotation, 0, 6, dt);
          vArmR.rotation = damp(vArmR.rotation, 0, 6, dt);
          vLegR.rotation = damp(vLegR.rotation, 0, 6, dt);
          vLegL.rotation = damp(vLegL.rotation, 0, 6, dt);
          vMouth.scale.set(1, 1);
        }

        // === BAG ===
        if (s <= 1) {
          bag.x = damp(bag.x, V_POS - 25, 8, dt);
          bag.y = damp(bag.y, ground - 20, 8, dt);
          bag.rotation = 0;
        } else if (s === 2) {
          bag.x = damp(bag.x, V_POS - 35, 8, dt);
          bag.y = damp(bag.y, ground - 5, 8, dt);
          bag.rotation = damp(bag.rotation, 1.5, 8, dt);
        } else {
          bag.x = damp(bag.x, robber.x + (s >= 4 ? 20 : -20), 8, dt);
          bag.y = damp(bag.y, ground - 20, 8, dt);
          bag.rotation = damp(bag.rotation, s >= 4 ? 0.2 : -0.2, 8, dt);
        }

        // === JAIL ===
        const jY = s === 6 ? ground - 30 : -200;
        jail.y = damp(jail.y, jY, 5, dt);

        // === SIRENS ===
        if (s >= 5) {
          sirenRed.alpha = (Math.sin(time * 14) + 1) * 0.15;
          sirenBlue.alpha = (Math.cos(time * 14) + 1) * 0.15;
          spotlightG.alpha = damp(spotlightG.alpha, 0.5, 4, dt);
        } else {
          sirenRed.alpha = 0;
          sirenBlue.alpha = 0;
          spotlightG.alpha = damp(spotlightG.alpha, 0, 4, dt);
        }
      });
    };

    initPixi().catch(console.error);

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    elementsRef.current.step = step;
    elementsRef.current.stepIdx = TIMELINE.findIndex(t => t.step === step);
  }, [step]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />;
};

const AnimacaoPixi = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
    }, TIMELINE[currentIdx].duration);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="relative w-full h-[420px] overflow-hidden rounded-xl border border-border/50 shadow-2xl bg-[#050a15]">
        <ErrorBoundary>
          <PixiScene step={TIMELINE[currentIdx].step} />
        </ErrorBoundary>
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full z-10 pointer-events-none">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
            PixiJS Cinematic
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
    </div>
  );
};

export default AnimacaoPixi;
