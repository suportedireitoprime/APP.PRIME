import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { useQuestoesSessao } from '@/hooks/useQuestoes';
import { lerFiltroSalvo } from '@/components/questoes/QuestoesFiltroSheet';
import { useGoBack } from '@/hooks/useGoBack';
import { Capacitor } from '@capacitor/core';
import { NativeQuestoes } from '@/plugins/NativeQuestoesPlugin';

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

  const sessaoId = params.get('sessao');

  const filtro = useMemo(() => (usaFiltro ? lerFiltroSalvo() : null), [usaFiltro]);

  const { questoes, loading, recarregar, registrar, sessaoIdAtiva } = useQuestoesSessao({
    area, nivel, cargoId, limite, novas: !filtro, filtro, sessaoId,
  });

  // Ponte 100% Nativa (Jetpack Compose / SwiftUI) no mobile
  useEffect(() => {
    if (!loading && questoes.length > 0 && Capacitor.isNativePlatform()) {
      const sessionData = {
        titulo: area || 'Questões OAB / Concursos',
        questoes: questoes.map(q => ({
          id: q.id,
          enunciado: q.enunciado,
          alt_a: q.alt_a,
          alt_b: q.alt_b,
          alt_c: q.alt_c,
          alt_d: q.alt_d,
          alt_e: q.alt_e,
          gabarito_oficial: q.gabarito_oficial || 'A',
          gabarito_comentado: q.gabarito_comentado,
          disciplina: q.disciplina,
          assunto: q.assunto,
          ano: q.ano,
          banca: q.banca,
          orgao: q.orgao,
        })),
        startIndex: 0,
        contexto: 'pratica',
      };

      const subQuestao = NativeQuestoes.addListener('onQuestaoAnswered', ({ questaoId, alternativa, acertou }) => {
        registrar(questaoId, alternativa, acertou, 'pratica');
      });

      const subClose = NativeQuestoes.addListener('onClose', () => {
        goBack();
      });

      NativeQuestoes.openSession(sessionData).catch((err) => {
        console.warn('[NativeQuestoes] Erro ao abrir sessão nativa, mantendo fallback web:', err);
      });

      return () => {
        subQuestao.then(h => h.remove()).catch(() => {});
        subClose.then(h => h.remove()).catch(() => {});
      };
    }
  }, [loading, questoes.length]);

  return (
    <div className="theme-questoes min-h-screen bg-background pb-safe">
      <ResolverPadrao
        questoes={questoes}
        loading={loading}
        contexto="pratica"
        onRegistrar={registrar}
        onNovoBloco={recarregar}
        onBack={() => goBack()}
        vazioTexto="Nenhuma questão encontrada com esses filtros. Ajuste o filtro e tente de novo."
        sessaoId={sessaoIdAtiva}
      />
    </div>
  );
};

export default QuestoesPraticar;
