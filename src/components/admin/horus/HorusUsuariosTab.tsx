import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, Crown, ArrowUpDown, Filter, ShieldCheck, Phone, Clock, CreditCard, PlayCircle, Apple } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type HorusUser = {
  id: string;
  display_name?: string;
  nome_preferido?: string;
  linked_user_id?: string;
  is_premium?: boolean;
  created_at?: string;
  last_seen_at?: string;
  is_pending?: boolean;
  source?: 'asaas' | 'play' | 'apple';
  plano?: string;
  has_any_sub_history?: boolean;
  phone?: string;
  phone_e164?: string;
};

export function HorusUsuariosTab() {
  const [users, setUsers] = useState<HorusUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<'premium_all' | 'premium_active' | 'free_active' | 'free_expired'>('premium_all');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');

  const fetchUsers = async () => {
    setLoading(true);
    
    // 1. Busca todos que já conversaram com o Horus
    const { data: horusData } = await supabase
      .from('horus_whatsapp_users')
      .select('id, display_name, nome_preferido, linked_user_id, created_at, last_seen_at, phone_e164')
      .order('created_at', { ascending: false });

    // 2. Busca TODOS os perfis no sistema (para pegar nomes reais e status premium)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, is_premium');
      
    if (error) console.error("Erro ao buscar profiles:", error);
      
    // 3. Busca histórico de assinaturas para identificar origem e expirados
    const [asaasRes, playRes, appleRes] = await Promise.all([
      supabase.from('asaas_subscriptions').select('user_id, status, plano'),
      supabase.from('play_subscriptions').select('user_id, status'),
      supabase.from('apple_subscriptions').select('user_id, status')
    ]);

    const asaasMap = new Map<string, {status: string, plano?: string}>();
    (asaasRes.data || []).forEach(s => {
      const current = asaasMap.get(s.user_id);
      // Se já tiver e for ACTIVE, não sobrescreve a menos que o novo também seja ACTIVE (para manter o último ativo)
      // Basicamente prioriza ACTIVE > PENDING > CANCELED
      if (!current || ['ACTIVE', 'active'].includes(s.status)) {
        asaasMap.set(s.user_id, { status: s.status, plano: s.plano });
      }
    });

    const playMap = new Map(playRes.data?.map(s => [s.user_id, s.status]) || []);
    const appleMap = new Map(appleRes.data?.map(s => [s.user_id, s.status]) || []);

    let usersData = (horusData || []) as HorusUser[];
    
    // Mapear os IDs vinculados atualmente
    const linkedIds = new Set(usersData.map(u => u.linked_user_id).filter(Boolean));
    
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    
    // Atualizar dados de quem já conversou com o Horus
    usersData = usersData.map(u => {
      const profile = u.linked_user_id ? profileMap.get(u.linked_user_id) : null;
      let isPrem = profile ? (profile.is_premium || false) : false;
      const dispName = u.display_name || u.nome_preferido || (profile?.display_name) || undefined;
      const phoneNum = u.phone_e164;
      
      let source: HorusUser['source'];
      let plano: string | undefined;
      let hasHist = false;
      
      if (u.linked_user_id) {
        const asaasData = asaasMap.get(u.linked_user_id);
        if (asaasData) { 
           source = 'asaas'; 
           plano = asaasData.plano;
           hasHist = true; 
           if (['ACTIVE', 'active'].includes(String(asaasData.status))) isPrem = true;
        }
        
        const playStatus = playMap.get(u.linked_user_id);
        if (playStatus) { 
           source = 'play'; 
           hasHist = true; 
           if (['ACTIVE', 'active'].includes(String(playStatus))) isPrem = true;
        }
        
        const appleStatus = appleMap.get(u.linked_user_id);
        if (appleStatus) { 
           source = 'apple'; 
           hasHist = true; 
           if (['ACTIVE', 'active'].includes(String(appleStatus))) isPrem = true;
        }
      }
      
      return {
        ...u,
        display_name: dispName,
        phone: phoneNum,
        is_premium: isPrem,
        is_pending: false,
        source,
        plano,
        has_any_sub_history: hasHist
      };
    });

    // Adicionar os perfis Premium que AINDA NÃO conversaram com o Horus
    // Agora consideramos premium: perfil com is_premium = true, OU com assinatura ativa nas lojas
    const activeSubUserIds = new Set([
      ...Array.from(asaasMap.entries()).filter(([_, data]) => ['ACTIVE', 'active'].includes(String(data.status))).map(([id]) => id),
      ...Array.from(playMap.entries()).filter(([_, status]) => ['ACTIVE', 'active'].includes(String(status))).map(([id]) => id),
      ...Array.from(appleMap.entries()).filter(([_, status]) => ['ACTIVE', 'active'].includes(String(status))).map(([id]) => id),
    ]);

    if (profiles) {
      const pendingPremium = profiles
        .filter(p => (p.is_premium || activeSubUserIds.has(p.id)) && !linkedIds.has(p.id))
        .map(p => {
          let source: HorusUser['source'];
          let plano: string | undefined;
          const asaasData = asaasMap.get(p.id);
          
          if (asaasData) { source = 'asaas'; plano = asaasData.plano; }
          else if (playMap.has(p.id)) source = 'play';
          else if (appleMap.has(p.id)) source = 'apple';
          
          return {
            id: p.id,
            phone: 'Sem número',
            display_name: p.display_name || 'Usuário Premium',
            linked_user_id: p.id,
            is_premium: true,
            is_pending: true,
            source,
            plano,
            has_any_sub_history: !!source
          };
        });
        
      usersData = [...usersData, ...pendingPremium];
    }
    
    setUsers(usersData);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSyncPremium = async () => {
    setSyncing(true);
    try {
      await supabase.functions.invoke('horus/verify', {
         body: { action: 'sync_premium_users' }
      });
      await fetchUsers();
      toast.success("Verificação de assinantes concluída", {
        description: "Os acessos e números foram verificados com sucesso."
      });
    } catch (e) {
      toast.error("Erro ao sincronizar", {
        description: "Houve um problema ao verificar os assinantes."
      });
    } finally {
      setSyncing(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    if (filter === 'premium_all') {
      result = result.filter(u => u.is_premium);
    } else if (filter === 'premium_active') {
      result = result.filter(u => u.is_premium && !u.is_pending);
    } else if (filter === 'free_active') {
      result = result.filter(u => !u.is_premium && !u.is_pending && getTrialStatus(u.created_at).isActive);
    } else if (filter === 'free_expired') {
      result = result.filter(u => !u.is_premium && !u.is_pending && !getTrialStatus(u.created_at).isActive);
    }

    if (sortBy === 'alpha') {
      result.sort((a, b) => {
        const nameA = (a.display_name || a.nome_preferido || 'Sem Nome').toLowerCase();
        const nameB = (b.display_name || b.nome_preferido || 'Sem Nome').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [users, filter, sortBy]);

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return 'Nunca interagiu';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Últ. interação: há pouco';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Últ. interação: há ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Últ. interação: há ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Últ. interação: ontem';
    if (diffInDays < 30) return `Últ. interação: há ${diffInDays} dias`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return 'Últ. interação: há 1 mês';
    return `Últ. interação: há ${diffInMonths} meses`;
  };

  const getTrialStatus = (createdAt?: string) => {
    if (!createdAt) return { isActive: false, remainingText: null };
    const end = new Date(createdAt);
    end.setDate(end.getDate() + 3);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return { isActive: false, remainingText: null };
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return { isActive: true, remainingText: `${diffDays}d e ${diffHours}h restantes` };
    }
    return { isActive: true, remainingText: `${diffHours}h restantes` };
  };

  const getPlanoLabel = (plano?: string) => {
    if (!plano) return 'Assinante';
    switch(plano.toLowerCase()) {
      case 'vitalicio': return 'Assinante (Vitalício)';
      case 'mensal': return 'Assinante (Mensal)';
      case 'anual': return 'Assinante (Anual)';
      case 'anual_promocional': return 'Assinante (Anual Promo)';
      default: return `Assinante (${plano})`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Usuários Cadastrados
            <span className="text-xs font-normal text-muted-foreground bg-secondary/80 px-2.5 py-0.5 rounded-full">
              {filteredAndSortedUsers.length} total
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os acessos do Horus via WhatsApp
          </p>
        </div>
        
        <Button 
          onClick={handleSyncPremium} 
          disabled={syncing}
          variant="outline" 
          className="w-full sm:w-auto bg-secondary/40 border-border/50 hover:bg-secondary/80 text-sm h-10"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
          )}
          Liberar & Verificar Acessos
        </Button>
      </div>

      <div className="flex flex-col gap-4 bg-secondary/10 py-4 rounded-2xl border border-border/40">
        <div className="w-full overflow-x-auto scrollbar-hide px-4">
          <div className="flex items-center gap-2 w-max pb-2 after:content-[''] after:w-2 after:block">
            {[
              { id: 'premium_all', label: 'Assinantes' },
              { id: 'premium_active', label: 'Assinantes que interagiram' },
              { id: 'free_active', label: 'Gratuitos ativos' },
              { id: 'free_expired', label: 'Gratuitos expirados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-foreground text-background shadow-md'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3 px-4">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[180px] bg-background border-border/50 h-9">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais Recentes</SelectItem>
              <SelectItem value="alpha">Ordem Alfabética (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedUsers.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-secondary/10 rounded-3xl border border-border/40 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 opacity-50" />
          </div>
          <p className="font-medium text-foreground">Nenhum usuário encontrado</p>
          <p className="text-sm mt-1 max-w-[250px] mx-auto">
            Não há usuários que correspondam aos filtros atuais.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredAndSortedUsers.map((u) => (
            <div
              key={u.id}
              className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border ${u.is_pending ? 'border-dashed border-border/60 bg-secondary/5 opacity-80' : 'border-border/50 bg-secondary/20'} hover:bg-secondary/40 transition-colors`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner ${u.is_pending ? 'bg-secondary/40 border border-border/50 text-muted-foreground' : u.is_premium ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' : 'bg-teal-500/10 border border-teal-500/20 text-teal-500'}`}>
                  {u.is_pending ? (
                    <Clock className="w-6 h-6" />
                  ) : u.is_premium ? (
                    <Crown className="w-6 h-6" />
                  ) : (
                    <Users className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate flex items-center gap-2 text-[15px]">
                    {u.display_name || u.nome_preferido || 'Sem Nome'}
                    {u.is_premium && !u.is_pending && (
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    {u.source === 'asaas' && (
                      <span className="text-[10px] font-bold tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded ml-1 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> ASAAS
                      </span>
                    )}
                    {u.source === 'play' && (
                      <span className="text-[10px] font-bold tracking-wider bg-green-500/10 text-green-500 border border-green-500/20 px-1.5 py-0.5 rounded ml-1 flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" /> GOOGLE PLAY
                      </span>
                    )}
                    {u.source === 'apple' && (
                      <span className="text-[10px] font-bold tracking-wider bg-slate-500/10 text-slate-300 border border-slate-500/20 px-1.5 py-0.5 rounded ml-1 flex items-center gap-1">
                        <Apple className="w-3 h-3" /> APPLE
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 opacity-70" />
                      <span className="font-mono text-xs opacity-90">
                        {u.phone && !u.phone.startsWith('+') ? `+${u.phone}` : u.phone || 'Sem número'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-80">
                      <Clock className="w-3 h-3" />
                      <span className="text-[11px]">{formatLastSeen(u.last_seen_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="shrink-0 flex flex-wrap items-center gap-2 pt-2 sm:pt-0 sm:border-l sm:border-border/30 sm:pl-4">
                {u.is_pending ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/50 border border-border/50 px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Pendente
                  </span>
                ) : u.is_premium ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                    <Crown className="w-3 h-3" />
                    {getPlanoLabel(u.plano)}
                  </span>
                ) : getTrialStatus(u.created_at).isActive ? (
                  <span className="text-[10px] font-bold tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    ATIVO ({getTrialStatus(u.created_at).remainingText})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/80 border border-border/50 px-2.5 py-1.5 rounded-lg shadow-sm">
                    Expirado
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
