import { BookmarkCheck, Flag } from 'lucide-react';
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
    <motion.article
      className="max-w-[70ch] mx-auto py-3 px-1 sm:px-2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
        <BookmarkCheck className="h-3.5 w-3.5" /> Recapitulando
      </span>

      <h3 className="mb-4 font-sans text-xl sm:text-2xl font-bold leading-tight text-white">
        {titulo || 'O que fica desta aula'}
      </h3>

      <ol className="space-y-3">
        {pontos.map((p, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 backdrop-blur-sm shadow-sm hover:border-white/20 transition-colors"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-[12px] font-black text-black tabular-nums shadow-[0_0_10px_hsl(var(--primary)/0.5)]">
              {i + 1}
            </span>
            <span className="text-[15px] sm:text-[16px] leading-relaxed text-neutral-200">{p}</span>
          </motion.li>
        ))}
      </ol>

      {regra_de_ouro && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: pontos.length * 0.08 + 0.1, duration: 0.4 }}
          className="mt-6 rounded-2xl border-l-4 border-primary bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-t border-r border-b border-primary/25 p-4 sm:p-5 backdrop-blur-sm shadow-lg"
        >
          <p className="mb-1.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-primary">
            <Flag className="h-3.5 w-3.5" /> Regra de Ouro
          </p>
          <p className="font-sans text-[16px] sm:text-[17px] font-semibold leading-relaxed text-white">{regra_de_ouro}</p>
        </motion.div>
      )}
    </motion.article>
  );
}
