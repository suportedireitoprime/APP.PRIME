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
  bg: 0x0a1128,
  floor: 0x334155,
  walls: 0x1e293b,
  prisoner: 0xf97316, // Orange jumpsuit
  skin: 0xfcbca0,
  bars: 0x94a3b8,
  document: 0xfffbeb,
  goldWave: 0xf59e0b,
};

const TIMELINE = [
  { step: 0, duration: 5500, text: "O réu cumpre pena em regime fechado após ter sido condenado por um fato criminoso.", cam: { x: 0, y: 2, z: 8, lookX: 0, lookY: 1.5, fov: 50 } },
  { step: 1, duration: 5500, text: "O Congresso Nacional aprova uma nova Lei, a qual revoga aquele tipo penal.", cam: { x: 0, y: 10, z: 6, lookX: 0, lookY: 1.5, fov: 65 } },
  { step: 2, duration: 5500, text: "Configura-se a Abolitio Criminis. A lei penal mais benigna sempre retroage para beneficiar o réu.", cam: { x: -4, y: 2, z: 6, lookX: 0, lookY: 1.5, fov: 50 } },
  { step: 3, duration: 5500, text: "Com a nova lei, cessam imediatamente a execução e os efeitos penais da condenação.", cam: { x: 3, y: 1.5, z: 4, lookX: 0, lookY: 1.0, fov: 60 } },
  { step: 4, duration: 7000, text: "Art. 2º: Ninguém pode ser punido por fato que lei posterior deixa de considerar crime.", cam: { x: 0, y: 3, z: 12, lookX: 0, lookY: 2, fov: 55 } },
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
    camera.position.set(0, 2, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
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

    const colors = new Uint8Array([50, 150, 255]);
    const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
    gradientMap.needsUpdate = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xbfdbfe, 2.0);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(100, 0.5, 100),
      new THREE.MeshToonMaterial({ color: COLORS.floor, gradientMap })
    );
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);

    // Personagem (Prisioneiro)
    const prisoner = new THREE.Group();
    prisoner.position.set(0, 0, 0);
    scene.add(prisoner);

    const pBodyGroup = new THREE.Group();
    pBodyGroup.position.y = 1.4;
    prisoner.add(pBodyGroup);

    const clothMat = new THREE.MeshToonMaterial({ color: COLORS.prisoner, gradientMap });
    const skinMat = new THREE.MeshToonMaterial({ color: COLORS.skin, gradientMap });
    const shoeMat = new THREE.MeshToonMaterial({ color: 0x111111, gradientMap });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.6), clothMat);
    torso.position.y = 0.1; torso.castShadow = true;
    pBodyGroup.add(torso);

    const pHeadGroup = new THREE.Group();
    pHeadGroup.position.y = 1.1;
    pBodyGroup.add(pHeadGroup);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
    head.castShadow = true;
    pHeadGroup.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.85), shoeMat);
    hair.position.y = 0.45;
    pHeadGroup.add(hair);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0x18181b }));
    eyeL.position.set(-0.18, 0.1, 0.41);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0x18181b }));
    eyeR.position.set(0.18, 0.1, 0.41);
    pHeadGroup.add(eyeL, eyeR);

    const pArmR = new THREE.Group(); pArmR.position.set(0.65, 0.6, 0);
    const armRM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), skinMat);
    armRM.position.y = -0.4; armRM.castShadow = true;
    const sleeveR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.32), clothMat);
    sleeveR.position.y = 0.4; armRM.add(sleeveR);
    pArmR.add(armRM); pBodyGroup.add(pArmR);

    const pArmL = new THREE.Group(); pArmL.position.set(-0.65, 0.6, 0);
    const armLM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), skinMat);
    armLM.position.y = -0.4; armLM.castShadow = true;
    const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.32), clothMat);
    sleeveL.position.y = 0.4; armLM.add(sleeveL);
    pArmL.add(armLM); pBodyGroup.add(pArmL);

    const pLegR = new THREE.Group(); pLegR.position.set(0.25, 0.8, 0);
    const legRM = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), clothMat);
    legRM.position.y = -0.35; legRM.castShadow = true;
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.5), shoeMat);
    shoeR.position.set(0, -0.85, 0.07);
    pLegR.add(legRM, shoeR); prisoner.add(pLegR);

    const pLegL = new THREE.Group(); pLegL.position.set(-0.25, 0.8, 0);
    const legLM = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), clothMat);
    legLM.position.y = -0.35; legLM.castShadow = true;
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.5), shoeMat);
    shoeL.position.set(0, -0.85, 0.07);
    pLegL.add(legLM, shoeL); prisoner.add(pLegL);
    
    prisoner.userData = { label: 'Réu Beneficiado (Abolitio Criminis)' };

    // Prisão
    const jailGroup = new THREE.Group();
    const barMat = new THREE.MeshToonMaterial({ color: COLORS.bars, gradientMap });
    const bars: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8, 8), barMat);
      bar.position.set(-3 + i, 4, 2);
      bar.castShadow = true;
      jailGroup.add(bar);
      bars.push(bar);
    }
    const tB = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 0.4), barMat);
    tB.position.set(0, 7.8, 2); tB.castShadow = true; jailGroup.add(tB);
    const bB = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 0.4), barMat);
    bB.position.set(0, 0.2, 2); bB.castShadow = true; jailGroup.add(bB);
    jailGroup.userData = { label: 'Efeitos da Condenação (Cessados)' };
    scene.add(jailGroup);

    // Documento Nova Lei
    const docGroup = new THREE.Group();
    const docMat = new THREE.MeshToonMaterial({ color: COLORS.document, gradientMap });
    const docMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.1), docMat);
    docMesh.castShadow = true;
    const docStamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.12), new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap }));
    docStamp.position.set(0.3, -0.6, 0);
    docGroup.add(docMesh, docStamp);
    docGroup.position.set(0, 20, 0); // Começa caindo do céu
    docGroup.userData = { label: 'Nova Lei Penal (Mais Benigna)' };
    scene.add(docGroup);

    // Onda de choque dourada
    const ringGeo = new THREE.RingGeometry(0.1, 0.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: COLORS.goldWave, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const waveRing = new THREE.Mesh(ringGeo, ringMat);
    waveRing.rotation.x = -Math.PI / 2;
    waveRing.position.y = 0.05;
    scene.add(waveRing);

    outlinePass.selectedObjects = [prisoner, jailGroup, docGroup];

    elementsRef.current = { prisoner, pHeadGroup, pBodyGroup, pArmL, pArmR, pLegR, pLegL, jailGroup, bars, tB, bB, docGroup, waveRing, ringMat, camera, controls, composer, isExploring };

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

        camera.position.x += Math.sin(t * 1.8) * 0.005;
        camera.position.y += Math.cos(t * 2.2) * 0.004;
      }

      // Cinemática da Lei Caindo
      if (s === 1 || s === 2) {
        docGroup.position.y = damp(docGroup.position.y, 1.0, 4, dt);
        docGroup.position.z = damp(docGroup.position.z, 3.5, 4, dt);
        docGroup.rotation.y = t * 2;
        docGroup.rotation.x = Math.sin(t * 4) * 0.2;
      } else if (s >= 3) {
        docGroup.position.y = damp(docGroup.position.y, 0.1, 6, dt);
        docGroup.rotation.x = damp(docGroup.rotation.x, -Math.PI / 2, 6, dt);
        docGroup.rotation.y = damp(docGroup.rotation.y, 0, 6, dt);
      } else {
        docGroup.position.y = 20;
      }

      // Onda Dourada (Abolitio)
      if (s === 3) {
        waveRing.scale.x = waveRing.scale.x + dt * 20;
        waveRing.scale.y = waveRing.scale.y + dt * 20;
        ringMat.opacity = Math.max(0, 1.0 - (waveRing.scale.x / 15));
      } else if (s > 3) {
        waveRing.scale.set(0.1, 0.1, 0.1);
        ringMat.opacity = 0;
      } else {
        waveRing.scale.set(0.1, 0.1, 0.1);
        ringMat.opacity = 0;
      }

      // Efeitos das grades
      if (s >= 3) {
        bars.forEach((bar: any, i: number) => {
          bar.position.y = damp(bar.position.y, -10, 2 + i * 0.5, dt);
          bar.rotation.z = damp(bar.rotation.z, (i % 2 === 0 ? 1 : -1) * 0.5, 3, dt);
        });
        tB.position.y = damp(tB.position.y, -10, 4, dt);
        bB.position.y = damp(bB.position.y, -10, 4, dt);
      } else {
        bars.forEach((bar: any) => {
          bar.position.y = damp(bar.position.y, 4, 8, dt);
          bar.rotation.z = damp(bar.rotation.z, 0, 8, dt);
        });
        tB.position.y = damp(tB.position.y, 7.8, 8, dt);
        bB.position.y = damp(bB.position.y, 0.2, 8, dt);
      }

      // Cinemática do Réu Beneficiado
      if (s <= 2) {
        // Preso, triste
        pHeadGroup.rotation.x = damp(pHeadGroup.rotation.x, 0.5, 4, dt);
        pArmR.rotation.x = damp(pArmR.rotation.x, -0.1, 4, dt);
        pArmL.rotation.x = damp(pArmL.rotation.x, -0.1, 4, dt);
        pLegR.rotation.x = damp(pLegR.rotation.x, 0, 4, dt);
        pLegL.rotation.x = damp(pLegL.rotation.x, 0, 4, dt);
        pBodyGroup.position.y = 1.4 + (isExp ? 0 : Math.sin(t * 2) * 0.02);
      } else {
        // Livre e comemorando
        pHeadGroup.rotation.x = damp(pHeadGroup.rotation.x, -0.3, 4, dt);
        if (s === 3) {
          pArmR.rotation.x = damp(pArmR.rotation.x, Math.PI - 0.2, 8, dt);
          pArmL.rotation.x = damp(pArmL.rotation.x, Math.PI - 0.2, 8, dt);
          pLegR.rotation.x = damp(pLegR.rotation.x, 0, 8, dt);
          pLegL.rotation.x = damp(pLegL.rotation.x, 0, 8, dt);
          pBodyGroup.position.y = 1.4 + Math.abs(Math.sin(t * 10)) * 0.3; // Pulando
        } else {
          // Andando livre
          prisoner.position.z = damp(prisoner.position.z, 5, 2, dt);
          pArmR.rotation.x = Math.sin(t * 8) * 0.5;
          pArmL.rotation.x = -Math.sin(t * 8) * 0.5;
          pLegR.rotation.x = -Math.sin(t * 8) * 0.6;
          pLegL.rotation.x = Math.sin(t * 8) * 0.6;
          pBodyGroup.position.y = 1.4 + Math.abs(Math.sin(t * 8)) * 0.1;
        }
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

export default function CenaArtigo2() {
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

      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#0a1128]">
        
        <VanillaThreeScene 
          step={TIMELINE[currentIdx].step} 
          isExploring={isExploring} 
          setPopup={setPopup} 
        />
        
        {!isExploring && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-30">
            <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-amber-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
              <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                {TIMELINE[currentIdx].text}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {TIMELINE.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]' : 'w-2 bg-white/50'}`} />
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
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Art. 2º - Abolitio Criminis (Cel-Shading)
          </span>
        </div>
      </div>
      
    </div>
  );
}
