import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';

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
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [areaSheet, setAreaSheet] = useState<string | null>(null);

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Flashcards | Vade Mecum PRIME';
  }, []);

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

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const l = q ? areas.filter((a) => a.area.toLowerCase().includes(q)) : [...areas];
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
  const paraHoje = Number(dash?.a_revisar ?? 0) || Number(dash?.hoje ?? 0);
  const criticos = (dash?.temas_criticos ?? []).slice(0, 4);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-28 lg:pb-12 pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <PageHeader title="Flashcards" onBack={() => navigate('/')} />

        <div className="pt-3 space-y-6">
          {/* ── Painel de Status & Data ───────────────────────── */}
          <section
            aria-label="Sessão de hoje"
            className="relative overflow-hidden rounded-3xl p-5 sm:p-7 text-primary-foreground shadow-xl border border-white/10"
            style={{
              background:
                'linear-gradient(155deg, hsl(var(--primary) / 0.96) 0%, hsl(348 72% 34%) 62%, hsl(348 70% 24%) 100%)',
            }}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />

            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur-md">
                <Calendar className="h-3.5 w-3.5" />
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground/90 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Users className="h-3.5 w-3.5 text-amber-300" />
                1.420 estudantes praticando hoje
              </span>
            </div>

            <div className="mt-4">
              <h1 className="font-display text-[24px] sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                {paraHoje > 0 ? (
                  <>
                    {paraHoje.toLocaleString('pt-BR')}
                    <span className="ml-2.5 text-base sm:text-lg font-bold text-primary-foreground/80">
                      {paraHoje === 1 ? 'card agendado para revisão' : 'cards agendados para revisão'}
                    </span>
                  </>
                ) : (
                  'Sua revisão de hoje está 100% em dia!'
                )}
              </h1>

              <div className="mt-4 flex items-center gap-3 max-w-md">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary-foreground/25">
                  <div
                    className="h-full rounded-full bg-primary-foreground transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-black tabular-nums text-primary-foreground/90">
                  {pct}% dominado
                </span>
              </div>

              {(dash?.streak ?? 0) > 0 && (
                <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-primary-foreground/85">
                  <Flame className="h-4 w-4 text-amber-300 fill-amber-300" /> {dash?.streak} dias seguidos praticando
                </p>
              )}
            </div>
          </section>

          {/* ── Reforçar (só quando existe) ──────────────────────────── */}
          {!!criticos.length && (
            <section>
              <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Tópicos críticos para reforçar
              </p>
              <div className="flex flex-wrap gap-2">
                {criticos.map((t, i) => (
                  <button
                    key={`${t.area}-${t.tema}-${i}`}
                    onClick={() =>
                      navigate(
                        `/flashcards/estudar?area=${encodeURIComponent(t.area)}&temas=${encodeURIComponent(t.tema)}&modo=revisar`,
                      )
                    }
                    className="shrink-0 rounded-2xl border border-border/80 bg-card/90 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary/50 hover:bg-card active:scale-95 shadow-sm"
                  >
                    <span>{t.tema}</span>
                    <span className="ml-2 font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t.total}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Matérias / Decks em Grid Responsivo ───────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Escolher Matéria ({lista.length})
              </p>
              <button
                onClick={() => {
                  haptic.selection();
                  setBuscaAberta((v) => !v);
                  if (buscaAberta) setBusca('');
                }}
                aria-label={buscaAberta ? 'Fechar busca' : 'Buscar matéria'}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {buscaAberta ? <X className="h-4.5 w-4.5" /> : <Search className="h-4.5 w-4.5" />}
              </button>
            </div>

            {buscaAberta && (
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar matéria..."
                className="h-11 rounded-2xl border-border bg-card shadow-sm"
              />
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl animate-pulse border border-border/60 bg-muted/40" />
                ))}
              </div>
            ) : lista.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                <Sparkles className="mx-auto mb-2 h-7 w-7 text-primary" />
                Nenhuma matéria encontrada.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
                {lista.map((a) => {
                  const p = a.total_cards ? Math.round((Number(a.compreendidos) / a.total_cards) * 100) : 0;
                  const { icon: Icon, color } = getAreaVisual(a.area);
                  return (
                    <button
                      key={a.area}
                      onClick={() => { haptic.selection(); setAreaSheet(a.area); }}
                      className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.99] gap-3"
                    >
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110" strokeWidth={1.8} style={{ color }} />
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight">
                              {a.area}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                              {a.total_cards.toLocaleString('pt-BR')} cards
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black tabular-nums text-foreground">
                            {p}%
                          </span>
                          <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* Barra de Progresso Elegante na Matéria */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
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

export default Flashcards;
