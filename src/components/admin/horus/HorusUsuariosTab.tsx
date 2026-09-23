import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2 } from 'lucide-react';

type HorusUser = {
  id: string;
  display_name?: string;
  nome_preferido?: string;
  linked_user_id?: string;
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
        setUsers(data as HorusUser[]);
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
                <div className="font-semibold text-foreground truncate">
                  {u.display_name || u.nome_preferido || 'Sem Nome'}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  +{u.id}
                </div>
              </div>
              <div className="shrink-0">
                {u.linked_user_id ? (
                  <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                    Ativo
                  </span>
                ) : (
                  <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                    Inativo
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
