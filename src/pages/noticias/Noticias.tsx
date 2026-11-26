import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Scale, Calendar, Info, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNoticiasCache, prefetchNoticias, subscribeNoticias, fetchNoticiaConteudo, type Noticia, type NoticiaFonte } from '@/services/noticiasService';
import { useReadNoticias } from '@/hooks/useNoticiaTracking';
import { newsImg } from '@/lib/cdnImg';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LoadingState, EmptyState } from '@/components/ui/states';
import { supabase } from '@/integrations/supabase/client';
import { useGoBack } from '@/hooks/useGoBack';
import { MONTHS, formatDateParts, getDayList, dayLabel, formatFullDate, toYMD } from '@/lib/noticiasDateUtils';

const NoticiaViewerSheet = lazy(() => import('@/components/vademecum/blog/NoticiaViewerSheet'));

const Noticias = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const location = useLocation();
  const [noticias, setNoticias] = useState<Noticia[]>(() => getNoticiasCache() ?? []);

  const { isRead, markRead } = useReadNoticias();
  const [loading, setLoading] = useState<boolean>(() => getNoticiasCache() === null);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);
  const [dataFiltro, setDataFiltro] = useState<string>(''); // '' = todas, 'YYYY-MM-DD' = dia
  const [fonteFiltro, setFonteFiltro] = useState<'todas' | NoticiaFonte>('todas');
  const [infoOpen, setInfoOpen] = useState(false);

  // Abre a notícia e lazy-carrega o conteúdo markdown (a lista não traz mais o corpo completo)
  const openNoticia = (n: Noticia) => {
    markRead(n.id);
    setSelectedNoticia(n);
    if (!n.conteudo_md) {
      fetchNoticiaConteudo(n.id).then((md) => {
        if (!md) return;
        setSelectedNoticia((cur) => (cur && cur.id === n.id ? { ...cur, conteudo_md: md, conteudo: md } : cur));
      });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      localStorage.setItem('noticias_last_seen', String(Date.now()));
    } catch {}
    const unsub = subscribeNoticias((data) => {
      setNoticias(data);
      setLoading(false);
    });
    prefetchNoticias().then(() => {
      const data = getNoticiasCache();
      if (data) setNoticias(data);
      setLoading(false);
    });
    return unsub;
  }, []);


  // Auto-open noticia from navigation state or ?item= query param
  useEffect(() => {
    const stateId = (location.state as any)?.noticiaId as string | undefined;
    const queryId = new URLSearchParams(location.search).get('item') || undefined;
    const noticiaId = stateId || queryId;
    if (!noticiaId) return;
    if (selectedNoticia?.id === noticiaId) return;

    const found = noticias.find(n => n.id === noticiaId);
    if (found) {
      openNoticia(found);
      return;
    }
    // Fallback: fetch directly if not in cached list
    let cancel = false;
    supabase
      .from('noticias_juridicas')
      .select('*')
      .eq('id', noticiaId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancel && data) { markRead((data as any).id); setSelectedNoticia(data as any); }
      });
    return () => { cancel = true; };
  }, [noticias, location.state, location.search, selectedNoticia?.id]);

  const todayYMD = toYMD(new Date());
  const yesterdayYMD = toYMD(new Date(Date.now() - 86400000));

  const datasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const n of noticias) set.add(toYMD(new Date(n.data_publicacao)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [noticias]);

  const labelData = (ymd: string) => {
    if (ymd === todayYMD) return 'Hoje';
    if (ymd === yesterdayYMD) return 'Ontem';
    const [, m, d] = ymd.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${parseInt(d, 10)} ${meses[parseInt(m, 10) - 1]}`;
  };

  // Default filter: hoje sempre (mais recente à esquerda). Usuário pode escolher outro dia.
  useEffect(() => {
    if (!dataFiltro) {
      setDataFiltro(todayYMD);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const finalFiltered = useMemo(() => {
    const byDate = !dataFiltro
      ? noticias
      : noticias.filter(n => toYMD(new Date(n.data_publicacao)) === dataFiltro);

    const filtered = fonteFiltro === 'todas'
      ? byDate
      : byDate.filter(n => n.fonte === fonteFiltro);

    return [...filtered].sort((a, b) => {
      const dateDiff = new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id.localeCompare(a.id);
    });
  }, [noticias, dataFiltro, fonteFiltro]);

  const listNoticias = finalFiltered;


  const fonteLabel = (f: Noticia['fonte']) => {
    if (f === 'gran_oab') return 'Gran OAB';
    if (f === 'gran_concursos') return 'Gran Concursos';
    return 'Migalhas';
  };
  const FonteIcon = (_props: { fonte: Noticia['fonte'] }) => <Scale className="w-3 h-3" />;

  // Faixa de dias: hoje à esquerda, passado à direita.
  const centerDate = useMemo(() => new Date(), []);
  const dayList = useMemo(() => getDayList(centerDate, 9), [centerDate]);
  const availableDatesSet = useMemo(() => new Set(datasDisponiveis), [datasDisponiveis]);



  return (
    <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="shrink-0 z-40 bg-background bg-gradient-to-b from-primary/30 via-primary/15 to-background pb-4 shadow-sm border-b border-border/40">
        <PageHeader
          title="Notícias"
          subtitle="Jurídicas, OAB e Concursos"
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

        {/* Info panel — desce de cima */}

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
                  Aqui você acompanha as <strong className="text-foreground">Notícias Legislativas</strong> em tempo real:
                  o que a Câmara dos Deputados aprova, o que o Senado discute e as
                  principais matérias jurídicas publicadas pelo <strong className="text-foreground">Migalhas</strong>.
                </p>
                <p className="font-body text-[12.5px] leading-relaxed text-muted-foreground">
                  Use o calendário acima para navegar por dia — <strong className="text-foreground">o dia atual fica sempre à esquerda</strong> e
                  os anteriores à direita. Toque em uma notícia para ler o conteúdo completo,
                  comentar com outros estudantes e compartilhar.
                </p>
                <p className="font-body text-[11.5px] leading-relaxed text-muted-foreground/80 italic">
                  Ideal para se manter atualizado para provas da OAB, concursos e para acompanhar
                  o que está mudando na legislação brasileira.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Day calendar strip — same style as Radar de Leis */}
        <div className="flex justify-between gap-1.5 px-3 pt-3 pb-2 max-w-3xl mx-auto overflow-x-auto no-scrollbar scroll-smooth">
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
                className={`relative flex-1 shrink-0 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[64px] sm:min-h-[70px] min-w-[42px] sm:min-w-[48px] rounded-2xl transition-all shadow-md shadow-black/20 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-primary shadow-primary/30 ring-1 ring-primary/40'
                    : 'bg-card/50 text-foreground hover:bg-card/75 border border-border/30'
                }`}
              >
                {monthChanged && (
                  <span
                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-[1.5px] rounded-full text-[9px] sm:text-[9.5px] font-body font-bold uppercase tracking-wider shadow-sm z-10 ${
                      isSelected ? 'bg-primary text-primary-foreground border border-white/20' : 'bg-primary/20 text-primary border border-primary/30'
                    }`}
                  >
                    {MONTHS[day.getMonth()]}
                  </span>
                )}
                <span className={`text-[10.5px] sm:text-[11.5px] font-body font-bold uppercase tracking-wider line-clamp-1 ${isSelected ? 'text-primary-foreground' : 'text-foreground/80'}`}>{label}</span>
                <span className={`text-xl sm:text-2xl font-display font-extrabold leading-none ${isSelected ? 'text-primary-foreground drop-shadow-sm' : 'text-foreground'}`}>{day.getDate()}</span>
                {hasData && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected date label */}
        <div className="flex items-center gap-2 px-4.5 pt-1 pb-2 max-w-3xl mx-auto">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-display font-semibold text-primary tracking-wide">
            {formatFullDate(dataFiltro ? new Date(dataFiltro + 'T00:00:00') : centerDate)}
          </span>
        </div>

        {/* Menu de alternância entre fontes (Todas, Jurídicas, OAB, Concursos) */}
        <div className="flex items-center gap-2 px-3 pt-1 max-w-3xl mx-auto overflow-x-auto no-scrollbar">
          {([
            { id: 'todas', label: 'Todas' },
            { id: 'migalhas', label: 'Jurídicas' },
            { id: 'gran_oab', label: 'OAB' },
            { id: 'gran_concursos', label: 'Concursos' },
          ] as const).map((tab) => {
            const active = fonteFiltro === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFonteFiltro(tab.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer active:scale-95 min-h-[34px] ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card/60 text-foreground/80 hover:text-foreground hover:bg-card border-border/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">



        {/* Sem spinner: quando não há cache, mostramos a lista assim que chegar; nunca bloqueia a UI */}

        {(
          <>

            {/* List cards */}
            <div className="space-y-3 -mx-4 md:mx-0">
              {listNoticias.map((item, i) => {
                const { time } = formatDateParts(item.data_publicacao);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => { openNoticia(item); import('@/lib/continuity').then(m => m.recordActivity({ path: `/noticias?item=${item.id}`, label: item.titulo, kind: 'noticia' })); }}
                    className="group flex items-stretch gap-0 bg-card border-y md:border md:rounded-2xl border-border hover:border-primary/40 active:bg-secondary/30 transition-colors cursor-pointer overflow-hidden"
                  >
                    {/* Thumbnail */}
                    {item.imagem_url ? (
                      <div className="w-28 sm:w-32 shrink-0 relative overflow-hidden news-cover-shine">
                        <img
                          src={newsImg(item.imagem_url!, 240)}
                          alt={item.titulo}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        {!isRead(item.id) && (
                          <span className="absolute bottom-1.5 left-1.5 z-10 inline-flex items-center text-[9px] font-bold px-1.5 py-[1px] rounded bg-primary/40 text-primary-foreground border border-primary/60 backdrop-blur-sm uppercase tracking-wide">
                            Novo
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-2 shrink-0 bg-primary/60" />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 p-4">
                      <h3 className="font-display text-[15px] sm:text-base text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                        {item.titulo}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-xs font-body text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 text-primary font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          {time}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="inline-flex items-center gap-1">
                          <FonteIcon fonte={item.fonte} />
                          {fonteLabel(item.fonte)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>


            {finalFiltered.length === 0 && (
              loading ? (
                <LoadingState variant="list" rows={4} label="Carregando notícias" />
              ) : (
                <EmptyState
                  icon={Newspaper}
                  title={noticias.length === 0 ? 'Nenhuma notícia disponível' : 'Sem resultados'}
                  description={
                    noticias.length === 0
                      ? 'Ainda não há notícias carregadas. Tente novamente em instantes.'
                      : 'Não encontramos notícias para esta busca ou data. Tente outro filtro.'
                  }
                />
              )
            )}

          </>
        )}
        </div>
      </div>

      {selectedNoticia && (
        <Suspense fallback={null}>
          <NoticiaViewerSheet
            noticia={selectedNoticia}
            onClose={() => {
              setSelectedNoticia(null);
              if (new URLSearchParams(location.search).get('item')) {
                navigate('/noticias', { replace: true });
              }
            }}
          />
        </Suspense>
      )}

    </div>
  );
};

export default Noticias;
