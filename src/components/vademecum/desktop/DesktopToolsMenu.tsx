import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, X } from 'lucide-react';
import { DESKTOP_TOOL_GROUPS } from '@/config/desktopTools';

/**
 * Menu rápido com TODAS as funções do app, acessível de qualquer página no
 * desktop. Antes, várias funções só existiam no FAB do mobile.
 */
const DesktopToolsMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 hover:bg-white/20 hover:border-white/40 flex items-center justify-center transition-colors group"
        aria-label="Todas as funções"
        aria-expanded={open}
        title="Todas as funções"
      >
        {open ? (
          <X className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
        ) : (
          <LayoutGrid className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] group-hover:scale-110 transition-transform" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(80vw,900px)] max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-5 animate-fade-in">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {DESKTOP_TOOL_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="mb-2 text-[10px] font-body font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => { setOpen(false); navigate(tool.route); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                          style={{ backgroundColor: `${tool.color}33` }}
                        >
                          <Icon className="h-[13px] w-[13px]" style={{ color: tool.color }} />
                        </span>
                        <span className="truncate">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopToolsMenu;
