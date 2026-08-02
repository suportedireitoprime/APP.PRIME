import { Sparkles, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

type RecapPayload = {
  titulo?: string;
  pontos?: string[];
  regra_de_ouro?: string;
};

/** Síntese final da aula — 5 frases-chave + a regra de ouro. */
export function RecapBlock({ payload }: { payload: RecapPayload }) {
  const { titulo, pontos = [], regra_de_ouro } = payload || {};

  return (
    <article className="max-w-[68ch]">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-4 w-4" /> Recapitulando
      </p>

      <h3 className="mb-4 font-display text-[24px] font-bold leading-tight text-foreground">
        {titulo || 'O que fica desta aula'}
      </h3>

      <ol className="space-y-3">
        {pontos.map((p, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex gap-3 rounded-xl border border-border bg-card p-3.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground tabular-nums">
              {i + 1}
            </span>
            <span className="text-[16px] leading-relaxed text-foreground/90">{p}</span>
          </motion.li>
        ))}
      </ol>

      {regra_de_ouro && (
        <div className="mt-5 rounded-2xl border-l-4 border-primary bg-primary/10 p-4">
          <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Flag className="h-4 w-4" /> Regra de ouro
          </p>
          <p className="font-display text-[18px] leading-snug text-foreground">{regra_de_ouro}</p>
        </div>
      )}
    </article>
  );
}
