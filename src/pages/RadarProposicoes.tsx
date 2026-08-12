import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProposicoesPanel from '@/components/radar/ProposicoesPanel';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import VadeMecumBottomNav from '@/components/vademecum/VadeMecumBottomNav';

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function getDayList(centerDate: Date, range = 3): Date[] {
  const days: Date[] = [];
  const total = range * 2 + 1;
  for (let i = 0; i < total; i++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFullDate(date: Date): string {
  const wf = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const mf = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${wf[date.getDay()]}, ${date.getDate()} de ${mf[date.getMonth()]} de ${date.getFullYear()}`;
}

const RadarProposicoes = () => {
  const goBack = useGoBack();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayList = useMemo(() => getDayList(new Date(), 3), []);
  const selectedDateKey = toDateKey(selectedDate);
  const dataInicial = selectedDateKey;

  return (
    <div className="min-h-dvh bg-background text-foreground pb-[100px]">
      <div className="bg-gradient-to-b from-primary/30 via-primary/15 to-background pb-4">
        <PageHeader
          title="Radar Legislativo"
          subtitle="Projetos de Lei da Câmara"
          onBack={() => goBack()}
        />

        <div className="flex justify-between gap-1.5 px-3 py-3 lg:mx-auto lg:max-w-[1100px]">
          {dayList.map((day, idx) => {
            const key = toDateKey(day);
            const isSelected = key === selectedDateKey;
            const prev = dayList[idx - 1];
            const monthChanged = !prev || prev.getMonth() !== day.getMonth();
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(day)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] rounded-2xl transition-all shadow-lg shadow-black/20 ${
                  isSelected ? 'bg-primary shadow-primary/30' : 'bg-card/40 text-foreground hover:bg-card/60'
                }`}
              >
                {monthChanged && (
                  <span
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-full text-[9px] font-body font-semibold uppercase tracking-wider ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {MONTHS[day.getMonth()]}
                  </span>
                )}
                <span className={`text-xs font-body font-semibold uppercase tracking-wide ${isSelected ? 'text-primary-foreground' : 'text-foreground/85'}`}>
                  {WEEKDAYS[day.getDay()]}
                </span>
                <span className={`text-2xl font-display font-bold leading-none ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-5 pb-1">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-display text-primary">{formatFullDate(selectedDate)}</span>
        </div>
      </div>

      <div className="p-0">
        <ProposicoesPanel searchQuery="" dataInicial={dataInicial} />
      </div>

      <VadeMecumBottomNav />
    </div>
  );
};

export default RadarProposicoes;
