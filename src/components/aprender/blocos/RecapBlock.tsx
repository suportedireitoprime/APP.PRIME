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

      <h3 className="mb-6 font-sans text-xl sm:text-2xl font-bold leading-tight text-white">
        {titulo || 'O que fica desta aula'}
      </h3>

      <div className="relative rounded-3xl border border-white/10 bg-[#18181b] shadow-2xl overflow-hidden">
        {/* Header do Método Cornell */}
        <div className="bg-white/[0.03] px-4 py-3 border-b border-white/10 flex justify-between items-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Método Cornell</span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">Resumo Estruturado</span>
        </div>

        {/* Corpo: Duas colunas (Tópicos/Palavras-chave e Notas) */}
        <div className="flex flex-col sm:flex-row">
          {/* Coluna Esquerda: Palavras-chave / Cues */}
          <div className="w-full sm:w-[35%] lg:w-[30%] sm:border-r border-dashed border-white/10 bg-white/[0.01] p-4 sm:p-5 flex flex-col gap-5">
            {pontos.map((p, i) => {
              const partes = p.split(':');
              const cue = partes.length > 1 ? partes[0].trim().replace(/\*\*/g, '') : `Ponto ${i + 1}`;
              return (
                <div key={`cue-${i}`} className="flex items-start gap-2 h-full">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-neutral-300 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-primary leading-tight pt-0.5">{cue}</span>
                </div>
              );
            })}
          </div>

          {/* Coluna Direita: Notas Principais */}
          <div className="w-full sm:w-[65%] lg:w-[70%] p-4 sm:p-5 flex flex-col gap-5 bg-[#18181b] shadow-inner">
            {pontos.map((p, i) => {
              const partes = p.split(':');
              const note = partes.length > 1 ? partes.slice(1).join(':').trim() : p;
              return (
                <div key={`note-${i}`} className="text-[14px] sm:text-[15px] leading-relaxed text-neutral-200">
                  {note}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé: Resumo (Summary) / Regra de Ouro */}
        {regra_de_ouro && (
          <div className="border-t-2 border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-5 sm:p-6">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-primary">
              <Flag className="h-3.5 w-3.5" /> Sumário Final (Regra de Ouro)
            </p>
            <p className="font-sans text-[15px] sm:text-[16px] font-semibold leading-relaxed text-white/90">
              {regra_de_ouro}
            </p>
          </div>
        )}
      </div>
    </motion.article>
  );
}
