import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TIMELINE = [
  { step: 0, duration: 4000, text: "Cena 1: Beco escuro. A vítima encontra-se parada de costas." },
  { step: 1, duration: 3000, text: "O Agente surge das sombras, aproximando-se com intenção homicida (animus necandi)." },
  { step: 2, duration: 3000, text: "O Agente desfere o golpe letal contra a vítima." },
  { step: 3, duration: 5000, text: "Art. 121: Matar alguém. Pena - reclusão, de seis a vinte anos." },
];

const CameraController = ({ step }: { step: number }) => {
  const vec = new THREE.Vector3();
  useFrame((state, delta) => {
    const targetX = step === 0 ? 0 : step === 1 ? -2 : step === 2 ? -2.5 : 0;
    const targetY = step === 0 ? 3 : step === 1 ? 2.5 : step === 2 ? 2.5 : 8;
    const targetZ = step === 0 ? 10 : step === 1 ? 7 : step === 2 ? 6 : 8;
    
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2, delta);
    
    const lookAtX = step === 3 ? 0 : -2;
    const lookAtY = step === 3 ? 0 : 1;
    vec.set(lookAtX, lookAtY, 0);
    state.camera.lookAt(vec);
  });
  return null;
};

const Scenery = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      
      {/* Paredes do beco */}
      <mesh position={[-5, 4, -5]} receiveShadow>
        <boxGeometry args={[2, 10, 20]} />
        <meshStandardMaterial color="#020617" roughness={1} />
      </mesh>
      <mesh position={[5, 4, -5]} receiveShadow>
        <boxGeometry args={[2, 10, 20]} />
        <meshStandardMaterial color="#020617" roughness={1} />
      </mesh>
      <mesh position={[0, 4, -15]} receiveShadow>
        <boxGeometry args={[12, 10, 2]} />
        <meshStandardMaterial color="#020617" roughness={1} />
      </mesh>
      
      {/* Luz dramática vermelha no fundo */}
      <pointLight position={[0, 2, -10]} intensity={2} color="#dc2626" distance={15} />
      <pointLight position={[-2, 6, 2]} intensity={0.5} color="#cbd5e1" castShadow />
    </group>
  );
};

const Victim = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (step >= 3) {
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, -Math.PI / 2, 6, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, -0.6, 6, delta);
    } else {
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 6, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 6, delta);
    }
  });

  return (
    <group ref={groupRef} position={[-2, 0, -2]} rotation={[0, Math.PI, 0]}>
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
};

const Agente = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Movimento do agente
    const targetZ = step === 0 ? 5 : step >= 1 ? -1 : 5;
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 3, delta);

    // Braço para o golpe
    if (armRef.current) {
      const targetArmX = step === 2 ? -Math.PI / 1.5 : 0;
      armRef.current.rotation.x = THREE.MathUtils.damp(armRef.current.rotation.x, targetArmX, 15, delta);
    }
  });

  return (
    <group ref={groupRef} position={[-2, 0, 5]}>
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      
      {/* Faca/Arma */}
      <group ref={armRef} position={[0.5, 1.5, 0]}>
        <mesh castShadow position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#991b1b" />
        </mesh>
        <mesh castShadow position={[0, -0.9, -0.3]}>
          <boxGeometry args={[0.05, 0.1, 0.6]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

export default function CenaArtigo121() {
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
          <ambientLight intensity={0.1} />
          <Scenery />
          <Victim step={currentIdx} />
          <Agente step={currentIdx} />
        </Canvas>

        {/* UI Overlay */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl">
          <div className="bg-black/80 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-red-900/50">
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

        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-red-900/50 px-3 py-1.5 rounded-full z-10 pointer-events-none">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Art. 121 - Homicídio
          </span>
        </div>
      </div>
    </div>
  );
}
