import { useEffect, useState } from "react";
import { DebugEvent, getDebugEvents, subscribeDebugEvents, getPlatform } from "@/lib/analyticsEvents";

/**
 * Painel de verificação de analytics. Só aparece com `?ga_debug=1` na URL.
 * Lista os últimos eventos disparados (nome, parâmetros e plataforma).
 */
export default function AnalyticsDebugPanel() {
  const enabled =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("ga_debug");
  const [events, setEvents] = useState<DebugEvent[]>(() => (enabled ? [...getDebugEvents()] : []));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    return subscribeDebugEvents(setEvents);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-20 right-3 z-[9999] max-w-[92vw]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg"
      >
        GA debug · {events.length}
      </button>

      {open && (
        <div className="mt-2 max-h-[50vh] w-[92vw] max-w-sm overflow-auto rounded-xl border border-border bg-card p-3 shadow-xl">
          <p className="mb-2 text-[11px] text-muted-foreground">
            Plataforma: <strong>{getPlatform()}</strong>
          </p>
          {events.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum evento ainda. Navegue pelo app.</p>
          )}
          <ul className="space-y-2">
            {events.map((ev, i) => (
              <li key={`${ev.at}-${i}`} className="rounded-lg bg-muted/50 p-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{ev.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(ev.at).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] text-muted-foreground">
                  {JSON.stringify(ev.params)}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
