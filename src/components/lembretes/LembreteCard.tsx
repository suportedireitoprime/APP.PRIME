import { Clock, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIPOS } from '@/lib/lembretes/tipos';
import type { LembreteItem } from '@/hooks/useLembretes';

type Props = {
  item: LembreteItem;
  onAbrir?: () => void;
  onAlternar?: () => void;
  onRemover?: () => void;
  mostrarTipo?: boolean;
};

export default function LembreteCard({
  item,
  onAbrir,
  onAlternar,
  onRemover,
  mostrarTipo = false,
}: Props) {
  const meta = TIPOS[item.tipo];
  const Icon = meta.icon;

  return (
    <div className="w-full min-h-[80px] flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-card border border-border/60">
      <span
        className="h-11 w-11 shrink-0 rounded-xl grid place-items-center"
        style={{ background: `${meta.cor}1f` }}
      >
        <Icon className="w-6 h-6" style={{ color: meta.cor }} strokeWidth={1.6} />
      </span>

      <button onClick={onAbrir} className="flex-1 min-w-0 text-left">
        {mostrarTipo && (
          <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: meta.cor }}>
            {meta.label}
          </p>
        )}
        <p className="font-body text-foreground text-[15px] font-semibold leading-tight line-clamp-2">
          {item.titulo}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">{item.detalhe}</p>
        {(item.quando || item.horario) && (
          <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-foreground tabular-nums">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {item.quando || item.horario}
          </span>
        )}
      </button>

      <div className="shrink-0 flex items-center gap-1.5">
        {item.editavel ? (
          <>
            <button
              onClick={onAlternar}
              role="switch"
              aria-checked={item.ativo}
              aria-label={item.ativo ? 'Desativar lembrete' : 'Ativar lembrete'}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors',
                item.ativo ? 'bg-primary' : 'bg-secondary',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform',
                  item.ativo ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
            <button
              onClick={onRemover}
              aria-label="Excluir lembrete"
              className="h-11 w-11 grid place-items-center rounded-xl text-muted-foreground active:scale-95 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={onAbrir}
            aria-label="Gerenciar lembrete"
            className="h-11 w-11 grid place-items-center rounded-xl text-muted-foreground active:scale-95 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
