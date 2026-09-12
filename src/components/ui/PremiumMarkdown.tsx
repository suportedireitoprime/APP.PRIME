import React from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PremiumBadge, BadgeType } from './PremiumBadge';

interface PremiumMarkdownProps extends Options {
  children: string;
}

const regexBadges = /(\[(?:DICA|ATENÇÃO|ATENCAO|O QUE É|EXEMPLO|EXEMPLO RÁPIDO|JURISPRUDÊNCIA|JURISPRUDENCIA|SÚMULA|SUMULA|IMPORTANTE)\])/gi;

const processChildren = (children: React.ReactNode): React.ReactNode => {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      const parts = child.split(regexBadges);
      if (parts.length === 1) return child;
      
      return parts.map((part, i) => {
        if (regexBadges.test(part)) {
          // Extrai o tipo removendo colchetes
          const type = part.replace(/[\[\]]/g, '');
          return <PremiumBadge key={i} type={type} />;
        }
        return part;
      });
    }
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { ...child.props }, processChildren(child.props.children));
    }
    return child;
  });
};

export const PremiumMarkdown: React.FC<PremiumMarkdownProps> = ({ children, components, ...props }) => {
  return (
    <ReactMarkdown
      {...props}
      remarkPlugins={[remarkGfm, ...(props.remarkPlugins || [])]}
      components={{
        ...components,
        p: ({ children: pChildren, ...pProps }) => <p {...pProps}>{processChildren(pChildren)}</p>,
        li: ({ children: liChildren, ...liProps }) => <li {...liProps}>{processChildren(liChildren)}</li>,
        span: ({ children: spanChildren, ...spanProps }) => <span {...spanProps}>{processChildren(spanChildren)}</span>,
        div: ({ children: divChildren, ...divProps }) => <div {...divProps}>{processChildren(divChildren)}</div>,
        h1: ({ children: hChildren, ...hProps }) => <h1 {...hProps}>{processChildren(hChildren)}</h1>,
        h2: ({ children: hChildren, ...hProps }) => <h2 {...hProps}>{processChildren(hChildren)}</h2>,
        h3: ({ children: hChildren, ...hProps }) => <h3 {...hProps}>{processChildren(hChildren)}</h3>,
        h4: ({ children: hChildren, ...hProps }) => <h4 {...hProps}>{processChildren(hChildren)}</h4>,
        strong: ({ children: sChildren, ...sProps }) => <strong {...sProps}>{processChildren(sChildren)}</strong>,
        em: ({ children: eChildren, ...eProps }) => <em {...eProps}>{processChildren(eChildren)}</em>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
