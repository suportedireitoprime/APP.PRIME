import { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Scale, Gavel, BookOpen } from 'lucide-react';
import laurel from '@/assets/landing-tribunal/laurel-leaf.webp';

const SVGS = [Scale, Gavel, BookOpen];

const FallingMotifs = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [svgs, setSvgs] = useState<any[]>([]);

  useEffect(() => {
    // Generate leaves (folhas caindo)
    const newLeaves = Array.from({ length: 12 }).map((_, i) => ({
      id: `leaf-${i}`,
      left: Math.random() * 100,
      duration: 10 + Math.random() * 15, // 10s a 25s
      delay: Math.random() * 10,
      size: 16 + Math.random() * 24, // 16px a 40px
      rotationInitial: Math.random() * 360,
      rotationFinal: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
    }));
    setLeaves(newLeaves);

    // Generate SVGs (Balança, Martelo, Livro flutuando/caindo)
    const newSvgs = Array.from({ length: 6 }).map((_, i) => ({
      id: `svg-${i}`,
      Icon: SVGS[i % SVGS.length],
      left: 10 + Math.random() * 80,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 12,
      size: 32 + Math.random() * 32,
      rotationInitial: Math.random() * 60 - 30,
      rotationFinal: Math.random() * 60 - 30 + (Math.random() > 0.5 ? 360 : -360),
    }));
    setSvgs(newSvgs);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      {/* Folhas caindo */}
      {leaves.map((m) => (
        <motion.img
          key={m.id}
          src={laurel}
          alt=""
          aria-hidden="true"
          initial={{ y: -60, opacity: 0, rotate: m.rotationInitial }}
          animate={{ 
            y: [null, 200, 500, 800], 
            opacity: [0, 0.4, 0.4, 0], 
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

      {/* Ícones jurídicos flutuando/caindo levemente transparentes */}
      {svgs.map((m) => {
        const { Icon } = m;
        return (
          <motion.div
            key={m.id}
            initial={{ y: -80, opacity: 0, rotate: m.rotationInitial }}
            animate={{ 
              y: [null, 250, 550, 900], 
              opacity: [0, 0.15, 0.15, 0], 
              rotate: m.rotationFinal 
            }}
            transition={{
              duration: m.duration,
              delay: m.delay,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute text-white/40"
            style={{ 
              left: `${m.left}%`, 
              width: m.size, 
              height: m.size 
            }}
          >
            <Icon className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" strokeWidth={1.2} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default memo(FallingMotifs);
