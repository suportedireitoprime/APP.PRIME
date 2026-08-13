import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const damp = (current: number, target: number, lambda: number, delta: number) => {
  return THREE.MathUtils.damp ? THREE.MathUtils.damp(current, target, lambda, delta) : current + (target - current) * (lambda * delta);
};

const CameraController = ({ step }: { step: number }) => {
  const vec = new THREE.Vector3();
  useFrame((state, delta) => {
    // Configura os alvos para posição da câmera baseado no step
    const targetX = step === 0 ? 0 : step === 1 ? 1.5 : -1.5;
    const targetY = step === 0 ? 4 : step === 1 ? 2.5 : 2.5;
    const targetZ = step === 0 ? 12 : step === 1 ? 7 : 7.5;
    
    // Suaviza a posição
    state.camera.position.x = damp(state.camera.position.x, targetX, 2.5, delta);
    state.camera.position.y = damp(state.camera.position.y, targetY, 2.5, delta);
    state.camera.position.z = damp(state.camera.position.z, targetZ, 2.5, delta);
    
    // Configura o lookAt suavizado indiretamente focando num ponto fixo de interesse
    const lookAtX = step === 0 ? 0 : step === 1 ? 1 : -1;
    vec.set(lookAtX, 1.5, 0);
    state.camera.lookAt(vec);
  });
  return null;
};

const Scenery = () => {
  return (
    <group>
      {/* Chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
      
      {/* Parede de fundo (Backdrop) */}
      <mesh position={[0, 4, -8]} receiveShadow>
        <planeGeometry args={[50, 20]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
      
      {/* Luzes dinâmicas do cenário para dar um clima */}
      <pointLight position={[0, 5, 2]} intensity={0.8} color="#60a5fa" />
      <pointLight position={[-4, 5, 2]} intensity={0.5} color="#ef4444" />
      <pointLight position={[4, 5, 2]} intensity={0.5} color="#eab308" />
    </group>
  );
};

// --- Sub-componentes 3D Animados via useFrame ---

const Robber = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const targetX = step === 0 ? -2 : step === 1 ? -1.5 : 8;
    const targetRotY = step === 2 ? Math.PI / 8 : 0;
    
    groupRef.current.position.x = damp(groupRef.current.position.x, targetX, 4, delta);
    groupRef.current.rotation.y = damp(groupRef.current.rotation.y, targetRotY, 4, delta);
    
    if (step === 2) {
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.5;
    } else {
      groupRef.current.position.y = damp(groupRef.current.position.y, 0, 4, delta);
    }

    if (rightArmRef.current) {
      const targetArmX = step >= 1 ? -Math.PI / 2 : 0;
      rightArmRef.current.rotation.x = damp(rightArmRef.current.rotation.x, targetArmX, 6, delta);
    }

    if (leftArmRef.current) {
      if (step === 2) {
        leftArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.8;
      } else {
        leftArmRef.current.rotation.x = damp(leftArmRef.current.rotation.x, 0, 6, delta);
      }
    }
  });

  return (
    <group ref={groupRef} position={[-8, 0, 0]}>
      {/* Corpo */}
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      
      {/* Cabeça (Touca) */}
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      
      {/* Olhos (Fresta) */}
      <mesh castShadow position={[0, 2.5, 0.45]}>
        <boxGeometry args={[0.6, 0.15, 0.1]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* Braço Direito (Arma) */}
      <group ref={rightArmRef} position={[0.5, 1.5, 0]}>
        <mesh castShadow position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {step >= 1 && (
          <mesh castShadow position={[0, -0.9, 0.2]}>
            <boxGeometry args={[0.15, 0.15, 0.4]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        )}
      </group>

      {/* Braço Esquerdo */}
      <group ref={leftArmRef} position={[-0.5, 1.5, 0]}>
        <mesh castShadow position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {step >= 1 && (
          <mesh castShadow position={[0, -0.9, 0]}>
            <boxGeometry args={[0.5, 0.6, 0.3]} />
            <meshStandardMaterial color="#b45309" />
          </mesh>
        )}
      </group>
    </group>
  );
};

const Victim = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const armsRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    const targetX = step >= 1 ? 2.5 : 2;
    groupRef.current.position.x = damp(groupRef.current.position.x, targetX, 5, delta);

    if (armsRef.current) {
      const targetArmZ = step >= 1 ? Math.PI : 0;
      armsRef.current.rotation.z = damp(armsRef.current.rotation.z, targetArmZ, 5, delta);
    }
  });

  return (
    <group ref={groupRef} position={[2, 0, 0]}>
      {/* Corpo */}
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      
      {/* Cabeça */}
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      {/* Braços */}
      <group ref={armsRef} position={[0, 1.5, 0]}>
        <mesh castShadow position={[0.5, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
        <mesh castShadow position={[-0.5, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Bolsa da vítima (Apenas no step 0) */}
      {step === 0 && (
        <mesh castShadow position={[-0.6, 1.0, 0.4]}>
          <boxGeometry args={[0.5, 0.6, 0.3]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      )}
    </group>
  );
};

const PrisonBars = ({ step }: { step: number }) => {
  const barsRef = useRef<THREE.Group>(null);
  
  useFrame((_state, delta) => {
    if (!barsRef.current) return;
    const targetY = step === 2 ? 0 : 8;
    barsRef.current.position.y = damp(barsRef.current.position.y, targetY, 3, delta);
  });

  return (
    <group ref={barsRef} position={[0, 8, 3]}>
      {[...Array(13)].map((_, i) => (
        <mesh key={i} position={[-3 + i * 0.5, 2, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
          <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[8, 0.1, 0.1]} />
        <meshStandardMaterial color="#71717a" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[8, 0.1, 0.1]} />
        <meshStandardMaterial color="#71717a" metalness={0.8} />
      </mesh>
    </group>
  );
};

// --- Exported 3D Scene (lazy-loaded by AnimacaoExemplo) ---

const AnimacaoExemplo3DScene = ({ step }: { step: number }) => {
  return (
    <Canvas 
      shadows 
      dpr={[1, 2]} 
      gl={{ powerPreference: "high-performance", antialias: true }}
    >
      <PerspectiveCamera makeDefault position={[0, 4, 12]} fov={45} />
      <CameraController step={step} />
      
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.5} 
        castShadow 
      />
      
      <Scenery />
      <PrisonBars step={step} />

      <Robber step={step} />
      <Victim step={step} />
    </Canvas>
  );
};

export default AnimacaoExemplo3DScene;
