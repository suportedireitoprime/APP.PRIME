import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Tema = { tema: string; total: number };

type Props = {
  area: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const isLei = (tema: string) => {
  const t = tema.toLowerCase();
  return (
    t.includes('lei') || t.includes('código') || t.includes('estatuto') ||
    t.includes('constituição') || t.includes('cf') || t.includes('súmula') ||
    t.includes('resolução') || t.includes('decreto') || t.includes('clt')
  );
};

const STATUS_OPCOES = [
  { id: 'todos', label: 'Todos os cards' },
  { id: 'novos', label: 'Novos (Não fiz)' },
  { id: 'revisar', label: 'Em revisão (Para revisar)' },
  { id: 'compreendidos', label: 'Compreendidos (Já fiz)' },
];

const ORDEM_OPCOES = [
  { id: 'embaralhado', label: 'Embaralhado (Aleatório)' },
  { id: 'sequencial', label: 'Sequencial (Por artigo)' },
];

function StepRow({ step, label, hint, onClick, active, done }: any) {
  return (
    <button
      type="button"
      onClick={() => { haptic.selection(); onClick(); }}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all',
        active ? 'border-[#36AF85]/60 bg-[#36AF85]/8 shadow-lg shadow-[#36AF85]/10'
          : done ? 'border-[#36AF85]/30 bg-card shadow-sm'
            : 'border-border bg-muted/30 hover:border-border/80 active:scale-[0.98]'
      )}
    >
      <span className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-black transition-all',
        done ? 'bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
          : active ? 'bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/30'
            : 'bg-muted text-muted-foreground'
      )}>
        {done ? <Check className="h-5 w-5 drop-shadow-md" strokeWidth={3} /> : step}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-bold text-foreground">{label}</span>
        <span className={cn('mt-0.5 block truncate text-[13px]', done ? 'text-foreground/80' : 'text-muted-foreground')}>
          {hint}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </button>
  );
}

const SheetLeis = ({ area, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  
  // Estado do Filtro
  const [passo, setPasso] = useState<'main' | 'titulos' | 'status' | 'ordem'>('main');
  const [f, setF] = useState({
    titulos: [] as string[],
    status: [] as string[],
    ordem: [] as string[],
  });

  const { icon: Icon } = getAreaVisual(area ?? '');

  useEffect(() => {
    if (!open || !area) return;
    setPasso('main');
    setF({ titulos: [], status: [], ordem: [] });
    setBusca('');
    setLoading(true);
    supabase.rpc('flashcards_temas', { _area: area }).then(({ data }) => {
      const allTemas = ((data as any[]) || []).map((t) => ({ tema: t.tema, total: Number(t.total) }));
      setTemas(allTemas.filter(t => isLei(t.tema)));
      setLoading(false);
    });
  }, [open, area]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? temas.filter((t) => t.tema?.toLowerCase().includes(q)) : temas;
  }, [temas, busca]);

  const totalSel = useMemo(
    () => (f.titulos.length ? temas.filter((t) => f.titulos.includes(t.tema)).reduce((s, t) => s + t.total, 0) : temas.reduce((s, t) => s + t.total, 0)),
    [f.titulos, temas]
  );

  const toggleTitulo = (tema: string) => {
    haptic.selection();
    setF(p => ({ ...p, titulos: p.titulos.includes(tema) ? p.titulos.filter(x => x !== tema) : [...p.titulos, tema] }));
  };

  const estudar = () => {
    if (!area) return;
    const p = new URLSearchParams({ area });
    if (f.titulos.length) p.set('temas', f.titulos.join('|'));
    
    // Status
    if (f.status[0] !== 'todos') p.set('modo', f.status[0]);
    // Ordem
    if (f.ordem[0] !== 'embaralhado') p.set('ordem', f.ordem[0]);
    
    // Passar o limite total selecionado para não limitar a 30
    p.set('limite', totalSel.toString());

    onOpenChange(false);
    navigate(`/flashcards/estudar?${p.toString()}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[90dvh] max-h-[90dvh] flex-col gap-0 rounded-t-3xl border-t p-0 overflow-hidden bg-background">
        <div className="flex justify-center pt-3 shrink-0 bg-background z-10">
          <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        <AnimatePresence mode="wait">
          {passo === 'main' ? (
            <motion.div key="main" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex flex-col flex-1 h-full">
              <div className="flex items-center gap-3 px-5 pb-3 pr-14 pt-3 sm:px-6 sm:pr-16 shrink-0">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                  <Icon className="h-8 w-8 text-[#36AF85]" strokeWidth={1.9} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Filtro de Leis</p>
                  <SheetTitle className="line-clamp-2 text-[17px] font-bold leading-snug sm:text-lg">
                    {area}
                  </SheetTitle>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-24 sm:px-6 pt-2 space-y-3">
                <StepRow
                  step={1} label="Títulos / Leis"
                  hint={f.titulos.length ? `${f.titulos.length} selecionado(s)` : 'Nenhuma lei selecionada'}
                  done={f.titulos.length > 0}
                  onClick={() => setPasso('titulos')}
                />
                <StepRow
                  step={2} label="Status"
                  hint={f.status.length ? STATUS_OPCOES.find(o => o.id === f.status[0])?.label : 'Selecione um status'}
                  done={f.status.length > 0}
                  onClick={() => setPasso('status')}
                />
                <StepRow
                  step={3} label="Ordem"
                  hint={f.ordem.length ? ORDEM_OPCOES.find(o => o.id === f.ordem[0])?.label : 'Selecione a ordem'}
                  done={f.ordem.length > 0}
                  onClick={() => setPasso('ordem')}
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-5 pt-4 backdrop-blur-xl border-t sm:px-6 pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
                <Button
                  onClick={estudar}
                  disabled={loading || f.titulos.length === 0 || f.status.length === 0 || f.ordem.length === 0}
                  className="h-14 w-full rounded-2xl bg-[#217756] text-[16px] font-black tracking-wide text-white shadow-xl shadow-black/30 hover:bg-[#1A6246] active:scale-[0.99] transition-all [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]"
                >
                  Começar Revisão ({totalSel} cards)
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="sub" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex flex-col flex-1 h-full bg-background">
              <div className="flex items-center gap-2 border-b px-3 pt-2 pb-3 shrink-0">
                <button
                  onClick={() => { haptic.selection(); setPasso('main'); }}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors active:scale-95"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <p className="flex-1 text-center text-[18px] font-extrabold text-foreground">
                  {passo === 'titulos' ? 'Títulos (Leis)' : passo === 'status' ? 'Status' : 'Ordem'}
                </p>
                <div className="w-12 shrink-0" />
              </div>

              {passo === 'titulos' && (
                <>
                  <div className="px-5 py-3 border-b border-border/50 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={busca} onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar lei..."
                        className="h-11 rounded-2xl border-border bg-muted/30 pl-10 text-[15px]"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
                    {loading ? (
                      <div className="space-y-2"><div className="h-14 animate-pulse rounded-2xl bg-muted/50" /></div>
                    ) : filtrados.length === 0 ? (
                      <p className="text-center text-muted-foreground py-10">Nenhuma lei encontrada.</p>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => setF(p => ({ ...p, titulos: p.titulos.length === temas.length ? [] : temas.map(t => t.tema) }))}
                          className={cn("flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.99]", f.titulos.length === temas.length ? 'border-[#217756] bg-[#217756]/10' : 'border-border bg-card')}
                        >
                          <div>
                            <p className={cn("text-[15px] font-bold", f.titulos.length === temas.length ? 'text-[#217756]' : 'text-foreground')}>Todas as Leis</p>
                            <p className="text-xs font-medium text-muted-foreground">{temas.reduce((a, c) => a + c.total, 0)} cards</p>
                          </div>
                          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2", f.titulos.length === temas.length ? 'border-[#217756] bg-[#217756]' : 'border-muted-foreground/30')}>
                            {f.titulos.length === temas.length && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                          </div>
                        </button>
                        {filtrados.map((t) => {
                          const isSel = f.titulos.includes(t.tema);
                          return (
                            <button
                              key={t.tema} onClick={() => toggleTitulo(t.tema)}
                              className={cn("flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.99]", isSel ? 'border-[#217756] bg-[#217756]/10' : 'border-border bg-card')}
                            >
                              <div className="pr-4">
                                <p className={cn("text-[14px] font-bold leading-tight", isSel ? 'text-[#217756]' : 'text-foreground')}>{t.tema}</p>
                                <p className="mt-0.5 text-xs font-medium text-muted-foreground">{t.total} cards</p>
                              </div>
                              <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", isSel ? 'border-[#217756] bg-[#217756]' : 'border-muted-foreground/30 bg-card')}>
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
                      onClick={() => setPasso('main')}
                      className="h-14 w-full rounded-2xl bg-[#217756] text-[16px] font-black tracking-wide text-white shadow-xl shadow-black/30 hover:bg-[#1A6246] active:scale-[0.99] transition-all [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]"
                    >
                      Confirmar
                    </Button>
                  </div>
                </>
              )}

              {(passo === 'status' || passo === 'ordem') && (
                <>
                  <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
                    <div className="space-y-2">
                      {(passo === 'status' ? STATUS_OPCOES : ORDEM_OPCOES).map((o) => {
                        const isSel = (passo === 'status' ? f.status : f.ordem).includes(o.id);
                        return (
                          <button
                            key={o.id}
                            onClick={() => {
                              haptic.selection();
                              setF(p => ({ ...p, [passo]: [o.id] }));
                            }}
                            className={cn("flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.99]", isSel ? 'border-[#217756] bg-[#217756]/10' : 'border-border bg-card')}
                          >
                            <p className={cn("text-[15px] font-bold", isSel ? 'text-[#217756]' : 'text-foreground')}>{o.label}</p>
                            <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2", isSel ? 'border-[#217756] bg-[#217756]' : 'border-muted-foreground/30')}>
                              {isSel && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-5 pt-4 backdrop-blur-xl border-t sm:px-6 pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
                    <Button
                      onClick={() => setPasso('main')}
                      className="h-14 w-full rounded-2xl bg-[#217756] text-[16px] font-black tracking-wide text-white shadow-xl shadow-black/30 hover:bg-[#1A6246] active:scale-[0.99] transition-all [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]"
                    >
                      Confirmar
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default SheetLeis;
