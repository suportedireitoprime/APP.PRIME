import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Button } from '@/components/ui/button';
import { Compass, Volume2, VolumeX } from 'lucide-react';

const COLORS = {
  bg: 0xf8fafc,
  floor: 0xe2e8f0,
  wall: 0xcbd5e1,
  agent: 0x1e3a8a,
  victim: 0xca8a04,
  skin: 0xfcbca0,
};

const TIMELINE = [
  { step: 0, duration: 4000, text: "Cena 1: Sala de reuniões clara e bem iluminada. O Agente e a Vítima frente a frente.", cam: { x: 0, y: 3.5, z: 12, lookX: 0, lookY: 1.5, fov: 45 } },
  { step: 1, duration: 4500, text: "O Agente gesticula de forma amigável, apresentando uma suposta vantagem imperdível.", cam: { x: -3, y: 2.5, z: 8, lookX: -1, lookY: 1.5, fov: 50 } },
  { step: 2, duration: 4000, text: "A Vítima, induzida a erro (enganada), entrega voluntariamente seus valores (maleta).", cam: { x: 2, y: 2.5, z: 6, lookX: 0, lookY: 1.5, fov: 55 } },
  { step: 3, duration: 5500, text: "Art. 171: Estelionato. Obter, para si, vantagem ilícita. Pena - reclusão, de 1 a 5 anos.", cam: { x: -4, y: 3.5, z: 10, lookX: -1, lookY: 1, fov: 50 } },
];

const VanillaThreeScene = ({ step, isExploring, setPopup }: { step: number, isExploring: boolean, setPopup: any }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.015);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 4, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = false;
    controls.maxPolarAngle = Math.PI / 2;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.6, 0.4, 0.85
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    // Sala de Reuniões (Environment)
    const officeGroup = new THREE.Group();
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.25, 20),
      new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.2, metalness: 0.1 })
    );
    floor.position.set(0, -0.12, 0);
    floor.receiveShadow = true;
    officeGroup.add(floor);

    const wallBack = new THREE.Mesh(
      new THREE.BoxGeometry(40, 15, 1),
      new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.9 })
    );
    wallBack.position.set(0, 7.5, -6);
    wallBack.receiveShadow = true;
    officeGroup.add(wallBack);

    // Quadros na parede
    const painting = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    painting.position.set(0, 5, -5.4);
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 1.8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    canvas.position.set(0, 5, -5.34);
    officeGroup.add(painting, canvas);

    scene.add(officeGroup);

    // Mesa de vidro
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0);
    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 2),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.8 })
    );
    tableTop.position.y = 1.0; tableTop.castShadow = true;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.5), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    leg.position.y = 0.5; leg.castShadow = true;
    tableGroup.add(tableTop, leg);
    scene.add(tableGroup);

    // Maleta
    const briefcase = new THREE.Group();
    const bBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: 0x020617 }));
    bBody.castShadow = true;
    const bHandle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 16, 32), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    bHandle.position.y = 0.35;
    briefcase.add(bBody, bHandle);
    briefcase.position.set(2, 1.35, 0);
    briefcase.userData = { label: 'Valores / Bens (Vítima)' };
    scene.add(briefcase);

    // Papel Falso (Contrato)
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xfcd34d, side: THREE.DoubleSide })
    );
    paper.position.set(-2, 1.5, 0);
    paper.rotation.x = -Math.PI / 2;
    paper.userData = { label: 'Meio Fraudulento (Engano)' };
    scene.add(paper);

    // Personagens Voxel
    const createSquareHumanoid = (color: number, startX: number, startZ: number, rotY: number, isAgent: boolean) => {
      const group = new THREE.Group();
      group.position.set(startX, 0, startZ);
      group.rotation.y = rotY;
      
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      if (ctx) {
        const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
      }
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02;
      group.add(shadow);

      const bodyGroup = new THREE.Group();
      bodyGroup.position.y = 1.4;
      group.add(bodyGroup);

      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      const skinMat = new THREE.MeshStandardMaterial({ color: COLORS.skin, roughness: 0.6 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

      // Suit for agent
      const suitMat = isAgent ? new THREE.MeshStandardMaterial({ color: 0x1e3a8a }) : bodyMat;
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.6), suitMat);
      torso.position.y = 0.1; torso.castShadow = true;
      bodyGroup.add(torso);

      if (isAgent) { // Gravata
        const tie = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.8), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
        tie.position.set(0, 0.2, 0.31);
        bodyGroup.add(tie);
      }

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.1;
      bodyGroup.add(headGroup);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
      head.castShadow = true;
      headGroup.add(head);

      // Cabelo
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.85), new THREE.MeshStandardMaterial({ color: isAgent ? 0x050505 : 0x3f3f46 }));
      hair.position.y = 0.4;
      headGroup.add(hair);
      
      // Rosto
      const eMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), eMat);
      eL.position.set(-0.18, 0.1, 0.41); eL.name = 'eyeL';
      const eR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), eMat);
      eR.position.set(0.18, 0.1, 0.41); eR.name = 'eyeR';
      headGroup.add(eL, eR);
      
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.1), eMat);
      mouth.position.set(0, -0.15, 0.41); mouth.name = 'mouth';
      headGroup.add(mouth);

      const armR = new THREE.Group();
      armR.position.set(0.65, 0.6, 0);
      const armRM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), suitMat);
      armRM.position.y = -0.4; armRM.castShadow = true;
      armR.add(armRM);
      bodyGroup.add(armR);

      const armL = new THREE.Group();
      armL.position.set(-0.65, 0.6, 0);
      const armLM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), suitMat);
      armLM.position.y = -0.4; armLM.castShadow = true;
      armL.add(armLM);
      bodyGroup.add(armL);

      const legR = new THREE.Group();
      legR.position.set(0.25, 0.8, 0);
      const legRM = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), darkMat);
      legRM.position.y = -0.35; legRM.castShadow = true;
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.5), darkMat);
      shoeR.position.set(0, -0.85, 0.07);
      legR.add(legRM, shoeR);
      group.add(legR);

      const legL = new THREE.Group();
      legL.position.set(-0.25, 0.8, 0);
      const legLM = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), darkMat);
      legLM.position.y = -0.35; legLM.castShadow = true;
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.5), darkMat);
      shoeL.position.set(0, -0.85, 0.07);
      legL.add(legLM, shoeL);
      group.add(legL);

      scene.add(group);
      return { group, bodyGroup, headGroup, armR, armL, legR, legL };
    };

    const agent = createSquareHumanoid(COLORS.agent, -2.5, 0, Math.PI / 4, true);
    const victim = createSquareHumanoid(COLORS.victim, 2.5, 0, -Math.PI / 4, false);
    
    agent.group.userData = { label: 'Agente (Enganador)' };
    victim.group.userData = { label: 'Vítima (Induzida a Erro)' };

    elementsRef.current = {
      agent, victim, briefcase, paper, camera, controls, composer, isExploring
    };

    // Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      if (!elementsRef.current.isExploring) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        let obj: any = intersects[0].object;
        while(obj && !obj.userData?.label) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.label) {
          setPopup({ label: obj.userData.label, x: event.clientX - rect.left, y: event.clientY - rect.top });
          return;
        }
      }
      setPopup(null);
    };
    container.addEventListener('click', onClick);

    let animationId: number;
    const clock = new THREE.Clock();
    const damp = THREE.MathUtils.damp;
    const camTarget = new THREE.Vector3(0, 1.5, 0);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();
      const s = elementsRef.current.step ?? 0;
      const isExp = elementsRef.current.isExploring;
      const camData = TIMELINE[elementsRef.current.stepIdx ?? 0]?.cam ?? TIMELINE[0].cam;

      // Câmera
      if (isExp) {
        controls.enabled = true;
        controls.update();
      } else {
        controls.enabled = false;
        camera.fov = damp(camera.fov, camData.fov, 2, dt);
        camera.updateProjectionMatrix();
        camera.position.x = damp(camera.position.x, camData.x, 2, dt);
        camera.position.y = damp(camera.position.y, camData.y, 2, dt);
        camera.position.z = damp(camera.position.z, camData.z, 2, dt);

        camTarget.x = damp(camTarget.x, camData.lookX, 2, dt);
        camTarget.y = damp(camTarget.y, camData.lookY, 2, dt);
        camera.lookAt(camTarget);

        camera.position.x += Math.sin(t * 1.5) * 0.008;
        camera.position.y += Math.cos(t * 2.1) * 0.005;
      }

      // Breathing
      agent.bodyGroup.position.y = 1.4 + Math.sin(t * 2) * 0.02;
      victim.bodyGroup.position.y = 1.4 + Math.sin(t * 2.2) * 0.02;

      // Agent gesticulation (Animus de enganar)
      if (s === 1 && !isExp) {
        agent.armR.rotation.z = damp(agent.armR.rotation.z, 0.4 + Math.sin(t * 6) * 0.2, 4, dt);
        agent.armR.rotation.x = damp(agent.armR.rotation.x, -0.5 + Math.sin(t * 4) * 0.2, 4, dt);
        agent.armL.rotation.x = damp(agent.armL.rotation.x, -0.3 + Math.cos(t * 5) * 0.1, 4, dt);
        agent.headGroup.rotation.y = Math.sin(t * 3) * 0.1;
      } else {
        agent.armR.rotation.z = damp(agent.armR.rotation.z, 0, 5, dt);
        agent.armR.rotation.x = damp(agent.armR.rotation.x, 0, 5, dt);
        agent.armL.rotation.x = damp(agent.armL.rotation.x, 0, 5, dt);
        agent.headGroup.rotation.y = damp(agent.headGroup.rotation.y, 0, 5, dt);
      }

      // Paper presentation
      if (s === 1) {
        paper.position.x = damp(paper.position.x, 0, 4, dt);
        paper.position.y = damp(paper.position.y, 1.15, 4, dt);
      } else if (s >= 2) {
        paper.position.x = damp(paper.position.x, -1.2, 4, dt);
        paper.position.y = damp(paper.position.y, 1.05, 4, dt);
      }

      // Vítima entrega a maleta
      if (s >= 2 && !isExp) {
        victim.armR.rotation.x = damp(victim.armR.rotation.x, -0.5, 4, dt);
        victim.armL.rotation.x = damp(victim.armL.rotation.x, -0.5, 4, dt);
        briefcase.position.x = damp(briefcase.position.x, -0.5, 3, dt);
        briefcase.position.y = damp(briefcase.position.y, 1.15, 3, dt);
      } else {
        victim.armR.rotation.x = damp(victim.armR.rotation.x, 0, 5, dt);
        victim.armL.rotation.x = damp(victim.armL.rotation.x, 0, 5, dt);
        if (s < 2) {
          briefcase.position.x = damp(briefcase.position.x, 2, 4, dt);
          briefcase.position.y = damp(briefcase.position.y, 1.35, 4, dt);
        }
      }

      // Agent foge com a maleta
      if (s === 3) {
        agent.group.position.x = damp(agent.group.position.x, -6, 2, dt);
        agent.group.rotation.y = damp(agent.group.rotation.y, Math.PI / 2, 3, dt);
        briefcase.position.x = damp(briefcase.position.x, -6, 2, dt);
        briefcase.position.y = damp(briefcase.position.y, 1.35, 2, dt);
      }

      composer.render();
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      composer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', onClick);
      cancelAnimationFrame(animationId);
      scene.traverse((object: any) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((m:any)=>m.dispose());
          else object.material.dispose();
        }
      });
      if (container && renderer.domElement && container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      composer.dispose();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  useEffect(() => {
    elementsRef.current.step = step;
    elementsRef.current.stepIdx = TIMELINE.findIndex(t => t.step === step);
  }, [step]);

  useEffect(() => {
    elementsRef.current.isExploring = isExploring;
  }, [isExploring]);

  return <div ref={mountRef} className="w-full h-full cursor-pointer" />;
};

export default function CenaArtigo171() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isExploring, setIsExploring] = useState(false);
  const [popup, setPopup] = useState<{label: string, x: number, y: number} | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  useEffect(() => {
    if (isExploring) {
      window.speechSynthesis.cancel();
      return;
    }
    
    if (ttsEnabled) {
      window.speechSynthesis.cancel();
      const text = TIMELINE[currentIdx].text;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      
      utterance.onend = () => {
        setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
        setPopup(null);
      };
      
      utterance.onerror = () => {
        setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
      };
      
      window.speechSynthesis.speak(utterance);
      
      return () => {
        window.speechSynthesis.cancel();
      };
    } else {
      const timeout = setTimeout(() => {
        setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
        setPopup(null);
      }, TIMELINE[currentIdx].duration);
      return () => clearTimeout(timeout);
    }
  }, [currentIdx, isExploring, ttsEnabled]);

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

        <Button 
          variant={isExploring ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setIsExploring(!isExploring);
            setPopup(null);
          }}
          className={`gap-2 transition-all ${isExploring ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-white/10 text-muted-foreground'}`}
        >
          <Compass className={`w-4 h-4 ${isExploring ? 'animate-spin-slow text-white' : ''}`} />
          {isExploring ? '360º Ativo' : 'Explorar 360º'}
        </Button>
      </div>

      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#f8fafc]">
        
        <VanillaThreeScene 
          step={TIMELINE[currentIdx].step} 
          isExploring={isExploring} 
          setPopup={setPopup} 
        />

        {!isExploring && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl">
            <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-emerald-600">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
              <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                {TIMELINE[currentIdx].text}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {TIMELINE.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'w-2 bg-slate-400/50'}`} />
              ))}
            </div>
          </div>
        )}

        {popup && (
          <div 
            className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-[120%] animate-in fade-in zoom-in duration-200"
            style={{ left: popup.x, top: popup.y }}
          >
            <div className="bg-black/90 backdrop-blur-md border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-2xl flex flex-col items-center whitespace-nowrap">
              {popup.label}
              <div className="absolute -bottom-1.5 w-3 h-3 bg-black/90 border-b border-r border-white/20 transform rotate-45"></div>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md border border-emerald-500/20 px-3 py-1.5 rounded-full z-10 pointer-events-none hidden sm:flex">
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Art. 171 - Estelionato (Voxel Mode)
          </span>
        </div>
      </div>
    </div>
  );
}
