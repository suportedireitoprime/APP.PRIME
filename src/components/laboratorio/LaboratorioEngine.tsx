import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { Button } from '@/components/ui/button';
import { Compass, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface SceneJSON {
  environment: 'alley' | 'park' | 'office' | 'generic';
  timeline: Array<{
    step: number;
    duration: number;
    text: string;
    cam: { x: number; y: number; z: number; lookX: number; lookY: number; fov: number };
    agent_pos: { x: number; z: number; rotY: number };
    victim_pos?: { x: number; z: number; rotY: number } | null;
  }>;
}

const COLORS = {
  bg: 0x0a1128,
  sidewalk: 0x334155,
  road: 0x1e293b,
  building: 0x1e293b,
  windowLight: 0xfef08a,
  robber: 0xdc2626,
  victim: 0xf59e0b,
  skin: 0xfcbca0,
};

const LaboratorioEngineCore = ({ config, step, isExploring, setPopup }: { config: SceneJSON; step: number; isExploring: boolean; setPopup: any }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mountRef.current || !config || !config.timeline) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.015);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(4, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = false;
    controls.maxPolarAngle = Math.PI / 2;

    // --- POST-PROCESSING STACK ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const smaaPass = new SMAAPass(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
    composer.addPass(smaaPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.2, 0.5, 0.85);
    composer.addPass(bloomPass);

    const filmPass = new FilmPass(0.35, 0.025, 648, false);
    composer.addPass(filmPass);

    // Contorno de Quadrinhos / HQ
    const outlinePass = new OutlinePass(new THREE.Vector2(width, height), scene, camera);
    outlinePass.edgeStrength = 4.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.edgeThickness = 1.5;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set('#000000');
    outlinePass.hiddenEdgeColor.set('#000000');
    composer.addPass(outlinePass);

    composer.addPass(new OutputPass());

    // Toon Shading Map
    const colors = new Uint8Array([50, 150, 255]);
    const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
    gradientMap.needsUpdate = true;

    // Iluminação Global
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xbfdbfe, 2.0);
    moonLight.position.set(-15, 25, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 100;
    moonLight.shadow.camera.left = -20;
    moonLight.shadow.camera.right = 20;
    moonLight.shadow.camera.top = 20;
    moonLight.shadow.camera.bottom = -20;
    moonLight.shadow.bias = -0.0005;
    scene.add(moonLight);

    const moonGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-20, 25, -30);
    scene.add(moon);

    // Cenário: Chão
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(120, 0.25, 6),
      new THREE.MeshToonMaterial({ color: COLORS.sidewalk, gradientMap })
    );
    sidewalk.position.set(0, -0.12, 0);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    const road = new THREE.Mesh(
      new THREE.BoxGeometry(120, 0.12, 25),
      new THREE.MeshToonMaterial({ color: COLORS.road, gradientMap })
    );
    road.position.set(0, -0.18, 15.5);
    road.receiveShadow = true;
    scene.add(road);

    // Cenário: Prédios Procedurais da Cidade
    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, 0, -5);
    for (let i = -20; i < 20; i++) {
      const h = 8 + Math.random() * 30;
      const w = 4 + Math.random() * 6;
      const d = 4 + Math.random() * 6;
      const bMat = new THREE.MeshToonMaterial({ color: COLORS.building, gradientMap });
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat);
      bldg.position.set(i * 5 + Math.random() * 2, h / 2, -d / 2 - Math.random() * 4);
      bldg.castShadow = true;
      bldg.receiveShadow = true;

      const winMat = new THREE.MeshBasicMaterial({ color: COLORS.windowLight }); 
      const winDarkMat = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap });
      for (let wy = 2; wy < h - 1; wy += 2.5) {
        for (let wx = -w / 2 + 0.8; wx < w / 2 - 0.5; wx += 1.5) {
          const isLit = Math.random() > 0.6;
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), isLit ? winMat : winDarkMat);
          win.position.set(wx, -h / 2 + wy, d / 2 + 0.01);
          bldg.add(win);
        }
      }
      cityGroup.add(bldg);
    }
    scene.add(cityGroup);

    // Construtor Voxel Actor Biomecânico
    const createSquareHumanoid = (color: number, startX: number, startZ: number, rotY: number, label: string) => {
      const group = new THREE.Group();
      group.position.set(startX, 0, startZ);
      group.rotation.y = rotY;
      group.userData = { label };
      
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

      const bodyMat = new THREE.MeshToonMaterial({ color, gradientMap });
      const skinMat = new THREE.MeshToonMaterial({ color: COLORS.skin, gradientMap });
      const darkMat = new THREE.MeshToonMaterial({ color: 0x111111, gradientMap });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.6), bodyMat);
      torso.position.y = 0.1;
      torso.castShadow = true;
      bodyGroup.add(torso);

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.1;
      bodyGroup.add(headGroup);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
      head.castShadow = true;
      headGroup.add(head);
      
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.85), new THREE.MeshToonMaterial({ color: 0x3f3f46, gradientMap }));
      hair.position.y = 0.4;
      headGroup.add(hair);
      
      const eMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), eMat);
      eL.position.set(-0.18, 0.1, 0.41);
      const eR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), eMat);
      eR.position.set(0.18, 0.1, 0.41);
      headGroup.add(eL, eR);

      const armR = new THREE.Group();
      armR.position.set(0.65, 0.6, 0);
      const armRM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), bodyMat);
      armRM.position.y = -0.4; armRM.castShadow = true;
      armR.add(armRM);
      bodyGroup.add(armR);

      const armL = new THREE.Group();
      armL.position.set(-0.65, 0.6, 0);
      const armLM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), bodyMat);
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

    const firstStep = config.timeline[0];
    const agent = createSquareHumanoid(COLORS.robber, firstStep.agent_pos?.x ?? 2, firstStep.agent_pos?.z ?? 2, firstStep.agent_pos?.rotY ?? 0, 'Infrator/Agente');
    
    let victim = null;
    if (firstStep.victim_pos) {
      victim = createSquareHumanoid(COLORS.victim, firstStep.victim_pos.x, firstStep.victim_pos.z, firstStep.victim_pos.rotY, 'Vítima/Objeto');
    }

    outlinePass.selectedObjects = victim ? [agent.group, victim.group] : [agent.group];

    elementsRef.current = { agent, victim, camera, controls, composer, isExploring, config };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      if (!elementsRef.current.isExploring) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      let found = false;
      for (let i = 0; i < intersects.length; i++) {
        let obj: any = intersects[i].object;
        while(obj && !obj.userData?.label) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.label) {
          setPopup({ label: obj.userData.label, x: e.clientX - rect.left, y: e.clientY - rect.top });
          found = true;
          break;
        }
      }
      if (!found) setPopup(null);
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
      const s = elementsRef.current.stepIdx ?? 0;
      const isExp = elementsRef.current.isExploring;
      const cfg = elementsRef.current.config;
      
      const stepData = cfg.timeline[s] || cfg.timeline[0];

      if (isExp) {
        controls.enabled = true;
        controls.update();
      } else {
        controls.enabled = false;
        camera.fov = damp(camera.fov, stepData.cam?.fov ?? 50, 2, dt);
        camera.updateProjectionMatrix();
        camera.position.x = damp(camera.position.x, stepData.cam?.x ?? 0, 2, dt);
        // Força a câmera a ficar mais alta (mínimo 8) e mais afastada para não cortar os personagens
        camera.position.y = damp(camera.position.y, Math.max((stepData.cam?.y ?? 5) + 4, 8), 2, dt);
        camera.position.z = damp(camera.position.z, Math.max((stepData.cam?.z ?? 10) + 4, 12), 2, dt);
        camTarget.x = damp(camTarget.x, stepData.cam?.lookX ?? 0, 2, dt);
        camTarget.y = damp(camTarget.y, (stepData.cam?.lookY ?? 1.5) - 0.5, 2, dt); // Olha um pouco mais para baixo
        camera.lookAt(camTarget);
        
        // Drift cinematográfico
        camera.position.x += Math.sin(t * 1.8) * 0.005;
        camera.position.y += Math.cos(t * 2.2) * 0.004;
      }

      const updateHumanoid = (hum: any, targetPos: {x: number, z: number, rotY: number} | undefined) => {
        if (!hum || !targetPos) return;
        
        const distToTarget = Math.sqrt(
          Math.pow(hum.group.position.x - targetPos.x, 2) + 
          Math.pow(hum.group.position.z - targetPos.z, 2)
        );

        hum.group.position.x = damp(hum.group.position.x, targetPos.x, 3, dt);
        hum.group.position.z = damp(hum.group.position.z, targetPos.z, 3, dt);
        hum.group.rotation.y = damp(hum.group.rotation.y, targetPos.rotY, 4, dt);

        const isMoving = distToTarget > 0.05 && !isExp;
        
        if (isMoving) {
          hum.bodyGroup.position.y = 1.4 + Math.abs(Math.sin(t * 18)) * 0.25;
          hum.legR.rotation.x = Math.sin(t * 18) * 0.8;
          hum.legL.rotation.x = -Math.sin(t * 18) * 0.8;
          hum.armL.rotation.x = Math.sin(t * 18) * 0.6;
          hum.armR.rotation.x = -Math.sin(t * 18) * 0.5;
          hum.bodyGroup.rotation.z = Math.sin(t * 18) * 0.05;
        } else {
          hum.bodyGroup.position.y = damp(hum.bodyGroup.position.y, 1.4 + (isExp ? 0 : Math.sin(t * 2.5) * 0.02), 4, dt);
          hum.legR.rotation.x = damp(hum.legR.rotation.x, 0, 5, dt);
          hum.legL.rotation.x = damp(hum.legL.rotation.x, 0, 5, dt);
          hum.armL.rotation.x = damp(hum.armL.rotation.x, 0, 5, dt);
          hum.armR.rotation.x = damp(hum.armR.rotation.x, 0, 7, dt);
          hum.bodyGroup.rotation.z = damp(hum.bodyGroup.rotation.z, 0, 5, dt);
        }
      };

      updateHumanoid(elementsRef.current.agent, stepData.agent_pos);
      updateHumanoid(elementsRef.current.victim, stepData.victim_pos);

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
      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m:any)=>m.dispose());
          else obj.material.dispose();
        }
      });
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      composer.dispose();
      renderer.dispose();
      controls.dispose();
    };
  }, [config]);

  useEffect(() => {
    if (config && config.timeline) {
      elementsRef.current.stepIdx = config.timeline.findIndex(t => t.step === step);
      if (elementsRef.current.stepIdx === -1) elementsRef.current.stepIdx = 0;
    }
  }, [step, config]);

  useEffect(() => {
    elementsRef.current.isExploring = isExploring;
  }, [isExploring]);

  return <div ref={mountRef} className="w-full h-full cursor-pointer" />;
};

export default function LaboratorioEngine({ config }: { config: SceneJSON }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isExploring, setIsExploring] = useState(false);
  const [popup, setPopup] = useState<{label: string, x: number, y: number} | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const timeline = config?.timeline || [];

  useEffect(() => {
    if (isExploring) {
      window.speechSynthesis.cancel();
      return;
    }
    
    if (ttsEnabled) {
      window.speechSynthesis.cancel();
      const text = timeline[currentIdx]?.text || '';
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      
      utterance.onend = () => {
        setCurrentIdx(prev => (prev + 1 >= timeline.length ? 0 : prev + 1));
        setPopup(null);
      };
      
      utterance.onerror = () => {
        setCurrentIdx(prev => (prev + 1 >= timeline.length ? 0 : prev + 1));
      };
      
      window.speechSynthesis.speak(utterance);
      
      return () => {
        window.speechSynthesis.cancel();
      };
    } else {
      const timeout = setTimeout(() => {
        setCurrentIdx(prev => (prev + 1 >= timeline.length ? 0 : prev + 1));
        setPopup(null);
      }, timeline[currentIdx]?.duration || 5000);
      return () => clearTimeout(timeout);
    }
  }, [currentIdx, isExploring, ttsEnabled, timeline]);

  if (!config || !config.timeline || config.timeline.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-white">Carregando Cena...</div>;
  }

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center p-0 m-0">
      <div className="absolute top-4 right-20 z-50 flex gap-2">
        <Button 
          variant={ttsEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`gap-2 transition-all shadow-lg ${ttsEnabled ? 'bg-amber-600 hover:bg-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'bg-black/60 backdrop-blur-md border-white/10 text-white hover:bg-white/20'}`}
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4" />}
          {ttsEnabled ? 'Narração Ativa' : 'Áudio Mudo'}
        </Button>

        <Button 
          variant={isExploring ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setIsExploring(!isExploring);
            setPopup(null);
          }}
          className={`gap-2 transition-all shadow-lg ${isExploring ? 'bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-black/60 backdrop-blur-md border-white/10 text-white hover:bg-white/20'}`}
        >
          <Compass className={`w-4 h-4 ${isExploring ? 'animate-spin-slow text-white' : ''}`} />
          {isExploring ? 'Desativar 360º' : 'Explorar 360º'}
        </Button>
      </div>

      <div className="relative w-full h-full overflow-hidden bg-[#e2e8f0]">
        <LaboratorioEngineCore 
          config={config}
          step={timeline[currentIdx]?.step || 0} 
          isExploring={isExploring} 
          setPopup={setPopup} 
        />

        {!isExploring && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-30 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={timeline[currentIdx]?.text}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-indigo-600 relative"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
                <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                  {timeline[currentIdx]?.text}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {timeline.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,1)]' : 'w-2 bg-white/50'}`} />
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
      </div>
    </div>
  );
}
