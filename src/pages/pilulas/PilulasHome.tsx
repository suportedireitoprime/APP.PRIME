import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Clock, PlayCircle, Pill, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { directImg } from '@/lib/cdnImg';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import CircularGallery from '@/components/ui/CircularGallery';

export default function PilulasHome() {
  const navigate = useNavigate();

  const handleSelectClassicos = () => {
    haptic.selection();
    navigate('/pilulas/classicos');
  };

  const fastPillsItems = [
    { image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg'), text: 'Código Penal' },
    { image: '/pilulas/cf_portrait.jpg', text: 'Const. Federal' },
    { image: '/pilulas/cc_portrait.png', text: 'Código Civil' },
    { image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop', text: 'CPP' },
    { image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop', text: 'CLT' },
  ];

  const handleItemClick = (item: any) => {
    haptic.selection();
    if (item.text === 'Código Penal') navigate('/pilulas/cp');
    if (item.text === 'Const. Federal') navigate('/pilulas/cf');
    if (item.text === 'Código Civil') navigate('/pilulas/cc');
    if (item.text === 'CPP') navigate('/pilulas/cpp');
    if (item.text === 'CLT') navigate('/pilulas/clt');
  };

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="Pílulas Jurídicas"
          onBack={() => navigate('/')}
          rightAction={<div className="w-8" />}
        />

      <div className="px-4 pt-6 space-y-6">
        <div>
          <h2 className="text-[22px] font-black text-white uppercase tracking-normal">Escolha um Tema</h2>
          <p className="mt-1 text-[14px] text-zinc-400">
            Aprenda conceitos jurídicos complexos em minutos. Ouça pílulas de conhecimento extraídas da essência das principais obras e legislações.
          </p>
        </div>

        {/* Clássicos do Direito */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleSelectClassicos}
          className="w-full group relative flex flex-col items-start text-left overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/80 active:scale-[0.98] transition-all h-[220px]"
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img src="/pilulas/classicos_cover.jpg" alt="Clássicos do Direito" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-end h-full p-5 w-full">
            <div className="flex justify-between items-end w-full">
              <div>
                <h3 className="text-[20px] font-black text-white leading-tight drop-shadow-md">
                  Clássicos do Direito
                </h3>
                <p className="mt-2 text-[13px] text-zinc-300 line-clamp-2 drop-shadow">
                  As obras fundamentais do pensamento jurídico mundial.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mb-1 border border-white/20">
                <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </motion.button>

        {/* Pílulas Rápidas */}
        <div className="mt-8 space-y-4">
          <div className="px-1 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 bg-white/20 rounded-full" />
              <h2 className="text-lg font-bold text-white leading-none">Pílulas Rápidas</h2>
            </div>
            <p className="text-[13px] text-zinc-400 pl-3 leading-relaxed">Áudios curtos e diretos sobre os artigos mais cobrados e essenciais da lei seca.</p>
          </div>

          <div style={{ height: '350px', position: 'relative' }} className="-mx-4">
            <CircularGallery
              items={fastPillsItems}
              bend={1.5}
              textColor="#ffffff"
              borderRadius={0.05}
              scrollEase={0.02}
              onItemClick={handleItemClick}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
