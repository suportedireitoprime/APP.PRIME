import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { RefreshCw, Mail, CreditCard, Copy, Crown, CalendarDays, CalendarRange, Users, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { toast } from 'sonner';
import { classificarAsaas, type AsaasRecord, type Grupo } from '@/lib/asaasClassificar';

const CACHE_KEY = 'admin-asaas-cache-v1';
type Raw = { customers: any[]; subscriptions: any[]; payments: any[]; at: number };

function readCache(): Raw | undefined {
  try { const s = localStorage.getItem(CACHE_KEY); return s ? JSON.parse(s) : undefined; } catch { return undefined; }
}

async function fetchAsaas(): Promise<Raw> {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session?.session?.access_token;
  if (!accessToken) throw new Error('Sessão expirada');
  const fetchAll = async (endpoint: string, maxPages = 30) => {
    let all: any[] = [];
    for (let i = 0; i < maxPages; i++) {
      const res = await supabase.functions.invoke('admin-asaas-proxy', {
        body: { endpoint, params: { limit: 100, offset: i * 100 } },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.error) throw new Error(res.error.message || `Erro ${endpoint}`);
      const d = res.data?.data || [];
      all = all.concat(d);
      if (d.length < 100) break;
    }
    return all;
  };
  const [customers, subscriptions, payments] = await Promise.all([fetchAll('customers'), fetchAll('subscriptions'), fetchAll('payments')]);
  const raw = { customers, subscriptions, payments, at: Date.now() };
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(raw)); } catch { /* cheio */ }
  return raw;
}

type Plano = 'vitalicio' | 'anual' | 'mensal' | 'todos';
const PLANOS: { key: Plano; label: string; icon: any; match: (r: AsaasRecord) => boolean; tone: string }[] = [
  { key: 'vitalicio', label: 'Vitalícios', icon: Crown, match: (r) => r.planClass === 'Vitalício', tone: 'text-amber-400 bg-amber-500/10' },
  { key: 'anual', label: 'Anuais', icon: CalendarRange, match: (r) => r.planClass === 'Anual' || r.planClass === 'Semestral', tone: 'text-sky-400 bg-sky-500/10' },
  { key: 'mensal', label: 'Mensais', icon: CalendarDays, match: (r) => r.planClass === 'Mensal', tone: 'text-emerald-400 bg-emerald-500/10' },
  { key: 'todos', label: 'Todos', icon: Users, match: () => true, tone: 'text-primary bg-primary/10' },
];
const ABAS: { key: Grupo | 'vencendo'; label: string }[] = [
  { key: 'ativo', label: 'Ativos' },
  { key: 'vencendo', label: 'Vencendo' },
  { key: 'vencido', label: 'Vencidos' },
  { key: 'aguardando', label: 'Aguardando' },
  { key: 'cancelado', label: 'Cancelados' },
];

const fmtBRL = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (d?: string | null) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('pt-BR') : '-');

function Vencimento({ r }: { r: AsaasRecord }) {
  if (r.planClass === 'Vitalício') return <span className="text-amber-400">Sem vencimento</span>;
  if (!r.dueDate) return <span className="text-muted-foreground">-</span>;
  const d = r.daysLeft ?? 0;
  const tone = d < 0 ? 'text-rose-400' : d <= 7 ? 'text-amber-400' : 'text-muted-foreground';
  const txt = d < 0 ? `vencido há ${-d}d` : d === 0 ? 'vence hoje' : `vence em ${d}d`;
  return <span>{fmtData(r.dueDate)} <span className={tone}>· {txt}</span></span>;
}

function Metodo({ t }: { t: string }) {
  if (t === 'PIX') return <span className="text-xs font-medium text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">PIX</span>;
  if (t === 'CREDIT_CARD') return <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md"><CreditCard className="w-3 h-3" />Cartão</span>;
  return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{t}</span>;
}

const grupoLabel: Record<Grupo, string> = { ativo: 'Ativo', vencido: 'Vencido', aguardando: 'Aguardando 1º pagamento', cancelado: 'Cancelado' };
const grupoTone: Record<Grupo, string> = { ativo: 'bg-emerald-500/15 text-emerald-400', vencido: 'bg-rose-500/15 text-rose-400', aguardando: 'bg-orange-500/15 text-orange-400', cancelado: 'bg-muted text-muted-foreground' };

export default function AdminAssinantesAsaas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [params, setParams] = useSearchParams();
  const plano = (params.get('plano') as Plano | null) || null;
  const [q, setQ] = useState('');
  const [aba, setAba] = useState<Grupo | 'vencendo'>('ativo');

  const query = useQuery({
    queryKey: ['admin-asaas'],
    queryFn: fetchAsaas,
    enabled: isAdmin,
    staleTime: 2 * 60_000,
    gcTime: 60 * 60_000,
    initialData: readCache,
    initialDataUpdatedAt: () => readCache()?.at,
    refetchOnMount: 'always',
  });

  const records = useMemo(() => (query.data ? classificarAsaas(query.data.customers, query.data.subscriptions, query.data.payments) : []), [query.data]);

  const stats = useMemo(() => PLANOS.map((p) => {
    const ativos = records.filter((r) => p.match(r) && r.grupo === 'ativo');
    return { ...p, count: ativos.length, total: ativos.reduce((a, r) => a + (r.value || 0), 0) };
  }), [records]);

  const atual = PLANOS.find((p) => p.key === plano);
  const lista = useMemo(() => {
    if (!atual) return [];
    const ql = q.toLowerCase();
    return records.filter((r) => atual.match(r)
      && (aba === 'vencendo' ? r.grupo === 'ativo' && r.daysLeft !== null && r.daysLeft <= 7 : r.grupo === aba)
      && (r.customerName.toLowerCase().includes(ql) || r.customerEmail.toLowerCase().includes(ql)));
  }, [records, atual, aba, q]);

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Acesso restrito.</div>;

  const loadingFirst = query.isFetching && !query.data;
  const atualizado = query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="min-h-dvh bg-background pb-20 overflow-x-hidden">
      <PageHeader
        title={atual ? `Assinantes ${atual.label}` : 'Assinantes Asaas'}
        subtitle={query.isFetching && query.data ? 'Atualizando…' : atualizado ? `Atualizado às ${atualizado}` : 'Dados direto da API'}
        onBack={() => (atual ? setParams({}) : navigate('/admin-funcoes'))}
        rightAction={
          <button onClick={() => query.refetch()} disabled={query.isFetching} className="p-2 bg-muted rounded-full" aria-label="Atualizar">
            <RefreshCw className={`w-5 h-5 ${query.isFetching ? 'animate-spin' : ''}`} />
          </button>
        }
      />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-4 pt-2">
        {query.isError && !query.data && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm">{(query.error as Error).message}</div>
        )}

        {!atual && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
              <button key={s.key} onClick={() => { setParams({ plano: s.key }); setAba('ativo'); setQ(''); }}
                className="text-left bg-card border border-border rounded-2xl p-4 active:scale-[0.98] transition min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`p-2 rounded-xl ${s.tone}`}><s.icon className="w-5 h-5" /></span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="mt-3 text-sm text-muted-foreground truncate">{s.label}</div>
                <div className="text-2xl font-bold">{loadingFirst ? '…' : s.count}</div>
                <div className="text-xs text-muted-foreground truncate">{loadingFirst ? 'carregando' : `${fmtBRL(s.total)} ativos`}</div>
              </button>
            ))}
          </div>
        )}

        {!atual && (
          <p className="text-xs text-muted-foreground text-center">Toque em um card para ver a lista com vencimentos.</p>
        )}

        {atual && (
          <>
            <button onClick={() => setParams({})} className="hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" />Categorias</button>
            <input type="text" placeholder="Buscar nome ou e-mail..." value={q} onChange={(e) => setQ(e.target.value)}
              className="w-full bg-muted px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-none">
              {ABAS.map((a) => (
                <button key={a.key} onClick={() => setAba(a.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${aba === a.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {a.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">{lista.length} assinante(s) · {fmtBRL(lista.reduce((a, r) => a + (r.value || 0), 0))}</div>

            {loadingFirst ? (
              <div className="py-10 text-center text-muted-foreground text-sm">Carregando dados do Asaas…</div>
            ) : lista.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">Nenhum assinante aqui.</div>
            ) : (
              <>
                <div className="space-y-2 md:hidden">
                  {lista.map((r) => (
                    <div key={r.id} className="bg-card border border-border rounded-2xl p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{r.customerName}</div>
                          <button onClick={() => { navigator.clipboard?.writeText(r.customerEmail); toast.success('E-mail copiado'); }}
                            className="text-xs text-muted-foreground flex items-center gap-1 max-w-full">
                            <Mail className="w-3 h-3 shrink-0" /><span className="truncate">{r.customerEmail}</span><Copy className="w-3 h-3 shrink-0" />
                          </button>
                        </div>
                        <div className="font-bold text-emerald-400 shrink-0">{fmtBRL(r.value)}</div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted">{r.planClass}</span>
                        <Metodo t={r.billingType} />
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${grupoTone[r.grupo]}`}>{grupoLabel[r.grupo]}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div><div className="text-muted-foreground">Compra</div>{fmtData(r.date)}</div>
                        <div><div className="text-muted-foreground">Vencimento</div><Vencimento r={r} /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30 border-b border-border text-muted-foreground">
                      <tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Compra</th><th className="px-4 py-3">Plano</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Método</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Situação</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lista.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3 max-w-[260px]"><div className="font-semibold truncate">{r.customerName}</div><div className="text-xs text-muted-foreground truncate">{r.customerEmail}</div></td>
                          <td className="px-4 py-3">{fmtData(r.date)}</td>
                          <td className="px-4 py-3">{r.planClass}<div className="text-xs text-muted-foreground">{r.type === 'subscription' ? 'Assinatura' : r.isInstallment ? 'Parcelado' : 'Pagto único'}</div></td>
                          <td className="px-4 py-3 font-semibold text-emerald-400">{fmtBRL(r.value)}</td>
                          <td className="px-4 py-3"><Metodo t={r.billingType} /></td>
                          <td className="px-4 py-3 text-xs"><Vencimento r={r} /></td>
                          <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${grupoTone[r.grupo]}`}>{grupoLabel[r.grupo]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
