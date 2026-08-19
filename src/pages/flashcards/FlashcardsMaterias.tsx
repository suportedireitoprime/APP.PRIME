import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { ChevronRight, Search, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';

const FlashcardsMaterias = () => {
  const navigate = useNavigate();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];
  
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [areaSheet, setAreaSheet] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Flashcards Matérias | Vade Mecum PRIME';
  }, []);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const l = q ? areas.filter((a) => a.area.toLowerCase().includes(q)) : [...areas];
    l.sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
    return l;
  }, [areas, busca]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-28 lg:pb-12">
      <PageHeader title="Matérias" onBack={() => navigate('/flashcards')} />
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 mt-4">
        
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            Escolher Matéria
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione uma matéria para acessar os temas disponíveis e gerar seus flashcards.
          </p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Matérias ({lista.length})
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

          {loadingAreas ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse border border-border/60 bg-muted/40" />
              ))}
            </div>
          ) : lista.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              <Sparkles className="mx-auto mb-2 h-7 w-7 text-[#36AF85]" />
              Nenhuma matéria encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {lista.map((a) => {
                const { icon: Icon } = getAreaVisual(a.area);
                return (
                  <button
                    key={a.area}
                    onClick={() => { haptic.selection(); setAreaSheet(a.area); }}
                    className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#36AF85]/50 transition-colors active:scale-95 text-center"
                  >
                    <div className="flex items-center justify-center text-[#36AF85] group-hover:scale-110 transition-transform">
                      <Icon className="h-8 w-8 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(54,175,133,0.9)]" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-foreground group-hover:text-[#36AF85] transition-colors leading-tight">
                        {a.area}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AreaTemasSheet
        area={areaSheet}
        open={!!areaSheet}
        onOpenChange={(v) => !v && setAreaSheet(null)}
      />
    </div>
  );
};

export default FlashcardsMaterias;
