import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export function Overlay({
  titulo,
  icone: Icone,
  children,
  onClose,
  alto,
}: {
  titulo: string;
  icone: any;
  children: ReactNode;
  onClose: () => void;
  alto?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.2 }}
      className="theme-questoes fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0, pointerEvents: 'none' }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex w-full flex-col rounded-t-3xl border border-border bg-card shadow-2xl pb-[calc(1.25rem+var(--sai-bottom))] sm:max-w-lg sm:rounded-3xl sm:pb-0',
          alto ? 'h-[90vh]' : 'max-h-[92vh] overflow-y-auto',
        )}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            <Icone className="h-3 w-3" /> {titulo}
          </p>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-11 w-11 place-items-center rounded-full border border-border/70 bg-muted/70 text-foreground transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={cn('p-4 md:p-5', alto && 'flex min-h-0 flex-1 flex-col overflow-y-auto')}>{children}</div>
      </motion.div>
    </motion.div>
  );
}

export function Md({ texto, className }: { texto?: string; className?: string }) {
  if (!texto) return null;
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-[15px] leading-[1.7] text-foreground/90',
        'prose-headings:text-foreground prose-headings:font-bold prose-headings:text-[15px]',
        'prose-strong:font-bold prose-strong:text-foreground',
        'prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2',
        'prose-a:text-primary',
        'prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:bg-primary/5',
        'prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:px-3 prose-blockquote:py-2',
        'prose-blockquote:text-foreground/90 prose-code:text-primary',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{texto}</ReactMarkdown>
    </div>
  );
}

/** Loader em checklist: cada etapa é marcada em sequência enquanto a IA responde. */
export function Checklist({ passos }: { passos: string[] }) {
  const [feito, setFeito] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFeito((f) => (f < passos.length - 1 ? f + 1 : f)), 1100);
    return () => clearInterval(t);
  }, [passos.length]);

  return (
    <div className="space-y-2.5 py-6">
      {passos.map((p, i) => {
        const pronto = i < feito;
        const ativo = i === feito;
        return (
          <motion.div
            key={p}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: pronto || ativo ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors',
              pronto ? 'border-primary/30 bg-primary/5' : ativo ? 'border-border bg-muted/40' : 'border-border/50',
            )}
          >
            <span
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-full border',
                pronto ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
              )}
            >
              {pronto ? (
                <Check className="h-3.5 w-3.5" />
              ) : ativo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              )}
            </span>
            <span className={cn('text-sm', pronto || ativo ? 'text-foreground' : 'text-muted-foreground')}>{p}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Carregando({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function Erro({ onRetry, msg }: { onRetry: () => void; msg?: any }) {
  const textoErro = typeof msg === 'object' ? JSON.stringify(msg) : String(msg || 'Erro desconhecido');
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
      <p className="text-sm text-destructive">Não foi possível gerar o conteúdo.</p>
      <p className="text-xs text-muted-foreground break-all">{textoErro}</p>
      <button onClick={onRetry} className="text-xs text-primary underline">
        Tentar de novo
      </button>
    </div>
  );
}
