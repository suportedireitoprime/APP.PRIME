import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, CheckCircle2, RotateCcw, XCircle, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';

type Item = { id: string; texto: string };

export function OrdenacaoBlock({ payload }: { payload: any }) {
  const titulo: string = payload?.titulo || 'Coloque na ordem correta';
  const instrucao: string | undefined = payload?.instrucao;
  const itensOriginais: Item[] = Array.isArray(payload?.itens) ? payload.itens : [];
  const ordemCorreta: string[] = Array.isArray(payload?.ordem_correta) ? payload.ordem_correta : [];
  const explicacao: string | undefined = payload?.explicacao;

  const embaralhados = useMemo(() => {
    const arr = [...itensOriginais];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itensOriginais.length]);

  const [ordem, setOrdem] = useState<Item[]>(embaralhados);
  const [verificado, setVerificado] = useState(false);

  const mover = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= ordem.length) return;
    haptic.selection();
    const arr = [...ordem];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setOrdem(arr);
    setVerificado(false);
  };

  const acertos = ordem.map((it, i) => it.id === ordemCorreta[i]);
  const tudoCerto = acertos.every(Boolean);

  const handleVerificar = () => {
    setVerificado(true);
    if (tudoCerto) {
      haptic.notification('success');
    } else {
      haptic.notification('warning');
    }
  };

  const handleReiniciar = () => {
    haptic.selection();
    setOrdem(embaralhados);
    setVerificado(false);
  };

  return (
    <motion.article
      className="max-w-[70ch] mx-auto py-3 px-1 sm:px-2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-primary mb-2 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
        <ArrowUpDown className="h-3.5 w-3.5" /> Ordenação Cronológica / Lógica
      </span>
      <h3 className="mb-2 font-sans text-lg sm:text-xl font-bold text-white">{titulo}</h3>
      {instrucao && <p className="mb-4 text-sm sm:text-[15px] leading-relaxed text-neutral-300">{instrucao}</p>}

      <ol className="space-y-2.5">
        {ordem.map((it, i) => {
          const ok = verificado && acertos[i];
          const err = verificado && !acertos[i];
          return (
            <motion.li
              key={it.id}
              layout
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`flex items-center gap-3 rounded-2xl border p-3 sm:p-3.5 backdrop-blur-sm shadow-sm transition-all ${
                ok
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-white shadow-emerald-500/10'
                  : err
                  ? 'border-rose-500/60 bg-rose-500/10 text-white shadow-rose-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 text-xs font-black text-primary">
                {i + 1}
              </span>
              <span className="flex-1 text-[14px] sm:text-[15px] font-medium leading-snug text-neutral-200">
                {it.texto}
              </span>
              {verificado && (
                ok ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                )
              )}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                  aria-label="Mover para cima"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={i === ordem.length - 1}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                  aria-label="Mover para baixo"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </motion.li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleVerificar}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-light active:scale-95 transition-all shadow-md shadow-primary/20 min-h-[44px] cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" /> Verificar Ordem
        </button>
        <button
          type="button"
          onClick={handleReiniciar}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/10 hover:text-white active:scale-95 transition-all min-h-[44px] cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" /> Reiniciar
        </button>
      </div>

      <AnimatePresence>
        {verificado && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`mt-4 rounded-2xl border p-4 text-[14px] leading-relaxed backdrop-blur-sm ${
              tudoCerto
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/50 bg-amber-500/10 text-amber-300'
            }`}
          >
            <p className="font-bold flex items-center gap-2">
              {tudoCerto ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Perfeito! A sequência está correta.
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-amber-400" /> Ainda não é a ordem exata. Use as setas para ajustar e tente novamente.
                </>
              )}
            </p>
            {tudoCerto && explicacao && (
              <p className="mt-2 text-white/80 font-normal">{explicacao}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
