import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'];

export function Confetti() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Gerar 80 partículas para uma explosão rica, mas leve
    const pieces = Array.from({ length: 80 }).map((_, i) => {
      const angle = (Math.random() * Math.PI) + Math.PI; // Explode apenas para cima (semicírculo superior)
      const velocity = 20 + Math.random() * 30;
      
      return {
        id: i,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 6, // 6px a 14px
        initialRotation: Math.random() * 360,
        xDistance: Math.cos(angle) * velocity * 15,
        yPeak: Math.sin(angle) * velocity * 15, // Ponto mais alto
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 0.2
      };
    });
    setParticles(pieces);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden flex items-center justify-center">
      {particles.map((p) => {
        return (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: p.initialRotation }}
            animate={{
              x: [0, p.xDistance, p.xDistance + (Math.random() * 100 - 50)],
              // Sobe até o yPeak (que é negativo pois angle é entre PI e 2PI) e depois despenca pela janela
              y: [0, p.yPeak, window.innerHeight], 
              scale: [0, 1.2, 1],
              rotate: [p.initialRotation, p.initialRotation + 360, p.initialRotation + 1080],
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
              times: [0, 0.4, 1] // A explosão dura 40% do tempo, os 60% restantes é queda livre
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size * (Math.random() > 0.5 ? 1 : 1.5),
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.4 ? '50%' : '3px',
              boxShadow: '0 0 8px rgba(0,0,0,0.3)'
            }}
          />
        );
      })}
    </div>
  );
}
