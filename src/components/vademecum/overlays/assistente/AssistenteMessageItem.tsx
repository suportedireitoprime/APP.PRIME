import React from 'react';
import { motion } from 'framer-motion';
import {
  FileDown,
  Layers,
  HelpCircle,
  GitBranch,
  BookOpen,
  Share2,
  Paperclip,
  ChevronRight,
  Check,
  Copy,
  Table2,
  Scale,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Workflow,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { haptic } from '@/lib/nativeHaptics';
import {
  CitationChip,
  SourcesFooter,
  injectCitationLinks,
  stripCitations,
} from '@/components/chat/ChatSources';
import { ChatFeedback } from '@/components/chat/ChatFeedback';
import { Message, ArtifactKind, ANALYZE_STEPS } from './assistenteTypes';
import { AssistenteFluxogramaCard } from './AssistenteFluxogramaCard';

export const ActionBtn: React.FC<{
  icon: any;
  label: string;
  onClick: () => void;
  colorClass?: string;
  hoverClass?: string;
}> = ({
  icon: Icon,
  label,
  onClick,
  colorClass = 'text-accent',
  hoverClass = 'hover:border-white/20 hover:bg-white/5',
}) => (
  <button
    onClick={() => {
      haptic.light();
      onClick();
    }}
    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 ${hoverClass} border border-white/10 text-xs font-body text-zinc-200 hover:text-white transition-all active:opacity-70 touch-manipulation shadow-sm`}
  >
    <Icon
      className={`w-3.5 h-3.5 ${colorClass} transition-transform group-hover:scale-110 shrink-0`}
      strokeWidth={2.2}
    />
    <span className="font-medium text-[12px]">{label}</span>
  </button>
);

interface AssistenteMessageItemProps {
  msg: Message;
  isDesktop: boolean;
  sessionId: string;
  allMessages: Message[];
  onExportPdf: (msg: Message) => void;
  onGenerateArtifact: (msg: Message, kind: ArtifactKind) => void;
  onOpenShare: (msg: Message) => void;
}

const formatForWhatsApp = (text: string) => {
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '*$1*'); // **bold** to *bold*
  formatted = formatted.replace(/__(.*?)__/g, '*$1*'); // __bold__ to *bold*
  formatted = formatted.replace(/^#+\s*(.*?)$/gm, '*$1*'); // headers to bold
  formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)'); // [text](url)
  return formatted;
};

/**
 * Normaliza e enriquece o Markdown jurídico para garantir títulos destacados,
 * citações de leis encapsuladas e detecção de esquemas/fluxogramas.
 */
function preprocessLegalMarkdown(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. Converte linhas que são títulos isolados em títulos com tracking e ícone
  text = text.replace(/^(?:#+\s*)?(O QUE DIZ O TEXTO|TEXTO DA LEI|O QUE DIZ A LEI):?\s*$/gim, '### 📜 $1');
  text = text.replace(/^(?:#+\s*)?(EM PORTUGUÊS CLARO|EXPLICAÇÃO DIDÁTICA|EM TERMOS CLAROS):?\s*$/gim, '### 💡 $1');
  text = text.replace(/^(?:#+\s*)?(ATENÇÃO|CUIDADO EM PROVA|PEGADINHA DE CONCURSO|PEGADINHA|CUIDADO):?\s*$/gim, '### ⚠️ $1');
  text = text.replace(/^(?:#+\s*)?(EXEMPLO PRÁTICO|NA PRÁTICA|CASO CONCRETO):?\s*$/gim, '### 🎯 $1');
  text = text.replace(/^(?:#+\s*)?(FLUXOGRAMA|FLUXOGRAMA PASSO A PASSO|ESQUEMATIZAÇÃO):?\s*$/gim, '### 🔄 $1');
  text = text.replace(/^(?:#+\s*)?(QUADRO COMPARATIVO|TABELA COMPARATIVA|SÍNTESE):?\s*$/gim, '### 📊 $1');

  // 2. Converte aspas duplas/triplas no início de artigos de lei para blockquote oficial
  text = text.replace(/(?:^|\n)\s*["”']{2,3}([\s\S]*?)["”']{2,3}/g, (match, p1) => {
    const lines = p1.trim().split('\n');
    return '\n\n' + lines.map((l: string) => `> ${l}`).join('\n') + '\n\n';
  });

  return text;
}

export const AssistenteMessageItem: React.FC<AssistenteMessageItemProps> = ({
  msg,
  isDesktop,
  sessionId,
  allMessages,
  onExportPdf,
  onGenerateArtifact,
  onOpenShare,
}) => {
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`${
          msg.role === 'user'
            ? (isDesktop ? 'max-w-[92%]' : 'max-w-[88%]') +
              ' rounded-2xl px-4 py-2.5 bg-primary/15 text-foreground border border-primary/40 rounded-br-md'
            : 'w-full text-foreground py-1'
        }`}
      >
        {msg.attachment && msg.role === 'user' && (
          <div className="mb-2 flex items-center gap-2 text-xs opacity-90">
            <Paperclip className="w-3 h-3" /> {msg.attachment.name}
          </div>
        )}

        {msg.role === 'assistant' ? (
          <>
            {msg.thoughtTime && (
              <div className="mb-4">
                <details className="group [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors w-fit">
                    Pensou por {msg.thoughtTime}s{' '}
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-3 pl-3 border-l-2 border-border/50 text-xs text-muted-foreground/80 space-y-2.5 font-body">
                    {ANALYZE_STEPS.map((step) => (
                      <div key={step} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-muted-foreground/60" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              className="prose prose-base dark:prose-invert max-w-none font-body text-[15px] leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 text-foreground"
              onCopy={(e) => {
                const sel = window.getSelection()?.toString() ?? '';
                if (!sel) return;
                e.preventDefault();
                e.clipboardData.setData('text/plain', formatForWhatsApp(stripCitations(sel)));
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  a: ({ href, children, ...rest }) => {
                    if (href?.startsWith('cite://')) {
                      const n = parseInt(href.replace('cite://', ''), 10);
                      const source = msg.sources?.find((s) => s.n === n);
                      return <CitationChip n={n} source={source} />;
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-rose-400 underline underline-offset-2 hover:text-rose-300" {...rest}>
                        {children}
                      </a>
                    );
                  },
                  h1: ({ children }) => (
                    <div className="mt-6 mb-3 first:mt-1 pb-2 border-b border-rose-500/25 flex items-center gap-2.5">
                      <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-rose-500 to-amber-500 shrink-0 shadow-sm" />
                      <h1 className="text-base sm:text-lg font-black tracking-widest uppercase text-white font-display">
                        {children}
                      </h1>
                    </div>
                  ),
                  h2: ({ children }) => (
                    <div className="mt-5 mb-2.5 first:mt-1 pb-1.5 border-b border-white/10 flex items-center gap-2">
                      <span className="w-1.5 h-5 rounded-full bg-amber-400 shrink-0 shadow-sm" />
                      <h2 className="text-[15px] sm:text-base font-bold tracking-wider uppercase text-amber-300 font-display">
                        {children}
                      </h2>
                    </div>
                  ),
                  h3: ({ children }) => (
                    <div className="mt-4 mb-2 first:mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 ring-2 ring-rose-400/25 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-zinc-100 font-display">
                        {children}
                      </h3>
                    </div>
                  ),
                  h4: ({ children }) => (
                    <h4 className="mt-3 mb-1.5 text-xs font-semibold tracking-wider uppercase text-zinc-300 flex items-center gap-1.5 font-display">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                      {children}
                    </h4>
                  ),
                  table: ({ children }) => (
                    <div className="my-5 w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 shadow-2xl backdrop-blur-md">
                      <div className="px-3.5 py-2.5 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
                          <Table2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Quadro Comparativo & Síntese</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md font-mono hidden sm:inline">
                          Deslize para ver ➔
                        </span>
                      </div>
                      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                        <table className="w-full min-w-[340px] text-left border-collapse text-xs sm:text-sm">
                          {children}
                        </table>
                      </div>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-white/[0.05] text-zinc-200 border-b border-white/10">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] sm:text-xs text-rose-300/95 whitespace-nowrap bg-white/[0.02]">
                      {children}
                    </th>
                  ),
                  tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
                  tr: ({ children }) => (
                    <tr className="hover:bg-white/[0.03] transition-colors odd:bg-transparent even:bg-white/[0.015]">
                      {children}
                    </tr>
                  ),
                  td: ({ children }) => (
                    <td className="py-2.5 px-3.5 text-zinc-300 align-top text-xs sm:text-sm leading-relaxed">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <div className="my-3.5 relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/15 p-3.5 sm:p-4 shadow-md backdrop-blur-sm">
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-rose-500" />
                      <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-300/90 font-mono">
                        <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Texto da Norma / Jurisprudência</span>
                      </div>
                      <div className="pl-2 text-zinc-200/95 italic text-xs sm:text-sm leading-relaxed font-sans">
                        {children}
                      </div>
                    </div>
                  ),
                  code: ({ inline, className, children, ...props }: any) => {
                    const str = String(children).replace(/\n$/, '');
                    const isMermaid =
                      className?.includes('mermaid') ||
                      className?.includes('fluxo') ||
                      className?.includes('flowchart');
                    const hasFlowArrows =
                      !inline &&
                      (str.includes('->') || str.includes('-->') || str.includes('➔') || str.includes('→'));

                    if (!inline && (isMermaid || hasFlowArrows)) {
                      return <AssistenteFluxogramaCard content={str} title="Fluxograma Dinâmico de Aplicação" />;
                    }

                    if (inline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-white/10 text-rose-300 font-mono text-[13px] border border-white/10"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="my-3 rounded-xl border border-white/10 bg-zinc-950/90 overflow-hidden shadow-lg">
                        <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                          Esquema / Código
                        </div>
                        <pre className="p-3 text-xs sm:text-sm text-zinc-200 font-mono overflow-x-auto leading-relaxed">
                          {str}
                        </pre>
                      </div>
                    );
                  },
                  strong: ({ children }) => {
                    const text = typeof children === 'string' ? children.trim() : '';
                    const upper = text.toUpperCase();

                    if (upper === 'O QUE DIZ O TEXTO:' || upper === 'O QUE DIZ A LEI:' || upper === 'TEXTO DA LEI:') {
                      return (
                        <span className="block mt-4 mb-2 text-xs sm:text-sm font-black uppercase tracking-widest text-amber-300 font-display flex items-center gap-1.5 pb-1 border-b border-amber-500/20">
                          <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{children}</span>
                        </span>
                      );
                    }

                    if (upper.includes('EM PORTUGUÊS CLARO') || upper.includes('EXPLICAÇÃO DIDÁTICA') || upper.includes('ENTENDA O ARTIGO')) {
                      return (
                        <span className="block mt-4 mb-2 text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-300 font-display flex items-center gap-1.5 pb-1 border-b border-emerald-500/20">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{children}</span>
                        </span>
                      );
                    }

                    if (upper.includes('PEGADINHA') || upper.includes('ATENÇÃO') || upper.includes('CUIDADO EM PROVA') || upper.includes('CUIDADO:')) {
                      return (
                        <span className="block mt-4 mb-2 text-xs sm:text-sm font-black uppercase tracking-widest text-rose-300 font-display flex items-center gap-1.5 pb-1 border-b border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{children}</span>
                        </span>
                      );
                    }

                    if (upper.includes('EXEMPLO PRÁTICO') || upper.includes('NA PRÁTICA') || upper.includes('CASO CONCRETO')) {
                      return (
                        <span className="block mt-4 mb-2 text-xs sm:text-sm font-black uppercase tracking-widest text-sky-300 font-display flex items-center gap-1.5 pb-1 border-b border-sky-500/20">
                          <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{children}</span>
                        </span>
                      );
                    }

                    if (upper.includes('FLUXOGRAMA') || upper.includes('ESQUEMA') || upper.includes('PASSO A PASSO')) {
                      return (
                        <span className="block mt-4 mb-2 text-xs sm:text-sm font-black uppercase tracking-widest text-purple-300 font-display flex items-center gap-1.5 pb-1 border-b border-purple-500/20">
                          <Workflow className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{children}</span>
                        </span>
                      );
                    }

                    return <strong className="font-bold text-white tracking-wide">{children}</strong>;
                  },
                }}
              >
                {(() => {
                  const preprocessed = preprocessLegalMarkdown(msg.content);
                  return (msg.sources?.length ?? 0) > 0
                    ? injectCitationLinks(preprocessed, msg.sources?.length ?? 0)
                    : preprocessed;
                })()}
              </ReactMarkdown>
            </motion.div>

            {msg.sources && msg.sources.length > 0 && <SourcesFooter sources={msg.sources} />}

            {msg.content && msg.content.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-1.5"
              >
                <ActionBtn
                  icon={Copy}
                  label="Copiar"
                  colorClass="text-zinc-400 group-hover:text-zinc-300"
                  hoverClass="hover:border-zinc-500/40 hover:bg-zinc-500/10"
                  onClick={() => {
                    const txt = formatForWhatsApp(stripCitations(msg.content));
                    navigator.clipboard.writeText(txt).then(() => {
                      toast.success('Mensagem copiada!');
                      haptic.selection();
                    });
                  }}
                />
                <ActionBtn
                  icon={FileDown}
                  label="PDF"
                  colorClass="text-rose-500 group-hover:text-rose-400"
                  hoverClass="hover:border-rose-500/40 hover:bg-rose-500/10"
                  onClick={() => onExportPdf(msg)}
                />
                <ActionBtn
                  icon={Layers}
                  label="Flashcards"
                  colorClass="text-emerald-400 group-hover:text-emerald-300"
                  hoverClass="hover:border-emerald-500/40 hover:bg-emerald-500/10"
                  onClick={() => onGenerateArtifact(msg, 'flashcards')}
                />
                <ActionBtn
                  icon={HelpCircle}
                  label="Questões"
                  colorClass="text-amber-400 group-hover:text-amber-300"
                  hoverClass="hover:border-amber-500/40 hover:bg-amber-500/10"
                  onClick={() => onGenerateArtifact(msg, 'questoes')}
                />
                <ActionBtn
                  icon={GitBranch}
                  label="Mapa"
                  colorClass="text-purple-400 group-hover:text-purple-300"
                  hoverClass="hover:border-purple-500/40 hover:bg-purple-500/10"
                  onClick={() => onGenerateArtifact(msg, 'mapa')}
                />
                <ActionBtn
                  icon={BookOpen}
                  label="Termos"
                  colorClass="text-sky-400 group-hover:text-sky-300"
                  hoverClass="hover:border-sky-500/40 hover:bg-sky-500/10"
                  onClick={() => onGenerateArtifact(msg, 'termos')}
                />
                <span className="ml-auto">

                  <ChatFeedback
                    messageId={msg.id}
                    sessionId={sessionId}
                    pergunta={(() => {
                      const msgIdx = allMessages.findIndex((x) => x.id === msg.id);
                      if (msgIdx <= 0) return '';
                      for (let i = msgIdx - 1; i >= 0; i--) {
                        if (allMessages[i].role === 'user') return allMessages[i].content;
                      }
                      return '';
                    })()}
                    resposta={msg.content}
                    webSearch={!!msg.webSearch}
                    sources={msg.sources}
                  />
                </span>
              </motion.div>
            )}
          </>
        ) : (
          <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        )}
      </div>
    </div>
  );
};
