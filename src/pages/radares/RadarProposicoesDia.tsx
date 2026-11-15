import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import ProposicoesPanel from '@/components/radar/ProposicoesPanel';
import { useGoBack } from '@/hooks/useGoBack';

function formatDateForTitle(dateStr: string): string {
  // input: "2026-09-07"
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  
  const wf = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const mf = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  return `${wf[date.getDay()]}, ${date.getDate()} de ${mf[date.getMonth()]} de ${date.getFullYear()}`;
}

const RadarProposicoesDia = () => {
  const { date } = useParams<{ date: string }>();
  const goBack = useGoBack();

  const titleDate = date ? formatDateForTitle(date) : 'Radar Legislativo';

  return (
    <div className="min-h-dvh bg-background text-foreground pb-[100px]">
      <div className="bg-gradient-to-b from-primary/30 via-primary/15 to-background pb-2">
        <PageHeader
          title={titleDate}
          subtitle="Projetos de Lei da Câmara"
          onBack={() => goBack()}
        />
      </div>

      <div className="p-0">
        <ProposicoesPanel dataInicial={date} />
      </div>
    </div>
  );
};

export default RadarProposicoesDia;
