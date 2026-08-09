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
  const pct = dash && dash.total_cards ? Math.round((dash.compreendidos / dash.total_cards) * 100) : 0;
  const paraHoje = Number(dash?.a_revisar ?? 0) || Number(dash?.hoje ?? 0);
  
  const handleDesafioClick = (id: number) => {
    haptic.selection();
    navigate(`/flashcards/desafios?id=${id}`);
  };

  return (
    <div className="w-full relative">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pr-4 pb-2 -mr-4">
        {/* CARD 1: Revisão (O painel original) */}
        <section
          className="snap-center shrink-0 w-[90%] md:w-[600px] relative overflow-hidden rounded-3xl p-5 sm:p-7 text-primary-foreground shadow-xl border border-white/10 ml-4"
          style={{
            background:
              'linear-gradient(155deg, hsl(var(--primary) / 0.96) 0%, hsl(348 72% 34%) 62%, hsl(348 70% 24%) 100%)',
          }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur-md">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground/90 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
              <Users className="h-3.5 w-3.5 text-amber-300" />
              1.420 estudantes praticando hoje
            </span>
          </div>

          <div className="mt-4">
            <h1 className="font-display text-[24px] sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
              {paraHoje > 0 ? (
                <>
                  {paraHoje.toLocaleString('pt-BR')}
                  <span className="ml-2.5 text-base sm:text-lg font-bold text-primary-foreground/80">
                    {paraHoje === 1 ? 'card agendado' : 'cards agendados'}
                  </span>
                </>
              ) : (
                'Revisão 100% em dia!'
              )}
            </h1>

            <div className="mt-4 flex items-center gap-3 max-w-md">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary-foreground/25">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-black tabular-nums text-primary-foreground/90">
                {pct}% dominado
              </span>
            </div>

            {(dash?.streak ?? 0) > 0 && (
              <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-primary-foreground/85">
                <Flame className="h-4 w-4 text-amber-300 fill-amber-300" /> {dash?.streak} dias seguidos
              </p>
            )}
          </div>
        </section>

        {/* CARDS DE DESAFIOS */}
        {mockDesafios.map((desafio) => (
          <section
            key={desafio.id}
            onClick={() => handleDesafioClick(desafio.id)}
            className="snap-center shrink-0 w-[75%] md:w-[400px] relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-card border border-border shadow-md active:scale-95 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase font-black tracking-widest text-primary">
                  <desafio.icon className="h-3.5 w-3.5" />
                  {desafio.titulo}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-black text-foreground leading-tight">{desafio.descricao}</h2>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-bold text-muted-foreground">Progresso</span>
                <span className="text-xs font-black text-foreground">{desafio.feito}/{desafio.meta}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(desafio.feito / desafio.meta) * 100}%` }}
                />
              </div>
            </div>
          </section>
        ))}

        {/* CARD VER TODOS */}
        <section
          onClick={() => { haptic.selection(); onVerTodos(); }}
          className="snap-center shrink-0 w-[40%] md:w-[200px] relative overflow-hidden rounded-3xl bg-muted/30 border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Ver todos</span>
        </section>
      </div>
    </div>
  );
}
