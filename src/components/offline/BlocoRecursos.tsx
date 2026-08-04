import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, type LucideIcon } from 'lucide-react';

export type BlocoTom = 'verde' | 'amarelo' | 'vermelho';

/** A paleta global do app é monocromática, então o semáforo usa cores explícitas. */
const TONS: Record<BlocoTom, string> = {
  verde: '150 72% 45%',
  amarelo: '42 96% 52%',
  vermelho: '348 80% 52%',
};

interface Props {
  tom: BlocoTom;
  icon: LucideIcon;
  itemIcon: LucideIcon;
  titulo: string;
  itens: { label: string; desc: string }[];
  rodape?: string;
  defaultOpen?: boolean;
}

export default function BlocoRecursos({ tom, icon: Icon, itemIcon: ItemIcon, titulo, itens, rodape, defaultOpen }: Props) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const h = TONS[tom];
  const cor = `hsl(${h})`;

  return (
    <section
      className="overflow-hidden rounded-2xl border transition-colors"
      style={{ borderColor: `hsl(${h} / 0.4)`, background: `hsl(${h} / 0.07)` }}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <Icon className="h-6 w-6 shrink-0" style={{ color: cor }} />
        <span className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-black leading-tight" style={{ color: cor }}>{titulo}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {itens.length} {itens.length === 1 ? 'função' : 'funções'} · toque para ver
          </p>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: cor }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-4">
              <ul className="space-y-2">
                {itens.map(r => (
                  <li key={r.label} className="flex items-start gap-2.5">
                    <ItemIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: `hsl(${h} / 0.85)` }} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{r.label}</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">{r.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {rodape && (
                <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">{rodape}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
