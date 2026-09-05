import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { LeiCantada } from '@/lib/leisCantadasApi';
import { CAPA_PENAL } from './leisCantadasUtils';

interface LeisCantadasRankRowProps {
  f: LeiCantada;
  pos: number;
  valor: number;
  unidade: string;
  onClick: () => void;
}

export function LeisCantadasRankRow({ f, pos, valor, unidade, onClick }: LeisCantadasRankRowProps) {
  const destaque = pos <= 3;

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
      }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl text-left transition focus-visible:outline-none ${
        destaque ? 'p-3 bg-white/5 hover:bg-white/10' : 'p-2.5 hover:bg-white/5'
      }`}
    >
      <span
        className={`text-center font-black shrink-0 ${
          destaque ? 'w-7 text-2xl text-fuchsia-300' : 'w-6 text-lg text-muted-foreground'
        }`}
      >
        {pos}
      </span>
      <span className={`relative shrink-0 rounded-lg overflow-hidden ${destaque ? 'h-14 w-14' : 'h-11 w-11'}`}>
        <img src={CAPA_PENAL} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
          <Play className={destaque ? 'h-5 w-5' : 'h-4 w-4'} />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold truncate ${destaque ? 'text-[15px]' : 'text-sm'}`}>
          {f.titulo || `Art. ${f.numero_artigo}`}
        </p>
        <p className="text-xs text-muted-foreground truncate">{f.lei_nome}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {valor} {unidade}
      </span>
    </motion.button>
  );
}
