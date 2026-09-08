import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { Play, CalendarDays, X, ChevronRight, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BoletimPlayer, { type BoletimScene } from '@/components/boletim/BoletimPlayer';
import { LoadingState } from '@/components/ui/states';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import ShapeGrid from '@/components/ui/ShapeGrid';

import { pickAsset, srcOf } from '@/lib/assetUrl';
import boletimJuridicoAsset from '@/assets/boletins/boletim-juridico.webp.asset.json';
import boletimJuridicoBundled from '@/assets/boletins/boletim-juridico.webp';
import boletimNoticiasAsset from '@/assets/boletins/boletim-noticias.webp.asset.json';
import boletimNoticiasBundled from '@/assets/boletins/boletim-noticias.webp';

const boletimJuridicoSrc = pickAsset(boletimJuridicoBundled, srcOf(boletimJuridicoAsset));
const boletimNoticiasSrc = pickAsset(boletimNoticiasBundled, srcOf(boletimNoticiasAsset));

type Boletim = {
  id: string;
  data_ref: string;
  tipo: 'juridico' | 'noticias' | 'legislativo';
  titulo: string;
  subtitulo: string | null;
  status: string;
  roteiro_json: BoletimScene[];
  created_at: string;
};

const TIPO_LABELS = {
  juridico: 'Jurídico',
  noticias: 'Notícias',
  legislativo: 'Legislativo',
};

const TIPO_STYLES = {
  juridico: { color: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.2)' }, // yellow-400
  noticias: { color: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.2)' }, // blue-400
  legislativo: { color: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.2)' }, // orange-400
};

const normalizeTipo = (t: string) => {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    } catch (e) {}
  }, []);

  const markAsVisto = (id: string) => {
    setVistos(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('boletins_vistos', JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
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
        setLoading(false);
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
      const date = b.data_ref ? new Date(b.data_ref) : new Date(b.created_at);
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
    <PageHeader 
      title="Boletins"
      subtitle="Conteúdos gerados diariamente"
      onBack={() => navigate(-1)} 
    />
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
            <LoadingState text="Carregando timeline..." />
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="relative border-l-2 border-zinc-800/60 ml-4 space-y-8 pb-12">
              {timelineDays.map((dateObj, idx) => {
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
                    <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-background ${hasBoletins ? 'bg-red-500' : 'bg-zinc-700'}`} />

                    {/* Data Esquerda */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-12 pt-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-red-500' : 'text-zinc-500'}`}>
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
                            onClick={() => setDiaSelecionado(dateKey)}
                            className={`w-full text-left border rounded-2xl p-4 flex items-center justify-between transition-colors group ${isAllViewed ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-zinc-900 border-zinc-800/80 hover:bg-zinc-800/80'}`}
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className={`font-bold uppercase tracking-widest transition-colors ${isAllViewed ? 'text-zinc-500' : 'text-zinc-100 group-hover:text-red-400'}`}>
                                  {pendentesCount > 0 
                                    ? `${pendentesCount} ${pendentesCount > 1 ? 'boletins' : 'boletim'} pendente${pendentesCount > 1 ? 's' : ''}` 
                                    : `${diaBoletins.length} ${diaBoletins.length > 1 ? 'boletins' : 'boletim'} visto${diaBoletins.length > 1 ? 's' : ''}`}
                                </h3>
                                {isAllViewed && <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} />}
                              </div>
                                <div className="flex flex-wrap gap-1.5">
                                {tiposUnicos.map(tipo => {
                                   const normTipo = normalizeTipo(tipo) as keyof typeof TIPO_STYLES;
                                   const customStyle = TIPO_STYLES[normTipo] || { color: '#a1a1aa', backgroundColor: 'rgba(39, 39, 42, 1)' };
                                   return (
                                     <span key={tipo} style={customStyle} className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm">
                                       {TIPO_LABELS[tipo as keyof typeof TIPO_LABELS] || tipo}
                                     </span>
                                   );
                                })}
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-red-500/10 group-hover:text-red-400 transition-colors">
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
                            <h3 className="text-zinc-500 font-medium text-sm">
                              {isToday ? 'Próximo boletim em breve' : 'Nenhum boletim gerado'}
                            </h3>
                            <p className="text-xs text-zinc-600 mt-0.5">
                              {isToday ? 'A inteligência artificial está processando.' : 'Não há registros para este dia.'}
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

      {/* Sheet Flutuante do Dia Selecionado */}
      <AnimatePresence>
        {diaSelecionado && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDiaSelecionado(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="w-full flex justify-center py-3 shrink-0">
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
              </div>
              <div className="px-6 pb-2 shrink-0 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white font-display">Opções do Dia</h2>
                  <p className="text-sm text-zinc-400">Escolha o conteúdo para assistir</p>
                </div>
                <button
                  onClick={() => setDiaSelecionado(null)}
                  className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 pb-safe-offset-4">
                {(boletinsPorDia.get(diaSelecionado) || []).map((item) => {
                  const isReady = item.status === 'pronto';
                  const coverSrc = item.tipo === 'noticias' ? boletimNoticiasSrc : boletimJuridicoSrc;
                  const isViewed = vistos.has(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isReady) {
                          markAsVisto(item.id);
                          setDiaSelecionado(null);
                          setTimeout(() => setPlayerAtivo(item), 150); // delay so sheet can close smoothly
                        }
                      }}
                      className={`
                        relative w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-4
                        ${isReady ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'}
                      `}
                    >
                      {isViewed && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981' }} />
                        </div>
                      )}
                      <div className="relative w-28 h-[76px] shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-md">
                        <img 
                          src={coverSrc} 
                          alt={item.titulo}
                          className="w-full h-full object-cover opacity-90 transition-transform hover:scale-105"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          {isReady ? (
                            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm shadow-xl">
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            </div>
                          ) : (
                             <div className="px-2 py-1 bg-black/70 rounded-md text-[9px] font-bold text-white uppercase backdrop-blur-sm">
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
                              <span style={customStyle} className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm">
                                {TIPO_LABELS[item.tipo] || item.tipo}
                              </span>
                            );
                          })()}
                        </div>
                        <h3 className="text-zinc-100 font-medium leading-tight text-sm line-clamp-2">{item.titulo}</h3>
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

      <AnimatePresence>
        {playerAtivo && (
          <BoletimPlayer
            boletimId={playerAtivo.id}
            dataRef={playerAtivo.data_ref || playerAtivo.created_at}
            scenes={playerAtivo.roteiro_json || []}
            tipo={playerAtivo.tipo}
            onClose={() => setPlayerAtivo(null)}
          />
        )}
      </AnimatePresence>
    </DesktopPageLayout>
  );
}
