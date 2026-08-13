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

const PhaserScene = ({ step }: { step: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<any>(null);
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (gameInstance.current) return;

    let Phaser: any;
    
    import('phaser').then((phaserModule) => {
      Phaser = phaserModule.default || phaserModule;
      
      class ExampleScene extends Phaser.Scene {
        public robber!: any;
        public victim!: any;
        public jail!: any;
        public gunArm!: any;
        public gun!: any;
        public bag!: any;
        public vArms!: any;
        public sirenRed!: any;
        public sirenBlue!: any;
        public spotlight!: any;

        constructor() {
          super('ExampleScene');
        }

        create() {
          const w = this.cameras.main.width;
          const h = this.cameras.main.height;
          const centerY = h / 2 + 50;

          // Parallax City Background (Layer 1 - deep)
          for(let i=0; i<20; i++) {
             let bh = Phaser.Math.Between(50, 150);
             let bw = Phaser.Math.Between(30, 70);
             this.add.rectangle(i * 45, h - bh/2 - 20, bw, bh, 0x0f172a);
          }

          // Parallax City Background (Layer 2 - mid)
          for(let i=0; i<15; i++) {
             let bh = Phaser.Math.Between(80, 200);
             let bw = Phaser.Math.Between(40, 90);
             let bldg = this.add.rectangle(i * 65, h - bh/2 - 20, bw, bh, 0x1e293b);
             // Windows
             if (Math.random() > 0.5) {
                let win = this.add.rectangle(i * 65 - 10, h - bh + 20, 10, 15, 0xfef08a);
             }
          }

          // Road & Sidewalk
          this.add.rectangle(w/2, h - 10, w, 20, 0x334155); // calçada
          this.add.rectangle(w/2, h, w, 20, 0x0f172a); // asfalto
          
          // Robber Container
          this.robber = this.add.container(-50, centerY); // Starts offscreen
          const rBody = this.add.rectangle(0, -35, 35, 60, 0xef4444);
          const rHead = this.add.circle(0, -75, 18, 0xef4444);
          const rMask = this.add.rectangle(0, -80, 26, 8, 0x18181b);
          const rEye = this.add.circle(5, -80, 2, 0xffffff); // Evil eye
          
          this.gunArm = this.add.container(10, -45);
          const armShape = this.add.rectangle(15, 0, 30, 8, 0xef4444);
          this.gun = this.add.rectangle(30, -5, 12, 16, 0xa1a1aa); // Gun
          this.gun.setAngle(20);
          this.gun.setAlpha(0); // hidden initially
          this.gunArm.add([armShape, this.gun]);
          
          this.robber.add([rBody, rHead, rMask, rEye, this.gunArm]);

          // Victim Container
          this.victim = this.add.container(w * 0.6, centerY);
          const vBody = this.add.rectangle(0, -35, 35, 60, 0xeab308);
          const vHead = this.add.circle(0, -75, 18, 0xeab308);
          const vEyeL = this.add.circle(-6, -80, 2, 0x18181b);
          const vEyeR = this.add.circle(6, -80, 2, 0x18181b);
          const vMouth = this.add.rectangle(0, -70, 8, 2, 0x18181b);
          this.victim.mouth = vMouth;
          
          this.vArms = this.add.container(0, -45);
          const vArmL = this.add.rectangle(-20, 0, 20, 8, 0xeab308);
          const vArmR = this.add.rectangle(20, 0, 20, 8, 0xeab308);
          this.vArms.add([vArmL, vArmR]);

          this.victim.add([vBody, vHead, vEyeL, vEyeR, vMouth, this.vArms]);

          // The Bag (Bolsa)
          this.bag = this.add.rectangle(w * 0.6 - 25, centerY - 20, 18, 24, 0x854d0e);

          // Jail
          this.jail = this.add.container(w * 0.8, -100);
          const topBar = this.add.rectangle(0, -60, 100, 10, 0x64748b);
          const botBar = this.add.rectangle(0, 60, 100, 10, 0x64748b);
          this.jail.add([topBar, botBar]);
          for(let i = 0; i < 5; i++) {
            this.jail.add(this.add.rectangle(-40 + i * 20, 0, 8, 130, 0x94a3b8));
          }

          // Sirens & Spotlight (Overlay)
          this.sirenRed = this.add.rectangle(w/2, h/2, w, h, 0xff0000).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
          this.sirenBlue = this.add.rectangle(w/2, h/2, w, h, 0x0000ff).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
          
          // A cone of light
          this.spotlight = this.add.polygon(w * 0.8, h/2, [0, -h, w*0.4, h, -w*0.4, h], 0xffffff, 0.2);
          this.spotlight.setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);

          // Save scene reference to update it from React
          sceneRef.current = this;
          this.events.emit('updateStep', 0);
        }

        update() {
          if (!this.robber) return;
          const time = this.time.now;
          // Run bounce
          if (this.robber.isWalking) {
            this.robber.y = (this.cameras.main.height / 2 + 50) + Math.abs(Math.sin(time / 80)) * -8;
          } else {
            this.robber.y = this.cameras.main.height / 2 + 50;
          }
          // Victim tremble
          if (this.victim.isTrembling) {
            this.victim.x = this.victim.baseX + Math.sin(time / 20) * 2;
          }
        }
      }

      const config = {
        type: Phaser.AUTO,
        width: '100%',
        height: 350, // Um pouco mais alto para respirar
        parent: containerRef.current,
        backgroundColor: '#070c17',
        scene: ExampleScene
      };

      gameInstance.current = new Phaser.Game(config);

    }).catch(err => console.error(err));

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, []);

  // Sync React Step to Phaser Tweens
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !scene.robber) return;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    // Reset properties for strict linear flow
    scene.tweens.killAll();
    scene.robber.isWalking = false;
    scene.victim.isTrembling = false;
    scene.sirenRed.setAlpha(0);
    scene.sirenBlue.setAlpha(0);
    scene.spotlight.setAlpha(0);

    const L_POS = w * 0.4;
    const V_POS = w * 0.6;
    const R_POS = w * 0.8; // Arrest pos

    scene.victim.baseX = V_POS;

    switch (step) {
      case 0:
        scene.robber.x = -50;
        scene.robber.scaleX = 1;
        scene.gunArm.angle = 90; // hidden down
        scene.gun.setAlpha(0);
        
        scene.victim.x = V_POS;
        scene.victim.setAlpha(1);
        scene.vArms.list[0].angle = 0; 
        scene.vArms.list[1].angle = 0; 
        scene.victim.mouth.scaleY = 1;
        
        scene.bag.x = V_POS - 25;
        scene.bag.y = scene.robber.y - 20;

        scene.jail.y = -100;
        break;

      case 1:
        scene.robber.scaleX = 1;
        scene.robber.isWalking = true;
        scene.tweens.add({
          targets: scene.robber,
          x: L_POS,
          duration: 1000,
          ease: 'Cubic.easeOut'
        });
        break;

      case 2:
        scene.robber.x = L_POS;
        scene.gun.setAlpha(1);
        scene.tweens.add({ targets: scene.gunArm, angle: 0, duration: 200 }); // Points gun
        
        scene.victim.isTrembling = true;
        scene.tweens.add({ targets: scene.vArms.list[0], angle: 140, duration: 200 }); // Hands up
        scene.tweens.add({ targets: scene.vArms.list[1], angle: -140, duration: 200 });
        scene.victim.mouth.scaleY = 4; // Scared mouth
        
        // Bag drops
        scene.tweens.add({ targets: scene.bag, y: scene.robber.y, x: V_POS - 35, duration: 400, ease: 'Bounce.easeOut' });
        break;

      case 3:
        scene.robber.x = L_POS;
        scene.victim.isTrembling = true;
        scene.tweens.add({ targets: scene.gunArm, angle: 45, duration: 300 }); // Lowers gun slightly
        
        // Bag flies to robber
        scene.tweens.add({ targets: scene.bag, x: L_POS + 15, y: scene.robber.y - 15, duration: 400, ease: 'Power2' });
        break;

      case 4:
        scene.robber.x = L_POS;
        scene.robber.scaleX = -1; // Turns around
        scene.robber.isWalking = true;
        
        // Bag follows robber
        scene.tweens.add({ targets: scene.bag, x: R_POS - 15, duration: 1500, ease: 'Cubic.easeIn' });
        
        scene.tweens.add({ targets: scene.robber, x: R_POS, duration: 1500, ease: 'Cubic.easeIn' });
        break;

      case 5:
        scene.robber.x = R_POS;
        scene.robber.scaleX = -1;
        scene.bag.x = R_POS - 15;
        
        // Siren flashing loops
        scene.tweens.add({ targets: scene.sirenRed, alpha: 0.15, duration: 400, yoyo: true, repeat: -1 });
        scene.tweens.add({ targets: scene.sirenBlue, alpha: 0.15, duration: 400, yoyo: true, repeat: -1, delay: 200 });
        
        // Spotlight appears
        scene.tweens.add({ targets: scene.spotlight, alpha: 1, duration: 200 });
        break;

      case 6:
        scene.robber.x = R_POS;
        scene.robber.scaleX = -1;
        scene.bag.x = R_POS - 15;
        
        // Sirens still active
        scene.sirenRed.setAlpha(0.15);
        scene.spotlight.setAlpha(1);

        // Jail falls
        scene.tweens.add({ targets: scene.jail, y: scene.robber.y - 30, duration: 300, ease: 'Bounce.easeOut' });
        break;
    }
  }, [step]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />;
};

const AnimacaoPhaser = () => {
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
          <PhaserScene step={TIMELINE[currentIdx].step} />
        </ErrorBoundary>
        
        {/* UI Overlay */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full z-10 pointer-events-none">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Phaser 3 Engine
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

export default AnimacaoPhaser;
