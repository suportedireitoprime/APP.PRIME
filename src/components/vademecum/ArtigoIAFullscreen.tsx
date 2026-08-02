import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2, Sparkles, Lightbulb } from 'lucide-react';
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
      code: ({ inline, children, ...rest }: any) =>
        inline ? (
          <code
            className="rounded-md bg-amber-400/15 px-1.5 py-0.5 font-legal text-[0.95em] font-semibold text-amber-300 ring-1 ring-amber-400/25"
            {...rest}
          >
            {children}
          </code>
        ) : (
          <code className="block overflow-x-auto rounded-xl bg-secondary/60 p-3 text-[13px]" {...rest}>
            {children}
          </code>
        ),
      blockquote: (props: any) => (
        <blockquote
          className="my-3 rounded-r-xl border-l-4 border-amber-400/70 bg-amber-400/5 px-4 py-2.5 font-legal italic text-foreground/85"
          {...props}
        />
      ),
      ol: (props: any) => <ol className="my-2 list-decimal space-y-1.5 pl-5" {...props} />,
      ul: (props: any) => <ul className="my-2 list-disc space-y-1.5 pl-5" {...props} />,
      h2: (props: any) => <h2 className="mt-5 mb-2 font-heading text-base font-bold text-foreground" {...props} />,
      h3: (props: any) => (
        <h3 className="mt-4 mb-1.5 font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground" {...props} />
      ),
      hr: () => <hr className="my-5 border-border" />,
      p: (props: any) => <p className="my-2 leading-relaxed" {...props} />,
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
          className="fixed inset-0 z-[10020] flex flex-col bg-[#0f0f0f]"
          role="dialog"
          aria-modal="true"
          aria-label={isExemplo ? 'Exemplos práticos' : 'Explicação do artigo'}
        >
          {/* Cabeçalho */}
          <header className="shrink-0 border-b border-border bg-[#0f0f0f]/95 px-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary ${accent}`}>
                {isExemplo ? <Lightbulb className="h-4.5 w-4.5" /> : <Sparkles className="h-[18px] w-[18px]" />}
              </div>
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
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu de alternância */}
            {sections.length > 1 && (
              <div
                ref={chipsRef}
                className="mx-auto mt-3 flex w-full max-w-2xl gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {sections.map((s, i) => (
                  <button
                    key={s.id}
                    data-chip-idx={i}
                    onClick={() => setIndex(i)}
                    className={[
                      'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors',
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
            className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-5"
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
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.12}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -70) setIndex((i) => Math.min(i + 1, sections.length - 1));
                    if (info.offset.x > 70) setIndex((i) => Math.max(i - 1, 0));
                  }}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className="font-body text-foreground/90"
                  style={{ fontSize: `${fontSize}px` }}
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-[13px] font-semibold text-foreground disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {index + 1} / {sections.length}
                </span>
                <button
                  onClick={() => setIndex((i) => Math.min(i + 1, sections.length - 1))}
                  disabled={index >= sections.length - 1}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground disabled:opacity-35"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </footer>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ArtigoIAFullscreen;
