import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2 } from 'lucide-react';
import { normalizarMarkdown } from '@/lib/markdown';

interface VideoaulaPanoramaIAProps {
  resumo: string | undefined;
  sobreAula: string | undefined;
  descricao: string | undefined;
  isLoading: boolean;
}

export const VideoaulaPanoramaIA = React.memo(function VideoaulaPanoramaIA({
  resumo,
  sobreAula,
  descricao,
  isLoading
}: VideoaulaPanoramaIAProps) {
  const content = resumo || sobreAula || descricao || '';

  return (
    <section className="px-1 sm:px-2">
      {content && (
        <div className="space-y-3">
          <div className="text-[14.5px] sm:text-[15.5px] leading-relaxed text-zinc-200 space-y-3.5 font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h2
                    style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                    className="text-[17px] sm:text-[19px] font-bold text-white mt-4 first:mt-0 tracking-tight"
                  >
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3
                    style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                    className="text-[16px] sm:text-[17px] font-bold text-cyan-400 mt-4 first:mt-0 tracking-tight"
                  >
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4
                    style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                    className="text-[15px] sm:text-[16.5px] font-bold text-white mt-3.5 first:mt-0 tracking-tight"
                  >
                    {children}
                  </h4>
                ),
                h4: ({ children }) => (
                  <h5
                    style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                    className="text-[12.5px] sm:text-[13.5px] font-bold text-zinc-300 mt-4 uppercase tracking-wider flex items-center gap-2"
                  >
                    <span className="w-1.5 h-3.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{children}</span>
                  </h5>
                ),
                p: ({ children }) => <p className="mb-2.5 last:mb-0 text-zinc-300 leading-relaxed">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-2 mb-3 text-zinc-300 marker:text-cyan-400">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-2 mb-3 text-zinc-300 marker:text-cyan-400">{children}</ol>
                ),
                li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-bold text-white">{children}</strong>
                ),
                em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-cyan-400/60 pl-3.5 py-1 my-2 italic text-zinc-300 bg-cyan-950/20 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[12.5px] text-zinc-200 border border-white/10">{children}</code>
                ),
                hr: () => <hr className="border-white/10 my-4" />,
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                    {children}
                  </a>
                ),
              }}
            >
              {normalizarMarkdown(content)}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {isLoading && !content && (
        <div className="py-6 flex items-center justify-center gap-2.5 text-zinc-400 text-xs font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          <span>Carregando síntese didática...</span>
        </div>
      )}
    </section>
  );
});
