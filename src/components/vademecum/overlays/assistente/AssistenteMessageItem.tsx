import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileDown,
  Layers,
  HelpCircle,
  GitBranch,
  BookOpen,
  Share2,
  Paperclip,
  ChevronRight,
  ChevronDown,
  Check,
  Copy,
  Table2,
  Scale,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Workflow,
  ArrowRight,
  Target,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { haptic } from '@/lib/nativeHaptics';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CitationChip,
  SourcesFooter,
  injectCitationLinks,
  stripCitations,
} from '@/components/chat/ChatSources';
import { ChatFeedback } from '@/components/chat/ChatFeedback';
import { Message, ArtifactKind, ANALYZE_STEPS } from './assistenteTypes';
import { AssistenteFluxogramaCard } from './AssistenteFluxogramaCard';
import { AssistenteExemploGrafoModal } from './AssistenteExemploGrafoModal';

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
 * Normaliza e enriquece o Markdown jurídico:
 * - Remove emojis de títulos (substituídos por ícones SVG oficiais)
 * - Identifica fluxogramas e sequências com setas
 * - Normaliza citações legais
 */
function preprocessLegalMarkdown(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // Remove emojis existentes em títulos
  text = text.replace(/^(#+\s*)[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]\s*/gmu, '$1');

  // Converte linhas que são títulos isolados em títulos Markdown limpos SEM emojis
  text = text.replace(/^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(CONCEITO ESSENCIAL|CONCEITO|DEFINIÇÃO):?\s*$/gimu, '## CONCEITO ESSENCIAL');
  text = text.replace(/^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(O QUE DIZ O TEXTO|TEXTO DA LEI|O QUE DIZ A LEI):?\s*$/gimu, '### O QUE DIZ A LEI');
  text = text.replace(/^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(EM PORTUGUÊS CLARO|EXPLICAÇÃO DIDÁTICA|EM TERMOS CLAROS):?\s*$/gimu, '### EM PORTUGUÊS CLARO');
  text = text.replace(/^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(ATENÇÃO|CUIDADO EM PROVA|PEGADINHA DE CONCURSO|PEGADINHA|CUIDADO|PEGADINHA DE PROVA & ATENÇÃO):?\s*$/gimu, '### PEGADINHA DE PROVA & ATENÇÃO');
  text = text.replace(/^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(EXEMPLO PRÁTICO.*|NA PRÁTICA.*|CASO CONCRETO.*):?\s*$/gimu, '### EXEMPLO PRÁTICO');
  text = text.replace(/^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(FLUXOGRAMA|FLUXOGRAMA PASSO A PASSO|ESQUEMATIZAÇÃO|FLUXOGRAMA:.*):?\s*$/gimu, (m, p1) => `### ${p1.replace(/^[\u{1F300}-\u{1F9FF}\s]+/u, '')}`);
  text = text.replace(/^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(QUADRO COMPARATIVO|TABELA COMPARATIVA|SÍNTESE|QUADRO COMPARATIVO:.*):?\s*$/gimu, (m, p1) => `### ${p1.replace(/^[\u{1F300}-\u{1F9FF}\s]+/u, '')}`);

  // Converte aspas duplas/triplas no início de artigos de lei para blockquote oficial
  text = text.replace(/(?:^|\n)\s*["”']{2,3}([\s\S]*?)["”']{2,3}/g, (match, p1) => {
    const lines = p1.trim().split('\n');
    return '\n\n' + lines.map((l: string) => `> ${l}`).join('\n') + '\n\n';
  });

  return text;
}

const getHeadingDetails = (children: React.ReactNode) => {
  let text = '';
  if (typeof children === 'string') {
    text = children;
  } else if (Array.isArray(children)) {
    text = children.map((c) => (typeof c === 'string' ? c : '')).join('');
  }

  // Remove qualquer emoji residual do texto do título
  const cleanTitle = text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();

  const upper = cleanTitle.toUpperCase();

  if (upper.includes('CONCEITO') || upper.includes('ESSENCIAL') || upper.includes('DEFINIÇÃO')) {
    return {
      title: cleanTitle,
      icon: Target,
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-400/10 border-amber-400/25',
      textColor: 'text-amber-300',
    };
  }

  if (upper.includes('O QUE DIZ A LEI') || upper.includes('TEXTO DA LEI') || upper.includes('LEI') || upper.includes('LEGISLAÇÃO')) {
    return {
      title: cleanTitle,
      icon: Scale,
      iconColor: 'text-rose-400',
      badgeBg: 'bg-rose-400/10 border-rose-400/25',
      textColor: 'text-white',
    };
  }

  if (upper.includes('EM PORTUGUÊS CLARO') || upper.includes('EXPLICAÇÃO') || upper.includes('DIDÁTICA')) {
    return {
      title: cleanTitle,
      icon: Lightbulb,
      iconColor: 'text-yellow-400',
      badgeBg: 'bg-yellow-400/10 border-yellow-400/25',
      textColor: 'text-yellow-200',
    };
  }

  if (upper.includes('QUADRO COMPARATIVO') || upper.includes('TABELA') || upper.includes('SÍNTESE')) {
    return {
      title: cleanTitle,
      icon: Table2,
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-400/10 border-emerald-400/25',
      textColor: 'text-emerald-300',
    };
  }

  if (upper.includes('FLUXOGRAMA') || upper.includes('PASSO A PASSO') || upper.includes('RITO') || upper.includes('ESQUEMA')) {
    return {
      title: cleanTitle,
      icon: Workflow,
      iconColor: 'text-sky-400',
      badgeBg: 'bg-sky-400/10 border-sky-400/25',
      textColor: 'text-sky-300',
    };
  }

  if (upper.includes('PEGADINHA') || upper.includes('ATENÇÃO') || upper.includes('CUIDADO')) {
    return {
      title: cleanTitle,
      icon: AlertTriangle,
      iconColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/15 border-rose-500/30',
      textColor: 'text-rose-300',
    };
  }

  if (upper.includes('EXEMPLO') || upper.includes('PRÁTICO') || upper.includes('CASO CONCRETO') || upper.includes('NA PRÁTICA')) {
    return {
      title: cleanTitle,
      icon: Sparkles,
      iconColor: 'text-sky-400',
      badgeBg: 'bg-sky-400/10 border-sky-400/25',
      textColor: 'text-sky-300',
    };
  }

  return {
    title: cleanTitle,
    icon: Sparkles,
    iconColor: 'text-amber-400',
    badgeBg: 'bg-white/5 border-white/10',
    textColor: 'text-white',
  };
};

export const AssistenteMessageItem: React.FC<AssistenteMessageItemProps> = ({
  msg,
  isDesktop,
  sessionId,
  allMessages,
  onExportPdf,
  onGenerateArtifact,
  onOpenShare,
}) => {
  const [isGrafoOpen, setIsGrafoOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [showSourcesInline, setShowSourcesInline] = useState(false);

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
              className="prose prose-base dark:prose-invert max-w-none font-sans text-[16px] sm:text-[17px] leading-[1.8] sm:leading-[1.85] [&_p]:my-3.5 [&_ul]:my-3.5 [&_ol]:my-3.5 [&_li]:my-2 text-foreground"
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
                  p: ({ children }) => {
                    const text = typeof children === 'string'
                      ? children
                      : Array.isArray(children)
                      ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
                      : '';

                    // Detecta se é um fluxograma linear enviado em parágrafo: ex: [A] -> [B] -> [C]
                    const arrowDelimiters = /\s*(?:-->|->|➔|→|=>|⇒)\s*/;
                    if (
                      (text.includes('->') || text.includes('-->') || text.includes('➔') || text.includes('→')) &&
                      (text.includes('[') || text.split(arrowDelimiters).length >= 2)
                    ) {
                      return <AssistenteFluxogramaCard content={text} title="Fluxograma Dinâmico de Aplicação" />;
                    }

                    return (
                      <p className="my-3.5 leading-[1.8] sm:leading-[1.85] text-[16px] sm:text-[17px] text-zinc-100 font-sans tracking-normal">
                        {children}
                      </p>
                    );
                  },
                  h1: ({ children }) => {
                    const { title, icon: Icon, iconColor, badgeBg, textColor } = getHeadingDetails(children);
                    return (
                      <div className="mt-7 mb-3.5 first:mt-1 pb-2.5 border-b border-white/10 flex items-center gap-2.5 min-h-[34px]">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${badgeBg}`}>
                          <Icon className={`w-4.5 h-4.5 ${iconColor}`} strokeWidth={2.4} />
                        </div>
                        <h1
                          className={`text-[16.5px] sm:text-[18.5px] font-black tracking-wide uppercase leading-tight font-sans ${textColor} m-0 p-0 flex-1`}
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                        >
                          {title}
                        </h1>
                      </div>
                    );
                  },
                  h2: ({ children }) => {
                    const { title, icon: Icon, iconColor, badgeBg, textColor } = getHeadingDetails(children);
                    const isExemplo = title.toUpperCase().includes('EXEMPLO');
                    return (
                      <div className="mt-6 mb-3 first:mt-1 pb-2 border-b border-white/10 flex items-center justify-between gap-2.5 min-h-[32px]">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${badgeBg}`}>
                            <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2.4} />
                          </div>
                          <h2
                            className={`text-[15px] sm:text-[16.5px] font-extrabold tracking-wide uppercase leading-tight font-sans ${textColor} m-0 p-0`}
                            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                          >
                            {title}
                          </h2>
                        </div>
                        {isExemplo && (
                          <button
                            type="button"
                            onClick={() => {
                              haptic.light();
                              setIsGrafoOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-[11px] font-bold text-sky-300 hover:text-white transition-all active:scale-95 shrink-0"
                          >
                            <Workflow className="w-3 h-3" />
                            <span>Ver em Grafo</span>
                          </button>
                        )}
                      </div>
                    );
                  },
                  h3: ({ children }) => {
                    const { title, icon: Icon, iconColor, badgeBg, textColor } = getHeadingDetails(children);
                    return (
                      <div className="mt-5 mb-2.5 first:mt-1 flex items-center gap-2.5 min-h-[28px]">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${badgeBg}`}>
                          <Icon className={`w-3.5 h-3.5 ${iconColor}`} strokeWidth={2.2} />
                        </div>
                        <h3
                          className={`text-[13.5px] sm:text-[15px] font-bold tracking-wide uppercase leading-tight font-sans ${textColor} m-0 p-0 flex-1`}
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                        >
                          {title}
                        </h3>
                      </div>
                    );
                  },
                  h4: ({ children }) => (
                    <h4
                      className="mt-4 mb-2 text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-300 flex items-center gap-2 font-sans leading-none"
                      style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="translate-y-[-0.5px]">{children}</span>
                    </h4>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-3.5 pl-1 space-y-2.5 list-none">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-3.5 pl-5 space-y-2.5 list-decimal text-[16px] sm:text-[17px] leading-[1.8] text-zinc-100">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="relative pl-5 text-[15.5px] sm:text-[16.5px] leading-[1.75] text-zinc-200 before:content-[''] before:absolute before:left-1 before:top-[0.65em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-rose-500">
                      {children}
                    </li>
                  ),
                  table: ({ children }) => (
                    <div className="my-5 w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 shadow-2xl backdrop-blur-md">
                      <div className="px-4 py-3 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300">
                          <Table2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Quadro Comparativo & Síntese</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md font-mono hidden sm:inline">
                          Deslize para ver ➔
                        </span>
                      </div>
                      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                        <table className="w-full min-w-[360px] text-left border-collapse text-xs sm:text-sm">
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
                    <div className="my-4 relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-md backdrop-blur-sm">
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-rose-500" />
                      <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-300/90 font-mono">
                        <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Texto da Norma / Jurisprudência</span>
                      </div>
                      <div className="pl-2 text-zinc-200/95 italic text-[15px] sm:text-[16px] leading-[1.75] font-serif">
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

                    if (!inline && (isMermaid || hasFlowArrows || className?.includes('fluxo'))) {
                      return <AssistenteFluxogramaCard content={str} title="Fluxograma Dinâmico de Aplicação" />;
                    }

                    if (inline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-white/10 text-rose-300 font-mono text-[13.5px] border border-white/10"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="my-3 rounded-xl border border-white/10 bg-zinc-950 overflow-hidden shadow-lg">
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
                        <span
                          className="flex items-center gap-2 mt-5 mb-2 pb-1 border-b border-amber-500/20 text-sm sm:text-base font-extrabold uppercase tracking-wider text-amber-300 font-sans leading-none"
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                        >
                          <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="translate-y-[-0.5px]">{children}</span>
                        </span>
                      );
                    }

                    if (upper.includes('EM PORTUGUÊS CLARO') || upper.includes('EXPLICAÇÃO DIDÁTICA') || upper.includes('ENTENDA O ARTIGO')) {
                      return (
                        <span
                          className="flex items-center gap-2 mt-5 mb-2 pb-1 border-b border-emerald-500/20 text-sm sm:text-base font-extrabold uppercase tracking-wider text-emerald-300 font-sans leading-none"
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                        >
                          <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="translate-y-[-0.5px]">{children}</span>
                        </span>
                      );
                    }

                    if (upper.includes('PEGADINHA') || upper.includes('ATENÇÃO') || upper.includes('CUIDADO EM PROVA') || upper.includes('CUIDADO:')) {
                      return (
                        <span
                          className="flex items-center gap-2 mt-5 mb-2 pb-1 border-b border-rose-500/20 text-sm sm:text-base font-extrabold uppercase tracking-wider text-rose-300 font-sans leading-none"
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="translate-y-[-0.5px]">{children}</span>
                        </span>
                      );
                    }

                    if (upper.includes('EXEMPLO PRÁTICO') || upper.includes('NA PRÁTICA') || upper.includes('CASO CONCRETO')) {
                      return (
                        <span
                          className="flex items-center gap-2 mt-5 mb-2 pb-1 border-b border-sky-500/20 text-sm sm:text-base font-extrabold uppercase tracking-wider text-sky-300 font-sans leading-none"
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                        >
                          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="translate-y-[-0.5px]">{children}</span>
                        </span>
                      );
                    }

                    if (upper.includes('FLUXOGRAMA') || upper.includes('ESQUEMA') || upper.includes('PASSO A PASSO')) {
                      return (
                        <span
                          className="flex items-center gap-2 mt-5 mb-2 pb-1 border-b border-purple-500/20 text-sm sm:text-base font-extrabold uppercase tracking-wider text-purple-300 font-sans leading-none"
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                        >
                          <Workflow className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="translate-y-[-0.5px]">{children}</span>
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

            {/* Fontes citadas na internet (com toggle expansível) */}
            {msg.sources && msg.sources.length > 0 && showSourcesInline && (
              <div className="mt-2">
                <SourcesFooter sources={msg.sources} />
              </div>
            )}

            {/* Modal do Grafo do Exemplo Prático */}
            <AssistenteExemploGrafoModal
              open={isGrafoOpen}
              onClose={() => setIsGrafoOpen(false)}
              content={msg.content}
            />

            {msg.content && msg.content.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2"
              >
                {/* Botão Único Consolidado de Ferramentas / Ações */}
                <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onClick={() => haptic.light()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 text-xs font-semibold text-zinc-100 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[12px] font-bold">Ações & Estudo</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                          isToolsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="w-56 p-1.5 rounded-2xl bg-[#14161a] border border-white/15 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-2.5 py-1.5 mb-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase border-b border-white/10 flex items-center justify-between">
                      <span>Ferramentas da Resposta</span>
                      <Sparkles className="w-3 h-3 text-amber-400/80" />
                    </div>

                    <div className="space-y-0.5">
                      {/* Grafo */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setIsToolsOpen(false);
                          setIsGrafoOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-sky-500/15 transition-all text-left group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                          <Workflow className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block text-[12px] leading-tight">Grafo do Caso</span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">Fluxo visual das partes</span>
                        </div>
                      </button>

                      {/* Copiar */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setIsToolsOpen(false);
                          const txt = formatForWhatsApp(stripCitations(msg.content));
                          navigator.clipboard.writeText(txt).then(() => {
                            toast.success('Mensagem copiada!');
                          });
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all text-left group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                          <Copy className="w-3.5 h-3.5 text-zinc-300 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block text-[12px] leading-tight">Copiar Texto</span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">Formatado p/ WhatsApp</span>
                        </div>
                      </button>

                      {/* PDF */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setIsToolsOpen(false);
                          onExportPdf(msg);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-rose-500/15 transition-all text-left group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                          <FileDown className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block text-[12px] leading-tight">Exportar PDF</span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">Baixar estudo diagramado</span>
                        </div>
                      </button>

                      <div className="my-1 border-t border-white/5" />

                      {/* Flashcards */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setIsToolsOpen(false);
                          onGenerateArtifact(msg, 'flashcards');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-emerald-500/15 transition-all text-left group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <Layers className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block text-[12px] leading-tight">Criar Flashcards</span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">Cartões para memorização</span>
                        </div>
                      </button>

                      {/* Questões */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setIsToolsOpen(false);
                          onGenerateArtifact(msg, 'questoes');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-amber-500/15 transition-all text-left group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block text-[12px] leading-tight">Gerar Questões</span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">Treinar no padrão OAB</span>
                        </div>
                      </button>

                      {/* Mapa */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setIsToolsOpen(false);
                          onGenerateArtifact(msg, 'mapa');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-purple-500/15 transition-all text-left group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                          <GitBranch className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block text-[12px] leading-tight">Mapa Mental</span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">Diagrama ramificado</span>
                        </div>
                      </button>

                      {/* Termos */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setIsToolsOpen(false);
                          onGenerateArtifact(msg, 'termos');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-cyan-500/15 transition-all text-left group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block text-[12px] leading-tight">Glossário de Termos</span>
                          <span className="text-[10px] text-zinc-400 block leading-tight">Conceitos jurídicos-chave</span>
                        </div>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Botão "Ver Fontes" quando houver fontes citadas */}
                {msg.sources && msg.sources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setShowSourcesInline((prev) => !prev);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                      showSourcesInline
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 border-white/15 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-[12px]">Ver Fontes</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200">
                      {msg.sources.length}
                    </span>
                  </button>
                )}

                <span className="ml-auto flex items-center gap-1.5">
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
