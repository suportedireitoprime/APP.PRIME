import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import { AnimatePresence } from 'framer-motion';

// --- Sub-componentes 3D ---

const Robber = ({ step }: { step: number }) => {
  return (
    <motion.group
      initial={{ x: -8 }}
      animate={{
        x: step === 0 ? -2 : step === 1 ? -1.5 : 8,
        rotateY: step === 2 ? Math.PI / 8 : 0,
        y: step === 2 ? [0, 0.5, 0] : 0, // Pulinho de corrida
      }}
      transition={{
        x: { type: 'spring', stiffness: 50, damping: 15 },
        y: { repeat: step === 2 ? Infinity : 0, duration: 0.3 }
      }}
    >
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
      <motion.group 
        position={[0.5, 1.5, 0]}
        animate={{
          rotateX: step >= 1 ? -Math.PI / 2 : 0 // Levanta o braço
        }}
      >
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        
        {/* A arma só aparece a partir do step 1 */}
        {step >= 1 && (
          <mesh position={[0, -0.9, 0.2]}>
            <boxGeometry args={[0.15, 0.15, 0.4]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        )}
      </motion.group>

      {/* Braço Esquerdo */}
      <motion.group 
        position={[-0.5, 1.5, 0]}
        animate={{
          rotateX: step === 2 ? [Math.PI/4, -Math.PI/4, Math.PI/4] : 0 // Balança o braço ao correr
        }}
        transition={{ repeat: step === 2 ? Infinity : 0, duration: 0.6 }}
      >
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>

        {/* Bolsa roubada na mão esquerda (a partir do step 1) */}
        {step >= 1 && (
          <mesh position={[0, -0.9, 0]}>
            <boxGeometry args={[0.5, 0.6, 0.3]} />
            <meshStandardMaterial color="#b45309" />
          </mesh>
        )}
      </motion.group>
    </motion.group>
  );
};

const Victim = ({ step }: { step: number }) => {
  return (
    <motion.group
      initial={{ x: 2 }}
      animate={{
        x: step >= 1 ? 2.5 : 2, // Recua um pouco de medo
      }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
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

      {/* Braços (Levantam no step >= 1) */}
      {[0.5, -0.5].map((x, i) => (
        <motion.group 
          key={i}
          position={[x, 1.5, 0]}
          animate={{
            rotateZ: step >= 1 ? (x > 0 ? Math.PI : -Math.PI) : 0, // Mãos pra cima
            rotateX: step >= 1 ? 0 : 0
          }}
        >
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color="#eab308" />
          </mesh>
        </motion.group>
      ))}

      {/* Bolsa da vítima (Apenas no step 0) */}
      {step === 0 && (
        <mesh position={[-0.6, 1.0, 0.4]}>
          <boxGeometry args={[0.5, 0.6, 0.3]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      )}
    </motion.group>
  );
};

// --- Componente Principal ---

const AnimacaoExemplo = () => {
  const [step, setStep] = useState(0);

  // Simula o andamento da animação (tempo da explicação)
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < 2 ? prev + 1 : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const stepsText = [
    "Subtrair coisa móvel alheia, para si ou para outrem...",
    "mediante grave ameaça ou violência a pessoa...",
    "Pena - reclusão, de quatro a dez anos, e multa."
  ];

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Container 3D */}
      <div className="relative w-full h-[300px] overflow-hidden rounded-md bg-zinc-900 border border-border/50">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 3, 10]} fov={40} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          <Environment preset="city" />

          {/* Sombras de Contato Realistas */}
          <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2} far={4} />

          {/* Grades da prisão (Apenas Step 2) */}
          <group position={[0, 0, 3]}>
             {[...Array(7)].map((_, i) => (
                <motion.mesh 
                  key={i} 
                  position={[-3 + i * 1, 2, 0]}
                  initial={{ y: 8 }}
                  animate={{ y: step === 2 ? 2 : 8 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.1 * i }}
                >
                  <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
                  <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.2} />
                </motion.mesh>
             ))}
             {/* Barra horizontal superior e inferior */}
             <motion.mesh position={[0, 4, 0]} initial={{ y: 8 }} animate={{ y: step === 2 ? 4 : 8 }} transition={{ delay: 0.8 }}>
               <boxGeometry args={[8, 0.1, 0.1]} />
               <meshStandardMaterial color="#71717a" metalness={0.8} />
             </motion.mesh>
             <motion.mesh position={[0, 0.5, 0]} initial={{ y: 8 }} animate={{ y: step === 2 ? 0.5 : 8 }} transition={{ delay: 0.8 }}>
               <boxGeometry args={[8, 0.1, 0.1]} />
               <meshStandardMaterial color="#71717a" metalness={0.8} />
             </motion.mesh>
          </group>

          {/* Personagens */}
          <Robber step={step} />
          <Victim step={step} />
        </Canvas>
        
        {/* Efeito de sirene no step 2 */}
        {step === 2 && (
          <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay">
            <div className="w-full h-full animate-siren bg-red-500/20" style={{ animation: "siren 1s infinite alternate" }} />
            <style>{`
              @keyframes siren {
                0% { opacity: 0; background-color: rgba(239,68,68,0.2); }
                50% { opacity: 1; background-color: rgba(239,68,68,0.2); }
                51% { opacity: 0; background-color: rgba(59,130,246,0.2); }
                100% { opacity: 1; background-color: rgba(59,130,246,0.2); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Texto Explicativo (Sincronizado) */}
      <div className="mt-6 text-center h-20 w-full px-2">
        <p className="text-lg font-body font-medium text-foreground transition-opacity duration-300">
          {stepsText[step]}
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-primary' : 'w-2 bg-muted'}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimacaoExemplo;
