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
  bgTransit: 0x0f172a, // Cela de trânsito (escura, fria)
  bgWomens: 0xe8ccd7, // Estabelecimento feminino (rosa mais suave/escuro para evitar void branco)
  floorTransit: 0x334155, 
  floorWomens: 0xd6b4c2, // Chão rosa queimado
  inmate: 0xec4899, // Uniforme rosa
  guard: 0x1e3a8a, // Farda azul escuro
  skin: 0xfcbca0,
  bars: 0x475569,
  wood: 0x92400e
};

const TIMELINE = [
  { step: 0, duration: 8000, text: "Maria foi condenada. Ela aguarda em uma cela de trânsito fria e inadequada.", cam: { x: 0, y: 3, z: 8, lookX: 0, lookY: 1, fov: 50 } },
  { step: 1, duration: 7000, text: "Uma policial feminina chega para realizar a transferência protocolar.", cam: { x: -4, y: 2, z: 6, lookX: -1, lookY: 1.2, fov: 45 } },
  { step: 2, duration: 8000, text: "Maria é transferida para a Penitenciária Feminina...", cam: { x: 0, y: 5, z: 12, lookX: 0, lookY: 1.5, fov: 60 } },
  { step: 3, duration: 8000, text: "O local possui berçário, assistência médica e estrutura adequada à sua condição.", cam: { x: 3, y: 2.5, z: 5, lookX: 1, lookY: 1, fov: 50 } },
  { step: 4, duration: 9000, text: "Art. 37, CP: Mulheres cumprem pena em estabelecimento próprio, observando-se seus direitos.", cam: { x: 0, y: 3, z: 9, lookX: 0, lookY: 1.5, fov: 50 } },
];

const VanillaThreeScene = ({ step, isExploring, setPopup }: { step: number, isExploring: boolean, setPopup: any }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bgTransit);
    scene.fog = new THREE.FogExp2(COLORS.bgTransit, 0.03);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 3, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
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
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.8, 0.4, 0.85));
    composer.addPass(new FilmPass(0.25, 0.025, 648, false));

    const outlinePass = new OutlinePass(new THREE.Vector2(container.clientWidth, container.clientHeight), scene, camera);
    outlinePass.edgeStrength = 4.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.edgeThickness = 1.5;
    outlinePass.visibleEdgeColor.set('#000000');
    outlinePass.hiddenEdgeColor.set('#000000');
    composer.addPass(outlinePass);
    composer.addPass(new OutputPass());

    const colors = new Uint8Array([30, 120, 255]);
    const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
    gradientMap.needsUpdate = true;

    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const spotLight = new THREE.SpotLight(0xffffff, 2.0); // Luz dura da cela
    spotLight.position.set(0, 8, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    scene.add(spotLight);

    // Chão gigante para evitar void
    const floorMat = new THREE.MeshToonMaterial({ color: COLORS.floorTransit, gradientMap });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(200, 0.5, 200), floorMat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);

    // === CELA DE TRÂNSITO (RUIM) ===
    const transitGroup = new THREE.Group();
    const barMat = new THREE.MeshToonMaterial({ color: COLORS.bars, gradientMap });
    const wallMat = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap });

    // Grades largas para não cortar a câmera
    for(let i=-6; i<=6; i++) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 8), barMat);
        bar.position.set(i * 0.8, 4, 3);
        bar.castShadow = true;
        transitGroup.add(bar);
    }
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(12, 0.1, 0.1), barMat);
    crossBar.position.set(0, 2, 3);
    transitGroup.add(crossBar);

    // Paredes enormes para fechar o cômodo
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 0.5), wallMat);
    backWall.position.set(0, 10, -4);
    backWall.receiveShadow = true;
    transitGroup.add(backWall);

    const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 20, 40), wallMat);
    sideWallL.position.set(-10, 10, 0);
    sideWallL.receiveShadow = true;
    transitGroup.add(sideWallL);

    const sideWallR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 20, 40), wallMat);
    sideWallR.position.set(10, 10, 0);
    sideWallR.receiveShadow = true;
    transitGroup.add(sideWallR);

    // Cama de pedra
    const stoneBed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 3), wallMat);
    stoneBed.position.set(-2, 0.25, 0);
    stoneBed.castShadow = true; stoneBed.receiveShadow = true;
    transitGroup.add(stoneBed);
    scene.add(transitGroup);

    // === ESTABELECIMENTO FEMININO (BOM) ===
    const womensGroup = new THREE.Group();
    womensGroup.position.y = -20; // Escondido no início bem abaixo

    const wallWomens = new THREE.MeshToonMaterial({ color: 0xfce7f3, gradientMap });
    // Paredes enormes para evitar o void branco
    const backWallW = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 0.5), wallWomens);
    backWallW.position.set(0, 10, -5);
    backWallW.receiveShadow = true;
    womensGroup.add(backWallW);

    const sideWallWL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 20, 40), wallWomens);
    sideWallWL.position.set(-15, 10, 0);
    sideWallWL.receiveShadow = true;
    womensGroup.add(sideWallWL);

    const sideWallWR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 20, 40), wallWomens);
    sideWallWR.position.set(15, 10, 0);
    sideWallWR.receiveShadow = true;
    womensGroup.add(sideWallWR);

    // Tapete no berçário
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.1, 32), new THREE.MeshToonMaterial({ color: 0xfbcfe8, gradientMap }));
    rug.position.set(1.5, 0.05, -1);
    rug.receiveShadow = true;
    womensGroup.add(rug);

    // Berço (Matemática Geométrica)
    const crib = new THREE.Group();
    const woodMat = new THREE.MeshToonMaterial({ color: COLORS.wood, gradientMap });
    const mattressMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap });
    
    const cribBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 2), woodMat);
    cribBase.position.y = 0.5;
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.9), mattressMat);
    mattress.position.y = 0.6;
    crib.add(cribBase, mattress);

    // Grades do berço
    for(let i=0; i<5; i++) {
        const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), woodMat);
        b1.position.set(0.6, 0.8, -0.8 + i*0.4);
        const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), woodMat);
        b2.position.set(-0.6, 0.8, -0.8 + i*0.4);
        crib.add(b1, b2);
    }
    const topBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 2), woodMat);
    topBar1.position.set(0.6, 1.1, 0);
    const topBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 2), woodMat);
    topBar2.position.set(-0.6, 1.1, 0);
    crib.add(topBar1, topBar2);

    crib.position.set(1.5, 0, -1);
    crib.castShadow = true;
    womensGroup.add(crib);

    // Móbile giratório em cima do berço
    const mobile = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5), woodMat);
    rod.position.set(0, 0.25, 0);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), woodMat);
    cross.position.y = 0.5;
    const toy1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap }));
    toy1.position.set(0.2, 0.3, 0);
    const toy2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshToonMaterial({ color: 0xf472b6, gradientMap }));
    toy2.position.set(-0.2, 0.3, 0);
    mobile.add(rod, cross, toy1, toy2);
    mobile.position.set(1.5, 1.2, -1);
    womensGroup.add(mobile);

    scene.add(womensGroup);

    // === PERSONAGENS ===
    const createFemaleHumanoid = (color: number, label: string, hasHat: boolean = false) => {
        const group = new THREE.Group();
        group.userData = { label };
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 1.35; // Levemente mais baixas que o padrão
        group.add(bodyGroup);

        const clothMat = new THREE.MeshToonMaterial({ color, gradientMap });
        const skinMat = new THREE.MeshToonMaterial({ color: COLORS.skin, gradientMap });
        const shoeMat = new THREE.MeshToonMaterial({ color: 0x111111, gradientMap });

        // Torso um pouco mais acinturado
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.45), clothMat);
        torso.position.y = 0.1; torso.castShadow = true;
        bodyGroup.add(torso);

        const headGroup = new THREE.Group();
        headGroup.position.y = 0.95;
        bodyGroup.add(headGroup);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), skinMat);
        head.castShadow = true;
        headGroup.add(head);

        // Cabelo mais detalhado para parecer mulher
        const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.3, 0.8), shoeMat);
        hairBase.position.y = 0.35; 
        headGroup.add(hairBase);
        
        // Franja longa lateral
        const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.2), shoeMat);
        bangs.position.set(0, 0.2, 0.35);
        headGroup.add(bangs);
        
        // Cabelo comprido atrás
        const longHair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.3), shoeMat);
        longHair.position.set(0, -0.2, -0.3);
        headGroup.add(longHair);

        if (hasHat) {
            const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.2, 8), new THREE.MeshToonMaterial({ color: 0x111111, gradientMap }));
            hat.position.y = 0.6;
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 8), new THREE.MeshToonMaterial({ color: 0x111111, gradientMap }));
            brim.position.set(0, 0.5, 0.2);
            headGroup.add(hat, brim);
        }

        // Olhos expressivos
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), new THREE.MeshBasicMaterial({ color: 0x18181b }));
        eyeL.position.set(-0.15, 0.1, 0.36);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), new THREE.MeshBasicMaterial({ color: 0x18181b }));
        eyeR.position.set(0.15, 0.1, 0.36);
        headGroup.add(eyeL, eyeR);

        const armR = new THREE.Group(); armR.position.set(0.55, 0.5, 0);
        const armRM = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, 0.25), skinMat);
        armRM.position.y = -0.35; armRM.castShadow = true;
        const sleeveR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.28), clothMat);
        sleeveR.position.y = 0.3; armRM.add(sleeveR);
        armR.add(armRM); bodyGroup.add(armR);

        const armL = new THREE.Group(); armL.position.set(-0.55, 0.5, 0);
        const armLM = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, 0.25), skinMat);
        armLM.position.y = -0.35; armLM.castShadow = true;
        const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.28), clothMat);
        sleeveL.position.y = 0.3; armLM.add(sleeveL);
        armL.add(armLM); bodyGroup.add(armL);

        const legR = new THREE.Group(); legR.position.set(0.2, 0.7, 0);
        const legRM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), clothMat);
        legRM.position.y = -0.3; legRM.castShadow = true;
        const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.4), shoeMat);
        shoeR.position.set(0, -0.75, 0.05);
        legR.add(legRM, shoeR); group.add(legR);

        const legL = new THREE.Group(); legL.position.set(-0.2, 0.7, 0);
        const legLM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), clothMat);
        legLM.position.y = -0.3; legLM.castShadow = true;
        const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.4), shoeMat);
        shoeL.position.set(0, -0.75, 0.05);
        legL.add(legLM, shoeL); group.add(legL);

        return { group, bodyGroup, headGroup, armR, armL, legR, legL, eyeL, eyeR };
    };

    const maria = createFemaleHumanoid(COLORS.inmate, "Maria (Detenta)");
    maria.group.position.set(0, 0, 0);
    scene.add(maria.group);

    const guard = createFemaleHumanoid(COLORS.guard, "Policial Penal", true);
    guard.group.position.set(10, 0, 3); // Escondida no começo
    scene.add(guard.group);

    outlinePass.selectedObjects = [maria.group, guard.group, crib];

    elementsRef.current = { maria, guard, transitGroup, womensGroup, floorMat, mobile, ambientLight, mainLight, spotLight, scene, camera, controls, composer, isExploring };

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

      // Animação Móbile do berço
      mobile.rotation.y += dt * 1.5;

      // EMOÇÕES E EXPRESSÕES DA MARIA
      if (s < 2) {
        // Triste (olhos caídos)
        maria.eyeL.rotation.z = damp(maria.eyeL.rotation.z, -0.3, 4, dt);
        maria.eyeR.rotation.z = damp(maria.eyeR.rotation.z, 0.3, 4, dt);
        maria.headGroup.rotation.x = damp(maria.headGroup.rotation.x, 0.3, 4, dt); // Cabeça baixa
      } else {
        // Aliviada/Calma (olhos retos)
        maria.eyeL.rotation.z = damp(maria.eyeL.rotation.z, 0, 4, dt);
        maria.eyeR.rotation.z = damp(maria.eyeR.rotation.z, 0, 4, dt);
        maria.headGroup.rotation.x = damp(maria.headGroup.rotation.x, 0, 4, dt);
      }

      // Mudança de Ambiente
      if (s >= 2) {
        // Presídio Feminino (Claro)
        scene.fog!.color.lerp(new THREE.Color(COLORS.bgWomens), 0.05);
        scene.background = scene.fog!.color;
        ambientLight.intensity = damp(ambientLight.intensity, 0.8, 2, dt);
        mainLight.intensity = damp(mainLight.intensity, 1.2, 2, dt);
        spotLight.intensity = damp(spotLight.intensity, 0, 2, dt); // Apaga luz dura
        floorMat.color.lerp(new THREE.Color(COLORS.floorWomens), 0.1);

        transitGroup.position.y = damp(transitGroup.position.y, -10, 2, dt); // Some cela velha
        womensGroup.position.y = damp(womensGroup.position.y, 0, 2, dt); // Surge berçário
      } else {
        // Cela Trânsito (Escuro)
        scene.fog!.color.lerp(new THREE.Color(COLORS.bgTransit), 0.05);
        scene.background = scene.fog!.color;
        ambientLight.intensity = damp(ambientLight.intensity, 0.2, 2, dt);
        mainLight.intensity = damp(mainLight.intensity, 0.2, 2, dt);
        spotLight.intensity = damp(spotLight.intensity, 3.0, 2, dt);
        floorMat.color.lerp(new THREE.Color(COLORS.floorTransit), 0.1);

        transitGroup.position.y = damp(transitGroup.position.y, 0, 2, dt);
        womensGroup.position.y = damp(womensGroup.position.y, -10, 2, dt);
      }

      // Cinemática
      if (s === 0) {
        // Maria sentada na cama triste
        maria.group.position.x = damp(maria.group.position.x, -1.5, 4, dt);
        maria.group.position.z = damp(maria.group.position.z, 0, 4, dt);
        maria.group.rotation.y = damp(maria.group.rotation.y, Math.PI/2, 4, dt);
        maria.bodyGroup.position.y = damp(maria.bodyGroup.position.y, 0.9, 4, dt); // Agachada/Sentada
        maria.legR.rotation.x = damp(maria.legR.rotation.x, -1.5, 4, dt);
        maria.legL.rotation.x = damp(maria.legL.rotation.x, -1.5, 4, dt);
        maria.armR.rotation.x = damp(maria.armR.rotation.x, -0.5, 4, dt);
        maria.armL.rotation.x = damp(maria.armL.rotation.x, -0.5, 4, dt);
      } else if (s === 1) {
        // Guarda chega, Maria levanta
        maria.bodyGroup.position.y = damp(maria.bodyGroup.position.y, 1.35, 4, dt);
        maria.legR.rotation.x = damp(maria.legR.rotation.x, 0, 4, dt);
        maria.legL.rotation.x = damp(maria.legL.rotation.x, 0, 4, dt);
        maria.group.rotation.y = damp(maria.group.rotation.y, 0, 4, dt);
        
        guard.group.position.x = damp(guard.group.position.x, 1.5, 2, dt); // Guarda entra
        guard.group.position.z = damp(guard.group.position.z, 4, 2, dt);
        guard.group.rotation.y = damp(guard.group.rotation.y, Math.PI, 4, dt);
        // Guarda aponta pra saída
        guard.armR.rotation.x = damp(guard.armR.rotation.x, -Math.PI/2, 4, dt);
        guard.armR.rotation.z = damp(guard.armR.rotation.z, -0.5, 4, dt);
      } else if (s >= 2) {
        // Maria andando pro berço
        maria.group.position.x = damp(maria.group.position.x, 1.5, 2, dt);
        maria.group.position.z = damp(maria.group.position.z, 0.5, 2, dt);
        maria.group.rotation.y = damp(maria.group.rotation.y, Math.PI, 4, dt);
        maria.bodyGroup.position.y = damp(maria.bodyGroup.position.y, 1.35, 4, dt);
        
        // Maria segurando algo ou relaxada
        maria.armR.rotation.x = damp(maria.armR.rotation.x, -1.0, 4, dt);
        maria.armL.rotation.x = damp(maria.armL.rotation.x, -1.0, 4, dt);
        maria.armR.rotation.z = damp(maria.armR.rotation.z, 0, 4, dt);

        guard.group.position.x = damp(guard.group.position.x, 10, 2, dt); // Guarda sai
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

export default function CenaArtigo37() {
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
            Art. 37 - Presídio Feminino (3D)
          </span>
        </div>
      </div>
      
    </div>
  );
}
