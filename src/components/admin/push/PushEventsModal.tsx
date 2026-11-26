import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PushCampaign } from './pushConfig';

interface PushEventsModalProps {
  date: string;
  type: 'delivered' | 'opened' | 'failed' | null;
  campaigns: PushCampaign[];
  onClose: () => void;
}

interface PushEventUserRow {
  id: string;
  name: string;
  email: string;
  campaign_title: string;
  created_at: string;
}

export default function PushEventsModal({ date, type, campaigns, onClose }: PushEventsModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<PushEventUserRow[]>([]);

  useEffect(() => {
    if (!type || campaigns.length === 0) return;
    let active = true;

    async function loadEvents() {
      setLoading(true);
      try {
        const campaignIds = campaigns.map((c) => c.id);
        const { data, error } = await supabase
          .from('push_events')
          .select('created_at, campaign_id, user_id')
          .in('campaign_id', campaignIds)
          .eq('event_type', type)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        if (!active) return;

        const mapped = (data || []).map((e) => ({
          id: e.user_id || 'anon',
          name: e.user_id ? 'Usuário Registrado' : 'Dispositivo Anônimo',
          email: e.user_id ? `ID: ${e.user_id.slice(0, 8)}...` : 'Sem e-mail',
          campaign_title: campaigns.find((c) => c.id === e.campaign_id)?.title || 'Campanha Automática',
          created_at: e.created_at,
        }));
        setUsers(mapped);
      } catch (err) {
        console.error('Erro ao carregar eventos:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEvents();
    return () => {
      active = false;
    };
  }, [type, campaigns]);

  return (
    <Sheet open={!!type} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-zinc-800 bg-[#0D0D0D] text-white p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="text-lg font-bold flex items-center gap-2 text-white">
            {type === 'opened' ? (
              <Eye className="w-5 h-5 text-purple-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            )}
            Usuários que {type === 'opened' ? 'Abriram' : 'Receberam'}
          </SheetTitle>
          <p className="text-xs text-zinc-400">
            Em {new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`))}
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-red-500 opacity-70" />
              <span className="text-xs font-medium text-zinc-400">Buscando eventos...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
              Nenhum evento registrado nesta categoria hoje.
            </div>
          ) : (
            <div className="space-y-2.5">
              {users.map((u, i) => (
                <div key={`${u.id}-${i}`} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
                  <div className="font-bold text-xs text-white">{u.name}</div>
                  <div className="text-[11px] text-zinc-400">{u.email}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800 text-[10px] text-zinc-500">
                    <span className="truncate max-w-[180px]">{u.campaign_title.replace('[TEMPLATE] ', '')}</span>
                    <span>{new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(u.created_at))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
