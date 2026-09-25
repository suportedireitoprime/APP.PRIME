import React, { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Search, Crown, User, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Usuario {
  id: string;
  email: string | null;
  display_name: string | null;
  last_seen_at: string | null;
  is_premium: boolean;
  created_at: string | null;
}

export default function AdminUsuarios() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroAssinante, setFiltroAssinante] = useState<'todos' | 'assinantes' | 'gratuitos'>('todos');

  useEffect(() => {
    async function carregarUsuarios() {
      setLoading(true);
      try {
        const { data: profiles, error: errProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, is_premium, created_at')
          .order('created_at', { ascending: false });

        if (errProfiles) throw errProfiles;

        const { data: activityLog, error: errLog } = await supabase
          .from('user_activity_log')
          .select('user_id, email, last_seen_at');

        if (errLog) throw errLog;

        const activityMap = new Map<string, { email: string | null; last_seen_at: string | null }>();
        activityLog?.forEach(log => {
          if (!activityMap.has(log.user_id) || new Date(log.last_seen_at) > new Date(activityMap.get(log.user_id)!.last_seen_at!)) {
            activityMap.set(log.user_id, { email: log.email, last_seen_at: log.last_seen_at });
          }
        });

        const list: Usuario[] = (profiles || []).map(p => {
          const act = activityMap.get(p.id);
          return {
            id: p.id,
            display_name: p.display_name,
            is_premium: !!p.is_premium,
            created_at: p.created_at,
            email: act?.email || null,
            last_seen_at: act?.last_seen_at || null
          };
        });

        list.sort((a, b) => {
          const tA = a.last_seen_at ? new Date(a.last_seen_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
          const tB = b.last_seen_at ? new Date(b.last_seen_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
          return tB - tA;
        });

        setUsuarios(list);
      } catch (e: any) {
        toast.error('Erro ao carregar usuários: ' + (e.message || ''));
      } finally {
        setLoading(false);
      }
    }

    carregarUsuarios();
  }, []);

  const filtrados = useMemo(() => {
    let res = usuarios;
    if (filtroAssinante === 'assinantes') res = res.filter(u => u.is_premium);
    if (filtroAssinante === 'gratuitos') res = res.filter(u => !u.is_premium);

    if (busca.trim()) {
      const q = busca.toLowerCase();
      res = res.filter(u => 
        (u.display_name && u.display_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return res;
  }, [usuarios, busca, filtroAssinante]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <PageHeader title="Usuários Cadastrados" subtitle="Lista de usuários e último acesso" />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Contadores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total</p>
            <p className="text-2xl font-black mt-1">{usuarios.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Assinantes</p>
            <p className="text-2xl font-black mt-1 text-emerald-400">{usuarios.filter(u => u.is_premium).length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gratuitos</p>
            <p className="text-2xl font-black mt-1">{usuarios.filter(u => !u.is_premium).length}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-secondary/30 border border-border/50 rounded-xl overflow-x-auto shrink-0 hide-scrollbar">
            <button
              onClick={() => setFiltroAssinante('todos')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filtroAssinante === 'todos' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroAssinante('assinantes')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filtroAssinante === 'assinantes' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-400/70 hover:text-emerald-400'}`}
            >
              Assinantes
            </button>
            <button
              onClick={() => setFiltroAssinante('gratuitos')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filtroAssinante === 'gratuitos' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Gratuitos
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3">
            {filtrados.length === 0 ? (
              <div className="p-8 text-center bg-secondary/10 border border-dashed border-border/50 rounded-2xl">
                <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              filtrados.map(u => (
                <div key={u.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-secondary/10 border border-border/50 items-start sm:items-center justify-between hover:bg-secondary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${u.is_premium ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                      {u.is_premium ? <Crown className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{u.display_name || 'Sem Nome'}</p>
                      <p className="text-xs text-muted-foreground">{u.email || 'Email oculto/desconhecido'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-right sm:text-left mt-2 sm:mt-0 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Último Acesso</p>
                      <div className="flex items-center gap-1.5 justify-end text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-primary/70" />
                        {u.last_seen_at ? new Date(u.last_seen_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca acessou'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
