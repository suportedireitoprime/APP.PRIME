import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2, Lightbulb, Zap, AlertTriangle, ListTree } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resolveSectionIndex, type AiSection } from '@/lib/artigoSegments';

type Props = {
  open: boolean;
  mode: 'explicacao' | 'exemplo';
  artigoNumero: string;
  leiNome?: string;
  sections: AiSection[];
  loading?: boolean;
  /** id da seção onde a leitura deve começar (ex.: 'inciso-ii', 'exemplo-2') */
  initialSectionId?: string | null;
  fontSize?: number;
  portalContainer?: HTMLElement | null;
  onClose: () => void;
};

/**
 * Leitor em tela cheia da Explicação / Exemplo do artigo,
 * com menu de alternância entre caput, incisos, parágrafos (ou exemplos).
 */
const ArtigoIAFullscreen = ({
  open,
  mode,
  artigoNumero,
  leiNome,
  sections,
  loading,
  initialSectionId,
  fontSize = 16,
  portalContainer,
  onClose,
}: Props) => {
  const [index, setIndex] = useState(0);
  const chipsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Posiciona na seção pedida sempre que abrir ou o conteúdo chegar.
  useEffect(() => {
    if (!open) return;
    setIndex(resolveSectionIndex(sections, initialSectionId));
  }, [open, initialSectionId, sections]);

  // Mantém o chip ativo visível.
  useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>(`[data-chip-idx="${index}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    bodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [index]);

  // Fecha com Esc e trava o scroll do fundo.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, sections.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, sections.length]);

  const current = sections[index];
  const isExemplo = mode === 'exemplo';
  const accent = isExemplo ? 'text-sky-400' : 'text-primary';

  const markdownComponents = useMemo(
    () => ({
      table: (props: any) => (
        <div className="my-4 -mx-1 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left text-[13px]" {...props} />
        </div>
      ),
      thead: (props: any) => <thead className="bg-secondary/70" {...props} />,
      th: (props: any) => (
        <th className="border-b border-border px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground" {...props} />
      ),
      td: (props: any) => <td className="border-b border-border/60 px-3 py-2 align-top text-foreground/90" {...props} />,
      // react-markdown v9 não passa mais `inline`: consideramos bloco só quando há linguagem.
      code: ({ inline, className, children, ...rest }: any) => {
        const isBlock = inline === false || /language-/.test(className || '');
        return isBlock ? (
          <code className="block overflow-x-auto rounded-xl bg-secondary/60 p-3 text-[13px]" {...rest}>
            {children}
          </code>
        ) : (
          <code
            className="rounded-md bg-amber-400/15 px-1.5 py-0.5 font-legal text-[0.95em] font-semibold text-amber-300 ring-1 ring-amber-400/25"
            {...rest}
          >
            {children}
          </code>
        );
      },

      blockquote: (props: any) => (
        <blockquote
          className="my-3 rounded-r-xl border-l-4 border-amber-400/70 bg-amber-400/5 px-4 py-2.5 font-legal italic text-foreground/85"
          {...props}
        />
      ),
      ol: (props: any) => <ol className="my-3 list-decimal space-y-2 pl-5 leading-[1.75]" {...props} />,
      ul: (props: any) => <ul className="my-3 list-disc space-y-2 pl-5 leading-[1.75]" {...props} />,
      li: (props: any) => <li className="pl-0.5 [&>p]:my-1" {...props} />,
      h2: (props: any) => <h2 className="mt-7 mb-2.5 font-heading text-[1.05em] font-bold text-foreground" {...props} />,
      h3: ({ children, ...rest }: any) => {
        const label = String(
          Array.isArray(children) ? children.join('') : (children ?? ''),
        ).trim();
        const key = label.toLowerCase();
        const meta = key.startsWith('em uma frase')
          ? { icon: Zap, tone: 'text-amber-300', bar: 'bg-amber-400', wrap: 'bg-amber-400/[0.07]' }
          : key.startsWith('exemplo')
            ? { icon: Lightbulb, tone: 'text-sky-300', bar: 'bg-sky-400', wrap: 'bg-sky-400/[0.07]' }
            : key.startsWith('pegadinha')
              ? { icon: AlertTriangle, tone: 'text-rose-300', bar: 'bg-rose-400', wrap: 'bg-rose-400/[0.07]' }
              : { icon: ListTree, tone: 'text-foreground/80', bar: 'bg-border', wrap: 'bg-secondary/40' };
        const Icon = meta.icon;
        return (
          <h3 className="mt-8 mb-3 first:mt-0" {...rest}>
            <span
              className={`flex items-center gap-2.5 overflow-hidden rounded-xl ${meta.wrap} py-2.5 pl-0 pr-3`}
            >
              <span className={`h-6 w-1 shrink-0 rounded-r-full ${meta.bar}`} />
              <Icon className={`h-4 w-4 shrink-0 ${meta.tone}`} />
              <span
                className={`font-heading text-[0.95em] font-bold leading-tight tracking-[0.01em] ${meta.tone}`}
              >
                {children}
              </span>
            </span>
          </h3>
        );
      },

      hr: () => <hr className="my-6 border-border" />,
      p: (props: any) => <p className="my-3 leading-[1.8] tracking-[0.005em] text-foreground/90" {...props} />,
      strong: (props: any) => <strong className="font-bold text-foreground" {...props} />,
    }),
    [],
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{ pointerEvents: 'auto' }}
          data-artigo-ia-fullscreen
          className="absolute inset-0 z-[10020] flex min-h-0 flex-col bg-[#0f0f0f]"
          role="dialog"
          aria-modal="true"
          aria-label={isExemplo ? 'Exemplos práticos' : 'Explicação do artigo'}
        >
          {/* Cabeçalho */}
          <header className="shrink-0 border-b border-border bg-[#0f0f0f]/95 px-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
              {isExemplo ? (
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary ${accent}`}>
                  <Lightbulb className="h-4.5 w-4.5" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {isExemplo ? 'Exemplos práticos' : 'Explicação'}
                </p>
                <p className="truncate font-heading text-sm font-bold text-foreground">
                  {artigoNumero}
                  {leiNome ? <span className="font-normal text-muted-foreground"> · {leiNome}</span> : null}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-foreground/80 transition-colors hover:bg-secondary active:scale-95"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu de alternância */}
            {sections.length > 1 && (
              <div
                ref={chipsRef}
                className="mx-auto mt-3 flex w-full max-w-2xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {sections.map((s, i) => (
                  <button
                    key={s.id}
                    data-chip-idx={i}
                    onClick={() => setIndex(i)}
                    className={[
                      'inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 text-[14px] font-bold transition-colors active:scale-95',
                      i === index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/70 text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    {s.chip}
                  </button>
                ))}
              </div>
            )}

          </header>

          {/* Corpo */}
          <div
            ref={bodyRef}
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-[calc(6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-5"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="mx-auto w-full max-w-2xl">
              {loading && !sections.length ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="font-body text-sm text-muted-foreground">
                    {isExemplo ? 'Montando exemplos práticos…' : 'Gerando explicação detalhada…'}
                  </p>
                </div>
              ) : !current ? (
                <p className="py-24 text-center font-body text-sm text-muted-foreground">
                  Conteúdo indisponível. Tente novamente.
                </p>
              ) : (
                <motion.article
                  key={current.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className="font-body text-foreground/90"
                  style={{ fontSize: `${fontSize}px`, touchAction: 'pan-y' }}
                >
                  <h1 className={`mb-3 font-heading text-xl font-black ${accent}`}>{current.title}</h1>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {current.body}
                  </ReactMarkdown>
                </motion.article>
              )}
            </div>
          </div>

          {/* Navegação inferior */}
          {sections.length > 1 && (
            <footer className="shrink-0 border-t border-border bg-[#0f0f0f]/95 px-4 py-3 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] backdrop-blur-md">
              <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
                <button
                  onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                  disabled={index === 0}
                  className="inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-secondary px-5 text-[15px] font-semibold text-foreground active:scale-95 disabled:opacity-35"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Anterior
                </button>
                <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
                  {index + 1} / {sections.length}
                </span>
                <button
                  onClick={() => setIndex((i) => Math.min(i + 1, sections.length - 1))}
                  disabled={index >= sections.length - 1}
                  className="inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground active:scale-95 disabled:opacity-35"
                >
                  Próximo
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </footer>

          )}
        </motion.div>
      )}
    </AnimatePresence>,
    portalContainer ?? document.body,
  );
};

export default ArtigoIAFullscreen;
