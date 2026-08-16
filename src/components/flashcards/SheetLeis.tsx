import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';

type Tema = { tema: string; total: number };

type Props = {
  area: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

// Palavras-chave que indicam que o tema é uma lei/norma
const isLei = (tema: string) => {
  const t = tema.toLowerCase();
  return (
    t.includes('lei') ||
    t.includes('código') ||
    t.includes('estatuto') ||
    t.includes('constituição') ||
    t.includes('cf') ||
    t.includes('súmula') ||
    t.includes('resolução') ||
    t.includes('decreto') ||
    t.includes('clt')
  );
};

/** Sheet para escolher apenas os temas de LEIS de uma área. */
const SheetLeis = ({ area, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState<string[]>([]);

  const { icon: Icon } = getAreaVisual(area ?? '');

  useEffect(() => {
    if (!open || !area) return;
    setSel([]);
    setBusca('');
    setLoading(true);
    supabase.rpc('flashcards_temas', { _area: area }).then(({ data }) => {
      const allTemas = ((data as any[]) || []).map((t) => ({ tema: t.tema, total: Number(t.total) }));
      // Filtra apenas os temas que parecem ser leis
      const leisTemas = allTemas.filter(t => isLei(t.tema));
      setTemas(leisTemas);
      setLoading(false);
    });
  }, [open, area]);

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
            <Icon className="h-8 w-8 text-success" strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Leis - {area}</p>
            <SheetTitle
              className="line-clamp-2 text-[17px] font-bold leading-snug sm:text-lg"
              style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
            >
              Escolha as leis para revisar
            </SheetTitle>
          </div>
        </div>

        <div className="px-5 pb-3 sm:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar lei..."
              className="h-11 rounded-2xl border-border bg-muted/30 pl-10 text-[15px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-24 sm:px-6">
          {loading ? (
            <div className="space-y-2 py-4">
              <div className="h-14 animate-pulse rounded-2xl bg-muted/50" />
              <div className="h-14 animate-pulse rounded-2xl bg-muted/50" />
              <div className="h-14 animate-pulse rounded-2xl bg-muted/50" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <p className="text-sm font-medium">Nenhuma lei encontrada para esta matéria.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setSel([])}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
                  sel.length === 0 ? 'border-success bg-success/10' : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div>
                  <p className={`text-[15px] font-bold ${sel.length === 0 ? 'text-success' : 'text-foreground'}`}>
                    Todas as Leis
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {temas.reduce((acc, curr) => acc + curr.total, 0)} cards disponíveis
                  </p>
                </div>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                    sel.length === 0 ? 'border-success bg-success' : 'border-muted-foreground/30'
                  }`}
                >
                  {sel.length === 0 && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>

              {filtrados.map((t) => {
                const isSel = sel.includes(t.tema);
                return (
                  <button
                    key={t.tema}
                    onClick={() => toggle(t.tema)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
                      isSel ? 'border-success bg-success/5' : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="pr-4">
                      <p className={`text-[14px] font-bold leading-tight ${isSel ? 'text-success' : 'text-foreground'}`}>
                        {t.tema}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{t.total} cards</p>
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSel ? 'border-success bg-success' : 'border-muted-foreground/30 bg-card'
                      }`}
                    >
                      {isSel && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-5 pt-4 backdrop-blur-xl border-t sm:px-6 pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
          <Button
            onClick={estudar}
            disabled={loading || temas.length === 0}
            className="h-14 w-full rounded-2xl bg-[#36AF85] text-[16px] font-black tracking-wide text-white shadow-xl shadow-[#36AF85]/30 hover:bg-[#2C9570] active:scale-[0.99]"
          >
            Começar Revisão ({totalSel} cards)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SheetLeis;
