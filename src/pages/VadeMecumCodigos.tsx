import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import VadeMecumSubpage from '@/components/vademecum/VadeMecumSubpage';

const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const GRUPOS = [
  { id: 'constituicao', label: 'Constituição' },
  { id: 'codigo', label: 'Códigos' },
  { id: 'estatuto', label: 'Estatutos' },
];

const VadeMecumCodigos = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const grupos = useMemo(() => {
    const query = norm(q.trim());
    return GRUPOS.map((g) => ({
      ...g,
      leis: LEIS_CATALOG.filter(
        (l) =>
          l.tipo === g.id &&
          (!query || norm(`${l.nome} ${l.sigla} ${l.descricao}`).includes(query)),
      ),
    })).filter((g) => g.leis.length > 0);
  }, [q]);

  return (
    <VadeMecumSubpage titulo="Códigos" descricao="Constituição, códigos e estatutos na íntegra">
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar código ou estatuto…"
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-6">
        {grupos.map((g) => (
          <section key={g.id}>
            <h2 className="font-display text-foreground text-[17px] font-bold mb-3">{g.label}</h2>
            <div className="space-y-2">
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
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-semibold text-sm truncate">{l.nome}</p>
                    <p className="text-muted-foreground text-xs truncate">{l.descricao}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </section>
        ))}
        {grupos.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-10">Nenhum resultado.</p>
        )}
      </div>
    </VadeMecumSubpage>
  );
};

export default VadeMecumCodigos;
