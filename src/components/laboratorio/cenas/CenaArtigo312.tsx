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
  bg: 0xe2e8f0,
  floor: 0xcbd5e1,
  wallBack: 0x94a3b8,
  wallSide: 0x64748b,
  agent: 0x334155, // terno do funcionario
  skin: 0xfcd34d,
};

const TIMELINE = [
  { step: 0, duration: 4000, text: "Cena 1: Repartição pública. O funcionário público tem livre acesso ao cofre estatal.", cam: { x: 4, y: 5, z: 10, lookX: 0, lookY: 1.5, fov: 50 } },
  { step: 1, duration: 4000, text: "Sem precisar arrombar, o Agente se aproxima do bem de que tem posse em razão do cargo.", cam: { x: -2, y: 4, z: 8, lookX: -2, lookY: 1.5, fov: 55 } },
  { step: 2, duration: 4000, text: "O Agente apropria-se do dinheiro público para proveito próprio.", cam: { x: -3, y: 3, z: 6, lookX: -3, lookY: 1.5, fov: 60 } },
  { step: 3, duration: 5500, text: "Art. 312: Peculato. Apropriar-se o funcionário público de dinheiro ou bem móvel. Pena - reclusão, de 2 a 12 anos.", cam: { x: 0, y: 4, z: 12, lookX: -2, lookY: 1.5, fov: 55 } },
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

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(4, 5, 10);

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
    
    // Efeito sutil de CFTV
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.3, 0.2, 0.85
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    // Repartição Pública (Environment)
    const officeGroup = new THREE.Group();
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.25, 20),
      new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.8 })
    );
    floor.position.set(0, -0.12, 0);
    floor.receiveShadow = true;
    officeGroup.add(floor);

    const wallBack = new THREE.Mesh(
      new THREE.BoxGeometry(40, 15, 1),
      new THREE.MeshStandardMaterial({ color: COLORS.wallBack, roughness: 0.9 })
    );
    wallBack.position.set(0, 7.5, -6);
    wallBack.receiveShadow = true;
    officeGroup.add(wallBack);

    const wallSide = new THREE.Mesh(
      new THREE.BoxGeometry(1, 15, 20),
      new THREE.MeshStandardMaterial({ color: COLORS.wallSide, roughness: 0.9 })
    );
    wallSide.position.set(-10, 7.5, 4);
    wallSide.receiveShadow = true;
    officeGroup.add(wallSide);

    scene.add(officeGroup);

    // Mesa
    const tableGroup = new THREE.Group();
    tableGroup.position.set(2, 0, 0);
    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    tableTop.position.y = 1.0; tableTop.castShadow = true; tableTop.receiveShadow = true;
    const dLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    dLeg1.position.set(-1.3, 0.5, 0.5); dLeg1.castShadow = true;
    const dLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    dLeg2.position.set(1.3, 0.5, 0.5); dLeg2.castShadow = true;
    tableGroup.add(tableTop, dLeg1, dLeg2);
    scene.add(tableGroup);

    // Cofre
    const vaultGroup = new THREE.Group();
    const vault = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8, roughness: 0.2 })
    );
    vault.position.set(-4, 1.25, -2);
    vault.castShadow = true; vault.receiveShadow = true;
    vaultGroup.add(vault);
    
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    handle.position.set(-3.5, 1.5, -1.2);
    vaultGroup.add(handle);
    
    vaultGroup.userData = { label: 'Cofre Público' };
    scene.add(vaultGroup);

    // Dinheiro Público (Verde)
    const money = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    money.position.set(-3.5, 1.5, -1.2); // Posicionado dentro/perto da maçaneta por enquanto
    money.castShadow = true;
    money.userData = { label: 'Dinheiro Público (Posse em Razão do Cargo)' };
    scene.add(money);

    // Personagem Voxel (Funcionário Público)
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

      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.6), bodyMat);
      torso.position.y = 0.1; torso.castShadow = true;
      bodyGroup.add(torso);

      // Gravata do Funcionário
      const tie = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.8), new THREE.MeshBasicMaterial({ color: 0xb91c1c }));
      tie.position.set(0, 0.2, 0.31);
      bodyGroup.add(tie);

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.1;
      bodyGroup.add(headGroup);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
      head.castShadow = true;
      headGroup.add(head);

      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.85), new THREE.MeshStandardMaterial({ color: 0x050505 }));
      hair.position.y = 0.4;
      headGroup.add(hair);
      
      const eMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), eMat);
      eL.position.set(-0.18, 0.1, 0.41); eL.name = 'eyeL';
      const eR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), eMat);
      eR.position.set(0.18, 0.1, 0.41); eR.name = 'eyeR';
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

    const agent = createSquareHumanoid(COLORS.agent, 2, 2, 0, true);
    agent.group.userData = { label: 'Funcionário Público (Agente)' };

    elementsRef.current = {
      agent, money, vaultGroup, camera, controls, composer, isExploring
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

      // Câmera Estilo CFTV (Estática com leve drift)
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
      }

      // Agent Kinematics
      let tx = 2, tz = 2;
      if (s === 1 || s === 2) { tx = -2.5; tz = -1; }
      else if (s >= 3) { tx = -2.5; tz = 5; }
      
      agent.group.position.x = damp(agent.group.position.x, tx, 3, dt);
      agent.group.position.z = damp(agent.group.position.z, tz, 3, dt);

      // Walking
      if (!isExp && (s === 1 || s >= 3)) {
        agent.bodyGroup.position.y = 1.4 + Math.abs(Math.sin(t * 12)) * 0.15;
        agent.legR.rotation.x = Math.sin(t * 12) * 0.6;
        agent.legL.rotation.x = -Math.sin(t * 12) * 0.6;
        agent.armL.rotation.x = Math.sin(t * 12) * 0.4;
        agent.bodyGroup.rotation.z = Math.sin(t * 12) * 0.05;
        if (s !== 2) agent.armR.rotation.x = -Math.sin(t * 12) * 0.4;
      } else {
        agent.bodyGroup.position.y = damp(agent.bodyGroup.position.y, 1.4 + (isExp ? 0 : Math.sin(t * 2.5) * 0.02), 4, dt);
        agent.legR.rotation.x = damp(agent.legR.rotation.x, 0, 5, dt);
        agent.legL.rotation.x = damp(agent.legL.rotation.x, 0, 5, dt);
        agent.armL.rotation.x = damp(agent.armL.rotation.x, 0, 5, dt);
        agent.bodyGroup.rotation.z = damp(agent.bodyGroup.rotation.z, 0, 5, dt);
      }

      // Reaching for money
      if (s === 2) {
        agent.group.rotation.y = damp(agent.group.rotation.y, Math.PI / 2, 4, dt);
        agent.armR.rotation.x = damp(agent.armR.rotation.x, -Math.PI / 1.8, 4, dt);
      } else if (s >= 3) {
        agent.group.rotation.y = damp(agent.group.rotation.y, 0, 4, dt);
        agent.armR.rotation.x = damp(agent.armR.rotation.x, 0, 4, dt);
      } else {
        agent.group.rotation.y = damp(agent.group.rotation.y, Math.PI / 4, 4, dt);
      }

      // Money disappears into pocket
      if (s >= 2) {
        money.scale.x = damp(money.scale.x, 0, 5, dt);
        money.scale.y = damp(money.scale.y, 0, 5, dt);
        money.scale.z = damp(money.scale.z, 0, 5, dt);
      } else {
        money.scale.set(1, 1, 1);
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

export default function CenaArtigo312() {
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
          className={`gap-2 transition-all ${isExploring ? 'bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'border-white/10 text-muted-foreground'}`}
        >
          <Compass className={`w-4 h-4 ${isExploring ? 'animate-spin-slow text-white' : ''}`} />
          {isExploring ? '360º Ativo' : 'Explorar 360º'}
        </Button>
      </div>

      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#e2e8f0]">
        
        {/* CCTV Overlay Filter */}
        <div className="absolute top-4 left-4 z-20 text-red-600 font-mono text-xs sm:text-sm flex items-center gap-2 drop-shadow-md font-bold">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
          REC - CAM 01
        </div>

        <VanillaThreeScene 
          step={TIMELINE[currentIdx].step} 
          isExploring={isExploring} 
          setPopup={setPopup} 
        />

        {!isExploring && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-30">
            <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-slate-600">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
              <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                {TIMELINE[currentIdx].text}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {TIMELINE.map((_, i) => (
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

        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md border border-slate-400 px-3 py-1.5 rounded-full z-10 pointer-events-none hidden sm:flex">
          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
            Art. 312 - Peculato (Voxel Mode)
          </span>
        </div>
      </div>
    </div>
  );
}
