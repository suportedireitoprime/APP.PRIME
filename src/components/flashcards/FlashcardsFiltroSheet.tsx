import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronLeft, ChevronRight, Check, Filter, Lock, Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { QuantidadeSheet } from '@/components/flashcards/QuantidadeSheet';

export type FlashcardsFiltro = {
  disciplinas: string[];
  assuntos: string[];
  status: string[];
  quantidade: number | null;
};

export const FILTRO_FLASHCARDS_KEY = 'flashcards:filtro';

export const FILTRO_FLASHCARDS_VAZIO: FlashcardsFiltro = {
  disciplinas: [], assuntos: [], status: [], quantidade: null,
};

export function lerFiltroFlashcardsSalvo(): FlashcardsFiltro | null {
  try {
    const raw = sessionStorage.getItem(FILTRO_FLASHCARDS_KEY);
    return raw ? { ...FILTRO_FLASHCARDS_VAZIO, ...JSON.parse(raw) } : null;
  } catch { return null; }
}

const STATUS = [
  { id: 'todos', label: 'Todos os cards' },
  { id: 'novos', label: 'Novos (Não fiz)' },
  { id: 'revisar', label: 'Em revisão (Para revisar)' },
  { id: 'compreendidos', label: 'Compreendidos (Já fiz)' },
];

const QUANTIDADES = [null, 10, 20, 50, 100] as const;

/* -------------------------------------------------- passo numerado */
export function StepRow({
  step, label, hint, onClick, locked, active, done, badge, lockedMessage,
}: {
  step: number; label: string; hint: string; onClick: () => void;
  locked?: boolean; active?: boolean; done?: boolean; badge?: number; lockedMessage?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (locked) {
          haptic.error();
          toast(lockedMessage || 'Complete a etapa anterior primeiro.', {
            description: 'Essa opção está bloqueada no momento.',
          });
          return;
        }
        onClick();
      }}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all',
        active
          ? 'border-[#36AF85]/60 bg-[#36AF85]/8 shadow-lg shadow-[#36AF85]/10'
          : done
            ? 'border-[#36AF85]/30 bg-zinc-900/90 shadow-sm'
            : 'border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800/60 active:scale-[0.98]',
      )}
    >
      <span className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-black tabular-nums transition-all',
        done
          ? 'bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
          : active
            ? 'bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/30 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
            : 'bg-zinc-800 text-zinc-300',
      )}>
        {done ? <Check className="h-5 w-5 drop-shadow-md" strokeWidth={3} /> : step}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15.5px] font-bold transition-colors text-zinc-100">
            {label}
          </span>
          {active && (
            <span className="rounded-full bg-[#36AF85]/20 border border-[#36AF85]/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#36AF85]">
              Aberto
            </span>
          )}
        </span>
        <span className={cn(
          'mt-0.5 block truncate text-[13px]',
          done ? 'text-zinc-300' : 'text-zinc-400',
        )}>
          {hint}
        </span>
      </span>
      {locked ? (
        <Lock className="h-5 w-5 shrink-0 text-zinc-400" />
      ) : (
        <span className="flex shrink-0 items-center gap-2">
          {!!badge && (
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-[#36AF85] px-2 text-[12px] font-black text-white shadow-sm shadow-[#36AF85]/30 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
              {badge}
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------- sub-sheet de seleção */
export function SelecaoSheet({
  titulo, opcoes, selecionado, single, onFechar, onConfirmar, buscavel, renderOpcao, loading, totalCount, itemHeight
}: {
  titulo: string;
  opcoes: string[];
  selecionado: string[];
  single?: boolean;
  buscavel?: boolean;
  loading?: boolean;
  totalCount?: number;
  itemHeight?: number;
  onFechar: () => void;
  onConfirmar: (v: string[]) => void;
  renderOpcao?: (opcao: string) => React.ReactNode;
}) {
  const [local, setLocal] = useState<string[]>(selecionado);
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 200);

  const lista = useMemo(() => {
    const termo = debouncedQ.trim().toLowerCase();
    const base = termo ? opcoes.filter((o) => o.toLowerCase().includes(termo)) : opcoes;
    return base;
  }, [opcoes, debouncedQ]);

  const isAllSelected = !single && opcoes.length > 0 && opcoes.every((o) => local.includes(o));

  const toggleAll = () => {
    haptic.selection?.();
    if (isAllSelected) {
      setLocal([]);
    } else {
      setLocal([...opcoes]);
    }
  };

  const toggle = (o: string) => {
    haptic.selection?.();
    if (single) {
      setLocal((p) => (p[0] === o ? [] : [o]));
    } else {
      setLocal((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);
  
  const hasTodos = !single && opcoes.length > 0;
  
  const defaultHeight = itemHeight || 60;
  
  const rowVirtualizer = useVirtualizer({
    count: lista.length + (hasTodos ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
       if (hasTodos && index === 0) return 56;
       return defaultHeight;
    },
    overscan: 10,
  });

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-20 flex flex-col bg-zinc-950 text-foreground"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/80 px-3 pt-safe-header pb-3 bg-zinc-900/90 backdrop-blur-md">
        <button
          onClick={onFechar}
          aria-label="Voltar"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition-colors active:scale-95"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <p className="flex-1 text-center text-[18px] font-extrabold text-zinc-100">{titulo}</p>
        <button
          onClick={() => { haptic.selection?.(); setLocal([]); }}
          className="px-3 text-[14px] font-bold text-[#36AF85] hover:text-[#2C9570] active:scale-95 transition-colors"
        >
          Limpar
        </button>
      </div>

      {buscavel && (
        <div className="border-b border-zinc-800/80 px-4 py-2.5 bg-zinc-900/40">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Buscar ${titulo.toLowerCase()}`}
              aria-label={`Buscar ${titulo}`}
              className="h-10 flex-1 bg-transparent text-[14px] text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            {q && (
              <button onClick={() => setQ('')} className="p-1 text-zinc-400 hover:text-zinc-200">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div ref={parentRef} className="flex-1 overflow-y-auto px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#36AF85]" />
            <span className="text-[13px] font-medium">Carregando {titulo.toLowerCase()}...</span>
          </div>
        ) : lista.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-zinc-500">Nada encontrado.</div>
        ) : (
          <ul
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const isTodos = hasTodos && virtualItem.index === 0;
              const realIndex = hasTodos ? virtualItem.index - 1 : virtualItem.index;
              const o = lista[realIndex];

              if (isTodos) {
                return (
                  <li
                    key="todos"
                    className="absolute top-0 left-0 w-full border-b border-zinc-800/60 last:border-0"
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <button
                      onClick={toggleAll}
                      className="flex h-full w-full items-center gap-3 text-left group"
                    >
                      <div className="flex flex-1 items-center justify-between pr-2">
                        <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white transition-colors">
                          Todos
                        </span>
                        {totalCount !== undefined && totalCount > 0 && (
                          <span className="text-[12px] font-medium text-zinc-400 bg-zinc-800/90 border border-zinc-700/60 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            {totalCount} {totalCount === 1 ? 'card' : 'cards'}
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-all',
                        isAllSelected
                          ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
                          : 'border-zinc-700 bg-zinc-900/50 group-hover:border-zinc-500',
                      )}>
                        {isAllSelected && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              }

              const ativo = local.includes(o);
              return (
                <li
                  key={o}
                  className="absolute top-0 left-0 w-full border-b border-zinc-800/60 last:border-0"
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <button
                    onClick={() => toggle(o)}
                    className="flex h-full w-full items-center gap-3 text-left group"
                  >
                    <span className="min-w-0 flex-1">
                      <span className={cn(
                        'block text-[15px] font-semibold leading-tight transition-colors',
                        ativo ? 'text-white' : 'text-zinc-200 group-hover:text-white',
                      )}>
                        {renderOpcao ? renderOpcao(o) : o}
                      </span>
                    </span>
                    <span className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-all',
                      ativo
                        ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
                        : 'border-zinc-700 bg-zinc-900/50 group-hover:border-zinc-500',
                    )}>
                      {ativo && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
        <button
          onClick={() => {
            haptic.selection?.();
            onConfirmar(local);
            onFechar();
          }}
          className="h-14 w-full rounded-2xl bg-[#36AF85] hover:bg-[#2C9570] text-white font-black text-[16px] shadow-lg shadow-black/40 active:scale-[0.98] transition-all"
        >
          Confirmar seleção
        </button>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------- filtro principal */
const FlashcardsFiltroSheet = ({
  aberto, onFechar, onAplicar,
}: {
  aberto: boolean;
  onFechar: () => void;
  onAplicar: (f: FlashcardsFiltro) => void;
}) => {
  const [f, setF] = useState<FlashcardsFiltro>(() => lerFiltroFlashcardsSalvo() ?? FILTRO_FLASHCARDS_VAZIO);
  const [passo, setPasso] = useState<null | 'disciplinas' | 'assuntos' | 'status' | 'quantidade'>(null);
  
  const stepsRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    if (aberto && stepsRef.current) {
      gsap.fromTo(
        stepsRef.current.children,
        { opacity: 0, y: 15, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.2)' }
      );
    }
  }, [aberto]);

  const { data: areasData } = useFlashcardsResumoAreas();
  const disciplinas = useMemo(() => (areasData || []).map(a => a.area).sort((a, b) => a.localeCompare(b, 'pt-BR')), [areasData]);
  
  const [assuntosCache, setAssuntosCache] = useState<Record<string, string[]>>({});
  const [carregandoAssuntos, setCarregandoAssuntos] = useState(false);

  // Busca temas (assuntos) das disciplinas selecionadas
  useEffect(() => {
    if (!f.disciplinas.length) return;
    
    const fetchTemas = async () => {
      setCarregandoAssuntos(true);
      const newCache = { ...assuntosCache };
      let updated = false;
      
      const missingAreas = f.disciplinas.filter(area => !newCache[area]);
      
      if (missingAreas.length > 0) {
        const promises = missingAreas.map(area => 
          supabase.rpc('flashcards_temas', { _area: area }).then(({ data }) => ({
            area,
            temas: ((data as any[]) || []).map(t => t.tema)
          }))
        );
        
        const results = await Promise.all(promises);
        results.forEach(({ area, temas }) => {
          newCache[area] = temas;
        });
        updated = true;
      }
      
      if (updated) setAssuntosCache(newCache);
      setCarregandoAssuntos(false);
    };
    
    fetchTemas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.disciplinas]);

  const assuntosDisponiveis = useMemo(() => {
    const list = new Set<string>();
    f.disciplinas.forEach(d => {
      if (assuntosCache[d]) assuntosCache[d].forEach(t => list.add(t));
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [f.disciplinas, assuntosCache]);

  const proximo = !f.disciplinas.length ? 'disciplinas'
    : !f.assuntos.length ? 'assuntos'
    : null;

  const selecionados =
    f.disciplinas.length + f.assuntos.length +
    (f.status?.length > 0 ? 1 : 0) +
    (f.quantidade ? 1 : 0);

  const limpar = () => setF({ ...FILTRO_FLASHCARDS_VAZIO });

  const aplicar = () => {
    if (!f.disciplinas.length) {
      haptic.error();
      toast('Escolha a matéria primeiro', { description: 'A matéria é obrigatória para aplicar filtros.' });
      return;
    }

    haptic.success?.();
    try { sessionStorage.setItem(FILTRO_FLASHCARDS_KEY, JSON.stringify(f)); } catch { /* noop */ }
    onAplicar(f);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' }}
            onClick={onFechar}
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%', pointerEvents: 'none' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[71] flex flex-col overflow-hidden bg-zinc-950 text-foreground md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:border-l md:border-zinc-800/80 md:shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 pb-4 pt-safe-header border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md">
              <button onClick={onFechar} aria-label="Voltar" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition-colors active:scale-95">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[20px] font-extrabold text-zinc-100 tracking-tight">
                  <Filter className="h-5 w-5 text-[#36AF85]" /> Filtro Flashcards
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-zinc-400 truncate">
                  Refine por matéria, assunto, status e mais.
                </p>
              </div>
              <button onClick={limpar} className="px-3 text-[14px] font-bold text-[#36AF85] hover:text-[#2C9570] active:scale-95 transition-colors">
                Limpar
              </button>
            </div>

            <div ref={stepsRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-4 pt-2">
              <StepRow
                step={1} label="Disciplina"
                hint={f.disciplinas.length ? f.disciplinas[0] : 'Escolha a matéria'}
                active={proximo === 'disciplinas'} done={!!f.disciplinas.length}
                badge={f.disciplinas.length ? 1 : undefined}
                onClick={() => setPasso('disciplinas')}
              />
              <StepRow
                step={2} label="Assuntos"
                hint={f.assuntos.length ? `${f.assuntos.length} selecionado(s)` : (carregandoAssuntos ? 'Carregando temas...' : 'Todos os assuntos')}
                locked={!f.disciplinas.length} active={proximo === 'assuntos'} done={!!f.assuntos.length}
                badge={f.assuntos.length || undefined}
                lockedMessage="Escolha a disciplina primeiro."
                onClick={() => setPasso('assuntos')}
              />
              <StepRow
                step={3} label="Status"
                hint={f.status.length ? `${f.status.length} selecionado(s)` : 'Todos os status'}
                locked={!f.disciplinas.length} done={!!f.status.length}
                badge={f.status.length || undefined}
                lockedMessage="Escolha a disciplina primeiro."
                onClick={() => setPasso('status')}
              />
              <StepRow
                step={4} label="Quantidade"
                hint={f.quantidade ? `${f.quantidade} flashcards` : 'Todos os cards do filtro'}
                done={!!f.quantidade}
                onClick={() => setPasso('quantidade')}
              />
            </div>

            <div className="flex items-center gap-3 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
              <button
                onClick={aplicar}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#36AF85] hover:bg-[#2C9570] text-[16px] font-black text-white shadow-lg shadow-black/40 active:scale-[0.98] transition-all [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]"
              >
                <Filter className="h-5 w-5 drop-shadow-md" fill="currentColor" />
                Aplicar filtros
              </button>
              {selecionados > 0 && (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#36AF85]/15 border border-[#36AF85]/30 text-[15px] font-black text-[#36AF85]">
                  {selecionados}
                </span>
              )}
            </div>

            <AnimatePresence>
              {passo === 'disciplinas' && (
                <SelecaoSheet
                  key="disc" titulo="Disciplina" buscavel single
                  opcoes={disciplinas}
                  selecionado={f.disciplinas}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({ ...p, disciplinas: v, assuntos: [] }))}
                />
              )}
              {passo === 'assuntos' && (
                <SelecaoSheet
                  key="ass" titulo="Assuntos" buscavel
                  opcoes={assuntosDisponiveis}
                  selecionado={f.assuntos}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => {
                    setF((p) => ({ ...p, assuntos: v }));
                  }}
                />
              )}
              {passo === 'status' && (
                <SelecaoSheet
                  key="status" titulo="Status" single
                  opcoes={STATUS.map((s) => s.label)}
                  selecionado={f.status.map(id => STATUS.find(s => s.id === id)?.label ?? id)}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({ ...p, status: v.map(label => STATUS.find(s => s.label === label)?.id ?? label) }))}
                />
              )}
              {passo === 'quantidade' && (
                <QuantidadeSheet
                  key="qtd"
                  quantidadeSel={f.quantidade}
                  totalCount={0}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(qtd) => {
                    setF(p => ({ ...p, quantidade: qtd === 'todos' ? null : qtd as number }));
                    setPasso(null);
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
};

export default FlashcardsFiltroSheet;
