import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TIMELINE = [
  { step: 0, duration: 4000, text: "Cena 1: Sala de reuniões clara e bem iluminada. O Agente e a Vítima frente a frente." },
  { step: 1, duration: 4500, text: "O Agente gesticula de forma amigável, apresentando uma suposta vantagem imperdível." },
  { step: 2, duration: 4000, text: "A Vítima, induzida a erro (enganada), entrega voluntariamente seus valores (maleta)." },
  { step: 3, duration: 5500, text: "Art. 171: Estelionato. Obter, para si, vantagem ilícita. Pena - reclusão, de 1 a 5 anos." },
];

const CameraController = ({ step }: { step: number }) => {
  const vec = new THREE.Vector3();
  useFrame((state, delta) => {
    const targetX = step === 0 ? 0 : step === 1 ? -1 : step === 2 ? 0 : 0;
    const targetY = step === 0 ? 4 : step === 1 ? 3 : step === 2 ? 3 : 5;
    const targetZ = step === 0 ? 12 : step === 1 ? 8 : step === 2 ? 7 : 10;
    
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2, delta);
    
    vec.set(0, 1.5, 0);
    state.camera.lookAt(vec);
  });
  return null;
};

const Scenery = () => {
  return (
    <group>
      {/* Chão claro */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>
      
      {/* Paredes Claras */}
      <mesh position={[0, 4, -4]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>
      
      {/* Mesa Redonda de Vidro */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[2, 2, 0.1, 32]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 1, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[0, 5, 0]} intensity={1} color="#fef08a" />
    </group>
  );
};

const Maleta = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (step >= 2) {
      // Vítima entrega para o Agente
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, -2, 4, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 1.5, 4, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, 0, 4, delta);
      if (step === 3) {
        // Agente vai embora com a maleta
        groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, -6, 3, delta);
      }
    } else {
      // Começa na posse da vítima
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, 2, 4, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 1.5, 4, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, 0, 4, delta);
    }
  });

  return (
    <mesh ref={groupRef} castShadow receiveShadow position={[2, 1.5, 0]}>
      <boxGeometry args={[0.5, 0.4, 0.2]} />
      <meshStandardMaterial color="#020617" />
    </mesh>
  );
};

const PapelFalso = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (step === 1) {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, 0, 4, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0.6, 4, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, 0, 4, delta);
    } else {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, -2, 4, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 1.5, 4, delta);
    }
  });

  return (
    <mesh ref={groupRef} castShadow receiveShadow position={[-2, 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.5, 0.7]} />
      <meshStandardMaterial color="#fcd34d" side={THREE.DoubleSide} />
    </mesh>
  );
};

const Personagem = ({ step, isAgent }: { step: number, isAgent: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (isAgent && step === 3) {
      // Fuga calma
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, -6, 2, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, Math.PI / 2, 3, delta);
    } else if (isAgent && step === 1) {
      // Gesticulando
      if (armRef.current) {
        armRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 6) * 0.5;
        armRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 4) * 0.5;
      }
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, isAgent ? 0 : 0, 4, delta);
      if (armRef.current) {
        armRef.current.rotation.z = THREE.MathUtils.damp(armRef.current.rotation.z, 0, 5, delta);
        armRef.current.rotation.x = THREE.MathUtils.damp(armRef.current.rotation.x, 0, 5, delta);
      }
    }
  });

  return (
    <group ref={groupRef} position={[isAgent ? -2.5 : 2.5, 0, 0]} rotation={[0, isAgent ? Math.PI / 4 : -Math.PI / 4, 0]}>
      {/* Terno do agente / Roupa da Vítima */}
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color={isAgent ? "#1e3a8a" : "#ca8a04"} />
      </mesh>
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={isAgent ? "#1e3a8a" : "#ca8a04"} />
      </mesh>
      
      {/* Braço de gesticulação (Direito para o Agente) */}
      <group ref={armRef} position={[0.5, 1.5, 0]}>
        <mesh castShadow position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color={isAgent ? "#1e3a8a" : "#ca8a04"} />
        </mesh>
      </group>
    </group>
  );
};

export default function CenaArtigo171() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
    }, TIMELINE[currentIdx].duration);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#f8fafc]">
        <Canvas shadows dpr={[1, 2]} gl={{ powerPreference: "high-performance", antialias: true }} camera={{ position: [0, 4, 12], fov: 45 }}>
          <CameraController step={currentIdx} />
          <Scenery />
          <Personagem step={currentIdx} isAgent={true} />
          <Personagem step={currentIdx} isAgent={false} />
          <Maleta step={currentIdx} />
          <PapelFalso step={currentIdx} />
        </Canvas>

        {/* UI Overlay */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl">
          <div className="bg-white/95 backdrop-blur-md text-slate-900 p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-emerald-500/30">
            <p className="text-[17px] sm:text-xl font-bold text-center leading-relaxed font-sans tracking-tight">
              {TIMELINE[currentIdx].text}
            </p>
          </div>
          <div className="flex justify-center gap-2 mt-4 drop-shadow-md">
            {TIMELINE.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'w-2 bg-slate-400/50'}`} />
            ))}
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md border border-emerald-500/20 px-3 py-1.5 rounded-full z-10 pointer-events-none shadow-sm">
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Art. 171 - Estelionato
          </span>
        </div>
      </div>
    </div>
  );
}
