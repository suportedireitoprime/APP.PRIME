import { useState, useMemo, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle, Shield, Landmark, Scale, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { fetchSumulas, getSumulasCached, type Sumula } from '@/services/sumulasService';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { haptic } from '@/lib/nativeHaptics';
import { Skeleton } from '@/components/ui/skeleton';

const VideoaulaSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/VideoaulaSheet'));
const VideoaulasListSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/VideoaulasListSheet'));

type TribunalTab = 'STF_VINCULANTE' | 'STF' | 'STJ';

const TRIBUNAIS: { id: TribunalTab; label: string; sigla: string; icon: any; color: string; bg: string; border: string; tabela: string }[] = [
  {
    id: 'STF_VINCULANTE',
    label: 'Súmulas Vinculantes',
    sigla: 'SV',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    tabela: 'sumulas_vinculantes',
  },
  {
    id: 'STF',
    label: 'Súmulas do STF',
    sigla: 'STF',
    icon: Landmark,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    tabela: 'sumulas_stf',
  },
  {
    id: 'STJ',
    label: 'Súmulas do STJ',
    sigla: 'STJ',
    icon: Scale,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    tabela: 'sumulas_stj',
  },
];

export default function VideoaulasJurisprudencia() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TribunalTab>('STF_VINCULANTE');
  const [q, setQ] = useState('');
  const [sumulas, setSumulas] = useState<Sumula[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de reprodução de vídeo
  const [selectedSumula, setSelectedSumula] = useState<Sumula | null>(null);
  const [videoaula, setVideoaula] = useState<{ titulo: string; url: string; canal: string; videoId: string; transcricao?: string } | null>(null);
  const [showVideoaulaSheet, setShowVideoaulaSheet] = useState(false);

  const activeTribunal = useMemo(() => {
    return TRIBUNAIS.find((t) => t.id === tab) || TRIBUNAIS[0];
  }, [tab]);

  // Carregamento de Súmulas com Cache Instantâneo
  useEffect(() => {
    let isMounted = true;
    const cached = getSumulasCached(tab);
    if (cached && cached.length > 0) {
      setSumulas(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchSumulas(tab)
      .then((data) => {
        if (isMounted) {
          setSumulas(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tab]);

  // Filtragem rápida
  const sumulasFiltradas = useMemo(() => {
    if (!q.trim()) return sumulas;
    const query = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    return sumulas.filter((s) => {
      const numStr = String(s.numero || '');
      const texto = (s.enunciado || s.texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return numStr === query || numStr.includes(query) || texto.includes(query);
    });
  }, [sumulas, q]);

  return (
    <div className="min-h-screen bg-background pb-36">
      <PageHeader
        title="Jurisprudência em Vídeo"
        description="Aulas e análises das principais Súmulas dos Tribunais Superiores"
        onBack={() => navigate('/videoaulas')}
        theme="purple"
      />

      <div className="px-4 mt-6 space-y-4">
        {/* Seletor de Tribunais em Abas */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-card border border-border/80">
          {TRIBUNAIS.map((t) => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  haptic.selection();
                  setTab(t.id);
                  setQ('');
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all ${
                  isActive
                    ? 'bg-secondary text-foreground font-bold shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? t.color : 'text-muted-foreground'}`} />
                <span className="text-[12px] sm:text-[13px] leading-tight truncate">
                  {t.sigla === 'SV' ? 'Vinculantes' : t.sigla}
                </span>
              </button>
            );
          })}
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Buscar em ${activeTribunal.label} (ex: 14 ou texto)...`}
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-purple-500/40 text-[15px]"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Status e Contador */}
        {!loading && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {sumulasFiltradas.length} {sumulasFiltradas.length === 1 ? 'súmula' : 'súmulas'}
            </span>
            <span className="text-[11px] text-purple-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Busca automática de aulas no YouTube
            </span>
          </div>
        )}

        {/* Lista de Súmulas */}
        <div className="space-y-3">
          {loading && (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] w-full rounded-2xl bg-card border border-border/50" />
            ))
          )}

          {!loading && sumulasFiltradas.map((s) => {
            const numeroFormatado = tab === 'STF_VINCULANTE' ? `SV ${s.numero}` : `Súmula ${s.numero}`;
            const textoEnunciado = s.enunciado || s.texto || '';

            return (
              <button
                key={s.id || s.numero}
                onClick={() => {
                  haptic.selection();
                  setSelectedSumula(s);
                }}
                className="w-full text-left rounded-3xl bg-card hover:bg-secondary/60 transition-all border border-border/80 hover:border-purple-500/40 group flex items-stretch min-h-[76px] active:scale-[0.99] shadow-sm"
              >
                <div className="w-20 flex flex-col items-center justify-center shrink-0 p-2">
                  <div className={`w-14 h-11 rounded-2xl ${activeTribunal.bg} flex items-center justify-center border ${activeTribunal.border} group-hover:scale-105 transition-all`}>
                    <span className={`text-[12.5px] font-black ${activeTribunal.color}`}>
                      {tab === 'STF_VINCULANTE' ? `SV ${s.numero}` : `${s.numero}`}
                    </span>
                  </div>
                </div>

                <div className="py-3.5 pr-2 flex flex-col justify-center min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-purple-400/90 uppercase tracking-wide">
                    {numeroFormatado}
                  </span>
                  <p className="text-[13.5px] font-medium leading-snug text-foreground/90 line-clamp-2 mt-0.5">
                    {textoEnunciado}
                  </p>
                </div>

                <div className="w-12 flex items-center justify-center shrink-0 pr-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <PlayCircle className="w-4.5 h-4.5 text-purple-400" />
                  </div>
                </div>
              </button>
            );
          })}

          {!loading && sumulasFiltradas.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Nenhuma súmula encontrada para a pesquisa.</p>
              <button
                onClick={() => setQ('')}
                className="text-xs text-purple-400 font-bold hover:underline"
              >
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Busca de Vídeos com YouTube & Cache Supabase */}
      {selectedSumula && (
        <Suspense fallback={null}>
          <VideoaulasListSheet
            open={!!selectedSumula}
            onClose={() => setSelectedSumula(null)}
            tabelaNome={activeTribunal.tabela}
            artigoNumero={String(selectedSumula.numero)}
            leiNome={activeTribunal.label}
            onSelectVideo={(v) => {
              setVideoaula({ titulo: v.titulo, url: v.url, canal: v.canal, videoId: v.videoId });
              setSelectedSumula(null);
              setShowVideoaulaSheet(true);
            }}
          />
        </Suspense>
      )}

      {/* Player do Vídeo */}
      {showVideoaulaSheet && videoaula && (
        <Suspense fallback={null}>
          <VideoaulaSheet
            open={showVideoaulaSheet}
            onClose={() => setShowVideoaulaSheet(false)}
            video={videoaula}
            tabelaNome={activeTribunal.tabela}
            artigoNumero={String(selectedSumula?.numero || '')}
          />
        </Suspense>
      )}
    </div>
  );
}
