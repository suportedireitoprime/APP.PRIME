import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw, Loader2 } from 'lucide-react';
import '@/pilulas.css';

const SWIPE_THRESHOLD = 100;

interface Card {
  id: string;
  titulo: string;
  subtitulo: string;
  imagem: string;
  texto_detalhado: string;
  ordem: number;
}

export default function PilulasViewer() {
  const { deckId } = useParams(); // actually slug
  const navigate = useNavigate();
  
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data: pilulasData, isLoading: loading } = useQuery({
    queryKey: ['pilulas', 'deck', deckId],
    queryFn: async () => {
      const { data: deck, error: deckErr } = await supabase
        .from('pilulas_decks')
        .select('id')
        .eq('slug', deckId)
        .single();
        
      if (deck && !deckErr) {
        const { data: cards, error: cardsErr } = await supabase
          .from('pilulas_cards')
          .select('*')
          .eq('deck_id', deck.id)
          .order('ordem', { ascending: true });
        
        if (cards && !cardsErr) {
          return cards;
        }
      }
      return [];
    },
    staleTime: 1000 * 60 * 60, // 1h
  });
  
  const pilulas = pilulasData || [];

  const isFinished = index >= pilulas.length && pilulas.length > 0;

  // Swipe logic for the front card
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const controls = useAnimation();

  // Reset flipped state when current card changes
  useEffect(() => {
    setFlipped(false);
    x.set(0);
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [index, x, controls]);

  const handleDragEnd = async (e: any, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      // Swipe Right
      haptic.success?.();
      await controls.start({ x: window.innerWidth, opacity: 0, transition: { duration: 0.3 } });
      setIndex((i) => i + 1);
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      // Swipe Left
      haptic.selection?.();
      await controls.start({ x: -window.innerWidth, opacity: 0, transition: { duration: 0.3 } });
      setIndex((i) => i + 1);
    } else {
      // Return to center
      controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const handleFlip = () => {
    haptic.selection();
    setFlipped((f) => !f);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#36AF85]" />
      </div>
    );
  }

  if (!pilulas.length) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-white flex-col gap-4">
        <p className="text-zinc-400">Deck não encontrado ou vazio.</p>
        <button onClick={() => navigate('/pilulas')} className="min-h-[48px] min-w-[48px] px-4 text-[#36AF85] font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-zinc-950 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#36AF85]/20 via-zinc-950 to-zinc-950" />
      </div>

      <div className="relative z-10 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-2 px-4 flex justify-between items-center bg-transparent">
        <PageHeader title="" onBack={() => navigate('/pilulas')} rightAction={<div className="w-8" />} className="bg-transparent border-none min-h-[48px]" />
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6 mb-10 overflow-hidden">
        {isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="h-24 w-24 rounded-full bg-[#36AF85]/20 flex items-center justify-center">
              <span className="text-4xl">🎉</span>
            </div>
            <div>
              <h2 className="text-[28px] font-black text-white">Você concluiu!</h2>
              <p className="text-zinc-400 mt-2">Todas as pílulas deste tema foram vistas.</p>
            </div>
            <button
              onClick={() => {
                haptic.selection();
                setIndex(0);
              }}
              className="mt-4 px-8 h-14 bg-[#36AF85] hover:bg-[#2C9570] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#36AF85]/20"
            >
              <RotateCcw className="w-5 h-5" />
              Ver Novamente
            </button>
          </motion.div>
        ) : (
          <div className="relative w-full max-w-[360px] aspect-[3/4] preserve-3d">
            <AnimatePresence>
              {pilulas.map((pilula, i) => {
                if (i < index) return null; // Já deslizadas
                if (i > index + 2) return null; // Renderiza apenas as 3 próximas para performance

                const isFront = i === index;
                const offset = i - index; // 0 para frente, 1 para a próxima, 2 para a terceira

                return (
                  <motion.div
                    key={pilula.id}
                    drag={isFront ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.9}
                    onDragEnd={isFront ? handleDragEnd : undefined}
                    style={{
                      zIndex: pilulas.length - i,
                      x: isFront ? x : 0,
                      rotate: isFront ? rotate : 0,
                      willChange: 'transform, opacity',
                      z: 0,
                    }}
                    animate={isFront ? controls : {
                      scale: 1 - offset * 0.05,
                      y: offset * 20,
                      opacity: 1 - offset * 0.3,
                    }}
                    initial={isFront ? { scale: 0.95, opacity: 0 } : false}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={isFront ? handleFlip : undefined}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing preserve-3d select-none"
                  >
                    <motion.div
                      animate={{ rotateY: (isFront && flipped) ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="w-full h-full relative preserve-3d shadow-2xl rounded-[2rem] select-none"
                      style={{ willChange: 'transform', z: 0 }}
                    >
                      {/* Frente */}
                      <div className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800">
                        <img
                          src={pilula.imagem}
                          alt={pilula.titulo}
                          loading={i === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                        
                        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center text-center">
                          <span className="text-[12px] font-bold text-[#36AF85] tracking-widest uppercase mb-3 drop-shadow-md">
                            Pílula {i + 1} de {pilulas.length}
                          </span>
                          <h2 className="text-[32px] font-black text-white leading-tight text-center px-6">
                            {pilula.titulo}
                          </h2>
                          {pilula.subtitulo && (
                            <p className="mt-3 text-lg font-medium text-white/90 text-center px-8 drop-shadow-md">
                              {pilula.subtitulo}
                            </p>
                          )}
                          {isFront && (
                            <p className="mt-8 text-[15px] font-medium text-white/80 drop-shadow flex items-center gap-2">
                              <RotateCcw className="w-4 h-4" />
                              Toque para girar
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Verso */}
                      <div
                        className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800"
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        <div className="absolute inset-0">
                          <img
                            src={pilula.imagem}
                            alt={pilula.titulo}
                            loading={i === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            className="w-full h-full object-cover blur-xl scale-110 opacity-40"
                          />
                          <div className="absolute inset-0 bg-black/60" />
                        </div>

                        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center">
                          <h3 className="text-[24px] font-black text-white mb-6 leading-tight">
                            {pilula.titulo}
                          </h3>
                          <p className="text-[17px] leading-relaxed text-zinc-200">
                            {pilula.texto_detalhado}
                          </p>
                          
                          {isFront && (
                            <div className="absolute bottom-8 text-[13px] text-zinc-400 flex items-center gap-2">
                              Deslize para avançar &rarr;
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              }).reverse() /* Reverte para garantir a ordem visual correta no DOM em relação ao z-index quando animar */}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
