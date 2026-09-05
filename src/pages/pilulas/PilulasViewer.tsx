import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { PilulaFlipCard } from './components/PilulaFlipCard';
import { PilulasFinished } from './components/PilulasFinished';
import '@/pilulas.css';

interface Card {
  id: string;
  titulo: string;
  subtitulo: string;
  imagem: string;
  texto_detalhado: string;
  ordem: number;
}

export default function PilulasViewer() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data: pilulasData, isLoading: loading } = useQuery<Card[]>({
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
          return cards as Card[];
        }
      }
      return [];
    },
    staleTime: 1000 * 60 * 60, // 1h
  });
  
  const pilulas = pilulasData || [];
  const isFinished = index >= pilulas.length && pilulas.length > 0;

  // Reset flipped state when current card changes
  useEffect(() => {
    setFlipped(false);
  }, [index]);

  const handleAdvance = useCallback(async (direction: 'right' | 'left') => {
    if (direction === 'right') {
      haptic.success?.();
    } else {
      haptic.selection?.();
    }
    setIndex((i) => i + 1);
  }, []);

  const handleFlip = useCallback(() => {
    haptic.selection();
    setFlipped((f) => !f);
  }, []);

  // Atalhos de teclado (WCAG 2.2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleAdvance('right');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (index > 0) setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, handleAdvance, handleFlip, index]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#36AF85]" />
      </div>
    );
  }

  if (!pilulas.length) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-white flex-col gap-4 p-6 text-center">
        <p className="text-zinc-400">Deck de pílulas não encontrado ou vazio.</p>
        <button 
          onClick={() => navigate('/pilulas')} 
          className="min-h-[48px] min-w-[48px] px-6 py-2.5 rounded-xl bg-white/10 text-[#36AF85] font-bold active:scale-95 transition-transform"
        >
          Voltar
        </button>
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
          <PilulasFinished onRestart={() => setIndex(0)} />
        ) : (
          <PilulaFlipCard
            pilulas={pilulas}
            index={index}
            flipped={flipped}
            onFlip={handleFlip}
            onAdvance={handleAdvance}
          />
        )}
      </div>
    </div>
  );
}
