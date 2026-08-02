import { Fragment, type ReactNode } from 'react';

/**
 * Remove marcações de Markdown que vêm do banco (**negrito**, *itálico*,
 * `código`, ### títulos, listas com - ou *) deixando só o texto limpo.
 */
export function limparMarkdown(texto: string, trim = true): string {
  if (!texto) return '';
  const out = texto
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '• ')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\S)\*([^*\n]+)\*(?!\S)/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
  return trim ? out.trim() : out;
}

/**
 * Renderiza o texto respeitando **negrito** e removendo o restante do Markdown.
 */
export function RichTexto({ texto, className }: { texto: string; className?: string }) {
  if (!texto) return null;
  const partes = texto.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <span className={className}>
      {partes.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className="font-semibold text-foreground">
            {limparMarkdown(p.slice(2, -2))}
          </strong>
        ) : (
          <Fragment key={i}>{limparMarkdown(p, false)}</Fragment>
        ),
      ) as ReactNode}
    </span>
  );
}
