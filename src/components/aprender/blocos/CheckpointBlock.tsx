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
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">Checkpoint</p>

      <div className="overflow-hidden rounded-2xl border border-primary/30 bg-primary/5">
        <div className="border-b border-primary/20 px-4 py-3">
          <h3 className="font-display text-[20px] font-bold leading-tight text-foreground">
            {titulo || 'Até aqui você já sabe'}
          </h3>
        </div>

        <ul className="space-y-3 px-4 py-4">
          {aprendeu.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2.2} />
              <span className="text-[16px] leading-relaxed text-foreground/90">{item}</span>
            </motion.li>
          ))}
        </ul>

        {pergunta_reflexiva && (
          <div className="mx-4 mb-4 rounded-xl border border-border bg-card p-4">
            <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <HelpCircle className="h-4 w-4" /> Pare e responda para você
            </p>
            <p className="font-display text-[17px] leading-snug text-foreground">{pergunta_reflexiva}</p>
          </div>
        )}

        {proximo && (
          <div className="flex items-start gap-2 border-t border-primary/20 px-4 py-3">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[15px] leading-relaxed text-muted-foreground">{proximo}</p>
          </div>
        )}
      </div>
    </article>
  );
}
