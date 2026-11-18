import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileDown,
  Layers,
  HelpCircle,
  GitBranch,
  BookOpen,
  Paperclip,
  ChevronRight,
  ChevronDown,
  Check,
  Copy,
  Table2,
  Scale,
  AlertTriangle,
  Lightbulb,
  Workflow,
  Target,
  ExternalLink,
  MessageSquare,
  FileText,
  Clock,
  ArrowRight,
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
  colorClass = 'text-rose-400',
  hoverClass = 'hover:border-rose-500/40 hover:bg-[#250c14]',
}) => (
  <button
    onClick={() => {
      haptic.light();
      onClick();
    }}
    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18070d] ${hoverClass} border border-rose-500/25 text-xs font-body text-zinc-200 hover:text-white transition-all active:opacity-70 touch-manipulation shadow-sm`}
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
  onSendFollowUp?: (prompt: string) => void;
}

const formatForWhatsApp = (text: string) => {
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
  formatted = formatted.replace(/__(.*?)__/g, '*$1*');
  formatted = formatted.replace(/^#+\s*(.*?)$/gm, '*$1*');
  formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
  return formatted;
};

/**
 * Normaliza o Markdown jurídico:
 * - Remove emojis de títulos
 * - Identifica seções estruturadas
 * - Normaliza citações legais
 */
function preprocessLegalMarkdown(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // Remove emojis existentes em títulos
  text = text.replace(
    /^(#+\s*)[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]\s*/gmu,
    '$1'
  );

  // Converte linhas que são títulos isolados em títulos Markdown limpos
  text = text.replace(
    /^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(CONCEITO ESSENCIAL|CONCEITO|DEFINIÇÃO):?\s*$/gimu,
    '## CONCEITO ESSENCIAL'
  );
  text = text.replace(
    /^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(O QUE DIZ O TEXTO|TEXTO DA LEI|O QUE DIZ A LEI|LEI APLICÁVEL):?\s*$/gimu,
    '### O QUE DIZ A LEI'
  );
  text = text.replace(
    /^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(EM PORTUGUÊS CLARO|EXPLICAÇÃO DIDÁTICA|EM TERMOS CLAROS|ENTENDA O ARTIGO):?\s*$/gimu,
    '### EM PORTUGUÊS CLARO'
  );
  text = text.replace(
    /^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(ATENÇÃO|CUIDADO EM PROVA|PEGADINHA DE CONCURSO|PEGADINHA|CUIDADO|PEGADINHA DE PROVA & ATENÇÃO):?\s*$/gimu,
    '### PEGADINHA DE PROVA & ATENÇÃO'
  );
  text = text.replace(
    /^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(EXEMPLO PRÁTICO.*|NA PRÁTICA.*|CASO CONCRETO.*):?\s*$/gimu,
    '### EXEMPLO PRÁTICO'
  );
  text = text.replace(
    /^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(FLUXOGRAMA|FLUXOGRAMA PASSO A PASSO|ESQUEMATIZAÇÃO|FLUXOGRAMA:.*):?\s*$/gimu,
    (m, p1) => `### ${p1.replace(/^[\u{1F300}-\u{1F9FF}\s]+/u, '')}`
  );
  text = text.replace(
    /^(?:#+\s*)?(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*)?(QUADRO COMPARATIVO|TABELA COMPARATIVA|SÍNTESE|QUADRO COMPARATIVO:.*):?\s*$/gimu,
    (m, p1) => `### ${p1.replace(/^[\u{1F300}-\u{1F9FF}\s]+/u, '')}`
  );

  // Converte aspas duplas/triplas no início de artigos de lei para blockquote oficial
  text = text.replace(/(?:^|\n)\s*["”']{2,3}([\s\S]*?)["”']{2,3}/g, (match, p1) => {
    const lines = p1.trim().split('\n');
    return '\n\n' + lines.map((l: string) => `> ${l}`).join('\n') + '\n\n';
  });

  return text;
}

interface ParsedSection {
  id: string;
  title: string;
  headingLevel: number;
  body: string;
}

function parseMarkdownSections(markdown: string): { intro: string; sections: ParsedSection[] } {
  if (!markdown) return { intro: '', sections: [] };

  const lines = markdown.split('\n');
  let intro = '';
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        id: `sec-${sections.length}-${match[2].replace(/\s+/g, '-').slice(0, 15)}`,
        headingLevel: match[1].length,
        title: match[2].trim(),
        body: '',
      };
    } else {
      if (currentSection) {
        currentSection.body += (currentSection.body ? '\n' : '') + line;
      } else {
        intro += (intro ? '\n' : '') + line;
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return { intro: intro.trim(), sections };
}

/**
 * Retorna categoria e ícone unificados no padrão vermelho/vinho (SEM ícone de brilho)
 */
const getSectionInfo = (title: string): { category: string; icon: any } => {
  const upper = title.toUpperCase();

  if (upper.includes('CONCEITO') || upper.includes('ESSENCIAL') || upper.includes('DEFINIÇÃO')) {
    return {
      category: 'Fundamento Jurídico',
      icon: Target,
    };
  }
  if (upper.includes('LEI') || upper.includes('NORMA') || upper.includes('LEGISLAÇÃO') || upper.includes('TEXTO')) {
    return {
      category: 'Dispositivo Legal & Literalidade',
      icon: Scale,
    };
  }
  if (upper.includes('SÚMULA') || upper.includes('SUMULA') || upper.includes('TESE') || upper.includes('JURISPRUDÊNCIA') || upper.includes('JURISPRUDENCIA')) {
    return {
      category: 'Súmulas & Jurisprudência',
      icon: Scale,
    };
  }
  if (upper.includes('PORTUGUÊS CLARO') || upper.includes('EXPLICAÇÃO') || upper.includes('DIDÁTICA')) {
    return {
      category: 'Explicação Descomplicada',
      icon: Lightbulb,
    };
  }
  if (upper.includes('EXEMPLO') || upper.includes('PRÁTICO') || upper.includes('CASO CONCRETO') || upper.includes('NA PRÁTICA')) {
    return {
      category: 'Caso Concreto em Camadas',
      icon: FileText,
    };
  }
  if (upper.includes('QUADRO') || upper.includes('TABELA') || upper.includes('SÍNTESE') || upper.includes('COMPARATIVO')) {
    return {
      category: 'Quadro & Síntese Comparativa',
      icon: Table2,
    };
  }
  if (upper.includes('FLUXOGRAMA') || upper.includes('PASSO A PASSO') || upper.includes('RITO') || upper.includes('ESQUEMA')) {
    return {
      category: 'Rito Processual & Fluxo',
      icon: Workflow,
    };
  }
  if (upper.includes('PEGADINHA') || upper.includes('ATENÇÃO') || upper.includes('CUIDADO') || upper.includes('PROVA')) {
    return {
      category: 'Alerta OAB & Concursos',
      icon: AlertTriangle,
    };
  }

  return {
    category: 'Análise Jurídica',
    icon: BookOpen,
  };
};

/**
 * Componentes Markdown estilizados no padrão vermelho/vinho sem caixas de fundo pesadas
 */
const createMarkdownComponents = (msg: Message, isInsideSection = false) => ({
  a: ({ href, children, ...rest }: any) => {
    if (href?.startsWith('cite://')) {
      const n = parseInt(href.replace('cite://', ''), 10);
      const source = msg.sources?.find((s) => s.n === n);
      return <CitationChip n={n} source={source} />;
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-rose-400 underline underline-offset-2 hover:text-rose-300 font-medium"
        {...rest}
      >
        {children}
      </a>
    );
  },
  p: ({ children }: any) => {
    const text =
      typeof children === 'string'
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
      return <AssistenteFluxogramaCard content={text} hideHeader={isInsideSection} />;
    }

    return (
      <p className="my-3 leading-[1.8] sm:leading-[1.85] text-[15.5px] sm:text-[16.5px] text-zinc-200 font-sans tracking-normal">
        {children}
      </p>
    );
  },
  blockquote: ({ children }: any) => (
    <div className="my-3.5 pl-4 pr-3 py-2.5 border-l-2 border-rose-500/70 bg-rose-950/20 rounded-r-xl shadow-sm">
      <div className="flex items-center gap-1.5 mb-1 text-[10.5px] font-bold uppercase tracking-widest text-rose-300 font-mono">
        <Scale className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>Texto da Norma / Jurisprudência</span>
      </div>
      <div className="text-rose-100/95 italic text-[15px] sm:text-[16px] leading-[1.75] font-serif">
        {children}
      </div>
    </div>
  ),
  table: ({ children }: any) => (
    <div className="my-4 w-full overflow-hidden rounded-xl border border-rose-950/60 bg-[#12070a] shadow-xl">
      <div className="px-4 py-2 bg-rose-950/30 border-b border-rose-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-300">
          <Table2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Quadro Comparativo & Síntese</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-rose-400/80 bg-rose-950/60 px-2 py-0.5 rounded font-mono hidden sm:inline">
          Deslize para ver ➔
        </span>
      </div>
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-rose-900/30">
        <table className="w-full min-w-[340px] text-left border-collapse text-xs sm:text-sm">
          {children}
        </table>
      </div>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-rose-950/40 text-rose-200 border-b border-rose-900/30">{children}</thead>
  ),
  th: ({ children }: any) => (
    <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] sm:text-xs text-rose-300 whitespace-nowrap">
      {children}
    </th>
  ),
  tbody: ({ children }: any) => <tbody className="divide-y divide-rose-950/40">{children}</tbody>,
  tr: ({ children }: any) => (
    <tr className="hover:bg-rose-950/20 transition-colors odd:bg-transparent even:bg-rose-950/10">
      {children}
    </tr>
  ),
  td: ({ children }: any) => (
    <td className="py-2.5 px-3.5 text-zinc-300 align-top text-xs sm:text-sm leading-relaxed">
      {children}
    </td>
  ),
  ul: ({ children }: any) => <ul className="my-3 pl-1 space-y-2 list-none">{children}</ul>,
  ol: ({ children }: any) => (
    <ol className="my-3 pl-5 space-y-2 list-decimal text-[15.5px] sm:text-[16.5px] leading-[1.8] text-zinc-200">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="relative pl-5 text-[15px] sm:text-[16px] leading-[1.75] text-zinc-200 before:content-[''] before:absolute before:left-1 before:top-[0.65em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-rose-500">
      {children}
    </li>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    const str = String(children).replace(/\n$/, '');
    const isMermaid =
      className?.includes('mermaid') || className?.includes('fluxo') || className?.includes('flowchart');
    const hasFlowArrows =
      !inline && (str.includes('->') || str.includes('-->') || str.includes('➔') || str.includes('→'));

    if (!inline && (isMermaid || hasFlowArrows || className?.includes('fluxo'))) {
      return <AssistenteFluxogramaCard content={str} hideHeader={isInsideSection} />;
    }

    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md bg-[#240b12] text-rose-300 font-mono text-[13.5px] border border-rose-500/30"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="my-3 rounded-xl border border-rose-900/40 bg-[#12070a] overflow-hidden shadow-lg">
        <div className="px-3 py-1.5 bg-rose-950/40 border-b border-rose-900/30 text-[10px] uppercase font-mono tracking-wider text-rose-300">
          Esquema / Código
        </div>
        <pre className="p-3 text-xs sm:text-sm text-zinc-200 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {str}
        </pre>
      </div>
    );
  },
  strong: ({ children }: any) => {
    const text = typeof children === 'string' ? children.trim() : '';
    const upper = text.toUpperCase();

    // Badges para as 4 camadas do Exemplo Prático (padronizadas no tom vermelho/vinho)
    if (upper.includes('FATO CONCRETO') || upper === '[FATO CONCRETO]:') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-1 mr-1 rounded-md bg-[#240b12] border border-rose-500/35 text-rose-300 font-mono text-xs font-bold tracking-wide">
          <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>FATO CONCRETO:</span>
        </span>
      );
    }

    if (upper.includes('CONDUTA & ELEMENTO') || upper.includes('CONDUTA') || upper === '[CONDUTA]:') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-1 mr-1 rounded-md bg-[#240b12] border border-rose-500/35 text-rose-300 font-mono text-xs font-bold tracking-wide">
          <span>CONDUTA & ELEMENTO SUBJETIVO:</span>
        </span>
      );
    }

    if (upper.includes('ENQUADRAMENTO LEGAL') || upper === '[ENQUADRAMENTO LEGAL]:') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-1 mr-1 rounded-md bg-[#240b12] border border-rose-500/35 text-rose-300 font-mono text-xs font-bold tracking-wide">
          <Scale className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>ENQUADRAMENTO LEGAL:</span>
        </span>
      );
    }

    if (upper.includes('DESFECHO') || upper.includes('SOLUÇÃO') || upper === '[DESFECHO & SOLUÇÃO]:') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-1 mr-1 rounded-md bg-[#240b12] border border-rose-500/35 text-rose-300 font-mono text-xs font-bold tracking-wide">
          <span>DESFECHO & SOLUÇÃO:</span>
        </span>
      );
    }

    return <strong className="font-bold text-white tracking-wide">{children}</strong>;
  },
});

export const AssistenteMessageItem: React.FC<AssistenteMessageItemProps> = ({
  msg,
  isDesktop,
  sessionId,
  allMessages,
  onExportPdf,
  onGenerateArtifact,
  onOpenShare,
  onSendFollowUp,
}) => {
  const [isGrafoOpen, setIsGrafoOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [showSourcesInline, setShowSourcesInline] = useState(false);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);

  // Verifica se é a última resposta do assistente (para exibir sugestões de continuação)
  const isLatestAssistantMessage =
    msg.role === 'assistant' &&
    allMessages.filter((m) => m.role === 'assistant').slice(-1)[0]?.id === msg.id;

  const preprocessed = preprocessLegalMarkdown(msg.content);
  const contentWithCitations =
    (msg.sources?.length ?? 0) > 0
      ? injectCitationLinks(preprocessed, msg.sources?.length ?? 0)
      : preprocessed;

  const { intro, sections } = parseMarkdownSections(contentWithCitations);
  const sectionMarkdownComponents = createMarkdownComponents(msg, true);
  const continuousMarkdownComponents = createMarkdownComponents(msg, false);

  const handleCopySection = (sec: ParsedSection) => {
    haptic.selection();
    const txt = formatForWhatsApp(stripCitations(`*${sec.title}*\n\n${sec.body}`));
    navigator.clipboard.writeText(txt).then(() => {
      setCopiedSectionId(sec.id);
      toast.success(`Seção "${sec.title}" copiada!`);
      setTimeout(() => setCopiedSectionId(null), 2000);
    });
  };

  const handleCopyFull = () => {
    haptic.selection();
    const txt = formatForWhatsApp(stripCitations(msg.content));
    navigator.clipboard.writeText(txt).then(() => {
      setCopiedFull(true);
      toast.success('Resposta copiada para o WhatsApp/Clipboard!');
      setTimeout(() => setCopiedFull(false), 2000);
    });
  };

  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
      {msg.role === 'user' ? (
        /* BALÃO DO USUÁRIO — PADRÃO VINHO ESCURO / CRIMSON */
        <div
          className={`${
            isDesktop ? 'max-w-[80%]' : 'max-w-[88%]'
          } group relative rounded-[24px] rounded-br-[6px] px-5 py-3.5 bg-gradient-to-br from-[#2a0e16] via-[#1a080e] to-[#0c0407] border border-rose-500/40 text-white shadow-[0_8px_28px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all hover:border-rose-500/50`}
        >
          {/* Micro Header do Usuário */}
          <div className="flex items-center justify-between gap-3 mb-1.5 opacity-80 text-[10px] uppercase font-mono tracking-wider text-rose-300">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Você
            </span>
            {msg.createdAt && (
              <span className="text-[9.5px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-zinc-500" />
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {msg.attachment && (
            <div className="mb-2.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs">
              <Paperclip className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="truncate font-medium">{msg.attachment.name}</span>
            </div>
          )}

          <p className="text-[15.5px] sm:text-[16px] font-sans font-medium leading-relaxed tracking-normal text-zinc-100 whitespace-pre-wrap select-text">
            {msg.content}
          </p>
        </div>
      ) : (
        /* RESPOSTA DO ASSISTENTE — DESIGN UNIFICADO VERMELHO/VINHO SEM FUNDO DE CARDS */
        <div className="w-full text-foreground py-1">
          {/* Raciocínio (Accordion Vermelho Vinho com ícone de Relógio) */}
          {msg.thoughtTime && (
            <div className="mb-4">
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18070d] hover:bg-[#250c14] border border-rose-500/30 text-xs text-rose-200 cursor-pointer select-none transition-all shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                  <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-semibold text-rose-200">
                    Raciocínio concluído em {msg.thoughtTime}s
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-400/70 transition-transform duration-200 group-open:rotate-90 shrink-0" />
                </summary>
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3.5 rounded-2xl bg-[#12070a] border border-rose-950/60 shadow-xl max-w-md space-y-2 font-sans"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-1.5 flex items-center justify-between">
                    <span>Etapas de Análise Jurídica</span>
                    <span className="text-rose-400 flex items-center gap-1 font-semibold text-[10px]">
                      <Check className="w-3 h-3" /> Concluído
                    </span>
                  </div>
                  {ANALYZE_STEPS.map((step) => (
                    <div key={step} className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <div className="w-4 h-4 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-rose-400" strokeWidth={3} />
                      </div>
                      <span className="font-medium">{step}</span>
                    </div>
                  ))}
                </motion.div>
              </details>
            </div>
          )}

          {/* Intro Text (se houver texto antes da primeira seção) */}
          {intro && (
            <div className="mb-4 text-[15.5px] sm:text-[16.5px] leading-[1.8] text-zinc-200 font-sans">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={sectionMarkdownComponents}>
                {intro}
              </ReactMarkdown>
            </div>
          )}

          {/* SEÇÕES COM HEADER VERMELHO ELEGANTE — SEM FUNDO DE CARDS! */}
          {sections.length > 0 ? (
            <div className="space-y-6">
              {sections.map((sec) => {
                const { category, icon: Icon } = getSectionInfo(sec.title);
                const isExemplo = sec.title.toUpperCase().includes('EXEMPLO');
                const isCopied = copiedSectionId === sec.id;

                return (
                  <div key={sec.id} className="first:mt-1">
                    {/* Header da Seção estilo Imagem do Usuário (Badge Vinho + Monospace + Título Rose) */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-rose-950/60">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#240b12] border border-rose-500/35 text-rose-400 shadow-sm">
                          <Icon className="w-4.5 h-4.5" strokeWidth={2.4} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-zinc-400">
                            {category}
                          </span>
                          <h3
                            className="text-[15px] sm:text-[16.5px] font-bold uppercase tracking-wide leading-tight text-rose-100 truncate"
                            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                          >
                            {sec.title}
                          </h3>
                        </div>
                      </div>

                      {/* Ações no Header */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isExemplo && (
                          <button
                            type="button"
                            onClick={() => {
                              haptic.light();
                              setIsGrafoOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-bold text-rose-300 hover:text-white transition-all active:scale-95"
                          >
                            <Workflow className="w-3 h-3" />
                            <span className="hidden sm:inline">Ver Grafo</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopySection(sec)}
                          title="Copiar seção"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-200 transition-all active:scale-95"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Texto da Seção — SEM FUNDO DE CARDS! Limpo, espaçado e legível */}
                    <div className="pt-3 pb-1 text-[15.5px] sm:text-[16.5px] leading-[1.8] sm:leading-[1.85] text-zinc-200 font-sans tracking-normal">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={sectionMarkdownComponents}
                      >
                        {sec.body}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* RESPOSTA SEM SEÇÕES (Modo contínuo padrão) */
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              className="prose prose-base dark:prose-invert max-w-none font-sans text-[16px] sm:text-[17px] leading-[1.8] sm:leading-[1.85] text-zinc-200"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={continuousMarkdownComponents}
              >
                {contentWithCitations}
              </ReactMarkdown>
            </motion.div>
          )}

          {/* Fontes citadas na internet */}
          {msg.sources && msg.sources.length > 0 && showSourcesInline && (
            <div className="mt-3">
              <SourcesFooter sources={msg.sources} />
            </div>
          )}

          {/* Modal do Grafo do Exemplo Prático */}
          <AssistenteExemploGrafoModal
            open={isGrafoOpen}
            onClose={() => setIsGrafoOpen(false)}
            content={msg.content}
          />

          {/* TOOLBAR INFERIOR DE AÇÕES RÁPIDAS (Padrão Vermelho Vinho Unificado) */}
          {msg.content && msg.content.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 pt-3.5 border-t border-rose-950/60 flex flex-wrap items-center gap-2"
            >
              {/* Botão Copiar Resposta Completa */}
              <button
                type="button"
                onClick={handleCopyFull}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                  copiedFull
                    ? 'bg-rose-500/25 border-rose-500/50 text-rose-200'
                    : 'bg-[#18070d] hover:bg-[#250c14] border-rose-500/30 text-rose-200 hover:text-white'
                }`}
              >
                {copiedFull ? (
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>{copiedFull ? 'Copiado!' : 'Copiar'}</span>
              </button>

              {/* Botão Flashcards 1-Tap */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onGenerateArtifact(msg, 'flashcards');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18070d] hover:bg-[#250c14] border border-rose-500/30 text-xs font-semibold text-rose-200 hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                <span>Flashcards</span>
              </button>

              {/* Botão Questões OAB 1-Tap */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onGenerateArtifact(msg, 'questoes');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18070d] hover:bg-[#250c14] border border-rose-500/30 text-xs font-semibold text-rose-200 hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>3 Questões OAB</span>
              </button>

              {/* Botão PDF 1-Tap */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onExportPdf(msg);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18070d] hover:bg-[#250c14] border border-rose-500/30 text-xs font-semibold text-rose-200 hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF</span>
              </button>

              {/* Popover "Mais Ferramentas" (com SlidersHorizontal em vez de Sparkles) */}
              <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => haptic.light()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#18070d] hover:bg-[#250c14] border border-rose-500/30 text-xs font-semibold text-rose-200 hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                    <span>Mais</span>
                    <ChevronDown
                      className={`w-3 h-3 text-rose-400/70 transition-transform duration-200 ${
                        isToolsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  sideOffset={8}
                  className="w-56 p-1.5 rounded-2xl bg-[#14080c] border border-rose-900/40 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2.5 py-1.5 mb-1 text-[10px] font-bold tracking-wider text-rose-300/80 uppercase border-b border-rose-900/30 flex items-center justify-between">
                    <span>Ferramentas de Estudo</span>
                    <BookOpen className="w-3 h-3 text-rose-400" />
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
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-rose-500/15 transition-all text-left group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#240b12] border border-rose-500/35 flex items-center justify-center shrink-0">
                        <Workflow className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold block text-[12px] leading-tight">Grafo do Caso</span>
                        <span className="text-[10px] text-zinc-400 block leading-tight">Fluxo visual das partes</span>
                      </div>
                    </button>

                    {/* Mapa Mental */}
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setIsToolsOpen(false);
                        onGenerateArtifact(msg, 'mapa');
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-rose-500/15 transition-all text-left group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#240b12] border border-rose-500/35 flex items-center justify-center shrink-0">
                        <GitBranch className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold block text-[12px] leading-tight">Mapa Mental</span>
                        <span className="text-[10px] text-zinc-400 block leading-tight">Diagrama ramificado</span>
                      </div>
                    </button>

                    {/* Termos / Glossário */}
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setIsToolsOpen(false);
                        onGenerateArtifact(msg, 'termos');
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-rose-500/15 transition-all text-left group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#240b12] border border-rose-500/35 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold block text-[12px] leading-tight">Glossário de Termos</span>
                        <span className="text-[10px] text-zinc-400 block leading-tight">Conceitos jurídicos-chave</span>
                      </div>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Botão Ver Fontes */}
              {msg.sources && msg.sources.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setShowSourcesInline((prev) => !prev);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                    showSourcesInline
                      ? 'bg-rose-500/25 border-rose-500/50 text-rose-200'
                      : 'bg-[#18070d] hover:bg-[#250c14] border-rose-500/30 text-rose-200 hover:text-white'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Fontes</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/40 text-rose-100">
                    {msg.sources.length}
                  </span>
                </button>
              )}

              {/* Feedback Thumbs Up / Down */}
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

          {/* SUGESTÕES INTELIGENTES DE CONTINUAÇÃO (Padrão Vermelho Vinho) */}
          {isLatestAssistantMessage && onSendFollowUp && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4 pt-3 flex flex-wrap items-center gap-2"
            >
              <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-rose-300/80 mr-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-rose-400" />
                Continuar:
              </span>
              {[
                { label: '⚖️ Ver Jurisprudência do STJ', prompt: 'Qual é o entendimento dominante e principais súmulas do STJ sobre este tema?' },
                { label: '💡 Outro exemplo prático', prompt: 'Apresente outro exemplo prático real com situação fática diferente.' },
                { label: '📝 Resumo em 3 tópicos', prompt: 'Faça uma síntese ultra-rápida em apenas 3 tópicos diretos para memorização.' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    onSendFollowUp(item.prompt);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18070d] hover:bg-[#250c14] border border-rose-500/30 text-xs text-rose-200 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-3 h-3 text-rose-400/60" />
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
