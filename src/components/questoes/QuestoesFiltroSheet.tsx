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

const VAZIO: Counts = { segmentos: {}, disciplinas: {}, assuntos: {}, anos: {}, total: 0 };
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
        'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all',
        'bg-foreground/[0.04]',
        active ? 'border-primary/60 bg-primary/[0.07]' : done ? 'border-emerald-400/25' : 'border-border',
        !locked && 'hover:bg-foreground/[0.07] active:scale-[0.995]',
        locked && 'cursor-not-allowed opacity-55',
      )}
    >
      <span className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12.5px] font-bold tabular-nums',
        done ? 'bg-emerald-500/20 text-emerald-300'
          : active ? 'bg-primary text-primary-foreground'
          : 'bg-foreground/[0.08] text-foreground/60',
      )}>
        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : step}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[14.5px] font-semibold text-foreground">{label}</span>
          {active && (
            <span className="rounded-full bg-primary/20 px-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Próximo
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{hint}</span>
      </span>
      {locked ? (
        <Lock className="h-4 w-4 shrink-0 text-foreground/40" />
      ) : (
        <span className="flex shrink-0 items-center gap-1.5">
          {!!badge && (
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-primary/20 px-2 text-[11px] font-bold text-primary">
              {badge}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-foreground/40" />
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
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 z-10 flex flex-col rounded-t-3xl border-t border-border bg-background"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <button onClick={onFechar} aria-label="Voltar" className="grid h-11 w-11 place-items-center rounded-full bg-muted/60 text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="flex-1 text-center text-[15px] font-bold text-foreground">{titulo}</p>
        <button onClick={() => setLocal([])} className="px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground">
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

      <div className="border-t border-border px-4 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-3">
        <button
          onClick={() => { onConfirmar(local); onFechar(); }}
          className="h-12 w-full rounded-2xl bg-primary text-[15px] font-bold text-primary-foreground active:scale-[0.99]"
        >
          OK
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
  const [counts, setCounts] = useState<Counts>(VAZIO);
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
      setCounts({ ...VAZIO, ...(data ?? {}) });
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onFechar}
            className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="theme-questoes fixed inset-x-0 bottom-0 z-[71] flex h-[92dvh] flex-col overflow-hidden rounded-t-3xl border-t border-border bg-background"
          >
            <span aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/20" />

            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[19px] font-bold text-foreground">
                  <Filter className="h-5 w-5 text-primary" /> Filtrar questões
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                  Refine por segmento, disciplina, assunto, ano e situação.
                </p>
              </div>
              <button onClick={onFechar} aria-label="Fechar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted/70 text-foreground">
                <X className="h-5 w-5" />
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

            <div className="flex items-center gap-3 border-t border-border px-4 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-3">
              <button onClick={limpar} className="px-2 text-[14px] font-medium text-muted-foreground hover:text-foreground">
                Limpar
              </button>
              <button
                onClick={aplicar}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-bold text-primary-foreground active:scale-[0.99]"
              >
                {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Aplicar filtros
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[12px] tabular-nums">
                  {fmt(counts.total)}
                </span>
              </button>
              {selecionados > 0 && (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-[12px] font-bold text-primary">
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
