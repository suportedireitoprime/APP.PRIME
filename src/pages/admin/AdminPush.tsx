import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Clock, CheckCircle2, RefreshCw, LayoutDashboard,
  Loader2, Smartphone, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import { dispararNotificacaoLocalTeste } from '@/lib/nativo/notificacaoLocalManager';
import {
  GRADE_2_HORAS,
  buildAudiencePayload,
  getBrasiliaDateStr,
  getNextRunInfo,
  getTodayBrasiliaIso,
  type GradeSlot,
  type PushCampaign,
  type TabMode,
  type TargetAudience,
} from '@/components/admin/push/pushConfig';
import {
  cancelPushCampaign,
  dispatchPushCampaign,
  fetchPushCampaigns,
} from '@/components/admin/push/pushService';

export type { PushCampaign };

const PushDashboardTab = lazy(() => import('@/components/admin/push/PushDashboardTab'));
const PushManualFormTab = lazy(() => import('@/components/admin/push/PushManualFormTab'));
const PushEventsModal = lazy(() => import('@/components/admin/push/PushEventsModal'));

export default function AdminPush() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabMode>('grade2h');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayBrasiliaIso);
  const [selectedEventType, setSelectedEventType] = useState<'delivered' | 'opened' | 'failed' | null>(null);
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Slots da Grade 2 Horas
  const [disparandoSlotHora, setDisparandoSlotHora] = useState<string | null>(null);
  const [testandoSlotHora, setTestandoSlotHora] = useState<string | null>(null);
  const [slotParaEditar, setSlotParaEditar] = useState<GradeSlot | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRota, setEditRota] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Manual Push
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('users_only');
  const [selectedCategory, setSelectedCategory] = useState<string>('geral');

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPushCampaigns();
      setCampaigns(data);
    } catch {
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const scheduledCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'scheduled'),
    [campaigns],
  );

  // Timer de 10s apenas na aba grade2h e com documento visível
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    if (tab !== 'grade2h') return;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      setNowMs(Date.now());
    }, 10_000);
    return () => clearInterval(timer);
  }, [tab]);

  const nextScheduled = useMemo(() => {
    const nowIso = new Date(nowMs).toISOString();
    return (
      scheduledCampaigns
        .filter((c) => c.next_run_at && c.next_run_at >= nowIso)
        .sort((a, b) => (a.next_run_at || '').localeCompare(b.next_run_at || ''))[0] || null
    );
  }, [scheduledCampaigns, nowMs]);

  const slotStatusMap = useMemo(() => {
    const map = new Map<
      string,
      {
        nextRunIso: string;
        campaignTitle: string;
        countdownLabel: string;
        isNextImmediate: boolean;
        destinationUrl?: string | null;
      }
    >();

    const nowIso = new Date(nowMs).toISOString();
    const futureCampaigns = scheduledCampaigns
      .filter((c) => c.next_run_at && c.next_run_at >= nowIso)
      .sort((a, b) => (a.next_run_at || '').localeCompare(b.next_run_at || ''));

    const immediateNextId = futureCampaigns[0]?.id;

    for (const c of futureCampaigns) {
      if (!c.next_run_at) continue;
      const horaBrt = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(c.next_run_at));

      if (!map.has(horaBrt)) {
        const info = getNextRunInfo(c.next_run_at, nowMs);
        map.set(horaBrt, {
          nextRunIso: c.next_run_at,
          campaignTitle: c.title,
          countdownLabel: info?.label || '',
          isNextImmediate: c.id === immediateNextId,
          destinationUrl: c.url,
        });
      }
    }
    return map;
  }, [scheduledCampaigns, nowMs]);

  const handleCreatePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }

    setSubmitting(true);
    try {
      const isNow = !scheduledTime;
      const scheduledForIso = scheduledTime ? new Date(scheduledTime).toISOString() : undefined;
      const audiencePayload = buildAudiencePayload(targetAudience);

      if (isNow && targetAudience === 'test_admin') {
        toast.info('Enviando push de teste para o seu aparelho...');
        await dispatchPushCampaign({
          title: title.trim(),
          body: body.trim(),
          url: destinationUrl.trim() || undefined,
          audience: audiencePayload,
          tipo: selectedCategory,
          adminTestOnly: true,
        });
        toast.success('Push de teste entregue ao aparelho admin!');
        return;
      }

      if (isNow) toast.info('Disparando notificação agora...');
      await dispatchPushCampaign({
        title: title.trim(),
        body: body.trim(),
        url: destinationUrl.trim() || null,
        audience: audiencePayload,
        tipo: selectedCategory,
        scheduledForIso,
      });

      if (isNow) {
        toast.success('Notificação enviada com sucesso para os usuários!');
      } else if (scheduledForIso) {
        toast.success(
          `Notificação agendada para ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(scheduledForIso))}`,
        );
      }

      setTitle('');
      setBody('');
      setDestinationUrl('');
      setScheduledTime('');
      setTab('dashboard');
      void loadCampaigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate2HourSchedule = async () => {
    haptic.impact('heavy');
    setPlannerLoading(true);
    toast.loading('Gerando e ativando grade de 2 em 2 horas (próximos 7 dias)...', { id: 'planner_run' });
    try {
      const { data, error } = await supabase.functions.invoke('push-planner', { body: { dias: 7 } });
      if (!error && data?.ok) {
        toast.success(`Grade a cada 2 horas ativada! ${data.generated} disparos programados.`, { id: 'planner_run' });
        void loadCampaigns();
        return;
      }
      toast.error(`Falha ao gerar grade: ${data?.error || error?.message || 'Erro desconhecido'}`, { id: 'planner_run' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro: ${msg}`, { id: 'planner_run' });
    } finally {
      setPlannerLoading(false);
    }
  };

  const handleDispararSlotAgora = async (slot: GradeSlot) => {
    haptic.impact('heavy');
    setDisparandoSlotHora(slot.hora);
    toast.loading(`Disparando notificação das ${slot.hora} (${slot.titulo}) para todos...`, { id: `disp_slot_${slot.hora}` });
    try {
      await dispatchPushCampaign({
        title: `${slot.emoji} ${slot.titulo}`,
        body: slot.desc,
        url: slot.rota,
        emoji: slot.emoji,
        audience: { all: true, target: 'all', include_admins: true },
        tipo: slot.tag.toLowerCase(),
        automationKey: `manual-slot-${slot.hora.replace(':', 'h')}`,
        data: { category: slot.tag.toLowerCase(), horaSlot: slot.hora },
      });
      toast.success(`Notificação das ${slot.hora} disparada com sucesso!`, { id: `disp_slot_${slot.hora}` });
      void loadCampaigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha ao disparar: ${msg}`, { id: `disp_slot_${slot.hora}` });
    } finally {
      setDisparandoSlotHora(null);
    }
  };

  const handleTestarSlotNoAparelho = async (slot: GradeSlot) => {
    haptic.impact('medium');
    setTestandoSlotHora(slot.hora);
    toast.loading(`Testando push das ${slot.hora} no seu aparelho...`, { id: `test_slot_${slot.hora}` });
    try {
      const tituloFinal = `${slot.emoji} [Teste] ${slot.titulo}`;
      void dispatchPushCampaign({
        title: tituloFinal,
        body: slot.desc,
        url: slot.rota,
        emoji: slot.emoji,
        audience: { target: 'admins_only', include_admins: true },
        tipo: slot.tag.toLowerCase(),
        data: { category: slot.tag.toLowerCase(), slotHora: slot.hora },
        adminTestOnly: true,
      }).catch(() => {});

      await dispararNotificacaoLocalTeste({
        regra: {
          id: `slot_teste_${slot.hora}`,
          modulo: slot.modulo,
          nome: slot.titulo,
          descricao: slot.desc,
          ativo: true,
          tituloTemplate: tituloFinal,
          subtituloTemplate: slot.desc,
          textoBotaoAcao: 'Abrir agora',
          rotaPadrao: slot.rota,
          publicoAlvo: 'todos',
          gatilhoHorasInatividade: 0,
          mostrarBarraProgresso: false,
          progressoExemplo: 0,
          exemploTitulo: tituloFinal,
          exemploSubtitulo: slot.desc,
          canalAndroid: 'lembrete_estudo',
        },
        delaySegundos: 0,
      });

      toast.success(`Teste das ${slot.hora} entregue no seu aparelho!`, { id: `test_slot_${slot.hora}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha no teste: ${msg}`, { id: `test_slot_${slot.hora}` });
    } finally {
      setTestandoSlotHora(null);
    }
  };

  const handleAbrirEditarSlot = (slot: GradeSlot) => {
    haptic.selection();
    setSlotParaEditar(slot);
    setEditTitulo(slot.titulo);
    setEditDesc(slot.desc);
    setEditRota(slot.rota);
    setEditEmoji(slot.emoji);
  };

  const handleSalvarEDispararEditado = async (dispararAgora: boolean) => {
    if (!slotParaEditar) return;
    if (!editTitulo.trim() || !editDesc.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }
    setSalvandoEdicao(true);
    try {
      const tituloFinal = `${editEmoji} ${editTitulo.trim()}`;
      let scheduledForIso: string | undefined;

      if (dispararAgora) {
        toast.loading('Disparando notificação editada para todos...', { id: 'disp_edit' });
      } else {
        const hoje = new Date();
        const [hh, mm] = slotParaEditar.hora.split(':').map(Number);
        const dataAlvo = new Date();
        dataAlvo.setHours(hh, mm, 0, 0);
        if (dataAlvo.getTime() <= hoje.getTime()) dataAlvo.setDate(dataAlvo.getDate() + 1);
        scheduledForIso = dataAlvo.toISOString();
      }

      await dispatchPushCampaign({
        title: tituloFinal,
        body: editDesc.trim(),
        url: editRota.trim() || slotParaEditar.rota,
        emoji: editEmoji,
        audience: { all: true, target: 'all', include_admins: true },
        tipo: slotParaEditar.tag.toLowerCase(),
        automationKey: `${dispararAgora ? 'manual-edit' : 'custom-slot'}-${slotParaEditar.hora.replace(':', 'h')}`,
        scheduledForIso,
      });

      if (dispararAgora) {
        toast.success('Notificação enviada com sucesso!', { id: 'disp_edit' });
      } else {
        toast.success(`Notificação agendada para ${slotParaEditar.hora}!`);
      }

      setSlotParaEditar(null);
      void loadCampaigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha: ${msg}`);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleTestOnAdminDevice = async () => {
    toast.info('Disparando push de teste para o celular do admin...');
    try {
      await dispatchPushCampaign({
        title: '🧪 Teste Direito Prime',
        body: 'Push de alta prioridade verificado. O aparelho admin está isolado e nenhum usuário comum recebeu este teste.',
        url: '/admin-push',
        audience: { target: 'admins_only', include_admins: true },
        tipo: 'teste',
        adminTestOnly: true,
      });
      toast.success('Teste entregue com sucesso!');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Erro: ${msg}`);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelPushCampaign(id);
      toast.success('Disparo cancelado');
      void loadCampaigns();
    } catch {
      toast.error('Erro ao cancelar disparo');
    }
  };

  const agendadosDoDia = useMemo(
    () => campaigns.filter((c) => c.status === 'scheduled' && c.next_run_at && getBrasiliaDateStr(c.next_run_at) === selectedDate),
    [campaigns, selectedDate],
  );

  const historicoDoDia = useMemo(
    () =>
      campaigns.filter((c) => {
        const isAgendado = c.status === 'scheduled' && c.next_run_at && getBrasiliaDateStr(c.next_run_at) === selectedDate;
        return getBrasiliaDateStr(c.next_run_at || c.created_at) === selectedDate && !isAgendado;
      }),
    [campaigns, selectedDate],
  );

  const stats = useMemo(() => {
    const all = [...agendadosDoDia, ...historicoDoDia];
    return {
      agendados: agendadosDoDia.length,
      enviados: all.reduce((acc, c) => acc + (c.sent_count || 0), 0),
      entregues: all.reduce((acc, c) => acc + (c.delivered_count || 0), 0),
      abertos: all.reduce((acc, c) => acc + (c.opened_count || 0), 0),
      falhas: all.reduce((acc, c) => acc + (c.failed_count || 0), 0),
    };
  }, [agendadosDoDia, historicoDoDia]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white pb-20 relative overflow-hidden font-sans">
      <ShapeGrid />
      <PageHeader
        title={<span className="font-bold tracking-wider text-base sm:text-lg uppercase">Gestor de Push</span>}
        subtitle="Notificações a cada 2 horas e alertas inteligentes"
        onBack={() => navigate('/admin-funcoes')}
        rightAction={
          <button
            onClick={() => navigate('/admin-notificacoes-locais')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-xs font-semibold text-sky-300 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Notificações</span> Locais
          </button>
        }
      />

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 relative z-10">
        {/* BARRA DE CONTROLE & ABAS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-1 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-md">
          <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
            {([
              { id: 'grade2h', label: 'Grade 2 Horas', icon: Clock },
              { id: 'dashboard', label: 'Linha do Tempo', icon: LayoutDashboard },
              { id: 'manual', label: 'Manual', icon: Send },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTab(id);
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                  tab === id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-1 sm:px-0 justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleTestOnAdminDevice}
              className="h-8 px-3 rounded-xl border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
              title="Testar entrega do push no aparelho admin"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
              <span>Testar Celular</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleRegenerate2HourSchedule}
              disabled={plannerLoading}
              className="h-8 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Reprogramar agenda de 10 pushes diários para os próximos 7 dias"
            >
              {plannerLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>Renovar 7 Dias</span>
            </Button>
          </div>
        </div>

        {/* ABA 1: GRADE 2 HORAS */}
        {tab === 'grade2h' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-zinc-400 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-medium text-zinc-200">10 disparos/dia</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-mono text-[11px]">Brasília (UTC-3)</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 text-[11px]">{scheduledCampaigns.length} agendados</span>
              </div>

              <div className="flex items-center gap-2">
                {nextScheduled && (
                  <div className="flex items-center gap-1.5 text-[11.5px] bg-zinc-900/60 border border-zinc-800 px-2 py-0.5 rounded-md">
                    <span className="text-zinc-500">Próximo:</span>
                    <span className="font-mono font-bold text-white">
                      {new Intl.DateTimeFormat('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(nextScheduled.next_run_at!))}
                    </span>
                    <span className="font-semibold text-emerald-400">
                      ({getNextRunInfo(nextScheduled.next_run_at, nowMs)?.label})
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    void loadCampaigns();
                  }}
                  disabled={loading}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
                  title="Atualizar lista de agendados"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GRADE_2_HORAS.map((slot) => {
                const status = slotStatusMap.get(slot.hora);
                const isNext = status?.isNextImmediate;

                return (
                  <div
                    key={slot.hora}
                    className={`p-3.5 rounded-2xl transition-all flex flex-col justify-between gap-2.5 ${
                      isNext
                        ? 'bg-red-950/20 border border-red-500/60 shadow-lg shadow-red-950/30'
                        : 'bg-zinc-900/35 border border-zinc-800/60 hover:border-zinc-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                          <span>{slot.emoji}</span>
                          <span>{slot.hora}</span>
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">{slot.titulo}</h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDispararSlotAgora(slot)}
                          disabled={disparandoSlotHora === slot.hora}
                          className="h-7 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10.5px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          title="Disparar push imediatamente"
                        >
                          {disparandoSlotHora === slot.hora ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Disparar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTestarSlotNoAparelho(slot)}
                          disabled={testandoSlotHora === slot.hora}
                          className="h-7 w-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-white/5 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                          title="Testar no celular"
                        >
                          {testandoSlotHora === slot.hora ? (
                            <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAbrirEditarSlot(slot)}
                          className="h-7 w-7 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Editar slot"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11.5px] text-zinc-400 leading-relaxed line-clamp-2">{slot.desc}</p>

                    <div className="flex items-center justify-between text-[10.5px] pt-1.5 border-t border-white/[0.04] text-zinc-500 font-mono">
                      {isNext ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Próximo ({status.countdownLabel})
                        </span>
                      ) : status ? (
                        <span className="text-emerald-400 font-medium">Agendado ({status.countdownLabel})</span>
                      ) : (
                        <span className="text-zinc-400 flex items-center gap-1 font-sans">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400/80" /> Ativo
                        </span>
                      )}

                      <span className="text-zinc-500 hover:text-zinc-300 transition-colors">{slot.rota}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABAS LAZY: DASHBOARD & MANUAL */}
        <Suspense
          fallback={
            <div className="flex justify-center py-12 text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          }
        >
          {tab === 'dashboard' && (
            <PushDashboardTab
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              stats={stats}
              agendadosDoDia={agendadosDoDia}
              historicoDoDia={historicoDoDia}
              loading={loading}
              onRefresh={() => void loadCampaigns()}
              onRegenerate={() => void handleRegenerate2HourSchedule()}
              onCancel={(id) => void handleCancel(id)}
              onOpenEvents={setSelectedEventType}
            />
          )}

          {tab === 'manual' && (
            <PushManualFormTab
              targetAudience={targetAudience}
              onTargetAudienceChange={setTargetAudience}
              selectedCategory={selectedCategory}
              onSelectedCategoryChange={setSelectedCategory}
              title={title}
              onTitleChange={setTitle}
              body={body}
              onBodyChange={setBody}
              destinationUrl={destinationUrl}
              onDestinationUrlChange={setDestinationUrl}
              scheduledTime={scheduledTime}
              onScheduledTimeChange={setScheduledTime}
              submitting={submitting}
              onSubmit={handleCreatePush}
            />
          )}
        </Suspense>
      </div>

      {/* SHEET DE EDIÇÃO RÁPIDA DE SLOT */}
      <Sheet open={Boolean(slotParaEditar)} onOpenChange={(open) => !open && setSlotParaEditar(null)}>
        <SheetContent side="right" className="bg-[#121214] border-white/10 text-white w-full sm:max-w-md p-6 space-y-5">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-white text-base font-bold flex items-center gap-2">
              <span className="text-xl">{editEmoji}</span>
              <span>Editar Notificação das {slotParaEditar?.hora}</span>
            </SheetTitle>
            <p className="text-xs text-zinc-400">
              Personalize o texto, link e dispare agora ou agende para este horário.
            </p>
          </SheetHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Título da Notificação
              </label>
              <div className="flex gap-2">
                <Input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="w-14 bg-zinc-900 border-white/10 text-center text-lg rounded-xl"
                  title="Emoji"
                />
                <Input
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  placeholder="Ex: Hora da Leitura"
                  className="flex-1 bg-zinc-900 border-white/10 text-xs text-white rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Mensagem (Corpo do Push)
              </label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Mensagem do push. Use {nome} para personalizar."
                rows={3}
                className="bg-zinc-900 border-white/10 text-xs text-white rounded-xl resize-none"
              />
              <span className="text-[10px] text-zinc-500">
                Dica: use &#123;nome&#125; para citar o primeiro nome do estudante automaticamente.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Link de Destino (Rota)
              </label>
              <Input
                value={editRota}
                onChange={(e) => setEditRota(e.target.value)}
                placeholder="Ex: /radar-360, /audioaulas"
                className="bg-zinc-900 border-white/10 text-xs text-white font-mono rounded-xl"
              />
            </div>

            <div className="pt-4 space-y-2">
              <Button
                type="button"
                onClick={() => handleSalvarEDispararEditado(true)}
                disabled={salvandoEdicao}
                className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {salvandoEdicao ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Disparar Esta Mensagem Agora para Todos</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSalvarEDispararEditado(false)}
                disabled={salvandoEdicao}
                className="w-full h-10 rounded-xl bg-zinc-900/80 border-white/10 text-zinc-200 hover:text-white text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Salvar Agendamento para às {slotParaEditar?.hora}</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {selectedEventType && (
        <Suspense fallback={null}>
          <PushEventsModal
            date={selectedDate}
            type={selectedEventType}
            campaigns={historicoDoDia}
            onClose={() => setSelectedEventType(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
