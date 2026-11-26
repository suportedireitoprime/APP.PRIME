import { AlertCircle, Calendar, Clock, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PushCampaign } from './pushConfig';

interface PushDashboardTabProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  stats: {
    agendados: number;
    enviados: number;
    entregues: number;
    abertos: number;
    falhas: number;
  };
  agendadosDoDia: PushCampaign[];
  historicoDoDia: PushCampaign[];
  loading: boolean;
  onRefresh: () => void;
  onRegenerate: () => void;
  onCancel: (id: string) => void;
  onOpenEvents: (type: 'delivered' | 'opened' | 'failed') => void;
}

export default function PushDashboardTab({
  selectedDate,
  onSelectDate,
  stats,
  agendadosDoDia,
  historicoDoDia,
  loading,
  onRefresh,
  onRegenerate,
  onCancel,
  onOpenEvents,
}: PushDashboardTabProps) {
  const allToday = [...agendadosDoDia, ...historicoDoDia];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* SELETOR DE DATA */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Data dos Disparos:</span>
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onSelectDate(e.target.value)}
          className="w-auto bg-zinc-950 border-zinc-800 text-sm h-9 text-white"
        />
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center">
          <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Agendados</div>
          <div className="text-2xl font-bold text-amber-400 mt-0.5 font-mono">{stats.agendados}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center">
          <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Enviados</div>
          <div className="text-2xl font-bold text-emerald-400 mt-0.5 font-mono">{stats.enviados}</div>
        </div>
        <div
          className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center cursor-pointer hover:border-purple-500/40 transition-colors"
          onClick={() => onOpenEvents('opened')}
        >
          <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 flex items-center justify-center gap-1">
            Abertos <Eye className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-0.5 font-mono">{stats.abertos}</div>
        </div>
        <div
          className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center cursor-pointer hover:border-red-500/40 transition-colors"
          onClick={() => onOpenEvents('failed')}
        >
          <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 flex items-center justify-center gap-1">
            Falhas <AlertCircle className="w-3 h-3 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-0.5 font-mono">{stats.falhas}</div>
        </div>
      </div>

      {/* LISTA DA TIMELINE */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold tracking-widest uppercase text-zinc-400">
            Eventos do Dia ({selectedDate})
          </h4>
          <Button size="icon" variant="ghost" onClick={onRefresh} disabled={loading} className="w-7 h-7 text-zinc-400">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {allToday.length === 0 && !loading ? (
          <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">Nenhuma notificação programada para este dia.</p>
            <Button
              onClick={onRegenerate}
              size="sm"
              className="mt-3 text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Ativar Grade das 2 em 2 Horas
            </Button>
          </div>
        ) : (
          allToday.map((c) => {
            const isScheduled = c.status === 'scheduled';
            const isSent = c.status === 'sent' || c.status === 'completed';
            const isFailed = c.status === 'failed';
            const runDate = c.next_run_at || c.created_at;

            return (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-red-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Intl.DateTimeFormat('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(runDate))}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                        isSent
                          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                          : isFailed
                            ? 'text-red-400 border-red-500/30 bg-red-500/10'
                            : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      }`}
                    >
                      {isSent ? 'Enviado' : isFailed ? 'Falhou' : 'Agendado'}
                    </span>
                    {isScheduled && (
                      <button
                        onClick={() => onCancel(c.id)}
                        className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                <h5 className="font-bold text-sm text-white leading-snug">{c.title}</h5>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{c.body}</p>

                {(c.sent_count > 0 || c.delivered_count > 0 || c.opened_count > 0) && (
                  <div className="mt-1 pt-2.5 border-t border-zinc-800/60 flex items-center gap-4 text-xs font-mono text-zinc-400">
                    {c.sent_count > 0 && <span className="text-emerald-400">{c.sent_count} envios</span>}
                    {c.delivered_count > 0 && <span className="text-blue-400">{c.delivered_count} entregues</span>}
                    {c.opened_count > 0 && <span className="text-purple-400">{c.opened_count} abertos</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
