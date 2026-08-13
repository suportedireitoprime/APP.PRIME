import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Button } from '@/components/ui/button';
import { Compass, Volume2, VolumeX } from 'lucide-react';

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
  bg: 0x0f172a,
  agent: 0x1e293b,
  victim: 0x3b82f6,
  skin: 0xfcd34d,
};

const LaboratorioEngine = ({ config, step, isExploring, setPopup }: { config: SceneJSON; step: number; isExploring: boolean; setPopup: any }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mountRef.current || !config || !config.timeline) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    
    const isDark = config.environment === 'alley' || config.environment === 'park';
    scene.background = new THREE.Color(isDark ? 0x020617 : 0xe2e8f0);
    scene.fog = new THREE.FogExp2(isDark ? 0x020617 : 0xe2e8f0, 0.015);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(4, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = false;
    controls.maxPolarAngle = Math.PI / 2;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    if (isDark) {
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.6, 0.3, 0.8));
    }
    composer.addPass(new OutputPass());

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.3 : 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.8 : 1.2);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    if (isDark) {
      const spot = new THREE.SpotLight(0x3b82f6, 50);
      spot.position.set(0, 8, 0);
      spot.angle = Math.PI / 6;
      spot.penumbra = 0.5;
      spot.castShadow = true;
      scene.add(spot);
    }

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.25, 40),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0xcbd5e1, roughness: 0.8 })
    );
    floor.position.y = -0.12;
    floor.receiveShadow = true;
    scene.add(floor);

    const createSquareHumanoid = (color: number, startX: number, startZ: number, rotY: number, label: string) => {
      const group = new THREE.Group();
      group.position.set(startX, 0, startZ);
      group.rotation.y = rotY;
      group.userData = { label };
      
      const bodyGroup = new THREE.Group();
      bodyGroup.position.y = 1.4;
      group.add(bodyGroup);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.6), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
      torso.castShadow = true;
      bodyGroup.add(torso);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: COLORS.skin }));
      head.position.y = 1.1; head.castShadow = true;
      bodyGroup.add(head);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      legR.position.set(0.25, 0.45, 0); legR.castShadow = true;
      group.add(legR);

      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      legL.position.set(-0.25, 0.45, 0); legL.castShadow = true;
      group.add(legL);

      scene.add(group);
      return { group, legR, legL };
    };

    const firstStep = config.timeline[0];
    const agent = createSquareHumanoid(COLORS.agent, firstStep.agent_pos?.x ?? 2, firstStep.agent_pos?.z ?? 2, firstStep.agent_pos?.rotY ?? 0, 'Infrator/Agente');
    
    let victim = null;
    if (firstStep.victim_pos) {
      victim = createSquareHumanoid(COLORS.victim, firstStep.victim_pos.x, firstStep.victim_pos.z, firstStep.victim_pos.rotY, 'Vítima/Objeto');
    }

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
        camera.position.y = damp(camera.position.y, stepData.cam?.y ?? 5, 2, dt);
        camera.position.z = damp(camera.position.z, stepData.cam?.z ?? 10, 2, dt);
        camTarget.x = damp(camTarget.x, stepData.cam?.lookX ?? 0, 2, dt);
        camTarget.y = damp(camTarget.y, stepData.cam?.lookY ?? 1.5, 2, dt);
        camera.lookAt(camTarget);
      }

      const ag = elementsRef.current.agent;
      if (ag && stepData.agent_pos) {
        ag.group.position.x = damp(ag.group.position.x, stepData.agent_pos.x, 3, dt);
        ag.group.position.z = damp(ag.group.position.z, stepData.agent_pos.z, 3, dt);
        ag.group.rotation.y = damp(ag.group.rotation.y, stepData.agent_pos.rotY, 4, dt);
      }

      const vic = elementsRef.current.victim;
      if (vic && stepData.victim_pos) {
        vic.group.position.x = damp(vic.group.position.x, stepData.victim_pos.x, 3, dt);
        vic.group.position.z = damp(vic.group.position.z, stepData.victim_pos.z, 3, dt);
        vic.group.rotation.y = damp(vic.group.rotation.y, stepData.victim_pos.rotY, 4, dt);
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

export default function GenericLaboratorioScene({ config }: { config: SceneJSON }) {
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
          className={`gap-2 transition-all ${isExploring ? 'bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'border-white/10 text-muted-foreground'}`}
        >
          <Compass className={`w-4 h-4 ${isExploring ? 'animate-spin-slow text-white' : ''}`} />
          {isExploring ? '360º Ativo' : 'Explorar 360º'}
        </Button>
      </div>

      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#e2e8f0]">
        
        <LaboratorioEngine 
          config={config}
          step={timeline[currentIdx]?.step || 0} 
          isExploring={isExploring} 
          setPopup={setPopup} 
        />

        {!isExploring && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-30">
            <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-slate-600">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
              <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                {timeline[currentIdx]?.text}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {timeline.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-slate-600 shadow-[0_0_8px_rgba(71,85,105,1)]' : 'w-2 bg-white/50'}`} />
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
