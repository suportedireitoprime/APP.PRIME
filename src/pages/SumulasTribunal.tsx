import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Loader2, Gavel, Scale, ChevronRight, Ban, BadgeCheck, Heart, Clock, List, RefreshCw, XCircle, Mic, ListMusic, StickyNote, History, Radar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchSumulas, getSumulasCached, subscribeSumulas, fetchSumulasFavoritas, syncSumulasFavoritas, toggleSumulaFavorita, SUMULA_TRIBUNAIS, type Sumula } from '@/services/sumulasService';
import SumulaVinculanteSheet from '@/components/vademecum/SumulaVinculanteSheet';
import ArtigoBottomSheet from '@/components/vademecum/ArtigoBottomSheet';
import HeroOrnaments from '@/components/vademecum/HeroOrnaments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  tribunal: 'STF_VINCULANTE' | 'STF' | 'STJ';
}

const GRADIENT: Record<Props['tribunal'], string> = {
  STF_VINCULANTE: 'from-red-600 via-red-700 to-red-800',
  STF: 'from-blue-700 to-blue-900',
  STJ: 'from-emerald-600 to-emerald-800',
};

const SITUACAO_STYLE: Record<string, { label: string; icon: typeof Ban; className: string; barColor?: string }> = {
  vigente:   { label: 'Vigente',   icon: BadgeCheck, className: 'bg-emerald-400/15 text-emerald-300' },
  cancelada: { label: 'Cancelada', icon: Ban,        className: 'bg-red-500/15 text-red-400', barColor: '#c2274a' },
  revogada:  { label: 'Revogada',  icon: XCircle,    className: 'bg-orange-500/15 text-orange-400', barColor: '#f97316' },
  alterada:  { label: 'Alterada',  icon: RefreshCw,  className: 'bg-amber-400/15 text-amber-300', barColor: '#a81f40' },
};

const SumulasTribunal = ({ tribunal }: Props) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [params] = useSearchParams();
  const [sumulas, setSumulas] = useState<Sumula[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState<Sumula | null>(null);
  const [tab, setTab] = useState<'todas' | 'favoritas' | 'recentes'>('todas');

  const favKey = `sumulas:${tribunal}:favoritas`;
  const recKey = `sumulas:${tribunal}:recentes`;
  const [favoritas, setFavoritas] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(favKey) || '[]'); } catch { return []; }
  });
  const [recentes, setRecentes] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(recKey) || '[]'); } catch { return []; }
  });

  const saveFavoritasLocal = (ids: string[]) => {
    setFavoritas(ids);
    localStorage.setItem(favKey, JSON.stringify(ids));
  };

  const toggleFav = async (sumula: Sumula) => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast.error('Faça login para favoritar súmulas.');
      return;
    }

    const wasFavorite = favoritas.includes(sumula.id);
    const optimistic = wasFavorite
      ? favoritas.filter((id) => id !== sumula.id)
      : [sumula.id, ...favoritas];
    saveFavoritasLocal(optimistic);

    try {
      const result = await toggleSumulaFavorita(tribunal, accessToken, sumula.numero);
      const confirmed = result.favoritada
        ? Array.from(new Set([sumula.id, ...optimistic]))
        : optimistic.filter((id) => id !== sumula.id);
      saveFavoritasLocal(confirmed);
      toast.success(result.favoritada ? 'Súmula adicionada aos favoritos' : 'Súmula removida dos favoritos');
    } catch (error) {
      saveFavoritasLocal(favoritas);
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o favorito.');
    }
  };

  const pushRecente = (id: string) => {
    setRecentes((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 50);
      localStorage.setItem(recKey, JSON.stringify(next));
      return next;
    });
  };

  const info = SUMULA_TRIBUNAIS.find((t) => t.id === tribunal);

  useEffect(() => {
    let alive = true;
    const cached = getSumulasCached(tribunal);
    if (cached && cached.length > 0) {
      setSumulas(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    fetchSumulas(tribunal).then((data) => {
      if (!alive) return;
      setSumulas(data);
      setLoading(false);
    });
    const unsub = subscribeSumulas(tribunal, (rows) => {
      if (!alive) return;
      setSumulas(rows);
      setLoading(false);
    });
    return () => { alive = false; unsub(); };
  }, [tribunal]);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken || sumulas.length === 0) return;
    let alive = true;

    const hydrateFavoritas = async () => {
      try {
        const localNumeros = favoritas
          .map((id) => sumulas.find((sumula) => sumula.id === id)?.numero)
          .filter((numero): numero is number => typeof numero === 'number');
        if (localNumeros.length > 0) {
          await syncSumulasFavoritas(tribunal, accessToken, localNumeros);
        }
        const numeros = await fetchSumulasFavoritas(tribunal, accessToken);
        if (!alive) return;
        const numeroSet = new Set(numeros);
        saveFavoritasLocal(sumulas.filter((sumula) => numeroSet.has(sumula.numero)).map((sumula) => sumula.id));
      } catch (error) {
        console.error('Erro ao carregar favoritos de súmulas:', error);
      }
    };

    hydrateFavoritas();
    return () => { alive = false; };
  }, [session?.access_token, tribunal, sumulas]);

  const filtered = useMemo(() => {
    let base = sumulas;
    if (tab === 'favoritas') {
      const set = new Set(favoritas);
      base = sumulas.filter((s) => set.has(s.id));
    } else if (tab === 'recentes') {
      const order = new Map(recentes.map((id, i) => [id, i]));
      base = sumulas
        .filter((s) => order.has(s.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(
      (s) => s.enunciado.toLowerCase().includes(q) || String(s.numero).includes(q)
    );
  }, [sumulas, search, tab, favoritas, recentes]);

  const TABS: { id: typeof tab; label: string; icon: typeof List; count: number }[] = [
    { id: 'todas', label: 'Todas', icon: List, count: sumulas.length },
    { id: 'favoritas', label: 'Favoritas', icon: Heart, count: favoritas.length },
    { id: 'recentes', label: 'Recentes', icon: Clock, count: recentes.length },
  ];

  return (
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <div
        className={`bg-hero-panel relative overflow-hidden rounded-b-[36px] border-b border-white/10 shadow-2xl shadow-black/60 pt-[calc(var(--sai-top)+0.5rem)]`}
        style={{
          background: `linear-gradient(150deg, ${
            tribunal === 'STF_VINCULANTE' ? 'hsl(348 78% 28%), hsl(348 78% 18%)' :
            tribunal === 'STF' ? 'hsl(200 80% 28%), hsl(200 80% 18%)' :
            'hsl(150 45% 25%), hsl(150 45% 15%)'
          })`,
          transform: 'translateZ(0)',
        }}
      >
        <div className="absolute inset-0 opacity-70 pointer-events-none [filter:hue-rotate(0deg)_saturate(0.85)] mix-blend-overlay">
          <HeroOrnaments />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />

        <div className="relative px-4 pb-8 pt-6 sm:px-6 md:px-8 max-w-5xl mx-auto lg:max-w-[1500px] lg:px-12 lg:pb-12 lg:pt-12 2xl:px-16 flex flex-col items-center lg:items-start text-center lg:text-left">
          <button
            onClick={() => navigate('/jurisprudencia')}
            aria-label="Voltar"
            className="absolute left-4 top-6 lg:left-12 w-11 h-11 rounded-full bg-black/25 hover:bg-black/35 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="mt-14 lg:mt-0 flex flex-col items-center lg:items-start">
            <div className="w-[76px] h-[76px] rounded-full p-[2px] bg-white/10 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)] mb-4">
              <div className="w-full h-full rounded-full bg-black/30 border border-white/15 backdrop-blur-sm flex items-center justify-center">
                <Gavel className="w-8 h-8 text-white/90" strokeWidth={1.5} />
              </div>
            </div>
            
            <p className="font-display uppercase tracking-[0.24em] text-[11px] text-white/70">
              Coleção de Súmulas
            </p>
            <h1 className="mt-1 font-display uppercase tracking-wider text-white text-[28px] leading-tight font-bold drop-shadow lg:text-[40px]">
              {info?.nome || tribunal}
            </h1>
            <p className="mt-2 text-white/90 text-[16px] leading-relaxed max-w-md font-body lg:max-w-xl lg:text-[17px]">
              {sumulas.length} súmulas disponíveis para consulta rápida.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-4 lg:max-w-[1500px] lg:px-12 lg:py-6 2xl:px-16">

        <div className="lg:flex lg:items-center lg:gap-4 space-y-4 lg:space-y-0">
          <form
            className="flex items-center gap-2.5 min-w-0 lg:flex-1"
            onSubmit={(e) => { e.preventDefault(); }}
          >
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou enunciado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-2xl bg-secondary border-border pl-10 pr-4 text-sm font-medium h-12"
              />
            </div>
            <button
              type="button"
              className="relative overflow-hidden shrink-0 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition w-12 h-12 lg:w-11 lg:h-11 bg-hero-panel text-white shadow-red-950/40"
              onClick={() => toast.info('A busca por voz está disponível no Vade Mecum.')}
            >
              <Mic className="relative z-[2] w-5 h-5" strokeWidth={2.5} />
            </button>
          </form>

          <div className="grid grid-cols-3 gap-2 lg:w-auto lg:shrink-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center justify-center gap-1.5 px-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all py-3 md:py-3.5 ${
                    active
                      ? 'bg-hero-panel text-white shadow-md shadow-red-950/40'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                  {active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white ml-1">
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Carregando jurisprudência...</p>
          </div>
        ) : (
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 2xl:grid-cols-3">
            {filtered.map((sumula, i) => {
              const isFav = favoritas.includes(sumula.id);
              return (
              <motion.div
                key={sumula.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.5) }}
                onClick={() => { pushRecente(sumula.id); setOpen(sumula); }}
                className="group w-full flex text-left items-stretch bg-[#14171A] hover:bg-[#1A1E22] border border-border/40 rounded-2xl transition-all cursor-pointer overflow-hidden min-h-[92px]"
              >
                <div
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: SITUACAO_STYLE[sumula.situacao]?.barColor || info?.iconColor || 'hsl(var(--primary))' }}
                />
                <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                  <div
                    className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] shrink-0 rounded-[14px] flex flex-col items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] relative overflow-hidden group-hover:scale-[1.03] transition-transform"
                    style={{ background: SITUACAO_STYLE[sumula.situacao]?.barColor || info?.iconColor || '#e11d48' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    <span className="font-display font-black text-[15px] sm:text-[16px] leading-none tracking-tight">
                      {sumula.numero}º
                    </span>
                    <span className="font-body font-bold text-[8.5px] uppercase tracking-widest mt-[1px] opacity-80">
                      {tribunal === 'STF_VINCULANTE' ? 'VINC' : 'SÚM'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {(() => {
                        const st = SITUACAO_STYLE[sumula.situacao];
                        if (!st) return null;
                        const Icon = st.icon;
                        return (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${st.className}`}>
                            <Icon className="w-3 h-3" /> {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">
                      {sumula.enunciado}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void toggleFav(sumula); }}
                    className="p-2 rounded-lg hover:bg-background/60 shrink-0 transition-colors"
                    aria-label={isFav ? 'Remover favorito' : 'Adicionar aos favoritos'}
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                </div>
              </motion.div>
              );
            })}
            {filtered.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8 lg:col-span-full">
                {tab === 'favoritas'
                  ? 'Nenhuma súmula favoritada ainda.'
                  : tab === 'recentes'
                  ? 'Nenhuma súmula acessada recentemente.'
                  : 'Nenhuma jurisprudência encontrada.'}
              </p>
            )}
          </div>
        )}
      </div>

      {open && (
        <SumulaVinculanteSheet
          sumula={open}
          tribunal={tribunal}
          isFavorita={favoritas.includes(open.id)}
          onToggleFavorita={() => void toggleFav(open)}
          onClose={() => setOpen(null)}
        />
      )}
      <motion.nav
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-[58] lg:hidden"
      >
        <div className="bg-secondary/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.45)] pb-safe">
          <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto">
            {[
              { key: 'todas', icon: History, label: 'Histórico' },
              { key: 'playlist', icon: ListMusic, label: 'Playlist' },
              { key: 'anotacoes', icon: StickyNote, label: 'Anotações' },
              { key: 'radar', icon: Radar, label: 'Radar' },
              { key: 'favoritas', icon: Heart, label: 'Favoritos' },
            ].map((bt) => {
              const active = tab === bt.key;
              return (
                <button
                  key={bt.key}
                  onClick={() => {
                    if (bt.key === 'todas' || bt.key === 'favoritas') setTab(bt.key);
                    else toast.info('Recurso em desenvolvimento para Súmulas.');
                  }}
                  type="button"
                  className={`flex flex-col items-center justify-end gap-1.5 py-1.5 transition-colors ${
                    active ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  <bt.icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} fill="none" />
                  <span className="font-body text-[11px] sm:text-[12px] leading-tight">{bt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </div>
  );
};

export const SumulasVinculantes = () => <SumulasTribunal tribunal="STF_VINCULANTE" />;
export const SumulasSTF = () => <SumulasTribunal tribunal="STF" />;
export const SumulasSTJ = () => <SumulasTribunal tribunal="STJ" />;

export default SumulasTribunal;