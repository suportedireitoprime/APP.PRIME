import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Filter, Lock, Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

const db = supabase as any;

export type QuestoesFiltro = {
  segmentos: string[];
  disciplinas: string[];
  assuntos: string[];
  anos: string[];
  status: string;
  ordem: 'embaralhado' | 'original';
  quantidade: number | null;
};

export const FILTRO_KEY = 'questoes:filtro';

export const FILTRO_VAZIO: QuestoesFiltro = {
  segmentos: [], disciplinas: [], assuntos: [], anos: [],
  status: 'todos', ordem: 'embaralhado', quantidade: null,
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
  { id: 'todos', label: 'Todos' },
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
function StepRow({
  step, label, hint, onClick, locked, active, done, badge,
}: {
  step: number; label: string; hint: string; onClick: () => void;
  locked?: boolean; active?: boolean; done?: boolean; badge?: number;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all',
        'bg-card/50 shadow-sm backdrop-blur-md',
        active ? 'border-primary/50 bg-primary/5 shadow-primary/10' : done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/50',
        !locked && 'hover:bg-foreground/[0.04] active:scale-[0.98]',
        locked && 'cursor-not-allowed opacity-50 grayscale-[0.5]',
      )}
    >
      <span className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-bold tabular-nums transition-colors',
        done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
          : active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
          : 'bg-foreground/[0.06] text-foreground/50',
      )}>
        {done ? <Check className="h-5 w-5" strokeWidth={3} /> : step}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15.5px] font-bold text-foreground">{label}</span>
          {active && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Aberto
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-muted-foreground/80">{hint}</span>
      </span>
      {locked ? (
        <Lock className="h-5 w-5 shrink-0 text-foreground/30" />
      ) : (
        <span className="flex shrink-0 items-center gap-2">
          {!!badge && (
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-primary px-2 text-[12px] font-bold text-primary-foreground">
              {badge}
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-foreground/40" />
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------- sub-sheet de seleção */
function SelecaoSheet({
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

  const lista = useMemo(() => {
    const termo = q.trim().toLowerCase();
    const base = termo ? opcoes.filter((o) => o.toLowerCase().includes(termo)) : opcoes;
    return base;
  }, [opcoes, q]);

  const toggle = (o: string) => {
    haptic.selection?.();
    setLocal((p) => (single ? (p[0] === o ? [] : [o]) : p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
  };

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-20 flex flex-col bg-background/95 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 border-b border-border/50 px-3 pt-safe-header pb-3 bg-background/80">
        <button onClick={onFechar} aria-label="Voltar" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <p className="flex-1 text-center text-[18px] font-bold text-foreground">{titulo}</p>
        <button onClick={() => setLocal([])} className="px-3 text-[14px] font-medium text-primary hover:text-primary-light active:scale-95">
          Limpar
        </button>
      </div>

      {buscavel && (
        <div className="border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Buscar ${titulo.toLowerCase()}`}
              aria-label={`Buscar ${titulo}`}
              className="h-10 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      <ul className="flex-1 divide-y divide-border overflow-y-auto px-4">
        {!single && (
          <li>
            <button
              onClick={() => setLocal([])}
              className="flex min-h-[56px] w-full items-center gap-3 py-3.5 text-left"
            >
              <span className="flex-1 text-[15px] font-semibold text-foreground">Todos</span>
              <span className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2',
                local.length === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/30',
              )}>
                {local.length === 0 && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          </li>
        )}
        {lista.map((o) => {
          const ativo = local.includes(o);
          return (
            <li key={o}>
              <button onClick={() => toggle(o)} className="flex min-h-[60px] w-full items-center gap-3 py-3.5 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-tight text-foreground">{o}</span>
                  {descricoes?.[o] && (
                    <span className="mt-1 block text-[12px] leading-snug text-foreground/55">{descricoes[o]}</span>
                  )}
                </span>
                {contagens?.[o] !== undefined && (
                  <span className="grid h-6 min-w-[44px] place-items-center rounded-full bg-primary/15 px-2 text-[11px] font-bold tabular-nums text-primary">
                    {fmt(contagens[o])}
                  </span>
                )}
                <span className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center border-2 transition-colors',
                  single ? 'rounded-full' : 'rounded-md',
                  ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/30',
                )}>
                  {ativo && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
        {lista.length === 0 && (
          <li className="py-10 text-center text-[13px] text-muted-foreground">Nada encontrado.</li>
        )}
      </ul>

      <div className="border-t border-border/50 bg-background/80 backdrop-blur-md px-5 pb-safe-nav pt-4">
        <button
          onClick={() => { onConfirmar(local); onFechar(); }}
          className="h-14 w-full rounded-2xl bg-primary shadow-lg shadow-primary/25 text-[16px] font-bold text-primary-foreground active:scale-[0.98] transition-all"
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
  const assuntos = useMemo(
    () => Object.keys(counts.assuntos).sort((a, b) => counts.assuntos[b] - counts.assuntos[a]),
    [counts.assuntos],
  );
  const anos = useMemo(
    () => Object.keys(counts.anos).sort((a, b) => Number(b) - Number(a)),
    [counts.anos],
  );

  const proximo = !f.segmentos.length ? 'segmento'
    : !f.disciplinas.length ? 'disciplinas'
    : !f.assuntos.length ? 'assuntos'
    : 'status';

  const selecionados =
    f.segmentos.length + f.disciplinas.length + f.assuntos.length + f.anos.length +
    (f.status !== 'todos' ? 1 : 0);

  const limpar = () => setF({ ...FILTRO_VAZIO });

  const aplicar = () => {
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
            className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%', pointerEvents: 'none' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="theme-questoes fixed inset-0 z-[71] flex flex-col overflow-hidden bg-background"
          >
            <div className="flex items-center gap-3 px-4 pb-4 pt-safe-header border-b border-border/50 bg-background/80 backdrop-blur-md">
              <button onClick={onFechar} aria-label="Voltar" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors active:scale-95">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[20px] font-bold text-foreground tracking-tight">
                  <Filter className="h-5 w-5 text-primary" /> Filtrar questões
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground/80 truncate">
                  Refine por segmento, disciplina, assunto e mais.
                </p>
              </div>
              <button onClick={limpar} className="px-3 text-[14px] font-medium text-primary hover:text-primary-light active:scale-95">
                Limpar
              </button>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-4">
              <StepRow
                step={1} label="Segmento"
                hint={f.segmentos.length ? f.segmentos.map((s) => SEGMENTOS.find((x) => x.id === s)?.label ?? s).join(', ') : 'Escolha em qual base você quer praticar'}
                active={proximo === 'segmento'} done={!!f.segmentos.length}
                badge={f.segmentos.length}
                onClick={() => setPasso('segmento')}
              />
              <StepRow
                step={2} label="Disciplinas"
                hint={f.disciplinas.length ? `${f.disciplinas.length} selecionada(s)` : 'Todas as disciplinas'}
                locked={!f.segmentos.length} active={proximo === 'disciplinas'} done={!!f.disciplinas.length}
                badge={f.disciplinas.length}
                onClick={() => setPasso('disciplinas')}
              />
              <StepRow
                step={3} label="Assuntos"
                hint={f.assuntos.length ? `${f.assuntos.length} selecionado(s)` : 'Todos os assuntos'}
                locked={!f.disciplinas.length} active={proximo === 'assuntos'} done={!!f.assuntos.length}
                badge={f.assuntos.length}
                onClick={() => setPasso('assuntos')}
              />
              <StepRow
                step={4} label="Status"
                hint={STATUS.find((s) => s.id === f.status)?.label ?? 'Todos'}
                locked={!f.segmentos.length} done={f.status !== 'todos'}
                onClick={() => setPasso('status')}
              />
              <StepRow
                step={5} label="Ano"
                hint={f.anos.length ? f.anos.join(', ') : 'Todos os anos'}
                locked={!f.segmentos.length} done={!!f.anos.length}
                badge={f.anos.length}
                onClick={() => setPasso('anos')}
              />
              <StepRow
                step={6} label="Quantidade"
                hint={f.quantidade ? `${f.quantidade} questões` : 'Todas as questões do filtro'}
                done={!!f.quantidade}
                onClick={() => setPasso('quantidade')}
              />

              <div className="flex items-center gap-2 rounded-2xl border border-border bg-foreground/[0.04] px-3.5 py-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ordem</span>
                <div className="ml-auto flex gap-1 rounded-full bg-muted/50 p-1">
                  {(['embaralhado', 'original'] as const).map((o) => (
                    <button
                      key={o}
                      onClick={() => setF((p) => ({ ...p, ordem: o }))}
                      className={cn(
                        'h-8 rounded-full px-3 text-[12.5px] font-semibold transition-colors',
                        f.ordem === o ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {o === 'embaralhado' ? 'Embaralhado' : 'Ordem original'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border/50 bg-background/80 backdrop-blur-md px-5 pb-safe-nav pt-4">
              <button
                onClick={aplicar}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-[16px] font-bold text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
              >
                {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Filter className="h-5 w-5" fill="currentColor" />}
                Aplicar filtros
                <span className="ml-2 rounded-full bg-black/20 px-2.5 py-0.5 text-[13px] tabular-nums font-extrabold tracking-wide">
                  {fmt(counts.total)}
                </span>
              </button>
              {selecionados > 0 && (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-[15px] font-bold text-primary">
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
                  opcoes={assuntos} contagens={counts.assuntos}
                  selecionado={f.assuntos}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({ ...p, assuntos: v, anos: [] }))}
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
                  key="status" titulo="Status" single
                  opcoes={STATUS.map((s) => s.label)}
                  selecionado={[STATUS.find((s) => s.id === f.status)?.label ?? 'Todos']}
                  onFechar={() => setPasso(null)}
                  onConfirmar={(v) => setF((p) => ({ ...p, status: STATUS.find((s) => s.label === v[0])?.id ?? 'todos' }))}
                />
              )}
              {passo === 'quantidade' && (
                <SelecaoSheet
                  key="qtd" titulo="Quantidade" single
                  opcoes={QUANTIDADES.map((q) => (q ? `${q} questões` : 'Todas'))}
                  selecionado={[f.quantidade ? `${f.quantidade} questões` : 'Todas']}
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
