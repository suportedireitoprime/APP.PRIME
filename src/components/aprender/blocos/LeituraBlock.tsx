import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, AlertTriangle, ChevronDown, BookOpen, Eye, EyeOff } from 'lucide-react';
import { normalizarMarkdown } from '@/lib/markdown';
import { haptic } from '@/lib/nativeHaptics';

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
 * Leitura sequencial com design premium editorial e suporte a glossário interativo e casos práticos investigativos.
 */
export function LeituraBlock({ payload }: { payload: LeituraPayload }) {
  const { titulo, conteudo, texto } = payload || {};
  const textoPrincipal = String(conteudo ?? texto ?? '');

  // Parser de termos de glossário (Item 5)
  const termosGlossario = useMemo(() => {
    const isGlossario = titulo?.toLowerCase().includes('glossário');
    if (!isGlossario && !textoPrincipal.includes('• ')) return [];
    const linhas = textoPrincipal.split('\n');
    const termos: { termo: string; definicao: string }[] = [];
    for (const l of linhas) {
      const m = l.match(/^[•\-*]\s*([^:]+):\s*(.+)$/);
      if (m) {
        termos.push({ termo: m[1].trim(), definicao: m[2].trim() });
      }
    }
    return termos;
  }, [titulo, textoPrincipal]);

  const [expandedTermos, setExpandedTermos] = useState<Record<string, boolean>>({});
  const toggleTermo = (t: string) => {
    haptic.selection();
    setExpandedTermos((prev) => ({ ...prev, [t]: !prev[t] }));
  };

  // Revelação deliberada para casos práticos (Item 6)
  const [solucaoRevelada, setSolucaoRevelada] = useState(false);

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
            {termosGlossario.length > 0 ? 'Vocabulário Especial' : 'Leitura Essencial'}
          </span>
          <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug">
            {titulo}
          </h2>
        </header>
      )}

      {/* Renderização Especial de Glossário em Chips Expansíveis (Item 5) */}
      {termosGlossario.length > 0 ? (
        <div className="space-y-3.5 mb-8">
          <p className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Toque no termo para explorar a definição jurídica:
          </p>
          <div className="grid gap-3">
            {termosGlossario.map(({ termo, definicao }) => {
              const isOpen = !!expandedTermos[termo];
              return (
                <div
                  key={termo}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-primary/50 bg-primary/[0.08] shadow-lg shadow-primary/10'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleTermo(termo)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer select-none"
                  >
                    <span className="font-bold text-white text-[16px] sm:text-[17px] tracking-wide flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      {termo}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-[15px] sm:text-[16px] leading-relaxed text-neutral-200 border-t border-white/[0.06]">
                          {definicao}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
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
            {normalizarMarkdown(textoPrincipal)}
          </ReactMarkdown>
        </div>
      )}

      {/* Camadas didáticas extras (Exemplo com Revelação Deliberada / Pegadinha) */}
      {camadas.length > 0 && (
        <motion.div
          className="mt-10 sm:mt-12 flex flex-col gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {camadas.map(({ chave, rotulo, Icon, texto: camadaTexto }) => {
            const isAlert = chave === 'pegadinha';
            const isExemplo = chave === 'exemplo';
            const isCasoPratico = isExemplo && (camadaTexto.includes('Solução Jurídica') || titulo?.toLowerCase().includes('caso prático'));

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
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] sm:text-[12px]">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" strokeWidth={2} />
                    <span>{isCasoPratico ? 'Resolução & Análise Prática' : rotulo}</span>
                  </div>
                  {isCasoPratico && (
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setSolucaoRevelada((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-white transition-colors"
                    >
                      {solucaoRevelada ? <><EyeOff className="w-3.5 h-3.5" /> Ocultar</> : <><Eye className="w-3.5 h-3.5" /> Revelar</>}
                    </button>
                  )}
                </div>

                {isCasoPratico && !solucaoRevelada ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.impact('medium');
                        setSolucaoRevelada(true);
                      }}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-primary/20 border border-primary/40 hover:bg-primary/30 active:scale-[0.99] transition-all text-white font-bold text-sm shadow-md"
                    >
                      <Eye className="w-4 h-4 text-primary" />
                      <span>Analisar Hipótese & Revelar Solução Jurídica</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[15px] sm:text-[16px] md:text-[17px] leading-relaxed text-neutral-100 font-normal">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {normalizarMarkdown(camadaTexto)}
                    </ReactMarkdown>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </article>
  );
}
