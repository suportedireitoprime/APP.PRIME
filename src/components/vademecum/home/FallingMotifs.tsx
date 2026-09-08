import { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Scale, Gavel, BookOpen } from 'lucide-react';
import laurel from '@/assets/landing-tribunal/laurel-leaf.webp';

const SVGS = [Scale, Gavel, BookOpen];

export const FallingLeaves = memo(() => {
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    const newLeaves = Array.from({ length: 12 }).map((_, i) => ({
      id: `leaf-${i}`,
      left: Math.random() * 100,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 10,
      size: 16 + Math.random() * 24,
      rotationInitial: Math.random() * 360,
      rotationFinal: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
    }));
    setLeaves(newLeaves);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      {leaves.map((m) => (
        <motion.img
          key={m.id}
          src={laurel}
          alt=""
          aria-hidden="true"
          initial={{ y: -60, opacity: 0, rotate: m.rotationInitial }}
          animate={{ 
            y: [null, 200, 500, 800], 
            opacity: [0, 1, 1, 0], 
            rotate: m.rotationFinal 
          }}
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute drop-shadow-md"
          style={{ 
            left: `${m.left}%`, 
            width: m.size, 
            height: m.size,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))'
          }}
        />
      ))}
    </div>
  );
});

export const FloatingSVGs = memo(() => {
  const [svgs, setSvgs] = useState<any[]>([]);

  useEffect(() => {
    const newSvgs = Array.from({ length: 12 }).map((_, i) => ({
      id: `svg-${i}`,
      Icon: SVGS[i % SVGS.length],
      left: Math.random() * 90,
      top: Math.random() * 90,
      duration: 10 + Math.random() * 15, // Animação mais suave (vai e volta)
      delay: Math.random() * 5,
      size: 40 + Math.random() * 40,
      rotationInitial: Math.random() * 60 - 30,
    }));
    setSvgs(newSvgs);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      {svgs.map((m) => {
        const { Icon } = m;
        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.4, // Mais visível
              x: [0, 20, -15, 0],
              y: [0, -20, 15, 0],
              rotate: [m.rotationInitial, m.rotationInitial + 20, m.rotationInitial - 20, m.rotationInitial] 
            }}
            transition={{
              duration: m.duration,
              delay: m.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute text-black"
            style={{ 
              left: `${m.left}%`, 
              top: `${m.top}%`,
              width: m.size, 
              height: m.size 
            }}
          >
            <Icon className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" strokeWidth={1.5} />
          </motion.div>
        );
      })}
    </div>
  );
});
