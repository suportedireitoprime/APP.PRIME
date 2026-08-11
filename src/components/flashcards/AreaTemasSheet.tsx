import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';

type Tema = { tema: string; total: number };

type Props = {
  area: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

/** Sheet de baixo pra cima (90dvh) para escolher os temas de uma área. */
const AreaTemasSheet = ({ area, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState<string[]>([]);

  const { icon: Icon, color } = getAreaVisual(area ?? '');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open || !area) return;
    setSel([]);
    setBusca('');
    setLoading(true);
    supabase.rpc('flashcards_temas', { _area: area }).then(({ data }) => {
      setTemas(((data as any[]) || []).map((t) => ({ tema: t.tema, total: Number(t.total) })));
      setLoading(false);
    });

    // Prefetch all cards for this area immediately to guarantee instantaneous loading
    queryClient.prefetchQuery({
      queryKey: ['flashcards_sessao', { areas: [area], temas: null, modo: 'todos', deckId: null, limit: 30 }],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('flashcards_sessao', {
          _areas: [area],
          _temas: null,
          _modo: 'todos',
          _deck_id: null,
          _limit: 30,
        });
        if (error) throw error;
        return data || [];
      },
    });
  }, [open, area, queryClient]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? temas.filter((t) => t.tema?.toLowerCase().includes(q)) : temas;
  }, [temas, busca]);

  const totalSel = useMemo(
    () => (sel.length ? temas.filter((t) => sel.includes(t.tema)).reduce((s, t) => s + t.total, 0) : temas.reduce((s, t) => s + t.total, 0)),
    [sel, temas],
  );

  const toggle = (tema: string) => {
    haptic.selection();
    setSel((s) => (s.includes(tema) ? s.filter((x) => x !== tema) : [...s, tema]));
  };

  const estudar = () => {
    if (!area) return;
    const p = new URLSearchParams({ area });
    if (sel.length) p.set('temas', sel.join('|'));
    onOpenChange(false);
    navigate(`/flashcards/estudar?${p.toString()}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[90dvh] max-h-[90dvh] flex-col gap-0 rounded-t-3xl border-t p-0"
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center gap-3 px-5 pb-3 pr-14 pt-3 sm:px-6 sm:pr-16">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <Icon className="h-8 w-8" strokeWidth={1.9} style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Área</p>
            <SheetTitle
              className="line-clamp-2 text-[17px] font-bold leading-snug sm:text-lg"
              style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
            >
              {area}
            </SheetTitle>
          </div>
        </div>

        <div className="px-4 pb-3 sm:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar matéria..."
              className="h-11 rounded-full pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4 sm:px-6">
          <button
            onClick={() => { haptic.selection(); setSel([]); }}
            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
              sel.length === 0 ? 'border-primary/50 bg-primary/10' : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${color}26` }}
            >
              <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block text-[15px] font-semibold text-foreground"
                style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
              >
                Todas as matérias
              </span>
              <span className="block text-[12px] text-muted-foreground">
                {temas.length} matérias · {temas.reduce((s, t) => s + t.total, 0).toLocaleString('pt-BR')} cards
              </span>
            </span>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                sel.length === 0
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/60 bg-muted-foreground/15'
              }`}
            >
              {sel.length === 0 && <Check className="h-4 w-4" />}
            </span>
          </button>

          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="h-[62px] animate-pulse rounded-2xl bg-muted" />)
          ) : filtrados.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma matéria encontrada.</p>
          ) : (
            filtrados.map((t) => {
              const ativo = sel.includes(t.tema);
              return (
                <button
                  key={t.tema}
                  onClick={() => toggle(t.tema)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                    ativo ? 'border-primary/50 bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${color}26` }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[15px] font-semibold text-foreground"
                      style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                    >
                      {t.tema || 'Sem matéria'}
                    </span>
                    <span className="block text-[12px] text-muted-foreground">
                      {t.total.toLocaleString('pt-BR')} cards
                    </span>
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                      ativo
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/60 bg-muted-foreground/15'
                    }`}
                  >
                    {ativo && <Check className="h-4 w-4" />}
                  </span>
                </button>
              );
            })
          )}

        </div>

        <div className="border-t border-border bg-background px-4 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-3 sm:px-6">
          <Button onClick={estudar} className="h-14 w-full rounded-2xl text-[15px] font-bold">
            Praticar {sel.length ? `${sel.length} matéria${sel.length > 1 ? 's' : ''}` : 'tudo'} ·{' '}
            {totalSel.toLocaleString('pt-BR')} cards
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AreaTemasSheet;
