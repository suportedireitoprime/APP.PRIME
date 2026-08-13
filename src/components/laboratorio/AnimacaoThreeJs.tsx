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
  sidewalk: 0x334155,
  road: 0x1e293b,
  building: 0x1e293b,
  windowLight: 0xfef08a,
  robber: 0xdc2626,
  victim: 0xf59e0b,
  police: 0x1d4ed8, 
  bars: 0x94a3b8,
  alarm: 0xff0000,
  alarmBlue: 0x0000ff,
  skin: 0xfcbca0,
};

const TIMELINE = [
  { step: 0, duration: 5000, text: "Cena 1: João, às 23h da noite, caminhava distraído após o trabalho...", cam: { x: 2, y: 3, z: 14, lookX: 0, lookY: 1.5, fov: 50 } },
  { step: 1, duration: 4500, text: "Um indivíduo se aproxima sorrateiramente com postura agressiva...", cam: { x: -2, y: 2.5, z: 8, lookX: -1, lookY: 1.2, fov: 55 } },
  { step: 2, duration: 5500, text: "Mediante grave ameaça, o assaltante saca uma arma de fogo. João se rende imediatamente.", cam: { x: -0.5, y: 2.0, z: 5.5, lookX: -0.8, lookY: 1.8, fov: 60 } },
  { step: 3, duration: 5000, text: "Ocorre a subtração patrimonial: o assaltante toma a mochila de João (coisa alheia móvel).", cam: { x: -1.5, y: 1.5, z: 6, lookX: -1.5, lookY: 1.0, fov: 50 } },
  { step: 4, duration: 4500, text: "Com a posse invertida, o assaltante empreende fuga correndo.", cam: { x: 1, y: 5, z: 12, lookX: 2, lookY: 1.5, fov: 45 } },
  { step: 5, duration: 4500, text: "As sirenes tocam! A polícia o alcança em flagrante delito.", cam: { x: 6, y: 2, z: 8, lookX: 4, lookY: 2, fov: 65 } },
  { step: 6, duration: 6500, text: "Configurado o Artigo 157: Roubo. Pena prevista é de Reclusão de quatro a dez anos, além de multa.", cam: { x: 4.5, y: 1.8, z: 2.5, lookX: 4, lookY: 1.5, fov: 70 } },
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
    camera.position.set(2, 3, 14);

    // Renderer SEM antialias nativo, para usar SMAA via Post-processing
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = false;
    controls.maxPolarAngle = Math.PI / 2;

    // --- CINEMATIC POST-PROCESSING STACK ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    // SMAA Pass (Superior Antialiasing)
    const smaaPass = new SMAAPass(container.clientWidth * renderer.getPixelRatio(), container.clientHeight * renderer.getPixelRatio());
    composer.addPass(smaaPass);

    // Bloom Pass
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.2, 0.5, 0.85);
    composer.addPass(bloomPass);

    // Film Pass (Grain & Scanlines for analogue cinematic look)
    // intensity, grayscale, scanlines
    const filmPass = new FilmPass(0.35, 0.025, 648, false);
    composer.addPass(filmPass);

    // Outline Pass (Traço de HQ Preto)
    const outlinePass = new OutlinePass(new THREE.Vector2(container.clientWidth, container.clientHeight), scene, camera);
    outlinePass.edgeStrength = 4.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.edgeThickness = 1.5;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set('#000000');
    outlinePass.hiddenEdgeColor.set('#000000');
    composer.addPass(outlinePass);

    composer.addPass(new OutputPass());
    // ---------------------------------------

    // Toon Shading Gradient Map (Degraus de luz)
    const colors = new Uint8Array([50, 150, 255]);
    const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
    gradientMap.needsUpdate = true;

    // Iluminação
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
    moon.userData = { label: 'Ambiente Noturno' };
    scene.add(moon);

    // Luzes da Sirene Policial (Volumétricas)
    const policeGroup = new THREE.Group();
    policeGroup.position.set(15, 0, 0);
    scene.add(policeGroup);

    const pointLightRed = new THREE.PointLight(COLORS.alarm, 0, 30, 2);
    pointLightRed.position.set(-2, 5, 3);
    policeGroup.add(pointLightRed);

    const pointLightBlue = new THREE.PointLight(COLORS.alarmBlue, 0, 30, 2);
    pointLightBlue.position.set(2, 5, 3);
    policeGroup.add(pointLightBlue);

    // Cones de Sirene Volumétricos (Aditivos)
    const coneMatRed = new THREE.MeshBasicMaterial({ color: COLORS.alarm, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const coneRed = new THREE.Mesh(new THREE.ConeGeometry(5, 12, 32), coneMatRed);
    coneRed.position.set(-2, 5, 8);
    coneRed.rotation.x = Math.PI / 2;
    policeGroup.add(coneRed);

    const coneMatBlue = new THREE.MeshBasicMaterial({ color: COLORS.alarmBlue, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const coneBlue = new THREE.Mesh(new THREE.ConeGeometry(5, 12, 32), coneMatBlue);
    coneBlue.position.set(2, 5, 8);
    coneBlue.rotation.x = Math.PI / 2;
    policeGroup.add(coneBlue);

    const spotlight = new THREE.SpotLight(0xffffff, 0, 40, Math.PI / 6, 0.8, 1);
    spotlight.position.set(0, 12, 8);
    spotlight.target.position.set(0, 0, -2);
    spotlight.castShadow = true;
    policeGroup.add(spotlight);
    policeGroup.add(spotlight.target);

    // Environment
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

    const createLampPost = (px: number, pz: number) => {
      const lp = new THREE.Group();
      lp.position.set(px, 0, pz);
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 0.2), new THREE.MeshToonMaterial({ color: 0x222222, gradientMap }));
      pole.position.y = 4;
      pole.castShadow = true;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.2), new THREE.MeshToonMaterial({ color: 0x222222, gradientMap }));
      arm.position.set(0.9, 7.9, 0);
      
      const bulbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
      bulbMesh.position.set(1.8, 7.7, 0);
      
      lp.add(pole, arm, bulbMesh);
      const sl = new THREE.PointLight(0xfffbeb, 2.0, 15, 2); 
      sl.position.set(1.8, 7.4, 0);
      sl.castShadow = true;
      lp.add(sl);
      scene.add(lp);
      return sl;
    };
    const streetLights = [createLampPost(-3, -1.5), createLampPost(5, -1.5), createLampPost(13, -1.5)];

    // Personagens Voxelizados
    const createSquareHumanoid = (color: number, isRobber: boolean, isPolice: boolean = false) => {
      const group = new THREE.Group();
      
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

      if (isPolice) {
        const belt = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.15, 0.62), new THREE.MeshToonMaterial({ color: 0x050505, gradientMap }));
        belt.position.y = -0.4;
        bodyGroup.add(belt);
        const badge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.05), new THREE.MeshToonMaterial({ color: 0xeab308, gradientMap }));
        badge.position.set(-0.25, 0.4, 0.31);
        bodyGroup.add(badge);
      }

      const headGroup = new THREE.Group();
      headGroup.position.y = 1.1;
      bodyGroup.add(headGroup);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), isRobber ? bodyMat : skinMat);
      head.castShadow = true;
      headGroup.add(head);

      if (isRobber) {
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x050505 }));
        slit.position.set(0, 0, 0.4);
        headGroup.add(slit);
        
        const eMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), eMat);
        eL.position.set(-0.16, 0, 0.41); eL.name = 'eyeL';
        const eR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), eMat);
        eR.position.set(0.16, 0, 0.41); eR.name = 'eyeR';
        headGroup.add(eL, eR);
      } else {
        const hairGeo = isPolice ? new THREE.BoxGeometry(0.85, 0.25, 0.85) : new THREE.BoxGeometry(0.85, 0.3, 0.85);
        const hairColor = isPolice ? 0x0f172a : 0x3f3f46;
        const hair = new THREE.Mesh(hairGeo, new THREE.MeshToonMaterial({ color: hairColor, gradientMap }));
        hair.position.y = 0.4;
        
        if (isPolice) {
          const visor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.35), new THREE.MeshToonMaterial({ color: 0x050505, gradientMap }));
          visor.position.set(0, 0.25, 0.45);
          headGroup.add(visor);
        }
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
        
        if (!isPolice) {
          const phone = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.05), new THREE.MeshToonMaterial({ color: 0x18181b, gradientMap }));
          const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.28), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
          phoneScreen.position.z = 0.03;
          phone.add(phoneScreen);
          phone.position.set(0, -0.6, 0.5);
          phone.name = 'phone';
          bodyGroup.add(phone);
        }
      }

      const armR = new THREE.Group();
      armR.position.set(0.65, 0.6, 0);
      const armRM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), isPolice ? new THREE.MeshToonMaterial({ color: COLORS.skin, gradientMap }) : bodyMat);
      if (isPolice) {
        const sleeveR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.32), bodyMat);
        sleeveR.position.y = 0.4;
        armRM.add(sleeveR);
      }
      armRM.position.y = -0.4; armRM.castShadow = true;
      armR.add(armRM);
      bodyGroup.add(armR);

      const armL = new THREE.Group();
      armL.position.set(-0.65, 0.6, 0);
      const armLM = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), isPolice ? new THREE.MeshToonMaterial({ color: COLORS.skin, gradientMap }) : bodyMat);
      if (isPolice) {
        const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.32), bodyMat);
        sleeveL.position.y = 0.4;
        armLM.add(sleeveL);
      }
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

    const robber = createSquareHumanoid(COLORS.robber, true);
    const victim = createSquareHumanoid(COLORS.victim, false);
    const policeModel = createSquareHumanoid(COLORS.police, false, true); 
    
    // Anexando o modelo policial ao grupo da sirene para andarem juntos
    policeGroup.add(policeModel.group);
    policeModel.group.position.set(0, 0, 0); // Zera pois o pai (policeGroup) já se move
    
    robber.group.userData = { label: 'Agente Infrator (Assaltante)' };
    victim.group.userData = { label: 'Vítima' };
    policeModel.group.userData = { label: 'Força Policial (Estado)' };

    // Armas
    const gMat = new THREE.MeshToonMaterial({ color: 0x222222, gradientMap });
    
    const gunGroup = new THREE.Group();
    gunGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), gMat));
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.12), gMat);
    grip.position.set(0, -0.15, -0.1); grip.rotation.x = -0.25;
    gunGroup.add(grip);
    gunGroup.position.set(0, -0.9, 0.35);
    gunGroup.userData = { label: 'Arma (Grave Ameaça)' };
    robber.armR.add(gunGroup);

    const copGun = new THREE.Group();
    copGun.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), gMat));
    const copGrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.12), gMat);
    copGrip.position.set(0, -0.15, -0.1); copGrip.rotation.x = -0.25;
    copGun.add(copGrip);
    copGun.position.set(0, -0.9, 0.35);
    copGun.userData = { label: 'Arma (Polícia)' };
    policeModel.armR.add(copGun);

    // Bag Quadrada
    const bagGroup = new THREE.Group();
    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.25), new THREE.MeshToonMaterial({ color: 0x854d0e, gradientMap }));
    bagBody.castShadow = true;
    bagGroup.add(bagBody);
    bagGroup.userData = { label: 'Mochila (Objeto do Roubo)' };
    scene.add(bagGroup);

    // Jail Quadrada
    const jail = new THREE.Group();
    const barMat = new THREE.MeshToonMaterial({ color: COLORS.bars, gradientMap });
    for (let i = 0; i < 8; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 10, 0.15), barMat);
      bar.position.set(-4.5 + i * 1.3, 5, 0);
      bar.castShadow = true;
      jail.add(bar);
    }
    const tB = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.5), new THREE.MeshToonMaterial({ color: 0x475569, gradientMap }));
    tB.position.set(0, 9.8, 0);
    const bB = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.5), new THREE.MeshToonMaterial({ color: 0x475569, gradientMap }));
    bB.position.set(0, 0.2, 0);
    jail.add(tB, bB);
    jail.userData = { label: 'Pena (Reclusão)' };
    scene.add(jail);

    // Adiciona personagens e armas no OutlinePass para ganharem contorno de Cartoon
    outlinePass.selectedObjects = [robber.group, victim.group, policeModel.group, gunGroup, copGun, bagGroup];

    elementsRef.current = {
      robber, gunGroup, victim, policeModel, policeGroup, copGun, bagGroup, jail, camera, controls,
      pointLightRed, pointLightBlue, coneRed, coneBlue, spotlight, ambientLight, moonLight,
      streetLights, composer, isExploring
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

      // Câmera Cinematográfica "Handheld"
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

        // O drift sutil (Respiração da Câmera)
        camera.position.x += Math.sin(t * 1.8) * 0.005;
        camera.position.y += Math.cos(t * 2.2) * 0.004;
      }

      // Ladrão Kinematics
      const rTargetX = s === 0 ? -8 : (s >= 1 && s <= 3) ? -1.8 : 4.5;
      robber.group.position.x = damp(robber.group.position.x, rTargetX, s === 4 ? 3 : 5, dt);

      if (!isExp && (s === 1 || (s >= 4 && s < 6))) {
        robber.bodyGroup.position.y = 1.4 + Math.abs(Math.sin(t * 18)) * 0.25;
        robber.legR.rotation.x = Math.sin(t * 18) * 0.8;
        robber.legL.rotation.x = -Math.sin(t * 18) * 0.8;
        robber.armL.rotation.x = Math.sin(t * 18) * 0.6;
        robber.bodyGroup.rotation.z = Math.sin(t * 18) * 0.05;
        if (s !== 1) robber.armR.rotation.x = -Math.sin(t * 18) * 0.5;
      } else {
        robber.bodyGroup.position.y = damp(robber.bodyGroup.position.y, 1.4 + (isExp ? 0 : Math.sin(t * 2.5) * 0.02), 4, dt);
        robber.legR.rotation.x = damp(robber.legR.rotation.x, 0, 5, dt);
        robber.legL.rotation.x = damp(robber.legL.rotation.x, 0, 5, dt);
        robber.armL.rotation.x = damp(robber.armL.rotation.x, s >= 5 ? Math.PI - 0.5 : 0, 5, dt); // Braços pra cima se render
        robber.bodyGroup.rotation.z = damp(robber.bodyGroup.rotation.z, 0, 5, dt);
      }

      let rRotY = s >= 4 ? Math.PI / 2 : 0;
      if (s >= 5) {
        // Ladrão encurralado, vira e se rende
        rRotY = Math.PI / 4;
        robber.armR.rotation.x = damp(robber.armR.rotation.x, Math.PI - 0.5, 8, dt);
        gunGroup.rotation.x = damp(gunGroup.rotation.x, Math.PI / 2, 8, dt); // Arma cai ou fica pendurada
      }
      robber.group.rotation.y = damp(robber.group.rotation.y, rRotY, 5, dt);

      const rEyeL = robber.headGroup.children.find((c:any) => c.name === 'eyeL');
      const rEyeR = robber.headGroup.children.find((c:any) => c.name === 'eyeR');
      if (s >= 1 && s <= 4) { 
         if (rEyeL) { rEyeL.rotation.z = damp(rEyeL.rotation.z, -0.4, 5, dt); rEyeL.scale.y = damp(rEyeL.scale.y, 0.4, 5, dt); }
         if (rEyeR) { rEyeR.rotation.z = damp(rEyeR.rotation.z, 0.4, 5, dt); rEyeR.scale.y = damp(rEyeR.scale.y, 0.4, 5, dt); }
      } else { 
         if (rEyeL) { rEyeL.rotation.z = damp(rEyeL.rotation.z, 0, 5, dt); rEyeL.scale.y = damp(rEyeL.scale.y, s>=5?1.5:1, 5, dt); }
         if (rEyeR) { rEyeR.rotation.z = damp(rEyeR.rotation.z, 0, 5, dt); rEyeR.scale.y = damp(rEyeR.scale.y, s>=5?1.5:1, 5, dt); }
      }

      const armRotX = (s === 2 || s === 3) ? -Math.PI / 2 + 0.1 : 0;
      if (s < 5) robber.armR.rotation.x = damp(robber.armR.rotation.x, armRotX, 7, dt);
      gunGroup.visible = s === 2 || s === 3 || isExp;
      if (s === 3) robber.armL.rotation.x = damp(robber.armL.rotation.x, -Math.PI / 3.5, 5, dt);

      // Vítima Kinematics
      const phone = victim.bodyGroup.children.find((c: THREE.Object3D) => c.name === 'phone');
      if (phone) phone.visible = s === 0 || isExp;

      if (!isExp && s >= 2 && s <= 4) {
        victim.group.position.z = Math.sin(t * 35) * 0.03;
        victim.headGroup.rotation.x = -0.25;
        victim.headGroup.rotation.y = Math.sin(t * 8) * 0.15;
        victim.armR.rotation.x = damp(victim.armR.rotation.x, Math.PI - 0.2, 6, dt);
        victim.armL.rotation.x = damp(victim.armL.rotation.x, Math.PI - 0.2, 6, dt);
      } else if (!isExp && s === 0) {
        victim.bodyGroup.position.y = 1.4 + Math.sin(t * 4) * 0.02;
        victim.legR.rotation.x = Math.sin(t * 4) * 0.15;
        victim.legL.rotation.x = -Math.sin(t * 4) * 0.15;
        victim.headGroup.rotation.x = -0.15;
        victim.armR.rotation.x = damp(victim.armR.rotation.x, 0.3, 4, dt);
        victim.armL.rotation.x = damp(victim.armL.rotation.x, 0, 4, dt);
      } else {
        victim.group.position.z = 0;
        victim.headGroup.rotation.x = damp(victim.headGroup.rotation.x, 0, 4, dt);
        victim.headGroup.rotation.y = damp(victim.headGroup.rotation.y, 0, 4, dt);
        victim.armR.rotation.x = damp(victim.armR.rotation.x, 0, 5, dt);
        victim.armL.rotation.x = damp(victim.armL.rotation.x, 0, 5, dt);
        victim.legR.rotation.x = damp(victim.legR.rotation.x, 0, 5, dt);
        victim.legL.rotation.x = damp(victim.legL.rotation.x, 0, 5, dt);
      }

      // Viatura Policial Kinematics
      if (s >= 5) {
        policeGroup.position.x = damp(policeGroup.position.x, 8.5, 6, dt);
        policeModel.group.rotation.y = damp(policeModel.group.rotation.y, -Math.PI / 4, 7, dt);
        policeModel.armR.rotation.x = damp(policeModel.armR.rotation.x, -Math.PI / 2 + 0.1, 7, dt);
        policeModel.armL.rotation.x = damp(policeModel.armL.rotation.x, -Math.PI / 3, 7, dt);
        copGun.visible = true;
      } else {
        policeGroup.position.x = 20;
        policeModel.group.rotation.y = -Math.PI / 2;
        policeModel.armR.rotation.x = 0;
        policeModel.armL.rotation.x = 0;
        copGun.visible = false;
      }

      // Sirenes Giratórias (Volumétricas)
      coneRed.rotation.z = t * -5;
      coneBlue.rotation.z = t * 5;

      // Bolsa
      if (s <= 1) {
        bagGroup.position.copy(victim.group.position).add(new THREE.Vector3(-0.7, 1.0, 0.5));
        bagGroup.rotation.z = 0;
      } else if (s === 2) {
        bagGroup.position.y = damp(bagGroup.position.y, 0.35, 8, dt);
        bagGroup.position.x = damp(bagGroup.position.x, -0.9, 8, dt);
        bagGroup.rotation.z = damp(bagGroup.rotation.z, Math.PI / 2, 8, dt);
      } else {
        bagGroup.position.copy(robber.group.position).add(new THREE.Vector3(-0.6, 1.1, 0.5));
        bagGroup.rotation.z = -0.2;
      }

      // Grades da Reclusão
      jail.position.x = 4.5;
      const jY = s === 6 ? 0 : 25;
      jail.position.y = damp(jail.position.y, jY, s === 6 ? 12 : 5, dt);

      // Luzes Dinâmicas e Sirenes
      if (s >= 5) {
        ambientLight.intensity = 0.1;
        moonLight.intensity = 0.4;
        streetLights.forEach(sl => sl.intensity = damp(sl.intensity, 0.1, 5, dt));
        pointLightRed.intensity = (Math.sin(t * 15) > 0 ? 1 : 0) * 100;
        pointLightBlue.intensity = (Math.cos(t * 15) > 0 ? 1 : 0) * 100;
        spotlight.intensity = 100;
        coneRed.material.opacity = (Math.sin(t * 15) > 0 ? 0.3 : 0);
        coneBlue.material.opacity = (Math.cos(t * 15) > 0 ? 0.3 : 0);
      } else {
        ambientLight.intensity = 0.4;
        moonLight.intensity = 2.0;
        streetLights.forEach(sl => sl.intensity = damp(sl.intensity, 2.0, 3, dt));
        pointLightRed.intensity = 0;
        pointLightBlue.intensity = 0;
        spotlight.intensity = 0;
        coneRed.material.opacity = 0;
        coneBlue.material.opacity = 0;
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

export const AnimacaoThreeJs = () => {
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
            <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-b-4 border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white/95 border-t border-l border-white/20 rotate-45"></div>
              <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
                {TIMELINE[currentIdx].text}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
              {TIMELINE.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-primary shadow-[0_0_8px_rgba(255,255,255,1)]' : 'w-2 bg-white/50'}`} />
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
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Art. 157 - Roubo (Cinematic Mode)
          </span>
        </div>
      </div>
      
    </div>
  );
};

export default AnimacaoThreeJs;
