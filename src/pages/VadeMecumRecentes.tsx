import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, History, Trash2 } from 'lucide-react';
import { getRecentes, clearRecentes, pushRecente, type LeiRecente } from '@/lib/leisRecentes';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import VadeMecumSubpage from '@/components/vademecum/VadeMecumSubpage';

const VadeMecumRecentes = () => {
  const navigate = useNavigate();
  const [recentes, setRecentes] = useState<LeiRecente[]>([]);

  useEffect(() => {
    setRecentes(getRecentes());
  }, []);

  return (
    <VadeMecumSubpage titulo="Recentes" descricao="Últimas leis que você consultou">
      {recentes.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma consulta recente.</p>
        </div>
      ) : (
        <>
          <button
            onClick={() => {
              clearRecentes();
              setRecentes([]);
            }}
            className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar histórico
          </button>
          <div className="space-y-2">
            {recentes.map((l) => (
              <button
                key={l.leiId}
                onClick={() => {
                  pushRecente(l);
                  navigate(`/legislacao/${tipoToSlug(l.tipo)}/${leiToSlug({ id: l.leiId, nome: l.nome })}`);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-colors"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-foreground font-semibold text-sm truncate">{l.nome}</span>
                  <span className="block text-muted-foreground text-xs truncate">{l.descricao}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}
    </VadeMecumSubpage>
  );
};

export default VadeMecumRecentes;
