import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { LEI_SECA_CATEGORIAS } from './VideoaulasLeiSeca';
import { pushRecente } from '@/lib/leisRecentes';

const VideoaulasLeiSecaCategoria = () => {
  const { categoriaId } = useParams();
  const navigate = useNavigate();

  const categoria = useMemo(() => {
    return LEI_SECA_CATEGORIAS.find((c) => c.id === categoriaId);
  }, [categoriaId]);

  const leis = useMemo(() => {
    if (!categoria) return [];
    return categoria.leis
      .map((id) => LEIS_CATALOG.find((l) => l.id === id))
      .filter(Boolean) as typeof LEIS_CATALOG;
  }, [categoria]);

  if (!categoria) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-muted-foreground text-sm">Categoria não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader
        title={categoria.label}
        description="Selecione a lei para ver as videoaulas"
        onBack={() => navigate('/videoaulas/lei-seca')}
        theme="red"
      />
      <div className="px-5 mt-8 space-y-2">
        {leis.map((l) => (
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
              navigate(`/videoaulas/lei-seca/lei/${l.id}`);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-card border border-border/80 text-left hover:border-primary/50 transition-all active:scale-[0.98]"
          >
            <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${categoria.bg}`}>
              <categoria.icon className={`w-6 h-6 ${categoria.color}`} strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground font-bold text-[15px] truncate">{l.nome}</p>
              <p className="text-muted-foreground text-xs truncate mt-0.5">{l.descricao}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoaulasLeiSecaCategoria;
