import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, RotateCw, ArrowRight, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';

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

  // Autoplay com contagem regressiva de 8 segundos para a próxima aula
  const [countdown, setCountdown] = useState<number | null>(proximaAula ? 8 : null);

  useEffect(() => {
    haptic.notification('success');
  }, []);

  useEffect(() => {
    if (countdown === null || countdown <= 0 || !proximaAula) {
      if (countdown === 0 && proximaAula) {
        navigate(`/aprender/aula/${proximaAula.id}`);
      }
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, proximaAula, navigate]);

  // Partículas comemorativas
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: (i % 6) * 16 - 40 + Math.random() * 20,
    y: Math.random() * -120 - 40,
    r: Math.random() * 360,
    color: ['#F59E0B', '#10B981', '#38BDF8', '#EC4899', '#A855F7'][i % 5],
    size: Math.random() * 8 + 6,
  }));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-10">
      {/* Partículas de Confetti Flutuantes (Item 16) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center items-start pt-16">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: -20, x: p.x, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, 450 + p.y],
              x: [p.x, p.x + (p.id % 2 === 0 ? 30 : -30)],
              rotate: [0, p.r],
            }}
            transition={{
              duration: 3 + (p.id % 3) * 0.5,
              repeat: Infinity,
              delay: (p.id % 8) * 0.25,
              ease: 'easeOut',
            }}
            className="absolute rounded-sm"
            style={{
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-2xl px-4 text-center relative z-10 w-full">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-2xl shadow-amber-500/30 ring-4 ring-amber-400/40"
        >
          <Trophy className="h-14 w-14 text-slate-950 drop-shadow-md" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-extrabold text-amber-400 mb-3 shadow-sm"
        >
          <Zap className="h-4 w-4 fill-amber-400 text-amber-400 animate-bounce" />
          <span>+{xpGanho} XP GANHOS!</span>
        </motion.div>

        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">Aula concluída!</h1>
        <p className="mt-2 text-base text-muted-foreground">{aula.titulo}</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Etapas</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-foreground">{total}</p>
          </div>
          {perguntas.length > 0 && (
            <>
              <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Acertos</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-emerald-500">{acertos}/{perguntas.length}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm col-span-2 sm:col-span-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Aproveitamento</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-amber-500">{pct}%</p>
              </div>
            </>
          )}
        </div>

        {/* Notificação de Próxima Aula com Autoplay */}
        {proximaAula && countdown !== null && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl border border-primary/40 bg-primary/[0.08] backdrop-blur-md flex items-center justify-between gap-4 text-left shadow-lg"
          >
            <div className="min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Próxima aula em {countdown}s
              </span>
              <p className="font-bold text-white text-sm truncate mt-0.5">{proximaAula.titulo}</p>
            </div>
            <button
              type="button"
              onClick={() => setCountdown(null)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

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
