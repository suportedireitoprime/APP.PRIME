import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { DECKS_PILULAS } from './mockData';

export default function PilulasHome() {
  const navigate = useNavigate();

  const handleSelectDeck = (id: string) => {
    haptic.selection();
    navigate(`/pilulas/deck/${id}`);
  };

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20">
      <PageHeader
        title="Pílulas Jurídicas"
        onBack={() => navigate('/')}
        rightAction={<div className="w-8" />}
      />

      <div className="px-4 pt-6 space-y-6">
        <div>
          <h2 className="text-[22px] font-black text-white tracking-tight">Escolha um Tema</h2>
          <p className="mt-1 text-[14px] text-zinc-400">
            Aprenda conceitos jurídicos de forma rápida e visual, deslizando os cards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DECKS_PILULAS.map((deck, idx) => (
            <motion.button
              key={deck.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleSelectDeck(deck.id)}
              className="group relative flex flex-col items-start text-left overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/80 active:scale-[0.98] transition-all h-[220px]"
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={deck.imagem}
                  alt={deck.titulo}
                  className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col justify-end h-full p-5 w-full">
                <span className="inline-block px-2.5 py-1 mb-3 rounded-full bg-[#36AF85]/20 text-[#36AF85] text-[11px] font-black uppercase tracking-widest border border-[#36AF85]/30 self-start">
                  {deck.quantidade} Pílulas
                </span>
                <h3 className="text-[20px] font-black text-white leading-tight drop-shadow-md">
                  {deck.titulo}
                </h3>
                <p className="mt-2 text-[13px] text-zinc-300 line-clamp-2 drop-shadow">
                  {deck.descricao}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
