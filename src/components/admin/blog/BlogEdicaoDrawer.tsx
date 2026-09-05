import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Play,
  Pause,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
  Headphones,
  Loader2,
  Volume2,
  Edit3,
} from 'lucide-react';
import { TEMA_COLORS } from '@/data/blogPosts';
import { Tema, STATUS_COLORS } from './blogEdicaoTypes';

interface BlogEdicaoDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tab: 'em_fila' | 'gerados';
  filtered: Tema[];
  loading: boolean;
  running: boolean;
  narrandoPostId: string | null;
  narracaoProgresso: Record<string, { done: number; total: number }>;
  playingUrl: string | null;
  togglePlay: (url: string) => void;
  rodarAgora: (id?: string) => void;
  regerarCapa: (postId: string) => void;
  narrarArtigo: (postId: string) => void;
  removerTema: (id: string) => void;
  setEditingTema: (t: Tema) => void;
}

export function BlogEdicaoDrawer({
  isOpen,
  onOpenChange,
  tab,
  filtered,
  loading,
  running,
  narrandoPostId,
  narracaoProgresso,
  playingUrl,
  togglePlay,
  rodarAgora,
  regerarCapa,
  narrarArtigo,
  removerTema,
  setEditingTema,
}: BlogEdicaoDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border/40 pb-4">
          <DrawerTitle>{tab === 'em_fila' ? 'Em fila hoje' : 'Gerados'}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          <div className="space-y-2">
            {loading && <div className="text-center text-muted-foreground py-8">Carregando…</div>}

            {!loading && filtered.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {tab === 'em_fila'
                  ? 'Nenhum artigo agendado para hoje. Verifique se há temas pendentes e se a configuração de horários está definida.'
                  : 'Ainda nenhum artigo gerado.'}
              </div>
            )}

            {filtered.map((t) => {
              const horario = t.horario;
              const isConcluido = t.status === 'concluido';
              return (
                <div key={t.id} className="rounded-xl bg-secondary/40 border border-border/50 p-3">
                  <div className="flex items-start gap-2">
                    {isConcluido && t.imagem_url && (
                      <img
                        src={t.imagem_url}
                        alt={t.titulo_sugerido}
                        loading="lazy"
                        className="w-16 h-16 rounded-lg object-cover border border-border/50 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {tab === 'em_fila' && horario && (
                          <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                            {horario}
                          </span>
                        )}
                        {isConcluido && t.concluido_em && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                            {new Date(t.concluido_em).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}
                        >
                          {t.status}
                        </span>
                        {(() => {
                          const c = (TEMA_COLORS as any)[t.categoria];
                          return (
                            <span
                              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider"
                              style={c ? { background: c.chip, color: c.chipText } : undefined}
                            >
                              {t.categoria}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-sm font-semibold text-foreground line-clamp-2">
                        {t.titulo_sugerido}
                      </div>
                      {t.resumo_briefing && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {t.resumo_briefing}
                        </div>
                      )}
                      {t.erro && (
                        <div className="flex items-center gap-1 text-[11px] text-red-400 mt-1">
                          <AlertCircle className="w-3 h-3" /> {t.erro}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {tab === 'em_fila' && !isConcluido && (
                        <button
                          onClick={() => setEditingTema(t)}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                          title="Editar tema"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isConcluido && (
                        <button
                          onClick={() => rodarAgora(t.id)}
                          disabled={running}
                          className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50"
                          title="Gerar agora"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isConcluido && t.post_id && (
                        <button
                          onClick={() => regerarCapa(t.post_id!)}
                          disabled={running}
                          className="p-2 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                          title="Regerar capa"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isConcluido && t.post_id && (
                        <button
                          onClick={() => narrarArtigo(t.post_id!)}
                          disabled={narrandoPostId === t.post_id}
                          className="p-2 rounded-lg bg-fuchsia-500/10 text-fuchsia-300 hover:bg-fuchsia-500/20 disabled:opacity-50"
                          title={t.audio_url ? 'Regerar narração' : 'Gerar narração'}
                        >
                          {narrandoPostId === t.post_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Headphones className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => removerTema(t.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {t.post_id && narracaoProgresso[t.post_id] && (() => {
                    const { done, total } = narracaoProgresso[t.post_id];
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div className="mt-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 px-2.5 py-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-fuchsia-200 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Gerando narração
                            {total > 0 && (
                              <span className="text-fuchsia-300/70 font-mono">
                                · {done}/{total} trechos
                              </span>
                            )}
                          </span>
                          <span className="font-mono tabular-nums text-fuchsia-100">{pct}%</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-fuchsia-950/60 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-400 to-pink-400 transition-all duration-500 ease-out"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                          <div
                            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            style={{ animation: 'shimmerBar 1.4s linear infinite' }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {t.audio_url && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-fuchsia-500/5 border border-fuchsia-500/20 px-2 py-1.5">
                      <button
                        onClick={() => togglePlay(t.audio_url!)}
                        className="p-1.5 rounded-md bg-fuchsia-500/20 text-fuchsia-200 hover:bg-fuchsia-500/30"
                      >
                        {playingUrl === t.audio_url ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </button>
                      <div className="text-[11px] text-fuchsia-200/80 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-3 h-3" /> {t.audio_voice || '—'}
                        </span>
                        {t.audio_duration_seconds != null && (
                          <span>
                            · {Math.floor((t.audio_duration_seconds || 0) / 60)}m
                            {String((t.audio_duration_seconds || 0) % 60).padStart(2, '0')}s
                          </span>
                        )}
                        {t.audio_cost_credits != null && <span>· {t.audio_cost_credits} cr.</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
