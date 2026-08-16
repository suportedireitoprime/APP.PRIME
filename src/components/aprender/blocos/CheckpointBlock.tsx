import { CheckCircle2, ArrowRight, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

type CheckpointPayload = {
  titulo?: string;
  aprendeu?: string[];
  pergunta_reflexiva?: string;
  proximo?: string;
};

/**
 * Parada de consolidação ao final de cada ato da aula.
 * Redesenhado para visual premium (Apple HIG / Design Editorial).
 */
export function CheckpointBlock({ payload }: { payload: CheckpointPayload }) {
  const { titulo, aprendeu = [], pergunta_reflexiva, proximo } = payload || {};

  return (
    <article className="max-w-[70ch] mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40">
          Revisão de Fixação
        </p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#0a0a0a] shadow-2xl before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent before:pointer-events-none">
        
        <div className="px-8 pt-10 pb-8 text-center border-b border-white/5 relative z-10">
          <h3 className="font-sans text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
            {titulo || 'Até aqui você já sabe'}
          </h3>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-primary/80" />
        </div>

        <ul className="space-y-6 px-8 py-10 relative z-10">
          {aprendeu.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              className="flex gap-4 items-start group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 group-hover:text-white transition-colors mt-0.5">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="text-[17px] md:text-lg leading-relaxed text-neutral-300 group-hover:text-neutral-100 transition-colors">
                {item}
              </span>
            </motion.li>
          ))}
        </ul>

        {pergunta_reflexiva && (
          <div className="relative mx-6 md:mx-8 mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.02] p-6 shadow-inner z-10">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Lightbulb className="w-24 h-24" />
            </div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Lightbulb className="h-3.5 w-3.5" /> Pare e reflita
            </p>
            <p className="font-sans text-lg md:text-[20px] font-semibold leading-snug text-white/90 max-w-[90%]">
              {pergunta_reflexiva}
            </p>
          </div>
        )}

        {proximo && (
          <div className="flex items-center gap-4 bg-white/[0.02] px-8 py-5 border-t border-white/5 relative z-10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <ArrowRight className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-medium text-neutral-400">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">A seguir</span>
              {proximo}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
