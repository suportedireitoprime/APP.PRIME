import React, { useState } from 'react';
import { List, Search, X } from 'lucide-react';
import type { Pagina } from '@/hooks/domain/useLeitorPaginas';

interface LeitorTocRailDesktopProps {
  tocItems: any[];
  currentPage?: Pagina;
  capitulos: any[];
  chapterRanges: Map<number, { start: number; end: number }>;
  railExpanded: boolean;
  setRailExpanded: (v: boolean | ((prev: boolean) => boolean)) => void;
  jumpToChapter: (idx: number) => void;
  jumpToOcrPage: (page: number) => void;
  tema: {
    bg: string;
    text: string;
    border: string;
  };
  dark: boolean;
}

export const LeitorTocRailDesktop: React.FC<LeitorTocRailDesktopProps> = ({
  tocItems,
  currentPage,
  capitulos,
  chapterRanges,
  railExpanded,
  setRailExpanded,
  jumpToChapter,
  jumpToOcrPage,
  tema,
  dark,
}) => {
  const [tocQuery, setTocQuery] = useState('');

  const tocFiltrado = tocQuery.trim()
    ? tocItems.filter((s: any) =>
        String(s.titulo || '').toLowerCase().includes(tocQuery.trim().toLowerCase())
      )
    : tocItems;

  return (
    <aside
      aria-label="Sumário do livro"
      onMouseEnter={() => setRailExpanded(true)}
      onMouseLeave={() => {
        if (localStorage.getItem('leitura-nativa:rail-open') === '0') {
          setRailExpanded(false);
        }
      }}
      className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 z-[1305] border-r transition-[width] duration-300 ease-out backdrop-blur-md pt-[3.75rem]"
      style={{
        width: railExpanded ? 300 : 56,
        background: `${tema.bg}f2`,
        borderColor: tema.border,
        color: tema.text,
      }}
    >
      <div
        className={`flex items-center gap-2 border-b shrink-0 ${railExpanded ? 'px-3 h-12' : 'px-2 h-12'}`}
        style={{ borderColor: `${tema.text}1a` }}
      >
        <button
          onClick={() => {
            setRailExpanded((prev) => {
              const next = !prev;
              localStorage.setItem('leitura-nativa:rail-open', next ? '1' : '0');
              return next;
            });
          }}
          className="w-10 h-10 flex items-center justify-center rounded-lg transition shrink-0"
          aria-label={railExpanded ? 'Recolher sumário' : 'Expandir sumário'}
          title={railExpanded ? 'Recolher sumário' : 'Expandir sumário'}
        >
          <List className="w-5 h-5" />
        </button>
        {railExpanded && (
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <p className="text-[15px] font-semibold truncate leading-tight">Sumário</p>
            <p className="text-[11px] opacity-55 truncate shrink-0">
              {tocItems.length} {tocItems.length === 1 ? 'cap.' : 'caps.'}
            </p>
          </div>
        )}
      </div>

      {railExpanded && (
        <div className="px-3 pt-2 pb-1 shrink-0">
          <div
            className="flex items-center gap-2 rounded-lg px-3 h-10 border"
            style={{
              borderColor: `${tema.text}1f`,
              background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            }}
          >
            <Search className="w-4 h-4 opacity-50 shrink-0" />
            <input
              value={tocQuery}
              onChange={(e) => setTocQuery(e.target.value)}
              placeholder="Buscar capítulo…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-50"
              style={{ color: tema.text }}
            />
            {tocQuery && (
              <button
                onClick={() => setTocQuery('')}
                aria-label="Limpar busca"
                className="opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={
          railExpanded ? 'flex-1 overflow-y-auto py-2' : 'flex-1 overflow-y-auto p-2 space-y-1'
        }
      >
        {railExpanded && tocFiltrado.length === 0 && (
          <p className="px-4 py-6 text-sm opacity-60">Nenhum capítulo encontrado.</p>
        )}
        {(railExpanded ? tocFiltrado : tocItems).map((s: any, idx) => {
          const active = currentPage && s.chapterIdx === currentPage.chapterIdx;
          const onClick =
            typeof s.chapterIdx === 'number' && capitulos.length
              ? () => jumpToChapter(s.chapterIdx)
              : () => jumpToOcrPage(s.ocrPage);

          if (!railExpanded) {
            return (
              <button
                key={idx}
                onClick={() => {
                  setRailExpanded(true);
                  localStorage.setItem('leitura-nativa:rail-open', '1');
                  onClick();
                }}
                className={`group relative w-10 h-9 mx-auto flex items-center justify-center rounded-md text-[12px] font-semibold tabular-nums transition ${
                  active
                    ? dark
                      ? 'bg-primary/25 text-primary'
                      : 'bg-primary/15 text-primary'
                    : dark
                    ? 'text-white/60 hover:bg-white/5 hover:text-white'
                    : 'text-black/60 hover:bg-black/5 hover:text-black'
                }`}
                aria-label={`${s.titulo} — pág. ${s.ocrPage ?? ''}`}
                title={`${s.titulo} — pág. ${s.ocrPage ?? ''}`}
              >
                {s.ocrPage ?? idx + 1}
              </button>
            );
          }

          const range =
            typeof s.chapterIdx === 'number' ? chapterRanges.get(s.chapterIdx) : undefined;
          const rangeLabel = range
            ? range.start === range.end
              ? `p. ${range.start}`
              : `p. ${range.start}–${range.end}`
            : s.ocrPage
            ? `p. ${s.ocrPage}`
            : null;
          const isLast = idx === tocItems.length - 1;

          return (
            <div key={idx} className="px-2">
              <button
                onClick={onClick}
                className={`w-full text-left px-3 py-3 rounded-lg transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  active
                    ? dark
                      ? 'bg-primary/20 text-primary'
                      : 'bg-primary/15 text-primary'
                    : dark
                    ? 'hover:bg-white/5'
                    : 'hover:bg-black/5'
                }`}
                style={{ paddingLeft: 12 + (s.nivel - 1) * 14 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[15px] leading-snug font-medium flex-1 min-w-0">
                    {s.titulo}
                  </span>
                  {rangeLabel && (
                    <span
                      className={`text-[11px] tabular-nums shrink-0 mt-0.5 px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-primary/20 text-primary'
                          : dark
                          ? 'bg-white/5 text-white/60'
                          : 'bg-black/5 text-black/60'
                      }`}
                    >
                      {rangeLabel}
                    </span>
                  )}
                </div>
              </button>
              {!isLast && (
                <div
                  className="mx-3 h-px"
                  style={{ background: `${tema.text}14` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
