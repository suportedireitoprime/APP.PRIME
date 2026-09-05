import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLeisPorTipo } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';

interface DesktopCategoriaSheetProps {
  open: boolean;
  tipo: string | null;
  label: string;
  color?: string;
  onClose: () => void;
}

/**
 * Painel que sobe de baixo para cima no desktop, listando as leis da categoria
 * clicada no menu lateral (mesmo comportamento do bottom sheet do mobile).
 */
const DesktopCategoriaSheet = ({ open, tipo, label, color = 'hsl(var(--primary))', onClose }: DesktopCategoriaSheetProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open, tipo]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const leis = useMemo(() => (tipo ? getLeisPorTipo(tipo) : []), [tipo]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leis;
    return leis.filter(l =>
      l.nome.toLowerCase().includes(q) ||
      (l.sigla || '').toLowerCase().includes(q) ||
      (l.descricao || '').toLowerCase().includes(q)
    );
  }, [leis, query]);

  if (!open || !tipo) return null;

  const abrir = (lei: Parameters<typeof leiPath>[0]) => {
    onClose();
    navigate(leiPath(lei));
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-[980px] mx-auto rounded-t-3xl bg-card border border-border border-b-0 shadow-2xl overflow-hidden"
        style={{ maxHeight: '78vh', animation: 'slide-in-bottom 260ms cubic-bezier(0.22,0.61,0.36,1)' }}
      >
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}26` }}
          >
            <BookOpen className="w-5 h-5" style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg text-foreground leading-tight truncate">{label}</h2>
            <p className="text-xs font-body text-muted-foreground">
              {leis.length} {leis.length === 1 ? 'norma disponível' : 'normas disponíveis'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-11 h-11 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-border/60">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar em ${label.toLowerCase()}...`}
              className="w-full h-11 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(78vh - 150px)' }}>
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Nenhuma norma encontrada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filtered.map((lei) => (
                <button
                  key={lei.id}
                  type="button"
                  onClick={() => abrir(lei)}
                  className="group flex items-center gap-3 text-left rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-primary/40 transition-colors px-4 h-[76px]"
                >
                  <span
                    className="w-1.5 h-9 rounded-full shrink-0"
                    style={{ backgroundColor: lei.iconColor || color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-body text-sm text-foreground truncate">{lei.nome}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">
                      {lei.sigla ? `${lei.sigla} — ` : ''}{lei.descricao}
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DesktopCategoriaSheet;
