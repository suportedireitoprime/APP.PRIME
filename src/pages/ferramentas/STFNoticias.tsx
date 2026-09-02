import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Info, Calendar, Newspaper, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { ptBR } from 'date-fns/locale';
import NoticiaViewerSheet from '@/components/vademecum/NoticiaViewerSheet';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { newsImg } from '@/lib/cdnImg';
import { useGoBack } from '@/hooks/useGoBack';

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

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

export default function STFNoticias() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [noticias, setNoticias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoticia, setSelectedNoticia] = useState<any | null>(null);
  const [dataFiltro, setDataFiltro] = useState<string>(''); 
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    const fetchNoticias = async () => {
      const { data, error } = await supabase
        .from('stf_noticias_folha')
        .select('*')
        .order('data_publicacao', { ascending: false })
        .limit(100);

      if (data) {
        setNoticias(data);
      }
      setLoading(false);
    };

    fetchNoticias();
  }, []);

  const openNoticia = (noticia: any) => {
    haptic.selection();
    let cat = 'STF';
    let md = noticia.resumo || '';
    
    if (md.startsWith('CATEGORIA: ')) {
      const firstLineEnd = md.indexOf('\n');
      if (firstLineEnd !== -1) {
        cat = md.substring('CATEGORIA: '.length, firstLineEnd).trim();
        md = md.substring(firstLineEnd).trim();
      }
    } else if (md.length > 0 && md.length < 50) {
      cat = md;
      md = '';
    }

    setSelectedNoticia({
      id: noticia.id,
      titulo: noticia.titulo,
      resumo: cat,
      fonte: 'jota',
      categoria: cat,
      data_publicacao: noticia.data_publicacao,
      url: noticia.url,
      imagem_url: noticia.imagem_url,
      conteudo_md: md.length > 50 
        ? md 
        : `Esta matéria foi originalmente publicada pelo **JOTA**.\n\nAcesse o artigo completo diretamente no site oficial para ler a cobertura detalhada.\n\n[Leia a matéria original no JOTA](${noticia.url})`
    });
  };

  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayYMD = toYMD(new Date());

  useEffect(() => {
    if (!dataFiltro) {
      setDataFiltro(todayYMD);
    }
  }, []);

  const datasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const n of noticias) {
      if (n.data_publicacao) set.add(toYMD(new Date(n.data_publicacao)));
    }
    return Array.from(set);
  }, [noticias]);

  const finalFiltered = useMemo(() => {
    const filtered = !dataFiltro
      ? noticias
      : noticias.filter(n => n.data_publicacao && toYMD(new Date(n.data_publicacao)) === dataFiltro);

    return [...filtered].sort((a, b) => {
      return new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime();
    });
  }, [noticias, dataFiltro]);

  const heroNoticia = finalFiltered.length > 0 ? finalFiltered[0] : null;
  const listNoticias = finalFiltered.slice(1);

  const centerDate = useMemo(() => new Date(), []);
  const dayList = useMemo(() => getDayList(centerDate, 5), [centerDate]);
  const availableDatesSet = useMemo(() => new Set(datasDisponiveis), [datasDisponiveis]);

  return (
    <div className="min-h-screen bg-background pb-[calc(7rem+var(--sai-bottom))]">
      {/* Gradient header */}
      <div className="bg-gradient-to-b from-primary/30 via-primary/15 to-background pb-4">
        <PageHeader
          title="Notícias STF"
          subtitle="Radar do Supremo Tribunal Federal"
          onBack={() => goBack()}
          rightAction={
            <button
              onClick={() => setInfoOpen((v) => !v)}
              aria-expanded={infoOpen}
              aria-label="Sobre esta seção"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                infoOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Info className="w-4 h-4" />
            </button>
          }
        />

        {/* Info panel */}
        <AnimatePresence initial={false}>
          {infoOpen && (
            <motion.div
              key="info-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="overflow-hidden max-w-3xl mx-auto px-4"
            >
              <div className="mt-1 mb-2 rounded-2xl border border-primary/30 bg-card/60 backdrop-blur-sm p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm font-bold text-foreground">O que é esta seção?</h3>
                </div>
                <p className="font-body text-[12.5px] leading-relaxed text-muted-foreground">
                  Aqui você acompanha as decisões e pautas mais recentes do <strong className="text-foreground">STF</strong>.
                </p>
                <p className="font-body text-[12.5px] leading-relaxed text-muted-foreground">
                  Use o calendário acima para navegar por dia — <strong className="text-foreground">o dia atual fica sempre à esquerda</strong> e
                  os anteriores à direita.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day calendar strip */}
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
                    ? 'bg-primary shadow-primary/30'
                    : 'bg-card/40 text-foreground hover:bg-card/60'
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
                <span className={`text-xs font-body font-semibold uppercase tracking-wide ${isSelected ? 'text-primary-foreground' : 'text-foreground/85'}`}>{label}</span>
                <span className={`text-2xl font-display font-bold leading-none ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>{day.getDate()}</span>
                {hasData && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected date label */}
        <div className="flex items-center gap-2 px-5 pb-1 max-w-3xl mx-auto">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-display text-primary">
            {formatFullDate(dataFiltro ? new Date(dataFiltro + 'T00:00:00') : centerDate)}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : finalFiltered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">Nenhuma notícia para esta data.</p>
          </div>
        ) : (
          <>
            {/* Hero card */}
            {heroNoticia && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openNoticia(heroNoticia)}
                className="overflow-hidden bg-card border-y md:border md:rounded-2xl border-border cursor-pointer hover:border-primary/30 transition-colors -mx-4 md:mx-0"
              >
                {heroNoticia.imagem_url ? (
                  <div className="relative h-44 md:h-40 overflow-hidden news-cover-shine">
                    <img
                      src={heroNoticia.imagem_url}
                      alt={heroNoticia.titulo}
                      className="w-full h-full object-cover"
                      fetchPriority="high"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground uppercase tracking-wide">
                          JOTA
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                          STF
                        </span>
                      </div>
                      <h2 className="font-display text-lg text-white leading-tight">
                        {heroNoticia.titulo}
                      </h2>
                      <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-body">
                        <Clock className="w-3 h-3" />
                        {formatDateFull(heroNoticia.data_publicacao)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative p-5 bg-gradient-to-br from-primary/15 via-card to-card">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground uppercase tracking-wide">
                          JOTA
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                          STF
                        </span>
                      </div>
                      <h2 className="font-display text-xl text-foreground font-bold leading-tight">
                        {heroNoticia.titulo}
                      </h2>
                      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                        {heroNoticia.resumo}
                      </p>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-body pt-1">
                        <Clock className="w-3 h-3" />
                        {formatDateFull(heroNoticia.data_publicacao)}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* List */}
            {listNoticias.map((noticia, index) => (
              <motion.div
                key={noticia.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => openNoticia(noticia)}
                className="flex gap-3.5 py-4 border-b border-border/60 last:border-0 cursor-pointer group active:bg-muted/50 transition-colors -mx-4 px-4 md:mx-0 md:px-0"
              >
                {noticia.imagem_url ? (
                  <div className="shrink-0 w-[116px] h-[82px] rounded-lg overflow-hidden bg-muted relative">
                    <img
                      src={noticia.imagem_url}
                      alt={noticia.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 w-[116px] h-[82px] rounded-lg bg-muted flex items-center justify-center border border-border">
                    <Newspaper className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-display text-[15px] font-bold text-foreground leading-snug mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                    {noticia.titulo}
                  </h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-body">
                    <Clock className="w-3 h-3 text-primary/70" />
                    <span className="font-semibold text-primary/80">{formatDateFull(noticia.data_publicacao).split('·')[1].trim()}</span>
                    <span className="opacity-40">•</span>
                    <span className="flex items-center gap-1 opacity-70">
                      <Scale className="w-3 h-3" /> JOTA
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      <NoticiaViewerSheet 
        noticia={selectedNoticia} 
        onClose={() => setSelectedNoticia(null)} 
      />
    </div>
  );
}
