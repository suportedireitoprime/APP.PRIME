import { useEffect, useState, useMemo, startTransition, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import RadarBottomNav from '@/components/radar/RadarBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ArrowRight, Moon, FileText, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getDayList(centerDate: Date, range = 3): Date[] {
  const days: Date[] = [];
  const total = range * 2 + 1; // 7 days total if range = 3
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

function EmptyDay({ day, isToday, delayIdx }: { day: Date, isToday: boolean, delayIdx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delayIdx * 0.05 }}
      className="w-full relative overflow-hidden rounded-2xl bg-card/40 border border-dashed border-border text-left opacity-70"
    >
      <div className="flex items-stretch gap-0">
        <div className="relative w-[110px] shrink-0 bg-muted/20 flex flex-col items-center justify-center border-r border-border/40 py-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
            {isToday ? 'Hoje' : WEEKDAYS[day.getDay()].split('-')[0]}
          </span>
          <span className="text-3xl font-display font-bold text-muted-foreground/50 leading-none">
            {String(day.getDate()).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1">
            {MONTHS_SHORT[day.getMonth()]}
          </span>
        </div>
        <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
          <Moon className="w-5 h-5 text-muted-foreground/50 mb-2" />
          <p className="font-display font-semibold text-[15px] leading-tight text-muted-foreground/80">Nenhuma proposição neste dia</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
            O Congresso não apresentou novos projetos.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyGroupBlock({ oldestDate, newestDate, days, delayIdx }: { oldestDate: Date, newestDate: Date, days: Date[], delayIdx: number }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="space-y-4">
      <motion.button
        onClick={() => setExpanded(!expanded)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delayIdx * 0.05 }}
        className="w-full relative overflow-hidden rounded-2xl bg-secondary/30 border border-dashed border-border/50 text-left opacity-85 hover:bg-secondary/50 transition-colors shadow-sm"
      >
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5 text-muted-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-[15px] leading-tight text-muted-foreground">
              De {String(oldestDate.getDate()).padStart(2, '0')}/{String(oldestDate.getMonth() + 1).padStart(2, '0')} a {String(newestDate.getDate()).padStart(2, '0')}/{String(newestDate.getMonth() + 1).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Nenhuma proposição neste período ({days.length} dias)
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </motion.button>
      
      {expanded && (
        <div className="space-y-4 pl-4 sm:pl-8 border-l-2 border-muted-foreground/10 ml-2 mt-2">
          {days.map((day, idx) => (
            <EmptyDay key={toDateKey(day)} day={day} isToday={toDateKey(day) === toDateKey(new Date())} delayIdx={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

const RadarProposicoes = () => {
  const goBack = useGoBack();
  const navigate = useNavigate();
  
  const dayList = useMemo(() => getDayList(new Date(), 3), []); // Last 7 days
  
  const [loading, setLoading] = useState(true);
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadCounts() {
      try {
        const oldestDateKey = toDateKey(dayList[dayList.length - 1]);
        const newestDateKey = toDateKey(dayList[0]);
        
        // As a fast proxy, we can fetch all propositions in the date range from Supabase and group them locally.
        const { data } = await supabase.from('radar_proposicoes')
          .select('data_apresentacao')
          .gte('data_apresentacao', oldestDateKey)
          .lte('data_apresentacao', newestDateKey + 'T23:59:59Z');
          
        const map: Record<string, number> = {};
        if (data) {
          data.forEach(p => {
            if (p.data_apresentacao) {
              const key = p.data_apresentacao.split('T')[0];
              map[key] = (map[key] || 0) + 1;
            }
          });
        }
        setCountsMap(map);
      } catch (e) {
        console.error('Error fetching propositions count', e);
      } finally {
        setLoading(false);
      }
    }
    
    loadCounts();
  }, [dayList]);

  const handleDayClick = useCallback((dateKey: string) => {
    startTransition(() => {
      navigate(`/radar/proposicoes/${dateKey}`);
    });
  }, [navigate]);

  const timelineItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    let currentEmptyGroup: Date[] = [];

    const pushEmptyGroup = (group: Date[], startIndex: number) => {
      if (group.length === 1) {
        items.push(<EmptyDay key={toDateKey(group[0])} day={group[0]} isToday={toDateKey(group[0]) === toDateKey(new Date())} delayIdx={startIndex} />);
      } else if (group.length > 1) {
        items.push(<EmptyGroupBlock key={`group-${toDateKey(group[0])}`} newestDate={group[0]} oldestDate={group[group.length - 1]} days={group} delayIdx={startIndex} />);
      }
    };

    for (let i = 0; i < dayList.length; i++) {
      const day = dayList[i];
      const key = toDateKey(day);
      const count = countsMap[key] || 0;
      
      if (count === 0) {
        currentEmptyGroup.push(day);
      } else {
        if (currentEmptyGroup.length > 0) {
          pushEmptyGroup(currentEmptyGroup, items.length);
          currentEmptyGroup = [];
        }
        
        const isToday = toDateKey(day) === toDateKey(new Date());
        items.push(
          <motion.button
            key={key}
            onClick={() => handleDayClick(key)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: items.length * 0.05 }}
            className="w-full relative overflow-hidden rounded-2xl bg-card border border-border/80 text-left group hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
          >
            <div className="flex items-stretch gap-0">
              <div className="relative w-[110px] shrink-0 bg-secondary/30 flex flex-col items-center justify-center border-r border-border/40 py-4 group-hover:bg-primary/5 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-1">
                  {isToday ? 'Hoje' : WEEKDAYS[day.getDay()].split('-')[0]}
                </span>
                <span className="text-3xl font-display font-bold text-primary leading-none group-hover:scale-110 transition-transform">
                  {String(day.getDate()).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mt-1">
                  {MONTHS_SHORT[day.getMonth()]}
                </span>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-center min-w-0 bg-gradient-to-r from-transparent to-primary/[0.02]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    {count} {count === 1 ? 'Proposição' : 'Proposições'}
                  </span>
                </div>
                <p className="font-display font-bold text-base leading-tight text-foreground group-hover:text-primary transition-colors">
                  Ver proposições do dia
                </p>
                <p className="text-[13px] text-muted-foreground mt-1 line-clamp-1">
                  Toque para abrir a lista completa com filtros.
                </p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.button>
        );
      }
    }
    
    if (currentEmptyGroup.length > 0) {
      pushEmptyGroup(currentEmptyGroup, items.length);
    }
    
    return items;
  }, [dayList, countsMap, handleDayClick]);

  return (
    <div className="min-h-dvh bg-background text-foreground pb-[100px]">
      <PageHeader
        title="Radar Legislativo"
        subtitle="Projetos de Lei da Câmara"
        onBack={() => goBack()}
      />

      <div className="px-4 sm:px-6 py-4 pb-8 lg:px-0 lg:max-w-3xl lg:mx-auto space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[104px] w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          timelineItems
        )}
      </div>

      <RadarBottomNav />
    </div>
  );
};

export default RadarProposicoes;
