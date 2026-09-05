import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AreasFunilCard } from '@/components/admin/AreasFunilCard';
import { getPresenceState } from '@/hooks/usePresenceTracker';
import {
  Wifi,
  Clock,
  CalendarDays,
  Users,
  UserPlus,
  Gift,
  Repeat,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { isAdminEmail } from '@/lib/adminEmails';
import { useGoBack } from '@/hooks/useGoBack';
import {
  type PresenceUser,
  type ActivityRow,
  type NormalizedUser,
  type MetricCard,
  type UserDetail,
  getRouteLabel,
  buildRouteRank,
  MonitorUserRow,
  MonitorUserDetailView,
  MonitorMetricCardsGrid,
  MonitorOnlineNowCard,
  MonitorDayUsersCard,
  MonitorRankFuncoesCard,
} from '@/components/admin/monitorUsuarios';

const AdminMonitorUsuarios = () => {
  const goBack = useGoBack();
  const [realtimeUsers, setRealtimeUsers] = useState<PresenceUser[]>([]);
  const [last5min, setLast5min] = useState<ActivityRow[]>([]);
  const [today, setToday] = useState<ActivityRow[]>([]);
  const [weekData, setWeekData] = useState<ActivityRow[]>([]);
  const [monthData, setMonthData] = useState<ActivityRow[]>([]);

  const [signupsToday, setSignupsToday] = useState(0);
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
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [rankPeriod, setRankPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll presence state (filter admin)
  useEffect(() => {
    const poll = () => {
      const state = getPresenceState();
      const map = new Map<string, PresenceUser>();
      Object.values(state).forEach((presences: any[]) => {
        presences.forEach((p) => {
          if (isAdminEmail(p.email)) return;
          const existing = map.get(p.user_id);
          if (!existing || new Date(p.online_at) > new Date(existing.online_at)) {
            map.set(p.user_id, {
              user_id: p.user_id,
              email: p.email,
              display_name: p.display_name,
              current_route: p.current_route,
              online_at: p.online_at,
            });
          }
        });
      });
      setRealtimeUsers(Array.from(map.values()));
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch aggregate history
  const fetchHistory = useCallback(async () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [r5, rToday, rWeek, rMonth, rSignups, rTrial, rTotal, rPremium] = await Promise.all([
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

    if (r5.data) setLast5min((r5.data as ActivityRow[]).filter((r) => !isAdminEmail(r.email)));
    if (rToday.data) setToday((rToday.data as ActivityRow[]).filter((r) => !isAdminEmail(r.email)));
    if (rWeek.data) setWeekData((rWeek.data as ActivityRow[]).filter((r) => !isAdminEmail(r.email)));
    if (rMonth.data) setMonthData((rMonth.data as ActivityRow[]).filter((r) => !isAdminEmail(r.email)));
    setSignupsToday(rSignups.count ?? 0);
    setTrialClicksToday(rTrial.count ?? 0);
    setTotalUsers(rTotal.count ?? 0);
    setPremiumUsers(rPremium.count ?? 0);
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15_000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  // Fetch users for the chosen calendar date (append-only sessions)
  const fetchByDate = useCallback(async (date: Date) => {
    setLoadingDate(true);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const { data } = await supabase
      .from('user_sessions' as any)
      .select('user_id, email, display_name, initial_route, started_at')
      .gte('started_at', start.toISOString())
      .lt('started_at', end.toISOString())
      .order('started_at', { ascending: false })
      .limit(2000);
    if (data) {
      setDateUsers(
        (data as any[])
          .filter((r) => !isAdminEmail(r.email))
          .map((r) => ({
            user_id: r.user_id,
            email: r.email,
            display_name: r.display_name,
            current_route: r.initial_route,
            last_seen_at: r.started_at,
          })) as ActivityRow[],
      );
    } else setDateUsers([]);
    setLoadingDate(false);
  }, []);

  useEffect(() => {
    fetchByDate(selectedDate);
  }, [selectedDate, fetchByDate]);

  // Fetch detailed session for a user
  const fetchUserDetail = useCallback(async (user: NormalizedUser) => {
    setLoadingUser(true);

    const { data: sessions } = await supabase
      .from('user_sessions' as any)
      .select('initial_route, started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true })
      .limit(2000);

    const { data: activity } = await supabase
      .from('user_activity_log')
      .select('current_route, last_seen_at, email')
      .eq('user_id', user.id)
      .order('last_seen_at', { ascending: true });

    const sess = (sessions ?? []) as unknown as Array<{ initial_route: string | null; started_at: string }>;
    const acts = (activity ?? []).filter((a: any) => !isAdminEmail(a.email)) as unknown as Array<{
      current_route: string | null;
      last_seen_at: string;
    }>;

    const totalAccesses = sess.length > 0 ? sess.length : acts.length;
    const daysSet = new Set<string>();
    sess.forEach((s) => daysSet.add(new Date(s.started_at).toDateString()));
    acts.forEach((a) => daysSet.add(new Date(a.last_seen_at).toDateString()));

    const routeMap: Record<string, { count: number; totalMs: number; route: string }> = {};
    let totalTimeMs = 0;
    const combined = [
      ...sess.map((s) => ({ route: s.initial_route, at: s.started_at })),
      ...acts.map((a) => ({ route: a.current_route, at: a.last_seen_at })),
    ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    for (let i = 0; i < combined.length; i++) {
      const r = combined[i];
      const label = getRouteLabel(r.route);
      const bucket = routeMap[label] ?? { count: 0, totalMs: 0, route: r.route || label };
      bucket.count += 1;
      const next = combined[i + 1];
      if (next) {
        const diff = new Date(next.at).getTime() - new Date(r.at).getTime();
        const dwell = diff > 15 * 60 * 1000 ? 5 * 60 * 1000 : Math.max(diff, 0);
        bucket.totalMs += dwell;
        totalTimeMs += dwell;
      }
      routeMap[label] = bucket;
    }

    const routes = Object.entries(routeMap)
      .map(([label, v]) => ({ label, route: v.route, count: v.count, totalMs: v.totalMs }))
      .sort((a, b) => b.totalMs - a.totalMs || b.count - a.count);

    const firstSeen = combined[0]?.at ?? user.time;
    const lastSeen = combined[combined.length - 1]?.at ?? user.time;

    setSelectedUserDetail({
      userId: user.id,
      email: user.email,
      name: user.name,
      totalAccesses,
      distinctDays: daysSet.size,
      firstSeen,
      lastSeen,
      isRecurrent: daysSet.size > 1,
      totalTimeMs,
      routes,
    });
    setLoadingUser(false);
  }, []);

  // Deduplicate date users → count accesses per user
  const dateUniqueUsers: NormalizedUser[] = useMemo(() => {
    const seen = new Map<string, NormalizedUser>();
    for (const u of dateUsers) {
      const existing = seen.get(u.user_id);
      if (existing) {
        existing.accesses = (existing.accesses ?? 0) + 1;
        continue;
      }
      seen.set(u.user_id, {
        id: u.user_id,
        email: u.email ?? '',
        name: u.display_name ?? '',
        route: u.current_route,
        time: u.last_seen_at,
        isOnline: realtimeUsers.some((r) => r.user_id === u.user_id),
        accesses: 1,
      });
    }
    return Array.from(seen.values()).sort((a, b) => (b.accesses ?? 0) - (a.accesses ?? 0));
  }, [dateUsers, realtimeUsers]);

  // Recurrent users today (>=2 rows in month means recurrent)
  const recurrentToday = useMemo(() => {
    const uidsToday = new Set(today.map((t) => t.user_id));
    const map: Record<string, Set<string>> = {};
    monthData.forEach((r) => {
      const day = new Date(r.last_seen_at).toDateString();
      (map[r.user_id] ??= new Set()).add(day);
    });
    let c = 0;
    uidsToday.forEach((uid) => {
      if ((map[uid]?.size ?? 0) > 1) c += 1;
    });
    return c;
  }, [today, monthData]);

  const uniqueTodayUsers = useMemo(() => new Set(today.map((r) => r.user_id)).size, [today]);

  const cards: MetricCard[] = [
    {
      key: 'realtime',
      title: 'Em tempo real',
      subtitle: `${realtimeUsers.length} online`,
      icon: Wifi,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15',
      badgeBg: 'bg-emerald-500',
      count: realtimeUsers.length,
      clickable: true,
      users: realtimeUsers.map((u) => ({
        id: u.user_id,
        email: u.email,
        name: u.display_name,
        route: u.current_route,
        time: u.online_at,
        isOnline: true,
      })),
    },
    {
      key: 'last5',
      title: 'Últimos 5 min',
      subtitle: `${last5min.length} usuários`,
      icon: Clock,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/15',
      badgeBg: 'bg-blue-500',
      count: last5min.length,
      clickable: true,
      users: last5min.map((u) => ({
        id: u.user_id,
        email: u.email ?? '',
        name: u.display_name ?? '',
        route: u.current_route,
        time: u.last_seen_at,
        isOnline: realtimeUsers.some((r) => r.user_id === u.user_id),
      })),
    },
    {
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
    },
  ];

  const rankMap = useMemo(
    () => ({
      day: buildRouteRank(today),
      week: buildRouteRank(weekData),
      month: buildRouteRank(monthData),
    }),
    [today, weekData, monthData],
  );
  const rankRows = rankMap[rankPeriod];
  const maxRank = rankRows[0]?.count || 1;

  const activeBlock = cards.find((b) => b.key === selectedBlock);
  const isDetail = !!selectedBlock || !!selectedUserDetail;
  const detailTitle = selectedUserDetail ? 'Detalhe do Usuário' : selectedBlock ? activeBlock?.title : '';

  const handleBack = () => {
    if (selectedUserDetail) setSelectedUserDetail(null);
    else if (selectedBlock) setSelectedBlock(null);
    else goBack();
  };

  const handleUserClick = (user: NormalizedUser) => fetchUserDetail(user);

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        title={isDetail ? (detailTitle ?? 'Detalhe') : 'Usuários Online'}
        onBack={handleBack}
        leading={<Users className="w-5 h-5 text-primary" />}
      />

      <AnimatePresence mode="wait">
        {selectedUserDetail ? (
          <MonitorUserDetailView userDetail={selectedUserDetail} />
        ) : selectedBlock && activeBlock && activeBlock.clickable ? (
          <motion.div
            key="user-list"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="p-4 max-w-3xl mx-auto space-y-2"
          >
            {!activeBlock.users || activeBlock.users.length === 0 ? (
              <div className="rounded-2xl bg-secondary/30 border border-border/30 py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum usuário neste período</p>
              </div>
            ) : (
              activeBlock.users.map((u, i) => (
                <MonitorUserRow key={u.id} user={u} index={i} onClick={handleUserClick} />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            className="p-4 max-w-3xl mx-auto space-y-5"
          >
            <MonitorMetricCardsGrid
              cards={cards}
              onSelectCard={setSelectedBlock}
              signupsToday={signupsToday}
              trialClicksToday={trialClicksToday}
            />

            <AreasFunilCard dias={7} />

            <MonitorOnlineNowCard realtimeUsers={realtimeUsers} onUserClick={handleUserClick} />

            <MonitorDayUsersCard
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              calendarOpen={calendarOpen}
              setCalendarOpen={setCalendarOpen}
              loadingDate={loadingDate}
              dateUniqueUsers={dateUniqueUsers}
              onUserClick={handleUserClick}
            />

            <MonitorRankFuncoesCard
              rankPeriod={rankPeriod}
              setRankPeriod={setRankPeriod}
              rankRows={rankRows}
              maxRank={maxRank}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loadingUser && (
        <div className="fixed inset-0 z-50 bg-background/60 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default AdminMonitorUsuarios;
