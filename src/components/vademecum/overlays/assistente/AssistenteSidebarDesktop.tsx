import React from 'react';
import { Scale, X, Plus, Globe } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { Session } from './assistenteTypes';

interface AssistenteSidebarDesktopProps {
  onClose: () => void;
  newSession: () => void;
  webSearch: boolean;
  toggleWebSearch: () => void;
  groupedSessions: [string, Session[]][];
  sessionId: string;
  openSession: (s: Session) => void;
  deleteSession: (id: string) => void;
}

export const AssistenteSidebarDesktop: React.FC<AssistenteSidebarDesktopProps> = ({
  onClose,
  newSession,
  webSearch,
  toggleWebSearch,
  groupedSessions,
  sessionId,
  openSession,
  deleteSession,
}) => {
  return (
    <aside className="w-[280px] shrink-0 h-full border-r border-border bg-card/40 flex flex-col">
      <div className="px-4 py-4 flex items-center gap-2 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Scale className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-foreground leading-tight">
            Chat Jurídico
          </p>
          <p className="text-[10px] text-muted-foreground">Assistente Jurídico • IA</p>
        </div>
        <button
          onClick={() => {
            haptic.light();
            onClose();
          }}
          aria-label="Fechar"
          className="w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => {
          haptic.selection();
          newSession();
        }}
        className="mx-3 mt-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent/10 text-sm font-body font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Nova conversa
      </button>

      <div className="px-3 mt-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">
          Ferramentas
        </p>
        <button
          onClick={() => {
            haptic.selection();
            toggleWebSearch();
          }}
          aria-pressed={webSearch}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-body transition-colors ${
            webSearch
              ? 'bg-accent/15 border-accent text-foreground'
              : 'bg-background border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className={`w-4 h-4 ${webSearch ? 'text-accent' : ''}`} />
          <span className="flex-1 text-left">Pesquisar na internet</span>
          <span
            className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${
              webSearch ? 'bg-accent justify-end' : 'bg-muted justify-start'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-background" />
          </span>
        </button>
      </div>

      <div className="px-3 mt-4 flex-1 overflow-y-auto pb-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">
          Histórico
        </p>
        {groupedSessions.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-4">Sem conversas ainda.</p>
        )}
        {groupedSessions.map(([date, list]) => (
          <div key={date} className="mb-3">
            <p className="text-[10px] text-muted-foreground/70 mb-1 px-2">
              {new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
            <div className="space-y-0.5">
              {list.map((s) => (
                <div key={s.id} className="group flex items-center rounded-lg hover:bg-accent/10">
                  <button
                    onClick={() => {
                      haptic.selection();
                      openSession(s);
                    }}
                    className={`flex-1 min-w-0 text-left px-2.5 py-2 text-xs font-body truncate ${
                      s.id === sessionId ? 'text-accent font-semibold' : 'text-foreground'
                    }`}
                  >
                    {s.title || 'Conversa'}
                  </button>
                  <button
                    onClick={() => {
                      haptic.warning();
                      deleteSession(s.id);
                    }}
                    aria-label="Excluir"
                    className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded hover:bg-muted transition-opacity"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
