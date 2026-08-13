import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

interface AnimacaoExemplo3DSceneProps {
  step: number;
}

const AnimacaoExemplo3DScene: React.FC<AnimacaoExemplo3DSceneProps> = ({ step }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step);

  // Mantem a referência atualizada do step para acessar dentro do loop de animação
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SETUP PRINCIPAL ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0D0D0D');
    scene.fog = new THREE.FogExp2('#0D0D0D', 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 6, 15);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Desligado porque o SMAAPass cuida disso
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);

    // --- PÓS-PROCESSAMENTO ---
    const composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.2, 0.4, 0.85);
    composer.addPass(bloomPass);

    const smaaPass = new SMAAPass(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
    composer.addPass(smaaPass);

    const filmPass = new FilmPass(0.35, 0.025, 648, false);
    composer.addPass(filmPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // --- ILUMINAÇÃO ---
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.1);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#ffffff', '#111122', 0.4); // Luz de preenchimento global p/ evitar áreas 100% pretas
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight('#ffffff', 1.5);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const blueLight = new THREE.PointLight('#3b82f6', 20, 20);
    blueLight.position.set(0, 5, -2);
    scene.add(blueLight);
    
    const redLight = new THREE.PointLight('#ef4444', 15, 20);
    redLight.position.set(-4, 5, 2);
    scene.add(redLight);

    // --- CENÁRIO ---
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.7, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    const backGeo = new THREE.PlaneGeometry(50, 20);
    const backMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 });
    const backdrop = new THREE.Mesh(backGeo, backMat);
    backdrop.position.set(0, 4, -8);
    backdrop.receiveShadow = true;
    scene.add(backdrop);

    // --- ATORES (VOXELS) ---
    const createVoxelHuman = (colorMain: string, colorHead: string) => {
      const group = new THREE.Group();
      
      const bodyMat = new THREE.MeshStandardMaterial({ color: colorMain });
      const headMat = new THREE.MeshStandardMaterial({ color: colorHead });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), bodyMat);
      torso.position.y = 1;
      torso.castShadow = true;
      group.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), headMat);
      head.position.y = 2.4;
      head.castShadow = true;
      group.add(head);

      // Arms
      const rightArm = new THREE.Group();
      rightArm.position.set(0.5, 1.5, 0);
      const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), bodyMat);
      rightArmMesh.position.y = -0.4;
      rightArmMesh.castShadow = true;
      rightArm.add(rightArmMesh);
      group.add(rightArm);

      const leftArm = new THREE.Group();
      leftArm.position.set(-0.5, 1.5, 0);
      const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), bodyMat);
      leftArmMesh.position.y = -0.4;
      leftArmMesh.castShadow = true;
      leftArm.add(leftArmMesh);
      group.add(leftArm);

      return { group, rightArm, leftArm, torso, head };
    };

    // Robber (Ladrão)
    const robber = createVoxelHuman('#ef4444', '#1f2937');
    robber.group.position.set(-8, 0, 0); // Inicia fora
    
    // Arma
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.4), new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 0.8 }));
    gun.position.set(0, -0.9, 0.2);
    gun.visible = false;
    robber.rightArm.add(gun);

    // Bolsa na vítima (apenas no começo)
    const victim = createVoxelHuman('#eab308', '#eab308');
    victim.group.position.set(2, 0, 0);

    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: '#b45309' }));
    bag.position.set(0, -0.9, 0);
    bag.visible = false;
    robber.leftArm.add(bag);

    const victimBag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: '#b45309' }));
    victimBag.position.set(-0.6, 1.0, 0.4);
    victim.group.add(victimBag);

    scene.add(robber.group);
    scene.add(victim.group);

    // Barras da Prisão
    const prisonGroup = new THREE.Group();
    for (let i = 0; i < 13; i++) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 5, 16),
        new THREE.MeshStandardMaterial({ color: '#71717a', metalness: 0.8, roughness: 0.2 })
      );
      bar.position.set(-3 + i * 0.5, 2, 0);
      bar.castShadow = true;
      prisonGroup.add(bar);
    }
    const horizontalTop = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: '#71717a', metalness: 0.8 }));
    horizontalTop.position.set(0, 4, 0);
    horizontalTop.castShadow = true;
    prisonGroup.add(horizontalTop);
    
    const horizontalBot = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: '#71717a', metalness: 0.8 }));
    horizontalBot.position.set(0, 0.5, 0);
    horizontalBot.castShadow = true;
    prisonGroup.add(horizontalBot);

    prisonGroup.position.set(0, 8, 3); // Oculto em cima inicialmente
    scene.add(prisonGroup);


    // --- HELPERS E ANIMAÇÃO ---
    const clock = new THREE.Clock();
    let reqId: number;

    const damp = (current: number, target: number, lambda: number, delta: number) => {
      return current + (target - current) * (lambda * delta);
    };

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const t = clock.getElapsedTime();
      const currentStep = stepRef.current;

      // 1. Câmera
      const camTargetX = currentStep === 0 ? 0 : currentStep === 1 ? 1.5 : -1.5;
      const camTargetY = currentStep === 0 ? 6 : currentStep === 1 ? 4.5 : 4.5;
      const camTargetZ = currentStep === 0 ? 15 : currentStep === 1 ? 10 : 10.5;
      
      camera.position.x = damp(camera.position.x, camTargetX, 2.5, delta);
      camera.position.y = damp(camera.position.y, camTargetY, 2.5, delta);
      camera.position.z = damp(camera.position.z, camTargetZ, 2.5, delta);
      
      // Handheld Drift sutil
      camera.position.x += Math.sin(t * 1.5) * 0.002;
      camera.position.y += Math.cos(t * 2.1) * 0.002;

      // LookAt
      const lookAtX = currentStep === 0 ? 0 : currentStep === 1 ? 1 : -1;
      camera.lookAt(new THREE.Vector3(lookAtX, 1.5, 0));

      // 2. Sirenes de Polícia (iluminação dinâmica de PostProcessing Bloom)
      if (currentStep >= 1) {
        redLight.intensity = (Math.sin(t * 10) * 0.5 + 0.5) * 20;
        blueLight.intensity = (Math.cos(t * 10) * 0.5 + 0.5) * 20;
      } else {
        redLight.intensity = 5;
        blueLight.intensity = 5;
      }

      // 3. Ladrão
      const robTargetX = currentStep === 0 ? -2 : currentStep === 1 ? -1.5 : 8;
      const robTargetRotY = currentStep === 2 ? Math.PI / 8 : 0;

      robber.group.position.x = damp(robber.group.position.x, robTargetX, 4, delta);
      robber.group.rotation.y = damp(robber.group.rotation.y, robTargetRotY, 4, delta);

      if (currentStep === 2) {
        robber.group.position.y = Math.abs(Math.sin(t * 15)) * 0.4;
      } else {
        robber.group.position.y = damp(robber.group.position.y, 0, 4, delta);
      }

      gun.visible = currentStep >= 1;
      bag.visible = currentStep >= 1;

      const rightArmTargetX = currentStep >= 1 ? -Math.PI / 2 : 0;
      robber.rightArm.rotation.x = damp(robber.rightArm.rotation.x, rightArmTargetX, 6, delta);

      if (currentStep === 2) {
        robber.leftArm.rotation.x = Math.sin(t * 15) * 0.8;
      } else {
        robber.leftArm.rotation.x = damp(robber.leftArm.rotation.x, 0, 6, delta);
      }

      // 4. Vítima
      const vicTargetX = currentStep >= 1 ? 2.5 : 2;
      victim.group.position.x = damp(victim.group.position.x, vicTargetX, 5, delta);
      
      const vicArmTargetZ = currentStep >= 1 ? Math.PI : 0;
      victim.rightArm.rotation.z = damp(victim.rightArm.rotation.z, -vicArmTargetZ, 5, delta);
      victim.leftArm.rotation.z = damp(victim.leftArm.rotation.z, vicArmTargetZ, 5, delta);
      
      victimBag.visible = currentStep === 0;

      // 5. Prisão
      const prisonTargetY = currentStep === 2 ? 0 : 8;
      prisonGroup.position.y = damp(prisonGroup.position.y, prisonTargetY, 3, delta);

      // Render
      composer.render();
    };

    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- CLEANUP (MANDATÓRIO) ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      
      // Destruir WebGL resources
      scene.traverse((object: any) => {
        if (!object.isMesh) return;
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat: any) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      composer.dispose();
      renderer.dispose();
      
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full relative" />;
};

export default AnimacaoExemplo3DScene;
