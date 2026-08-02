import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { useQuestoesSessao } from '@/hooks/useQuestoes';

const QuestoesRevisar = () => {
  const navigate = useNavigate();
  const { questoes, loading, recarregar, registrar } = useQuestoesSessao({ modo: 'revisar', limite: 10 });

  return (
    <div className="theme-questoes min-h-screen bg-background pb-32">
      <PageHeader title="Revisar" subtitle="O que você errou volta aqui" onBack={() => navigate('/questoes')} />
      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        <ResolverPadrao
          questoes={questoes}
          loading={loading}
          contexto="revisao"
          onRegistrar={registrar}
          onNovoBloco={recarregar}
          vazioTexto="Nenhum erro pendente de revisão. Continue praticando!"
        />
      </div>
      <QuestoesBottomNav />
    </div>
  );
};

export default QuestoesRevisar;
