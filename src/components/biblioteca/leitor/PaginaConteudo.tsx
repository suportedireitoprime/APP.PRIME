import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Tema } from '@/hooks/useLeitorPrefs';

export interface PaginaData {
  index: number;
  ocrPage: number;
  chapterTitulo: string;
  md: string;
  cover?: { numero?: string; titulo: string };
}

interface Props {
  pagina: PaginaData;
  tema: Tema;
  fonte: { family: string };
  fontSize: number;
  lineHeight: number;
  alinhamento: 'justify' | 'left';
  /** Reduz paddings/máx-largura para colunas estreitas (folhear em mobile). */
  compact?: boolean | 'mobile-flip';
}

/**
 * Renderiza o conteúdo de uma página do leitor (capa de capítulo ou markdown).
 * Extraído de LeitorNativo para ser reutilizado tanto no AnimatePresence
 * quanto no LeitorFolhear (StPageFlip).
 */
const PaginaConteudo = ({ pagina, tema, fonte, fontSize, lineHeight, alinhamento, compact }: Props) => {
  const dark = tema.isDark;
  const isMobileFlip = compact === 'mobile-flip';

  if (pagina.cover) {
    return (
      <div
        data-reader-article
        className={
          isMobileFlip
            ? 'w-full h-full max-w-none px-4 pt-20 pb-24 flex flex-col justify-start text-left gap-5 box-border overflow-hidden'
            : compact
              ? 'w-full h-full max-w-none px-6 pt-20 pb-24 flex flex-col justify-start text-left gap-5 box-border overflow-hidden'
              : 'mx-auto max-w-2xl md:max-w-3xl lg:max-w-4xl px-6 md:px-10 h-full min-h-[70vh] flex flex-col items-center justify-center text-center gap-6 py-16'
        }
      >
        <div className={`w-16 h-[2px] rounded-full ${dark ? 'bg-primary/80' : 'bg-primary'}`} />
        {pagina.cover.numero && (
          <p
            className="uppercase tracking-[0.3em] text-xs opacity-70"
            style={{ fontFamily: fonte.family }}
          >
            {pagina.cover.numero}
          </p>
        )}
        <h1
          className="font-bold leading-[1.1] break-words hyphens-none max-w-full"
          style={{
            fontFamily: fonte.family,
            fontSize: isMobileFlip
              ? `clamp(1.55rem, ${Math.round(fontSize * 1.45)}px, 2.15rem)`
              : `clamp(1.6rem, ${Math.round(fontSize * 1.55)}px, 2.4rem)`,
            wordBreak: 'normal',
            overflowWrap: 'break-word',
            hyphens: 'none',
            WebkitHyphens: 'none',
          }}
          lang="pt-BR"
        >
          {pagina.cover.titulo}
        </h1>
        <div className={`w-16 h-[2px] rounded-full ${dark ? 'bg-primary/80' : 'bg-primary'}`} />
        <p className="opacity-50 text-xs mt-2">Deslize para começar o capítulo</p>
      </div>
    );
  }

  // O vermelho da marca fica escuro demais sobre o fundo escuro do leitor:
  // clareamos o realce dentro do texto conforme o tema.
  const accent = dark ? 'hsl(348 92% 70%)' : 'hsl(348 72% 44%)';
  const accentSoft = dark ? 'hsl(348 92% 70% / 0.14)' : 'hsl(348 72% 44% / 0.10)';

  return (
    <article
      data-reader-article
      className={
        isMobileFlip
          ? 'w-full max-w-none px-4 pt-3 pb-24 select-text box-border overflow-x-hidden break-words'
          : compact
            ? 'w-full max-w-none px-5 sm:px-6 pt-4 pb-24 select-text box-border overflow-x-hidden break-words'
          : 'mx-auto max-w-2xl md:max-w-[74ch] lg:max-w-[82ch] xl:max-w-[88ch] px-6 md:px-8 lg:px-10 pt-4 pb-40 select-text'
      }
      style={{
        fontSize,
        fontFamily: fonte.family,
        lineHeight,
        width: '100%',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="text-2xl font-bold mt-6 mb-3" {...p} />,
          h2: (p) => <h2 className="text-xl font-bold mt-5 mb-2" {...p} />,
          h3: (p) => <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: accent }} {...p} />,
          p: ({ node, ...p }) => (
            <p
              className="mb-4 hyphens-auto break-words max-w-full"
              style={{ textAlign: alinhamento === 'justify' ? 'justify' : 'left' }}
              {...p}
            />
          ),
          strong: ({ children, ...rest }) => {
            const text = String(Array.isArray(children) ? children.join('') : children ?? '');
            const isCitacao = /\b(art\.?|artigo|lei|s[úu]mula|cf\/?88|c[cp]c|c[dl]t|cpp?|cf|cc|cp)\b/i.test(text);
            return (
              <strong
                {...rest}
                className="font-semibold"
                style={
                  isCitacao
                    ? { color: accent, background: accentSoft, padding: '1px 4px', borderRadius: 3 }
                    : undefined
                }
              >
                {children}
              </strong>
            );
          },
          em: (p) => <em className="italic" style={{ color: accent }} {...p} />,
          img: (p) => (
            <img
              {...p}
              className="my-5 rounded-lg mx-auto max-w-full h-auto shadow"
              loading="lazy"
              alt={p.alt || ''}
            />
          ),
          blockquote: (p) => (
            <blockquote
              className="pl-4 italic opacity-90 my-4 border-l-4"
              style={{ borderColor: accent }}
              {...p}
            />
          ),
          code: (p) => (
            <code
              className="px-1.5 py-0.5 rounded bg-muted text-[0.9em]"
              style={{ color: accent }}
              {...p}
            />
          ),
        }}

      >
        {pagina.md}
      </ReactMarkdown>
    </article>
  );
};

export default PaginaConteudo;
