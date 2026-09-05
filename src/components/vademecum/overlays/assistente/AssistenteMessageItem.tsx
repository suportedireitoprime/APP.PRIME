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
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { haptic } from '@/lib/nativeHaptics';
import {
  CitationChip,
  SourcesFooter,
  injectCitationLinks,
  stripCitations,
} from '@/components/chat/ChatSources';
import { ChatFeedback } from '@/components/chat/ChatFeedback';
import { Message, ArtifactKind, ANALYZE_STEPS } from './assistenteTypes';

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
    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 ${hoverClass} border border-white/10 text-xs font-body text-zinc-200 hover:text-white transition-all active:scale-95 touch-manipulation shadow-sm`}
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
              className="prose prose-base dark:prose-invert max-w-none font-body text-[15px] leading-relaxed [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-1 text-foreground"
              onCopy={(e) => {
                const sel = window.getSelection()?.toString() ?? '';
                if (!sel) return;
                e.preventDefault();
                e.clipboardData.setData('text/plain', stripCitations(sel));
              }}
            >
              <ReactMarkdown
                components={{
                  a: ({ href, children, ...rest }) => {
                    if (href?.startsWith('cite://')) {
                      const n = parseInt(href.replace('cite://', ''), 10);
                      const source = msg.sources?.find((s) => s.n === n);
                      return <CitationChip n={n} source={source} />;
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {(msg.sources?.length ?? 0) > 0
                  ? injectCitationLinks(msg.content, msg.sources?.length ?? 0)
                  : msg.content}
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
                <ActionBtn
                  icon={Share2}
                  label="Enviar"
                  colorClass="text-pink-400 group-hover:text-pink-300"
                  hoverClass="hover:border-pink-500/40 hover:bg-pink-500/10"
                  onClick={() => onOpenShare(msg)}
                />
                <span className="ml-auto">
                  <ChatFeedback
                    messageId={msg.id}
                    sessionId={sessionId}
                    pergunta={
                      [...allMessages]
                        .reverse()
                        .find((m, i, arr) => {
                          const idx = arr.length - 1 - i;
                          return m.role === 'user' && idx < allMessages.findIndex((x) => x.id === msg.id);
                        })?.content || ''
                    }
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
