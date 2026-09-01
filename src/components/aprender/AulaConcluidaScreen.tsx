import { motion } from 'framer-motion';
import { Trophy, Zap, RotateCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface AulaConcluidaScreenProps {
  aula: { titulo: string };
  total: number;
  perguntas: any[];
  acertos: number;
  proximaAula: { id: string; titulo: string } | null;
  onRefazer: () => void;
}

export function AulaConcluidaScreen({
  aula, total, perguntas, acertos, proximaAula, onRefazer
}: AulaConcluidaScreenProps) {
  const navigate = useNavigate();
  const pct = perguntas.length ? Math.round((acertos / perguntas.length) * 100) : 100;
  const xpGanho = (total * 15) + (acertos * 25) + 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-xl shadow-amber-500/25 ring-4 ring-amber-400/30"
        >
          <Trophy className="h-14 w-14 text-slate-950 drop-shadow-md" />
        </motion.div>
        
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-extrabold text-amber-500 mb-3 shadow-sm">
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500 animate-bounce" />
          <span>+{xpGanho} XP GANHOS!</span>
        </div>

        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">Aula concluída!</h1>
        <p className="mt-2 text-base text-muted-foreground">{aula.titulo}</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Etapas</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-foreground">{total}</p>
          </div>
          {perguntas.length > 0 && (
            <>
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Acertos</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-emerald-500">{acertos}/{perguntas.length}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm col-span-2 sm:col-span-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Aproveitamento</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-amber-500">{pct}%</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={onRefazer}
              className="flex h-14 items-center justify-center rounded-xl border border-border/80 bg-card px-5 text-sm font-bold text-foreground hover:bg-accent active:scale-95 transition-transform"
            >
              <RotateCw className="mr-2 inline h-4 w-4" /> Refazer Aula
            </button>
            <button
              onClick={() => {
                if (!proximaAula) return;
                navigate(`/aprender/aula/${proximaAula.id}`);
              }}
              disabled={!proximaAula}
              className="flex h-14 items-center justify-center rounded-xl bg-primary px-5 text-sm font-extrabold text-white shadow-lg hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 transition-transform"
            >
              Próxima aula <ArrowRight className="ml-2 inline h-4 w-4 text-white" strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border/60" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border/60" />
          </div>
          <button
            onClick={() => navigate('/aprender')}
            className="flex h-14 w-full items-center justify-center rounded-xl border border-border/80 bg-card px-5 text-sm font-bold text-foreground hover:bg-accent active:scale-95 transition-transform"
          >
            Voltar para trilhas de estudo
          </button>
        </div>
      </div>
    </div>
  );
}
