import React from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { PremiumBadge, BadgeType } from './PremiumBadge';

interface PremiumMarkdownProps extends Options {
  children: string;
}

export const PremiumMarkdown: React.FC<PremiumMarkdownProps> = ({ children, components, ...props }) => {
  // Regex flexível para capturar as palavras-chave entre colchetes ou apenas a palavra solta no início/meio?
  // Normalmente a IA retorna como [DICA], [ATENÇÃO], etc.
  const regex = /\[(DICA|ATENÇÃO|ATENCAO|O QUE É|EXEMPLO|EXEMPLO RÁPIDO|JURISPRUDÊNCIA|JURISPRUDENCIA|SÚMULA|SUMULA|IMPORTANTE)\]/gi;
  
  // Transformamos as chaves em uma tag HTML customizada que o rehype-raw vai interpretar
  const processedText = children.replace(regex, '<premium-badge type="$1">$1</premium-badge>');

  return (
    <ReactMarkdown
      {...props}
      remarkPlugins={[remarkGfm, ...(props.remarkPlugins || [])]}
      rehypePlugins={[rehypeRaw, ...(props.rehypePlugins || [])]}
      components={{
        ...components,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - tag customizada html
        'premium-badge': ({ node, type, children: badgeChildren, ...rest }) => (
          <PremiumBadge type={type || badgeChildren?.[0] || 'INFO'} />
        ),
      }}
    >
      {processedText}
    </ReactMarkdown>
  );
};
