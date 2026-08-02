import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import { ChevronRight, Flame, Layers, Search, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';
import hero1 from '@/assets/aprender-hero/hero-1.png.asset.json';
import hero2 from '@/assets/aprender-hero/hero-2.png.asset.json';
import hero3 from '@/assets/aprender-hero/hero-3.png.asset.json';
import hero4 from '@/assets/aprender-hero/hero-4.png.asset.json';
import hero5 from '@/assets/aprender-hero/hero-5.png.asset.json';
import hero6 from '@/assets/aprender-hero/hero-6.png.asset.json';
import { srcOf } from '@/lib/assetUrl';

const HERO_ILLUSTRATIONS = [srcOf(hero1), srcOf(hero2), srcOf(hero3), srcOf(hero4), srcOf(hero5), srcOf(hero6)];

type Dash = {
  total_cards: number;
  estudados: number;
  compreendidos: number;
  a_revisar: number;
  hoje: number;
  streak: number;
  atividade_30d: { dia: string; total: number }[];
  temas_criticos: { area: string; tema: string; total: number }[];
};

type AreaRow = {
  area: string;
  slug: string;
  ordem: number;
  total_cards: number;
  compreendidos: number;
  a_revisar: number;
};

const Flashcards = () => {
  const navigate = useNavigate();
  const [dash, setDash] = useState<Dash | null>(null);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [areaSheet, setAreaSheet] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [d, a] = await Promise.all([
        supabase.rpc('flashcards_dashboard'),
        supabase.rpc('flashcards_resumo_areas'),
      ]);
      if (!alive) return;
      if (d.data) setDash(d.data as unknown as Dash);
      if (a.data) setAreas(a.data as unknown as AreaRow[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroIdx((i) => (i + 1) % HERO_ILLUSTRATIONS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let l = q ? areas.filter((a) => a.area.toLowerCase().includes(q)) : [...areas];
    l.sort((a, b) => {
      const pa = a.total_cards ? Number(a.compreendidos) / a.total_cards : 0;
      const pb = b.total_cards ? Number(b.compreendidos) / b.total_cards : 0;
      if ((pa > 0 ? 0 : 1) !== (pb > 0 ? 0 : 1)) return (pa > 0 ? 0 : 1) - (pb > 0 ? 0 : 1);
      if (pb !== pa) return pb - pa;
      return a.area.localeCompare(b.area, 'pt-BR');
    });
    return l;
  }, [areas, busca]);

  const pct = dash && dash.total_cards ? Math.round((dash.compreendidos / dash.total_cards) * 100) : 0;
  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c - (pct / 100) * c;

  return (
    <div className="min-h-dvh bg-background pb-32">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="Flashcards"
          onBack={() => navigate('/')}
        />

        {/* Hero full-bleed — mesmo padrão do Aprender */}
        <section
          className="relative isolate overflow-hidden border-b border-black/20"
          style={{ background: 'linear-gradient(135deg, hsl(0 72% 46%) 0%, hsl(0 72% 56%) 100%)' }}
          aria-label="Seu progresso em flashcards"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.28),transparent_65%)]" />

          <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] overflow-hidden sm:w-[34%]" aria-hidden="true">
            {HERO_ILLUSTRATIONS.map((url, i) => (
              <img
                key={url}
                src={url}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="absolute inset-y-0 right-0 h-full w-auto object-contain object-right transition-opacity duration-[1400ms] ease-in-out"
                style={{ opacity: i === heroIdx ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[hsl(0_72%_46%)] via-[hsl(0_72%_46%)]/60 to-transparent" />
          </div>

          <div className="relative p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                  <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.22)" strokeWidth={stroke} fill="none" />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="#fff"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={c}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-base font-black leading-none text-white">{pct}%</span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-white/70">
                    Progresso
                  </span>
                </div>
              </div>

              <div className="min-w-0 max-w-[58%]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Hora de aprender</p>
                <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[28px]">
                  Flashcards
                  <span className="ml-2 font-display text-[15px] font-semibold italic text-white/75 sm:text-[20px]">
                    por matéria
                  </span>
                </h1>
                <p
                  className="mt-0.5 text-[12px] leading-snug text-white/80 sm:text-[13px]"
                  style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                >
                  Vire, marque e revise o que ainda não fixou.
                </p>
              </div>
            </div>

            <div className="relative mt-3 rounded-xl bg-black/85 text-white shadow-lg ring-1 ring-black/20">
              <div className="grid grid-cols-3 divide-x divide-white/10">
                <Metric label="Sequência" value={`${dash?.streak ?? 0}`} sufixo=" dias" />
                <Metric label="Estudados" value={(dash?.estudados ?? 0).toLocaleString('pt-BR')} />
                <div className="flex flex-col items-center justify-center px-2 py-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Compreendidos</span>
                  <span className="mt-0.5 font-display text-base font-black leading-none text-[hsl(var(--aprender-accent))]">
                    {(dash?.compreendidos ?? 0).toLocaleString('pt-BR')}
                    <span className="text-white/50">/{(dash?.total_cards ?? 0).toLocaleString('pt-BR')}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-5 px-4 pt-5 sm:px-6">
          {/* Ação principal */}
          <button
            onClick={() => { haptic.selection(); navigate('/flashcards/estudar'); }}
            className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 active:scale-[0.99]"
          >
            <span className="aprender-icon-shine relative flex h-12 w-12 shrink-0 items-center justify-center">
              <Layers className="h-8 w-8 text-primary" strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold text-foreground">Praticar</span>
              <span className="block text-[12px] text-muted-foreground">Por categorias</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>


          {/* Pontos a reforçar */}
          {!!dash?.temas_criticos?.length && (
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Pontos a reforçar
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {dash.temas_criticos.map((t, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      navigate(
                        `/flashcards/estudar?area=${encodeURIComponent(t.area)}&temas=${encodeURIComponent(t.tema)}&modo=revisar`,
                      )
                    }
                    className="shrink-0 rounded-full border border-border bg-card px-3.5 py-2 text-xs text-foreground transition-colors hover:border-primary/40"
                  >
                    {t.tema} <span className="font-semibold text-primary">· {t.total}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Áreas */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Matérias</p>
            </div>


            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar matéria..."
                className="h-11 rounded-full pl-9"
              />
            </div>

            <div className="space-y-2">
              {loading ? (
                [...Array(6)].map((_, i) => <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-muted" />)
              ) : lista.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-6 w-6" />
                  Nenhuma matéria encontrada.
                </div>
              ) : (
                lista.map((a) => {
                  const p = a.total_cards ? Math.round((Number(a.compreendidos) / a.total_cards) * 100) : 0;
                  const { icon: Icon, color } = getAreaVisual(a.area);
                  return (
                    <button
                      key={a.area}
                      onClick={() => { haptic.selection(); setAreaSheet(a.area); }}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.995] sm:p-3.5"
                    >
                      <div className="aprender-icon-shine relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
                        <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.9} style={{ color }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground sm:text-[16px]"
                            style={{ fontFamily: "'Barlow', system-ui, sans-serif", letterSpacing: '-0.005em' }}
                          >
                            {a.area}
                          </p>
                          <span
                            className={[
                              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                              p > 0
                                ? 'bg-[hsl(var(--aprender-accent)/0.18)] text-[hsl(var(--aprender-accent))]'
                                : 'bg-muted text-muted-foreground',
                            ].join(' ')}
                          >
                            {p}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted-foreground sm:text-[13px]">
                          {a.total_cards.toLocaleString('pt-BR')} cards
                          {Number(a.a_revisar) > 0 && ` · ${a.a_revisar} para revisar`}
                        </p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[hsl(var(--aprender-accent))] transition-all"
                            style={{ width: `${p}%` }}
                          />
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {(dash?.streak ?? 0) > 0 && (
            <p className="flex items-center justify-center gap-1.5 pt-1 text-[12px] text-muted-foreground">
              <Flame className="h-4 w-4 text-[#f97316]" /> {dash?.streak} dias seguidos estudando
            </p>
          )}
        </div>
      </div>

      <AreaTemasSheet
        area={areaSheet}
        open={!!areaSheet}
        onOpenChange={(v) => !v && setAreaSheet(null)}
      />
      <FlashcardsBottomNav />
    </div>
  );
};

function Metric({ label, value, sufixo }: { label: string; value: string; sufixo?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">{label}</span>
      <span className="mt-0.5 font-display text-base font-black leading-none">
        {value}
        {sufixo && <span className="text-white/50">{sufixo}</span>}
      </span>
    </div>
  );
}

export default Flashcards;
