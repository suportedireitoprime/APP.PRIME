import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Layers,
  HelpCircle,
  GitBranch,
  BookOpen,
} from 'lucide-react';
import { Session, Artifact } from './assistenteTypes';

interface AssistenteHistoryDrawerProps {
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  newSession: () => void;
  groupedSessions: [string, Session[]][];
  openSession: (s: Session) => void;
  deleteSession: (id: string) => void;
  sessionId: string;
  setActiveArtifact: (a: Artifact) => void;
}

export const AssistenteHistoryDrawer: React.FC<AssistenteHistoryDrawerProps> = ({
  historyOpen,
  setHistoryOpen,
  newSession,
  groupedSessions,
  openSession,
  deleteSession,
  sessionId,
  setActiveArtifact,
}) => {
  return (
    <AnimatePresence>
      {historyOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/50"
          onClick={() => setHistoryOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-card border-l border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-display text-base font-bold text-foreground">Histórico</h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={newSession}
              className="mx-4 mt-3 mb-2 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-body font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Nova conversa
            </button>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {groupedSessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Sem histórico ainda.
                </p>
              )}
              {groupedSessions.map(([date, list]) => (
                <div key={date} className="mt-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 font-body">
                    {new Date(date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                  <div className="space-y-1.5">
                    {list.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl bg-secondary/60 border border-border p-2 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openSession(s)}
                            className={`flex-1 text-left px-2 py-1.5 rounded-lg text-sm font-body truncate ${
                              s.id === sessionId ? 'text-accent font-semibold' : 'text-foreground'
                            }`}
                          >
                            {s.title || 'Conversa'}
                          </button>
                          <button
                            onClick={() => deleteSession(s.id)}
                            className="p-2 rounded-lg hover:bg-muted"
                          >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                        {(s.artifacts?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1 pl-2">
                            {s.artifacts!.slice(0, 6).map((a) => {
                              const Icon =
                                a.kind === 'flashcards'
                                  ? Layers
                                  : a.kind === 'questoes'
                                  ? HelpCircle
                                  : a.kind === 'mapa'
                                  ? GitBranch
                                  : BookOpen;
                              const lbl =
                                a.kind === 'flashcards'
                                  ? 'Flashcards'
                                  : a.kind === 'questoes'
                                  ? 'Questões'
                                  : a.kind === 'mapa'
                                  ? 'Mapa'
                                  : 'Termos';
                              const colorClass =
                                a.kind === 'flashcards'
                                  ? 'text-emerald-400'
                                  : a.kind === 'questoes'
                                  ? 'text-amber-400'
                                  : a.kind === 'mapa'
                                  ? 'text-purple-400'
                                  : 'text-sky-400';
                              const borderClass =
                                a.kind === 'flashcards'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50'
                                  : a.kind === 'questoes'
                                  ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50'
                                  : a.kind === 'mapa'
                                  ? 'border-purple-500/30 bg-purple-500/10 hover:border-purple-500/50'
                                  : 'border-sky-500/30 bg-sky-500/10 hover:border-sky-500/50';
                              return (
                                <button
                                  key={a.id}
                                  onClick={() => {
                                    openSession(s);
                                    setTimeout(() => setActiveArtifact(a), 60);
                                  }}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full ${borderClass} border text-[10px] font-body text-foreground transition-colors`}
                                >
                                  <Icon className={`w-3 h-3 ${colorClass}`} /> {lbl}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
