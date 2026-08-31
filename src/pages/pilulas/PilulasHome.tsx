import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Clock, PlayCircle, Pill, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { directImg } from '@/lib/cdnImg';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';

export default function PilulasHome() {
  const navigate = useNavigate();

  const handleSelectClassicos = () => {
    haptic.selection();
    navigate('/pilulas/classicos');
  };

  const handleSelectCP = () => {
    haptic.selection();
    navigate('/pilulas/cp');
  };

  const handleSelectCF = () => {
    haptic.selection();
    navigate('/pilulas/cf');
  };

  const handleSelectCC = () => {
    haptic.selection();
    navigate('/pilulas/cc');
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
          <h2 className="text-[22px] font-black text-white uppercase tracking-normal">Escolha um Tema</h2>
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
            <div className="absolute inset-0 z-0">
               <img src="/pilulas/classicos.jpg" alt="Clássicos do Direito" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
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

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleSelectCP}
            className="group relative flex flex-col items-start text-left overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/80 active:scale-[0.98] transition-all h-[220px]"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
               <img src={directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg')} alt="Código Penal" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" loading="lazy" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full p-5 w-full">
              <span className="inline-block px-2.5 py-1 mb-3 rounded-full bg-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest border border-red-500/30 self-start">
                Lei Seca
              </span>
              <h3 className="text-[20px] font-black text-white leading-tight drop-shadow-md">
                Código Penal
              </h3>
              <p className="mt-2 text-[13px] text-zinc-300 line-clamp-2 drop-shadow">
                Entenda os artigos essenciais do CP.
              </p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleSelectCF}
            className="group relative flex flex-col items-start text-left overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/80 active:scale-[0.98] transition-all h-[220px]"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
               <img src="https://images.unsplash.com/photo-1505664159851-14ce0f5af3ce?q=80&w=600&auto=format&fit=crop" alt="Constituição Federal" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full p-5 w-full">
              <span className="inline-block px-2.5 py-1 mb-3 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-black uppercase tracking-widest border border-blue-500/30 self-start">
                Magna Carta
              </span>
              <h3 className="text-[20px] font-black text-white leading-tight drop-shadow-md">
                Constituição Federal
              </h3>
              <p className="mt-2 text-[13px] text-zinc-300 line-clamp-2 drop-shadow">
                Aprenda a base do nosso Estado de Direito.
              </p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleSelectCC}
            className="group relative flex flex-col items-start text-left overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/80 active:scale-[0.98] transition-all h-[220px]"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
               <img src="/pilulas/cc_square.png" alt="Código Civil" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full p-5 w-full">
              <span className="inline-block px-2.5 py-1 mb-3 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-widest border border-amber-500/30 self-start">
                Lei Seca
              </span>
              <h3 className="text-[20px] font-black text-white leading-tight drop-shadow-md">
                Código Civil
              </h3>
              <p className="mt-2 text-[13px] text-zinc-300 line-clamp-2 drop-shadow">
                Entenda os direitos e deveres civis.
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
