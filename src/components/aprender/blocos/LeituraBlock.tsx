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
    <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-3 px-1 sm:px-2">
      {titulo && (
        <header className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-primary mb-2 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            Leitura Essencial
          </span>
          <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug">
            {titulo}
          </h2>
        </header>
      )}

      <div className="prose prose-base sm:prose-lg md:prose-xl max-w-none prose-invert prose-headings:font-sans prose-p:text-[16px] sm:prose-p:text-[17px] md:prose-p:text-[18px] prose-p:leading-[1.75] sm:prose-p:leading-[1.85] prose-p:text-neutral-200 prose-p:mb-5 prose-li:text-[16px] sm:prose-li:text-[17px] md:prose-li:text-[18px] prose-li:leading-[1.75] prose-li:text-neutral-200 prose-strong:text-white prose-strong:font-bold">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <div className="mt-8 mb-4 pt-3 border-t border-white/[0.08]">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                  <span className="w-1.5 h-5 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                  <span>{children}</span>
                </h2>
              </div>
            ),
            h3: ({ children }) => (
              <h3 className="mt-6 mb-3 text-lg sm:text-xl font-bold tracking-tight text-amber-300/90 flex items-center gap-2">
                <span className="w-1 h-3.5 rounded-full bg-amber-400/80 inline-block shrink-0" />
                <span>{children}</span>
              </h3>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary bg-primary/[0.06] border-y border-r border-white/[0.04] text-neutral-100 py-3.5 px-5 rounded-r-2xl my-6 not-italic font-medium shadow-sm backdrop-blur-sm">
                {children}
              </blockquote>
            ),
          }}
        >
          {normalizarMarkdown(String(conteudo ?? texto ?? ''))}
        </ReactMarkdown>
      </div>

      {camadas.length > 0 && (
        <motion.div
          className="mt-10 sm:mt-12 flex flex-col gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {camadas.map(({ chave, rotulo, Icon, texto }) => {
            const isAlert = chave === 'pegadinha';
            const isExemplo = chave === 'exemplo';

            const cardTheme = isAlert
              ? 'bg-rose-500/[0.08] border-rose-500/25 text-rose-300'
              : isExemplo
              ? 'bg-amber-500/[0.08] border-amber-500/25 text-amber-300'
              : 'bg-primary/[0.08] border-primary/25 text-primary';

            return (
              <motion.div
                key={chave}
                variants={itemVariants}
                className={`rounded-2xl border p-4 sm:p-6 backdrop-blur-sm shadow-lg ${cardTheme}`}
              >
                <div className="mb-2.5 flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] sm:text-[12px]">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" strokeWidth={2} />
                  <span>{rotulo}</span>
                </div>
                <div className="text-[15px] sm:text-[16px] md:text-[17px] leading-relaxed text-neutral-100 font-normal">
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
