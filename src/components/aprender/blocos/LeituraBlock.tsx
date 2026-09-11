import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lightbulb, AlertTriangle, ChevronDown, BookOpen, Eye, EyeOff, Scale, GitFork, Gavel, FileText, Sparkles, Puzzle } from 'lucide-react';
import { normalizarMarkdown, limparTextoInstrucoes } from '@/lib/markdown';
import { haptic } from '@/lib/nativeHaptics';
import { LinhaDoTempoAnimada, isTimelineBlock } from './LinhaDoTempoAnimada';
import { ComparativoBlocos, isComparativeBlock } from './ComparativoBlocos';
import { FluxogramaAnimado, isFlowchartBlock } from './FluxogramaAnimado';

function extractTextFromChildren(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join('');
  if (node?.props?.children) return extractTextFromChildren(node.props.children);
  return '';
}

export type LeituraPayload = {
  titulo?: string;
  conteudo?: string;
  texto?: string;
  subtipo?: string;
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

  // Evita a duplicação do título e remove metadados [ATO ...], [Animação ...], etc.
  const textoLimpo = useMemo(() => {
    return limparTextoInstrucoes(textoPrincipal);
  }, [textoPrincipal]);

  // Parser de termos de glossário (Item 5)
  const termosGlossario = useMemo(() => {
    const isGlossario = titulo?.toLowerCase().includes('glossário') ||
      titulo?.toLowerCase().includes('dicionário') ||
      titulo?.toLowerCase().includes('vocabulário');
    
    if (!isGlossario) return [];
    
    const linhas = textoPrincipal.split('\n');
    const termos: { termo: string; definicao: string }[] = [];
    for (const l of linhas) {
      const m = l.match(/^[•\-*]\s*(?:\*\*)?([^*:\n]+)(?:\*\*)?:\s*(.+)$/);
      if (m && m[1].trim().length > 1 && !m[1].toLowerCase().includes('aqui estão')) {
        termos.push({ termo: m[1].trim(), definicao: m[2].trim() });
      }
    }
    return termos;
  }, [titulo, textoPrincipal]);

  // Identificação de Caso Prático para diferenciação visual de título e badge
  const isCasoPratico = useMemo(() => {
    const t = (titulo || '').toLowerCase();
    return (
      t.includes('caso prático') ||
      t.includes('caso pratico') ||
      t.includes('caso concreto') ||
      t.startsWith('caso ')
    );
  }, [titulo]);

  // Formatação do título: destaca "Caso Prático 1:" com a cor primária (vermelho/rose do tema e enredo)
  const tituloFormatado = useMemo(() => {
    if (!titulo) return null;
    const match = titulo.match(/^((?:Caso\s+Pr[áa]tico|Caso\s+Concreto|Caso)(?:\s+\d+)?(?:\s*[:\-])?)\s*(.*)$/i);
    if (match && match[1]) {
      return (
        <>
          <span className="text-primary font-black">{match[1]}</span>
          {match[2] ? ` ${match[2]}` : ''}
        </>
      );
    }
    return titulo;
  }, [titulo]);

  const [expandedTermos, setExpandedTermos] = useState<Record<string, boolean>>({});
  const toggleTermo = (t: string) => {
    haptic.selection();
    setExpandedTermos((prev) => ({ ...prev, [t]: !prev[t] }));
  };

  // Revelação deliberada para casos práticos (Item 6)
  const [solucaoRevelada, setSolucaoRevelada] = useState(false);

  const camadas: Camada[] = ([
    { chave: 'em_portugues_claro', rotulo: 'Em português claro', Icon: MessageSquare, texto: limparTextoInstrucoes(payload?.em_portugues_claro || '') },
    { chave: 'exemplo', rotulo: 'Exemplo prático', Icon: Lightbulb, texto: limparTextoInstrucoes(payload?.exemplo || '') },
    { chave: 'pegadinha', rotulo: 'Onde erram (Pegadinha)', Icon: AlertTriangle, texto: limparTextoInstrucoes(payload?.pegadinha || '') },
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

  // Identificação do subtipo de bloco
  const subtipo = payload?.subtipo;
  const isGrafoDecisao = subtipo === 'grafo_decisao' || (titulo || '').toLowerCase().includes('grafo de conexão') || (titulo || '').toLowerCase().includes('árvore de decisão');
  const isJurisprudencia = subtipo === 'jurisprudencia' || (titulo || '').toLowerCase().includes('jurisprudência') || (titulo || '').toLowerCase().includes('tribunais superiores');
  const isProcessual = subtipo === 'processual' || (titulo || '').toLowerCase().includes('procedimento') || (titulo || '').toLowerCase().includes('ação penal');
  const isIntro = subtipo === 'intro' || (titulo || '').toLowerCase().includes('abertura da trilha');

  return (
    <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-3 px-1 sm:px-2 pb-4">
      {titulo && (
        <header className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-primary mb-2.5 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 shadow-sm">
            {isGrafoDecisao ? (
              <>
                <GitFork className="w-3.5 h-3.5 text-primary shrink-0 rotate-180" />
                <span>Grafo de Decisão & Síntese</span>
              </>
            ) : isJurisprudencia ? (
              <>
                <Gavel className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Jurisprudência dos Tribunais</span>
              </>
            ) : isProcessual ? (
              <>
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Procedimento & Ação Penal</span>
              </>
            ) : isIntro ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Abertura da Trilha</span>
              </>
            ) : isCasoPratico ? (
              <>
                <Scale className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Caso Prático Real</span>
              </>
            ) : termosGlossario.length > 0 ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Vocabulário Especial</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Leitura Essencial</span>
              </>
            )}
          </span>
          <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug">
            {tituloFormatado}
          </h2>
        </header>
      )}

      {/* Se for um slide de Glossário/Dicionário com termos detectados (Item 5) */}
      {termosGlossario.length > 0 ? (
        <div className="space-y-4 my-6">
          <div className="flex items-center justify-between gap-2 px-1 mb-2.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Toque no termo para expandir a definição</span>
            </span>
            <span className="shrink-0 whitespace-nowrap inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold text-primary bg-primary/10 border border-primary/20">
              {termosGlossario.length} termos
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {termosGlossario.map(({ termo, definicao }) => {
              const isOpen = !!expandedTermos[termo];
              return (
                <div
                  key={termo}
                  className={`rounded-2xl border transition-all duration-200 backdrop-blur-sm overflow-hidden ${
                    isOpen
                      ? 'border-primary/40 bg-[#1d1d22] shadow-md shadow-primary/10'
                      : 'border-white/[0.08] bg-[#141417] hover:border-white/20 hover:bg-[#19191e]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleTermo(termo)}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left cursor-pointer select-none gap-3"
                    aria-expanded={isOpen}
                  >
                    <span className="font-sans font-bold text-[14px] sm:text-[15px] md:text-[16px] text-neutral-100 tracking-normal leading-snug">
                      {termo}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 transition-transform duration-300 shrink-0 ${
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
        <div className="prose prose-base sm:prose-lg md:prose-xl max-w-none prose-invert prose-headings:font-sans prose-p:text-[16px] sm:prose-p:text-[17px] md:prose-p:text-[18px] prose-p:leading-[1.75] sm:prose-p:leading-[1.85] prose-p:text-neutral-200 prose-p:mb-6 prose-li:text-[16px] sm:prose-li:text-[17px] md:prose-li:text-[18px] prose-li:leading-[1.75] prose-li:text-neutral-200 prose-strong:text-white prose-strong:font-bold">
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
              h4: ({ children }) => (
                <h4 className="mt-5 mb-2.5 text-base sm:text-lg font-bold tracking-tight text-primary flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
                  <span>{children}</span>
                </h4>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary bg-primary/[0.06] border-y border-r border-white/[0.04] text-neutral-100 py-3.5 px-5 rounded-r-2xl my-6 not-italic font-medium shadow-sm backdrop-blur-sm">
                  {children}
                </blockquote>
              ),
              pre: ({ children }) => {
                const rawText = extractTextFromChildren(children);
                if (isTimelineBlock(rawText)) {
                  return <LinhaDoTempoAnimada raw={rawText} />;
                }
                if (isComparativeBlock(rawText)) {
                  return <ComparativoBlocos raw={rawText} />;
                }
                if (isFlowchartBlock(rawText)) {
                  return <FluxogramaAnimado raw={rawText} />;
                }
                return (
                  <div className="my-5 overflow-x-auto rounded-2xl border border-white/10 bg-[#121214] p-4 sm:p-5 shadow-inner">
                    <pre className="font-mono text-xs sm:text-sm leading-relaxed text-emerald-300/95 whitespace-pre">
                      {children}
                    </pre>
                  </div>
                );
              },
              code: ({ children, className }) => {
                const isInline = !className;
                const txt = String(children);
                
                // Mapeamento especial para lacunas (ex: `[ LACUNA 1 ]`)
                if (isInline && txt.match(/^\[\s*LACUNA\s*\d+\s*\]$/i)) {
                   return (
                     <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg text-xs sm:text-sm font-bold font-display shadow-sm shadow-amber-500/10 mx-1 align-middle uppercase tracking-widest whitespace-nowrap">
                       <Puzzle className="w-3.5 h-3.5" />
                       {txt.replace(/[\[\]]/g, '').trim()}
                     </span>
                   );
                }
                
                // Mapeamento especial para opções de lacunas (ex: `[ despersonalizados ]`)
                if (isInline && txt.match(/^\[\s*[^\]]+\s*\]$/)) {
                   return (
                     <span className="inline-flex items-center px-3 py-1 bg-white/5 text-white/90 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-colors rounded-md text-sm font-medium mx-1 align-middle whitespace-nowrap shadow-sm">
                       {txt.replace(/[\[\]]/g, '').trim()}
                     </span>
                   );
                }
                
                return isInline ? (
                  <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs sm:text-sm font-mono font-semibold text-primary">
                    {children}
                  </code>
                ) : (
                  <code>{children}</code>
                );
              },
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#141417] shadow-md">
                  <table className="w-full text-left text-sm text-neutral-200 border-collapse">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border-b border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-white/5 px-3 py-2.5 text-neutral-200 leading-relaxed">
                  {children}
                </td>
              ),
            }}
          >
            {normalizarMarkdown(textoLimpo)}
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
            const isCaso = isExemplo && (camadaTexto.includes('Solução Jurídica') || isCasoPratico);

            const cardTheme = isAlert
              ? 'bg-amber-500/[0.08] border-amber-500/30 text-amber-300'
              : isCaso
              ? 'bg-[#18181b]/95 border-primary/35 text-neutral-100 shadow-xl'
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
                    <span>{isCaso ? 'Resolução & Análise Prática' : rotulo}</span>
                  </div>
                  {isCaso && (
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

                {isCaso && !solucaoRevelada ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.impact('medium');
                        setSolucaoRevelada(true);
                      }}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.99] transition-all text-white font-bold text-sm shadow-lg shadow-primary/25 min-h-[48px] cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-white" />
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
