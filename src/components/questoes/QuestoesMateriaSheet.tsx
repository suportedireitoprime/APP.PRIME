import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase as db } from '@/integrations/supabase/client';
import { Loader2, BookOpen, ChevronLeft } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { StepRow, SelecaoSheet } from './QuestoesFiltroSheet';

interface QuestoesMateriaSheetProps {
  materia: string | null;
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
}

export function QuestoesMateriaSheet({ materia, aberto, onOpenChange }: QuestoesMateriaSheetProps) {
  const navigate = useNavigate();
  const [assuntos, setAssuntos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [assuntoSelecionado, setAssuntoSelecionado] = useState<string[]>([]);
  const [qtd, setQtd] = useState<string>('10');
  const [passo, setPasso] = useState<null | 'tema' | 'quantidade'>(null);

  useEffect(() => {
    if (aberto && materia) {
      setLoading(true);
      setAssuntoSelecionado([]);
      setQtd('10');
      db.rpc('questoes_filtro_counts', {
        _segmentos: null,
        _disciplinas: [materia],
        _assuntos: null,
        _anos: null,
        _bancas: null,
      }).then(({ data, error }) => {
        if (!error && data) {
          setAssuntos((data as any).assuntos || {});
        }
        setLoading(false);
      });
    }
  }, [aberto, materia]);

  const listaAssuntosObj = useMemo(() => {
    return Object.entries(assuntos)
      .sort((a, b) => b[1] - a[1])
      .map(([nome, count]) => ({ nome, count }));
  }, [assuntos]);

  const totalMateria = useMemo(() => {
    return listaAssuntosObj.reduce((acc, a) => acc + a.count, 0);
  }, [listaAssuntosObj]);

  const handlePraticar = () => {
    if (!materia) return;
    haptic.selection();
    const params = new URLSearchParams();
    params.set('area', materia);
    
    // Se o usuário selecionou temas específicos (não vazio)
    if (assuntoSelecionado.length > 0 && !assuntoSelecionado.includes('Todos os temas')) {
      params.set('filtro', '1');
      const filtroData = {
        segmentos: [],
        disciplinas: [materia],
        assuntos: assuntoSelecionado,
        anos: [],
        status: [],
        ordem: 'embaralhado',
        quantidade: qtd === 'Todas' ? null : Number(qtd),
      };
      localStorage.setItem('questoes:filtro', JSON.stringify(filtroData));
    } else {
      if (qtd !== 'Todas') {
        params.set('qtd', qtd);
      }
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
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%', pointerEvents: 'none' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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

            <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 className="h-8 w-8 animate-spin text-[#F87171] mb-4" />
                  <p className="text-sm">Carregando temas...</p>
                </div>
              ) : (
                <>
                  <StepRow
                    step={1} label="Tema"
                    hint={assuntoSelecionado.length ? `${assuntoSelecionado.length} selecionado(s)` : 'Todos os temas'}
                    active={passo === 'tema'}
                    done={assuntoSelecionado.length > 0}
                    badge={assuntoSelecionado.length || undefined}
                    onClick={() => setPasso('tema')}
                  />
                  <StepRow
                    step={2} label="Quantas questões?"
                    hint={qtd === 'Todas' ? 'Todas as questões disponíveis' : `${qtd} questões`}
                    active={passo === 'quantidade'}
                    done={true}
                    onClick={() => setPasso('quantidade')}
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
              <button
                onClick={handlePraticar}
                disabled={loading}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-hero-panel hover:brightness-110 text-[16px] font-black text-white shadow-lg shadow-black/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                Começar a Praticar
              </button>
            </div>

            <AnimatePresence>
              {passo === 'tema' && (
                <SelecaoSheet
                  key="tema" titulo="Tema" buscavel
                  opcoes={listaAssuntosObj.map((a) => a.nome)}
                  contagens={Object.fromEntries(listaAssuntosObj.map((a) => [a.nome, a.count]))}
                  selecionado={assuntoSelecionado}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setAssuntoSelecionado(v)}
                />
              )}
              {passo === 'quantidade' && (
                <SelecaoSheet
                  key="qtd" titulo="Quantidade" single
                  opcoes={['10 questões', '20 questões', '50 questões', 'Todas']}
                  selecionado={[qtd === 'Todas' ? 'Todas' : `${qtd} questões`]}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => {
                    const sel = v[0];
                    if (sel) {
                      if (sel === 'Todas') setQtd('Todas');
                      else setQtd(sel.split(' ')[0]);
                    }
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
