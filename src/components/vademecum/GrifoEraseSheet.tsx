import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { HIGHLIGHT_COLORS, type Highlight } from '@/hooks/useHighlights';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  open: boolean;
  onClose: () => void;
  highlights: Highlight[];
  onRemoveByColor: (color: string) => void;
  onClearAll: () => void;
}

const NAME_BY_VALUE = Object.fromEntries(HIGHLIGHT_COLORS.map(c => [c.value, c.name]));
Object.assign(NAME_BY_VALUE, {
  'rgba(250, 204, 21, 0.42)': 'Amarelo',
  'rgba(250, 204, 21, 0.55)': 'Chave',
  'rgba(74, 222, 128, 0.42)': 'Verde',
  'rgba(34, 197, 94, 0.55)': 'Exceção',
  'rgba(96, 165, 250, 0.42)': 'Azul',
  'rgba(59, 130, 246, 0.55)': 'Efeito',
  'rgba(244, 114, 182, 0.42)': 'Rosa',
  'rgba(236, 72, 153, 0.55)': 'Termo',
  'rgba(251, 146, 60, 0.42)': 'Laranja',
  'rgba(251, 146, 60, 0.55)': 'Pegadinha',
});

const GrifoEraseSheet = ({ open, onClose, highlights, onRemoveByColor, onClearAll }: Props) => {
  useEscapeKey(open, onClose);

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of highlights) {
      if (h.color) {
        map.set(h.color, (map.get(h.color) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([color, count]) => ({
      color,
      count,
      name: NAME_BY_VALUE[color] || 'Personalizada',
    }));
  }, [highlights]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-0"
        />

        {/* Floating Centered Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative z-10 w-full max-w-sm bg-card border border-border/80 rounded-3xl shadow-2xl p-5 flex flex-col max-h-[85vh] overflow-hidden"
          style={{
            marginBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground leading-tight">Apagar grifos</h3>
                <p className="text-[11px] text-muted-foreground">Remover marcas deste artigo</p>
              </div>
            </div>
            <button
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              aria-label="Fechar"
              className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2">
            {grouped.length === 0 ? (
              <div className="py-6 px-4 text-center space-y-3">
                <p className="text-sm text-foreground/60">Não há grifos registrados neste artigo.</p>
                <button
                  onClick={() => {
                    haptic.notification();
                    onClearAll();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                >
                  Limpar quaisquer marcas residuais
                </button>
              </div>
            ) : (
              grouped.map((g) => (
                <div
                  key={g.color}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/50 border border-border/40 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="w-7 h-7 rounded-full border border-white/20 shrink-0 shadow-sm"
                      style={{ backgroundColor: g.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground truncate">{g.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {g.count} {g.count === 1 ? 'grifo' : 'grifos'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.notification();
                      onRemoveByColor(g.color);
                      if (grouped.length <= 1) {
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 shrink-0"
                    aria-label={`Apagar grifos ${g.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Apagar</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer with Clear All */}
          {grouped.length > 0 && (
            <div className="pt-2 border-t border-border/60">
              <button
                onClick={() => {
                  haptic.notification();
                  onClearAll();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Apagar todos os grifos</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default GrifoEraseSheet;
