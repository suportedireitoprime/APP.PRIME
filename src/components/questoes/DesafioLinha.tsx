import { motion } from 'framer-motion';
import { Check, Lock, Trophy, Flame } from 'lucide-react';
import type { DesafioStatus } from '@/hooks/useQuestoesExtras';
import { cn } from '@/lib/utils';

export const NIVEL_LABEL: Record<string, string> = {
  iniciante: 'Iniciante',
  constante: 'Constante',
  disciplinado: 'Disciplinado',
  implacavel: 'Implacável',
  lendario: 'Lendário',
};

/** Card de um desafio dentro da lista da trilha. */
const DesafioLinha = ({
  d,
  onPraticar,
  mostrarTrilha,
}: {
  d: DesafioStatus;
  onPraticar: () => void;
  mostrarTrilha?: boolean;
}) => {
  const concluido = d.status === 'concluido';
  const bloqueado = !d.desbloqueado;
  const faltam = Math.max(0, d.meta_diaria - d.respondidas_hoje);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4',
        bloqueado ? 'border-border bg-card/50' : 'border-border bg-card',
      )}
      style={!bloqueado ? { borderColor: `${d.cor}55` } : undefined}
    >
      <Trophy
        className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 opacity-[0.07]"
        style={{ color: d.cor }}
        strokeWidth={1}
      />

      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${d.cor}1f`, color: d.cor }}
        >
          {concluido ? <Check className="h-6 w-6" strokeWidth={2.6} />
            : bloqueado ? <Lock className="h-5 w-5" />
            : <Flame className="h-6 w-6" />}
        </span>
        <div className="min-w-0 flex-1">
          {mostrarTrilha && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: d.cor }}>
              {d.trilha_label}
            </p>
          )}
          <div className="flex items-center gap-2">
            <p className="truncate text-[16px] font-bold text-foreground">{d.titulo}</p>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${d.cor}22`, color: d.cor }}
            >
              {NIVEL_LABEL[d.nivel] ?? d.nivel}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            {d.subtitulo} · {d.dias} dias seguidos
          </p>

          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: d.dias }).map((_, i) => (
              <span
                key={i}
                className="h-2 flex-1 rounded-full"
                style={{ background: i < d.dias_concluidos ? d.cor : 'hsl(var(--muted))' }}
              />
            ))}
          </div>

          <p className="mt-2 text-[12px] text-muted-foreground">
            {concluido
              ? 'Concluído 🎉'
              : bloqueado
              ? 'Conclua o desafio anterior para liberar'
              : faltam > 0
              ? `Faltam ${faltam} questões hoje · dia ${Math.min(d.dias_concluidos + 1, d.dias)} de ${d.dias}`
              : `Meta de hoje batida! Dia ${d.dias_concluidos} de ${d.dias}`}
          </p>

          {!bloqueado && !concluido && (
            <button
              onClick={onPraticar}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-xl text-[14px] font-bold text-white transition-all active:scale-[0.99]"
              style={{ background: d.cor }}
            >
              Praticar agora
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DesafioLinha;
