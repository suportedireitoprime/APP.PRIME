import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

interface AnimacaoExemplo3DSceneProps {
  step: number;
  isExploring?: boolean;
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

export default function AnimacaoExemplo3DScene({ step, isExploring = false }: AnimacaoExemplo3DSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.015);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(2, 3, 14);

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

    // Construtor Voxel Actor
    const createSquareHumanoid = (color: number) => {
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

    const agent = createSquareHumanoid(COLORS.robber);
    const victim = createSquareHumanoid(COLORS.victim);
    
    agent.group.position.set(-8, 0, 0);
    victim.group.position.set(0, 0, 0);
    victim.group.rotation.y = -Math.PI / 2;

    // Arma do Agente
    const gunGroup = new THREE.Group();
    const gMat = new THREE.MeshToonMaterial({ color: 0x222222, gradientMap });
    gunGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), gMat));
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.12), gMat);
    grip.position.set(0, -0.15, -0.1); grip.rotation.x = -0.25;
    gunGroup.add(grip);
    gunGroup.position.set(0, -0.9, 0.35);
    agent.armR.add(gunGroup);

    // Prisão
    const jail = new THREE.Group();
    const barMat = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap });
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
    jail.position.y = 25; // Oculta a prisão no ar no início
    scene.add(jail);

    // Contorno Negro (Cartoon)
    outlinePass.selectedObjects = [agent.group, victim.group, gunGroup];

    elementsRef.current = {
      agent, victim, gunGroup, jail, camera, controls, composer, isExploring
    };

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

      if (isExp) {
        controls.enabled = true;
        controls.update();
      } else {
        controls.enabled = false;
        
        // Posições scriptadas da Câmera baseada no Step
        let camX = 2, camY = 3, camZ = 14, lX = 0, lY = 1.5, fov = 50;
        if (s === 1) { camX = -2; camY = 2.5; camZ = 8; lX = -1; lY = 1.2; fov = 55; }
        if (s === 2) { camX = 4.5; camY = 1.8; camZ = 2.5; lX = 4; lY = 1.5; fov = 70; }

        camera.fov = damp(camera.fov, fov, 2, dt);
        camera.updateProjectionMatrix();
        
        camera.position.x = damp(camera.position.x, camX, 2, dt);
        camera.position.y = damp(camera.position.y, camY, 2, dt);
        camera.position.z = damp(camera.position.z, camZ, 2, dt);
        camTarget.x = damp(camTarget.x, lX, 2, dt);
        camTarget.y = damp(camTarget.y, lY, 2, dt);
        camera.lookAt(camTarget);

        // Drift (Handheld)
        camera.position.x += Math.sin(t * 1.8) * 0.005;
        camera.position.y += Math.cos(t * 2.2) * 0.004;
      }

      // Cinemática do Agente Infrator
      const rTargetX = s === 0 ? -8 : s === 1 ? -1.8 : 4.5;
      agent.group.position.x = damp(agent.group.position.x, rTargetX, 5, dt);

      // Animação de Andar (Senoide nas pernas) se ele estiver se movendo
      if (!isExp && (s === 1)) {
        agent.bodyGroup.position.y = 1.4 + Math.abs(Math.sin(t * 18)) * 0.25;
        agent.legR.rotation.x = Math.sin(t * 18) * 0.8;
        agent.legL.rotation.x = -Math.sin(t * 18) * 0.8;
        agent.armL.rotation.x = Math.sin(t * 18) * 0.6;
        agent.armR.rotation.x = -Math.sin(t * 18) * 0.5;
        agent.bodyGroup.rotation.z = Math.sin(t * 18) * 0.05;
      } else {
        // Parado
        agent.bodyGroup.position.y = damp(agent.bodyGroup.position.y, 1.4 + (isExp ? 0 : Math.sin(t * 2.5) * 0.02), 4, dt);
        agent.legR.rotation.x = damp(agent.legR.rotation.x, 0, 5, dt);
        agent.legL.rotation.x = damp(agent.legL.rotation.x, 0, 5, dt);
        agent.armL.rotation.x = damp(agent.armL.rotation.x, 0, 5, dt);
        
        // Arma abaixada se não estiver no crime
        const armRotX = s === 1 ? -Math.PI / 2 + 0.1 : 0;
        agent.armR.rotation.x = damp(agent.armR.rotation.x, armRotX, 7, dt);
        
        agent.bodyGroup.rotation.z = damp(agent.bodyGroup.rotation.z, 0, 5, dt);
      }
      gunGroup.visible = s === 1 || isExp;

      // Rotação do Agente
      let rRotY = s >= 2 ? Math.PI / 4 : 0;
      agent.group.rotation.y = damp(agent.group.rotation.y, rRotY, 5, dt);

      // Cinemática da Prisão
      jail.position.x = 4.5;
      const jY = s >= 2 ? 0 : 25;
      jail.position.y = damp(jail.position.y, jY, s >= 2 ? 12 : 5, dt);

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
      cancelAnimationFrame(animationId);
      scene.traverse((object: any) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((m:any) => m.dispose());
          else object.material.dispose();
        }
      });
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      composer.dispose();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  useEffect(() => {
    elementsRef.current.step = step;
  }, [step]);

  useEffect(() => {
    elementsRef.current.isExploring = isExploring;
  }, [isExploring]);

  return <div ref={mountRef} className="w-full h-full cursor-pointer" />;
}
