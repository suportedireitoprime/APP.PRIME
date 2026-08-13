import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TIMELINE = [
  { step: 0, duration: 4000, text: "Cena 1: Uma bolsa repousa sobre um banco em uma praça deserta." },
  { step: 1, duration: 4000, text: "O Agente esgueira-se sorrateiramente por trás do banco." },
  { step: 2, duration: 4000, text: "Sem que haja violência ou grave ameaça, o Agente subtrai a bolsa." },
  { step: 3, duration: 5000, text: "Art. 155: Furto. Subtrair coisa alheia móvel. Pena: Reclusão de 1 a 4 anos." },
];

const CameraController = ({ step }: { step: number }) => {
  const vec = new THREE.Vector3();
  useFrame((state, delta) => {
    const targetX = step === 0 ? 0 : step === 1 ? -2 : step === 2 ? -1 : 0;
    const targetY = step === 0 ? 3 : step === 1 ? 2 : step === 2 ? 1.5 : 4;
    const targetZ = step === 0 ? 10 : step === 1 ? 8 : step === 2 ? 5 : 12;
    
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2, delta);
    
    const lookAtX = step === 3 ? 0 : step === 1 ? -1 : 0;
    vec.set(lookAtX, 1, 0);
    state.camera.lookAt(vec);
  });
  return null;
};

const Scenery = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      
      {/* Banco de praça */}
      <group position={[0, 0, 0]}>
        {/* Assento */}
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[4, 0.1, 1]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
        {/* Encosto */}
        <mesh castShadow receiveShadow position={[0, 1, -0.5]}>
          <boxGeometry args={[4, 0.8, 0.1]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
        {/* Pés */}
        <mesh castShadow receiveShadow position={[-1.5, 0, 0]}>
          <boxGeometry args={[0.2, 1, 0.8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh castShadow receiveShadow position={[1.5, 0, 0]}>
          <boxGeometry args={[0.2, 1, 0.8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
      
      {/* Poste */}
      <mesh castShadow receiveShadow position={[3, 2.5, -2]}>
        <cylinderGeometry args={[0.1, 0.1, 6, 16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <spotLight
        position={[3, 5, -2]}
        angle={0.6}
        penumbra={0.5}
        intensity={25}
        color="#fef08a"
        castShadow
      >
        <object3D position={[0, 0, 0]} attach="target" />
      </spotLight>
    </group>
  );
};

const Bag = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (step >= 2) {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, -2, 5, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 1.2, 5, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, -1, 5, delta);
      if (step === 3) {
        groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, -8, 3, delta);
      }
    }
  });

  return (
    <mesh ref={groupRef} castShadow receiveShadow position={[0.5, 0.7, 0]}>
      <boxGeometry args={[0.6, 0.5, 0.3]} />
      <meshStandardMaterial color="#9d174d" />
    </mesh>
  );
};

const Agente = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Movimento do agente
    let targetX = -8;
    let targetZ = -2;
    if (step === 1 || step === 2) {
      targetX = -2;
      targetZ = -1;
    } else if (step === 3) {
      targetX = -10;
      targetZ = -2;
    }
    
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 3, delta);
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 3, delta);
    
    // Animação de andar furtivo
    if (step === 1 || step === 3) {
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.2;
    } else {
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 4, delta);
    }
  });

  return (
    <group ref={groupRef} position={[-8, 0, -2]}>
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Máscara */}
      <mesh castShadow position={[0, 2.4, 0.45]}>
        <boxGeometry args={[0.6, 0.2, 0.1]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
    </group>
  );
};

export default function CenaArtigo155() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
    }, TIMELINE[currentIdx].duration);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#0a1128]">
        <Canvas shadows dpr={[1, 2]} gl={{ powerPreference: "high-performance", antialias: true }} camera={{ position: [0, 3, 10], fov: 50 }}>
          <CameraController step={currentIdx} />
          <ambientLight intensity={0.2} />
          <Scenery />
          <Bag step={currentIdx} />
          <Agente step={currentIdx} />
        </Canvas>

        {/* UI Overlay */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl">
          <div className="bg-black/80 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-blue-900/50">
            <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
              {TIMELINE[currentIdx].text}
            </p>
          </div>
          <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
            {TIMELINE.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]' : 'w-2 bg-white/50'}`} />
            ))}
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-blue-900/50 px-3 py-1.5 rounded-full z-10 pointer-events-none">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Art. 155 - Furto
          </span>
        </div>
      </div>
    </div>
  );
}
