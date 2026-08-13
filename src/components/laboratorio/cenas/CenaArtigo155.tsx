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
  bg: 0x0f172a,
  sidewalk: 0x334155,
  road: 0x1e293b,
  grass: 0x14532d,
  agent: 0x475569,
  skin: 0xfcbca0,
};

const TIMELINE = [
  { step: 0, duration: 4000, text: "Cena 1: Uma bolsa repousa esquecida sobre um banco em uma praça deserta.", cam: { x: 0, y: 3, z: 10, lookX: 0, lookY: 1, fov: 50 } },
  { step: 1, duration: 4500, text: "Um indivíduo esgueira-se sorrateiramente por trás do banco, aproveitando-se da ausência da vítima.", cam: { x: -3, y: 2, z: 8, lookX: -1, lookY: 1, fov: 55 } },
  { step: 2, duration: 4500, text: "Sem o uso de violência ou grave ameaça (requisito do furto), ele estica a mão.", cam: { x: -1, y: 1.5, z: 5, lookX: -1, lookY: 1, fov: 60 } },
  { step: 3, duration: 5500, text: "O Agente subtrai a coisa alheia móvel para si e foge do local.", cam: { x: -2, y: 2, z: 10, lookX: -5, lookY: 1, fov: 50 } },
  { step: 4, duration: 5000, text: "Art. 155: Subtrair, para si ou para outrem, coisa alheia móvel. Pena: Reclusão de 1 a 4 anos.", cam: { x: 0, y: 3, z: 12, lookX: -4, lookY: 1.5, fov: 55 } },
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
    camera.position.set(0, 3, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
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
      1.0, 0.5, 0.85
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xbfdbfe, 0.8);
    moonLight.position.set(-15, 25, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 100;
    scene.add(moonLight);

    // Environment (Praça)
    const parkGroup = new THREE.Group();
    const grass = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.25, 20),
      new THREE.MeshStandardMaterial({ color: COLORS.grass, roughness: 0.9 })
    );
    grass.position.set(0, -0.12, -2);
    grass.receiveShadow = true;
    parkGroup.add(grass);
    
    const pathway = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.26, 4),
      new THREE.MeshStandardMaterial({ color: COLORS.sidewalk, roughness: 0.8 })
    );
    pathway.position.set(0, -0.11, 2);
    pathway.receiveShadow = true;
    parkGroup.add(pathway);
    scene.add(parkGroup);

    // Banco de Praça
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0, 0, 0);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 1), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
    seat.position.y = 0.6; seat.castShadow = true; seat.receiveShadow = true;
    const back = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
    back.position.set(0, 1.1, -0.5); back.castShadow = true; back.receiveShadow = true;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.8), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 }));
    legL.position.set(-1.5, 0.1, 0); legL.castShadow = true;
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.8), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 }));
    legR.position.set(1.5, 0.1, 0); legR.castShadow = true;
    benchGroup.add(seat, back, legL, legR);
    scene.add(benchGroup);

    // Poste de Luz
    const lp = new THREE.Group();
    lp.position.set(3.5, 0, -2);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 6, 16), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    pole.position.y = 3; pole.castShadow = true;
    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    bulbMesh.position.set(0, 6, 0);
    lp.add(pole, bulbMesh);
    const sl = new THREE.PointLight(0xfef08a, 2.5, 20, 1.5); 
    sl.position.set(0, 6, 0); sl.castShadow = true;
    lp.add(sl);
    scene.add(lp);

    // Objeto Subtraído (Bolsa)
    const bagGroup = new THREE.Group();
    bagGroup.position.set(0.5, 0.85, 0);
    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0x9d174d }));
    bagBody.castShadow = true;
    bagGroup.add(bagBody);
    bagGroup.userData = { label: 'Bolsa (Coisa Alheia Móvel)' };
    scene.add(bagGroup);

    // Personagens
    const createSquareHumanoid = (color: number, startX: number, isAgent: boolean) => {
      const group = new THREE.Group();
      group.position.set(startX, 0, 0);
      
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

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.1;
      bodyGroup.add(headGroup);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), isAgent ? bodyMat : skinMat);
      head.castShadow = true;
      headGroup.add(head);

      if (isAgent) { // Masked Agent
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x050505 }));
        slit.position.set(0, 0, 0.4);
        headGroup.add(slit);
        const eMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), eMat);
        eL.position.set(-0.16, 0, 0.41); eL.name = 'eyeL';
        const eR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), eMat);
        eR.position.set(0.16, 0, 0.41); eR.name = 'eyeR';
        headGroup.add(eL, eR);
      }

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

    const agent = createSquareHumanoid(COLORS.agent, -8, true);
    agent.group.userData = { label: 'Agente (Art. 155)' };

    elementsRef.current = {
      agent, bagGroup, camera, controls, composer, isExploring
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
    const camTarget = new THREE.Vector3(0, 1, 0);

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

      // Agent Kinematics
      let tx = -8, tz = -2;
      if (s === 1 || s === 2) { tx = -1; tz = -1; }
      else if (s >= 3) { tx = -12; tz = -2; }
      
      agent.group.position.x = damp(agent.group.position.x, tx, 3, dt);
      agent.group.position.z = damp(agent.group.position.z, tz, 3, dt);

      // Sneaky walk
      if (!isExp && (s === 1 || s >= 3)) {
        agent.bodyGroup.position.y = 1.2 + Math.abs(Math.sin(t * 12)) * 0.15;
        agent.legR.rotation.x = Math.sin(t * 12) * 0.5;
        agent.legL.rotation.x = -Math.sin(t * 12) * 0.5;
        agent.armL.rotation.x = Math.sin(t * 12) * 0.3;
        agent.bodyGroup.rotation.z = Math.sin(t * 12) * 0.05;
        agent.bodyGroup.rotation.x = 0.2; // Corcunda
        if (s !== 2) agent.armR.rotation.x = -Math.sin(t * 12) * 0.3;
      } else {
        agent.bodyGroup.position.y = damp(agent.bodyGroup.position.y, 1.4 + (isExp ? 0 : Math.sin(t * 2.5) * 0.02), 4, dt);
        agent.legR.rotation.x = damp(agent.legR.rotation.x, 0, 5, dt);
        agent.legL.rotation.x = damp(agent.legL.rotation.x, 0, 5, dt);
        agent.armL.rotation.x = damp(agent.armL.rotation.x, 0, 5, dt);
        agent.bodyGroup.rotation.z = damp(agent.bodyGroup.rotation.z, 0, 5, dt);
        agent.bodyGroup.rotation.x = damp(agent.bodyGroup.rotation.x, 0, 5, dt);
      }

      // Reaching for bag
      if (s === 2) {
        agent.armR.rotation.x = damp(agent.armR.rotation.x, -Math.PI / 1.5, 4, dt);
        agent.armR.rotation.z = damp(agent.armR.rotation.z, -0.2, 4, dt);
      } else {
        agent.armR.rotation.z = damp(agent.armR.rotation.z, 0, 4, dt);
      }

      let aRotY = Math.PI / 2;
      if (s >= 3) aRotY = -Math.PI / 2;
      agent.group.rotation.y = damp(agent.group.rotation.y, aRotY, 5, dt);

      // Bag movement
      if (s >= 3) {
        // Bag attaches to agent's hand
        const handWorld = new THREE.Vector3();
        agent.armR.children[0].getWorldPosition(handWorld);
        bagGroup.position.copy(agent.group.position).add(new THREE.Vector3(0, 1.2, 0.5));
        bagGroup.rotation.z = -0.2;
      } else {
        bagGroup.position.x = damp(bagGroup.position.x, 0.5, 5, dt);
        bagGroup.position.y = damp(bagGroup.position.y, 0.85, 5, dt);
        bagGroup.position.z = damp(bagGroup.position.z, 0, 5, dt);
        bagGroup.rotation.z = damp(bagGroup.rotation.z, 0, 5, dt);
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

export default function CenaArtigo155() {
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
          className={`gap-2 transition-all ${isExploring ? 'bg-blue-600 hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'border-white/10 text-muted-foreground'}`}
        >
          <Compass className={`w-4 h-4 ${isExploring ? 'animate-spin-slow text-white' : ''}`} />
          {isExploring ? '360º Ativo' : 'Explorar 360º'}
        </Button>
      </div>

      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#0f172a]">
        
        <VanillaThreeScene 
          step={TIMELINE[currentIdx].step} 
          isExploring={isExploring} 
          setPopup={setPopup} 
        />

        {!isExploring && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl">
            <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-blue-600">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
              <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                {TIMELINE[currentIdx].text}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {TIMELINE.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,1)]' : 'w-2 bg-white/50'}`} />
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

        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-blue-900/50 px-3 py-1.5 rounded-full z-10 pointer-events-none hidden sm:flex">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Art. 155 - Furto (Voxel Mode)
          </span>
        </div>
      </div>
    </div>
  );
}
