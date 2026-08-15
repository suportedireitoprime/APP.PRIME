import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Filter, Lock, Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

const db = supabase as any;

export type QuestoesFiltro = {
  segmentos: string[];
  disciplinas: string[];
  assuntos: string[];
  anos: string[];
  status: string[];
  ordem: 'embaralhado' | 'original';
  quantidade: number | null;
};

export const FILTRO_KEY = 'questoes:filtro';

export const FILTRO_VAZIO: QuestoesFiltro = {
  segmentos: [], disciplinas: [], assuntos: [], anos: [],
  status: [], ordem: 'embaralhado', quantidade: null,
};

export function lerFiltroSalvo(): QuestoesFiltro | null {
  try {
    const raw = sessionStorage.getItem(FILTRO_KEY);
    return raw ? { ...FILTRO_VAZIO, ...JSON.parse(raw) } : null;
  } catch { return null; }
}

const SEGMENTOS = [
  { id: 'conceituais', label: 'Conceituais', desc: 'Teoria e fundamentos.' },
  { id: 'concursos', label: 'Concursos', desc: 'Concursos de todas as bancas.' },
  { id: 'policiais', label: 'Carreiras policiais', desc: 'Polícia Civil, Federal, PRF e afins.' },
  { id: 'oab', label: 'OAB', desc: 'Exame de Ordem (FGV).' },
];

const STATUS = [
  { id: 'nao_resolvidas', label: 'Não resolvi' },
  { id: 'resolvidas', label: 'Resolvi' },
  { id: 'acertei', label: 'Acertei' },
  { id: 'errei', label: 'Errei' },
];

const QUANTIDADES = [null, 10, 20, 50, 100] as const;

type Counts = {
  segmentos: Record<string, number>;
  disciplinas: Record<string, number>;
  assuntos: Record<string, number>;
  anos: Record<string, number>;
  total: number;
};

const DEFAULT_COUNTS: Counts = {
  segmentos: { conceituais: 4098, concursos: 7466, policiais: 3120, oab: 1195 },
  disciplinas: {},
  assuntos: {},
  anos: {},
  total: 15879,
};

let cachedCountsMemory: Counts | null = null;
function getInitialCounts(): Counts {
  if (cachedCountsMemory) return cachedCountsMemory;
  try {
    const raw = sessionStorage.getItem('questoes:counts-cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.segmentos && Object.keys(parsed.segmentos).length > 0) {
        cachedCountsMemory = parsed;
        return parsed;
      }
    }
  } catch { /* noop */ }
  return DEFAULT_COUNTS;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

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
          ? 'border-[#E11D48]/60 bg-[#E11D48]/8 shadow-lg shadow-[#E11D48]/10'
          : done
            ? 'border-emerald-500/30 bg-zinc-900/90 shadow-sm'
            : 'border-zinc-800/80 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800/60 active:scale-[0.98]',
      )}
    >
      <span className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-black tabular-nums transition-all',
        done
          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
          : active
            ? 'bg-hero-panel text-white shadow-md shadow-[#E11D48]/30 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
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
            <span className="rounded-full bg-[#E11D48]/20 border border-[#E11D48]/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#E11D48]">
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
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-hero-panel px-2 text-[12px] font-black text-white shadow-sm shadow-[#E11D48]/30 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
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
  titulo, opcoes, contagens, descricoes, selecionado, single, onFechar, onConfirmar, buscavel,
}: {
  titulo: string;
  opcoes: string[];
  contagens?: Record<string, number>;
  descricoes?: Record<string, string>;
  selecionado: string[];
  single?: boolean;
  buscavel?: boolean;
  onFechar: () => void;
  onConfirmar: (v: string[]) => void;
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
  
  const rowVirtualizer = useVirtualizer({
    count: lista.length + (hasTodos ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
       if (hasTodos && index === 0) return 56;
       return 60;
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
          className="px-3 text-[14px] font-bold text-[#E11D48] hover:text-[#BE123C] active:scale-95 transition-colors"
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
        {lista.length === 0 ? (
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
                      <span className="flex-1 text-[15px] font-bold text-zinc-100 group-hover:text-white transition-colors">
                        Todos
                      </span>
                      <span className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-all',
                        isAllSelected
                          ? 'border-[#E11D48] bg-hero-panel text-white shadow-md shadow-[#E11D48]/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
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
                        {o}
                      </span>
                      {descricoes?.[o] && (
                        <span className="mt-1 block text-[12px] leading-snug text-zinc-400">{descricoes[o]}</span>
                      )}
                    </span>
                    {contagens?.[o] !== undefined && (
                      <span className="grid h-6 min-w-[44px] place-items-center rounded-full bg-[#E11D48]/15 px-2 text-[11px] font-extrabold tabular-nums text-[#E11D48]">
                        {fmt(contagens[o])}
                      </span>
                    )}
                    <span className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-all',
                      ativo
                        ? 'border-[#E11D48] bg-hero-panel text-white shadow-md shadow-[#E11D48]/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
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
          className="h-14 w-full rounded-2xl bg-hero-panel hover:brightness-110 text-white font-black text-[16px] shadow-lg shadow-[#E11D48]/30 active:scale-[0.98] transition-all"
        >
          Confirmar seleção
        </button>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------- filtro principal */
const QuestoesFiltroSheet = ({
  aberto, onFechar, onAplicar,
}: {
  aberto: boolean;
  onFechar: () => void;
  onAplicar: (f: QuestoesFiltro) => void;
}) => {
  const [f, setF] = useState<QuestoesFiltro>(() => lerFiltroSalvo() ?? FILTRO_VAZIO);
  const [passo, setPasso] = useState<null | 'segmento' | 'disciplinas' | 'assuntos' | 'anos' | 'status' | 'quantidade'>(null);
  const [counts, setCounts] = useState<Counts>(getInitialCounts);
  const [carregando, setCarregando] = useState(false);

  // Contagens reais do banco conforme o que já foi escolhido
  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;
    setCarregando(true);
    db.rpc('questoes_filtro_counts', {
      _segmentos: f.segmentos.length ? f.segmentos : null,
      _disciplinas: f.disciplinas.length ? f.disciplinas : null,
      _assuntos: f.assuntos.length ? f.assuntos : null,
      _anos: f.anos.length ? f.anos.map(Number) : null,
      _bancas: null,
    }).then(({ data, error }: any) => {
      if (cancelado) return;
      if (error) console.error('[questoes] counts', error);
      if (data) {
        setCounts(data);
        cachedCountsMemory = data;
        try { sessionStorage.setItem('questoes:counts-cache', JSON.stringify(data)); } catch { /* noop */ }
      }
      setCarregando(false);
    });
    return () => { cancelado = true; };
  }, [aberto, f.segmentos, f.disciplinas, f.assuntos, f.anos]);

  const disciplinas = useMemo(
    () => Object.keys(counts.disciplinas).sort((a, b) => counts.disciplinas[b] - counts.disciplinas[a]),
    [counts.disciplinas],
  );

  const { assuntosPrincipais, contagensAssuntos, mapaAssuntos, mapaInverso } = useMemo(() => {
    const principais = new Set<string>();
    const contagens: Record<string, number> = {};
    const mapa: Record<string, string[]> = {}; // principal -> raw[]
    const inverso: Record<string, string> = {}; // raw -> principal

    Object.entries(counts.assuntos).forEach(([raw, count]) => {
      const parts = raw.split(' > ');
      const main = parts[0].trim();
      
      principais.add(main);
      contagens[main] = (contagens[main] || 0) + count;
      
      if (!mapa[main]) mapa[main] = [];
      mapa[main].push(raw);
      inverso[raw] = main;
    });

    const lista = Array.from(principais).sort((a, b) => contagens[b] - contagens[a]);
    
    return { assuntosPrincipais: lista, contagensAssuntos: contagens, mapaAssuntos: mapa, mapaInverso: inverso };
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
    [counts.anos],
  );

  const proximo = !f.segmentos.length ? 'segmento'
    : !f.disciplinas.length ? 'disciplinas'
    : !f.assuntos.length ? 'assuntos'
    : null;

  const selecionados =
    f.segmentos.length + f.disciplinas.length + f.assuntos.length + f.anos.length +
    (f.status?.length > 0 ? 1 : 0) +
    (f.quantidade ? 1 : 0);

  const limpar = () => setF({ ...FILTRO_VAZIO });

  const aplicar = () => {
    if (!f.segmentos.length) {
      haptic.error();
      toast('Escolha o segmento primeiro', { description: 'O segmento é obrigatório para aplicar filtros.' });
      return;
    }
    if (!f.disciplinas.length) {
      haptic.error();
      toast('Escolha as disciplinas', { description: 'Você precisa selecionar pelo menos uma disciplina.' });
      return;
    }
    if (!f.assuntos.length) {
      haptic.error();
      toast('Escolha os assuntos', { description: 'Você precisa selecionar pelo menos um assunto.' });
      return;
    }

    haptic.success?.();
    try { sessionStorage.setItem(FILTRO_KEY, JSON.stringify(f)); } catch { /* noop */ }
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
            className="theme-questoes fixed inset-0 z-[71] flex flex-col overflow-hidden bg-zinc-950 text-foreground md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:border-l md:border-zinc-800/80 md:shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 pb-4 pt-safe-header border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md">
              <button onClick={onFechar} aria-label="Voltar" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition-colors active:scale-95">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[20px] font-extrabold text-zinc-100 tracking-tight">
                  <Filter className="h-5 w-5 text-[#E11D48]" /> Filtrar questões
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-zinc-400 truncate">
                  Refine por segmento, disciplina, assunto e mais.
                </p>
              </div>
              <button onClick={limpar} className="px-3 text-[14px] font-bold text-[#E11D48] hover:text-[#BE123C] active:scale-95 transition-colors">
                Limpar
              </button>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-4 pt-2">
              <StepRow
                step={1} label="Segmento"
                hint={f.segmentos.length ? (f.segmentos.length === SEGMENTOS.length ? 'Todos os segmentos' : f.segmentos.map((s) => SEGMENTOS.find((x) => x.id === s)?.label ?? s).join(', ')) : 'Escolha em qual base você quer praticar'}
                active={proximo === 'segmento'} done={!!f.segmentos.length}
                badge={f.segmentos.length}
                onClick={() => setPasso('segmento')}
              />
              <StepRow
                step={2} label="Disciplinas"
                hint={f.disciplinas.length ? `${f.disciplinas.length} selecionada(s)` : 'Todas as disciplinas'}
                locked={!f.segmentos.length} active={proximo === 'disciplinas'} done={!!f.disciplinas.length}
                badge={f.disciplinas.length}
                lockedMessage="Escolha o segmento primeiro."
                onClick={() => setPasso('disciplinas')}
              />
              <StepRow
                step={3} label="Assuntos"
                hint={assuntosSelecionadosPrincipais.length ? `${assuntosSelecionadosPrincipais.length} selecionado(s)` : 'Todos os assuntos'}
                locked={!f.disciplinas.length} active={proximo === 'assuntos'} done={!!f.assuntos.length}
                badge={assuntosSelecionadosPrincipais.length || undefined}
                lockedMessage="Escolha as disciplinas primeiro."
                onClick={() => setPasso('assuntos')}
              />
              <StepRow
                step={4} label="Status"
                hint={f.status.length ? `${f.status.length} selecionado(s)` : 'Todos os status'}
                locked={!f.segmentos.length} done={!!f.status.length}
                badge={f.status.length || undefined}
                lockedMessage="Escolha o segmento primeiro."
                onClick={() => setPasso('status')}
              />
              <StepRow
                step={5} label="Ano"
                hint={f.anos.length ? (f.anos.length === anos.length && anos.length > 0 ? 'Todos os anos' : f.anos.join(', ')) : 'Todos os anos'}
                locked={!f.segmentos.length} done={!!f.anos.length}
                badge={f.anos.length}
                lockedMessage="Escolha o segmento primeiro."
                onClick={() => setPasso('anos')}
              />
              <StepRow
                step={6} label="Quantidade"
                hint={f.quantidade ? `${f.quantidade} questões` : 'Todas as questões do filtro'}
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
                onClick={aplicar}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-hero-panel hover:brightness-110 text-[16px] font-black text-white shadow-lg shadow-[#E11D48]/30 active:scale-[0.98] transition-all [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]"
              >
                {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Filter className="h-5 w-5 drop-shadow-md" fill="currentColor" />}
                Aplicar filtros
                <span className="ml-2 rounded-full bg-black/30 px-2.5 py-0.5 text-[13px] tabular-nums font-extrabold tracking-wide">
                  {fmt(counts.total)}
                </span>
              </button>
              {selecionados > 0 && (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#E11D48]/15 border border-[#E11D48]/30 text-[15px] font-black text-[#E11D48]">
                  {selecionados}
                </span>
              )}
            </div>

            <AnimatePresence>
              {passo === 'segmento' && (
                <SelecaoSheet
                  key="seg" titulo="Segmento"
                  opcoes={SEGMENTOS.map((s) => s.label)}
                  contagens={Object.fromEntries(SEGMENTOS.map((s) => [s.label, counts.segmentos[s.id] ?? 0]))}
                  descricoes={Object.fromEntries(SEGMENTOS.map((s) => [s.label, s.desc]))}
                  selecionado={f.segmentos.map((id) => SEGMENTOS.find((s) => s.id === id)?.label ?? id)}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({
                    ...p,
                    segmentos: v.map((l) => SEGMENTOS.find((s) => s.label === l)?.id ?? l),
                    disciplinas: [], assuntos: [], anos: [],
                  }))}
                />
              )}
              {passo === 'disciplinas' && (
                <SelecaoSheet
                  key="disc" titulo="Disciplinas" buscavel
                  opcoes={disciplinas} contagens={counts.disciplinas}
                  selecionado={f.disciplinas}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({ ...p, disciplinas: v, assuntos: [], anos: [] }))}
                />
              )}
              {passo === 'assuntos' && (
                <SelecaoSheet
                  key="ass" titulo="Assuntos" buscavel
                  opcoes={assuntosPrincipais} contagens={contagensAssuntos}
                  selecionado={assuntosSelecionadosPrincipais}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => {
                    const newRawAssuntos: string[] = [];
                    v.forEach(main => {
                      if (mapaAssuntos[main]) {
                        newRawAssuntos.push(...mapaAssuntos[main]);
                      } else {
                        newRawAssuntos.push(main);
                      }
                    });
                    setF((p) => ({ ...p, assuntos: newRawAssuntos, anos: [] }));
                  }}
                />
              )}
              {passo === 'anos' && (
                <SelecaoSheet
                  key="anos" titulo="Ano"
                  opcoes={anos} contagens={counts.anos}
                  selecionado={f.anos}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({ ...p, anos: v }))}
                />
              )}
              {passo === 'status' && (
                <SelecaoSheet
                  key="status" titulo="Status"
                  opcoes={STATUS.map((s) => s.label)}
                  selecionado={f.status.map(id => STATUS.find(s => s.id === id)?.label ?? id)}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({ ...p, status: v.map(label => STATUS.find(s => s.label === label)?.id ?? label) }))}
                />
              )}
              {passo === 'quantidade' && (
                <SelecaoSheet
                  key="qtd" titulo="Quantidade" single
                  opcoes={QUANTIDADES.map((q) => (q ? `${q} questões` : 'Todas'))}
                  selecionado={f.quantidade ? [`${f.quantidade} questões`] : []}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({
                    ...p,
                    quantidade: v[0] && v[0] !== 'Todas' ? Number(v[0].replace(/\D/g, '')) : null,
                  }))}
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

export default QuestoesFiltroSheet;
