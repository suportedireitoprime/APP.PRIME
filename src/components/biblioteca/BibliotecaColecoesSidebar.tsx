import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Search, LayoutGrid } from 'lucide-react';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';

/**
 * Menu lateral esquerdo da Biblioteca no desktop: navegação por coleções
 * (com filtro rápido), aproveitando a margem lateral que antes ficava vazia.
 */
const BibliotecaColecoesSidebar = () => {
  const navigate = useNavigate();
  const colecoes = useVisibleColecoes();
  const [q, setQ] = useState('');

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return colecoes;
    return colecoes.filter(
      (c) =>
        c.label.toLowerCase().includes(t) ||
        (c.subtitle ?? '').toLowerCase().includes(t) ||
        (c.eyebrow ?? '').toLowerCase().includes(t)
    );
  }, [colecoes, q]);

  return (
    <div className="sticky top-4 rounded-3xl border border-border/50 bg-card overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4 text-primary" />
          <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary/90">
            Coleções
          </p>
        </div>
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar coleções"
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-secondary/40 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <nav className="max-h-[62vh] overflow-y-auto py-2">
        {filtradas.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/bibliotecas/${c.id}`)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-secondary/50 transition-colors group"
          >
            <span className="w-9 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
              {c.cover && (
                <img src={c.cover} alt="" loading="lazy" className="w-full h-full object-cover" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {c.label}
              </span>
              <span className="block text-[10px] text-muted-foreground truncate">
                {c.eyebrow}
              </span>
            </span>
          </button>
        ))}
        {filtradas.length === 0 && (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">
            Nenhuma coleção encontrada.
          </p>
        )}
      </nav>

      <button
        type="button"
        onClick={() => navigate('/bibliotecas')}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Ver acervo completo
      </button>
    </div>
  );
};

export default BibliotecaColecoesSidebar;
