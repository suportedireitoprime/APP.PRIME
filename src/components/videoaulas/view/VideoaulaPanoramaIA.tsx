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
    <section className="px-3 lg:px-0">
      {content && (
        <div className="space-y-2 mb-4">
          <div className="text-[15px] leading-relaxed text-foreground/90 space-y-3 font-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h2 className="text-[17px] font-semibold text-foreground mt-4 first:mt-0">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 className="text-[16px] font-semibold text-primary mt-4 first:mt-0">
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="text-[15px] font-semibold text-foreground mt-3">{children}</h4>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/50 pl-3 italic text-foreground/80">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-muted px-1 py-0.5 text-[12px]">{children}</code>
                ),
                hr: () => <hr className="border-border my-3" />,
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
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
        <div className="py-4 flex items-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Carregando panorama...
        </div>
      )}
    </section>
  );
});
