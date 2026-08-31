import CircularGallery from '@/components/ui/CircularGallery';
import { useNavigate } from 'react-router-dom';
import { useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, PlayCircle, Pill, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { directImg } from '@/lib/cdnImg';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';


export default function PilulasHome() {
  const navigate = useNavigate();
  const galleryRef = useRef<any>(null);
  const [searchCode, setSearchCode] = useState('');

  const handleSelectClassicos = () => {
    haptic.selection();
    navigate('/pilulas/classicos');
  };

  const fastPillsItems = useMemo(() => [
    { image: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg'), text: 'CP', fullName: 'Código Penal' },
    { image: '/pilulas/cf_portrait.jpg', text: 'CF88', fullName: 'Constituição Federal' },
    { image: '/pilulas/cc_portrait.png', text: 'CC', fullName: 'Código Civil' },
    { image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop', text: 'CPP', fullName: 'Cód. Proc. Penal' },
    { image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop', text: 'CLT', fullName: 'Leis Trabalhistas' },
  ], []);

  const handleItemClick = useCallback((item: any) => {
    haptic.selection();
    if (item.text === 'CP') navigate('/pilulas/cp');
    if (item.text === 'CF88') navigate('/pilulas/cf');
    if (item.text === 'CC') navigate('/pilulas/cc');
    if (item.text === 'CPP') navigate('/pilulas/cpp');
    if (item.text === 'CLT') navigate('/pilulas/clt');
  }, [navigate]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toUpperCase();
    setSearchCode(term);
    
    // Auto-scroll when match is found
    if (term.length >= 2) {
      const index = fastPillsItems.findIndex(item => item.text.startsWith(term));
      if (index !== -1 && galleryRef.current) {
        galleryRef.current.scrollToIndex(index);
      }
    }
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
        {/* Divider with Text */}
        <div className="flex items-center w-full mb-6">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="mx-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Pílulas Rápidas</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        {/* Pílulas de Códigos */}
        <div className="space-y-4">
          <div className="flex items-start justify-between px-1 mb-4 gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">Pílulas de Códigos</h2>
              <p className="text-[13px] text-zinc-400 truncate">
                Áudios curtos e diretos sobre os artigos mais cobrados e essenciais da lei seca.
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-24 flex-shrink-0 mt-1">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-3 w-3 text-zinc-400" />
              </div>
              <input
                type="text"
                value={searchCode}
                onChange={handleSearch}
                placeholder="Ex: CC"
                maxLength={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-7 pr-2 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all uppercase"
              />
            </div>
          </div>

          <div style={{ height: '350px', position: 'relative' }} className="-mx-4">
            
          </div>
        </div>

        {/* Divider with Text for Bottom Section */}
        <div className="flex items-center w-full mt-10 mb-6">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="mx-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Pílulas de Análise</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <div>
          <h2 className="text-[22px] font-black text-white uppercase tracking-widest">Escolha um Tema</h2>
          <p className="mt-1 text-[14px] text-zinc-400 truncate">
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

      </div>
      </div>
    </div>
  );
}
