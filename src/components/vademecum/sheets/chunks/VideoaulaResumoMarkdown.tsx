import React from 'react';

export const resumoMdComponents = {
  h2: ({ children, ...props }: any) => (
    <h2 {...props} className="text-[15px] font-display font-bold text-foreground mt-5 mb-2 flex items-center gap-2">
      <span className="w-1.5 h-5 bg-primary/60 rounded-full shrink-0" />
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 {...props} className="text-[14px] font-display font-semibold text-primary mt-4 mb-1.5 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary/40 rounded-full shrink-0" />
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (<p {...props} className="text-foreground/85 leading-[1.85] font-body my-2 text-[14px]">{children}</p>),
  ul: ({ children, ...props }: any) => (<ul {...props} className="my-2 space-y-1.5 list-none pl-0">{children}</ul>),
  ol: ({ children, ...props }: any) => (<ol {...props} className="my-2 space-y-1.5 list-decimal pl-5 marker:text-primary/60">{children}</ol>),
  li: ({ children, ...props }: any) => (
    <li {...props} className="flex items-start gap-2 text-foreground/85 font-body leading-[1.8] text-[14px]">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children, ...props }: any) => (<strong {...props} className="text-foreground font-bold">{children}</strong>),
  blockquote: ({ children, ...props }: any) => (
    <blockquote {...props} className="border-l-4 border-l-primary bg-primary/5 rounded-r-xl py-3 px-4 my-4 italic text-foreground/80 font-body text-[13.5px]">{children}</blockquote>
  ),
  hr: () => (
    <div className="my-5 flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
      <div className="flex-1 h-px bg-border" />
    </div>
  ),
};

