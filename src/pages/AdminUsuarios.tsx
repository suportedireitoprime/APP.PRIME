import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Search, Crown, User, Calendar, Loader2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { UserDossieSheet } from '@/components/admin/UserDossieSheet';
import { useGoBack } from '@/hooks/useGoBack';
import { get as idbGet, set as idbSet } from 'idb-keyval';

interface Usuario {
  id: string;
  email: string | null;
  display_name: string | null;
  last_seen_at: string | null;
  is_premium: boolean;
  created_at: string | null;
}

const USERS_CACHE_KEY = 'admin_usuarios_list_v2';
const USERS_SYNC_TIME_KEY = 'admin_usuarios_sync_time_v2';
let memoryUsuariosCache: Usuario[] | null = null;
let memorySyncTimestamp: string | null = null;

export default function AdminUsuarios() {
  const goBack = useGoBack();
  const [loading, setLoading] = useState(!memoryUsuariosCache || memoryUsuariosCache.length === 0);
  const [sincronizando, setSincronizando] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => memoryUsuariosCache || []);
  const [busca, setBusca] = useState('');
  const [filtroAssinante, setFiltroAssinante] = useState<'todos' | 'assinantes' | 'gratuitos'>('todos');
  const [dossieUserId, setDossieUserId] = useState<Usuario | null>(null);

  const [limiteExibicao, setLimiteExibicao] = useState(50);

  const carregarOuSincronizar = useCallback(async (forcarCompleto = false) => {
    try {
      if (forcarCompleto) {
        setSincronizando(true);
      }

      const since = (!forcarCompleto && memorySyncTimestamp && memoryUsuariosCache && memoryUsuariosCache.length > 0)
        ? memorySyncTimestamp
        : null;

      const { data: authUsers, error: authErr } = await supabase.functions.invoke('admin-list-users', {
        body: since ? { since } : {}
      });

      if (authErr) {
        console.error('Edge Function Error:', authErr);
        if (!memoryUsuariosCache || memoryUsuariosCache.length === 0) {
          throw new Error(authErr.message || authErr.context?.error || JSON.stringify(authErr));
        }
        return;
      }

      const getMostRecentDate = (...dates: (string | null | undefined)[]) => {
        let latestTime = 0;
        let latestStr: string | null = null;
        for (const d of dates) {
          if (!d) continue;
          const t = new Date(d).getTime();
          if (!isNaN(t) && t > latestTime) {
            latestTime = t;
            latestStr = d;
          }
        }
        return latestStr;
      };

      const mappedNovos: Usuario[] = (authUsers || []).map((u: any) => {
        const lastAccess = getMostRecentDate(
          u.activity_last_seen_at,
          u.last_sign_in_at,
          u.created_at
        );
        return {
          id: u.id,
          display_name: u.profile_display_name || u.user_metadata?.full_name || u.user_metadata?.name || u.user_metadata?.display_name || null,
          is_premium: !!u.is_premium,
          created_at: u.created_at,
          email: u.email || null,
          last_seen_at: lastAccess || u.created_at || null
        };
      });

      let listaFinal: Usuario[] = [];

      if (since && memoryUsuariosCache && memoryUsuariosCache.length > 0) {
        // Merge incremental dos mais recentes sobre os existentes em cache
        const userMap = new Map<string, Usuario>();
        memoryUsuariosCache.forEach(u => userMap.set(u.id, u));
        mappedNovos.forEach(u => userMap.set(u.id, u));
        listaFinal = Array.from(userMap.values());
      } else {
        listaFinal = mappedNovos;
      }

      listaFinal.sort((a, b) => {
        const tA = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const tB = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return tB - tA;
      });

      const nowIso = new Date().toISOString();
      memoryUsuariosCache = listaFinal;
      memorySyncTimestamp = nowIso;
      setUsuarios(listaFinal);

      // Salva de forma persistente em segundo plano
      void idbSet(USERS_CACHE_KEY, listaFinal);
      void idbSet(USERS_SYNC_TIME_KEY, nowIso);

      if (forcarCompleto) {
        toast.success('Lista de usuários atualizada com sucesso!');
      }
    } catch (e: any) {
      toast.error('Erro ao sincronizar usuários: ' + (e.message || ''));
    } finally {
      setLoading(false);
      setSincronizando(false);
    }
  }, []);

  useEffect(() => {
    let cancel = false;
    async function inicializar() {
      // 1. Tenta carregar do IndexedDB se não estiver na memória (instantâneo)
      if (!memoryUsuariosCache || memoryUsuariosCache.length === 0) {
        try {
          const cached = await idbGet<Usuario[]>(USERS_CACHE_KEY);
          const cachedTime = await idbGet<string>(USERS_SYNC_TIME_KEY);
          if (cached && Array.isArray(cached) && cached.length > 0 && !cancel) {
            memoryUsuariosCache = cached;
            memorySyncTimestamp = cachedTime || null;
            setUsuarios(cached);
            setLoading(false);
          }
        } catch (err) {
          console.warn('Erro ao ler cache IDB:', err);
        }
      }

      // 2. Busca incremental (apenas novidades / alterações) em segundo plano
      if (!cancel) {
        await carregarOuSincronizar(false);
      }
    }

    inicializar();
    return () => { cancel = true; };
  }, [carregarOuSincronizar]);

  useEffect(() => {
    setLimiteExibicao(50);
  }, [busca, filtroAssinante]);

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

  const exibidos = useMemo(() => filtrados.slice(0, limiteExibicao), [filtrados, limiteExibicao]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <div className="relative">
        <PageHeader title="Usuários Cadastrados" subtitle="Lista de usuários e último acesso" onBack={goBack} />
        <button
          onClick={() => carregarOuSincronizar(true)}
          disabled={sincronizando}
          title="Sincronizar usuários"
          className="absolute right-4 top-4 sm:right-8 sm:top-6 p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${sincronizando ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

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
          <div className="space-y-4">
            <div className="grid gap-3">
              {filtrados.length === 0 ? (
                <div className="p-8 text-center bg-secondary/10 border border-dashed border-border/50 rounded-2xl">
                  <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                </div>
              ) : (
                exibidos.map(u => (
                  <div key={u.id} onClick={() => setDossieUserId(u)} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-secondary/10 border border-border/50 items-start sm:items-center justify-between hover:bg-secondary/20 transition-all cursor-pointer">
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
                          {u.last_seen_at 
                            ? new Date(u.last_seen_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) 
                            : (u.created_at ? new Date(u.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Recente')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filtrados.length > limiteExibicao && (
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setLimiteExibicao(prev => prev + 50)}
                  className="px-6 py-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-border/50 text-xs font-semibold text-foreground transition-all flex items-center gap-2"
                >
                  Carregar mais 50 usuários ({filtrados.length - limiteExibicao} restantes)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {dossieUserId && (
        <UserDossieSheet
          userId={dossieUserId.id}
          nome={dossieUserId.display_name || ''}
          email={dossieUserId.email ?? ''}
          provider="email"
          onClose={() => {
            setDossieUserId(null);
            void carregarOuSincronizar(true);
          }}
        />
      )}
    </div>
  );
}
