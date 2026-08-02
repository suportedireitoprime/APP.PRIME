import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, AlertTriangle, ChevronDown } from 'lucide-react';
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
 * Leitura em camadas: a explicação base fica sempre visível e as camadas de
 * apoio (tradução, exemplo, pegadinha) abrem sob demanda. Quem entendeu segue
 * rápido; quem travou aprofunda sem sair do bloco.
 */
export function LeituraBlock({ payload }: { payload: LeituraPayload }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const { titulo, conteudo, texto } = payload || {};

  const camadas: Camada[] = ([
    { chave: 'em_portugues_claro', rotulo: 'Em português claro', Icon: MessageSquare, texto: payload?.em_portugues_claro || '' },
    { chave: 'exemplo', rotulo: 'Ver exemplo', Icon: Sparkles, texto: payload?.exemplo || '' },
    { chave: 'pegadinha', rotulo: 'Onde erram', Icon: AlertTriangle, texto: payload?.pegadinha || '' },
  ] as Camada[]).filter((c) => c.texto.trim().length > 0);


  return (
    <article className="max-w-[68ch] lg:max-w-none">
      {titulo && (
        <h2 className="mb-4 font-display text-[24px] font-bold leading-tight text-foreground sm:text-[28px] lg:text-[32px]">

          {titulo}
        </h2>
      )}

      <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-h2:text-[22px] prose-h3:text-[19px] lg:prose-h2:text-[26px] lg:prose-h3:text-[21px] prose-p:leading-[1.65] prose-p:text-[18px] sm:prose-p:text-[19px] lg:prose-p:text-[19px] lg:prose-p:leading-[1.75] 2xl:prose-p:text-[20px] prose-li:leading-[1.6] prose-li:text-[18px] sm:prose-li:text-[19px] lg:prose-li:leading-[1.7] 2xl:prose-li:text-[20px] prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-foreground/90">

        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {normalizarMarkdown(String(conteudo ?? texto ?? ''))}
        </ReactMarkdown>
      </div>

      {camadas.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex flex-wrap gap-2">
            {camadas.map(({ chave, rotulo, Icon }) => {
              const ativo = aberta === chave;
              return (
                <button
                  key={chave}
                  type="button"
                  onClick={() => setAberta(ativo ? null : chave)}
                  aria-expanded={ativo}
                  className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors active:scale-[0.98] ${
                    ativo
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground/80 hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {rotulo}
                  <ChevronDown className={`h-4 w-4 transition-transform ${ativo ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </div>

          <AnimatePresence initial={false} mode="wait">
            {aberta && (
              <motion.div
                key={aberta}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div
                  className={`mt-1 rounded-2xl border-l-4 p-4 ${
                    aberta === 'pegadinha'
                      ? 'border-destructive bg-destructive/5'
                      : 'border-primary bg-primary/5'
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {camadas.find((c) => c.chave === aberta)?.rotulo}
                  </p>
                  <div className="prose prose-base max-w-none dark:prose-invert prose-p:my-1 prose-p:text-[16px] prose-p:leading-relaxed prose-strong:text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {normalizarMarkdown(camadas.find((c) => c.chave === aberta)?.texto ?? '')}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </article>
  );
}
