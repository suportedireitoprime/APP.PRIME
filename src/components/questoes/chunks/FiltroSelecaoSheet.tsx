import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, Search, X, Check } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

const fmt = (n: number) => n.toLocaleString('pt-BR');

interface SelecaoSheetProps {
  titulo: string;
  opcoes: string[];
  contagens?: Record<string, number>;
  descricoes?: Record<string, string>;
  selecionado: string[];
  single?: boolean;
  buscavel?: boolean;
  onFechar: () => void;
  onConfirmar: (v: string[]) => void;
}

export function SelecaoSheet({
  titulo,
  opcoes,
  contagens,
  descricoes,
  selecionado,
  single,
  buscavel,
  onFechar,
  onConfirmar,
}: SelecaoSheetProps) {
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
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
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
          onClick={() => {
            haptic.selection?.();
            setLocal([]);
          }}
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
          <ul className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
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
                    <button onClick={toggleAll} className="flex h-full w-full items-center gap-3 text-left group">
                      <span className="flex-1 text-[15px] font-bold text-zinc-100 group-hover:text-white transition-colors">
                        Todos
                      </span>
                      <span
                        className={cn(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-all',
                          isAllSelected
                            ? 'border-[#E11D48] bg-hero-panel text-white shadow-md shadow-[#E11D48]/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
                            : 'border-zinc-700 bg-zinc-900/50 group-hover:border-zinc-500',
                        )}
                      >
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
                  <button onClick={() => toggle(o)} className="flex h-full w-full items-center gap-3 text-left group">
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-[15px] font-semibold leading-tight transition-colors',
                          ativo ? 'text-white' : 'text-zinc-200 group-hover:text-white',
                        )}
                      >
                        {o.split(' > ').pop()?.trim() || o}
                      </span>
                      {descricoes?.[o] && (
                        <span className="mt-1 block text-[12px] leading-snug text-zinc-400">{descricoes[o]}</span>
                      )}
                    </span>
                    {contagens?.[o] !== undefined && (
                      <span className="grid h-6 min-w-[44px] place-items-center rounded-full bg-transparent px-2 text-[13px] font-extrabold tabular-nums text-rose-400">
                        {fmt(contagens[o])}
                      </span>
                    )}
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-all',
                        ativo
                          ? 'border-[#E11D48] bg-hero-panel text-white shadow-md shadow-[#E11D48]/25 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]'
                          : 'border-zinc-700 bg-zinc-900/50 group-hover:border-zinc-500',
                      )}
                    >
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
          className="h-14 w-full rounded-2xl bg-hero-panel hover:brightness-110 text-white font-black text-[16px] shadow-lg shadow-black/40 active:scale-[0.98] transition-all"
        >
          Confirmar seleção
        </button>
      </div>
    </motion.div>
  );
}
