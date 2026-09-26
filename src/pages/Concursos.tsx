import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Calendar, Info, ExternalLink, Newspaper, Bell, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsDesktop } from '@/hooks/use-desktop';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LoadingState, EmptyState } from '@/components/ui/states';
import { supabase } from '@/integrations/supabase/client';
import { useGoBack } from '@/hooks/useGoBack';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import type { Database } from '@/integrations/supabase/types';
import { getConcursoVisual } from '@/lib/concursosVisuais';

type ConcursoNoticia = Database['public']['Tables']['concursos_noticias']['Row'];

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

const Concursos = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [concursos, setConcursos] = useState<ConcursoNoticia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataFiltro, setDataFiltro] = useState<string>('');
  const [infoOpen, setInfoOpen] = useState(false);

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

  useEffect(() => {
    if (!dataFiltro) {
      setDataFiltro(todayYMD);
    }
  }, []);

  const finalFiltered = useMemo(() => {
    const filtered = !dataFiltro
      ? concursos
      : concursos.filter(n => toYMD(new Date(n.data_publicacao)) === dataFiltro);

    return [...filtered].sort((a, b) => {
      const dateDiff = new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id.localeCompare(a.id);
    });
  }, [concursos, dataFiltro]);

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
          rightAction={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/ferramentas/radar-concursos')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                title="Configurar Alertas e Radar"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Radar & Alertas</span>
              </button>
              <button
                onClick={() => setInfoOpen((v) => !v)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  infoOpen ? 'bg-[#10B981] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          }
        />

        {/* Banner do Radar de Concursos */}
        <div className="max-w-3xl mx-auto px-4 mt-2 mb-1">
          <button
            type="button"
            onClick={() => navigate('/ferramentas/radar-concursos')}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-card to-card border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer shadow-md group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-display font-bold text-foreground truncate">
                    Radar de Concursos & Alertas
                  </p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold shrink-0">
                    NOVO
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Seja avisado por estado, cargo e notificações do Hórus IA
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {infoOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="overflow-hidden max-w-3xl mx-auto px-4"
            >
              <div className="mt-1 mb-2 rounded-2xl border border-[#10B981]/30 bg-card/60 backdrop-blur-sm p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#10B981]" />
                  <h3 className="font-display text-sm font-bold text-foreground">O que é esta seção?</h3>
                </div>
                <p className="font-body text-[12.5px] leading-relaxed text-muted-foreground">
                  Aqui você acompanha as últimas publicações e editais abertos de <strong className="text-foreground">Concursos Públicos</strong> em todo o Brasil.
                </p>
                <p className="font-body text-[12.5px] leading-relaxed text-muted-foreground">
                  Use o calendário acima para navegar por dia — os editais estão agrupados pelas datas de publicação.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                onClick={() => setDataFiltro(key)}
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
          <span className="text-xs font-display text-[#10B981]">
            {formatFullDate(dataFiltro ? new Date(dataFiltro + 'T00:00:00') : centerDate)}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
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
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 p-4">
                      <h3 className="font-display text-[15px] sm:text-base text-foreground leading-snug line-clamp-3 group-hover:text-[#10B981] transition-colors">
                        {item.titulo}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] font-body text-muted-foreground">
                        <span className="inline-flex items-center gap-1 text-[#10B981] font-semibold">
                          <Clock className="w-3 h-3" />
                          {time}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="inline-flex items-center text-muted-foreground font-medium">
                          {visual.subtitulo}
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
