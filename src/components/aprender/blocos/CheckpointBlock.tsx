import { CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type CheckpointPayload = {
  titulo?: string;
  aprendeu?: string[];
  pergunta_reflexiva?: string;
  proximo?: string;
};

/**
 * Parada de consolidação ao final de cada ato da aula.
 * Serve para o aluno respirar, conferir o que fixou e saber o que vem a seguir.
 */
export function CheckpointBlock({ payload }: { payload: CheckpointPayload }) {
  const { titulo, aprendeu = [], pergunta_reflexiva, proximo } = payload || {};

  return (
    <article className="max-w-[68ch]">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-primary">Checkpoint</p>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg">
        <div className="border-b border-border/70 bg-muted/30 px-5 py-4">
          <h3 className="font-display text-[22px] font-bold leading-tight text-foreground">
            {titulo || 'Até aqui você já sabe'}
          </h3>
        </div>

        <ul className="space-y-3.5 px-5 py-5">
          {aprendeu.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 items-start"
            >
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2.5} />
              <span className="text-[17px] leading-relaxed font-medium text-foreground">{item}</span>
            </motion.li>
          ))}
        </ul>

        {pergunta_reflexiva && (
          <div className="mx-5 mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm">
            <p className="mb-1.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <HelpCircle className="h-4 w-4" /> Pare e responda para você
            </p>
            <p className="font-display text-[18px] font-bold leading-snug text-foreground">{pergunta_reflexiva}</p>
          </div>
        )}

        {proximo && (
          <div className="flex items-start gap-2.5 border-t border-border/70 bg-muted/20 px-5 py-4">
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[15px] leading-relaxed font-medium text-muted-foreground">{proximo}</p>
          </div>
        )}
      </div>
    </article>
  );
}
