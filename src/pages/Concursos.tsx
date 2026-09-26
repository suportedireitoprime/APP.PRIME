import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Calendar, ExternalLink, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsDesktop } from '@/hooks/use-desktop';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LoadingState, EmptyState } from '@/components/ui/states';
import { supabase } from '@/integrations/supabase/client';
import { useGoBack } from '@/hooks/useGoBack';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { getConcursoVisual } from '@/lib/concursosVisuais';

type ConcursoNoticia = {
  id: string;
  data_publicacao: string;
  titulo: string;
  imagem_url?: string;
  link: string;
  cargos?: string[];
  cargos_resumo?: string;
  vagas_salario?: string;
};

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function formatDateParts(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return { day, month, time: `${hours}:${minutes}` };
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${months[d.getMonth()]} · ${hours}:${minutes}`;
}

function getDayList(centerDate: Date, count = 5): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function dayLabel(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'HOJE';
  return WEEKDAYS[date.getDay()];
}

function formatFullDate(date: Date): string {
  const weekdayFull = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const monthFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${weekdayFull[date.getDay()]}, ${date.getDate()} de ${monthFull[date.getMonth()]} de ${date.getFullYear()}`;
}

function extractCargo(item: ConcursoNoticia): string {
  if (item.cargos_resumo) return item.cargos_resumo;
  if (item.cargos && item.cargos.length > 0) return item.cargos[0];
  const match = item.titulo.match(/(?:para|cargo(?:s)? de|função de)\s+(.+?)(?:\s*-|\s*$)/i);
  if (match && match[1]) {
    return match[1].split(' e ')[0].trim();
  }
  return "Vários Cargos";
}

const Concursos = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [concursos, setConcursos] = useState<ConcursoNoticia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataFiltro, setDataFiltro] = useState<string>('');
  const [cargoFiltro, setCargoFiltro] = useState<string>('Todos');

  useEffect(() => {
    let cancel = false;
    supabase
      .from('concursos_noticias')
      .select('*')
      .order('data_publicacao', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!cancel && data) {
          setConcursos(data as any);
          setLoading(false);
        }
      });
    return () => { cancel = true; };
  }, []);

  const openExternalLink = (url: string) => {
    if (Capacitor.isNativePlatform()) {
      void Browser.open({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayYMD = toYMD(new Date());

  const datasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const n of concursos) set.add(toYMD(new Date(n.data_publicacao)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [concursos]);

  // Removido useEffect que forçava uma data específica, para que a tela inicie exibindo TODOS os concursos (dataFiltro = '').

  const dateFiltered = useMemo(() => {
    return !dataFiltro
      ? concursos
      : concursos.filter(n => toYMD(new Date(n.data_publicacao)) === dataFiltro);
  }, [concursos, dataFiltro]);

  const availableCargos = useMemo(() => {
    const set = new Set<string>();
    dateFiltered.forEach(n => {
      const c = extractCargo(n).toUpperCase();
      if (c) set.add(c);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [dateFiltered]);

  const finalFiltered = useMemo(() => {
    let filtered = dateFiltered;

    if (cargoFiltro !== 'Todos') {
      filtered = filtered.filter(n => extractCargo(n).toUpperCase() === cargoFiltro);
    }

    return [...filtered].sort((a, b) => {
      const dateDiff = new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id.localeCompare(a.id);
    });
  }, [dateFiltered, cargoFiltro]);

  // Adjust dayList to ensure it includes the most recent date with data if it's within 5 days,
  // or just center it around today as before.
  const centerDate = useMemo(() => new Date(), []);
  const dayList = useMemo(() => getDayList(centerDate, 5), [centerDate]);
  const availableDatesSet = useMemo(() => new Set(datasDisponiveis), [datasDisponiveis]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-b from-[#10B981]/30 via-[#10B981]/15 to-background pb-4">
        <PageHeader
          title="Concursos Públicos"
          subtitle="Últimas oportunidades"
          onBack={() => goBack()}
        />

        <div className="flex justify-between gap-1.5 px-3 py-3 max-w-3xl mx-auto">
          {dayList.map((day, idx) => {
            const key = toYMD(day);
            const isSelected = dataFiltro === key;
            const hasData = availableDatesSet.has(key);
            const label = dayLabel(day);
            const prev = dayList[idx - 1];
            const monthChanged = !prev || prev.getMonth() !== day.getMonth();
            return (
              <button
                key={key}
                onClick={() => setDataFiltro(isSelected ? '' : key)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] rounded-2xl transition-all shadow-lg shadow-black/20 ${
                  isSelected
                    ? 'bg-[#10B981] shadow-[#10B981]/30'
                    : 'bg-card/40 text-foreground hover:bg-card/60'
                }`}
              >
                {monthChanged && (
                  <span
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-full text-[9px] font-body font-semibold uppercase tracking-wider ${
                      isSelected ? 'bg-white text-[#10B981]' : 'bg-[#10B981]/20 text-[#10B981]'
                    }`}
                  >
                    {MONTHS[day.getMonth()]}
                  </span>
                )}
                <span className={`text-xs font-body font-semibold uppercase tracking-wide ${isSelected ? 'text-white' : 'text-foreground/85'}`}>{label}</span>
                <span className={`text-2xl font-display font-bold leading-none ${isSelected ? 'text-white' : 'text-foreground'}`}>{day.getDate()}</span>
                {hasData && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-5 pb-1 max-w-3xl mx-auto">
          <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="text-[11px] font-display text-[#10B981] font-bold tracking-wider uppercase">
            {dataFiltro ? formatFullDate(new Date(dataFiltro + 'T00:00:00')) : 'Exibindo Todos os Editais'}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Menu de Alternância (Cargos) */}
        {availableCargos.length > 1 && (
          <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar snap-x">
            {availableCargos.map((cargo) => (
              <button
                key={cargo}
                onClick={() => setCargoFiltro(cargo)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shrink-0 snap-start transition-colors border ${
                  cargoFiltro === cargo
                    ? 'bg-[#10B981] text-white border-[#10B981]'
                    : 'bg-card text-muted-foreground border-border hover:border-[#10B981]/50'
                }`}
              >
                {cargo}
              </button>
            ))}
          </div>
        )}

        {finalFiltered.length > 0 ? (
          <>
            {/* Hero card — edge-to-edge no mobile */}
            {(() => {
              const hero = finalFiltered[0];
              if (!hero) return null;
              const visual = getConcursoVisual(hero.titulo, hero.imagem_url);
              return (
                <motion.div
                  key={`hero-${hero.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => openExternalLink(hero.link)}
                  className="overflow-hidden bg-card border-y md:border md:rounded-2xl border-border cursor-pointer hover:border-[#10B981]/30 transition-colors -mx-4 md:mx-0"
                >
                  <div className="relative h-44 md:h-40 overflow-hidden">
                    <img
                      src={visual.imagemUrl}
                      alt={hero.titulo}
                      className="w-full h-full object-cover brightness-90 hover:scale-105 transition-transform duration-300"
                      fetchPriority="high"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10B981]/90 text-white border border-[#10B981]/60 backdrop-blur-sm uppercase tracking-wide shadow-lg">
                      {visual.tag}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {visual.subtitulo && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10B981] text-white uppercase tracking-wide">
                            {visual.subtitulo}
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-lg text-white leading-tight">
                        {hero.titulo}
                      </h2>
                      <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-body">
                        <Clock className="w-3 h-3" />
                        {formatDateFull(hero.data_publicacao)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* List cards */}
            <div className="space-y-3 -mx-4 md:mx-0">
              {finalFiltered.slice(1).map((item, i) => {
                const { time } = formatDateParts(item.data_publicacao);
                const visual = getConcursoVisual(item.titulo, item.imagem_url);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => openExternalLink(item.link)}
                    className="group flex items-stretch gap-0 bg-card border-y md:border md:rounded-2xl border-border hover:border-[#10B981]/40 active:bg-secondary/30 transition-colors cursor-pointer overflow-hidden relative"
                  >
                    {/* Thumbnail */}
                    <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden">
                      <img
                        src={visual.imagemUrl}
                        alt={item.titulo}
                        className="absolute inset-0 w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="absolute bottom-1.5 left-1.5 z-10 inline-flex items-center text-[9px] font-bold px-1.5 py-[1px] rounded bg-[#10B981]/90 text-white border border-[#10B981]/60 backdrop-blur-sm uppercase tracking-wide">
                        {visual.tag}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 p-4">
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-widest truncate w-full">
                        {item.cargos_resumo || (item.cargos && item.cargos.length > 0 ? item.cargos[0] : (item.titulo.match(/(?:para|cargo(?:s)? de|função de)\s+(.+?)(?:\s*-|\s*$)/i)?.[1] || "Vários Cargos"))}
                      </span>
                      <h3 className="font-display text-[14px] sm:text-[15px] text-foreground leading-snug line-clamp-2 group-hover:text-[#10B981] transition-colors mt-0.5">
                        {item.titulo}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-[12px] font-body text-muted-foreground mt-auto pt-1">
                        <span className="inline-flex items-center gap-1 text-[#10B981] font-semibold">
                          <Clock className="w-3 h-3" />
                          {time}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="inline-flex items-center text-muted-foreground font-medium truncate">
                          {(item.vagas_salario || visual.subtitulo).replace(/.*?até\s+R\$/i, 'Salários até R$')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          loading ? (
            <LoadingState variant="list" rows={4} label="Carregando concursos" />
          ) : (
            <EmptyState
              icon={Newspaper}
              title={concursos.length === 0 ? 'Nenhum concurso disponível' : 'Sem resultados'}
              description={
                concursos.length === 0
                  ? 'Ainda não há concursos carregados. Tente novamente em instantes.'
                  : 'Não encontramos editais para esta busca ou data. Tente outro filtro.'
              }
            />
          )
        )}
      </div>
    </div>
  );
};

export default Concursos;
