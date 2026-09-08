import { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Scale, Gavel, Book, Feather } from 'lucide-react';

const LotusIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Ícone customizado de Lótus elegante */}
    <path d="M12 2C8 6 4 10 4 14a8 8 0 0 0 16 0c0-4-4-8-8-12z" />
    <path d="M12 2c4 2.5 8 7 8 12 0 1.5-.5 3-1.5 4" />
    <path d="M12 2C8 4.5 4 9 4 14c0 1.5.5 3 1.5 4" />
    <path d="M7 16c1.5-1 3.5-1.5 5-1.5s3.5.5 5 1.5" />
    <path d="M12 14.5v3.5" />
  </svg>
);

const ICONS = [LotusIcon, LotusIcon, Scale, Gavel, Book, Feather]; // Mais peso para Lotus

const FallingMotifs = () => {
  const [motifs, setMotifs] = useState<{ id: number; Icon: any; left: number; duration: number; delay: number; size: number; rotation: number }[]>([]);

  useEffect(() => {
    const elements = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
      left: Math.random() * 100, // Posição horizontal aleatória (0 a 100%)
      duration: 12 + Math.random() * 20, // Tempo de queda longo e elegante (12 a 32s)
      delay: Math.random() * 15, // Atrasos variados
      size: 14 + Math.random() * 32, // Tamanhos variados (14px a 46px)
      rotation: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 180), // Rotação aleatória e suave
    }));
    setMotifs(elements);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      {motifs.map((m) => {
        const { Icon } = m;
        return (
          <motion.div
            key={m.id}
            initial={{ y: -60, opacity: 0, rotate: 0 }}
            animate={{ 
              y: [null, 200, 400, 600], 
              opacity: [0, 0.15, 0.15, 0], 
              rotate: m.rotation 
            }}
            transition={{
              duration: m.duration,
              delay: m.delay,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute text-white/30"
            style={{ 
              left: `${m.left}%`, 
              width: m.size, 
              height: m.size 
            }}
          >
            <Icon className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
          </motion.div>
        );
      })}
    </div>
  );
};

export default memo(FallingMotifs);
