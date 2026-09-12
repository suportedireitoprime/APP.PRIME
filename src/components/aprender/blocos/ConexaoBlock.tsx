import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCircle2, GitFork, Link2, RotateCw, X, Zap } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type ParConexao = { termo: string; definicao: string; explicacao?: string };

interface Props {
  pares: ParConexao[];
  /** Chamado quando todos os pares foram ligados corretamente. */
  onCompleto?: () => void;
}

function embaralhar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const GRAPH_COLORS = [
  {
    border: 'border-emerald-500/60',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    socket: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]',
    ring: 'ring-1 ring-emerald-500/40',
  },
  {
    border: 'border-sky-500/60',
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
    badge: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    socket: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]',
    ring: 'ring-1 ring-sky-500/40',
  },
  {
    border: 'border-amber-500/60',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    socket: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]',
    ring: 'ring-1 ring-amber-500/40',
  },
  {
    border: 'border-purple-500/60',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    socket: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.9)]',
    ring: 'ring-1 ring-purple-500/40',
  },
  {
    border: 'border-rose-500/60',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    socket: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.9)]',
    ring: 'ring-1 ring-rose-500/40',
  },
];

/**
 * Grafo interativo de conexões conceituais:
 * Apresenta nós de conceitos à esquerda e nós de definições à direita,
 * com sockets de conexão visual, feedback háptico e animações fluidas.
 */
export function ConexaoBlock({ pares, onCompleto }: Props) {
  const lista = useMemo(() => pares.filter((p) => p?.termo && p?.definicao).slice(0, 5), [pares]);
  const [ordemDefs, setOrdemDefs] = useState<number[]>(() => embaralhar(lista.map((_, i) => i)));
  const [ordemTermos, setOrdemTermos] = useState<number[]>(() => embaralhar(lista.map((_, i) => i)));
  const [termoSel, setTermoSel] = useState<number | null>(null);
  const [ligados, setLigados] = useState<number[]>([]);
  const [erro, setErro] = useState<{ termo: number; def: number } | null>(null);

  const totalPares = lista.length;
  const concluido = totalPares > 0 && ligados.length === totalPares;

  if (totalPares === 0) return null;

  const escolherTermo = (i: number) => {
    if (ligados.includes(i)) return;
    haptic.selection();
    setErro(null);
    setTermoSel((atual) => (atual === i ? null : i));
  };

  const escolherDefinicao = (di: number) => {
    if (ligados.includes(di)) return;
    if (termoSel == null) {
      haptic.selection();
      return;
    }
    if (di === termoSel) {
      haptic.impact('medium');
      const novos = [...ligados, di];
      setLigados(novos);
      setTermoSel(null);
      setErro(null);
      if (novos.length === totalPares) {
        haptic.notification('success');
        onCompleto?.();
      }
    } else {
      haptic.notification('warning');
      setErro({ termo: termoSel, def: di });
      setTermoSel(null);
      window.setTimeout(() => setErro(null), 800);
    }
  };

  const recomecar = () => {
    haptic.selection();
    setLigados([]);
    setTermoSel(null);
    setErro(null);
    setOrdemDefs(embaralhar(lista.map((_, i) => i)));
    setOrdemTermos(embaralhar(lista.map((_, i) => i)));
  };

  return (
    <motion.article
      className="max-w-[76ch] mx-auto py-3 px-1 sm:px-2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          <GitFork className="h-3.5 w-3.5" /> Grafo de Conexões
        </span>
        {ligados.length > 0 && (
          <button
            onClick={recomecar}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5 active:scale-95"
          >
            <RotateCw className="h-3 w-3" /> Reiniciar
          </button>
        )}
      </div>

      <h2 className="mb-2 font-sans text-lg sm:text-xl font-bold leading-snug text-white">
        Conecte os conceitos aos seus efeitos e significados
      </h2>
      <p className="mb-5 text-[14px] sm:text-[15px] leading-relaxed text-neutral-300">
        Toque no nó do <strong className="text-white">conceito</strong> e em seguida no nó do seu{' '}
        <strong className="text-white">significado</strong> para fechar a conexão no grafo.
      </p>

      {/* Barra de Conexões Ativas */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <Zap className="w-3.5 h-3.5 text-primary" /> Conexões estabelecidas
          </span>
          <span className="text-primary font-bold tabular-nums">
            {ligados.length} de {totalPares} nós
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
            initial={false}
            animate={{ width: `${(ligados.length / totalPares) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Grid de Nós do Grafo (Lado a Lado em telas médias/grandes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative">
        {/* Coluna Esquerda: Conceitos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Nós de Origem (Conceito)</span>
          </div>

          {ordemTermos.map((i) => {
            const indexLigado = ligados.indexOf(i);
            const feito = indexLigado !== -1;
            const sel = termoSel === i;
            const errado = erro?.termo === i;
            const colorTheme = feito ? GRAPH_COLORS[indexLigado % GRAPH_COLORS.length] : null;

            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => escolherTermo(i)}
                disabled={feito}
                animate={errado ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                whileTap={{ scale: feito ? 1 : 0.98 }}
                className={`group relative flex w-full items-center justify-between gap-4 rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 min-h-[64px] cursor-pointer ${
                  feito && colorTheme
                    ? `${colorTheme.border} ${colorTheme.bg} ${colorTheme.ring} shadow-md`
                    : errado
                    ? 'border-rose-500/60 bg-rose-500/10 text-white'
                    : sel
                    ? 'border-primary bg-primary/20 ring-2 ring-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)] text-white'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.08] text-neutral-200 backdrop-blur-sm shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1">
                  {feito && colorTheme ? (
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-[12px] font-black ${colorTheme.badge}`}>
                      <Link2 className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[12px] font-bold text-neutral-400 shadow-inner">
                      {lista.indexOf(lista[i]) + 1}
                    </span>
                  )}
                  <span className={`font-semibold text-[15px] sm:text-[16px] leading-snug break-words ${feito && colorTheme ? colorTheme.text : 'text-white'}`}>
                    {lista[i].termo}
                  </span>
                </div>

                {/* Socket de Conexão na borda direita */}
                <div className="relative flex items-center justify-center shrink-0 ml-1">
                  <span
                    className={`h-4 w-4 rounded-full border-2 transition-all ${
                      feito && colorTheme
                        ? colorTheme.socket
                        : sel
                        ? 'border-primary bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary))]'
                        : 'border-white/20 bg-neutral-800'
                    }`}
                  />
                  {sel && (
                    <span className="absolute h-6 w-6 rounded-full border border-primary animate-ping pointer-events-none" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Coluna Direita: Significados */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-500" />
            <span>Nós de Destino (Significado)</span>
          </div>

          {ordemDefs.map((di) => {
            const indexLigado = ligados.indexOf(di);
            const feito = indexLigado !== -1;
            const errado = erro?.def === di;
            const aguardando = termoSel != null && !feito;
            const colorTheme = feito ? GRAPH_COLORS[indexLigado % GRAPH_COLORS.length] : null;

            return (
              <motion.button
                key={di}
                type="button"
                onClick={() => escolherDefinicao(di)}
                disabled={feito || termoSel == null}
                animate={errado ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                whileTap={{ scale: feito || termoSel == null ? 1 : 0.98 }}
                className={`group relative flex w-full items-start gap-4 rounded-3xl border p-4 sm:p-5 text-left transition-all duration-200 min-h-[64px] ${
                  feito && colorTheme
                    ? `${colorTheme.border} ${colorTheme.bg} ${colorTheme.ring} shadow-md`
                    : errado
                    ? 'border-rose-500/60 bg-rose-500/10 text-white'
                    : aguardando
                    ? 'border-primary/40 bg-white/[0.04] hover:border-primary hover:bg-primary/10 text-white shadow-sm cursor-pointer active:scale-[0.99]'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Socket de Conexão na borda esquerda */}
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <span
                    className={`h-4 w-4 rounded-full border-2 transition-all ${
                      feito && colorTheme
                        ? colorTheme.socket
                        : aguardando
                        ? 'border-primary/60 bg-neutral-900 group-hover:border-primary'
                        : 'border-white/20 bg-neutral-800'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] sm:text-[15px] leading-relaxed font-medium ${feito && colorTheme ? colorTheme.text : 'text-neutral-200'}`}>
                    {lista[di].definicao}
                  </p>
                </div>

                {feito && (
                  <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-1" strokeWidth={2.5} />
                )}
                {errado && (
                  <X className="h-4 w-4 shrink-0 text-rose-400 mt-1" strokeWidth={2.5} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {termoSel == null && !concluido && (
        <p className="mt-4 text-center text-[12px] sm:text-[13px] text-neutral-400 italic">
          💡 Toque em um conceito à esquerda para abrir a porta de conexão.
        </p>
      )}

      {/* Painel de Celebração e Revisão do Grafo Consolidado */}
      <AnimatePresence>
        {concluido && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mt-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 sm:p-6 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 mb-3 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-sans text-base sm:text-lg font-black text-white">
                Grafo Completo! Todas as conexões consolidadas:
              </p>
            </div>

            <div className="divide-y divide-white/10 mt-4 space-y-3 pt-1">
              {lista.map((p, i) => (
                <div key={i} className="pt-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="font-bold text-[14px] sm:text-[15px] text-white">{p.termo}</span>
                    <span className="text-neutral-500 text-xs font-semibold">→</span>
                    <span className="text-emerald-300/90 text-xs font-bold uppercase tracking-wider">Ligado</span>
                  </div>
                  <p className="text-[13px] sm:text-[14px] leading-relaxed text-neutral-300 pl-4">
                    {p.definicao}
                  </p>
                  {p.explicacao && (
                    <p className="text-[12px] sm:text-[13px] leading-relaxed text-neutral-400 italic pl-4">
                      {p.explicacao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default ConexaoBlock;
