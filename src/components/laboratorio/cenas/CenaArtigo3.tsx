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

const COLORS = {
  bgNight: 0x0f172a,
  bgDay: 0x38bdf8,
  floor: 0x475569,
  buildings: 0x1e293b,
  agent: 0xef4444,
  police: 0x3b82f6,
  skin: 0xfcbca0,
  neonRed: 0xff0000,
  neonGreen: 0x22c55e,
  box: 0xb45309,
};

const TIMELINE = [
  { step: 0, duration: 7000, text: "Estado de Calamidade: 'Lei Temporária' (Toque de Recolher) em vigor.", cam: { x: 0, y: 3, z: 12, lookX: 0, lookY: 1.5, fov: 55 } },
  { step: 1, duration: 7000, text: "O infrator desrespeita a norma e saqueia suprimentos durante a emergência.", cam: { x: -4, y: 2, z: 6, lookX: -1, lookY: 1.5, fov: 50 } },
  { step: 2, duration: 7000, text: "O tempo passa... O estado de emergência acaba e a lei temporária perde a vigência.", cam: { x: 0, y: 8, z: 10, lookX: 0, lookY: 3, fov: 65 } },
  { step: 3, duration: 7000, text: "Com o fim da vigência, o infrator acredita que ficará impune.", cam: { x: 3, y: 1.5, z: 6, lookX: 1, lookY: 1.5, fov: 55 } },
  { step: 4, duration: 8000, text: "Art. 3º: A lei excepcional ou temporária aplica-se ao fato praticado durante sua vigência.", cam: { x: 0, y: 3, z: 10, lookX: 0, lookY: 1.5, fov: 50 } },
];

const VanillaThreeScene = ({ step, isExploring, setPopup }: { step: number, isExploring: boolean, setPopup: any }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bgNight);
    scene.fog = new THREE.FogExp2(COLORS.bgNight, 0.02);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 3, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
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
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new SMAAPass(container.clientWidth * renderer.getPixelRatio(), container.clientHeight * renderer.getPixelRatio()));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.2, 0.5, 0.85));
    composer.addPass(new FilmPass(0.35, 0.025, 648, false));

    const outlinePass = new OutlinePass(new THREE.Vector2(container.clientWidth, container.clientHeight), scene, camera);
    outlinePass.edgeStrength = 4.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.edgeThickness = 1.5;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set('#000000');
    outlinePass.hiddenEdgeColor.set('#000000');
    composer.addPass(outlinePass);
    composer.addPass(new OutputPass());

    const colors = new Uint8Array([30, 120, 255]);
    const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
    gradientMap.needsUpdate = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.1); // Começa noite
    sunLight.position.set(10, 20, -10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const moonLight = new THREE.DirectionalLight(0x60a5fa, 2.0); // Luz da lua na crise
    moonLight.position.set(-10, 15, -10);
    moonLight.castShadow = true;
    moonLight.shadow.bias = -0.0005;
    scene.add(moonLight);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(100, 0.5, 100),
      new THREE.MeshToonMaterial({ color: COLORS.floor, gradientMap })
    );
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);

    // Rua e Prédios
    const cityGroup = new THREE.Group();
    const wallMat = new THREE.MeshToonMaterial({ color: COLORS.buildings, gradientMap });
    for(let i=-2; i<=2; i++) {
        if(i===0) continue;
        const b = new THREE.Mesh(new THREE.BoxGeometry(4, 15 + Math.random()*5, 4), wallMat);
        b.position.set(i*5, 7.5, -4);
        b.castShadow = true; b.receiveShadow = true;
        cityGroup.add(b);
    }
    scene.add(cityGroup);

    // Letreiro de Neon (Lei Temporária vs Estado Normal)
    const neonMat = new THREE.MeshBasicMaterial({ color: COLORS.neonRed });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 0.5), new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap }));
    signBoard.position.set(0, 10, -2);
    signBoard.castShadow = true;
    
    const neonText = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.5), neonMat);
    neonText.position.set(0, 0, 0.26);
    signBoard.add(neonText);
    scene.add(signBoard);

    // Barricadas da Crise
    const barricadeGroup = new THREE.Group();
    const barrMat = new THREE.MeshToonMaterial({ color: 0xeab308, gradientMap });
    for(let i=-2; i<=2; i++) {
        const barr = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.5), barrMat);
        barr.position.set(i*3, 0.5, 1);
        barr.rotation.y = (Math.random() - 0.5) * 0.5;
        barr.castShadow = true;
        barricadeGroup.add(barr);
    }
    scene.add(barricadeGroup);

    // Suprimentos Saqueados
    const supplyGroup = new THREE.Group();
    const boxMat = new THREE.MeshToonMaterial({ color: COLORS.box, gradientMap });
    const sBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), boxMat);
    sBox.position.set(-1.5, 0.4, 3); sBox.castShadow = true;
    supplyGroup.add(sBox);
    scene.add(supplyGroup);

    const createHumanoid = (color: number) => {
        const group = new THREE.Group();
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 1.4;
        group.add(bodyGroup);

        const clothMat = new THREE.MeshToonMaterial({ color, gradientMap });
        const skinMat = new THREE.MeshToonMaterial({ color: COLORS.skin, gradientMap });
        const shoeMat = new THREE.MeshToonMaterial({ color: 0x111111, gradientMap });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.6), clothMat);
        torso.position.y = 0.1; torso.castShadow = true;
        bodyGroup.add(torso);

        const headGroup = new THREE.Group();
        headGroup.position.y = 1.1;
        bodyGroup.add(headGroup);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
        head.castShadow = true;
        headGroup.add(head);

        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.85), shoeMat);
        hair.position.y = 0.45; headGroup.add(hair);

        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0x18181b }));
        eyeL.position.set(-0.18, 0.1, 0.41);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0x18181b }));
        eyeR.position.set(0.18, 0.1, 0.41);
        headGroup.add(eyeL, eyeR);

        const armR = new THREE.Group(); armR.position.set(0.65, 0.6, 0);
        const armRM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), skinMat);
        armRM.position.y = -0.4; armRM.castShadow = true;
        const sleeveR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.32), clothMat);
        sleeveR.position.y = 0.4; armRM.add(sleeveR);
        armR.add(armRM); bodyGroup.add(armR);

        const armL = new THREE.Group(); armL.position.set(-0.65, 0.6, 0);
        const armLM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), skinMat);
        armLM.position.y = -0.4; armLM.castShadow = true;
        const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.32), clothMat);
        sleeveL.position.y = 0.4; armLM.add(sleeveL);
        armL.add(armLM); bodyGroup.add(armL);

        const legR = new THREE.Group(); legR.position.set(0.25, 0.8, 0);
        const legRM = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), clothMat);
        legRM.position.y = -0.35; legRM.castShadow = true;
        const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.5), shoeMat);
        shoeR.position.set(0, -0.85, 0.07);
        legR.add(legRM, shoeR); group.add(legR);

        const legL = new THREE.Group(); legL.position.set(-0.25, 0.8, 0);
        const legLM = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), clothMat);
        legLM.position.y = -0.35; legLM.castShadow = true;
        const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.5), shoeMat);
        shoeL.position.set(0, -0.85, 0.07);
        legL.add(legLM, shoeL); group.add(legL);

        return { group, bodyGroup, headGroup, armR, armL, legR, legL };
    };

    const agent = createHumanoid(COLORS.agent);
    agent.group.position.set(-1.5, 0, 5);
    scene.add(agent.group);

    const cop = createHumanoid(COLORS.police);
    cop.group.position.set(10, 0, 3); // Fora da tela no começo
    scene.add(cop.group);

    // Banco de praça (para o infrator relaxar depois)
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 1), new THREE.MeshToonMaterial({ color: 0x451a03, gradientMap }));
    bench.position.set(2, 0.25, 3);
    bench.castShadow = true;
    scene.add(bench);

    outlinePass.selectedObjects = [agent.group, cop.group, supplyGroup, signBoard, barricadeGroup];

    elementsRef.current = { agent, cop, supplyGroup, signBoard, neonMat, barricadeGroup, sunLight, moonLight, ambientLight, scene, camera, controls, composer, isExploring };

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
        while(obj && !obj.userData?.label) obj = obj.parent;
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

      // Mudança de Clima / Tempo (Calamidade vs Normalidade)
      if (s >= 2) {
        // Dia e Normalidade
        scene.fog!.color.lerp(new THREE.Color(COLORS.bgDay), 0.05);
        scene.background = scene.fog!.color;
        sunLight.intensity = damp(sunLight.intensity, 3.0, 2, dt);
        moonLight.intensity = damp(moonLight.intensity, 0, 2, dt);
        ambientLight.intensity = damp(ambientLight.intensity, 0.6, 2, dt);
        neonMat.color.lerp(new THREE.Color(COLORS.neonGreen), 0.1);
        barricadeGroup.position.y = damp(barricadeGroup.position.y, -5, 2, dt); // Somem
      } else {
        // Noite e Crise
        scene.fog!.color.lerp(new THREE.Color(COLORS.bgNight), 0.05);
        scene.background = scene.fog!.color;
        sunLight.intensity = damp(sunLight.intensity, 0.1, 2, dt);
        moonLight.intensity = damp(moonLight.intensity, 2.0, 2, dt);
        ambientLight.intensity = damp(ambientLight.intensity, 0.2, 2, dt);
        neonMat.color.lerp(new THREE.Color(COLORS.neonRed), 0.1);
        barricadeGroup.position.y = damp(barricadeGroup.position.y, 0, 2, dt);
      }

      // Sol girando para mostrar o tempo passando rápido
      if (s === 2) {
        sunLight.position.x = Math.sin(t * 3) * 20;
        sunLight.position.z = Math.cos(t * 3) * 20;
      } else {
        sunLight.position.x = damp(sunLight.position.x, 10, 2, dt);
        sunLight.position.z = damp(sunLight.position.z, -10, 2, dt);
      }

      // Cinemática do Infrator
      if (s === 1) {
        // Saqueando a caixa
        agent.group.position.x = damp(agent.group.position.x, -1.5, 3, dt);
        agent.group.position.z = damp(agent.group.position.z, 4, 3, dt);
        agent.group.rotation.y = damp(agent.group.rotation.y, 0, 3, dt);
        agent.bodyGroup.position.y = damp(agent.bodyGroup.position.y, 1.0, 4, dt); // Agachado
        agent.armR.rotation.x = damp(agent.armR.rotation.x, -1, 4, dt);
        agent.armL.rotation.x = damp(agent.armL.rotation.x, -1, 4, dt);
        agent.legR.rotation.x = damp(agent.legR.rotation.x, -0.5, 4, dt);
        agent.legL.rotation.x = damp(agent.legL.rotation.x, 0.5, 4, dt);
      } else if (s === 2 || s === 3) {
        // Relaxando no banco, achando que tá de boa
        agent.group.position.x = damp(agent.group.position.x, 2, 4, dt);
        agent.group.position.z = damp(agent.group.position.z, 3.5, 4, dt);
        agent.group.rotation.y = damp(agent.group.rotation.y, -Math.PI/2, 4, dt);
        agent.bodyGroup.position.y = damp(agent.bodyGroup.position.y, 1.2, 4, dt);
        agent.armR.rotation.x = damp(agent.armR.rotation.x, 0, 4, dt);
        agent.armL.rotation.x = damp(agent.armL.rotation.x, 0, 4, dt);
        agent.legR.rotation.x = damp(agent.legR.rotation.x, -1.5, 4, dt);
        agent.legL.rotation.x = damp(agent.legL.rotation.x, -1.5, 4, dt);
      } else if (s === 4) {
        // Preso
        agent.group.rotation.y = damp(agent.group.rotation.y, Math.PI, 4, dt);
        agent.bodyGroup.position.y = damp(agent.bodyGroup.position.y, 1.4, 4, dt);
        agent.armR.rotation.x = damp(agent.armR.rotation.x, Math.PI, 4, dt); // Mãos pra cima
        agent.armL.rotation.x = damp(agent.armL.rotation.x, Math.PI, 4, dt);
        agent.legR.rotation.x = damp(agent.legR.rotation.x, 0, 4, dt);
        agent.legL.rotation.x = damp(agent.legL.rotation.x, 0, 4, dt);
      } else {
        // Posição inicial (esperando)
        agent.bodyGroup.position.y = damp(agent.bodyGroup.position.y, 1.4, 4, dt);
      }

      // Cinemática do Policial
      if (s === 4) {
        cop.group.position.x = damp(cop.group.position.x, 2, 3, dt);
        cop.group.position.z = damp(cop.group.position.z, 2.5, 3, dt);
        cop.group.rotation.y = damp(cop.group.rotation.y, 0, 4, dt);
        cop.armR.rotation.x = damp(cop.armR.rotation.x, -1.5, 5, dt); // Apontando a arma (dedo)
        
        // Policial anda
        if (cop.group.position.x > 2.2) {
          cop.legR.rotation.x = Math.sin(t * 10) * 0.5;
          cop.legL.rotation.x = -Math.sin(t * 10) * 0.5;
          cop.bodyGroup.position.y = 1.4 + Math.abs(Math.sin(t * 10)) * 0.1;
        } else {
          cop.legR.rotation.x = damp(cop.legR.rotation.x, 0, 5, dt);
          cop.legL.rotation.x = damp(cop.legL.rotation.x, 0, 5, dt);
          cop.bodyGroup.position.y = damp(cop.bodyGroup.position.y, 1.4, 5, dt);
        }
      } else {
        cop.group.position.x = 15; // Fora da tela
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

export default function CenaArtigo3() {
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

      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#0f172a]">
        
        <VanillaThreeScene 
          step={TIMELINE[currentIdx].step} 
          isExploring={isExploring} 
          setPopup={setPopup} 
        />
        
        {!isExploring && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-30">
            <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-indigo-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
              <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                {TIMELINE[currentIdx].text}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {TIMELINE.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]' : 'w-2 bg-white/50'}`} />
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

        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full z-10 pointer-events-none hidden sm:flex">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Art. 3º - Lei Temporária (Cel-Shading)
          </span>
        </div>
      </div>
      
    </div>
  );
}
