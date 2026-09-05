import { ArrowLeft, Columns, Search } from 'lucide-react';

interface PdfReaderHeaderProps {
  titulo: string;
  onClose: () => void;
  isDesktop: boolean;
  dualPage: boolean;
  onToggleDualPage: () => void;
  onOpenBusca: () => void;
}

export default function PdfReaderHeader({
  titulo,
  onClose,
  isDesktop,
  dualPage,
  onToggleDualPage,
  onOpenBusca,
}: PdfReaderHeaderProps) {
  return (
    <div
      className="flex items-center gap-3 shrink-0 bg-neutral-950/95 backdrop-blur border-b border-white/5"
      style={{
        paddingTop: 'calc(var(--sai-top) + 0.875rem)',
        paddingBottom: '0.875rem',
        paddingLeft: 'calc(1rem + var(--sai-left))',
        paddingRight: 'calc(1rem + var(--sai-right))',
        minHeight: 'calc(5rem + var(--sai-top))',
      }}
    >
      <button
        onClick={onClose}
        aria-label="Voltar"
        className="w-12 h-12 md:w-11 md:h-11 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/15 flex items-center justify-center shrink-0 active:scale-95 transition"
      >
        <ArrowLeft className="w-[22px] h-[22px] text-white" />
      </button>
      <p className="flex-1 min-w-0 text-center font-display text-[18px] md:text-[17px] font-semibold text-white tracking-wide truncate">
        {titulo}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        {isDesktop && (
          <button
            onClick={onToggleDualPage}
            title={dualPage ? 'Alternar para visão de 1 página' : 'Alternar para visão lado a lado (2 páginas)'}
            className={`px-3 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition ${
              dualPage
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-white/[0.06] border-white/10 text-neutral-300 hover:bg-white/15'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span className="hidden sm:inline">{dualPage ? '2 Páginas' : '1 Página'}</span>
          </button>
        )}
        <button
          onClick={onOpenBusca}
          aria-label="Procurar no PDF"
          className="w-12 h-12 md:w-11 md:h-11 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/15 flex items-center justify-center transition"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
