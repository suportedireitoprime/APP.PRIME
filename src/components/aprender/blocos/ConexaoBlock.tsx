import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Link2, RotateCw, X } from 'lucide-react';

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

/**
 * Dinâmica de ligar termo → definição em DOIS TOQUES (sem arrastar):
 * 1) o aluno toca no termo, 2) toca na definição correspondente.
 * Alvos de toque ≥ 48px (Apple HIG 44pt / Material 3 48dp).
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

  const vibrar = () => {
    try { navigator.vibrate?.(60); } catch { /* noop */ }
  };

  const escolherTermo = (i: number) => {
    if (ligados.includes(i)) return;
    setErro(null);
    setTermoSel((atual) => (atual === i ? null : i));
  };

  const escolherDefinicao = (di: number) => {
    if (ligados.includes(di)) return;
    if (termoSel == null) return;
    if (di === termoSel) {
      const novos = [...ligados, di];
      setLigados(novos);
      setTermoSel(null);
      setErro(null);
      if (novos.length === totalPares) onCompleto?.();
    } else {
      vibrar();
      setErro({ termo: termoSel, def: di });
      setTermoSel(null);
      window.setTimeout(() => setErro(null), 900);
    }
  };

  const recomecar = () => {
    setLigados([]);
    setTermoSel(null);
    setErro(null);
    setOrdemDefs(embaralhar(lista.map((_, i) => i)));
    setOrdemTermos(embaralhar(lista.map((_, i) => i)));
  };

  return (
    <article>
      <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-primary">
        <Link2 className="h-4 w-4" /> Ligue os termos
      </p>
      <h2 className="mb-2 font-display text-xl font-bold leading-snug text-foreground sm:text-2xl">
        Cada termo tem um significado. Encontre o par.
      </h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Toque primeiro em um <strong className="text-foreground">termo</strong> e depois na{' '}
        <strong className="text-foreground">definição</strong> correspondente. Se errar, é só tentar de novo.
      </p>

      {/* Progresso */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(ligados.length / totalPares) * 100}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-muted-foreground">
          {ligados.length} de {totalPares}
        </span>
        {ligados.length > 0 && (
          <button
            onClick={recomecar}
            className="flex h-11 items-center gap-1 rounded-full border border-border px-3 text-[13px] font-medium text-muted-foreground active:scale-95"
          >
            <RotateCw className="h-3.5 w-3.5" /> Recomeçar
          </button>
        )}
      </div>

      {/* Termos */}
      <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">Termos</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {ordemTermos.map((i) => {
          const feito = ligados.includes(i);
          const sel = termoSel === i;
          const errado = erro?.termo === i;
          return (
            <motion.button
              key={i}
              onClick={() => escolherTermo(i)}
              disabled={feito}
              animate={errado ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              className={`min-h-12 rounded-xl border px-4 py-3 text-left text-[15px] font-semibold leading-snug transition-colors ${
                feito
                  ? 'border-green-500 bg-green-500/20 text-green-100 line-through'
                  : errado
                  ? 'border-red-500/60 bg-red-500/10 text-foreground'
                  : sel
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : 'border-border bg-card text-foreground active:scale-95'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {feito && <Check className="h-4 w-4 text-green-400" />}
                {lista[i].termo}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Definições */}
      <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">Significados</p>
      <div className="flex flex-col gap-2">
        {ordemDefs.map((di) => {
          const feito = ligados.includes(di);
          const errado = erro?.def === di;
          const aguardando = termoSel != null && !feito;
          return (
            <motion.button
              key={di}
              onClick={() => escolherDefinicao(di)}
              disabled={feito || termoSel == null}
              animate={errado ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              className={`min-h-12 w-full rounded-xl border px-4 py-3 text-left text-[15px] leading-relaxed transition-colors ${
                feito
                  ? 'border-green-500 bg-green-500/15 text-green-50'
                  : errado
                  ? 'border-red-500/60 bg-red-500/10 text-foreground'
                  : aguardando
                  ? 'border-primary/60 bg-card text-foreground active:bg-primary active:text-primary-foreground'
                  : 'border-border bg-card/40 text-muted-foreground'
              }`}
            >
              <span className="flex items-start gap-2">
                {feito ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                ) : errado ? (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                ) : null}
                <span>{lista[di].definicao}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {termoSel == null && !concluido && (
        <p className="mt-3 text-[13px] text-muted-foreground">Comece escolhendo um termo acima.</p>
      )}
      {erro && <p className="mt-3 text-[14px] font-medium text-red-600">Não é essa. Tente outra vez.</p>}

      {/* Revisão final */}
      <AnimatePresence>
        {concluido && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-green-500/50 bg-green-500/10 p-4"
          >
            <p className="mb-3 flex items-center gap-2 text-[15px] font-bold text-green-100">
              <Check className="h-5 w-5 text-green-400" /> Tudo ligado! Revise os pares:
            </p>
            <ul className="space-y-3">
              {lista.map((p, i) => (
                <li key={i} className="border-l-2 border-green-500/50 pl-3">
                  <p className="text-[15px] font-semibold text-foreground">{p.termo}</p>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{p.definicao}</p>
                  {p.explicacao && (
                    <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground/90 italic">{p.explicacao}</p>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export default ConexaoBlock;
