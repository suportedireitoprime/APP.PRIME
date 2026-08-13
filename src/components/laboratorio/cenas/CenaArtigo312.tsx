import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const TIMELINE = [
  { step: 0, duration: 4000, text: "Cena 1: Repartição pública. O funcionário público tem livre acesso ao cofre estatal." },
  { step: 1, duration: 4000, text: "Sem precisar arrombar, o Agente se aproxima do bem de que tem posse em razão do cargo." },
  { step: 2, duration: 4000, text: "O Agente apropria-se do dinheiro público para proveito próprio." },
  { step: 3, duration: 5500, text: "Art. 312: Peculato. Apropriar-se o funcionário público de dinheiro ou bem móvel. Pena - reclusão, de 2 a 12 anos." },
];

const CameraController = ({ step }: { step: number }) => {
  const vec = new THREE.Vector3();
  useFrame((state, delta) => {
    // Câmera estática no topo do canto simulando câmera de segurança
    const targetX = 6;
    const targetY = 8;
    const targetZ = 6;
    
    // Pequeno pan para acompanhar o agente
    const lookAtX = step === 0 ? 0 : step === 1 ? -2 : step === 2 ? -3 : step === 3 ? -1 : 0;
    const lookAtZ = step === 3 ? 3 : 0;
    
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2, delta);
    
    vec.set(lookAtX, 1, lookAtZ);
    state.camera.lookAt(vec);
  });
  return null;
};

const Scenery = () => {
  return (
    <group>
      {/* Chão Repartição */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      
      {/* Paredes */}
      <mesh position={[0, 4, -4]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-6, 4, 4]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Mesa de Trabalho */}
      <mesh castShadow receiveShadow position={[2, 0.5, 0]}>
        <boxGeometry args={[3, 0.2, 1.5]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh castShadow receiveShadow position={[0.7, 0, 0.5]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh castShadow receiveShadow position={[3.3, 0, 0.5]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Cofre do Estado */}
      <mesh castShadow receiveShadow position={[-4, 1.5, -2]}>
        <boxGeometry args={[2, 4, 1.5]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-3.9, 1.5, -1.2]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffffff" />
    </group>
  );
};

const BemPublico = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (step >= 2) {
      // Vai para o bolso do agente
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, -2.5, 5, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 1, 5, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, -1, 5, delta);
      groupRef.current.scale.set(0, 0, 0); // Desaparece no bolso
    } else {
      // Dentro do cofre aberto
      groupRef.current.position.set(-3.5, 1.5, -1);
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <mesh ref={groupRef} castShadow position={[-3.5, 1.5, -1]}>
      <boxGeometry args={[0.5, 0.3, 0.3]} />
      <meshStandardMaterial color="#22c55e" /> {/* Dinheiro */}
    </mesh>
  );
};

const Funcionario = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Movimento do funcionário
    let targetX = 1;
    let targetZ = 2;
    if (step === 1 || step === 2) {
      targetX = -2.5; // Vai pro cofre
      targetZ = -1;
    } else if (step === 3) {
      targetX = -2.5;
      targetZ = 5; // Foge lentamente
    }
    
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 2, delta);
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 2, delta);
    
    if (step === 2) {
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, Math.PI / 2, 4, delta);
      if (armRef.current) {
        armRef.current.rotation.x = THREE.MathUtils.damp(armRef.current.rotation.x, -Math.PI / 2, 4, delta);
      }
    } else if (step === 3) {
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, 0, 4, delta);
      if (armRef.current) armRef.current.rotation.x = THREE.MathUtils.damp(armRef.current.rotation.x, 0, 4, delta);
    } else {
      if (armRef.current) armRef.current.rotation.x = THREE.MathUtils.damp(armRef.current.rotation.x, 0, 4, delta);
    }
  });

  return (
    <group ref={groupRef} position={[1, 0, 2]}>
      {/* Terno */}
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Gravata (Indicação de funcionário) */}
      <mesh castShadow position={[0, 1.4, 0.45]}>
        <boxGeometry args={[0.1, 0.8, 0.05]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      
      {/* Braço Direito */}
      <group ref={armRef} position={[0.5, 1.5, 0]}>
        <mesh castShadow position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>
    </group>
  );
};

export default function CenaArtigo312() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentIdx(prev => (prev + 1 >= TIMELINE.length ? 0 : prev + 1));
    }, TIMELINE[currentIdx].duration);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="relative w-full max-w-full h-[65vh] min-h-[500px] sm:rounded-xl border-y sm:border border-border/50 shadow-2xl overflow-hidden bg-[#e2e8f0]">
        
        {/* Filtro de Câmera de Segurança */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/tv-noise.png')] mix-blend-overlay"></div>
        <div className="absolute top-4 left-4 z-20 text-red-500 font-mono text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          REC - CAM 01
        </div>

        <Canvas shadows dpr={[1, 2]} gl={{ powerPreference: "high-performance", antialias: true }}>
          <PerspectiveCamera makeDefault position={[0, 3, 10]} fov={60} />
          <CameraController step={currentIdx} />
          <Scenery />
          <Funcionario step={currentIdx} />
          <BemPublico step={currentIdx} />
        </Canvas>

        {/* UI Overlay */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-30">
          <div className="bg-black/90 text-white p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 font-mono">
            <p className="text-[15px] sm:text-lg text-center leading-relaxed font-sans tracking-tight">
              {TIMELINE[currentIdx].text}
            </p>
          </div>
          <div className="flex justify-center gap-2 mt-4 opacity-70 drop-shadow-md">
            {TIMELINE.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]' : 'w-2 bg-white/30'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
