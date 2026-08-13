import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- Sub-componentes 3D Animados via useFrame ---

const Robber = ({ step }: { step: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const targetX = step === 0 ? -2 : step === 1 ? -1.5 : 8;
    const targetRotY = step === 2 ? Math.PI / 8 : 0;
    
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 4, delta);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 4, delta);
    
    if (step === 2) {
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.5;
    } else {
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 4, delta);
    }

    if (rightArmRef.current) {
      const targetArmX = step >= 1 ? -Math.PI / 2 : 0;
      rightArmRef.current.rotation.x = THREE.MathUtils.damp(rightArmRef.current.rotation.x, targetArmX, 6, delta);
    }

    if (leftArmRef.current) {
      if (step === 2) {
        leftArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.8;
      } else {
        leftArmRef.current.rotation.x = THREE.MathUtils.damp(leftArmRef.current.rotation.x, 0, 6, delta);
      }
    }
  });

  return (
    <group ref={groupRef} position={[-8, 0, 0]}>
      {/* Corpo */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      
      {/* Cabeça (Touca) */}
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      
      {/* Olhos (Fresta) */}
      <mesh position={[0, 2.5, 0.45]}>
        <boxGeometry args={[0.6, 0.15, 0.1]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* Braço Direito (Arma) */}
      <group ref={rightArmRef} position={[0.5, 1.5, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {step >= 1 && (
          <mesh position={[0, -0.9, 0.2]}>
            <boxGeometry args={[0.15, 0.15, 0.4]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        )}
      </group>

      {/* Braço Esquerdo */}
      <group ref={leftArmRef} position={[-0.5, 1.5, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {step >= 1 && (
          <mesh position={[0, -0.9, 0]}>
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
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 5, delta);

    if (armsRef.current) {
      const targetArmZ = step >= 1 ? Math.PI : 0;
      armsRef.current.rotation.z = THREE.MathUtils.damp(armsRef.current.rotation.z, targetArmZ, 5, delta);
    }
  });

  return (
    <group ref={groupRef} position={[2, 0, 0]}>
      {/* Corpo */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      
      {/* Cabeça */}
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      {/* Braços */}
      <group ref={armsRef} position={[0, 1.5, 0]}>
        <mesh position={[0.5, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
        <mesh position={[-0.5, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Bolsa da vítima (Apenas no step 0) */}
      {step === 0 && (
        <mesh position={[-0.6, 1.0, 0.4]}>
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
    barsRef.current.position.y = THREE.MathUtils.damp(barsRef.current.position.y, targetY, 3, delta);
  });

  return (
    <group ref={barsRef} position={[0, 8, 3]}>
      {[...Array(7)].map((_, i) => (
        <mesh key={i} position={[-3 + i * 1, 2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
          <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[8, 0.1, 0.1]} />
        <meshStandardMaterial color="#71717a" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[8, 0.1, 0.1]} />
        <meshStandardMaterial color="#71717a" metalness={0.8} />
      </mesh>
    </group>
  );
};

// --- Exported 3D Scene (lazy-loaded by AnimacaoExemplo) ---

const AnimacaoExemplo3DScene = ({ step }: { step: number }) => {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 3, 10]} fov={40} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      {/* Removed <Environment preset="city" /> – it loaded an HDR via
          pmndrs CDN and crashed with 'Cannot read properties of undefined
          (reading "S")' when the fetch failed or the shader compiler
          barfed.  Plain ambient + directional light is enough for this POC. */}

      {/* ContactShadows removed to prevent WebGL crashes on some devices */}
      
      <PrisonBars step={step} />

      <Robber step={step} />
      <Victim step={step} />
    </Canvas>
  );
};

export default AnimacaoExemplo3DScene;
