import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase as db } from '@/integrations/supabase/client';
import { Loader2, BookOpen, ChevronLeft, Filter } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { StepRow, SelecaoSheet, type QuestoesFiltro, FILTRO_VAZIO, STATUS } from './QuestoesFiltroSheet';

interface QuestoesMateriaSheetProps {
  materia: string | null;
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

type Counts = {
  assuntos: Record<string, number>;
  anos: Record<string, number>;
  total: number;
};

export function QuestoesMateriaSheet({ materia, aberto, onOpenChange }: QuestoesMateriaSheetProps) {
  const navigate = useNavigate();
  const [f, setF] = useState<QuestoesFiltro>(FILTRO_VAZIO);
  const [passo, setPasso] = useState<null | 'assuntos' | 'anos' | 'status' | 'quantidade'>(null);
  
  const [counts, setCounts] = useState<Counts>({ assuntos: {}, anos: {}, total: 0 });
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!aberto || !materia) return;
    setF({ ...FILTRO_VAZIO, disciplinas: [materia] });
  }, [aberto, materia]);

  useEffect(() => {
    if (!aberto || !materia) return;
    let cancelado = false;
    setCarregando(true);
    db.rpc('questoes_filtro_counts', {
      _segmentos: null,
      _disciplinas: [materia],
      _assuntos: f.assuntos.length ? f.assuntos : null,
      _anos: f.anos.length ? f.anos.map(Number) : null,
      _bancas: null,
    }).then(({ data, error }: any) => {
      if (cancelado) return;
      if (data) setCounts(data);
      setCarregando(false);
    });
    return () => { cancelado = true; };
  }, [aberto, materia, f.assuntos, f.anos]);

  const { assuntosPrincipais, contagensAssuntos, mapaInverso } = useMemo(() => {
    const principais = new Set<string>();
    const contagens: Record<string, number> = {};
    const inverso: Record<string, string> = {}; 

    Object.entries(counts.assuntos).forEach(([raw, count]) => {
      const parts = raw.split(' > ');
      const main = parts[0].trim();
      
      principais.add(main);
      contagens[main] = (contagens[main] || 0) + count;
      inverso[raw] = main;
    });

    const lista = Array.from(principais).sort((a, b) => contagens[b] - contagens[a]);
    
    return { assuntosPrincipais: lista, contagensAssuntos: contagens, mapaInverso: inverso };
  }, [counts.assuntos]);

  const assuntosSelecionadosPrincipais = useMemo(() => {
    const selecionados = new Set<string>();
    f.assuntos.forEach(raw => {
      const main = mapaInverso[raw] || raw.split(' > ')[0].trim();
      selecionados.add(main);
    });
    return Array.from(selecionados);
  }, [f.assuntos, mapaInverso]);

  const anos = useMemo(
    () => Object.keys(counts.anos).sort((a, b) => Number(b) - Number(a)),
    [counts.anos]
  );

  const selecionados = f.assuntos.length + f.anos.length + (f.status.length > 0 ? 1 : 0) + (f.quantidade ? 1 : 0);

  const handlePraticar = () => {
    if (!materia) return;
    haptic.selection?.();
    const params = new URLSearchParams();
    params.set('area', materia);
    
    if (selecionados > 0 || f.ordem !== 'embaralhado') {
      params.set('filtro', '1');
      localStorage.setItem('questoes:filtro', JSON.stringify({ ...f, disciplinas: [materia] }));
    }
    
    onOpenChange(false);
    navigate(`/questoes/praticar?${params.toString()}`);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0, pointerEvents: 'none' }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            className="theme-questoes fixed inset-0 z-[71] flex flex-col overflow-hidden bg-zinc-950 text-foreground md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:border-l md:border-zinc-800/80 md:shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 pb-4 pt-safe-header border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md">
              <button onClick={() => onOpenChange(false)} aria-label="Voltar" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition-colors active:scale-95">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[22px] font-display font-bold text-zinc-100 tracking-wide uppercase">
                  <BookOpen className="h-5 w-5 text-[#F87171]" />
                  <span className="truncate">{materia}</span>
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-zinc-400 truncate">
                  Configure sua sessão de estudos para esta matéria.
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-4 pt-2">
              <StepRow
                step={1} label="Tema"
                hint={assuntosSelecionadosPrincipais.length ? `${assuntosSelecionadosPrincipais.length} selecionado(s)` : 'Todos os temas'}
                active={passo === 'assuntos'} done={!!f.assuntos.length}
                badge={assuntosSelecionadosPrincipais.length || undefined}
                onClick={() => setPasso('assuntos')}
              />
              <StepRow
                step={2} label="Status"
                hint={f.status.length ? `${f.status.length} selecionado(s)` : 'Todos os status'}
                done={!!f.status.length}
                badge={f.status.length || undefined}
                onClick={() => setPasso('status')}
              />
              <StepRow
                step={3} label="Ano"
                hint={f.anos.length ? (f.anos.length === anos.length && anos.length > 0 ? 'Todos os anos' : f.anos.join(', ')) : 'Todos os anos'}
                done={!!f.anos.length}
                badge={f.anos.length}
                onClick={() => setPasso('anos')}
              />
              <StepRow
                step={4} label="Quantidade"
                hint={f.quantidade ? `${f.quantidade} questões` : 'Todas as questões disponíveis'}
                done={!!f.quantidade}
                onClick={() => setPasso('quantidade')}
              />

              <div className="flex items-center gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 px-3.5 py-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Ordem</span>
                <div className="ml-auto flex gap-1 rounded-full bg-zinc-900 border border-zinc-800 p-1">
                  {(['embaralhado', 'original'] as const).map((o) => (
                    <button
                      key={o}
                      onClick={() => setF((p) => ({ ...p, ordem: o }))}
                      className={cn(
                        'h-8 rounded-full px-3 text-[12.5px] font-bold transition-all',
                        f.ordem === o ? 'bg-hero-panel text-white shadow-md shadow-[#E11D48]/20 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]' : 'text-zinc-400 hover:text-zinc-200',
                      )}
                    >
                      {o === 'embaralhado' ? 'Embaralhado' : 'Ordem original'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
              <button
                onClick={handlePraticar}
                disabled={carregando}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-hero-panel hover:brightness-110 text-[16px] font-black text-white shadow-lg shadow-black/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]"
              >
                {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Filter className="h-5 w-5 drop-shadow-md" fill="currentColor" />}
                Começar a Praticar
                <span className="ml-2 rounded-full bg-black/30 px-2.5 py-0.5 text-[13px] tabular-nums font-extrabold tracking-wide">
                  {fmt(counts.total)}
                </span>
              </button>
            </div>

            <AnimatePresence>
              {passo === 'assuntos' && (
                <SelecaoSheet
                  key="ass" titulo="Assuntos" buscavel
                  opcoes={assuntosPrincipais}
                  contagens={contagensAssuntos}
                  selecionado={f.assuntos}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => {
                    const expanded = v.flatMap((main) => {
                       const found = Object.keys(counts.assuntos).filter(raw => raw.startsWith(main));
                       return found.length > 0 ? found : [main];
                    });
                    setF(p => ({ ...p, assuntos: expanded }));
                  }}
                />
              )}
              {passo === 'status' && (
                <SelecaoSheet
                  key="st" titulo="Status"
                  opcoes={STATUS.map(s => s.id)}
                  descricoes={Object.fromEntries(STATUS.map(s => [s.id, s.label]))}
                  selecionado={f.status}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF(p => ({ ...p, status: v }))}
                />
              )}
              {passo === 'anos' && (
                <SelecaoSheet
                  key="ano" titulo="Ano" buscavel
                  opcoes={anos}
                  contagens={counts.anos}
                  selecionado={f.anos}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF(p => ({ ...p, anos: v }))}
                />
              )}
              {passo === 'quantidade' && (
                <SelecaoSheet
                  key="qtd" titulo="Quantidade" single
                  opcoes={['10 questões', '20 questões', '50 questões', '100 questões', 'Todas as questões']}
                  selecionado={[f.quantidade ? `${f.quantidade} questões` : 'Todas as questões']}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => {
                    const sel = v[0];
                    if (sel && sel.includes('Todas')) setF(p => ({ ...p, quantidade: null }));
                    else if (sel) setF(p => ({ ...p, quantidade: Number(sel.split(' ')[0]) }));
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
