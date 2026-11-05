// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { Play, CalendarDays, X, ChevronRight, Lock, Clock, CheckCircle2, ArrowLeft, Newspaper, Scale, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BoletimPlayer, { type BoletimScene } from '@/components/boletim/BoletimPlayer';
import { LoadingState } from '@/components/ui/states';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';

import radarLeisLocal from '@/assets/radares/radar-leis.webp';
import radarLegislativoLocal from '@/assets/radares/radar-legislativo.webp';

type Boletim = {
  id: string;
  data_ref: string;
  tipo: 'juridico' | 'noticias' | 'legislativo';
  titulo: string;
  subtitulo: string | null;
  status: string;
  roteiro_json: BoletimScene[];
  created_at: string;
  youtube_url?: string;
};

const TIPO_LABELS: Record<string, string> = {
  juridico: 'Jurídico',
  noticias: 'Notícias',
  legislativo: 'Legislativo',
};

const TIPO_STYLES: Record<string, { color: string; backgroundColor: string }> = {
  juridico: { color: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.15)' },
  noticias: { color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  legislativo: { color: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.15)' },
};

const normalizeTipo = (t: string) => {
  return t ? t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : 'noticias';
};

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Boletins() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Boletim[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [playerAtivo, setPlayerAtivo] = useState<Boletim | null>(null);
  const [vistos, setVistos] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('boletins_vistos');
      if (saved) setVistos(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const markAsVisto = (id: string) => {
    setVistos(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('boletins_vistos', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('boletins_juridicos')
          .select('*')
          .order('data_ref', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (!cancel) {
          if (!error && data) {
            setItems(data as any[]);
          }
        }
      } catch (err) {
        console.warn('[Boletins] Falha ao carregar:', err);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, []);

  const todayYMD = toYMD(new Date());

  // Agrupar boletins por dia
  const boletinsPorDia = useMemo(() => {
    const map = new Map<string, Boletim[]>();
    for (const b of items) {
      const date = b.data_ref ? new Date(b.data_ref + 'T12:00:00') : new Date(b.created_at);
      const key = toYMD(date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [items]);

  // Lista dos últimos 7 dias
  const timelineDays = useMemo(() => {
    const list = [];
    const centerDate = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() - i);
      list.push(d);
    }
    return list;
  }, []);

  useBodyScrollLock(diaSelecionado !== null || playerAtivo !== null);

  const mobileHeader = (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/10 pt-[var(--sai-top,env(safe-area-inset-top,0px))]">
      <div className="flex items-center justify-between px-4 h-16 sm:h-20">
        <button
          type="button"
          onClick={() => { haptic.light(); navigate(-1); }}
          aria-label="Voltar"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:opacity-70 shadow-xl cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
        <div className="text-center">
          <h1 className="text-[17px] sm:text-[19px] font-display font-bold uppercase tracking-widest text-foreground">
            BOLETINS
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium">Resumos diários em áudio e vídeo</p>
        </div>
        <div className="w-12 h-12 sm:w-[52px] sm:h-[52px]" />
      </div>
    </header>
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title="Boletins Diários"
      subtitle="Fique atualizado com os últimos conteúdos jurídicos e legislativos"
      mobileHeader={mobileHeader}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="flex flex-col h-full w-full max-w-2xl mx-auto pt-2 pb-24 lg:pb-8 relative z-10">
        {loading ? (
          <div className="py-20">
            <LoadingState text="Carregando boletins diários..." />
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="relative border-l-2 border-zinc-800/60 ml-4 space-y-8 pb-12">
              {timelineDays.map((dateObj) => {
                const dateKey = toYMD(dateObj);
                const isToday = dateKey === todayYMD;
                const diaBoletins = boletinsPorDia.get(dateKey) || [];
                const hasBoletins = diaBoletins.length > 0;
                
                const monthName = MONTHS[dateObj.getMonth()];
                const dayNum = dateObj.getDate().toString().padStart(2, '0');
                const weekName = WEEKDAYS[dateObj.getDay()];

                return (
                  <div key={dateKey} className="relative pl-8 flex items-start">
                    {/* Marcador da Timeline */}
                    <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-background ${hasBoletins ? 'bg-primary' : 'bg-zinc-700'}`} />

                    {/* Data Esquerda */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-12 pt-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-primary' : 'text-zinc-500'}`}>
                        {monthName}
                      </span>
                      <span className={`text-2xl font-black font-display leading-none ${isToday ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {dayNum}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-medium mt-0.5">
                        {isToday ? 'Hoje' : weekName}
                      </span>
                    </div>

                    {/* Card Direita */}
                    <div className="flex-1 ml-4">
                      {hasBoletins ? (() => {
                        const pendentesCount = diaBoletins.filter(b => !vistos.has(b.id)).length;
                        const isAllViewed = pendentesCount === 0;
                        const tiposUnicos = Array.from(new Set(diaBoletins.map(b => b.tipo)));

                        return (
                          <button
                            onClick={() => { haptic.selection(); setDiaSelecionado(dateKey); }}
                            className={`w-full text-left border rounded-2xl p-4 flex items-center justify-between transition-colors group cursor-pointer ${
                              isAllViewed ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-zinc-900 border-zinc-800/80 hover:bg-zinc-800/80'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className={`font-bold uppercase tracking-widest text-[13px] transition-colors ${isAllViewed ? 'text-zinc-400' : 'text-zinc-100 group-hover:text-primary'}`}>
                                  {pendentesCount > 0 
                                    ? `${pendentesCount} ${pendentesCount > 1 ? 'boletins' : 'boletim'} pendente${pendentesCount > 1 ? 's' : ''}` 
                                    : `${diaBoletins.length} ${diaBoletins.length > 1 ? 'boletins' : 'boletim'} visto${diaBoletins.length > 1 ? 's' : ''}`}
                                </h3>
                                {isAllViewed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {tiposUnicos.map(tipo => {
                                  const normTipo = normalizeTipo(tipo) as keyof typeof TIPO_STYLES;
                                  const customStyle = TIPO_STYLES[normTipo] || { color: '#a1a1aa', backgroundColor: 'rgba(39, 39, 42, 1)' };
                                  return (
                                    <span key={tipo} style={customStyle} className="text-[9.5px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-white/5">
                                      {TIPO_LABELS[tipo] || tipo}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </button>
                        );
                      })() : (
                        <div className="w-full bg-zinc-900/30 border border-zinc-800/30 rounded-2xl p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-600 shrink-0">
                            {isToday ? <Clock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                          <div>
                            <h3 className="text-zinc-400 font-medium text-sm">
                              {isToday ? 'Próximo boletim em breve' : 'Nenhum boletim gerado'}
                            </h3>
                            <p className="text-xs text-zinc-600 mt-0.5">
                              {isToday ? 'A inteligência artificial está processando as novidades do dia.' : 'Não há registros para este dia.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal BottomSheet - Opções de Boletins do Dia */}
      <AnimatePresence>
        {diaSelecionado && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDiaSelecionado(null)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#141416] border-t border-zinc-800 rounded-t-[32px] max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="w-full flex items-center justify-center pt-3 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-zinc-700/60 rounded-full" />
              </div>
              <div className="px-6 pb-3 shrink-0 flex items-center justify-between border-b border-white/5">
                <div>
                  <h2 className="text-lg font-bold text-white font-display">Opções do Dia</h2>
                  <p className="text-xs text-zinc-400">Escolha o resumo que deseja escutar</p>
                </div>
                <button
                  onClick={() => setDiaSelecionado(null)}
                  className="w-9 h-9 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
                {(boletinsPorDia.get(diaSelecionado) || []).map((item) => {
                  const isReady = item.status === 'pronto';
                  const coverSrc = item.tipo === 'legislativo' ? radarLegislativoLocal : radarLeisLocal;
                  const isViewed = vistos.has(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isReady) {
                          haptic.impact();
                          markAsVisto(item.id);
                          setDiaSelecionado(null);
                          setTimeout(() => setPlayerAtivo(item), 150);
                        }
                      }}
                      disabled={!isReady}
                      className={`
                        relative w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer
                        ${isReady ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 active:scale-[0.98]' : 'bg-zinc-900/50 border-zinc-800/50 opacity-60 cursor-not-allowed'}
                      `}
                    >
                      {isViewed && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                      <div className="relative w-24 h-[72px] shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-md">
                        <img 
                          src={coverSrc} 
                          alt={item.titulo}
                          className="w-full h-full object-cover opacity-90"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          {isReady ? (
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-xl">
                              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            </div>
                          ) : (
                            <div className="px-2 py-1 bg-black/80 rounded-md text-[9px] font-bold text-white uppercase backdrop-blur-sm">
                              Gerando
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1.5">
                          {(() => {
                            const normTipo = normalizeTipo(item.tipo) as keyof typeof TIPO_STYLES;
                            const customStyle = TIPO_STYLES[normTipo] || { color: '#a1a1aa', backgroundColor: 'rgba(39, 39, 42, 1)' };
                            return (
                              <span style={customStyle} className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                                {TIPO_LABELS[item.tipo] || item.tipo}
                              </span>
                            );
                          })()}
                        </div>
                        <h3 className="text-zinc-100 font-semibold leading-tight text-sm line-clamp-2">{item.titulo}</h3>
                        {item.subtitulo && (
                          <p className="text-xs text-zinc-400 truncate mt-1">{item.subtitulo}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Player de Áudio e Vídeo das Cenas do Boletim */}
      <AnimatePresence>
        {playerAtivo && (
          <BoletimPlayer
            boletimId={playerAtivo.id}
            dataRef={playerAtivo.data_ref || playerAtivo.created_at}
            scenes={playerAtivo.roteiro_json || []}
            youtubeUrl={playerAtivo.youtube_url || undefined}
            onClose={() => setPlayerAtivo(null)}
          />
        )}
      </AnimatePresence>
    </DesktopPageLayout>
  );
}
