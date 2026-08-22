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
  bg: 0x0a0a0a,
  wood: 0x3d2817,
  gold: 0xd4af37,
  book: 0x8b0000,
  paper: 0xfdf5e6,
  judge: 0x111111,
  defendant: 0x475569,
  neonBlue: 0x00d2ff,
  neonRed: 0xff003c,
  lightRay: 0xfff9c4
};

const TIMELINE = [
  { step: 0, duration: 15000, text: "O Julgamento Vazio. Um tribunal sombrio julga uma conduta inédita. Mas sem lei, como haverá punição?", cam: { x: 0, y: 5, z: 20, lookX: 0, lookY: 2, fov: 50 } },
  { step: 1, duration: 15000, text: "A Ação Sem Lei. O ato ocorre, gerando caos e incerteza no escuro. Ninguém sabe a resposta.", cam: { x: -8, y: 3, z: 12, lookX: -2, lookY: 1.5, fov: 60 } },
  { step: 2, duration: 15000, text: "A Anterioridade da Lei. O livro dourado surge e ilumina a sala. O Código Penal estabelece as fronteiras.", cam: { x: 3, y: 6, z: 8, lookX: 0, lookY: 3, fov: 45 } },
  { step: 3, duration: 20000, text: "Princípio da Legalidade. Não há crime sem lei anterior, nem pena sem cominação legal (Art. 1º).", cam: { x: 8, y: 4, z: 15, lookX: 0, lookY: 2, fov: 55 } },
];

export default function CenaArtigo1({ isExploring = false, setPopup }: { isExploring?: boolean, setPopup?: (text: string) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<string, any>>({});
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.02);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 5, 20);
    elementsRef.current.camera = camera;

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
    controls.enabled = isExploring;
    controls.maxPolarAngle = Math.PI / 2;
    elementsRef.current.controls = controls;

    // --- POST-PROCESSING ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    // @ts-expect-error
    const smaaPass = new SMAAPass(container.clientWidth * renderer.getPixelRatio(), container.clientHeight * renderer.getPixelRatio());
    composer.addPass(smaaPass);

    // @ts-expect-error
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.5, 0.7);
    composer.addPass(bloomPass);

    // @ts-expect-error
    const filmPass = new FilmPass(0.35, 0.025, 648, false);
    composer.addPass(filmPass);

    const outlinePass = new OutlinePass(new THREE.Vector2(container.clientWidth, container.clientHeight), scene, camera);
    outlinePass.edgeStrength = 5.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.edgeThickness = 1.5;
    outlinePass.visibleEdgeColor.set('#000000');
    composer.addPass(outlinePass);
    elementsRef.current.outlinePass = outlinePass;
    composer.addPass(new OutputPass());

    // --- MATERIAIS CEL-SHADING ---
    const colors = new Uint8Array([50, 150, 255]);
    const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
    gradientMap.needsUpdate = true;

    const matWood = new THREE.MeshToonMaterial({ color: COLORS.wood, gradientMap });
    const matGold = new THREE.MeshToonMaterial({ color: COLORS.gold, gradientMap });
    const matJudge = new THREE.MeshToonMaterial({ color: COLORS.judge, gradientMap });
    const matDefendant = new THREE.MeshToonMaterial({ color: COLORS.defendant, gradientMap });
    const matFloor = new THREE.MeshToonMaterial({ color: 0x111111, gradientMap });

    // --- LUZES ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const neonLight = new THREE.PointLight(COLORS.neonBlue, 0.8, 20);
    neonLight.position.set(-5, 5, 0);
    scene.add(neonLight);
    elementsRef.current.neonLight = neonLight;

    // --- CENÁRIO: TRIBUNAL ---
    // Chão
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), matFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Paredes
    const wallGroup = new THREE.Group();
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(50, 20, 1), matFloor);
    backWall.position.set(0, 10, -15);
    backWall.receiveShadow = true;
    wallGroup.add(backWall);
    scene.add(wallGroup);

    // Mesa do Juiz com Bevel
    const tableShape = new THREE.Shape();
    tableShape.moveTo(-4, -1);
    tableShape.lineTo(4, -1);
    tableShape.lineTo(4, 1);
    tableShape.lineTo(-4, 1);
    const extrudeSettings = { depth: 1, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.1, bevelThickness: 0.1 };
    const tableGeo = new THREE.ExtrudeGeometry(tableShape, extrudeSettings);
    const table = new THREE.Mesh(tableGeo, matWood);
    table.position.set(0, 2, -5);
    table.rotation.x = Math.PI / 2;
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);

    // Personagem: Juiz (Simples, misterioso)
    const judgeGroup = new THREE.Group();
    const headGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
    const head = new THREE.Mesh(headGeo, matJudge);
    head.position.y = 4.5;
    head.castShadow = true;
    judgeGroup.add(head);
    
    const bodyGeo = new THREE.BoxGeometry(1.5, 2, 1);
    const body = new THREE.Mesh(bodyGeo, matJudge);
    body.position.y = 3;
    body.castShadow = true;
    judgeGroup.add(body);
    judgeGroup.position.set(0, 0, -7);
    scene.add(judgeGroup);
    elementsRef.current.judge = judgeGroup;

    // O Livro Dourado (A Lei) - Aparecerá no step 2
    const bookGroup = new THREE.Group();
    const coverGeo = new THREE.BoxGeometry(1.5, 0.2, 2);
    const cover = new THREE.Mesh(coverGeo, new THREE.MeshToonMaterial({ color: COLORS.book, gradientMap }));
    bookGroup.add(cover);
    
    const pagesGeo = new THREE.BoxGeometry(1.4, 0.18, 1.9);
    const pages = new THREE.Mesh(pagesGeo, new THREE.MeshToonMaterial({ color: COLORS.paper, gradientMap }));
    bookGroup.add(pages);

    bookGroup.position.set(0, 8, -5); // Inicia no alto invisível
    bookGroup.rotation.set(0, 0, 0);
    bookGroup.visible = false;
    bookGroup.castShadow = true;
    scene.add(bookGroup);
    elementsRef.current.book = bookGroup;

    // Luz volumétrica do livro
    const bookLight = new THREE.PointLight(COLORS.gold, 0, 10);
    bookLight.position.set(0, 3, -5);
    scene.add(bookLight);
    elementsRef.current.bookLight = bookLight;

    // Outline Array
    outlinePass.selectedObjects = [table, head, body];

    // --- TIMELINE ENGINE ---
    let currentStepIndex = 0;
    let stepStartTime = performance.now();
    let isAnimating = true;
    const targetLookAt = new THREE.Vector3(0, 1.5, -5);
    const currentLookAt = new THREE.Vector3(0, 1.5, -5);
    elementsRef.current.targetLookAt = targetLookAt;

    if (setPopup) {
      setPopup(TIMELINE[0].text);
    }

    const animate = () => {
      if (!isAnimating) return;
      requestAnimationFrame(animate);

      const now = performance.now();
      const elapsed = now - stepStartTime;
      const currentTimelineStep = TIMELINE[currentStepIndex];

      if (elapsed > currentTimelineStep.duration && currentStepIndex < TIMELINE.length - 1 && !isExploring) {
        currentStepIndex++;
        setStep(currentStepIndex);
        stepStartTime = now;
        if (setPopup) setPopup(TIMELINE[currentStepIndex].text);
      }

      if (!isExploring) {
        // Interpolação de Câmera
        const tStep = TIMELINE[currentStepIndex];
        camera.position.lerp(new THREE.Vector3(tStep.cam.x, tStep.cam.y, tStep.cam.z), 0.02);
        targetLookAt.lerp(new THREE.Vector3(tStep.cam.lookX, tStep.cam.lookY, 0), 0.02);
        currentLookAt.lerp(targetLookAt, 0.05);
        camera.lookAt(currentLookAt);
        camera.fov = THREE.MathUtils.lerp(camera.fov, tStep.cam.fov, 0.05);
        camera.updateProjectionMatrix();

        // Animação de Elementos por Step
        const book = elementsRef.current.book;
        const bLight = elementsRef.current.bookLight;
        
        if (currentStepIndex === 0) {
          // Julgamento vazio
          book.visible = false;
          bLight.intensity = THREE.MathUtils.lerp(bLight.intensity, 0, 0.1);
        } 
        else if (currentStepIndex === 1) {
          // Ação sem lei
          neonLight.intensity = THREE.MathUtils.lerp(neonLight.intensity, 2, 0.05);
          neonLight.color.setHex(COLORS.neonRed);
          judgeGroup.rotation.y = THREE.MathUtils.lerp(judgeGroup.rotation.y, Math.PI / 4, 0.02);
        }
        else if (currentStepIndex === 2) {
          // Chegada da lei
          book.visible = true;
          book.position.y = THREE.MathUtils.lerp(book.position.y, 3, 0.05); // Cai na mesa
          book.rotation.y = THREE.MathUtils.lerp(book.rotation.y, Math.PI / 8, 0.05);
          
          if (book.position.y < 3.2) {
            bLight.intensity = THREE.MathUtils.lerp(bLight.intensity, 5, 0.1);
            neonLight.intensity = THREE.MathUtils.lerp(neonLight.intensity, 0.2, 0.1);
            outlinePass.selectedObjects = [book.children[0]]; // Brilha o livro
            outlinePass.edgeStrength = 10;
          }
        }
        else if (currentStepIndex === 3) {
          // Conclusão
          bLight.intensity = THREE.MathUtils.lerp(bLight.intensity, 2, 0.05);
          outlinePass.edgeStrength = 5.0;
          outlinePass.selectedObjects = [table, head, body, book.children[0]];
          judgeGroup.rotation.y = THREE.MathUtils.lerp(judgeGroup.rotation.y, 0, 0.05);
        }
      }

      const totalTime = TIMELINE.reduce((acc, t) => acc + t.duration, 0);
      const passed = TIMELINE.slice(0, currentStepIndex).reduce((acc, t) => acc + t.duration, 0) + (isExploring ? 0 : elapsed);
      setProgress((passed / totalTime) * 100);

      controls.update();
      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      composer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isAnimating = false;
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      scene.clear();
      renderer.dispose();
      gradientMap.dispose();
    };
  }, [isExploring, setPopup]);

  return (
    <div className="absolute inset-0 w-full h-full group">
      <div ref={mountRef} className="w-full h-full outline-none" />
      
      {/* HUD Cinematográfico */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            {[...Array(TIMELINE.length)].map((_, i) => (
              <div key={i} className="h-1 w-12 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-300"
                  style={{ width: step > i ? '100%' : step === i ? `${(progress % (100 / TIMELINE.length)) * TIMELINE.length}%` : '0%' }}
                />
              </div>
            ))}
          </div>
          <div className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white/70 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            REC
          </div>
        </div>
      </div>
    </div>
  );
}
