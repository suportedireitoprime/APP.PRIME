import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { BookMarked } from 'lucide-react';

export default function PilulasHome() {
  const navigate = useNavigate();

  const handleSelectClassicos = () => {
    haptic.selection();
    navigate('/pilulas/classicos');
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
            Aprenda conceitos jurídicos de forma rápida ouvindo a essência das obras.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handleSelectClassicos}
            className="group relative flex flex-col items-start text-left overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/80 active:scale-[0.98] transition-all h-[220px]"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-800 to-zinc-900">
               {/* Abstract geometric shapes or icon for background */}
               <div className="absolute right-[-20%] bottom-[-20%] text-zinc-800 opacity-30 rotate-12">
                 <BookMarked size={200} strokeWidth={1} />
               </div>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full p-5 w-full">
              <span className="inline-block px-2.5 py-1 mb-3 rounded-full bg-[#36AF85]/20 text-[#36AF85] text-[11px] font-black uppercase tracking-widest border border-[#36AF85]/30 self-start">
                Clássicos
              </span>
              <h3 className="text-[20px] font-black text-white leading-tight drop-shadow-md">
                Clássicos do Direito
              </h3>
              <p className="mt-2 text-[13px] text-zinc-300 line-clamp-2 drop-shadow">
                As obras fundamentais do pensamento jurídico mundial.
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
