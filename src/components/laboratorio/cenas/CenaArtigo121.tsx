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
  bg: 0x050510,
  sidewalk: 0x334155,
  road: 0x1e293b,
  building: 0x0f172a,
  windowLight: 0xfef08a,
  agent: 0x991b1b,
  victim: 0xf59e0b,
  skin: 0xfcbca0,
  blood: 0x7f1d1d,
};

const TIMELINE = [
  { step: 0, duration: 5000, text: "Cena 1: Madrugada. Uma pessoa caminha sozinha por um beco escuro e deserto...", cam: { x: 2, y: 3, z: 12, lookX: 0, lookY: 1.5, fov: 50 } },
  { step: 1, duration: 4500, text: "O Agente surge das sombras, aproximando-se silenciosamente com intenção homicida (animus necandi).", cam: { x: -3, y: 2.5, z: 8, lookX: -1, lookY: 1.2, fov: 55 } },
  { step: 2, duration: 5500, text: "O Agente desfere o golpe letal contra a vítima, utilizando uma faca.", cam: { x: -1, y: 2.0, z: 5.5, lookX: -0.5, lookY: 1.5, fov: 60 } },
  { step: 3, duration: 5000, text: "A vítima cai ao solo. O crime de homicídio está consumado com o óbito.", cam: { x: 0, y: 4, z: 6, lookX: -1.5, lookY: 0.5, fov: 50 } },
  { step: 4, duration: 6500, text: "Configurado o Artigo 121: Matar alguém. A pena prevista é de Reclusão de 6 a 20 anos.", cam: { x: 3.5, y: 2.8, z: 4.5, lookX: -1, lookY: 0.5, fov: 65 } },
];

const VanillaThreeScene = ({ step, isExploring, setPopup }: { step: number, isExploring: boolean, setPopup: any }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.02);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(2, 3, 14);

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
      1.0, 0.6, 0.85
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xbfdbfe, 1.0);
    moonLight.position.set(-15, 25, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 100;
    moonLight.shadow.camera.left = -20;
    moonLight.shadow.camera.right = 20;
    moonLight.shadow.camera.top = 20;
    moonLight.shadow.camera.bottom = -20;
    scene.add(moonLight);

    // Environment (Beco)
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.25, 20),
      new THREE.MeshStandardMaterial({ color: COLORS.sidewalk, roughness: 0.9 })
    );
    sidewalk.position.set(0, -0.12, 0);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, 0, -5);
    
    // Paredão do Beco
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 15, 30), new THREE.MeshStandardMaterial({ color: COLORS.building }));
    wallLeft.position.set(-6, 7.5, 5); wallLeft.castShadow = true; wallLeft.receiveShadow = true;
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(5, 15, 30), new THREE.MeshStandardMaterial({ color: COLORS.building }));
    wallRight.position.set(6, 7.5, 5); wallRight.castShadow = true; wallRight.receiveShadow = true;
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(15, 15, 5), new THREE.MeshStandardMaterial({ color: COLORS.building }));
    wallBack.position.set(0, 7.5, -8); wallBack.castShadow = true; wallBack.receiveShadow = true;
    
    cityGroup.add(wallLeft, wallRight, wallBack);
    scene.add(cityGroup);

    // Lixeira e lixo
    const dumpster = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: 0x14532d, metalness: 0.6 }));
    dumpster.position.set(-2.5, 0.75, -5); dumpster.castShadow = true;
    scene.add(dumpster);

    // Poste quebrado
    const lp = new THREE.Group();
    lp.position.set(2, 0, -3);
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 0.2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    pole.position.y = 4; pole.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    arm.position.set(-0.9, 7.9, 0);
    const bulbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
    bulbMesh.position.set(-1.8, 7.7, 0);
    lp.add(pole, arm, bulbMesh);
    const sl = new THREE.PointLight(0xfffbeb, 1.5, 15, 2); 
    sl.position.set(-1.8, 7.4, 0); sl.castShadow = true;
    lp.add(sl);
    scene.add(lp);

    // Poça de sangue
    const bloodPool = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.blood, roughness: 0.1, transparent: true, opacity: 0 })
    );
    bloodPool.rotation.x = -Math.PI / 2;
    bloodPool.position.set(-0.5, 0.05, 1.5);
    scene.add(bloodPool);

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
      } else { // Victim
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.85), new THREE.MeshStandardMaterial({ color: 0x3f3f46 }));
        hair.position.y = 0.4;
        headGroup.add(hair);
        
        const eMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
        const eL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), eMat);
        eL.position.set(-0.18, 0.1, 0.41); eL.name = 'eyeL';
        const eR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), eMat);
        eR.position.set(0.18, 0.1, 0.41); eR.name = 'eyeR';
        headGroup.add(eL, eR);
        
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.1), eMat);
        mouth.position.set(0, -0.15, 0.41); mouth.name = 'mouth';
        headGroup.add(mouth);
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
    const victim = createSquareHumanoid(COLORS.victim, 0, false);
    victim.group.position.set(-1, 0, 1.5);
    
    agent.group.userData = { label: 'Agente Infrator (Assassino)' };
    victim.group.userData = { label: 'Vítima' };

    // Faca
    const knifeGroup = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    handle.position.set(0, -0.15, 0);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
    blade.position.set(0, -0.55, 0);
    knifeGroup.add(handle, blade);
    knifeGroup.position.set(0, -0.9, 0.15);
    knifeGroup.rotation.x = Math.PI / 2;
    knifeGroup.userData = { label: 'Arma Branca (Meio de Execução)' };
    agent.armR.add(knifeGroup);

    elementsRef.current = {
      agent, victim, knifeGroup, camera, controls, sl, composer, isExploring, bloodPool
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

      // Luz piscando (beco sinistro)
      sl.intensity = damp(sl.intensity, Math.random() > 0.95 ? 0.2 : 1.5, 10, dt);

      // Victim kinematics
      if (!isExp && s < 3) {
        victim.group.rotation.y = damp(victim.group.rotation.y, Math.PI / 2, 4, dt);
        victim.bodyGroup.position.y = 1.4 + Math.sin(t * 2) * 0.02;
        victim.group.position.x = damp(victim.group.position.x, -1, 4, dt);
        victim.group.rotation.z = damp(victim.group.rotation.z, 0, 4, dt);
        victim.group.position.y = damp(victim.group.position.y, 0, 4, dt);
      } else if (!isExp && s >= 3) {
        // Victim falls over
        victim.group.rotation.z = damp(victim.group.rotation.z, -Math.PI / 2, 6, dt);
        victim.group.position.y = damp(victim.group.position.y, 0.4, 6, dt);
        victim.armL.rotation.z = damp(victim.armL.rotation.z, 0.5, 4, dt);
        victim.armR.rotation.z = damp(victim.armR.rotation.z, -0.5, 4, dt);
      } else if (isExp) {
        victim.group.rotation.z = 0;
        victim.group.position.y = 0;
        victim.armL.rotation.z = 0;
        victim.armR.rotation.z = 0;
      }

      const vEyeL = victim.headGroup.children.find((c:any) => c.name === 'eyeL');
      const vEyeR = victim.headGroup.children.find((c:any) => c.name === 'eyeR');
      const vMouth = victim.headGroup.children.find((c:any) => c.name === 'mouth');
      if (s >= 2) { 
         if (vEyeL) vEyeL.scale.set(1.5, 2.5, 1);
         if (vEyeR) vEyeR.scale.set(1.5, 2.5, 1);
         if (vMouth) {
           vMouth.scale.x = damp(vMouth.scale.x, 0.6, 10, dt);
           vMouth.scale.y = damp(vMouth.scale.y, 3.5, 10, dt);
         }
      } else { 
         if (vEyeL) vEyeL.scale.set(1, 1, 1);
         if (vEyeR) vEyeR.scale.set(1, 1, 1);
         if (vMouth) {
           vMouth.scale.x = damp(vMouth.scale.x, 1, 5, dt);
           vMouth.scale.y = damp(vMouth.scale.y, 1, 5, dt);
         }
      }

      // Blood pool
      if (s >= 3) {
        bloodPool.material.opacity = damp(bloodPool.material.opacity, 0.9, 1, dt);
        bloodPool.scale.setScalar(damp(bloodPool.scale.x, 1.2, 1, dt));
      } else {
        bloodPool.material.opacity = 0;
        bloodPool.scale.setScalar(0.1);
      }

      // Agent Kinematics
      const aTargetX = s === 0 ? -8 : s >= 1 && s <= 3 ? -2.2 : 2.5;
      const aTargetZ = s === 0 ? 3 : s >= 1 && s <= 3 ? 1.5 : -1;
      
      agent.group.position.x = damp(agent.group.position.x, aTargetX, s === 4 ? 2 : 4, dt);
      agent.group.position.z = damp(agent.group.position.z, aTargetZ, s === 4 ? 2 : 4, dt);

      if (!isExp && (s === 1 || s === 4)) {
        // Walking
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

      let aRotY = Math.PI / 2;
      if (s === 4) aRotY = 0;
      agent.group.rotation.y = damp(agent.group.rotation.y, aRotY, 5, dt);

      // Stabbing motion
      const armRotX = s === 2 ? -Math.PI / 1.5 : 0;
      if (s < 4) agent.armR.rotation.x = damp(agent.armR.rotation.x, armRotX, 12, dt);
      
      knifeGroup.visible = s > 0 || isExp;

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

export default function CenaArtigo121() {
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
          className={`gap-2 transition-all ${isExploring ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'border-white/10 text-muted-foreground'}`}
        >
          <Compass className={`w-4 h-4 ${isExploring ? 'animate-spin-slow text-white' : ''}`} />
          {isExploring ? '360º Ativo' : 'Explorar 360º'}
        </Button>
      </div>

      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#050510]">
        
        <VanillaThreeScene 
          step={TIMELINE[currentIdx].step} 
          isExploring={isExploring} 
          setPopup={setPopup} 
        />

        {!isExploring && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl">
            <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-red-600">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
              <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                {TIMELINE[currentIdx].text}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {TIMELINE.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,1)]' : 'w-2 bg-white/50'}`} />
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

        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-red-900/50 px-3 py-1.5 rounded-full z-10 pointer-events-none hidden sm:flex">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Art. 121 - Homicídio (Voxel Mode)
          </span>
        </div>
      </div>
    </div>
  );
}
