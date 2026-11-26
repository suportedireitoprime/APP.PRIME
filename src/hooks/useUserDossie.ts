import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { rotaParaFuncao, FEATURE_LABELS } from '@/lib/rotaFuncoes';
import { inicioCiclo, diasParaRenovar, contarUsos } from '@/lib/cotaCiclo';
import { loadLimits, type FeatureLimitConfig } from '@/hooks/useFeatureLimit';

export interface UserCotaItem {
  key: string;
  label: string;
  description: string | null;
  category: string;
  period: 'daily' | 'monthly' | 'lifetime';
  limit: number;
  used: number;
  remaining: number;
  percent: number;
  status: 'terminou' | 'em_uso' | 'disponivel' | 'assinantes';
}

export interface FuncaoStat {
  label: string;
  grupo: string;
  hits: number;
  segundos: number;
  ultimaVez: string;
}

export interface Dossie {
  perfil: any;
  funcoes: FuncaoStat[];
  totalSegundos: number;
  segundosHoje: number;
  hitsHoje: number;
  sessoesHoje: number;
  sessoesTotal: number;
  primeiraHoje?: string | null;
  ultimaHoje?: string | null;
  features: { label: string; count: number }[];
  cotas: UserCotaItem[];
  cotasResumo: {
    total: number;
    terminadas: number;
    emUso: number;
    disponiveis: number;
    assinantes: number;
    diasParaRenovar: number;
  };
  eventos: { label: string; count: number }[];
  contadores: { favoritos: number; grifos: number; anotacoes: number };
  assinatura: any;
  horus: any;
  horusStats: any;
  geo: {
    pais: string | null;
    uf: string | null;
    cidade: string | null;
    timezone: string | null;
    locale: string | null;
    deviceModel?: string | null;
  };
  plataformas: [string, number][];
  ultimaSessao?: string | null;
  primeiraSessao?: string | null;
}

const GAP_MAX = 10 * 60 * 1000;

export const hora = (v?: string | null) =>
  v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';

export const dia = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');

export function useUserDossie(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [d, setD] = useState<Dossie | null>(null);

  useEffect(() => {
    if (!userId) {
      setD(null);
      return;
    }
    let cancel = false;
    void (async () => {
      setLoading(true);
      setD(null);
      const desde30 = new Date(Date.now() - 30 * 86400_000).toISOString();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const desdeHoje = hoje.toISOString();

      try {
        const [
          perfilR,
          logR,
          sessR,
          featR,
          evR,
          favR,
          grifR,
          anotR,
          assR,
          horusR,
          horusStatsR,
          limitsR,
        ] = await Promise.all([
          supabase.from('profiles' as any).select('*').eq('id', userId).maybeSingle(),
          supabase
            .from('app_events' as any)
            .select('metadata, created_at')
            .eq('user_id', userId)
            .eq('event_name', 'page_view')
            .gte('created_at', desde30)
            .order('created_at', { ascending: true })
            .limit(2000),
          supabase
            .from('user_sessions' as any)
            .select('started_at, platform, initial_route, pais, uf, cidade, timezone, locale, user_agent')
            .eq('user_id', userId)
            .gte('started_at', desde30)
            .order('started_at', { ascending: false })
            .limit(500),
          supabase
            .from('feature_usage' as any)
            .select('feature_key, scope_value, ref_key, used_at')
            .eq('user_id', userId)
            .limit(3000),
          supabase
            .from('app_events' as any)
            .select('event_name')
            .eq('user_id', userId)
            .gte('created_at', desde30)
            .limit(2000),
          supabase.from('artigos_favoritos' as any).select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('artigos_grifos' as any).select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('artigos_anotacoes' as any).select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase
            .from('play_subscriptions' as any)
            .select('product_id, base_plan_id, status, expires_at, auto_renewing')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('horus_whatsapp_users' as any)
            .select('phone_e164, verified_at, msg_count, last_seen_at, first_seen_at, blocked, onboarding_state, nome_preferido, linked_at')
            .or(`user_id.eq.${userId},linked_user_id.eq.${userId}`)
            .order('verified_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('horus_user_stats' as any)
            .select('telefone, ultima_atividade_em, dias_streak_estudo')
            .eq('user_id', userId)
            .maybeSingle(),
          loadLimits(),
        ]);
        if (cancel) return;

        const allLimits = (limitsR as FeatureLimitConfig[]) || [];
        const usageRows = (featR.data as any[]) || [];
        const createdAt = (perfilR.data as any)?.created_at;
        const inicioMes = inicioCiclo(createdAt);
        const hoje00 = new Date();
        hoje00.setHours(0, 0, 0, 0);

        const cotas: UserCotaItem[] = allLimits
          .filter((l) => l.enabled)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((l) => {
            const rowsDoRecurso = usageRows.filter((r) => r.feature_key === l.feature_key);
            let rowsNoPeriodo = rowsDoRecurso;

            if (l.period === 'monthly') {
              rowsNoPeriodo = rowsDoRecurso.filter((r) => new Date(r.used_at) >= inicioMes);
            } else if (l.period === 'daily') {
              rowsNoPeriodo = rowsDoRecurso.filter((r) => new Date(r.used_at) >= hoje00);
            }

            const used = contarUsos(rowsNoPeriodo);
            const limit = l.limit_value;
            const remaining = Math.max(0, limit - used);
            const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;

            let status: UserCotaItem['status'] = 'disponivel';
            if (limit === 0) status = 'assinantes';
            else if (used >= limit) status = 'terminou';
            else if (used > 0) status = 'em_uso';

            return {
              key: l.feature_key,
              label: l.label,
              description: l.description,
              category: l.category,
              period: l.period,
              limit,
              used,
              remaining,
              percent,
              status,
            };
          });

        const cotasResumo = {
          total: cotas.length,
          terminadas: cotas.filter((c) => c.status === 'terminou').length,
          emUso: cotas.filter((c) => c.status === 'em_uso').length,
          disponiveis: cotas.filter((c) => c.status === 'disponivel').length,
          assinantes: cotas.filter((c) => c.status === 'assinantes').length,
          diasParaRenovar: diasParaRenovar(createdAt),
        };

        const logs = (logR.data as any[]) || [];
        const byFunc = new Map<string, FuncaoStat>();
        let totalSegundos = 0;
        let segundosHoje = 0;
        let hitsHoje = 0;
        let primeiraHoje: string | null = null;
        let ultimaHoje: string | null = null;

        logs.forEach((row, i) => {
          const route = (row.metadata as any)?.route || '/';
          const { label, grupo } = rotaParaFuncao(route);
          const t = new Date(row.created_at).getTime();
          const next = logs[i + 1] ? new Date(logs[i + 1].created_at).getTime() : t;
          const delta = Math.min(Math.max(next - t, 0), GAP_MAX) / 1000;
          const cur = byFunc.get(label) || { label, grupo, hits: 0, segundos: 0, ultimaVez: row.created_at };
          cur.hits += 1;
          cur.segundos += delta;
          cur.ultimaVez = row.created_at;
          byFunc.set(label, cur);
          totalSegundos += delta;
          if (row.created_at >= desdeHoje) {
            hitsHoje += 1;
            segundosHoje += delta;
          }
        });

        const sessoes = (sessR.data as any[]) || [];
        const sessoesDeHoje = sessoes.filter((s) => s.started_at >= desdeHoje);
        if (sessoesDeHoje.length > 0) {
          primeiraHoje = sessoesDeHoje[sessoesDeHoje.length - 1].started_at;
          ultimaHoje = sessoesDeHoje[0].started_at;
        }

        const countBy = (arr: any[], key: string): [string, number][] => {
          const m = new Map<string, number>();
          arr.forEach((r) => m.set(r[key], (m.get(r[key]) || 0) + 1));
          return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
        };

        setD({
          perfil: perfilR.data,
          funcoes: Array.from(byFunc.values()).sort((a, b) => b.hits - a.hits),
          totalSegundos,
          segundosHoje,
          hitsHoje,
          sessoesHoje: sessoesDeHoje.length,
          sessoesTotal: sessoes.length,
          primeiraHoje,
          ultimaHoje,
          features: countBy(usageRows, 'feature_key').map(([k, count]) => ({
            label: FEATURE_LABELS[k] || k,
            count,
          })),
          cotas,
          cotasResumo,
          eventos: countBy((evR.data as any[]) || [], 'event_name')
            .map(([k, count]) => ({ label: k, count }))
            .slice(0, 12),
          contadores: {
            favoritos: favR.count || 0,
            grifos: grifR.count || 0,
            anotacoes: anotR.count || 0,
          },
          assinatura: assR.data,
          horus: (horusR as any)?.data || null,
          horusStats: (horusStatsR as any)?.data || null,
          geo: {
            pais: sessoes.find((x) => x.pais)?.pais ?? (perfilR.data as any)?.pais ?? null,
            uf: sessoes.find((x) => x.uf)?.uf ?? (perfilR.data as any)?.uf ?? null,
            cidade: sessoes.find((x) => x.cidade)?.cidade ?? (perfilR.data as any)?.cidade ?? null,
            timezone: sessoes.find((x) => x.timezone)?.timezone ?? (perfilR.data as any)?.timezone ?? null,
            locale: sessoes.find((x) => x.locale)?.locale ?? (perfilR.data as any)?.locale ?? null,
            deviceModel: (() => {
              const ua = sessoes.find((x) => x.user_agent)?.user_agent;
              if (!ua) return null;
              if (ua.includes('iPhone')) return 'iPhone';
              if (ua.includes('iPad')) return 'iPad';
              const match = ua.match(/\(Linux; Android [^;]+; ([^;]+)\s+Build/);
              return match
                ? match[1]
                : ua.includes('Macintosh')
                  ? 'Mac'
                  : ua.includes('Windows')
                    ? 'Windows'
                    : null;
            })(),
          },
          plataformas: countBy(sessoes.filter((x) => x.platform), 'platform'),
          ultimaSessao: sessoes[0]?.started_at ?? null,
          primeiraSessao: sessoes[sessoes.length - 1]?.started_at ?? null,
        });
      } catch (err: any) {
        console.error('Erro ao carregar dossiê do usuário:', err);
        if (!cancel) {
          toast.error('Erro ao carregar dados do usuário');
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [userId]);

  return { loading, d };
}
