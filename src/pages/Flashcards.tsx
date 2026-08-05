import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import { ChevronRight, Flame, Search, Sparkles, X } from 'lucide-react';
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
    <div className="min-h-dvh overflow-x-hidden bg-background pb-32">
      <div className="mx-auto w-full max-w-2xl">
        <PageHeader title="Flashcards" onBack={() => navigate('/')} />

        <div className="px-4 pt-3 sm:px-6">
          {/* ── Foco único: uma sessão por vez ───────────────────────── */}
          <section
            aria-label="Sessão de estudo"
            className="relative overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-lg"
            style={{
              background:
                'linear-gradient(155deg, hsl(var(--primary) / 0.96) 0%, hsl(348 72% 34%) 62%, hsl(348 70% 24%) 100%)',
            }}

          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />

            <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground/70">
              Sessão de hoje
            </p>
            <h1 className="relative mt-1 font-display text-[26px] font-black leading-tight sm:text-[30px]">
              {paraHoje > 0 ? (
                <>
                  {paraHoje.toLocaleString('pt-BR')}
                  <span className="ml-2 text-[16px] font-semibold text-primary-foreground/75 sm:text-[18px]">
                    {paraHoje === 1 ? 'card para revisar' : 'cards para revisar'}
                  </span>
                </>
              ) : (
                'Tudo em dia'
              )}
            </h1>

            <button
              onClick={() => {
                haptic.selection();
                navigate(paraHoje > 0 ? '/flashcards/estudar?modo=revisar' : '/flashcards/estudar');
              }}
              className="relative mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary-foreground text-[15px] font-bold text-primary transition-transform active:scale-[0.98]"
            >
              {paraHoje > 0 ? 'Começar revisão' : 'Estudar novos cards'}
            </button>

            <div className="relative mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-foreground/25">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-[12px] font-bold tabular-nums text-primary-foreground/85">
                {pct}% dominado
              </span>
            </div>

            {(dash?.streak ?? 0) > 0 && (
              <p className="relative mt-2.5 flex items-center gap-1.5 text-[12px] text-primary-foreground/75">
                <Flame className="h-3.5 w-3.5" /> {dash?.streak} dias seguidos
              </p>
            )}
          </section>

          {/* ── Reforçar (só quando existe) ──────────────────────────── */}
          {!!criticos.length && (
            <section className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Reforçar
              </p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
                {criticos.map((t, i) => (
                  <button
                    key={`${t.area}-${t.tema}-${i}`}
                    onClick={() =>
                      navigate(
                        `/flashcards/estudar?area=${encodeURIComponent(t.area)}&temas=${encodeURIComponent(t.tema)}&modo=revisar`,
                      )
                    }
                    className="shrink-0 rounded-full border border-border bg-card px-3.5 py-2 text-[13px] text-foreground transition-colors hover:border-primary/40"
                  >
                    {t.tema}
                    <span className="ml-1 font-semibold text-primary">{t.total}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Matérias ─────────────────────────────────────────────── */}
          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Escolher matéria
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
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar matéria..."
                className="mb-3 h-11 rounded-full"
              />
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse border-b border-border/60 bg-muted/40 last:border-0" />
                ))
              ) : lista.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
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
                      className="flex min-h-[68px] w-full items-center gap-3 border-b border-border/60 px-3.5 py-4 text-left transition-colors last:border-0 hover:bg-muted/40 active:bg-muted/60"
                    >
                      <Icon className="h-6 w-6 shrink-0" strokeWidth={1.8} style={{ color }} />

                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[15px] text-foreground"
                          style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                        >
                          {a.area}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-muted-foreground">
                          {a.total_cards.toLocaleString('pt-BR')} cards
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2">
                        <span className="w-9 text-right text-[12px] font-semibold tabular-nums text-muted-foreground">
                          {p}%
                        </span>
                        <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-muted sm:block">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${p}%` }}
                          />
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
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
