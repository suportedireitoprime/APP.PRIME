import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Flame, Target, Trophy, Users, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

// Tipagem baseada no Dash do Flashcards.tsx
export type Dash = {
  total_cards: number;
  estudados: number;
  compreendidos: number;
  a_revisar: number;
  hoje: number;
  streak: number;
};

// Dados mockados de desafios pendentes para demonstração
const mockDesafios = [
  { id: 1, titulo: 'Desafio 1', descricao: 'Estude 15 cards de Constitucional', meta: 15, feito: 5, icon: Target },
  { id: 2, titulo: 'Desafio 2', descricao: 'Domine a Lei Seca (20 cards)', meta: 20, feito: 0, icon: Trophy },
];

export function DesafiosCarousel({ dash, onVerTodos }: { dash: Dash | null, onVerTodos: () => void }) {
  const navigate = useNavigate();
  
  const handleDesafioClick = (id: number) => {
    haptic.selection();
    navigate(`/flashcards/desafios?id=${id}`);
  };

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
          Desafios
        </p>
      </div>
      
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pr-4 pb-2 -mr-4">
        {mockDesafios.map((desafio) => (
          <section
            key={desafio.id}
            onClick={() => handleDesafioClick(desafio.id)}
            className="snap-center shrink-0 w-[42%] max-w-[160px] relative overflow-hidden rounded-2xl p-4 bg-card border border-border/80 shadow-sm active:scale-95 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="mb-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b9811a' }}>
                <desafio.icon className="h-4 w-4" style={{ color: '#10b981' }} />
              </div>
              <h2 className="text-xs font-bold text-foreground leading-tight mb-3 line-clamp-3">{desafio.descricao}</h2>
            </div>
            
            <div className="mt-auto">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground">Progresso</span>
                <span className="text-[10px] font-black text-foreground">{desafio.feito}/{desafio.meta}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${(desafio.feito / desafio.meta) * 100}%`, backgroundColor: '#10b981' }}
                >
                  <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer opacity-80" />
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* CARD VER TODOS */}
        <section
          onClick={() => { haptic.selection(); onVerTodos(); }}
          className="snap-center shrink-0 w-[30%] max-w-[110px] relative overflow-hidden rounded-2xl bg-muted/30 border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors active:scale-95"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: '#10b9811a' }}>
            <Trophy className="w-5 h-5" style={{ color: '#10b981' }} />
          </div>
          <span className="text-xs font-bold text-foreground">Ver todos</span>
        </section>
      </div>
    </div>
  );
}
