import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import ContagemRegressiva from '@/components/questoes/ContagemRegressiva';
import { useQuestoesSessao } from '@/hooks/useQuestoes';
import { lerFiltroSalvo } from '@/components/questoes/QuestoesFiltroSheet';

const QuestoesPraticar = () => {
  const navigate = useNavigate();
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
    <div className="theme-questoes min-h-screen bg-background pb-8">
      {contando && <ContagemRegressiva onFim={() => setContando(false)} />}
      <PageHeader
        title={area ?? (nivel === 'iniciante' ? 'Iniciante' : 'Praticar')}
        subtitle="Questões comentadas"
        onBack={() => navigate(-1)}
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
        <ResolverPadrao
          questoes={questoes}
          loading={loading || contando}
          contexto="pratica"
          onRegistrar={registrar}
          onNovoBloco={recarregar}
          vazioTexto="Nenhuma questão encontrada com esses filtros. Ajuste o filtro e tente de novo."
        />
      </div>
    </div>
  );
};

export default QuestoesPraticar;
