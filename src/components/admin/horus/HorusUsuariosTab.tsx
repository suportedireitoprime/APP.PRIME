import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, Crown } from 'lucide-react';

type HorusUser = {
  id: string;
  display_name?: string;
  nome_preferido?: string;
  linked_user_id?: string;
  is_premium?: boolean;
};

export function HorusUsuariosTab() {
  const [users, setUsers] = useState<HorusUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('horus_whatsapp_users')
        .select('id, display_name, nome_preferido, linked_user_id')
        .order('created_at', { ascending: false });

      if (data && !error) {
        let usersData = data as HorusUser[];
        const linkedIds = usersData.map(u => u.linked_user_id).filter(Boolean) as string[];
        
        if (linkedIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, is_premium')
            .in('id', linkedIds);
            
          if (profiles) {
            const premiumMap = new Map(profiles.map(p => [p.id, p.is_premium]));
            usersData = usersData.map(u => ({
              ...u,
              is_premium: u.linked_user_id ? premiumMap.get(u.linked_user_id) : false
            }));
          }
        }
        setUsers(usersData);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Usuários Cadastrados</h3>
        <span className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
          {users.length} total
        </span>
      </div>

      {users.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-border/50">
          Nenhum usuário cadastrado no Horus ainda.
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20"
            >
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-teal-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate flex items-center gap-2">
                  {u.display_name || u.nome_preferido || 'Sem Nome'}
                  {u.is_premium && (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  +{u.id}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {u.is_premium ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md shadow-sm">
                    Assinante
                  </span>
                ) : u.linked_user_id ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md shadow-sm">
                    Vinculado
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted border border-border/50 px-2 py-1 rounded-md shadow-sm">
                    Sem Conta
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
