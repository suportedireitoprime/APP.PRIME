import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, AlertTriangle } from 'lucide-react';
import { normalizarMarkdown } from '@/lib/markdown';

export type LeituraPayload = {
  titulo?: string;
  conteudo?: string;
  texto?: string;
  em_portugues_claro?: string;
  exemplo?: string;
  pegadinha?: string;
};

type Camada = {
  chave: 'em_portugues_claro' | 'exemplo' | 'pegadinha';
  rotulo: string;
  Icon: typeof MessageSquare;
  texto: string;
};

/**
 * Leitura sequencial com design premium editorial.
 */
export function LeituraBlock({ payload }: { payload: LeituraPayload }) {
  const { titulo, conteudo, texto } = payload || {};

  const camadas: Camada[] = ([
    { chave: 'em_portugues_claro', rotulo: 'Em português claro', Icon: MessageSquare, texto: payload?.em_portugues_claro || '' },
    { chave: 'exemplo', rotulo: 'Exemplo prático', Icon: Sparkles, texto: payload?.exemplo || '' },
    { chave: 'pegadinha', rotulo: 'Onde erram (Pegadinha)', Icon: AlertTriangle, texto: payload?.pegadinha || '' },
  ] as Camada[]).filter((c) => c.texto.trim().length > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-2">
      {titulo && (
        <h2 className="mb-8 font-sans text-2xl font-extrabold tracking-tight text-white md:text-3xl lg:text-4xl leading-snug">
          {titulo}
        </h2>
      )}

      <div className="prose prose-lg md:prose-xl max-w-none prose-invert prose-headings:font-sans prose-h2:text-[22px] md:prose-h2:text-[26px] prose-h3:text-[19px] md:prose-h3:text-[21px] prose-p:leading-[1.8] prose-p:text-neutral-300 md:prose-p:text-[19px] prose-li:leading-[1.8] prose-li:text-neutral-300 md:prose-li:text-[19px] prose-strong:text-white prose-blockquote:border-l-primary/50 prose-blockquote:text-neutral-400 prose-blockquote:bg-white/[0.02] prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {normalizarMarkdown(String(conteudo ?? texto ?? ''))}
        </ReactMarkdown>
      </div>

      {camadas.length > 0 && (
        <motion.div
          className="mt-12 flex flex-col gap-10"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {camadas.map(({ chave, rotulo, Icon, texto }) => {
            const isAlert = chave === 'pegadinha';
            return (
              <motion.div
                key={chave}
                variants={itemVariants}
                className="relative"
              >
                <div className="mb-3 flex items-center gap-2 font-bold uppercase tracking-[0.15em] text-[11px] md:text-[12px] text-primary">
                  <Icon className="h-[18px] w-[18px] md:h-5 md:w-5" strokeWidth={1.5} />
                  {rotulo}
                </div>
                <div className="pl-5 border-l-2 border-primary/40 prose prose-base md:prose-lg max-w-none prose-invert prose-p:my-0 prose-p:leading-relaxed prose-p:text-neutral-300 prose-strong:text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {normalizarMarkdown(texto)}
                  </ReactMarkdown>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </article>
  );
}
