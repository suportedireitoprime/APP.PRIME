import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import VadeMecumSubpage from '@/components/vademecum/outros/VadeMecumSubpage';

const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export interface VadeMecumCategoriaGrupo {
  id: string;
  label?: string;
}

interface VadeMecumCategoriaListaProps {
  titulo: string;
  descricao: string;
  placeholder: string;
  grupos: VadeMecumCategoriaGrupo[];
  emptyText: string;
  headerColorClass?: string;
  layout?: 'list' | 'grid';
  badgeClassName?: string;
  fallbackIcon?: ReactNode;
  emptyIcon?: ReactNode;
}

export function VadeMecumCategoriaLista({
  titulo,
  descricao,
  placeholder,
  grupos,
  emptyText,
  headerColorClass,
  layout = 'grid',
  badgeClassName = 'bg-primary/10 border-primary/20 text-primary',
  fallbackIcon,
  emptyIcon,
}: VadeMecumCategoriaListaProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const gruposFiltrados = useMemo(() => {
    const query = norm(q.trim());
    return grupos
      .map((g) => ({
        ...g,
        leis: LEIS_CATALOG.filter(
          (l) =>
            l.tipo === g.id &&
            (!query || norm(`${l.nome} ${l.sigla} ${l.descricao} ${(l.tags || []).join(' ')}`).includes(query)),
        ),
      }))
      .filter((g) => g.leis.length > 0);
  }, [grupos, q]);

  const containerClass =
    layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3' : 'space-y-2';

  return (
    <VadeMecumSubpage titulo={titulo} descricao={descricao} headerColorClass={headerColorClass}>
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
        />
      </div>

      <div className="space-y-6">
        {gruposFiltrados.map((g) => (
          <section key={g.id}>
            {g.label && (
              <h2 className="font-display text-foreground text-[17px] font-bold mb-3">{g.label}</h2>
            )}
            <div className={containerClass}>
              {g.leis.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    pushRecente({
                      tipo: l.tipo,
                      leiId: l.id,
                      nome: l.nome,
                      descricao: l.descricao,
                      tabela_nome: l.tabela_nome,
                    });
                    navigate(leiPath(l));
                  }}
                  className="w-full group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 text-left hover:border-primary/50 hover:bg-card/90 hover:scale-[1.01] active:scale-[0.98] transition-all focus-visible:outline-none shadow-sm cursor-pointer"
                >
                  {fallbackIcon !== undefined && (
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 font-bold text-xs font-display ${badgeClassName}`}
                    >
                      {l.sigla || fallbackIcon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {l.nome}
                    </p>
                    <p className="text-muted-foreground text-xs truncate">{l.descricao}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </section>
        ))}

        {gruposFiltrados.length === 0 && (
          <div className="py-12 text-center">
            {emptyIcon}
            <p className="text-muted-foreground text-sm">{emptyText}</p>
          </div>
        )}
      </div>
    </VadeMecumSubpage>
  );
}
