import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import { DesafiosCarousel } from '@/components/flashcards/DesafiosCarousel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X, Trophy, Layers, Target, BarChart3 } from 'lucide-react';
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
  const [desafiosSheet, setDesafiosSheet] = useState(false);

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
          {/* ── Desafios ───────────────────────── */}
          <DesafiosCarousel dash={dash} onVerTodos={() => setDesafiosSheet(true)} />

          {/* ── Ações Rápidas (3 botões) ───────────────── */}
          <section className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/progresso'); }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/50 transition-colors active:scale-95 gap-3"
            >
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground text-center leading-tight">Meu Progresso</p>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/decks'); }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/50 transition-colors active:scale-95 gap-3"
            >
              <Layers className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground text-center leading-tight">Meus Decks</p>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/desafios'); }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/50 transition-colors active:scale-95 gap-3"
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
                        <div className="flex items-center gap-4 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" 
                            style={{ backgroundColor: `${color}20`, boxShadow: `0 4px 14px 0 ${color}40` }}
                          >
                            <Icon className="h-5 w-5" strokeWidth={2.2} style={{ color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight">
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

      <Sheet open={desafiosSheet} onOpenChange={setDesafiosSheet}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl sm:max-w-md mx-auto">
          <SheetHeader className="text-left pb-4 border-b border-border/50">
            <SheetTitle className="text-xl font-black flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Todos os Desafios
            </SheetTitle>
          </SheetHeader>
          <div className="pt-4 overflow-y-auto space-y-3 pb-20">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm active:scale-95 transition-all cursor-pointer">
              <h3 className="font-bold text-sm mb-1">Desafio 1</h3>
              <p className="text-xs text-muted-foreground">Estude 15 cards de Constitucional</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm active:scale-95 transition-all cursor-pointer">
              <h3 className="font-bold text-sm mb-1">Desafio 2</h3>
              <p className="text-xs text-muted-foreground">Domine a Lei Seca (20 cards)</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <FlashcardsBottomNav />
    </div>
  );
};

export default Flashcards;
