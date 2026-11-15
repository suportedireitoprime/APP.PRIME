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

const MONTHS_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

// Função que extrai a capa real da notícia (não a capa genérica do jornal de introdução)
function getBoletimCover(b?: Boletim | null): string {
  if (!b || !Array.isArray(b.roteiro_json) || b.roteiro_json.length === 0) {
    return radarLeisLocal;
  }
  // 1ª prioridade: cena que NÃO é intro e tem imagem de notícia real (não é o slide 00 genérico de jornal)
  const noticiaComImg = b.roteiro_json.find(
    (s: any) => s.kind !== 'intro' && s.imagem_url && !s.imagem_url.includes('00-slide.jpg')
  );
  if (noticiaComImg?.imagem_url) {
    return noticiaComImg.imagem_url;
  }
  // 2ª prioridade: qualquer cena com kind !== 'intro' com imagem
  const qualquerNoticia = b.roteiro_json.find((s: any) => s.kind !== 'intro' && s.imagem_url);
  if (qualquerNoticia?.imagem_url) {
    return qualquerNoticia.imagem_url;
  }
  // 3ª prioridade: cena 1
  if (b.roteiro_json[1]?.imagem_url) {
    return b.roteiro_json[1].imagem_url;
  }
  // Fallback: cena 0
  if (b.roteiro_json[0]?.imagem_url) {
    return b.roteiro_json[0].imagem_url;
  }
  return b.tipo === 'legislativo' ? radarLegislativoLocal : radarLeisLocal;
}

// Remove datas duplicadas do título para eliminar redundância com o cabeçalho da timeline
function getCleanTitle(titulo?: string | null): string {
  if (!titulo) return 'Boletim de Notícias';
  return (
    titulo
      .replace(/\s*[-–—]\s*\d{1,2}\s+de\s+[a-zA-ZçÇãÃõÕéÉíÍóÓúÚ]+(\s+de\s+\d{4})?/gi, '')
      .replace(/\s*[-–—]\s*\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, '')
      .trim() || 'Boletim de Notícias'
  );
}

// Extrai a manchete principal da notícia do dia para o título não ser repetitivo
function getMainHeadline(b?: Boletim | null): string | null {
  if (!b || !Array.isArray(b.roteiro_json)) return null;
  const scene = b.roteiro_json.find(
    (s: any) => s.kind !== 'intro' && s.kind !== 'outro' && s.titulo && s.titulo.trim().length > 0
  );
  return scene?.titulo?.trim() || null;
}

// Conta o número real de notícias/manchetes (sem contar intro e encerramento)
function getManchetesCount(b?: Boletim | null): number {
  if (!b || !Array.isArray(b.roteiro_json)) return 10;
  const count = b.roteiro_json.filter((s: any) => s.kind !== 'intro' && s.kind !== 'outro').length;
  return count > 0 ? count : b.roteiro_json.length;
}

// Cache em memória para carregamento instantâneo a 0ms
let boletinsMemoryCache: Boletim[] | null = null;

function getStoredBoletins(): Boletim[] | null {
  try {
    const raw = localStorage.getItem('boletins_cache_v2');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredBoletins(items: Boletim[]) {
  try {
    localStorage.setItem('boletins_cache_v2', JSON.stringify(items));
  } catch {}
}

export default function Boletins() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Boletim[]>(() => boletinsMemoryCache || getStoredBoletins() || []);
  const [loading, setLoading] = useState<boolean>(() => !boletinsMemoryCache && !getStoredBoletins()?.length);
  
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

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('boletins_juridicos')
        .select('*')
        .order('data_ref', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (!error && data && data.length > 0) {
        const rows = data as Boletim[];
        boletinsMemoryCache = rows;
        setStoredBoletins(rows);
        setItems(rows);
      }
    } catch (err) {
      console.warn('[Boletins] Falha ao carregar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const todayYMD = toYMD(new Date());

  // Agrupar boletins por dia (chave estrita YYYY-MM-DD sem distorção de fuso)
  const boletinsPorDia = useMemo(() => {
    const map = new Map<string, Boletim[]>();
    for (const b of items) {
      const key = b.data_ref ? b.data_ref.slice(0, 10) : toYMD(new Date(b.created_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [items]);

  // Boletim mais recente pronto para destaque no topo
  const latestBoletim = useMemo(() => {
    return items.find((b) => b.status === 'pronto') || items[0] || null;
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
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto pt-2 pb-24 lg:pb-8 relative z-10">
        {loading ? (
          <div className="px-6 py-8 space-y-4">
            <LoadingState variant="list" rows={4} label="Carregando boletins diários..." />
          </div>
        ) : (
          <div className="px-6 py-4">
            {/* Card Destaque: Último Boletim Pronto com Capa da Notícia */}
            {latestBoletim && latestBoletim.status === 'pronto' && (() => {
              const latestCapaUrl = getBoletimCover(latestBoletim);
              const cleanTitle = getCleanTitle(latestBoletim.titulo);
              const headline = getMainHeadline(latestBoletim);
              const totalManchetes = getManchetesCount(latestBoletim);
              const dateObj = latestBoletim.data_ref
                ? new Date(`${latestBoletim.data_ref}T12:00:00`)
                : new Date(latestBoletim.created_at);
              const dataFormatada = `${dateObj.getDate().toString().padStart(2, '0')} de ${MONTHS_FULL[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

              return (
                <div className="mb-8 rounded-3xl p-4 sm:p-5 border border-zinc-800 bg-zinc-900/90 shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Capa com a foto real da notícia do boletim */}
                    <div className="relative w-full sm:w-44 aspect-[16/9] sm:h-28 rounded-2xl overflow-hidden bg-neutral-950 border border-white/10 shrink-0 shadow-lg">
                      <img
                        src={latestCapaUrl}
                        alt={headline || cleanTitle}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-black ml-0.5 text-black" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Mais recente
                        </span>
                        <span className="text-xs text-zinc-400 font-medium">
                          {dataFormatada}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold font-display text-white leading-snug mb-1">
                        {headline || cleanTitle}
                      </h2>
                      <p className="text-xs text-zinc-400 line-clamp-1 font-body">
                        {cleanTitle} • {totalManchetes} notícias do dia
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        haptic.impact();
                        markAsVisto(latestBoletim.id);
                        setPlayerAtivo(latestBoletim);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 active:scale-95 text-black font-bold text-xs uppercase tracking-wider shadow-xl transition cursor-pointer shrink-0 w-full sm:w-auto"
                    >
                      <Play className="w-4 h-4 fill-black ml-0.5 text-black" />
                      <span>Ouvir agora</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400">
                Linha do Tempo
              </h2>
              <span className="text-[11px] text-zinc-500 font-medium">Últimos 7 dias</span>
            </div>

            <div className="relative border-l-2 border-zinc-800 ml-3 sm:ml-4 space-y-6 pb-12">
              {timelineDays.map((dateObj) => {
                const dateKey = toYMD(dateObj);
                const isToday = dateKey === todayYMD;
                const diaBoletins = boletinsPorDia.get(dateKey) || [];
                const hasBoletins = diaBoletins.length > 0;
                
                const monthName = MONTHS_FULL[dateObj.getMonth()];
                const dayNum = dateObj.getDate().toString().padStart(2, '0');
                const weekName = WEEKDAYS_FULL[dateObj.getDay()];

                return (
                  <div key={dateKey} className="relative pl-6 sm:pl-7">
                    {/* Marcador da Timeline */}
                    <div
                      className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-background transition-colors ${
                        hasBoletins ? (isToday ? 'bg-white' : 'bg-zinc-400') : 'bg-zinc-700'
                      }`}
                    />

                    {/* Cabeçalho da Data: 100% por extenso sem abreviações */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-zinc-100 tracking-wide">
                        {dayNum} de {monthName}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        • {isToday ? 'Hoje' : weekName}
                      </span>
                    </div>

                    {/* Card Direita com Capa real, SEM redundância e SEM abreviações */}
                    {hasBoletins ? (() => {
                      const primeiroBoletim = diaBoletins[0];
                      const pendentesCount = diaBoletins.filter((b) => !vistos.has(b.id)).length;
                      const isAllViewed = pendentesCount === 0;
                      const capaUrl = getBoletimCover(primeiroBoletim);
                      const cleanTitle = getCleanTitle(primeiroBoletim.titulo);
                      const headline = getMainHeadline(primeiroBoletim);
                      const totalManchetes = getManchetesCount(primeiroBoletim);

                      const handleCardClick = () => {
                        haptic.selection();
                        if (diaBoletins.length === 1 && primeiroBoletim.status === 'pronto') {
                          markAsVisto(primeiroBoletim.id);
                          setPlayerAtivo(primeiroBoletim);
                        } else {
                          setDiaSelecionado(dateKey);
                        }
                      };

                      return (
                        <div
                          onClick={handleCardClick}
                          className={`w-full text-left border rounded-2xl p-3 sm:p-3.5 flex items-center gap-3.5 transition-all group cursor-pointer active:scale-[0.98] ${
                            isAllViewed
                              ? 'bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/80'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 shadow-xl'
                          }`}
                        >
                          {/* Capa com Foto Real da Notícia */}
                          <div className="relative w-24 h-20 sm:w-28 sm:h-22 shrink-0 rounded-xl overflow-hidden bg-neutral-950 border border-white/10 shadow-md">
                            <img
                              src={capaUrl}
                              alt={headline || cleanTitle}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-3.5 h-3.5 fill-black ml-0.5 text-black" />
                              </div>
                            </div>
                          </div>

                          {/* Informações: Direto ao ponto, SEM redundância de data ou tópicos */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-zinc-400">
                                {cleanTitle} • {totalManchetes} notícias
                              </span>
                              {isAllViewed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full shrink-0">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Visto
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full shrink-0">
                                  Pendente
                                </span>
                              )}
                            </div>

                            <h3 className="font-display font-bold text-sm sm:text-base text-zinc-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                              {headline || cleanTitle}
                            </h3>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="w-full bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 shrink-0">
                          {isToday ? <Clock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="text-zinc-400 font-medium text-xs sm:text-sm">
                            {isToday ? 'Próximo boletim em breve' : 'Nenhum boletim gerado'}
                          </h3>
                          <p className="text-[11px] text-zinc-600 mt-0.5">
                            {isToday
                              ? 'A inteligência artificial está processando as novidades do dia.'
                              : 'Não há registros para esta data.'}
                          </p>
                        </div>
                      </div>
                    )}
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
                  const coverSrc = getBoletimCover(item);
                  const isViewed = vistos.has(item.id);
                  const cleanTitle = getCleanTitle(item.titulo);
                  const headline = getMainHeadline(item);
                  const totalManchetes = getManchetesCount(item);

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
                      <div className="relative w-24 h-[72px] shrink-0 rounded-xl overflow-hidden bg-neutral-950 border border-white/10 shadow-md">
                        <img 
                          src={coverSrc} 
                          alt={headline || cleanTitle}
                          className="w-full h-full object-cover opacity-90"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          {isReady ? (
                            <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                              <Play className="w-4 h-4 text-black fill-current ml-0.5" />
                            </div>
                          ) : (
                            <div className="px-2 py-1 bg-black/80 rounded-md text-[9px] font-bold text-white uppercase backdrop-blur-sm">
                              Gerando
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-zinc-400">
                            {cleanTitle} • {totalManchetes} notícias
                          </span>
                        </div>
                        <h3 className="text-zinc-100 font-semibold leading-tight text-sm line-clamp-2">
                          {headline || cleanTitle}
                        </h3>
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
