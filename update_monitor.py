import re
import os

path = r"c:\Users\ext_wpereira\OneDrive - Vitamina Work Life S.A\Documentos\APP.PRIME\src\pages\AdminMonitorUsuarios.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Select imports
content = content.replace("import { Button } from '@/components/ui/button';",
"""import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';""")

# 2. Add type PeriodoId
content = content.replace("interface RouteVisit {",
"""type PeriodoId = 'hoje' | 'ontem' | '7d' | '30d';

interface RouteVisit {""")

# 3. Add getDatasPeriodo and isoDate
content = content.replace("const AdminMonitorUsuarios = () => {",
"""const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getDatasPeriodo = (p: PeriodoId) => {
  const hoje = new Date();
  if (p === 'hoje') return [hoje];
  if (p === 'ontem') {
    const ontem = new Date(); ontem.setDate(hoje.getDate() - 1); return [ontem];
  }
  const dias = p === '7d' ? 7 : 30;
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(); d.setDate(hoje.getDate() - i); return d;
  });
};

const AdminMonitorUsuarios = () => {""")

# 4. State updates
# We will replace signupsToday, trialClicksToday, totalUsers, premiumUsers
state_to_replace = """  const [signupsToday, setSignupsToday] = useState(0);
  const [trialClicksToday, setTrialClicksToday] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [premiumUsers, setPremiumUsers] = useState(0);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dateUsers, setDateUsers] = useState<ActivityRow[]>([]);
  const [loadingDate, setLoadingDate] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);"""

new_state = """  const [periodo, setPeriodo] = useState<PeriodoId>('hoje');
  const [signupsToday, setSignupsToday] = useState(0);
  const [trialClicksToday, setTrialClicksToday] = useState(0);
  const [paywallViews, setPaywallViews] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [premiumUsers, setPremiumUsers] = useState(0);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dateUsers, setDateUsers] = useState<ActivityRow[]>([]);
  const [loadingDate, setLoadingDate] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);"""
content = content.replace(state_to_replace, new_state)

# 5. Modifying fetchHistory to use admin_metricas_dia
fetch_history_old = """    const [r5, rToday, rWeek, rMonth, rSignups, rTrial, rTotal, rPremium] = await Promise.all([
      supabase
        .from('user_activity_log')
        .select('*')
        .gte('last_seen_at', fiveMinAgo)
        .order('last_seen_at', { ascending: false }),
      supabase
        .from('user_activity_log')
        .select('*')
        .gte('last_seen_at', startOfDay.toISOString())
        .order('last_seen_at', { ascending: false }),
      supabase
        .from('user_activity_log')
        .select('*')
        .gte('last_seen_at', startOfWeek.toISOString())
        .order('last_seen_at', { ascending: false }),
      supabase
        .from('user_activity_log')
        .select('*')
        .gte('last_seen_at', startOfMonth.toISOString())
        .order('last_seen_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString()),
      supabase
        .from('app_events' as any)
        .select('id', { count: 'exact', head: true })
        .eq('event_name', 'trial_click')
        .gte('created_at', startOfDay.toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
    ]);

    if (r5.data) setLast5min((r5.data as ActivityRow[]).filter(r => !isAdminEmail(r.email)));
    if (rToday.data) setToday((rToday.data as ActivityRow[]).filter(r => !isAdminEmail(r.email)));
    if (rWeek.data) setWeekData((rWeek.data as ActivityRow[]).filter(r => !isAdminEmail(r.email)));
    if (rMonth.data) setMonthData((rMonth.data as ActivityRow[]).filter(r => !isAdminEmail(r.email)));
    setSignupsToday(rSignups.count ?? 0);
    setTrialClicksToday(rTrial.count ?? 0);
    setTotalUsers(rTotal.count ?? 0);
    setPremiumUsers(rPremium.count ?? 0);
  }, []);"""

fetch_history_new = """    const datas = getDatasPeriodo(periodo);
    const metricasPromises = datas.map(d => supabase.rpc('admin_metricas_dia' as any, { _dia: isoDate(d) }));
    
    const [r5, rToday, rWeek, rMonth, rTotal, rPremium, ...metricasResults] = await Promise.all([
      supabase.from('user_activity_log').select('*').gte('last_seen_at', fiveMinAgo).order('last_seen_at', { ascending: false }),
      supabase.from('user_activity_log').select('*').gte('last_seen_at', startOfDay.toISOString()).order('last_seen_at', { ascending: false }),
      supabase.from('user_activity_log').select('*').gte('last_seen_at', startOfWeek.toISOString()).order('last_seen_at', { ascending: false }),
      supabase.from('user_activity_log').select('*').gte('last_seen_at', startOfMonth.toISOString()).order('last_seen_at', { ascending: false }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
      ...metricasPromises
    ]);

    if (r5.data) setLast5min((r5.data as ActivityRow[]).filter(r => !isAdminEmail(r.email)));
    if (rToday.data) setToday((rToday.data as ActivityRow[]).filter(r => !isAdminEmail(r.email)));
    if (rWeek.data) setWeekData((rWeek.data as ActivityRow[]).filter(r => !isAdminEmail(r.email)));
    if (rMonth.data) setMonthData((rMonth.data as ActivityRow[]).filter(r => !isAdminEmail(r.email)));
    setTotalUsers(rTotal.count ?? 0);
    setPremiumUsers(rPremium.count ?? 0);

    let tc = 0;
    let tp = 0;
    let tt = 0;
    metricasResults.forEach(({ data }) => {
      const m = (data as any) || {};
      tc += m.cadastros || 0;
      tp += m.paywall || 0;
      tt += m.trial || 0;
    });
    setSignupsToday(tc);
    setTrialClicksToday(tt);
    setPaywallViews(Math.max(tp, tt));
  }, [periodo]);"""
content = content.replace(fetch_history_old, fetch_history_new)

# 6. Update Cards definition
cards_old = """    {
      key: 'today',
      title: 'Ativos hoje',
      subtitle: `${uniqueTodayUsers} únicos`,
      icon: CalendarDays,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15',
      badgeBg: 'bg-purple-500',
      count: uniqueTodayUsers,
      clickable: true,
      users: dateUniqueUsers,
    },
    {
      key: 'signups',
      title: 'Cadastros hoje',
      subtitle: `${totalUsers} no total`,
      icon: UserPlus,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/15',
      badgeBg: 'bg-pink-500',
      count: signupsToday,
      clickable: false,
    },
    {
      key: 'trial',
      title: 'Testes clicados',
      subtitle: '7 ou 3 dias grátis',
      icon: Gift,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15',
      badgeBg: 'bg-amber-500',
      count: trialClicksToday,
      clickable: false,
    },
    {
      key: 'recurrent',
      title: 'Recorrentes hoje',
      subtitle: `${premiumUsers} premium`,
      icon: Repeat,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15',
      badgeBg: 'bg-cyan-500',
      count: recurrentToday,
      clickable: false,
    },"""

cards_new = """    {
      key: 'today',
      title: periodo === 'hoje' ? 'Ativos hoje' : `Ativos no período`,
      subtitle: `${uniqueTodayUsers} únicos (hoje)`,
      icon: CalendarDays,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15',
      badgeBg: 'bg-purple-500',
      count: uniqueTodayUsers,
      clickable: true,
      users: dateUniqueUsers,
    },
    {
      key: 'signups',
      title: 'Cadastros',
      subtitle: `No período`,
      icon: UserPlus,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/15',
      badgeBg: 'bg-pink-500',
      count: signupsToday,
      clickable: false,
    },
    {
      key: 'recurrent',
      title: 'Viu planos',
      subtitle: `No período`,
      icon: Sparkles,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15',
      badgeBg: 'bg-cyan-500',
      count: paywallViews,
      clickable: false,
    },
    {
      key: 'trial',
      title: 'Testes clicados',
      subtitle: 'No período',
      icon: Gift,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15',
      badgeBg: 'bg-amber-500',
      count: trialClicksToday,
      clickable: false,
    },"""
content = content.replace(cards_old, cards_new)

# 7. Add Select to header
header_old = """      <PageHeader
        title={isDetail ? (detailTitle ?? 'Detalhe') : 'Usuários Online'}
        onBack={handleBack}
        leading={<Users className="w-5 h-5 text-primary" />}
      />"""

header_new = """      <PageHeader
        title={isDetail ? (detailTitle ?? 'Detalhe') : 'Usuários Online'}
        onBack={handleBack}
        leading={<Users className="w-5 h-5 text-primary" />}
        trailing={
          !isDetail && (
            <div className="w-[120px]">
              <Select value={periodo} onValueChange={(v: PeriodoId) => setPeriodo(v)}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        }
      />"""
content = content.replace(header_old, header_new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated successfully")
