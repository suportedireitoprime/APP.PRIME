import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import ContagemRegressiva from '@/components/questoes/ContagemRegressiva';
import { useQuestoesSessao } from '@/hooks/useQuestoes';
import { lerFiltroSalvo } from '@/components/questoes/QuestoesFiltroSheet';
import { useGoBack } from '@/hooks/useGoBack';

const QuestoesPraticar = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [params] = useSearchParams();
  const area = params.get('area');
  const nivel = params.get('nivel');
  const cargoId = params.get('cargo');
  const usaFiltro = params.get('filtro') === '1';
  const qtdParam = Number(params.get('qtd'));
  const limite = Number.isFinite(qtdParam) && qtdParam > 0 ? qtdParam : undefined;

  const filtro = useMemo(() => (usaFiltro ? lerFiltroSalvo() : null), [usaFiltro]);
  const [contando, setContando] = useState(true);

  const { questoes, loading, recarregar, registrar } = useQuestoesSessao({
    area, nivel, cargoId, limite, novas: !filtro, filtro,
  });

  return (
    <div className="theme-questoes min-h-screen bg-background pb-safe">
      {contando && <ContagemRegressiva onFim={() => setContando(false)} />}
      
      <ResolverPadrao
        questoes={questoes}
        loading={loading || contando}
        contexto="pratica"
        onRegistrar={registrar}
        onNovoBloco={recarregar}
        onBack={() => goBack()}
        vazioTexto="Nenhuma questão encontrada com esses filtros. Ajuste o filtro e tente de novo."
      />
    </div>
  );
};

export default QuestoesPraticar;
