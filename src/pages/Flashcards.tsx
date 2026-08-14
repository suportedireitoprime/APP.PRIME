import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X, Layers, Target, BarChart3, FolderPlus, RotateCcw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';
import FlashcardsCargoHero from '@/components/flashcards/FlashcardsCargoHero';
import { useFlashcardsDashboard, useFlashcardsResumoAreas, FlashcardsAreaRow, FlashcardsDash } from '@/lib/flashcardsQueries';

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
  const { data: dash, isLoading: loadingDash } = useFlashcardsDashboard();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];
  
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [areaSheet, setAreaSheet] = useState<string | null>(null);

  const loading = loadingDash || loadingAreas;

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Flashcards | Vade Mecum PRIME';
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

        <div className="-mx-3 sm:-mx-6 lg:-mx-8 mb-6 mt-1">
          <FlashcardsCargoHero 
            pct={pct} 
            total={dash?.estudados || 0} 
            hoje={dash?.hoje || 0} 
            meta={100} 
            disponiveis={dash?.total_cards || 0} 
          />
        </div>
        
        <div className="pt-1 space-y-6">
          {/* ── Card Principal com Botão "Filtro Rápido" ───────────────── */}
          <div className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">Praticar Flashcards</h2>
            </div>
            <p className="ml-3 mt-1 text-xs text-muted-foreground">
              Escolha filtros personalizados e comece sua rotina de revisão.
            </p>

            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/estudar'); }}
              className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-base sm:text-lg font-black shadow-xl shadow-[#5B21B6]/35 transition-all active:scale-[0.99] border border-purple-400/30"
            >
              <Filter className="h-6 w-6 text-white" strokeWidth={2.5} />
              <span className="tracking-wide text-white">Filtro Rápido</span>
              <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Ações Rápidas (3 botões) ───────────────── */}
          <section className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/decks'); }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95 gap-3"
            >
              <FolderPlus className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground text-center leading-tight">Meus Decks</p>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/revisar'); }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95 gap-3"
            >
              <RotateCcw className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground text-center leading-tight">Minha Revisão</p>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/desafios'); }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95 gap-3"
            >
              <Target className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground text-center leading-tight">Meus Desafios</p>
            </button>
          </section>

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
                <Sparkles className="mx-auto mb-2 h-7 w-7 text-success" />
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
                      className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 text-left transition-all hover:border-success/50 hover:shadow-md active:scale-[0.99] gap-3"
                    >
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-4 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                          >
                            <Icon className="h-5 w-5 text-success" strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-foreground group-hover:text-success transition-colors tracking-tight">
                              {a.area}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              {a.total_cards.toLocaleString('pt-BR')} cards
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </div>
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
